import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

export async function authenticateUser(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'missing_authorization_header' };
  }

  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) {
    return { user: null, error: 'empty_token' };
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

  if (!supabaseUrl || !supabaseAnonKey) {
    return { user: null, error: 'supabase_env_missing' };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return { user: null, error: error?.message || 'invalid_token' };
  }

  return { user, error: null };
}

export function getServiceRoleClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
