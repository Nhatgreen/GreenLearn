import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { authenticateUser, getServiceRoleClient } from '../_shared/auth.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { user, error: authError } = await authenticateUser(req);
    if (!user || authError) {
      return new Response(
        JSON.stringify({ error: 'unauthorized', message: 'Yêu cầu không hợp lệ.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = getServiceRoleClient();
    const userId = user.id;

    // 1. Clean up user storage assets if any
    try {
      const { data: avatarFiles } = await supabaseAdmin.storage.from('avatars').list(userId);
      if (avatarFiles && avatarFiles.length > 0) {
        await supabaseAdmin.storage.from('avatars').remove(avatarFiles.map(f => `${userId}/${f.name}`));
      }

      const { data: docFiles } = await supabaseAdmin.storage.from('documents').list(userId);
      if (docFiles && docFiles.length > 0) {
        await supabaseAdmin.storage.from('documents').remove(docFiles.map(f => `${userId}/${f.name}`));
      }
    } catch (storageErr) {
      console.warn('Storage cleanup warning:', storageErr);
    }

    // 2. Delete user account via Admin API (Triggers ON DELETE CASCADE in PostgreSQL)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteError) {
      throw deleteError;
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Tài khoản đã được xoá vĩnh viễn.' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: 'delete_failed', message: err.message || 'Lỗi khi xoá tài khoản.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
