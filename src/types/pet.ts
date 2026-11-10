export type PetStage = 1 | 2 | 3 | 4 | 5;

export interface PetStageInfo {
  stage: PetStage;
  name: string;
  title: string;
  minDays: number;
  maxDays: number | null;
  description: string;
  activeQuote: string;
  sleepingQuote: string;
}

export const PET_STAGES: Record<PetStage, PetStageInfo> = {
  1: {
    stage: 1,
    name: 'Hạt Giống Xanh',
    title: 'Mầm Mới Nhú',
    minDays: 1,
    maxDays: 2,
    description: 'Mầm non bé bỏng vừa vươn mình khỏi vỏ bọc, háo hức khám phá thế giới tri thức đầu tiên.',
    activeQuote: 'Mình cùng mở những trang sách đầu tiên hôm nay nhé!',
    sleepingQuote: 'Khò khò... Mầm non đang ngủ đông lấy sức chờ bạn đánh thức...',
  },
  2: {
    stage: 2,
    name: 'Chồi Non Tri Thức',
    title: 'Chồi Non Bỡ Ngỡ',
    minDays: 3,
    maxDays: 6,
    description: 'Hai chiếc lá xanh đã xòe rộng đón nắng ấm, chăm chỉ rèn luyện qua từng trang bài tập.',
    activeQuote: 'Bạn chăm chỉ quá, mình cảm thấy mình cao lớn hơn từng ngày rồi này!',
    sleepingQuote: 'Đang cuộn mình trong giấc mơ ngập tràn công thức thú vị...',
  },
  3: {
    stage: 3,
    name: 'Cây Xanh Tinh Anh',
    title: 'Vươn Mình Tỏa Sáng',
    minDays: 7,
    maxDays: 13,
    description: 'Thân cây cứng cáp, năng động đồng hành cùng bạn vượt qua mọi thử thách trên bàn học.',
    activeQuote: 'Một tuần liền kiên trì! Phong độ học tập của bạn thật xuất sắc!',
    sleepingQuote: 'Nghỉ ngơi chút thôi, mai mình lại cùng nhau chinh phục bàn học nhé.',
  },
  4: {
    stage: 4,
    name: 'Tinh Linh Học Thuật',
    title: 'Hộ Vệ Bàn Học',
    minDays: 14,
    maxDays: 29,
    description: 'Hào quang tri thức bao quanh, tiếp thêm nguồn năng lượng dồi dào cho các buổi học sâu.',
    activeQuote: 'Không thử thách nào làm khó được chúng ta khi đã có thói quen bền bỉ!',
    sleepingQuote: 'Đang hấp thu dưỡng chất tri thức trong giấc ngủ sâu...',
  },
  5: {
    stage: 5,
    name: 'Vị Thần Cổ Thụ',
    title: 'Bậc Thầy Tri Thức',
    minDays: 30,
    maxDays: null,
    description: 'Cội rễ vững như bàn thạch, tán lá rợp bóng hiền hòa. Biểu tượng tối thượng của kỷ luật vượt bậc.',
    activeQuote: 'Chào bậc thầy tri thức! Tinh thần tự học của bạn là nguồn cảm hứng lớn nhất!',
    sleepingQuote: 'Vị thần đang thiền định trong khu rừng tri thức bao la...',
  },
};

export interface PetState {
  name: string;
  stage: PetStage;
  isSleeping: boolean;
  streakDays: number;
  lastStudyDate: string | null;
  unlockedStages: PetStage[];
  todayStudySeconds: number;
}
