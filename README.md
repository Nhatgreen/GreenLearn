# GreenLearn

> **Không gian học thức tích hợp AI 2.5D — Nền tảng học tập mở & 100% miễn phí.**

GreenLearn là không gian học tập trực quan trên trình duyệt, nơi người học mở sách, tài liệu PDF, bài thi trắc nghiệm, thẻ flashcard, nét vẽ ghi chú và giấy nháp trên cùng một mặt bàn 2.5D vô cực thay vì phải chuyển qua lại giữa nhiều cửa sổ hay tab rời rạc.

* **Trang chạy thực tế (Live Demo):** [https://nhatgreen.github.io/GreenLearn/](https://nhatgreen.github.io/GreenLearn/)
* **Kho mã nguồn:** [https://github.com/Nhatgreen/GreenLearn](https://github.com/Nhatgreen/GreenLearn)

---

## Ghi Nhận Nguồn Gốc & Tác Giả (Attribution)

GreenLearn được kế thừa và phát triển từ dự án đồ án nghiên cứu gốc **ViTudy** của tác giả **Lê Võ Thanh Nam** ([@namtacozz](https://github.com/namtacozz)).

Phiên bản **GreenLearn** thực hiện chuyển đổi toàn diện:
1. **100% Miễn Phí & Phi Lợi Nhuận:** Loại bỏ hoàn toàn cơ chế thu phí, cổng thanh toán SePay/VietQR, ví điểm và tiền ảo ViToken. Toàn bộ tính năng cao cấp đều mở tự do cho mọi người học.
2. **Chủ Quyền AI Trực Tiếp (BYOK):** Kết nối trực tiếp API Key OpenAI cá nhân từ trình duyệt đến `api.openai.com`, lưu an toàn tại `localStorage`, không chuyển tiếp qua máy chủ trung gian.
3. **Thú Cưng Đồng Hành Mầm Xanh:** Bổ sung hệ sinh thái thú cưng học tập với 5 cấp độ tiến hóa và 5 trạng thái say giấc theo chuỗi ngày học tập thực tế (Streak).
4. **Quản Lý Bộ Nhớ Ngoại Tuyến (Storage Manager):** Giám sát trực quan dung lượng trình duyệt, cảnh báo tài liệu quá hạn và hỗ trợ sao lưu toàn bộ bàn học ra tệp JSON.
5. **Triển Khai Tĩnh Độc Lập:** Tối ưu hóa Static Export 100% tương thích GitHub Pages (`basePath: /GreenLearn`).

---

## Tính Năng Chính

### 1. Mặt Bàn Học Vô Tận 2.5D (Infinite Desk)
* Di chuyển góc nhìn tự do bằng cách kéo chuột hoặc phím điều hướng `W`, `A`, `S`, `D`.
* Phóng to, thu nhỏ mượt mà từ 30% đến 300% với cơ chế gộp sự kiện qua `requestAnimationFrame` và tăng tốc phần cứng GPU, duy trì khung hình 60 fps ổn định.
* Bản đồ thu nhỏ (Minimap) hỗ trợ định vị trực quan các cuốn sách trên bàn và dịch chuyển nhanh tầm nhìn.

### 2. Sách & Tài Liệu Mở Đôi 2.5D Đích Thực
* Trích xuất trung thực từng trang PDF gốc độ phân giải cao thông qua Canvas và PDF.js, loại bỏ hoàn toàn văn bản giả lập.
* Hiệu ứng lật trang 3D mượt mà kèm cơ chế nạp trước trang kế tiếp giúp triệt tiêu độ trễ hiển thị.
* Hiển thị công thức toán học, vật lý sắc nét với KaTeX có bộ nhớ đệm cache HTML.
* Hỗ trợ tách trang tài liệu thành tờ giấy đơn rời để đối chiếu trực tiếp khi làm bài.

### 3. Bút Vẽ & Ghi Chú Bám Dính Tọa Độ Cục Bộ
* Công cụ bút mực và bút dạ quang cho phép viết, vẽ trực tiếp trên mặt bàn học hoặc bề mặt tài liệu.
* Nét mực vẽ trên tài liệu tự động chuyển đổi sang hệ tọa độ cục bộ, luôn bám chặt và di chuyển, xoay chuẩn xác theo tài liệu khi kéo thả.
* Giấy ghi chú nhiều màu sắc kèm sợi chỉ nối tư duy liên kết các tài liệu với nhau.

### 4. Ôn Tập SuperMemo SM-2 & Đề Thi Trắc Nghiệm 3D
* Thẻ bài thi trắc nghiệm lật 3D hai mặt: mặt trước làm bài và chấm điểm tức thì, mặt sau hiển thị bảng giải thích chi tiết từng câu.
* Hệ thống thẻ ghi nhớ (Flashcard) tích hợp thuật toán lặp lại ngắt quãng SuperMemo SM-2 tự động tính toán chu kỳ ôn tập tối ưu.

### 5. Thú Cưng Học Tập Mầm Xanh (Pet Mascot Evolution)
* Thú cưng đồng hành phát triển qua 5 cấp độ tiến hóa dựa trên chuỗi ngày học tập liên tục (Streak):
  * **Cấp 1 (1-2 ngày):** Hạt Giống Xanh — Mầm Mới Nhú
  * **Cấp 2 (3-6 ngày):** Chồi Non Tri Thức — Chồi Non Bỡ Ngỡ
  * **Cấp 3 (7-13 ngày):** Cây Xanh Tinh Anh — Vươn Mình Tỏa Sáng
  * **Cấp 4 (14-29 ngày):** Tinh Linh Học Thuật — Hộ Vệ Bàn Học
  * **Cấp 5 (30+ ngày):** Vị Thần Cổ Thụ — Bậc Thầy Tri Thức
* Tự động chuyển đổi giữa dáng thức tỉnh hoạt bát và dáng say giấc ngủ đông khi bị gián đoạn chuỗi ngày.
* Người học có thể đổi tên thú cưng, xem thư viện 5 cấp độ và tự động tích lũy thời gian học trên bàn học (3 phút học tập tự động đánh thức thú cưng).

### 6. Trợ Lý AI OpenAI BYOK Trực Tiếp
* Hỗ trợ đầy đủ các mô hình tiên tiến nhất của OpenAI: `gpt-4o-mini`, `gpt-4o`, `o3-mini`, `gpt-4-turbo`.
* Trực tiếp gọi API OpenAI từ máy khách (`https://api.openai.com/v1/chat/completions`) với cơ chế AbortController ngắt sau 30 giây và cắt ngắn ngữ cảnh 6.000 ký tự chống tràn token.
* Khóa API được lưu trữ độc quyền trong `localStorage` (`greenlearn_byok_openai`) của trình duyệt người dùng.

### 7. Trình Quản Lý Bộ Nhớ & Sao Lưu (Storage Manager)
* Đo lường chính xác dung lượng lưu trữ trình duyệt (`navigator.storage.estimate()`).
* Phát hiện và liệt kê danh sách tài liệu cũ không mở quá 30 ngày.
* Hỗ trợ tải về bản sao lưu tệp JSON của từng tài liệu hoặc xuất toàn bộ dữ liệu bàn học để chuyển đổi giữa các thiết bị.

### 8. Học Nhóm Trực Tuyến & Discord Activity
* Chia sẻ liên kết mời bạn bè cùng học, đồng bộ con trỏ chuột thời gian thực (throttled 60ms) qua Supabase Realtime Broadcast.
* Sẵn sàng khởi chạy trực tiếp dưới dạng Discord Embedded App Activity trong các phòng thoại Discord.

---

## Công Nghệ Sử Dụng

* **Giao diện & Ứng dụng:** Next.js 15 (App Router, Static Export), React 19, TypeScript, Tailwind CSS, Lucide Icons, KaTeX, Twemoji Vector SVG.
* **Xử lý PDF & Canvas:** PDF.js, HTML5 Canvas Overlay.
* **Đồng bộ thời gian thực & CSDL:** Supabase (Auth PKCE, PostgreSQL RLS, Realtime Broadcast, Storage).
* **AI Engine:** Direct Client-side OpenAI API (Fetch API + AbortController).
* **Nền tảng nhúng:** Discord Embedded App SDK (`@discord/embedded-app-sdk`).
* **Kiểm thử tự động:** Vitest (16 test suites, 64 unit tests).

---

## Hướng Dẫn Cài Đặt & Chạy Cục Bộ

### Yêu Cầu Hệ Thống
* Node.js phiên bản 20 trở lên.
* pnpm (phiên bản 9 hoặc 10).

### Các Bước Cài Đặt

1. Sao chép mã nguồn về máy:
```bash
git clone https://github.com/Nhatgreen/GreenLearn.git
cd GreenLearn
```

2. Cài đặt các gói phụ thuộc:
```bash
pnpm install
```

3. Cấu hình biến môi trường:
Tạo file `.env.local` tại thư mục gốc của dự án:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_BASE_PATH=
```

4. Chạy máy chủ phát triển (development server):
```bash
pnpm dev
```
Mở trình duyệt tại địa chỉ `http://localhost:3000` để trải nghiệm.

5. Chạy kiểm thử tự động:
```bash
pnpm test
```

6. Đóng gói bản tĩnh (Static Export) cho GitHub Pages:
```bash
pnpm run build:pages
```
Các file tĩnh kèm file `.nojekyll` sẽ được tạo trong thư mục `out/`.

---

## Hướng Dẫn Cấu Hình OpenAI BYOK

1. Đăng nhập vào [OpenAI Platform](https://platform.openai.com/api-keys).
2. Tạo một API Key mới (bắt đầu bằng `sk-...`).
3. Trên giao diện GreenLearn, nhấp vào biểu tượng Bot AI ở góc trên bên phải hoặc vào mục **Tài khoản** -> **Khóa AI của riêng bạn**.
4. Dán API Key vào ô nhập và nhấp **Kiểm tra kết nối** để xác nhận kết nối thành công.
5. Khóa được lưu trực tiếp trên trình duyệt của bạn và chỉ gửi thẳng đến máy chủ OpenAI khi bạn yêu cầu hỏi đáp hoặc tóm tắt.

---

## Giấy Phép & Đóng Góp

Dự án được phát hành theo giấy phép **MIT License**. Mọi đóng góp cải tiến, báo lỗi và tính năng mới từ cộng đồng luôn được hoan nghênh qua GitHub Pull Requests.
