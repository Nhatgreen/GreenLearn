import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { code } = await req.json();
    if (!code) {
      return new Response(JSON.stringify({ error: 'Missing code' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const clientId = Deno.env.get('DISCORD_CLIENT_ID') || '';
    const clientSecret = Deno.env.get('DISCORD_CLIENT_SECRET') || '';

    if (!clientId || !clientSecret) {
      return new Response(JSON.stringify({ error: 'Discord credentials not configured on server' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Đổi code lấy token từ Discord
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error('[discord-auth] Token exchange error:', errText);
      return new Response(JSON.stringify({ error: 'discord_auth_failed', details: errText }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 2. Lấy thông tin user từ Discord API
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      return new Response(JSON.stringify({ error: 'discord_get_user_failed' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const discordUser = await userResponse.json();
    const discordId = discordUser.id;

    // 3. Khởi tạo Supabase Admin Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    let targetUserId: string | null = null;
    let targetEmail: string = '';

    // 4. Tìm kiếm người dùng theo discord_id trong bảng profiles
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('discord_id', discordId)
      .maybeSingle();

    if (existingProfile) {
      targetUserId = existingProfile.id;
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
      if (userData?.user?.email) {
        targetEmail = userData.user.email;
      }
    } else {
      // Nếu chưa có profile gắn discord_id, kiểm tra xem có tài khoản email trùng (nếu email đã verified từ Discord)
      let matchedByEmailUser: any = null;
      if (discordUser.email && discordUser.verified) {
        const { data: usersList } = await supabaseAdmin.auth.admin.listUsers();
        matchedByEmailUser = usersList?.users?.find(
          (u) => u.email?.toLowerCase() === discordUser.email.toLowerCase()
        );
      }

      if (matchedByEmailUser) {
        targetUserId = matchedByEmailUser.id;
        targetEmail = matchedByEmailUser.email!;
        // Gắn discord_id vào profile cũ
        await supabaseAdmin
          .from('profiles')
          .update({ discord_id: discordId })
          .eq('id', targetUserId);
      } else {
        // Tạo tài khoản Supabase mới cho Discord user
        targetEmail = discordUser.email && discordUser.verified
          ? discordUser.email
          : `discord_${discordId}@users.vitudy.invalid`;

        const avatarUrl = discordUser.avatar
          ? `https://cdn.discordapp.com/avatars/${discordId}/${discordUser.avatar}.png`
          : null;

        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: targetEmail,
          email_confirm: true,
          user_metadata: {
            display_name: discordUser.global_name || discordUser.username,
            avatar_url: avatarUrl,
            discord_id: discordId,
          },
        });

        if (createError || !newUser?.user) {
          throw new Error(createError?.message || 'Không thể tạo user Supabase cho Discord');
        }

        targetUserId = newUser.user.id;

        // Cập nhật discord_id vào profiles
        await supabaseAdmin
          .from('profiles')
          .update({ 
            discord_id: discordId,
            display_name: discordUser.global_name || discordUser.username,
            avatar_url: avatarUrl
          })
          .eq('id', targetUserId);
      }
    }

    // 5. Sinh magic link token_hash để client Supabase verifyOtp đăng nhập trực tiếp
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: targetEmail,
    });

    if (linkError || !linkData?.properties?.hashed_token) {
      throw new Error(linkError?.message || 'Không thể sinh magiclink token_hash');
    }

    return new Response(
      JSON.stringify({
        token_hash: linkData.properties.hashed_token,
        email: targetEmail,
        discord_id: discordId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('[discord-auth] Exception:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Lỗi xử lý Discord Activity Auth' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
