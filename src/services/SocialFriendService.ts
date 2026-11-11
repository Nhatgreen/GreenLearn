/**
 * SocialFriendService.ts
 * Quản lý danh sách bạn bè, lời mời kết bạn và trạng thái kết nối
 * Tham khảo và kế thừa kiến trúc từ ViTrainer (js/net/social.js)
 */

export interface SocialFriend {
  id: string;
  name: string;
  email?: string;
  avatarColor: string;
  status: 'ok' | 'in' | 'out'; // 'ok': bạn bè, 'in': lời mời đến, 'out': lời mời đã gửi
  online?: boolean;
  currentRoom?: string;
  lastSeen?: number;
}

export interface DeskInviteNotification {
  id: string;
  fromId: string;
  fromName: string;
  fromAvatarColor: string;
  roomId: string;
  spaceName: string;
  createdAt: number;
}

const STORAGE_KEY = 'greenlearn_friends_list';
const STORAGE_NICK_KEY = 'greenlearn_nickname';

const PRESET_COLORS = [
  '#16A34A', // GreenLearn Green
  '#2563EB', // Blue
  '#D97706', // Amber
  '#7C3AED', // Violet
  '#0D9488', // Teal
  '#E11D48', // Rose
  '#4F46E5', // Indigo
  '#EA580C', // Orange
];

const DEFAULT_FRIENDS: SocialFriend[] = [
  {
    id: 'friend-demo-1',
    name: 'Hoàng Nam (CNTT)',
    email: 'hoangnam.cntt@vitrainer.edu.vn',
    avatarColor: '#2563EB',
    status: 'ok',
    online: true,
    lastSeen: Date.now()
  },
  {
    id: 'friend-demo-2',
    name: 'Thu Trang (Sư phạm)',
    email: 'thutrang.sp@vitrainer.edu.vn',
    avatarColor: '#7C3AED',
    status: 'ok',
    online: true,
    lastSeen: Date.now() - 60000
  },
  {
    id: 'friend-demo-3',
    name: 'Minh Đức (Toán Tin)',
    email: 'minhduc.math@vitrainer.edu.vn',
    avatarColor: '#D97706',
    status: 'ok',
    online: false,
    lastSeen: Date.now() - 3600000
  }
];

