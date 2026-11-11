import { describe, it, expect, beforeEach } from 'vitest';
import { SocialFriendService } from './SocialFriendService';

describe('SocialFriendService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with default friends if storage is empty', () => {
    const friends = SocialFriendService.getFriends();
    expect(friends.length).toBeGreaterThan(0);
    expect(friends[0].name).toContain('Hoàng Nam');
  });

  it('adds a new friend with outgoing status', () => {
    const res = SocialFriendService.addFriend('Lan Anh (Kinh tế)');
    expect(res.ok).toBe(true);
    expect(res.friend?.name).toBe('Lan Anh (Kinh tế)');
    expect(res.friend?.status).toBe('out');

    const friends = SocialFriendService.getFriends();
    expect(friends.some(f => f.name === 'Lan Anh (Kinh tế)')).toBe(true);
  });

  it('accepts incoming friend request', () => {
    // Add friend with status 'in'
    const friends = SocialFriendService.getFriends();
    friends.push({
      id: 'fr-incoming-1',
      name: 'Khánh Linh',
      avatarColor: '#16A34A',
      status: 'in'
    });
    SocialFriendService.saveFriends(friends);

    const res = SocialFriendService.acceptFriend('fr-incoming-1');
    expect(res.ok).toBe(true);

    const updated = SocialFriendService.getFriends();
    const accepted = updated.find(f => f.id === 'fr-incoming-1');
    expect(accepted?.status).toBe('ok');
  });

  it('removes a friend from list', () => {
    const friends = SocialFriendService.getFriends();
    const firstFriend = friends[0];
    const res = SocialFriendService.removeFriend(firstFriend.id);
    expect(res.ok).toBe(true);

    const updated = SocialFriendService.getFriends();
    expect(updated.some(f => f.id === firstFriend.id)).toBe(false);
  });

  it('updates online presence accurately', () => {
    const updated = SocialFriendService.syncPresenceState([
      { id: 'friend-demo-1', name: 'Hoàng Nam (CNTT)', currentRoom: 'room-123' }
    ]);
    const friend1 = updated.find(f => f.id === 'friend-demo-1');
    expect(friend1?.online).toBe(true);
    expect(friend1?.currentRoom).toBe('room-123');

    const friend3 = updated.find(f => f.id === 'friend-demo-3');
    expect(friend3?.online).toBe(false);
  });
});
