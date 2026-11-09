# ViTudy

ViTudy là không gian học tập trực quan trên trình duyệt, nơi người học mở sách, tài liệu PDF, ghi chú và giấy nháp trên cùng một mặt bàn thay vì phải chuyển qua lại giữa nhiều cửa sổ hay tab khác nhau.

Trang chạy thực tế (Live Demo): https://namtacozz.github.io/ViTudy/

---

## Tính năng chính

### 1. Mặt bàn học vô tận (Infinite Workspace)
- Di chuyển góc nhìn bằng cách giữ chuột trái kéo mặt bàn hoặc bấm các phím W, A, S, D và 4 phím mũi tên.
- Phóng to, thu nhỏ mượt mà bằng con lăn chuột với cơ chế gom sự kiện qua requestAnimationFrame và tăng tốc phần cứng GPU, giữ khung hình ổn định 60 fps.
- Bản đồ thu nhỏ (Minimap) ở góc dưới bên phải hỗ trợ quan sát tổng thể vị trí các tài liệu và nhấp chuột để chuyển nhanh tầm nhìn.

### 2. Sách và tài liệu mở đôi 2.5D
- Giao diện sách mở hai trang với bìa da nâu và các thanh nhắc đánh dấu dạng chữ V khuyết (bookmark tabs) bên rìa phải: Tóm tắt, Tập trung đọc, Phóng to toàn màn hình, Tách trang thành tờ rời, Xoay góc tự do và Đổi màu bìa da.
- Hiệu ứng lật trang 3D uốn cong theo thao tác kéo chuột thực tế, mặt giấy bên dưới được nạp sẵn nội dung trang kế tiếp để triệt tiêu độ trễ hiển thị.
- Hiển thị công thức toán học, vật lý bằng KaTeX có bộ nhớ đệm cache HTML giúp giảm thời gian xử lý khi cuộn trang.
- Tách trang tài liệu đang đọc thành tờ giấy đơn rời để đặt cạnh sách và đối chiếu trực tiếp khi làm bài.

### 3. Bút vẽ và ghi chú gắn trên tài liệu
- Công cụ bút mực và bút dạ quang hỗ trợ viết, vẽ trực tiếp trên mặt bàn học hoặc lên bề mặt sách, tờ giấy và giấy ghi chú.
- Nét mực vẽ trên tài liệu tự động chuyển đổi sang hệ tọa độ cục bộ của tài liệu đó, luôn bám chặt và di chuyển, xoay chuẩn xác theo tài liệu khi kéo thả.
- Giấy ghi chú nhiều màu sắc, hỗ trợ ghi chú nhanh và nối sợi chỉ đỏ có đinh ghim để đánh dấu mối liên hệ giữa các tài liệu.

### 4. Công cụ ôn tập và trắc nghiệm
- Công cụ STudy trích xuất nội dung văn bản thành bản tóm tắt, thẻ ghi nhớ (flashcard) và bộ câu hỏi trắc nghiệm ôn tập.
- Thẻ bài thi trắc nghiệm hỗ trợ lật 3D hai mặt: mặt trước làm bài và chấm điểm tức thì, mặt sau xem lại bảng giải thích chi tiết từng câu.
- Hệ thống flashcard hỗ trợ thuật toán lặp lại ngắt quãng (SuperMemo SM-2) để theo dõi mức độ ghi nhớ theo chu kỳ ngày.

### 5. Đồng hồ Pomodoro và chuỗi học tập
- Đồng hồ đếm giờ học tập và khoảng nghỉ ngắn, nghỉ dài theo phương pháp Pomodoro.
- Ghi nhận chuỗi ngày học tập liên tục (Streak) với biểu tượng ngọn lửa trên thanh công cụ ví tiền.
- Lưu trữ lịch sử học tập và thống kê thời gian tập trung hàng ngày.

### 6. Trợ lý học tập và chế độ BYOK (Bring Your Own Key)
- Tích hợp công cụ giải đáp học tập ngay trong giao diện bàn học.
- Cho phép người dùng nhập API key cá nhân (OpenAI, Anthropic Claude, Google Gemini) trực tiếp trên trình duyệt. Khóa API được mã hóa và lưu trữ cục bộ tại localStorage của người dùng, không gửi qua máy chủ trung gian.

### 7. Chợ tài liệu và nạp ViToken
- Người học có thể chia sẻ tài liệu tự biên soạn lên Chợ hoặc tải tài liệu của người khác về mặt bàn bằng ViToken.
- Nạp ViToken tự động qua mã VietQR sử dụng cổng thanh toán SePay.
- Chế độ kiểm thử đồ án cung cấp nút nạp thử nghiệm 50 ViToken (0đ) để giảng viên và người đánh giá trải nghiệm đầy đủ các tính năng mà không cần thanh toán thật.

### 8. Học nhóm và tích hợp Discord Activity
- Tạo phòng học nhóm bằng liên kết mời bạn bè, đồng bộ góc nhìn và con trỏ chuột thời gian thực qua Supabase Realtime.
- Sẵn sàng khởi chạy dưới dạng Discord Activity trong các kênh thoại thông qua Discord Embedded App SDK.

---

## Công nghệ sử dụng

- Giao diện: Next.js 15 (App Router, Static Export), React 19, TypeScript, Tailwind CSS, Lucide Icons, KaTeX.
- Dữ liệu và xác thực: Supabase (Auth PKCE, PostgreSQL RLS, Realtime Broadcast, Storage).
- Lưu trữ cục bộ: IndexedDB (idb) và localStorage hỗ trợ chế độ khách trải nghiệm offline trước khi đăng nhập.
- Thanh toán: VietQR và Webhook SePay.
- Nền tảng nhúng: Discord Embedded App SDK.
- Kiểm thử: Vitest (14 test suites, 34 unit và component tests).

---

## Hướng dẫn cài đặt và chạy cục bộ

### Yêu cầu hệ thống
- Node.js phiên bản 20 trở lên.
- pnpm (phiên bản 9 hoặc 10).

### Các bước cài đặt

1. Sao chép mã nguồn về máy:
```bash
git clone https://github.com/namtacozz/ViTudy.git
cd ViTudy
```

2. Cài đặt các gói phụ thuộc:
```bash
pnpm install
```

3. Cấu hình biến môi trường:
Tạo file `.env.local` tại thư mục gốc của dự án với các thông tin:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_BASE_PATH=
```

4. Chạy máy chủ phát triển (development server):
```bash
pnpm dev
```
Mở trình duyệt tại địa chỉ `http://localhost:3000` để xem ứng dụng.

5. Chạy kiểm thử tự động:
```bash
pnpm test
```

6. Đóng gói bản tĩnh cho GitHub Pages:
```bash
pnpm run build:pages
```
Các file tĩnh sẽ được xuất ra thư mục `out/` kèm theo file `.nojekyll`.

---

## Triển khai lên GitHub Pages

Dự án đã được cấu hình quy trình tự động qua GitHub Actions tại `.github/workflows/deploy.yml`. Khi có commit mới được đẩy lên nhánh `main`:
1. GitHub Actions tự động cài đặt các phụ thuộc và biên dịch tĩnh với biến `GITHUB_PAGES=true` và `NEXT_PUBLIC_BASE_PATH=/ViTudy`.
2. Bản xuất bản trong thư mục `out/` được tải lên môi trường GitHub Pages tại địa chỉ:
   `https://namtacozz.github.io/ViTudy/`

---

## Giấy phép

Dự án được phát triển phục vụ mục đích học tập, nghiên cứu và báo cáo đồ án học thuật.
