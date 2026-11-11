/**
 * SocialFriendService.ts
 * Quản lý lời mời cùng học và danh sách bạn học gần đây
 * Tối ưu hóa theo chỉ đạo: Mời trực tiếp không cần kết bạn phức tạp
 */

export interface RecentBuddy {
  id: string;
  name: string;
  email?: string;
  avatarColor: string;
  online?: boolean;
  currentRoom?: string;
  currentSpaceName?: string;
  lastInvited?: number;
}

export type SocialFriend = RecentBuddy;

export interface DeskInviteNotification {
  id: string;
  fromId: string;
  fromName: string;
  fromAvatarColor: string;
  roomId: string;
  spaceName: string;
  createdAt: number;
}

const STORAGE_KEY = 'greenlearn_recent_buddies';
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

const DEFAULT_BUDDIES: RecentBuddy[] = [
  {
    id: 'buddy-demo-1',
    name: 'Hoàng Nam (CNTT)',
    email: 'hoangnam.cntt@greenlearn.edu.vn',
    avatarColor: '#2563EB',
    online: true,
    lastInvited: Date.now() - 300000
  },
  {
    id: 'buddy-demo-2',
    name: 'Thu Trang (Sư phạm)',
    email: 'thutrang.sp@greenlearn.edu.vn',
    avatarColor: '#7C3AED',
    online: true,
    lastInvited: Date.now() - 600000
  },
  {
    id: 'buddy-demo-3',
    name: 'Minh Đức (Toán Tin)',
    email: 'minhduc.math@greenlearn.edu.vn',
    avatarColor: '#D97706',
    online: false,
    lastInvited: Date.now() - 86400000
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

  /** Lấy danh sách bạn học đã mời gần đây */
  static getRecentBuddies(): RecentBuddy[] {
    if (typeof window === 'undefined') return DEFAULT_BUDDIES;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    // Khởi tạo danh sách mặc định
    this.saveRecentBuddies(DEFAULT_BUDDIES);
    return DEFAULT_BUDDIES;
  }

  /** Lưu danh sách bạn học vào localStorage */
  static saveRecentBuddies(buddies: RecentBuddy[]): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(buddies));
      } catch {
        // ignore
      }
    }
  }

  /** Ghi nhận hoặc thêm mới bạn học vào danh sách khi mời */
  static recordInvite(targetNameOrEmail: string): { ok: boolean; msg: string; buddy?: RecentBuddy } {
    const cleanTarget = targetNameOrEmail.trim();
    if (!cleanTarget || cleanTarget.length < 2) {
      return { ok: false, msg: 'Vui lòng nhập tên hoặc email bạn học (ít nhất 2 ký tự).' };
    }

    const buddies = this.getRecentBuddies();
    const existing = buddies.find(
      b => b.name.toLowerCase() === cleanTarget.toLowerCase() || (b.email && b.email.toLowerCase() === cleanTarget.toLowerCase())
    );

    if (existing) {
      existing.lastInvited = Date.now();
      const reordered = [existing, ...buddies.filter(b => b.id !== existing.id)];
      this.saveRecentBuddies(reordered);
      return { ok: true, msg: `Đã gửi lời mời đến "${existing.name}".`, buddy: existing };
    }

    const isEmail = cleanTarget.includes('@');
    const randomColor = PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
    const newBuddy: RecentBuddy = {
      id: `buddy-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: isEmail ? cleanTarget.split('@')[0] : cleanTarget,
      email: isEmail ? cleanTarget : undefined,
      avatarColor: randomColor,
      online: true,
      lastInvited: Date.now()
    };

    const updated = [newBuddy, ...buddies];
    this.saveRecentBuddies(updated);
    return { ok: true, msg: `Đã gửi lời mời đến "${newBuddy.name}".`, buddy: newBuddy };
  }

  /** Xóa một bạn học khỏi danh sách gần đây */
  static removeBuddy(buddyId: string): void {
    const buddies = this.getRecentBuddies();
    const updated = buddies.filter(b => b.id !== buddyId);
    this.saveRecentBuddies(updated);
  }

  /** Thêm và lưu bạn bè vào danh sách (dấu +) */
  static addFriend(nameOrEmail: string): { ok: boolean; msg: string; friend?: RecentBuddy } {
    const res = this.recordInvite(nameOrEmail);
    return {
      ok: res.ok,
      msg: res.ok ? `Đã lưu "${res.buddy?.name}" vào danh sách bạn bè.` : res.msg,
      friend: res.buddy
    };
  }

  /** Xóa bạn khỏi danh sách */
  static removeFriend(friendId: string): void {
    this.removeBuddy(friendId);
  }

  /** Cập nhật trạng thái trực tuyến theo Realtime presence */
  static syncPresenceState(
    onlinePeerUids: Array<{ id: string; name?: string; currentRoom?: string; currentSpaceName?: string }>
  ): RecentBuddy[] {
    const buddies = this.getRecentBuddies();
    let hasChange = false;

    const updated = buddies.map(b => {
      const match = onlinePeerUids.find(p => p.id === b.id || (p.name && p.name.toLowerCase() === b.name.toLowerCase()));
      const isOnline = !!match;
      const room = match?.currentRoom;
      const spaceName = match?.currentSpaceName;

      if (b.online !== isOnline || b.currentRoom !== room || b.currentSpaceName !== spaceName) {
        hasChange = true;
        return {
          ...b,
          online: isOnline,
          currentRoom: room,
          currentSpaceName: spaceName
        };
      }
      return b;
    });

    if (hasChange) {
      this.saveRecentBuddies(updated);
    }
    return updated;
  }

  /** Lấy tên phòng thân thiện, triệt tiêu hoàn toàn hiển thị mã UUID thô */
  static getFriendlyRoomName(buddy: RecentBuddy, spaces?: Array<{ id: string; name: string }>): string {
    const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    if (buddy.currentSpaceName && buddy.currentSpaceName.trim() && !isUUID(buddy.currentSpaceName)) {
      return buddy.currentSpaceName.trim();
    }
    if (buddy.currentRoom) {
      if (spaces) {
        const found = spaces.find(s => s.id === buddy.currentRoom);
        if (found && found.name) return found.name;
      }
      if (buddy.currentRoom === 'demo') return 'Bàn học khởi đầu (Demo)';
      if (buddy.currentRoom === 'midterm') return 'Bàn ôn thi giữa kỳ';
      if (buddy.currentRoom === 'curriculum_exam') return 'Bàn giáo trình & đề thi';
      if (buddy.currentRoom === 'group_study') return 'Bàn học nhóm trực tuyến';
      if (!isUUID(buddy.currentRoom) && !buddy.currentRoom.startsWith('user-') && !buddy.currentRoom.startsWith('space-')) {
        return `Bàn học ${buddy.currentRoom}`;
      }
      return `Bàn học của ${buddy.name}`;
    }
    return 'Bàn học trực tuyến';
  }

  // Tương thích ngược
  static getFriends(): any[] {
    return this.getRecentBuddies().map(b => ({ ...b, status: 'ok' }));
  }
}
