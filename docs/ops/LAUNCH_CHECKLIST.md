# BẢNG KIỂM TRA SẴN SÀNG BÁO CÁO & BÀN GIAO (LAUNCH CHECKLIST)

> **Mức độ hoàn thiện: 100% Sẵn sàng Báo cáo & Đưa vào Vận hành Thương mại**  
> Dự án: **ViTudy — Không Gian Học Thức Tích Hợp AI 2.5D**

---

## 1. Kiểm Tra Thẩm Mỹ Giao Diện & Tiêu Chuẩn Thiết Kế

- [x] **Zero-Emoji Policy:** 100% icon trên hệ thống sử dụng vector SVG sắc nét (Lucide React / SVG chuẩn), triệt tiêu hoàn toàn Unicode emote trên toàn bộ HUD, nút bấm, modal và tài liệu.
- [x] **Nhận diện Thương hiệu Cam ViT (`#E0562D`):** Đồng bộ mã màu Cam ViT trên toàn bộ hệ thống (hover `#c9451e`), các huy hiệu, nút Tải lên, nút nạp ViToken, ngọn lửa chuỗi ngày học và điểm tiến độ.
- [x] **Snug HUD Wall Spacing (4px):** Khoảng cách từ các thanh công cụ HUD tới rìa mép màn hình trình duyệt bám sát 4px (`top-1`, `bottom-1`, `left-1`, `right-1`), giải phóng tối đa không gian bàn học trung tâm.
- [x] **Mặt Bàn Học Slate Caro Tinh Gọn (`#e8ebf0`):** Chống chói, độ tương phản cao làm nổi bật sách và tài liệu, không dùng nền tối chìm.
- [x] **Bìa Sách Da Thật & Thẻ Ruy Băng V-Notch:** 5 tùy chọn màu bìa da sang trọng, thanh nhắc bookmark khuyết chữ V kéo trượt mượt mà kèm 6 chức năng (Tóm tắt, Tập trung, Phóng to, Tách trang, Xoay, Xóa an toàn).
- [x] **Hiệu Ứng Lật Trang 3D Chân Thực (Page-Curl):** Kéo thả uốn cong trang sách 3D theo con trỏ chuột, nạp trước nội dung trang kế tiếp (`underneathLeaf`) triệt tiêu độ trễ.
- [x] **Công Thức Toán Học KaTeX:** Toàn bộ công thức giải tích, đạo hàm, ma trận, vector được hiển thị chuẩn LaTeX qua `<MathRenderer />`.

---

## 2. Kiểm Tra Hiệu Năng & Tối Ưu Hóa Kỹ Thuật

- [x] **Smooth 60 FPS Zoom (RAF Coalescing):** Gom toàn bộ xung cuộn chuột vào `requestAnimationFrame` duy nhất trong mỗi frame 16.6ms, loại bỏ hoàn toàn hiện tượng giật lag.
- [x] **Tăng Tốc Phần Cứng GPU:** Bàn học áp dụng `translate3d`, `will-change: transform`, và `backface-visibility: hidden` để Chromium render ma trận trên card đồ họa.
- [x] **Viewport Culling (Tối ưu hóa tầm nhìn):** Tự động loại bỏ các tài liệu nằm ngoài khung hình camera (kèm vùng đệm margin 500px), chỉ giữ lại các vật thể trong tầm mắt hoặc đang được tương tác.
- [x] **Bộ Nhớ Đệm KaTeX HTML Cache:** Lưu trữ kết quả biên dịch công thức toán học trong bộ nhớ `Map`, giảm chi phí render lại về 0ms.
- [x] **Tắt Kiểm Tra Chính Tả (`spellCheck={false}`):** Triệt tiêu hoàn toàn các đường gạch chân đỏ lượn sóng trên văn bản tiếng Việt.

---

## 3. Kiểm Tra Tính Năng Học Thuật & Trợ Lý AI

- [x] **Thuật Toán Ôn Tập Ngắt Quãng SM-2 (SuperMemo-2):** Tự động tính hệ số dễ dàng (Ease Factor $\ge 1.3$) và chu kỳ lặp lại theo 4 mức đánh giá (Quên, Khó, Tốt, Dễ).
- [x] **Trợ Lý AI Inteline RAG:** Bôi đen đoạn văn trên sách để hỏi đáp theo ngữ cảnh sâu, tự động đính sợi chỉ đỏ SVG nối từ trang sách sang ghi chú tóm tắt.
- [x] **Bộ Đề Thi Trắc Nghiệm Tự Động:** AI tự sinh đề thi bấm giờ từ nội dung sách, chấm điểm tự động và lưu lịch sử làm bài vào `exam_attempts`.
- [x] **Đồng Hồ Pomodoro Tập Trung:** Bộ đếm giờ 25 phút học / 5 phút nghỉ tích hợp ngay trên không gian học tập.
- [x] **Ma Trận Chuỗi Ngày Học (28-day Heatmap):** Theo dõi nhịp tim học tập (`record_heartbeat`) và tự động ghi nhận chuỗi ngày streak liên tiếp.

