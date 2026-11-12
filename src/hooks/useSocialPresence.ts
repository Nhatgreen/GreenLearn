'use client';

import { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { getSupabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { RecentBuddy, SocialFriendService, DeskInviteNotification } from '@/services/SocialFriendService';
import { useAuth } from './useAuth';
import { useSocialPresenceContext } from '@/context/SocialPresenceContext';

export function useSocialPresence(activeRoomId: string | null = null, currentSpaceName: string = 'Bàn học') {
  const context = useSocialPresenceContext();
  if (context) {
    return context;
  }

  // Fallback độc lập khi component chạy ngoài SocialPresenceProvider (ví dụ trong unit tests)
  const { user, profile } = useAuth();
  const [currentUser, setCurrentUser] = useState(() => SocialFriendService.getCurrentUser(user?.email, profile?.display_name));
  const [buddies, setBuddies] = useState<RecentBuddy[]>(() => SocialFriendService.getRecentBuddies());
  const [incomingInvite, setIncomingInvite] = useState<DeskInviteNotification | null>(null);
  const [isSocialConnected, setIsSocialConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Cập nhật thông tin user khi auth thay đổi
  useEffect(() => {
    const u = SocialFriendService.getCurrentUser(user?.email, profile?.display_name);
    setCurrentUser(u);
  }, [user?.email, profile?.display_name]);

  // Kết nối Supabase Realtime kênh vitudy-social
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    const channel = supabase.channel('vitudy-social', {
      config: {
        presence: { key: currentUser.id },
        broadcast: { ack: false }
      }
    });

    channelRef.current = channel;

    // 1. Đồng bộ presence bạn bè online
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<{
        id?: string;
        name?: string;
        avatarColor?: string;
        currentRoom?: string;
        status?: string;
      }>();

      const onlinePeers: Array<{ id: string; name?: string; currentRoom?: string }> = [];
      Object.keys(state).forEach(key => {
        if (key !== currentUser.id) {
          const uState = state[key]?.[0];
          if (uState) {
            onlinePeers.push({
              id: key,
              name: uState.name,
              currentRoom: uState.currentRoom
            });
          }
        }
      });

      const updated = SocialFriendService.syncPresenceState(onlinePeers);
      setBuddies(updated);
    });

    // 2. Nhận lời mời học chung (DESK_INVITE)
    channel.on('broadcast', { event: 'desk_invite' }, (payload) => {
      const data = payload.payload as {
        toName?: string;
        toEmail?: string;
        toId?: string;
        fromId: string;
        fromName: string;
        fromAvatarColor?: string;
        roomId: string;
        spaceName?: string;
        createdAt?: number;
      };

      if (!data) return;

      const isForMe = Boolean(
        (data.toId && (data.toId === currentUser.id || data.toId === 'all')) || 
        (data.toName && SocialFriendService.matchesNameOrEmail(data.toName, currentUser.name, user?.email)) ||
        (data.toEmail && SocialFriendService.matchesNameOrEmail(data.toEmail, currentUser.name, user?.email))
      );

      if (isForMe && data.fromId !== currentUser.id) {
        setIncomingInvite({
          id: `inv-${Date.now()}`,
          fromId: data.fromId,
          fromName: data.fromName || 'Bạn học',
          fromAvatarColor: data.fromAvatarColor || '#16A34A',
          roomId: data.roomId,
          spaceName: data.spaceName || 'Bàn học nhóm',
          createdAt: data.createdAt || Date.now()
        });
      }
    });

    // 3. Subscribe & Track Presence
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setIsSocialConnected(true);
        channel.track({
          id: currentUser.id,
          name: currentUser.name,
          avatarColor: currentUser.avatarColor,
          currentRoom: activeRoomId,
          status: activeRoomId ? 'in_desk' : 'online',
          joinedAt: Date.now()
        });
      } else {
        setIsSocialConnected(false);
      }
    });

    return () => {
      try {
        channel.untrack();
        channel.unsubscribe();
        supabase.removeChannel(channel);
      } catch (e) {}
      channelRef.current = null;
    };
  }, [currentUser.id, currentUser.name, currentUser.avatarColor, activeRoomId, user?.email]);

  // Gửi lời mời trực tiếp đến bạn học (bằng tên hoặc email hoặc đối tượng buddy)
  const sendDeskInvite = useCallback((target: string | RecentBuddy, targetRoomId?: string) => {
    const targetName = typeof target === 'string' ? target.trim() : target.name;
    const targetEmail = typeof target === 'string' ? (target.includes('@') ? target.trim() : undefined) : target.email;

    if (!targetName) {
      return { ok: false, msg: 'Vui lòng nhập tên hoặc email bạn học.' };
    }

    const rec = SocialFriendService.recordInvite(targetName);
    setBuddies(SocialFriendService.getRecentBuddies());

    const roomId = targetRoomId || activeRoomId || `space-${Date.now()}`;

    if (channelRef.current && isSocialConnected) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'desk_invite',
        payload: {
          toName: targetName,
          toEmail: targetEmail,
          fromId: currentUser.id,
          fromName: currentUser.name,
          fromAvatarColor: currentUser.avatarColor,
          roomId,
          spaceName: currentSpaceName,
          createdAt: Date.now()
        }
      });
    }

    return { 
      ok: true, 
      msg: `Đã phát lời mời học chung đến "${targetName}". ${isSocialConnected ? 'Đã gửi qua mạng trực tuyến!' : ''}`.trim()
    };
  }, [isSocialConnected, activeRoomId, currentUser, currentSpaceName]);

  // Thêm và lưu bạn bè mới (dấu +)
  const addFriend = useCallback((nameOrEmail: string) => {
    const res = SocialFriendService.addFriend(nameOrEmail);
    setBuddies(SocialFriendService.getRecentBuddies());
    return res;
  }, []);

  // Xóa bạn khỏi danh sách gần đây
  const removeBuddy = useCallback((buddyId: string) => {
    SocialFriendService.removeBuddy(buddyId);
    setBuddies(SocialFriendService.getRecentBuddies());
  }, []);

  // Từ chối / đóng lời mời học chung
  const declineInvite = useCallback(() => {
    setIncomingInvite(null);
  }, []);

  const onlineCount = buddies.filter(b => b.online).length;
  const inDeskCount = buddies.filter(b => b.online && b.currentRoom).length;

  return {
    currentUser,
    buddies,
    friends: buddies, // Tương thích ngược
    onlineCount,
    inDeskCount,
    incomingInvite,
    incomingJoinRequest: null,
    myPendingJoinRequest: null,
    isSocialConnected,
    sendDeskInvite,
    requestJoinRoom: () => {},
    cancelJoinRequest: () => {},
    approveJoinRequest: () => {},
    rejectJoinRequest: () => {},
    addFriend,
    removeBuddy,
    removeFriend: removeBuddy,
    declineInvite
  };
}
