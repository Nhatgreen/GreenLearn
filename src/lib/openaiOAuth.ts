import { ByokStore } from './byokStore';

export const OPENAI_OAUTH_CLIENT_ID = 'app_EMoamEEZ73f0CkXaXp7hrann';
export const OPENAI_OAUTH_REDIRECT_URI = 'http://localhost:1455/auth/callback';
export const OPENAI_AUTHORIZE_URL = 'https://auth.openai.com/oauth/authorize';
export const OPENAI_TOKEN_URL = 'https://auth.openai.com/oauth/token';

const PKCE_STORAGE_KEY = 'greenlearn_openai_pkce_pending';
const LEGACY_PKCE_STORAGE_KEY = 'vitudy_openai_pkce_pending';

export interface OpenAiOAuthSession {
  accessToken: string;
  refreshToken?: string;
  accountId?: string;
  email?: string;
  planType?: string;
  expiresAt?: number; // Epoch milliseconds
  updatedAt: number;
}

export interface PendingPkceState {
  codeVerifier: string;
  state: string;
  createdAt: number;
}

export type ParsedOpenAiInput =
  | { kind: 'code'; code: string; state?: string }
  | { kind: 'jwt'; accessToken: string }
  | { kind: 'session'; accessToken: string; refreshToken?: string; accountId?: string }
  | { kind: 'error'; message: string };

export function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 =
    typeof btoa === 'function'
      ? btoa(binary)
      : Buffer.from(bytes).toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (base64.length % 4)) % 4;
  const padded = base64 + '='.repeat(padLen);

  if (typeof atob === 'function') {
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  }
  return Buffer.from(padded, 'base64').toString('utf-8');
}

function getRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return bytes;
}

export async function generatePkcePair(): Promise<{
  codeVerifier: string;
  codeChallenge: string;
  state: string;
}> {
  const verifierBytes = getRandomBytes(48);
  const codeVerifier = base64UrlEncode(verifierBytes);

  const stateBytes = getRandomBytes(24);
  const state = base64UrlEncode(stateBytes);

  const encodedVerifier = new TextEncoder().encode(codeVerifier);
  const digestBuffer = await globalThis.crypto.subtle.digest('SHA-256', encodedVerifier);
  const codeChallenge = base64UrlEncode(new Uint8Array(digestBuffer));

  return { codeVerifier, codeChallenge, state };
}

export function buildOpenAiAuthorizeUrl(codeChallenge: string, state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: OPENAI_OAUTH_CLIENT_ID,
    redirect_uri: OPENAI_OAUTH_REDIRECT_URI,
    scope: 'openid profile email offline_access',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state,
    originator: 'codex_cli_rs',
    codex_cli_simplified_flow: 'true',
  });
  return `${OPENAI_AUTHORIZE_URL}?${params.toString()}`;
}

export function savePendingPkce(data: { codeVerifier: string; state: string }): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: PendingPkceState = {
      codeVerifier: data.codeVerifier,
      state: data.state,
      createdAt: Date.now(),
    };
    localStorage.setItem(PKCE_STORAGE_KEY, JSON.stringify(payload));
  } catch {}
}

export function getPendingPkce(): PendingPkceState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PKCE_STORAGE_KEY) || localStorage.getItem(LEGACY_PKCE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingPkceState;
    if (!parsed.codeVerifier) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingPkce(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(PKCE_STORAGE_KEY);
    localStorage.removeItem(LEGACY_PKCE_STORAGE_KEY);
  } catch {}
}

export async function startOpenAiPkceLogin(): Promise<{
  authorizeUrl: string;
  codeVerifier: string;
  state: string;
}> {
  const { codeVerifier, codeChallenge, state } = await generatePkcePair();
  savePendingPkce({ codeVerifier, state });
  const authorizeUrl = buildOpenAiAuthorizeUrl(codeChallenge, state);
  return { authorizeUrl, codeVerifier, state };
}

export function extractOpenAiJwtClaims(jwt: string): {
  accountId?: string;
  email?: string;
  planType?: string;
  expiresAt?: number;
} {
  try {
    const parts = jwt.trim().split('.');
    if (parts.length !== 3) return {};
    const payloadJson = base64UrlDecode(parts[1]);
    const payload = JSON.parse(payloadJson) as Record<string, any>;

    const authNamespace = payload['https://api.openai.com/auth'] || {};
    const profileNamespace = payload['https://api.openai.com/profile'] || {};

    const accountId =
      authNamespace.chatgpt_account_id ||
      authNamespace.user_id ||
      authNamespace.account_id ||
      payload.chatgpt_account_id ||
      payload.account_id ||
      payload.sub ||
      undefined;

    const planType =
      authNamespace.chatgpt_plan_type ||
      authNamespace.plan_type ||
      payload.chatgpt_plan_type ||
      undefined;

    const email =
      profileNamespace.email ||
      payload.email ||
      undefined;

    const expiresAt =
      typeof payload.exp === 'number' ? payload.exp * 1000 : undefined;

    return { accountId, email, planType, expiresAt };
  } catch {
    return {};
  }
}

