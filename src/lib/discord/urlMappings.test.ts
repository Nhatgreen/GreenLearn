import { describe, it, expect, vi, beforeEach } from 'vitest';
import { applyDiscordUrlMappings } from './urlMappings';

vi.mock('./detect', () => ({
  isDiscordActivity: vi.fn(),
}));

vi.mock('@discord/embedded-app-sdk', () => ({
  patchUrlMappings: vi.fn(),
}));

describe('applyDiscordUrlMappings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does nothing when outside Discord', async () => {
    const { isDiscordActivity } = await import('./detect');
    const { patchUrlMappings } = await import('@discord/embedded-app-sdk');

    (isDiscordActivity as any).mockReturnValue(false);

    applyDiscordUrlMappings();

    expect(patchUrlMappings).not.toHaveBeenCalled();
  });
});