export class SocialFriendService {
  /** Lấy thông tin người dùng hiện tại */
  static getCurrentUser(userEmail?: string | null): { id: string; name: string; avatarColor: string } {
    let name = '';
    if (typeof window !== 'undefined') {
      name = localStorage.getItem(STORAGE_NICK_KEY) || localStorage.getItem('vitudy_nickname') || '';
    }
    if (!name && userEmail) {
      name = userEmail.split('@')[0];
    }
    if (!name) {
      name = 'Bạn học GreenLearn';
    }

    let uid = '';
    if (typeof window !== 'undefined') {
      uid = localStorage.getItem('greenlearn_user_uid') || '';
      if (!uid) {
        uid = `user-${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem('greenlearn_user_uid', uid);
      }
    } else {
      uid = 'user-guest';
    }

    // Chọn màu đại diện cố định theo uid
    let hash = 0;
    for (let i = 0; i < uid.length; i++) hash = (hash << 5) - hash + uid.charCodeAt(i);
    const colorIndex = Math.abs(hash) % PRESET_COLORS.length;
    const avatarColor = PRESET_COLORS[colorIndex];

    return { id: uid, name, avatarColor };
  }

  /** Cập nhật tên hiển thị / nickname */
  static setNickname(name: string): void {
    if (typeof window !== 'undefined') {
      const clean = name.trim();
      if (clean) {
        localStorage.setItem(STORAGE_NICK_KEY, clean);
      }
    }
  }

  /** Lấy danh sách bạn bè từ bộ nhớ */
  static getFriends(): SocialFriend[] {
    if (typeof window === 'undefined') return DEFAULT_FRIENDS;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    // Khởi tạo danh sách bạn bè mặc định
    this.saveFriends(DEFAULT_FRIENDS);
    return DEFAULT_FRIENDS;
  }

  /** Lưu danh sách bạn bè vào localStorage */
  static saveFriends(friends: SocialFriend[]): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(friends));
      } catch {
        // ignore
      }
    }
  }

  /** Gửi yêu cầu kết bạn bằng Tên hoặc Email */
  static addFriend(target: string): { ok: boolean; msg: string; friend?: SocialFriend } {
    const cleanTarget = target.trim();
    if (!cleanTarget || cleanTarget.length < 2) {
      return { ok: false, msg: 'Vui lòng nhập tên hoặc email bạn bè (ít nhất 2 ký tự).' };
    }

    const friends = this.getFriends();
    const existing = friends.find(
      f => f.name.toLowerCase() === cleanTarget.toLowerCase() || (f.email && f.email.toLowerCase() === cleanTarget.toLowerCase())
    );

    if (existing) {
      if (existing.status === 'ok') {
        return { ok: false, msg: `"${existing.name}" đã có trong danh sách bạn bè.` };
      }
      if (existing.status === 'out') {
        return { ok: false, msg: `Bạn đã gửi lời mời kết bạn đến "${existing.name}". Đang chờ bạn ấy đồng ý.` };
      }
      if (existing.status === 'in') {
        // Chấp nhận luôn nếu đối phương đã mời mình trước
        return this.acceptFriend(existing.id);
      }
    }

    // Chọn ngẫu nhiên màu avatar
    const randomColor = PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
    const isEmail = cleanTarget.includes('@');
    const newFriend: SocialFriend = {
      id: `fr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: isEmail ? cleanTarget.split('@')[0] : cleanTarget,
      email: isEmail ? cleanTarget : undefined,
      avatarColor: randomColor,
      status: 'out', // Đã gửi lời mời
      online: true,
      lastSeen: Date.now()
    };

    const updated = [newFriend, ...friends];
    this.saveFriends(updated);
    return { ok: true, msg: `Đã gửi lời mời kết bạn đến "${newFriend.name}".`, friend: newFriend };
  }

  /** Chấp nhận lời mời kết bạn */
  static acceptFriend(friendId: string): { ok: boolean; msg: string } {
    const friends = this.getFriends();
    const friend = friends.find(f => f.id === friendId);
    if (!friend) return { ok: false, msg: 'Không tìm thấy người bạn này.' };

    const updated = friends.map(f => {
      if (f.id === friendId) {
        return { ...f, status: 'ok' as const, online: true, lastSeen: Date.now() };
      }
      return f;
    });

    this.saveFriends(updated);
    return { ok: true, msg: `Đã trở thành bạn bè với "${friend.name}".` };
  }

  /** Từ chối lời mời hoặc hủy kết bạn */
  static removeFriend(friendId: string): { ok: boolean; msg: string } {
    const friends = this.getFriends();
    const updated = friends.filter(f => f.id !== friendId);
    this.saveFriends(updated);
    return { ok: true, msg: 'Đã xóa bạn khỏi danh sách.' };
  }

  /** Cập nhật trạng thái trực tuyến cho danh sách bạn bè dựa trên Realtime presence */
  static syncPresenceState(
    onlinePeerUids: Array<{ id: string; name?: string; currentRoom?: string }>
  ): SocialFriend[] {
    const friends = this.getFriends();
    let hasChange = false;

    const updated = friends.map(f => {
      const match = onlinePeerUids.find(p => p.id === f.id || (p.name && p.name.toLowerCase() === f.name.toLowerCase()));
      const isOnline = !!match;
      const room = match?.currentRoom;

      if (f.online !== isOnline || f.currentRoom !== room) {
        hasChange = true;
        return {
          ...f,
          online: isOnline,
          currentRoom: room,
          lastSeen: isOnline ? Date.now() : f.lastSeen
        };
      }
      return f;
    });

    if (hasChange) {
      this.saveFriends(updated);
    }
    return updated;
  }
}
