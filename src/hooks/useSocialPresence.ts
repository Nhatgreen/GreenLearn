'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getSupabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { SocialFriend, SocialFriendService, DeskInviteNotification } from '@/services/SocialFriendService';
import { useAuth } from './useAuth';

export function useSocialPresence(activeRoomId: string | null = null, currentSpaceName: string = 'Bàn học') {
  const { user } = useAuth();
  const [currentUser, setCurrentUser] = useState(() => SocialFriendService.getCurrentUser(user?.email));
  const [friends, setFriends] = useState<SocialFriend[]>(() => SocialFriendService.getFriends());
  const [incomingInvite, setIncomingInvite] = useState<DeskInviteNotification | null>(null);
  const [isSocialConnected, setIsSocialConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Cập nhật thông tin user khi auth thay đổi
  useEffect(() => {
    const u = SocialFriendService.getCurrentUser(user?.email);
    setCurrentUser(u);
  }, [user?.email]);

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
      setFriends(updated);
    });

    // 2. Nhận lời mời học chung (DESK_INVITE)
    channel.on('broadcast', { event: 'desk_invite' }, (payload) => {
      const data = payload.payload as {
        toId: string;
        toName?: string;
        fromId: string;
        fromName: string;
        fromAvatarColor?: string;
        roomId: string;
        spaceName?: string;
        createdAt?: number;
      };

      if (!data) return;

      const isForMe = 
        data.toId === currentUser.id || 
        (data.toName && currentUser.name && data.toName.toLowerCase() === currentUser.name.toLowerCase());

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
  }, [currentUser.id, currentUser.name, currentUser.avatarColor, activeRoomId]);

  // Gửi lời mời học chung đến bạn bè
  const sendDeskInvite = useCallback((friend: SocialFriend, targetRoomId?: string) => {
    if (!channelRef.current || !isSocialConnected) {
      return { ok: false, msg: 'Chưa kết nối máy chủ để gửi lời mời.' };
    }

    const roomId = targetRoomId || activeRoomId || `space-${Date.now()}`;
    channelRef.current.send({
      type: 'broadcast',
      event: 'desk_invite',
      payload: {
        toId: friend.id,
        toName: friend.name,
        fromId: currentUser.id,
        fromName: currentUser.name,
        fromAvatarColor: currentUser.avatarColor,
        roomId,
        spaceName: currentSpaceName,
        createdAt: Date.now()
      }
    });

    return { ok: true, msg: `Đã gửi lời mời học chung đến "${friend.name}".` };
  }, [isSocialConnected, activeRoomId, currentUser, currentSpaceName]);

  // Thêm bạn mới
  const addFriend = useCallback((target: string) => {
    const res = SocialFriendService.addFriend(target);
    if (res.ok) {
      setFriends(SocialFriendService.getFriends());
    }
    return res;
  }, []);

  // Chấp nhận lời mời kết bạn
  const acceptFriendRequest = useCallback((friendId: string) => {
    const res = SocialFriendService.acceptFriend(friendId);
    if (res.ok) {
      setFriends(SocialFriendService.getFriends());
    }
    return res;
  }, []);

  // Xóa bạn
  const removeFriend = useCallback((friendId: string) => {
    const res = SocialFriendService.removeFriend(friendId);
    setFriends(SocialFriendService.getFriends());
    return res;
  }, []);

  // Từ chối / đóng lời mời học chung
  const declineInvite = useCallback(() => {
    setIncomingInvite(null);
  }, []);

  return {
    currentUser,
    friends,
    incomingInvite,
    isSocialConnected,
    sendDeskInvite,
    addFriend,
    acceptFriendRequest,
    removeFriend,
    declineInvite
  };
}
