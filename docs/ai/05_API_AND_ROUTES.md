# 05_API_AND_ROUTES.md — Tuyến Điều Hướng & Cổng API ViTudy

> **Commit Hash:** `74d4cc0`  
> **Cập nhật lần cuối:** `2026-11-07`

---

## 1. Tuyến Giao Diện (Application Pages)

### 1. `GET /` — Trang Chính Bàn Học Tương Tác 2.5D
* **Vị trí file:** [`src/app/page.tsx`](file:///F:/AppMaking/ViTudy/src/app/page.tsx) (`StudySpacePage`)
* **Loại Route:** Client Page (với Next.js dynamic import `ssr: false`).
* **Yêu cầu xác thực:** Không bắt buộc (cho phép khách trải nghiệm ngay trên bàn học demo kèm `GuestBanner`).
* **Hành vi đáp ứng:**
  * Nếu màn hình $\ge 768\text{px}$: Tải giao diện bàn học vô cực 2.5D [`StudySpaceDeskView`](file:///F:/AppMaking/ViTudy/src/components/canvas/StudySpaceDeskView.tsx).
  * Nếu màn hình $< 768\text{px}$: Chuyển sang chế độ xem phụ trợ di động [`MobileCompanionView`](file:///F:/AppMaking/ViTudy/src/components/mobile/MobileCompanionView.tsx).

### 2. `GET /auth` — Trang Đăng Nhập / Đăng Ký Tài Khoản
* **Vị trí file:** [`src/app/auth/page.tsx`](file:///F:/AppMaking/ViTudy/src/app/auth/page.tsx) (`AuthPage`)
* **Loại Route:** Client Page.
* **Tính năng:** Đăng nhập, đăng ký bằng email+mật khẩu hoặc OAuth (Google, Discord). Tự động điều hướng về `/` nếu đã có phiên đăng nhập.

### 3. `GET /auth/callback` — Trang Xử Lý Phản Hồi OAuth PKCE
* **Vị trí file:** [`src/app/auth/callback/page.tsx`](file:///F:/AppMaking/ViTudy/src/app/auth/callback/page.tsx) (`AuthCallbackPage`)
* **Loại Route:** Client Page.
* **Tính năng:** Tiếp nhận mã `code` từ Supabase OAuth, gọi `exchangeCodeForSession` an toàn trên trình duyệt và điều hướng về bàn học.

### 4. `GET /profile` — Trang Quản Lý Hồ Sơ & Tài Khoản
* **Vị trí file:** [`src/app/profile/page.tsx`](file:///F:/AppMaking/ViTudy/src/app/profile/page.tsx) (`ProfilePage`)
* **Loại Route:** Client Page (Guard: chuyển về `/auth` nếu đang ở trạng thái guest).
* **Tính năng:** Cập nhật họ tên, upload ảnh đại diện (Storage bucket `avatars`), quản lý khóa BYOK AI cục bộ, đăng xuất và xóa tài khoản vĩnh viễn.

### 5. `GET /dashboard` — Trang Thống Kê Học Tập & Lịch Sử Hoạt Động
* **Vị trí file:** [`src/app/dashboard/page.tsx`](file:///F:/AppMaking/ViTudy/src/app/dashboard/page.tsx) (`DashboardPage`)
* **Loại Route:** Client Page (Guard: chuyển về `/auth` nếu đang ở trạng thái guest).
* **Tính năng:** Thống kê tổng số phút học trong tuần, điểm thi trung bình từ `exam_attempts`, ma trận hoạt động 28 ngày qua `study_sessions`, và sổ cái lịch sử giao dịch ViToken.

### 6. `GET /market` — Trang Duyệt & Mua Tài Liệu Chợ KnowInherit
* **Vị trí file:** [`src/app/market/page.tsx`](file:///F:/AppMaking/ViTudy/src/app/market/page.tsx) (`MarketPage`)
* **Loại Route:** Client Page.
* **Tính năng:** Danh mục toàn diện các tài liệu phân loại theo Hạng C/B/A/S, tìm kiếm theo từ khóa, lọc theo chủ đề, xem trước đoạn trích bảo mật và mua trực tiếp bằng ViToken.

---

## 2. Tuyến API Backend & AI Gateway (Supabase Edge Functions)

> **Lưu ý kiến trúc:** Để hỗ trợ triển khai Static Export 100% trên GitHub Pages không có server Node.js, Next.js API Route nội bộ `/api/ai/chat` đã được thay thế hoàn toàn bằng **Supabase Edge Function** (`functions/v1/ai-chat`). Client gọi thông qua module [`src/lib/aiClient.ts`](file:///F:/AppMaking/ViTudy/src/lib/aiClient.ts) (`askAi`).

### 1. `POST {SUPABASE_URL}/functions/v1/ai-chat` — Supabase AI Gateway Function
* **Vị trí file:** `supabase/functions/ai-chat/index.ts`
* **Client caller:** [`src/lib/aiClient.ts:askAi`](file:///F:/AppMaking/ViTudy/src/lib/aiClient.ts)
* **Yêu cầu xác thực:** JWT Bearer qua header `Authorization: Bearer <supabase_jwt>`.
* **Bảo vệ & Giới hạn:**
  * Rate limit cấp server: 20 lượt/giờ (`ai_chat_hour`) và 60 lượt/ngày (`ai_chat_day`).
  * Trừ ViToken tự động qua Postgres RPC `debit_vitoken` đối với chế độ `system`.
  * Tự động hoàn token qua `credit_vitoken` (loại `refund`) nếu nhà cung cấp AI gặp lỗi.
  * Giới hạn prompt + context $\le 12.000$ ký tự, output $\le 800$ tokens.

#### Định Dạng Dữ Liệu Đầu Vào (Request Payload)
```typescript
{
  provider: 'system' | 'byok_openai' | 'byok_gemini' | 'oauth_chatgpt';
  model?: string;        // Ví dụ: 'gpt-4o-mini', 'gpt-4o', 'gemini-1.5-flash'
  prompt: string;        // Câu hỏi hoặc yêu cầu của người học (Bắt buộc)
  context?: string;       // Đoạn trích dẫn tài liệu đang bôi đen hoặc nội dung trang sách
  apiKey?: string;        // Khoá cá nhân khi dùng chế độ BYOK
  accessToken?: string;   // Token xác thực OAuth khi dùng ChatGPT Plus/Team
}
```

#### Định Dạng Dữ Liệu Trả Về (Success Response)
```typescript
{
  reply: string;          // Lời giải thích, tóm tắt hoặc câu trả lời từ mô hình AI
  provider: string;       // Nhà cung cấp đã xử lý yêu cầu
  isSimulation?: boolean; // true nếu đang chạy ở chế độ dev mô phỏng không tốn key
}
```

#### Định Dạng Lỗi (Error Responses)
* `400 Bad Request`: `{"error": "Thiếu nội dung câu hỏi (prompt)"}`.
* `401 Unauthorized`: `{"error": "Chưa có Token đăng nhập ChatGPT OAuth..."}` hoặc `{"error": "Chưa nhập Google Gemini API Key"}`.
* `502 Bad Gateway`: Lỗi kết nối tới endpoint bên thứ ba (`ChatGPT Codex Gateway`, `Gemini API`, `OpenAI API`).
* `500 Internal Server Error`: Lỗi ngoại lệ hệ thống gateway.

#### Dịch Vụ Bên Ngoài Được Gọi (External Endpoints)
1. **ChatGPT Codex Backend (SRS 3.2 Chế độ 3):**
   * URL: `https://chatgpt.com/backend-api/codex/responses`
   * Headers: `Authorization: Bearer <token>`, `originator: codex_cli_rs`, `User-Agent: codex-cli/0.1.0`
   * Model: `gpt-4o`
2. **Google Gemini REST API (SRS 3.2 Chế độ 2):**
   * URL: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}`
   * Model: `gemini-1.5-flash`
3. **OpenAI Official API (SRS 3.2 Chế độ 1 & BYOK):**
   * URL: `https://api.openai.com/v1/chat/completions`

### 2. `POST {SUPABASE_URL}/functions/v1/delete-user` — Xoá Tài Khoản An Toàn
* **Vị trí file:** `supabase/functions/delete-user/index.ts`
* **Yêu cầu xác thực:** JWT Bearer qua header `Authorization`.
* **Hành vi:** Thu hồi quyền, xoá tài nguyên file trong Storage (`avatars/{uid}`, `documents/{uid}`), gọi `auth.admin.deleteUser` thực hiện xoá vĩnh viễn và kích hoạt `ON DELETE CASCADE` trên PostgreSQL.

### 3. `POST {SUPABASE_URL}/functions/v1/sepay-webhook` — Cổng Nhận Webhook VietQR Sepay
* **Vị trí file:** `supabase/functions/sepay-webhook/index.ts`
* **Xác thực:** `Authorization: Apikey <SEPAY_API_KEY>` (khớp với biến môi trường `SEPAY_API_KEY`).
* **Không yêu cầu:** JWT Bearer (chạy với cờ `--no-verify-jwt` của Supabase Edge Runtime).
* **Payload nhận:** Webhook chuẩn từ Sepay (`id`, `gateway`, `transactionDate`, `accountNumber`, `code`, `content`, `transferType`, `transferAmount`, `accumulated`, `referenceCode`, `description`).
* **Hành vi xử lý:**
  * Trích xuất mã giao dịch dạng `VT` + 8 ký tự alphanumeric (từ trường `code` hoặc regex trên `content`/`description`).
  * Gọi RPC `apply_payment` (`SECURITY DEFINER`) thực hiện kiểm tra `app_settings.demo_mode`, trạng thái đơn, so khớp số tiền, cộng ViToken qua `credit_vitoken`, cập nhật `payment_requests.status = 'completed'` (hoặc `completed_late`).
  * Nếu không tìm thấy đơn hoặc số tiền chênh lệch, lưu vào bảng `unmatched_payments` để đối soát thủ công.
  * Phản hồi `{ success: true, code, status }` với HTTP 200.

### 4. `POST {SUPABASE_URL}/functions/v1/discord-auth` — Xác Thực Discord Activity PKCE
* **Vị trí file:** `supabase/functions/discord-auth/index.ts`
* **Không yêu cầu:** JWT Bearer (chạy với cờ `--no-verify-jwt` của Supabase Edge Runtime).
* **Payload nhận:** `{ code: string }` lấy từ `DiscordSDK.commands.authorize()`.
* **Hành vi xử lý:**
  * Gọi endpoint Discord OAuth2 đổi `code` lấy `access_token` bằng `DISCORD_CLIENT_SECRET`.
  * Truy vấn `GET https://discord.com/api/users/@me` để lấy danh tính thật của người dùng (`id`, `username`, `avatar`, `email`, `verified`).
  * Tìm kiếm theo `profiles.discord_id`. Nếu chưa có, gộp vào tài khoản có email trùng (nếu email Discord đã xác minh) hoặc tạo người dùng Supabase mới.
  * Sinh magic link `token_hash` qua Supabase Auth Admin API và trả về client để thực hiện `supabase.auth.verifyOtp()`.
  * Phản hồi `{ token_hash: string, email: string, discord_id: string }`.
