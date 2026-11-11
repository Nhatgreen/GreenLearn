'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { RecentBuddy, SocialFriendService, DeskInviteNotification } from '@/services/SocialFriendService';
import { useAuth } from './AuthContext';
import { useStudySpace } from './StudySpaceContext';
import { HostApprovalModal } from '@/components/social/HostApprovalModal';
import { PendingApprovalModal } from '@/components/social/PendingApprovalModal';

export interface RoomJoinRequest {
  requestId: string;
  roomId: string;
  spaceName?: string;
  fromId: string;
  fromName: string;
  fromAvatarColor?: string;
  toHostId?: string;
  toHostName?: string;
  createdAt: number;
}

export interface RoomJoinResponse {
  requestId: string;
  roomId: string;
  approved: boolean;
  reason?: string;
  permission?: 'view_only' | 'edit';
  hostName?: string;
  fromHostId: string;
  toRequesterId: string;
  createdAt: number;
}

export interface MyPendingJoinRequest {
  requestId: string;
  roomId: string;
  hostName: string;
  status: 'pending' | 'approved' | 'rejected' | 'timeout';
  permission?: 'view_only' | 'edit';
  reason?: string;
}

export interface SocialPresenceContextType {
  currentUser: { id: string; name: string; avatarColor: string };
  buddies: RecentBuddy[];
  friends: RecentBuddy[];
  onlineCount: number;
  inDeskCount: number;
  incomingInvite: DeskInviteNotification | null;
  incomingJoinRequest: RoomJoinRequest | null;
  myPendingJoinRequest: MyPendingJoinRequest | null;
  isSocialConnected: boolean;
  sendDeskInvite: (target: string | RecentBuddy, targetRoomId?: string) => { ok: boolean; msg: string };
  requestJoinRoom: (roomId: string, hostBuddy: RecentBuddy) => void;
  cancelJoinRequest: () => void;
  approveJoinRequest: (request: RoomJoinRequest, permission?: 'view_only' | 'edit') => void;
  rejectJoinRequest: (request: RoomJoinRequest, reason?: string) => void;
  addFriend: (nameOrEmail: string) => { ok: boolean; msg: string; friend?: RecentBuddy };
  removeBuddy: (buddyId: string) => void;
  removeFriend: (buddyId: string) => void;
  declineInvite: () => void;
}

const SocialPresenceContext = createContext<SocialPresenceContextType | null>(null);

