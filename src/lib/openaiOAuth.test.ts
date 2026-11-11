import { describe, it, expect, beforeEach } from 'vitest';
import {
  OPENAI_OAUTH_CLIENT_ID,
  OPENAI_OAUTH_REDIRECT_URI,
  generatePkcePair,
  buildOpenAiAuthorizeUrl,
  parseOpenAiCallbackInput,
  extractOpenAiJwtClaims,
  saveOpenAiOAuthSession,
  getOpenAiOAuthSession,
  clearOpenAiOAuthSession,
  isOpenAiSessionExpired,
  savePendingPkce,
  getPendingPkce,
} from './openaiOAuth';

function createFakeJwt(payloadObj: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify(payloadObj)).toString('base64url');
  return `${header}.${payload}.fakesignature123`;
}

describe('openaiOAuth', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('generates valid S256 PKCE verifier, challenge and state', async () => {
    const { codeVerifier, codeChallenge, state } = await generatePkcePair();
    expect(codeVerifier.length).toBeGreaterThanOrEqual(43);
    expect(codeChallenge.length).toBeGreaterThanOrEqual(43);
    expect(state.length).toBeGreaterThanOrEqual(16);
    // Base64URL should not contain +, /, or =
    expect(codeVerifier).not.toMatch(/[+/=]/);
    expect(codeChallenge).not.toMatch(/[+/=]/);
    expect(state).not.toMatch(/[+/=]/);
  });

  it('builds exact OpenAI Codex CLI authorize URL', () => {
    const urlStr = buildOpenAiAuthorizeUrl('challenge_xyz', 'state_123');
    const url = new URL(urlStr);
    expect(url.origin + url.pathname).toBe('https://auth.openai.com/oauth/authorize');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('client_id')).toBe(OPENAI_OAUTH_CLIENT_ID);
    expect(url.searchParams.get('redirect_uri')).toBe(OPENAI_OAUTH_REDIRECT_URI);
    expect(url.searchParams.get('scope')).toBe('openid profile email offline_access');
    expect(url.searchParams.get('code_challenge')).toBe('challenge_xyz');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('state')).toBe('state_123');
    expect(url.searchParams.get('originator')).toBe('codex_cli_rs');
    expect(url.searchParams.get('codex_cli_simplified_flow')).toBe('true');
  });

  it('parses full localhost callback URL', () => {
    const parsed = parseOpenAiCallbackInput(
      'http://localhost:1455/auth/callback?code=ac_test_98765&state=st_abc123'
    );
    expect(parsed).toEqual({
      kind: 'code',
      code: 'ac_test_98765',
      state: 'st_abc123',
    });
  });

  it('parses query string callback', () => {
    const parsed = parseOpenAiCallbackInput('?code=ac_only_query&state=st_99');
    expect(parsed).toEqual({
      kind: 'code',
      code: 'ac_only_query',
      state: 'st_99',
    });
  });

  it('parses ViTai auth.json object format (both nested tokens and flat)', () => {
    const jwt = createFakeJwt({
      exp: Math.floor(Date.now() / 1000) + 3600,
      'https://api.openai.com/auth': { chatgpt_account_id: 'acc_vitai_01', chatgpt_plan_type: 'plus' },
      'https://api.openai.com/profile': { email: 'vit@vitudy.edu.vn' },
    });

    const vitaiJson = JSON.stringify({
      tokens: {
        access_token: jwt,
        refresh_token: 'rt_vitai_secret',
        account_id: 'acc_vitai_01',
      },
    });

    const parsed = parseOpenAiCallbackInput(vitaiJson);
    expect(parsed.kind).toBe('session');
    if (parsed.kind === 'session') {
      expect(parsed.accessToken).toBe(jwt);
      expect(parsed.refreshToken).toBe('rt_vitai_secret');
      expect(parsed.accountId).toBe('acc_vitai_01');
    }
  });

  it('parses raw JWT access token and extracts claims accurately', () => {
    const expSec = Math.floor(Date.now() / 1000) + 7200;
    const jwt = createFakeJwt({
      exp: expSec,
      'https://api.openai.com/auth': {
        chatgpt_account_id: 'org-account-999',
        chatgpt_plan_type: 'pro',
      },
      'https://api.openai.com/profile': {
        email: 'scholar@vitudy.vn',
      },
    });

    const parsed = parseOpenAiCallbackInput(jwt);
    expect(parsed).toEqual({
      kind: 'jwt',
      accessToken: jwt,
    });

    const claims = extractOpenAiJwtClaims(jwt);
    expect(claims).toEqual({
      accountId: 'org-account-999',
      planType: 'pro',
      email: 'scholar@vitudy.vn',
      expiresAt: expSec * 1000,
    });
  });

  it('parses raw authorization code', () => {
    const parsed = parseOpenAiCallbackInput('ac_raw_code_token_555');
    expect(parsed).toEqual({
      kind: 'code',
      code: 'ac_raw_code_token_555',
      state: undefined,
    });
  });

  it('saves, loads, and checks expiration of OpenAiOAuthSession', () => {
    const futureJwt = createFakeJwt({
      exp: Math.floor(Date.now() / 1000) + 3600,
      'https://api.openai.com/auth': { chatgpt_account_id: 'acc_1' },
    });

    saveOpenAiOAuthSession({
      accessToken: futureJwt,
      refreshToken: 'rt_1',
      updatedAt: Date.now(),
    });

    const loaded = getOpenAiOAuthSession();
    expect(loaded).not.toBeNull();
    expect(loaded?.accountId).toBe('acc_1');
    expect(loaded?.refreshToken).toBe('rt_1');
    expect(isOpenAiSessionExpired(loaded!)).toBe(false);

    // Expired token check
    const expiredSession = {
      ...loaded!,
      expiresAt: Date.now() - 1000,
    };
    expect(isOpenAiSessionExpired(expiredSession)).toBe(true);

    clearOpenAiOAuthSession();
    expect(getOpenAiOAuthSession()).toBeNull();
  });

  it('persists and retrieves pending PKCE verifier', () => {
    savePendingPkce({ codeVerifier: 'v_123', state: 's_456' });
    const pending = getPendingPkce();
    expect(pending?.codeVerifier).toBe('v_123');
    expect(pending?.state).toBe('s_456');
  });
});
