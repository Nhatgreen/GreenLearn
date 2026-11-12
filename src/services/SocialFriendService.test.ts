import { describe, it, expect, beforeEach } from 'vitest';
import { SocialFriendService } from './SocialFriendService';

describe('SocialFriendService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with default buddies if storage is empty', () => {
    const buddies = SocialFriendService.getRecentBuddies();
    expect(buddies.length).toBeGreaterThan(0);
    expect(buddies[0].name).toContain('Hoàng Nam');
  });

  it('records an invite and adds to recent buddies', () => {
    const res = SocialFriendService.recordInvite('Lan Anh (Kinh tế)');
    expect(res.ok).toBe(true);
    expect(res.buddy?.name).toBe('Lan Anh (Kinh tế)');

    const buddies = SocialFriendService.getRecentBuddies();
    expect(buddies.some(b => b.name === 'Lan Anh (Kinh tế)')).toBe(true);
  });

  it('removes a buddy from recent list', () => {
    const buddies = SocialFriendService.getRecentBuddies();
    const firstBuddy = buddies[0];
    SocialFriendService.removeBuddy(firstBuddy.id);

    const updated = SocialFriendService.getRecentBuddies();
    expect(updated.some(b => b.id === firstBuddy.id)).toBe(false);
  });

  it('updates online presence accurately', () => {
    const updated = SocialFriendService.syncPresenceState([
      { id: 'buddy-demo-1', name: 'Hoàng Nam (CNTT)', currentRoom: 'room-123' }
    ]);
    const buddy1 = updated.find(b => b.id === 'buddy-demo-1');
    expect(buddy1?.online).toBe(true);
    expect(buddy1?.currentRoom).toBe('room-123');

    const buddy3 = updated.find(b => b.id === 'buddy-demo-3');
    expect(buddy3?.online).toBe(false);
  });

  it('matches names flexibly with accents, case insensitivity and partial names', () => {
    expect(SocialFriendService.matchesNameOrEmail('Nhat', 'Nhật Nguyễn')).toBe(true);
    expect(SocialFriendService.matchesNameOrEmail('Nhật', 'Nhật Nguyễn')).toBe(true);
    expect(SocialFriendService.matchesNameOrEmail('Nhật Nguyễn', 'nhatnguyen')).toBe(true);
    expect(SocialFriendService.matchesNameOrEmail('nhatnguyen', 'Nhật Nguyễn')).toBe(true);
    expect(SocialFriendService.matchesNameOrEmail('hoangnam', undefined, 'hoangnam@greenlearn.vn')).toBe(true);
    expect(SocialFriendService.matchesNameOrEmail('Hoàng Nam', 'Hoàng Nam (CNTT)')).toBe(true);
    expect(SocialFriendService.matchesNameOrEmail('thutrang', 'Thu Trang (Sư phạm)')).toBe(true);
    expect(SocialFriendService.matchesNameOrEmail('khacnhau', 'Nguyen Van A')).toBe(false);
  });

  it('supports per-tab uid in sessionStorage and uses profile display name', () => {
    sessionStorage.clear();
    const user1 = SocialFriendService.getCurrentUser('nhat@gmail.com', 'Nhật Nguyễn');
    expect(user1.name).toBe('Nhật Nguyễn');
    expect(user1.id).toMatch(/^user-/);

    // Simulate second tab in another session
    sessionStorage.setItem('greenlearn_tab_uid', 'user-tab-2');
    const user2 = SocialFriendService.getCurrentUser('nhat@gmail.com', 'Nhật Nguyễn');
    expect(user2.id).toBe('user-tab-2');
  });
});