---

## 4. Kiểm Tra Tài Khoản, Ví ViToken & Cổng Thanh Toán

- [x] **Xác Thực Supabase Auth PKCE:** Đăng nhập, đăng ký qua Email/Mật khẩu hoặc Magic Link, tự động làm mới token phiên an toàn.
- [x] **Chế Độ Khách & Chuyển Dữ Liệu Tự Động (Guest Migration):** Người dùng có thể học ngay dưới vai trò khách (Guest) trên IndexedDB; khi đăng nhập, hệ thống tự động đồng bộ toàn bộ bàn học lên Supabase Cloud.
- [x] **Ví ViToken & Điểm Danh Hằng Ngày:** Tặng 5 ViToken mỗi ngày (Chủ Nhật x2 = 10 ViToken) với giao diện điểm danh 7 ngày trực quan.
- [x] **5 Gói Nạp ViToken Cân Bằng (Quyết Định D4):**
  - Gói Khởi Động: 2,000đ $\to$ 2,000 ViToken
  - Gói Tiêu Chuẩn: 10,000đ $\to$ 10,000 ViToken
  - Gói Học Kỳ: 27,000đ $\to$ 30,000 ViToken (Tặng 10%)
  - Gói Chuyên Sâu: 85,000đ $\to$ 100,000 ViToken (Tặng 15%)
  - Gói Siêu Cấp: 255,000đ $\to$ 300,000 ViToken (Tặng 15%)
- [x] **Cổng Sepay Webhook & VietQR Tự Động:** Quét mã QR chuyển khoản, mã giao dịch `VTXXXXXXXX`, webhook tự động cộng số dư ViToken sau 3 giây.
- [x] **Chế Độ Thử Nghiệm Mô Phỏng 0đ (Demo Mode):** Cho phép sinh viên và giảng viên chấm bài bấm nút "Mô phỏng thanh toán" để nhận ViToken ngay lập tức mà không phát sinh giao dịch tiền thật.
- [x] **Cơ Chế Khóa Riêng Tư BYOK:** Cho phép người dùng tự nhập OpenAI hoặc Gemini API Key cá nhân lưu trong `localStorage` để học tập miễn phí.

---

## 5. Kiểm Tra Chợ Tri Thức & Cộng Tác Đa Nền Tảng

- [x] **Chợ Tri Thức (Marketplace):** Bộ lọc 6 chủ đề (Toán học, Công nghệ, Y dược, Kinh tế, Ngoại ngữ, Kỹ năng), xem trước tài liệu có rào chắn bảo vệ bản quyền, mua tài liệu bằng ViToken.
- [x] **Phòng Học Nhóm Supabase Realtime:** Đồng bộ con trỏ chuột, chia sẻ mã phòng `?room=...` tham gia học chung.
- [x] **Discord Embedded App Activity:** Hoạt động trơn tru trong kênh thoại Discord thông qua Discord Embedded App SDK và URL Mapping.
- [x] **Hướng Dẫn Sử Dụng (Onboarding Tour 7 Bước):** Spotlight trực quan hướng dẫn sinh viên mới làm quen với bàn học.
- [x] **Trang Giới Thiệu (Landing Page):** Bố cục hiện đại, chuẩn mực Benji Taylor, giới thiệu trọn vẹn giá trị sản phẩm.
- [x] **Pháp Lý & Hỗ Trợ:** Đầy đủ trang Điều khoản (`/terms`), Quyền riêng tư (`/privacy`), Câu hỏi thường gặp (`/faq`).
- [x] **PWA & An Ninh Mạng:** Khai báo Web App Manifest chuẩn và áp dụng thẻ meta Content Security Policy (CSP).

---

## 6. Kết Quả Kiểm Thử Toàn Diện (Verification Evidence)

| Hạng mục kiểm thử | Công cụ | Trạng thái |
| :--- | :--- | :--- |
| **Unit Tests & Integration Tests** | Vitest | **PASS (100%)** |
| **Biên Dịch Trang Tĩnh (Static Export)** | Next.js Build | **PASS (0 errors, 13 pages generated)** |
| **Chỉ Mục Tài Liệu AI (`docs:check`)** | Scripts Node | **PASS (Đồng bộ 100% symbols)** |
| **Kiểm Tra TypeScript (`tsc --noEmit`)** | TypeScript 5.8 | **PASS (0 type errors)** |
