import { describe, it, expect } from 'vitest';
import { isDiscordActivity } from './detect';

describe('isDiscordActivity', () => {
  it('returns true when frame_id is present in query string', () => {
    expect(isDiscordActivity('?frame_id=123&instance_id=456')).toBe(true);
    expect(isDiscordActivity('frame_id=test')).toBe(true);
  });

  it('returns false when frame_id is not present', () => {
    expect(isDiscordActivity('?instance_id=456&other=1')).toBe(false);
    expect(isDiscordActivity('')).toBe(false);
    expect(isDiscordActivity('?')).toBe(false);
  });
});
