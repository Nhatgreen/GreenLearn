import { isDiscordActivity } from './detect';

let isPatched = false;

export function applyDiscordUrlMappings(): void {
  if (isPatched) return;
  if (typeof window === 'undefined') return;
  if (!isDiscordActivity()) return;

  try {
    // Dynamic require or import to keep out of server/non-discord bundles
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { patchUrlMappings } = require('@discord/embedded-app-sdk');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    if (supabaseUrl) {
      try {
        const url = new URL(supabaseUrl);
        const host = url.host; // e.g. "xyzcompany.supabase.co"

        patchUrlMappings([
          {
            prefix: '/supabase',
            target: host,
          },
          {
            prefix: '/discord-cdn',
            target: 'cdn.discordapp.com',
          },
        ]);
        isPatched = true;
      } catch (err) {
        console.warn('[Discord URL Mapping] Invalid NEXT_PUBLIC_SUPABASE_URL:', err);
      }
    }
  } catch (e) {
    console.warn('[Discord URL Mapping] Failed to patchUrlMappings:', e);
  }
}