export function parseOpenAiCallbackInput(rawInput: string): ParsedOpenAiInput {
  const trimmed = (rawInput || '').trim();
  if (!trimmed) {
    return { kind: 'error', message: 'Vui lòng dán đường dẫn Callback URL hoặc mã xác thực OpenAI.' };
  }

  // 1. Check if JSON (auth.json or OpenAiOAuthSession JSON)
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const obj = JSON.parse(trimmed);
      const tokensObj = obj.tokens || obj;
      const accessToken = tokensObj.access_token || tokensObj.accessToken;
      const refreshToken = tokensObj.refresh_token || tokensObj.refreshToken;
      const accountId = tokensObj.account_id || tokensObj.accountId;

      if (accessToken && typeof accessToken === 'string') {
        return {
          kind: 'session',
          accessToken: accessToken.trim(),
          refreshToken: typeof refreshToken === 'string' ? refreshToken.trim() : undefined,
          accountId: typeof accountId === 'string' ? accountId.trim() : undefined,
        };
      }
    } catch {
      return { kind: 'error', message: 'Định dạng JSON không hợp lệ.' };
    }
  }

  // 2. Check if URL or query string with ?code= or &code=
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('localhost:') ||
    trimmed.startsWith('?') ||
    trimmed.includes('code=') ||
    trimmed.includes('error=')
  ) {
    try {
      const normalizedUrl = trimmed.startsWith('http')
        ? trimmed
        : trimmed.startsWith('localhost:')
        ? `http://${trimmed}`
        : `http://localhost:1455/auth/callback${trimmed.startsWith('?') ? trimmed : '?' + trimmed}`;
      const url = new URL(normalizedUrl);
      const errParam = url.searchParams.get('error');
      const errDesc = url.searchParams.get('error_description');
      if (errParam) {
        return {
          kind: 'error',
          message: `OpenAI từ chối xác thực: ${errDesc || errParam}`,
        };
      }
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state') || undefined;
      if (code && code.trim()) {
        return {
          kind: 'code',
          code: code.trim(),
          state,
        };
      }
    } catch {
      // Fall through to raw check
    }
  }

  // 3. Check if raw 3-part JWT (eyJ...)
  const jwtParts = trimmed.split('.');
  if (trimmed.startsWith('eyJ') && jwtParts.length === 3) {
    return {
      kind: 'jwt',
      accessToken: trimmed,
    };
  }

  // 4. Otherwise treat as raw authorization code
  return {
    kind: 'code',
    code: trimmed,
    state: undefined,
  };
}

export function saveOpenAiOAuthSession(session: OpenAiOAuthSession): OpenAiOAuthSession {
  const claims = extractOpenAiJwtClaims(session.accessToken);
  const enriched: OpenAiOAuthSession = {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    accountId: session.accountId || claims.accountId,
    email: session.email || claims.email,
    planType: session.planType || claims.planType,
    expiresAt: session.expiresAt || claims.expiresAt,
    updatedAt: session.updatedAt || Date.now(),
  };
  ByokStore.set('chatgpt_oauth', JSON.stringify(enriched));
  return enriched;
}

export function getOpenAiOAuthSession(): OpenAiOAuthSession | null {
  const raw = ByokStore.get('chatgpt_oauth');
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed) as OpenAiOAuthSession;
      if (parsed && parsed.accessToken) {
        const claims = extractOpenAiJwtClaims(parsed.accessToken);
        return {
          ...parsed,
          accountId: parsed.accountId || claims.accountId,
          email: parsed.email || claims.email,
          planType: parsed.planType || claims.planType,
          expiresAt: parsed.expiresAt || claims.expiresAt,
        };
      }
    } catch {
      return null;
    }
  }

  // Backward compatibility if raw JWT was stored
  const claims = extractOpenAiJwtClaims(trimmed);
  return {
    accessToken: trimmed,
    accountId: claims.accountId,
    email: claims.email,
    planType: claims.planType,
    expiresAt: claims.expiresAt,
    updatedAt: Date.now(),
  };
}

export function clearOpenAiOAuthSession(): void {
  ByokStore.clear('chatgpt_oauth');
  clearPendingPkce();
}

export function isOpenAiSessionExpired(
  session: OpenAiOAuthSession,
  bufferMs = 5 * 60 * 1000
): boolean {
  if (!session.expiresAt) return false;
  return Date.now() + bufferMs >= session.expiresAt;
}
