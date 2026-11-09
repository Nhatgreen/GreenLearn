import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getServiceRoleClient } from '../_shared/auth.ts';

const EXPECTED_API_KEY = Deno.env.get('SEPAY_API_KEY') || 'KDF8FCOKEG3KPUF890MHNXJHG1PW0VPYWJU6NNBRODVGZKS6MOAZMLJCLO5SRG2S';

serve(async (req: Request) => {
  // 1. Only allow POST requests for webhook
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. Validate Sepay Apikey Authorization Header
  const authHeader = req.headers.get('Authorization') || '';
  const apiKey = authHeader.replace(/^Apikey\s+/i, '').trim();

  if (!apiKey || apiKey !== EXPECTED_API_KEY) {
    return new Response(JSON.stringify({ error: 'unauthorized', message: 'Invalid or missing Sepay API Key' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const payload = await req.json();
    const {
      id, // Sepay transaction ID (number/bigint)
      accountNumber,
      code,
      content = '',
      transferType,
      transferAmount,
    } = payload;

    // 3. Only process incoming money transfers
    if (transferType !== 'in') {
      return new Response(JSON.stringify({ success: true, message: 'Ignored non-incoming transfer' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 4. Extract Payment Code (e.g., VT7K2M9QXA)
    let paymentCode = code;
    if (!paymentCode && content) {
      const match = content.match(/VT[A-Z0-9]{8}/i);
      if (match) {
        paymentCode = match[0].toUpperCase();
      }
    }

    if (!paymentCode) {
      return new Response(JSON.stringify({ success: true, message: 'No VT code found in transaction' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 5. Call Postgres RPC apply_payment using service_role client
    const supabaseAdmin = getServiceRoleClient();
    const { data, error } = await supabaseAdmin.rpc('apply_payment', {
      p_sepay_id: id,
      p_code: paymentCode,
      p_amount: Math.round(Number(transferAmount) || 0),
      p_account: String(accountNumber || ''),
      p_payload: payload,
    });

    if (error) {
      console.error('Lỗi khi gọi RPC apply_payment:', error);
      return new Response(JSON.stringify({ error: 'db_error', details: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, result: data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('Lỗi phân tích payload Sepay Webhook:', err);
    return new Response(JSON.stringify({ error: 'invalid_payload', details: err.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
