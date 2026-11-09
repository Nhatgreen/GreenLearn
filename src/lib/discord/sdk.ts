import { applyDiscordUrlMappings } from './urlMappings';

export interface DiscordAuthResult {
  sdk: any;
  user: {
    id: string;
    username: string;
    avatar: string | null;
  };
  channelId: string | null;
  guildId: string | null;
  instanceId: string | null;
  code: string;
}

let discordSdkInstance: any = null;

export async function getDiscordSdk(): Promise<any> {
  if (discordSdkInstance) return discordSdkInstance;

  applyDiscordUrlMappings();

  const { DiscordSDK } = await import('@discord/embedded-app-sdk');
  const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || '1348000000000000000';
  discordSdkInstance = new DiscordSDK(clientId);
  await discordSdkInstance.ready();
  return discordSdkInstance;
}

export async function initDiscord(): Promise<DiscordAuthResult> {
  const sdk = await getDiscordSdk();
  const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || '1348000000000000000';

  const { code } = await sdk.commands.authorize({
    client_id: clientId,
    response_type: 'code',
    state: '',
    prompt: 'none',
    scope: ['identify', 'guilds.members.read'],
  });

  const channelId = sdk.channelId ?? null;
  const guildId = sdk.guildId ?? null;
  const instanceId = sdk.instanceId ?? null;

  let user = {
    id: '',
    username: 'Discord Member',
    avatar: null as string | null,
  };

  try {
    // Attempt to get user from sdk or authenticate
    if (sdk.currentUser) {
      user = {
        id: sdk.currentUser.id,
        username: sdk.currentUser.username,
        avatar: sdk.currentUser.avatar ?? null,
      };
    }
  } catch {}

  return {
    sdk,
    user,
    channelId,
    guildId,
    instanceId,
    code,
  };
}

let lastActivityUpdate = 0;

export async function setDiscordPresence(details: string, state?: string): Promise<void> {
  const now = Date.now();
  if (now - lastActivityUpdate < 5000) return; // 5-second throttle
  lastActivityUpdate = now;

  try {
    const sdk = await getDiscordSdk();
    if (sdk && sdk.commands?.setActivity) {
      await sdk.commands.setActivity({
        activity: {
          type: 0, // Playing / Studying
          details,
          state: state || 'Bàn học GreenLearn 2.5D',
          timestamps: {
            start: Math.floor(now / 1000),
          },
        },
      });
    }
  } catch (e) {
    // Ignore presence errors gracefully
  }
}