export function SocialPresenceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { activeSpace, multiplayerRoomId, joinMultiplayerRoom } = useStudySpace();
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState(() => SocialFriendService.getCurrentUser(user?.email));
  const [buddies, setBuddies] = useState<RecentBuddy[]>(() => SocialFriendService.getRecentBuddies());
  const [incomingInvite, setIncomingInvite] = useState<DeskInviteNotification | null>(null);
  const [incomingJoinRequest, setIncomingJoinRequest] = useState<RoomJoinRequest | null>(null);
  const [myPendingJoinRequest, setMyPendingJoinRequest] = useState<MyPendingJoinRequest | null>(null);
  const [isSocialConnected, setIsSocialConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const activeRoomId = multiplayerRoomId || activeSpace?.id || null;
  const currentSpaceName = activeSpace?.name || 'Bàn học';

  // Cập nhật thông tin user khi auth thay đổi
  useEffect(() => {
    const u = SocialFriendService.getCurrentUser(user?.email);
    setCurrentUser(u);
  }, [user?.email]);

  // Kết nối Supabase Realtime kênh vitudy-social duy nhất cho toàn ứng dụng
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
        currentSpaceName?: string;
        status?: string;
      }>();

      const onlinePeers: Array<{ id: string; name?: string; currentRoom?: string; currentSpaceName?: string }> = [];
      Object.keys(state).forEach(key => {
        if (key !== currentUser.id) {
          const uState = state[key]?.[0];
          if (uState) {
            onlinePeers.push({
              id: key,
              name: uState.name,
              currentRoom: uState.currentRoom,
              currentSpaceName: uState.currentSpaceName
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

      const isForMe = 
        (data.toId && data.toId === currentUser.id) || 
        (data.toName && currentUser.name && data.toName.toLowerCase() === currentUser.name.toLowerCase()) ||
        (data.toName && user?.email && data.toName.toLowerCase() === user.email.toLowerCase()) ||
        (data.toEmail && user?.email && data.toEmail.toLowerCase() === user.email.toLowerCase());

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

    // 3. Nhận yêu cầu xin vào phòng (ROOM_JOIN_REQUEST)
    channel.on('broadcast', { event: 'room_join_request' }, (payload) => {
      const data = payload.payload as RoomJoinRequest;
      if (!data) return;

      const isForMe =
        (data.toHostId && data.toHostId === currentUser.id) ||
        (data.toHostName && currentUser.name && data.toHostName.toLowerCase() === currentUser.name.toLowerCase()) ||
        (activeRoomId && data.roomId === activeRoomId);

      if (isForMe && data.fromId !== currentUser.id) {
        setIncomingJoinRequest(data);
      }
    });

    // 4. Nhận phản hồi phê duyệt từ chủ phòng (ROOM_JOIN_RESPONSE)
    channel.on('broadcast', { event: 'room_join_response' }, (payload) => {
      const data = payload.payload as RoomJoinResponse;
      if (!data) return;

      if (data.toRequesterId === currentUser.id) {
        setMyPendingJoinRequest(prev => {
          if (!prev || prev.requestId !== data.requestId) return prev;
          if (data.approved) {
            return {
              ...prev,
              status: 'approved',
              permission: data.permission || 'edit'
            };
          } else {
            return {
              ...prev,
              status: 'rejected',
              reason: data.reason || 'Chủ phòng hiện đang bận hoặc đã từ chối yêu cầu tham gia.'
            };
          }
        });
      }
    });

    // 5. Subscribe & Track Presence
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setIsSocialConnected(true);
        channel.track({
          id: currentUser.id,
          name: currentUser.name,
          avatarColor: currentUser.avatarColor,
          currentRoom: activeRoomId,
          currentSpaceName: currentSpaceName,
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

  // Xử lý khi chủ phòng đã phê duyệt yêu cầu vào phòng
  useEffect(() => {
    if (myPendingJoinRequest?.status === 'approved') {
      const roomId = myPendingJoinRequest.roomId;
      const perm = myPendingJoinRequest.permission || 'edit';
      const timer = setTimeout(() => {
        setMyPendingJoinRequest(null);
        if (joinMultiplayerRoom) {
          joinMultiplayerRoom(roomId, perm);
        }
        router.push(`/?room=${encodeURIComponent(roomId)}&perm=${perm}`);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [myPendingJoinRequest, joinMultiplayerRoom, router]);

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

  // Xin phép chủ phòng vào học cùng (Host Approval Request)
  const requestJoinRoom = useCallback((roomId: string, hostBuddy: RecentBuddy) => {
    if (!roomId) return;
    const reqId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setMyPendingJoinRequest({
      requestId: reqId,
      roomId,
      hostName: hostBuddy.name,
      status: 'pending'
    });

    if (channelRef.current && isSocialConnected) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'room_join_request',
        payload: {
          requestId: reqId,
          roomId,
          spaceName: hostBuddy.currentRoom,
          fromId: currentUser.id,
          fromName: currentUser.name,
          fromAvatarColor: currentUser.avatarColor,
          toHostId: hostBuddy.id,
          toHostName: hostBuddy.name,
          createdAt: Date.now()
        } as RoomJoinRequest
      });
    }

    // Sau 45s nếu không có phản hồi -> timeout
    setTimeout(() => {
      setMyPendingJoinRequest(prev => {
        if (prev && prev.requestId === reqId && prev.status === 'pending') {
          return { ...prev, status: 'timeout' };
        }
        return prev;
      });
    }, 45000);
  }, [currentUser, isSocialConnected]);

  // Hủy hoặc đóng yêu cầu xin vào phòng
  const cancelJoinRequest = useCallback(() => {
    setMyPendingJoinRequest(null);
  }, []);

  // Chủ phòng đồng ý cho vào
  const approveJoinRequest = useCallback((request: RoomJoinRequest, permission: 'view_only' | 'edit' = 'edit') => {
    if (channelRef.current && isSocialConnected) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'room_join_response',
        payload: {
          requestId: request.requestId,
          roomId: request.roomId,
          approved: true,
          permission,
          hostName: currentUser.name,
          fromHostId: currentUser.id,
          toRequesterId: request.fromId,
          createdAt: Date.now()
        } as RoomJoinResponse
      });
    }
    setIncomingJoinRequest(null);
  }, [currentUser, isSocialConnected]);

  // Chủ phòng từ chối
  const rejectJoinRequest = useCallback((request: RoomJoinRequest, reason?: string) => {
    if (channelRef.current && isSocialConnected) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'room_join_response',
        payload: {
          requestId: request.requestId,
          roomId: request.roomId,
          approved: false,
          reason: reason || 'Chủ phòng hiện đang bận hoặc đã từ chối yêu cầu tham gia.',
          hostName: currentUser.name,
          fromHostId: currentUser.id,
          toRequesterId: request.fromId,
          createdAt: Date.now()
        } as RoomJoinResponse
      });
    }
    setIncomingJoinRequest(null);
  }, [currentUser, isSocialConnected]);

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

  return (
    <SocialPresenceContext.Provider
      value={{
        currentUser,
        buddies,
        friends: buddies,
        onlineCount,
        inDeskCount,
        incomingInvite,
        incomingJoinRequest,
        myPendingJoinRequest,
        isSocialConnected,
        sendDeskInvite,
        requestJoinRoom,
        cancelJoinRequest,
        approveJoinRequest,
        rejectJoinRequest,
        addFriend,
        removeBuddy,
        removeFriend: removeBuddy,
        declineInvite
      }}
    >
      {children}

      {/* MODAL 1: Chủ phòng phê duyệt khi có bạn học xin vào bàn học */}
      <HostApprovalModal
        request={incomingJoinRequest}
        onApprove={approveJoinRequest}
        onReject={rejectJoinRequest}
      />

      {/* MODAL 2: Bạn học đang chờ chủ phòng phê duyệt */}
      <PendingApprovalModal
        pendingRequest={myPendingJoinRequest}
        onCancel={cancelJoinRequest}
      />
    </SocialPresenceContext.Provider>
  );
}

export function useSocialPresenceContext() {
  const ctx = useContext(SocialPresenceContext);
  return ctx;
}
