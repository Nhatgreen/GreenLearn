# Chốt Sổ Quyết Định D1–D7 (08/11/2026)

**Bối cảnh chốt:** ViTudy là đồ án học thuật. "Thương mại" nghĩa là **làm đủ chức năng và luồng như sản phẩm thật để thuyết trình**, nhưng **không bán và không thu tiền của công chúng**. Không có ngân sách. Trạng thái: **ĐÃ CHỐT, CHƯA THỰC THI** (chờ lệnh).

| Mã | Quyết định cuối | Hệ quả lên plan |
|---|---|---|
| **D1** | **Không mua domain.** Dùng GitHub Pages miễn phí. Riêng Discord Activity cần app nằm ở gốc `/` của một host → dùng **user site** `https://namtacozz.github.io/` (`basePath` rỗng). Cách làm mặc định: đổi tên repo `ViTudy` thành `namtacozz.github.io`. Phương án thay thế (nếu muốn giữ tên repo): repo thứ hai `namtacozz.github.io` làm nơi deploy, workflow đẩy `out/` sang bằng PAT lưu trong GitHub Secrets. Mọi plan khác không phụ thuộc quyết định này. | Plan 04 hết bị chặn. Plan 00 Task 0: `basePath` đọc từ env (rỗng cho user site). Redirect URL Supabase/Discord dùng `https://namtacozz.github.io/...`. |
| **D2** | **Có 2 dự án Supabase (staging + prod), dùng gói Free.** Không mua Pro. | Phải chấp nhận: dự án Free **tự tạm dừng sau ~1 tuần không hoạt động** và **không có sao lưu tự động**. Thêm vào `LAUNCH_CHECKLIST`: (1) mở lại dự án và smoke test trước ngày báo cáo; (2) xuất DB bằng `supabase db dump` lưu vào máy sau mỗi mốc lớn; (3) kiểm tra hạn mức Edge Function/băng thông Free. |
| **D3** | **Bật chế độ ChatGPT OAuth (`codex_cli_rs`).** Mặc định `NEXT_PUBLIC_ENABLE_CODEX_OAUTH=true`. | Giữ cờ để tắt nhanh. Chạy qua Edge Function `ai-chat` (trình duyệt gọi trực tiếp sẽ bị CORS). Token OAuth **chỉ lưu trên thiết bị** như BYOK, không lưu server. Ghi rõ trong tài liệu và UI: đây là cơ chế không chính thức, có thể ngừng hoạt động bất cứ lúc nào; luôn có nhánh dự phòng sang chế độ `system`/Gemini để buổi thuyết trình không phụ thuộc vào nó. |
| **D4** | **Bảng giá cân bằng** (bên dưới). | Seed vào `ai_model_costs` (02a Task A.4) và `vitoken_packages` (Plan 03 Task 3.1). |
| **D5** | **Quà 50 ViToken chỉ cấp sau khi xác minh email** (như đề xuất). | Plan 01 Task 1.4 (đã có). |
| **D6** | **Chế độ trình diễn (demo mode), không thu tiền công chúng.** Luồng VietQR + Sepay + webhook vẫn **làm đủ và chạy thật từ đầu đến cuối**, nhưng chỉ dùng với tài khoản/ngân hàng của chính bạn hoặc giả lập. Không cần đăng ký kinh doanh, kê khai thuế, hay luật sư (các mục này chuyển thành "Không áp dụng — dự án học thuật"). | Thêm vào Plan 03 một gói thử giá nhỏ và nút giả lập thanh toán cho admin (để demo không cần chuyển tiền thật). Thêm biểu ngữ "Bản trình diễn học thuật — không thu phí thật" trên Landing, modal nạp và footer. Trang pháp lý (Plan 07) vẫn có nhưng ghi rõ phạm vi đồ án. |
| **D7** | **Điểm danh dựa trên heartbeat phía server** (`study_sessions`). | Plan 05 Task 5B.2 (đã có). |

## D4 — Bảng giá đề xuất

**Giả định:** 1 USD ≈ 25.500đ. Một lượt Inteline ≈ 2.000 token vào + 500 token ra.

| Model | Chi phí thật / lượt | Giá bán | Ghi chú |
|---|---|---|---|
| `gpt-4o-mini` | ≈ 15đ | **1 ViToken** (≈ 200đ) | Mặc định cho chế độ `system` |
| `gemini-1.5-flash` | ≈ 8đ | **1 ViToken** | Kiểm tra tên model còn hiệu lực lúc thực thi; bảng nằm trong DB nên đổi được không cần deploy lại |
| `gpt-4o` | ≈ 250đ (tối đa ≈ 400đ) | **4 ViToken** (≈ 800đ) | Đủ bù cả khi ngữ cảnh dài |

**Giới hạn bảo vệ ngân sách (chế độ `system`):** 20 lượt/giờ và 60 lượt/ngày mỗi người; tổng `prompt + context` ≤ 12.000 ký tự; `max_tokens` đầu ra ≤ 800. Chế độ BYOK/OAuth dùng key của chính người dùng nên không trừ ViToken.

**Gói nạp** (1 ViToken = 200đ, giảm theo số lượng):

| Gói | ViToken | Giá |
|---|---|---|
| Thử nghiệm (`demo`) | 10 | 2.000đ |
| Cơ bản | 50 | 10.000đ |
| Tiêu chuẩn | 150 | 27.000đ (−10%) |
| Cao cấp | 500 | 85.000đ (−15%) |
| VIP | 1.500 | 255.000đ (−15%) |

**Kinh tế vi mô (để trả lời giảng viên):**
- Quà đăng ký 50 ViToken ≈ 50 lượt `gpt-4o-mini` ≈ chi phí thật khoảng 750đ/người dùng mới.
- Điểm danh thưởng 2–10 ViToken/ngày (giữ nguyên); điều kiện ≥ 180 giây hoạt động (D7).
- Giá chợ tài liệu giữ 5/15/30/50 ViToken (≈ 1.000–10.000đ); tác giả nhận 85%.

## Việc còn lại cho chủ dự án (không phải agent)

1. Đổi tên repo thành `namtacozz.github.io` **khi bắt đầu Plan 04** (hoặc chọn phương án repo thứ hai).
2. Tạo 2 dự án Supabase Free (staging, prod).
3. Đăng ký tài khoản Sepay và liên kết 1 tài khoản ngân hàng cá nhân **chỉ để demo** (nếu muốn demo chuyển tiền thật); nếu không, dùng nút giả lập.
4. Tạo Discord Application (miễn phí).
5. Lấy OpenAI API key (chế độ `system` cần một khoản nhỏ; ước tính vài chục nghìn đồng đủ cho buổi demo) và/hoặc dùng Gemini key miễn phí cho `system`.
