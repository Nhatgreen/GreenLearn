'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Search,
  X,
  ChevronDown,
  ChevronsUpDown,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Mail,
  ExternalLink,
  BookOpen,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { SiteFooter } from '@/components/common/SiteFooter';
import { getAssetPath } from '@/lib/assets';

function GithubIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

type FaqCategoryKey = 'all' | 'ban_hoc' | 'on_tap' | 'vitoken' | 'cho_tai_lieu' | 'tai_khoan_bao_mat';

interface FaqCategory {
  key: FaqCategoryKey;
  label: string;
}

const CATEGORIES: FaqCategory[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'ban_hoc', label: 'Bàn học 2.5D' },
  { key: 'on_tap', label: 'Ôn tập & SM-2' },
  { key: 'vitoken', label: 'ViToken & Nạp tiền' },
  { key: 'cho_tai_lieu', label: 'Chợ tài liệu' },
  { key: 'tai_khoan_bao_mat', label: 'Tài khoản & Bảo mật' },
];

interface FaqItem {
  id: string;
  category: FaqCategoryKey;
  categoryLabel: string;
  question: string;
  answer: React.ReactNode;
  keywords: string[];
}

const FAQ_LIST: FaqItem[] = [
  {
    id: 'ban-hoc-vitudy-dung-nhu-the-nao',
    category: 'ban_hoc',
    categoryLabel: 'Bàn học 2.5D',
    question: 'Bàn học ViTudy dùng như thế nào và có gì khác phần mềm thông thường?',
    keywords: ['bàn học', '2.5D', 'sách', 'tài liệu', 'ghi chú', 'cách dùng', 'giao diện'],
    answer: (
      <div className="space-y-3">
        <p>
          Khác với các ứng dụng đọc PDF truyền thống chỉ cho phép xem từng tab rời rạc, ViTudy mang đến một <strong>mặt bàn học không gian 2.5D vô hạn</strong>. Bạn có thể mở đồng thời sách giáo trình, đề thi trắc nghiệm, tờ tóm tắt và các mẩu giấy ghi chú cạnh nhau hệt như ngồi học tại bàn thực tế.
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
          <li><strong>Mở nhiều tài liệu:</strong> Sắp xếp giáo trình bên trái, đề thi hoặc flashcard bên phải để đối chiếu kiến thức trực tiếp.</li>
          <li><strong>Ghi chú & Nét vẽ ghim trang:</strong> Dùng bút chì hoặc bút dạ quang gạch chân chữ; mọi nét vẽ sẽ tự động neo chặt vào từng trang sách khi bạn kéo dịch chuyển.</li>
          <li><strong>Sợi chỉ nối tri thức:</strong> Kéo liên kết thị giác giữa một đoạn định nghĩa trong sách sang mẩu giấy ghi chú tóm tắt để hệ thống hóa kiến thức.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'dieu-huong-pan-zoom-phim-tat',
    category: 'ban_hoc',
    categoryLabel: 'Bàn học 2.5D',
    question: 'Di chuyển (Pan), phóng to thu nhỏ (Zoom) và dùng phím tắt trên bàn học như thế nào?',
    keywords: ['zoom', 'pan', 'phóng to', 'thu nhỏ', 'phím tắt', 'wasd', 'minimap', 'chuột'],
    answer: (
      <div className="space-y-3">
        <p>Hệ thống hỗ trợ thao tác điều hướng cực kỳ mượt mà với tốc độ 60 khung hình/giây:</p>
        <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
          <li><strong>Phóng to / Thu nhỏ (Zoom):</strong> Cuộn con lăn chuột hoặc dùng thao tác chụm 2 ngón tay trên bàn rê (Trackpad). ViTudy sử dụng thuật toán gom chuyển động RAF Coalescing giúp chữ KaTeX và văn bản luôn sắc nét 100%, không bị vỡ hạt ở mọi mức zoom.</li>
          <li><strong>Di chuyển mặt bàn (Pan):</strong> Ở chế độ con trỏ chuột mặc định, bạn giữ chuột trái vào khoảng trống mặt bàn và kéo. Khi đang cầm bút vẽ, hãy giữ phím <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono">Alt</kbd> và kéo chuột để di chuyển canvas.</li>
          <li><strong>Điều hướng bằng bàn phím:</strong> Bấm giữ các phím <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono">W</kbd>, <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono">A</kbd>, <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono">S</kbd>, <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono">D</kbd> hoặc 4 phím mũi tên để lia tầm nhìn nhanh chóng.</li>
          <li><strong>Bản đồ thu nhỏ (Minimap):</strong> Nhấn phím <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono">M</kbd> để bật/tắt bản đồ thu nhỏ ở góc phải màn hình, giúp định vị nhanh các tài liệu ở xa.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'boi-den-chu-inteline',
    category: 'ban_hoc',
    categoryLabel: 'Bàn học 2.5D',
    question: 'Tính năng bôi đen chữ để hỏi bài (Inteline) hoạt động ra sao?',
    keywords: ['inteline', 'bôi đen', 'hỏi bài', 'giải thích', 'tra cứu', 'ai'],
    answer: (
      <div className="space-y-3">
        <p>
          <strong>Inteline</strong> là trợ lý đọc hiểu theo ngữ cảnh. Khi đọc tài liệu gặp đoạn văn khó hiểu, khái niệm trừu tượng hoặc công thức phức tạp:
        </p>
        <ol className="list-decimal pl-5 space-y-1.5 text-slate-700">
          <li>Dùng chuột bôi đen trực tiếp đoạn chữ cần giải đáp trên trang sách.</li>
          <li>Một thanh tác vụ thông minh sẽ lập tức xuất hiện ngay cạnh con trỏ chuột.</li>
          <li>Chọn <strong>Giải thích</strong> để xem phân tích dễ hiểu; chọn <strong>Tạo câu hỏi</strong> để kiểm tra độ hiểu; hoặc bấm <strong>Trích sang Note</strong> để dán nhanh đoạn trích sang một mẩu giấy ghi chú vàng trên bàn.</li>
        </ol>
      </div>
    ),
  },
  {
    id: 'thuat-toan-on-tap-sm2',
    category: 'on_tap',
    categoryLabel: 'Ôn tập & SM-2',
    question: 'Lịch ôn thẻ ghi nhớ (Flashcard) được tính toán theo thuật toán nào?',
    keywords: ['sm-2', 'supermemo', 'flashcard', 'thẻ ghi nhớ', 'lịch ôn', 'quên', 'dễ', 'khó', 'khoảng cách'],
    answer: (
      <div className="space-y-3">
        <p>
          ViTudy áp dụng thuật toán lặp lại ngắt quãng khoa học <strong>SuperMemo SM-2</strong> (được chứng minh giúp ghi nhớ kiến thức dài hạn tối ưu và chống hiện tượng đường cong quên lãng Ebbinghaus).
        </p>
        <p>Sau mỗi lần bạn tự kiểm tra một thẻ flashcard, hãy bấm chọn 1 trong 4 mức phản hồi:</p>
        <ul className="list-disc pl-5 space-y-1 text-slate-700">
          <li><strong>Quên (q = 0):</strong> Không nhớ kiến thức. Thẻ sẽ được lên lịch ôn lại ngay trong ngày hoặc ngày mai, đồng thời giảm hệ số dễ.</li>
          <li><strong>Khó (q = 3):</strong> Nhớ nhưng mất nhiều thời gian suy nghĩ. Thẻ được ôn lại sau khoảng thời gian ngắn.</li>
          <li><strong>Vừa (q = 4):</strong> Trả lời đúng sau một thoáng do dự. Lịch ôn áp dụng theo hệ số nhân chuẩn.</li>
          <li><strong>Dễ (q = 5):</strong> Nhớ kiến thức tức thì. Thẻ được tăng hệ số dễ và đẩy lịch ôn ra xa hơn đáng kể.</li>
        </ul>
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 font-mono">
          Công thức: EF&apos; = EF + (0.1 - (5 - q) × (0.08 + (5 - q) × 0.02)) (EF luôn nằm trong khoảng 1.3 đến 2.5). Khoảng cách ôn lần 1 = 1 ngày, lần 2 = 6 ngày, lần n = I(n-1) × EF.
        </div>
      </div>
    ),
  },
  {
    id: 'sinh-de-thi-trac-nghiem-tu-tai-lieu',
    category: 'on_tap',
    categoryLabel: 'Ôn tập & SM-2',
    question: 'Làm sao để AI tự tạo đề thi trắc nghiệm từ tài liệu của tôi?',
    keywords: ['đề thi', 'trắc nghiệm', 'sinh đề', 'ai', 'tài liệu', 'giáo trình', 'ôn tập'],
    answer: (
      <div className="space-y-3">
        <p>
          Bạn có thể biến bất kỳ giáo trình hoặc bài giảng nào thành một bộ đề thi trắc nghiệm khách quan chỉ với một lần bấm:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
          <li>Nhấp vào nút tác vụ AI trên thanh công cụ của cuốn sách hoặc khung tri thức góc trái.</li>
          <li>Chọn <strong>Sinh đề thi trắc nghiệm</strong>, chọn số lượng câu (5, 10 hoặc 20 câu) và mức độ khó mong muốn.</li>
          <li>AI sẽ quét nội dung các trang tài liệu, tự động biên soạn các câu hỏi kèm 4 lựa chọn, đáp án chính xác và lời giải thích cặn kẽ. Thẻ đề thi sẽ được đặt ngay cạnh sách trên bàn học để bạn làm bài và chấm điểm thời gian thực.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'chuyen-khoan-vietqr-chua-thay-vitoken',
    category: 'vitoken',
    categoryLabel: 'ViToken & Nạp tiền',
    question: 'Tôi đã quét mã VietQR chuyển khoản nhưng chưa thấy cộng ViToken?',
    keywords: ['chuyển khoản', 'vietqr', 'sepay', 'mbbank', 'chưa nhận điểm', 'nạp tiền', 'hỗ trợ', 'lỗi nạp'],
    answer: (
      <div className="space-y-3">
        <p>
          Hệ thống nạp ViToken qua cổng VietQR được tự động hóa hoàn toàn 24/7 thông qua cổng thanh toán SePay và ngân hàng Quân Đội MBBank. Thông thường, số dư ViToken sẽ được cộng vào ví của bạn trong vòng <strong>30 giây đến 2 phút</strong> sau khi app ngân hàng báo chuyển tiền thành công.
        </p>
        <p>Nếu sau 5 phút bạn vẫn chưa thấy điểm cập nhật, nguyên nhân thường do:</p>
        <ul className="list-disc pl-5 space-y-1 text-slate-700">
          <li>Bạn sửa đổi nội dung chuyển khoản khiến hệ thống không đối soát tự động được mã đơn.</li>
          <li>Hệ thống Napas liên ngân hàng đang trong kỳ đối soát bảo trì đêm.</li>
        </ul>
        <div className="p-3.5 bg-green-50 border border-green-200/80 rounded-xl text-xs text-[#166534] leading-relaxed">
          <strong>Cách xử lý ngay:</strong> Bạn hãy gửi email đến <a href="mailto:support@vitudy.edu.vn" className="underline font-bold">support@vitudy.edu.vn</a> kèm ảnh chụp biên lai giao dịch thành công. Ban quản trị sẽ tra soát đối soát Napas và cộng bù ViToken cho bạn trong vòng tối đa 15 phút.
        </div>
      </div>
    ),
  },
  {
    id: 'quy-doi-vitoken-va-chi-phi-ai',
    category: 'vitoken',
    categoryLabel: 'ViToken & Nạp tiền',
    question: '1 ViToken bằng bao nhiêu đồng và mỗi lượt hỏi AI tốn bao nhiêu điểm?',
    keywords: ['quy đổi', 'tỷ lệ', 'giá', 'chi phí', '1 vitoken', 'bao nhiêu tiền', 'ai tốn điểm'],
    answer: (
      <div className="space-y-3">
        <p>
          Tỷ lệ quy đổi tiêu chuẩn của hệ sinh thái ViTudy là: <strong>1.000 VNĐ = 1 ViToken</strong> (1 V = 1 ViToken).
        </p>
        <p>Biểu phí sử dụng các tính năng AI hệ thống rất tiết kiệm:</p>
        <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
          <li><strong>Hỏi bài Inteline / Giải thích thuật ngữ:</strong> Khoảng <strong>0,05 ViToken</strong> (tương đương 50 đồng / lần hỏi).</li>
          <li><strong>Sinh đề thi trắc nghiệm (10 câu):</strong> Khoảng <strong>0,5 ViToken</strong> (tương đương 500 đồng).</li>
          <li><strong>Dùng API Key cá nhân (BYOK):</strong> Nếu bạn cấu hình khóa API riêng của Google Gemini hoặc OpenAI trong mục Cài đặt AI, mọi lượt hỏi bài và sinh đề sẽ là <strong>0 ViToken (Hoàn toàn miễn phí)</strong>.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'chinh-sach-hoan-tien',
    category: 'vitoken',
    categoryLabel: 'ViToken & Nạp tiền',
    question: 'ViToken có thời hạn sử dụng không và có được hoàn tiền không?',
    keywords: ['hoàn tiền', 'hạn sử dụng', 'hết hạn', 'chính sách hoàn tiền', 'rút tiền', 'nạp nhầm'],
    answer: (
      <div className="space-y-3">
        <p>
          <strong>ViToken trong tài khoản của bạn KHÔNG CÓ THỜI HẠN SỬ DỤNG.</strong> Điểm số đã nạp hoặc nhận thưởng từ điểm danh sẽ được bảo lưu vĩnh viễn trong tài khoản cho đến khi bạn sử dụng.
        </p>
        <p><strong>Chính sách hoàn tiền (Refund Policy):</strong></p>
        <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
          <li>ViTudy hỗ trợ hoàn trả 100% số tiền chuyển khoản đối với các giao dịch nạp nhầm hoặc chuyển dư trong vòng <strong>24 giờ</strong> kể từ lúc phát sinh giao dịch, với điều kiện số ViToken đó chưa bị trừ vào việc hỏi AI hoặc mua tài liệu.</li>
          <li>Để yêu cầu hoàn tiền, bạn chỉ cần gửi email về <a href="mailto:support@vitudy.edu.vn" className="underline font-bold">support@vitudy.edu.vn</a> ghi rõ thông tin tài khoản ngân hàng nhận lại tiền. Chúng tôi sẽ xử lý chuyển khoản hoàn trả trong vòng 1 ngày làm việc.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'diem-danh-chuoi-ngay-nhan-thuong',
    category: 'vitoken',
    categoryLabel: 'ViToken & Nạp tiền',
    question: 'Điểm danh hàng ngày và chuỗi ngày học tập được tính điểm thưởng ra sao?',
    keywords: ['điểm danh', 'chuỗi ngày', 'streak', 'thưởng', 'miễn phí', 'nhận vitoken'],
    answer: (
      <div className="space-y-3">
        <p>
          ViTudy khuyến khích thói quen học tập đều đặn hàng ngày thông qua cơ chế thưởng ViToken miễn phí:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
          <li><strong>Điểm danh mỗi ngày (Thứ 2 đến Thứ 7):</strong> Nhận ngay <strong>+5 ViToken</strong>/ngày.</li>
          <li><strong>Chủ Nhật nhân đôi năng lượng:</strong> Nhận ngay <strong>+10 ViToken</strong>.</li>
          <li><strong>Thưởng duy trì chuỗi 7 ngày liên tục:</strong> Đạt mốc tròn 7 ngày điểm danh không đứt quãng, bạn được tặng thêm một phần thưởng lớn <strong>+20 ViToken</strong>.</li>
          <li><em>Lưu ý:</em> Nếu bạn bỏ lỡ một ngày không đăng nhập điểm danh, ngọn lửa chuỗi ngày sẽ được đặt lại về ngày 1.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'so-huu-tai-lieu-cho',
    category: 'cho_tai_lieu',
    categoryLabel: 'Chợ tài liệu',
    question: 'Sau khi mua tài liệu trên Chợ Tài Liệu, tôi có được dùng lại vĩnh viễn không?',
    keywords: ['chợ tài liệu', 'mua tài liệu', 'vĩnh viễn', 'sở hữu', 'thêm vào bàn học'],
    answer: (
      <div className="space-y-3">
        <p>
          <strong>Có, bạn được sở hữu vĩnh viễn.</strong> Sau khi dùng ViToken mở khóa thành công một cuốn sách, tờ tóm tắt hay bộ đề thi từ Chợ Tài Liệu:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
          <li>Tài liệu đó được gắn vĩnh viễn vào tủ sách cá nhân trong tài khoản của bạn.</li>
          <li>Bạn có thể bấm nút <strong>Thêm vào bàn học</strong> bao nhiêu lần tùy thích trên mọi bàn học mà không phải trả thêm bất kỳ ViToken nào.</li>
          <li>Mọi ghi chú, nét vẽ gạch chân cá nhân của bạn trên tài liệu đó đều được lưu trữ riêng biệt, không ảnh hưởng đến bản gốc.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'chia-se-tai-lieu-nhan-85-phan-tram',
    category: 'cho_tai_lieu',
    categoryLabel: 'Chợ tài liệu',
    question: 'Chia sẻ tài liệu lên Chợ Tài Liệu thì tôi nhận được bao nhiêu ViToken?',
    keywords: ['chia sẻ', 'bán tài liệu', '85%', 'thu nhập', 'tác giả', 'hoa hồng'],
    answer: (
      <div className="space-y-3">
        <p>
          ViTudy là nền tảng tri thức mở cùng sẻ chia vì sinh viên. Khi bạn tải lên một tài liệu học tập hữu ích do mình biên soạn (giáo trình tóm tắt, sơ đồ tư duy, bộ đề ôn thi) và chia sẻ lên Chợ:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
          <li>Bạn nhận được <strong>85% doanh thu ViToken</strong> cho mỗi lượt người học khác mở khóa tài liệu. Hệ thống chỉ giữ lại 15% để duy trì hạ tầng máy chủ và chi phí đối soát.</li>
          <li>Ví dụ: Một cuốn sách bạn định giá 50 ViToken, mỗi khi có bạn học mở khóa, ví của bạn sẽ được cộng tự động <strong>42,5 ViToken</strong>.</li>
          <li>Số ViToken kiếm được bạn có thể sử dụng để hỏi đáp AI chuyên sâu hoặc mở khóa các tài liệu giá trị khác từ cộng đồng.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'bao-ve-ban-quyen-tai-lieu',
    category: 'cho_tai_lieu',
    categoryLabel: 'Chợ tài liệu',
    question: 'Tài liệu của tôi khi chia sẻ lên Chợ có bị người khác tải lậu file gốc không?',
    keywords: ['bản quyền', 'tải lậu', 'file gốc', 'bảo mật tài liệu', 'chống copy'],
    answer: (
      <div className="space-y-3">
        <p>
          <strong>Tài liệu của bạn được bảo vệ bản quyền tối đa.</strong> Hệ thống ViTudy được thiết kế theo cơ chế xem và tương tác tương tác 2.5D độc quyền:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
          <li>Người mua chỉ có quyền mở và đọc tài liệu dưới dạng trang sách lật trực quan 2.5D ngay trên mặt bàn học của ViTudy.</li>
          <li>Hệ thống <strong>không cung cấp nút tải về tệp tin gốc (Download raw PDF)</strong> và mã hóa đường dẫn lưu trữ, ngăn chặn triệt để tình trạng tài liệu tâm huyết của bạn bị sao chép hoặc phát tán trái phép ra ngoài.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'luu-tru-khoa-api-va-bao-mat',
    category: 'tai_khoan_bao_mat',
    categoryLabel: 'Tài khoản & Bảo mật',
    question: 'Khóa API cá nhân (Gemini, OpenAI) và dữ liệu học tập của tôi được lưu ở đâu?',
    keywords: ['api key', 'gemini', 'openai', 'bảo mật', 'dữ liệu', 'mã hóa', 'quyền riêng tư'],
    answer: (
      <div className="space-y-3">
        <p>
          Chúng tôi đặt quyền riêng tư và an toàn thông tin của người học lên hàng đầu:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
          <li><strong>Khóa API cá nhân (BYOK):</strong> Khi bạn nhập API Key của Google Gemini hoặc OpenAI, khóa này được <strong>lưu trữ cục bộ 100% trong bộ nhớ trình duyệt (LocalStorage)</strong> trên chính thiết bị của bạn. Máy chủ ViTudy tuyệt đối không thu thập hay lưu trữ khóa API cá nhân của bạn dưới bất kỳ hình thức nào.</li>
          <li><strong>Dữ liệu bàn học:</strong> Tọa độ các vật thể, ghi chú và nét vẽ trên bàn học được đồng bộ an toàn qua dịch vụ đám mây Supabase với chính sách bảo mật cấp dòng (Row-Level Security - RLS), chỉ có chính tài khoản của bạn mới có quyền truy xuất.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'hoc-nhom-va-xoa-tai-khoan',
    category: 'tai_khoan_bao_mat',
    categoryLabel: 'Tài khoản & Bảo mật',
    question: 'Làm việc nhóm trực tuyến và xóa tài khoản diễn ra như thế nào?',
    keywords: ['học nhóm', 'realtime', 'multiplayer', 'xóa tài khoản', 'hủy tài khoản'],
    answer: (
      <div className="space-y-3">
        <p>
          <strong>Học nhóm trực tuyến (Realtime Multiplayer):</strong> Bạn bấm nút chia sẻ ở góc dưới bên trái để lấy liên kết phòng học có tham số <code className="px-1.5 py-0.5 bg-slate-100 rounded text-xs font-mono">?room=...</code> rồi gửi cho bạn bè. Khi bạn bè vào phòng, hai người sẽ cùng nhìn thấy con trỏ chuột của nhau khi cùng giải bài tập. Khi muốn học một mình, chỉ cần bấm nút <em>Thoát</em> trên thanh trạng thái bên dưới.
        </p>
        <p>
          <strong>Quyền xóa tài khoản:</strong> Bạn có toàn quyền xóa tài khoản của mình bất cứ lúc nào trong trang Hồ sơ cá nhân. Khi chọn xóa tài khoản, toàn bộ dữ liệu bàn học, các mẩu giấy ghi chú, lịch sử ôn tập và số dư ViToken sẽ bị hủy bỏ vĩnh viễn và không thể phục hồi theo đúng quy định về quyền riêng tư dữ liệu.
        </p>
      </div>
    ),
  },
];

function FaqContent() {
  const searchParams = useSearchParams();
  const fromParam = searchParams.get('from');

  const [backTarget, setBackTarget] = useState<{ href: string; label: string }>({
    href: '/?view=desk',
    label: 'Về Bàn Học',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FaqCategoryKey>('all');
  const [openIds, setOpenIds] = useState<Set<string>>(new Set(['ban-hoc-vitudy-dung-nhu-the-nao']));
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedbackState, setFeedbackState] = useState<Record<string, 'up' | 'down'>>({});

  useEffect(() => {
    let source = fromParam;
    if (!source && typeof window !== 'undefined') {
      source = sessionStorage.getItem('greenlearn_last_view') || sessionStorage.getItem('vitudy_last_view');
    }
    if (source === 'home') {
      setBackTarget({ href: '/?view=home', label: 'Về Trang Chủ' });
    } else {
      setBackTarget({ href: '/?view=desk', label: 'Về Bàn Học' });
    }
  }, [fromParam]);

  // Cuộn đến câu hỏi nếu có hash trên URL
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashId = window.location.hash.replace('#', '');
      const exists = FAQ_LIST.some((item) => item.id === hashId);
      if (exists) {
        setOpenIds((prev) => new Set([...prev, hashId]));
        setTimeout(() => {
          const el = document.getElementById(hashId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 150);
      }
    }
  }, []);

  const filteredFaqs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return FAQ_LIST.filter((item) => {
      const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
      if (!matchCategory) return false;
      if (!q) return true;
      const matchQuestion = item.question.toLowerCase().includes(q);
      const matchCategoryLabel = item.categoryLabel.toLowerCase().includes(q);
      const matchKeywords = item.keywords.some((kw) => kw.toLowerCase().includes(q));
      return matchQuestion || matchCategoryLabel || matchKeywords;
    });
  }, [searchQuery, selectedCategory]);

  const toggleItem = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    if (openIds.size === filteredFaqs.length) {
      setOpenIds(new Set());
    } else {
      setOpenIds(new Set(filteredFaqs.map((f) => f.id)));
    }
  };

  const handleCopyLink = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}${window.location.pathname}#${id}`;
      navigator.clipboard.writeText(url).then(() => {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      });
    }
  };

  const handleFeedback = (id: string, type: 'up' | 'down') => {
    setFeedbackState((prev) => ({ ...prev, [id]: type }));
  };

  return (
    <div className="w-full min-h-screen bg-white text-slate-800 flex flex-col font-sans">
      {/* Header đồng bộ độ rộng và chuẩn nhận diện */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-3.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href={backTarget.href}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-[#16A34A] transition-colors py-1.5 px-2.5 -ml-2.5 rounded-lg hover:bg-slate-50"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>{backTarget.label}</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <img
              src={getAssetPath('/icons/greenlearn-icon.png')}
              alt="GreenLearn"
              width={24}
              height={24}
              className="w-6 h-6 object-contain rounded-md"
              style={{ width: '24px', height: '24px' }}
            />
            <span className="font-bold text-sm text-slate-900 tracking-tight">Hỏi Đáp GreenLearn</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-10 w-full">
        {/* Tiêu đề trang chuẩn mực */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-serif text-slate-900 tracking-tight mb-2">
            Câu Hỏi Thường Gặp
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
            Giải đáp cặn kẽ về bàn học không gian 2.5D, thuật toán ôn tập SuperMemo SM-2, nạp điểm ViToken qua VietQR, bản quyền Chợ tài liệu và chính sách bảo mật.
          </p>
        </div>

        {/* Thanh tìm kiếm trực quan */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm câu hỏi, từ khóa (VD: VietQR, SM-2, hoàn tiền, flashcard, bản quyền...)"
            className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] focus:bg-white transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              aria-label="Xóa tìm kiếm"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Bộ lọc danh mục dạng chip */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.key;
              const count =
                cat.key === 'all'
                  ? FAQ_LIST.length
                  : FAQ_LIST.filter((item) => item.category === cat.key).length;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100/90 text-slate-700 hover:bg-slate-200/80'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected ? 'bg-slate-700 text-slate-200' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Nút Mở tất cả / Thu gọn */}
          <button
            type="button"
            onClick={handleExpandAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer ml-auto"
          >
            <ChevronsUpDown className="w-3.5 h-3.5 text-slate-500" />
            <span>
              {openIds.size === filteredFaqs.length ? 'Thu gọn tất cả' : 'Mở tất cả'}
            </span>
          </button>
        </div>

        {/* Thông báo nếu không tìm thấy kết quả */}
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
            <HelpCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-800 mb-1">Không tìm thấy câu hỏi phù hợp</p>
            <p className="text-xs text-slate-500 mb-4">
              Không có câu hỏi nào khớp với từ khóa &ldquo;{searchQuery}&rdquo;.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              <span>Xem tất cả câu hỏi</span>
            </button>
          </div>
        ) : (
          /* Danh sách câu hỏi xếp gập Accordion */
          <div className="space-y-3">
            {filteredFaqs.map((item) => {
              const isOpen = openIds.has(item.id);
              const userFeedback = feedbackState[item.id];
              return (
                <div
                  id={item.id}
                  key={item.id}
                  className={`rounded-2xl transition-all border ${
                    isOpen
                      ? 'border-[#16A34A] bg-white shadow-sm ring-1 ring-[#16A34A]/15'
                      : 'border-slate-200/90 bg-white hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    aria-expanded={isOpen}
                    className="w-full text-left p-4 sm:p-5 flex items-start sm:items-center justify-between gap-4 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] rounded-2xl min-h-[52px]"
                  >
                    <div className="space-y-1.5 pr-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-[#166534] bg-[#F0FDF4] border border-[#BBF7D0] px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                          {item.categoryLabel}
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                        {item.question}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5 sm:mt-0">
                      {/* Nút sao chép liên kết câu hỏi */}
                      <button
                        type="button"
                        onClick={(e) => handleCopyLink(item.id, e)}
                        title="Sao chép liên kết trực tiếp đến câu này"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Icon mũi tên xoay */}
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform ${
                          isOpen ? 'rotate-180 bg-green-100 text-[#16A34A]' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <ChevronDown className="w-4 h-4 stroke-[2.4]" />
                      </div>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 border-t border-slate-100">
                      <div className="text-xs sm:text-sm text-slate-700 leading-relaxed pt-2">
                        {item.answer}
                      </div>

                      {/* Thanh phản hồi hữu ích cuối câu */}
                      <div className="mt-5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          {userFeedback ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <Check className="w-3 h-3" />
                              <span>Cảm ơn bạn đã đóng góp phản hồi!</span>
                            </span>
                          ) : (
                            <>
                              <span>Câu trả lời này có hữu ích không?</span>
                              <button
                                type="button"
                                onClick={() => handleFeedback(item.id, 'up')}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-100 hover:text-slate-900 text-slate-600 font-medium transition-colors cursor-pointer"
                              >
                                <ThumbsUp className="w-3 h-3 text-slate-500" />
                                <span>Có</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleFeedback(item.id, 'down')}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-100 hover:text-slate-900 text-slate-600 font-medium transition-colors cursor-pointer"
                              >
                                <ThumbsDown className="w-3 h-3 text-slate-500" />
                                <span>Chưa rõ</span>
                              </button>
                            </>
                          )}
                        </div>

                        {copiedId === item.id && (
                          <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Đã sao chép liên kết câu hỏi
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Khối Hỗ Trợ Cuối Trang — Căn trái cùng trục lề, dẫn đúng kênh hỗ trợ */}
        <div className="mt-12 p-6 sm:p-8 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs">
          <div className="max-w-2xl">
            <h4 className="text-base sm:text-lg font-bold text-slate-900 mb-1.5">
              Bạn vẫn còn câu hỏi khác hoặc cần hỗ trợ gấp?
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 mb-5 leading-relaxed">
              Đội ngũ kỹ thuật ViTudy luôn sẵn sàng trợ giúp bạn về tài khoản, tra soát chuyển khoản VietQR hoặc giải đáp cách sử dụng. Thời gian phản hồi trong vòng <strong>2 – 4 giờ làm việc</strong>.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="mailto:support@vitudy.edu.vn"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>Liên hệ hỗ trợ: support@vitudy.edu.vn</span>
              </a>
              <a
                href="https://github.com/namtacozz/ViTudy"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold transition-all shadow-2xs cursor-pointer"
              >
                <GithubIcon className="w-4 h-4 text-slate-700" />
                <span>Mã nguồn trên GitHub</span>
              </a>
            </div>
            <p className="mt-4 text-[11px] text-slate-500">
              Khung giờ trực hỗ trợ: 08:00 – 22:00 tất cả các ngày trong tuần (kể cả Thứ 7 và Chủ Nhật).
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}

export default function FaqPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-screen bg-white flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-slate-300 border-t-[#16A34A] rounded-full animate-spin" />
        </div>
      }
    >
      <FaqContent />
    </Suspense>
  );
}
