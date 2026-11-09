'use client';

import React, { useState } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  Users, 
  QrCode, 
  Code2, 
  BrainCircuit, 
  Zap, 
  Compass, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';

const CORE_EXPERIENCES = [
  {
    icon: <BookOpen className="w-5 h-5 text-[#E0562D]" />,
    iconBg: 'bg-orange-50 border-orange-200',
    title: 'Mở nhiều tài liệu cùng lúc',
    description: 'Đặt giáo trình, slide bài giảng và đề thi cạnh nhau trên một bàn học để vừa đọc sách vừa đối chiếu kiến thức.',
    tag: 'Không gian mở',
  },
  {
    icon: <Sparkles className="w-5 h-5 text-amber-600" />,
    iconBg: 'bg-amber-50 border-amber-200',
    title: 'Giải thích chỗ chưa hiểu',
    description: 'Bôi đen đoạn văn hoặc công thức khó để xem tóm tắt, giải thích cặn kẽ và tạo câu hỏi trắc nghiệm tự ôn tập.',
    tag: 'Trợ lý học tập',
  },
  {
    icon: <Users className="w-5 h-5 text-sky-600" />,
    iconBg: 'bg-sky-50 border-sky-200',
    title: 'Học chung với bạn bè',
    description: 'Gửi liên kết để bạn bè cùng vào bàn học, thấy vị trí chuột của nhau theo thời gian thực khi cùng giải bài tập.',
    tag: 'Phòng học nhóm',
  },
  {
    icon: <QrCode className="w-5 h-5 text-emerald-600" />,
    iconBg: 'bg-emerald-50 border-emerald-200',
    title: 'Chợ tài liệu học tập',
    description: 'Tìm các bộ thẻ ghi nhớ và đề cương ôn tập do người học khác chia sẻ, thanh toán chuyển khoản nhanh qua mã VietQR.',
    tag: 'Thanh toán VietQR',
  },
];

const TECH_SPECS = [
  {
    tech: 'Động cơ KaTeX',
    icon: <Code2 className="w-4 h-4 text-indigo-600" />,
    title: 'Hiển thị công thức toán sắc nét',
    description: 'Trình bày ký hiệu đạo hàm, tích phân, ma trận và vector theo chuẩn LaTeX học thuật, không vỡ nét khi phóng to.',
  },
  {
    tech: 'Thuật toán SM-2',
    icon: <BrainCircuit className="w-4 h-4 text-emerald-600" />,
    title: 'Lịch ôn ngắt quãng khoa học',
    description: 'Tự động tính ngày cần ôn lại từng câu hỏi dựa trên mức độ bạn trả lời đúng, nhớ lâu hay còn phân vân.',
  },
  {
    tech: 'Tăng tốc 60 FPS',
    icon: <Zap className="w-4 h-4 text-amber-600" />,
    title: 'Phóng to thu nhỏ không giật lag',
    description: 'Tận dụng card đồ họa GPU để xử lý thao tác lăn chuột và di chuyển bàn học, giữ khung hình mượt mà liên tục.',
  },
  {
    tech: 'Tọa độ ma trận 2.5D',
    icon: <Compass className="w-4 h-4 text-rose-600" />,
    title: 'Nét vẽ gắn chặt với tài liệu',
    description: 'Nét mực bút dạ quang được lưu theo tọa độ cục bộ của từng tài liệu, khi kéo hay xoay sách thì nét vẽ vẫn bám nguyên vẹn.',
  },
];

export function FeatureGrid() {
  const [showTechDetails, setShowTechDetails] = useState(false);

  return (
    <section className="py-16 md:py-20 px-6 max-w-6xl mx-auto border-t border-slate-200 text-left">
      {/* Tiêu đề mục tính năng */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-2xl md:text-3xl font-serif text-slate-900 tracking-tight mb-2.5">
          Những gì bạn có thể làm trên bàn học
        </h2>
        <p className="text-sm sm:text-base text-slate-600">
          Mở tài liệu, ghi chú và giải bài tập trực tiếp trên cùng một không gian làm việc.
        </p>
      </div>

      {/* 4 Thẻ tính năng trải nghiệm người học */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
        {CORE_EXPERIENCES.map((f, i) => (
          <div
            key={i}
            className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl ${f.iconBg} border flex items-center justify-center shadow-2xs`}>
                  {f.icon}
                </div>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  {f.tag}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">{f.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{f.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Mục chi tiết kỹ thuật - dạng thu gọn mặc định */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8">
        <button
          type="button"
          onClick={() => setShowTechDetails(!showTechDetails)}
          className="w-full flex items-center justify-between text-left cursor-pointer group"
        >
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#E0562D]">
              Nền tảng công nghệ
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5 group-hover:text-[#E0562D] transition-colors">
              Chi tiết thông số kỹ thuật
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Dành cho bạn quan tâm đến thuật toán và cách hệ thống xử lý đồ họa
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 group-hover:border-[#E0562D] group-hover:text-[#E0562D] transition-colors flex-shrink-0">
            {showTechDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showTechDetails && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-200">
            {TECH_SPECS.map((spec, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2 text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {spec.tech}
                  </span>
                  <div className="w-6 h-6 rounded-md bg-slate-50 flex items-center justify-center">
                    {spec.icon}
                  </div>
                </div>
                <h4 className="text-sm font-bold text-slate-900">{spec.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{spec.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
