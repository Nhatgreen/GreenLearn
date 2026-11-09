# SỔ TAY VẬN HÀNH & TRIỂN KHAI VITUDY (DEPLOY RUNBOOK)

> **Tài liệu hướng dẫn triển khai toàn diện hệ thống ViTudy**  
> Dành cho giảng viên chấm điểm đồ án, ban giám khảo và đội ngũ vận hành.

---

## 1. Tổng Quan Kiến Trúc Triển Khai

```
┌────────────────────────────────────────────────────────┐
│               Trình Duyệt Người Dùng (Client)          │
│       Next.js Static Export (GitHub Pages / Vercel)    │
│            URL: https://namtacozz.github.io/           │
└──────────────┬─────────────────────────┬───────────────┘
               │                         │
       REST / Realtime WSS               │ HTTPS Webhook / RPC
               │                         │
┌──────────────▼─────────────────────────▼───────────────┐
│                    SUPABASE CLOUD                      │
│  • Auth: PKCE Flow (Email / Discord OAuth)             │
│  • Database: PostgreSQL 15 + Row Level Security (RLS)  │
│  • Realtime: Đồng bộ con trỏ chuột & phòng học nhóm    │
│  • Edge Functions (Deno Runtime):                      │
│      ├── ai-gateway     (Proxy Gemini & Rate Limit)    │
│      ├── sepay-webhook  (Tiếp nhận thanh toán VietQR)  │
│      └── discord-auth   (Trao đổi mã Discord Activity) │
└──────────────┬─────────────────────────┬───────────────┘
               │                         │
       Google Gemini API          Sepay Webhook Gateway
 (gemini-2.5-flash / BYOK)      (Tự động cộng ViToken 3s)
```

---

## 2. Chuẩn Bị Biến Môi Trường (Environment Variables)

Tạo hoặc cập nhật file `.env.local` ở thư mục gốc của dự án:

```bash
# ================= SUPABASE PUBLIC CONFIG =================
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ================= GITHUB PAGES BASE PATH =================
# Để trống nếu chạy localhost hoặc custom domain; đặt / khi deploy GitHub Pages
NEXT_PUBLIC_BASE_PATH=

# ================= AI GATEWAY & DISCORD CONFIG =================
# Supabase Edge Functions Secrets (cấu hình qua supabase secrets set)
GEMINI_API_KEY=<your-gemini-api-key>
SEPAY_API_KEY=KDF8FCOKEG3KPUF890MHNXJHG1PW0VPYWJU6NNBRODVGZKS6MOAZMLJCLO5SRG2S
DISCORD_CLIENT_ID=<your-discord-app-id>
DISCORD_CLIENT_SECRET=<your-discord-client-secret>
```

---

## 3. Triển Khai Cơ Sở Dữ Liệu Supabase

### 3.1. Chạy Migrations SQL theo thứ tự
Đăng nhập vào Supabase Dashboard $\to$ SQL Editor, hoặc dùng Supabase CLI:

```bash
# Áp dụng lần lượt các migration đã chuẩn hóa trong thư mục supabase/migrations/
supabase db push
```

Thứ tự các tệp migration:
1. `0001_initial_schema.sql` — Hồ sơ người dùng, bàn học, vật thể, đường nối dây
2. `0002_rls_policies.sql` — Chính sách bảo mật hàng (Row-Level Security)
3. `0003_vitoken_wallet.sql` — Ví ViToken, điểm danh hằng ngày và lịch sử giao dịch
4. `0004_ai_gateway.sql` — Bảng kiểm soát hạn mức suy luận và RPC khấu trừ
5. `0005_payments.sql` — Cổng thanh toán VietQR, bảng gói ViToken và Sepay Webhook RPC
6. `0006_discord.sql` — Liên kết Discord ID và phòng hoạt động Activity
7. `0007_performance.sql` — Chỉ mục hiệu năng B-Tree cho các truy vấn thời gian thực
8. `0008_learning.sql` — Bảng flashcard SM-2, nhịp tim học tập và bài thi trắc nghiệm
9. `0009_market.sql` — Chợ tri thức, bộ sưu tập tài liệu và giao dịch ViToken
10. `0010_onboarding.sql` — Cờ hoàn tất hướng dẫn làm quen (Onboarding Tour)

### 3.2. Cấu hình Secrets cho Supabase Edge Functions

```bash
supabase secrets set GEMINI_API_KEY="AIzaSy..."
supabase secrets set SEPAY_API_KEY="KDF8FCOKEG3KPUF890MHNXJHG1PW0VPYWJU6NNBRODVGZKS6MOAZMLJCLO5SRG2S"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="eyJhbGci..."
```

### 3.3. Deploy 3 Edge Functions

```bash
# 1. AI Gateway Function
supabase functions deploy ai-gateway --no-verify-jwt

# 2. Sepay Webhook Handler
supabase functions deploy sepay-webhook --no-verify-jwt

# 3. Discord Activity Auth
supabase functions deploy discord-auth --no-verify-jwt
```

---

## 4. Cấu Hình Cổng Thanh Toán Sepay (VietQR)

1. Đăng nhập cổng quản trị [Sepay.vn](https://my.sepay.vn).
2. Vào mục **Cấu hình Webhook (Webhooks)** $\to$ **Thêm Webhook mới**.
3. Điền các thông số:
   - **URL Webhook:** `https://<your-project-ref>.supabase.co/functions/v1/sepay-webhook`
   - **Phương thức:** `POST`
   - **Kiểu nội dung:** `application/json`
   - **Header xác thực:** `Authorization: Apikey KDF8FCOKEG3KPUF890MHNXJHG1PW0VPYWJU6NNBRODVGZKS6MOAZMLJCLO5SRG2S`
4. Bật cờ sự kiện: **Nhận tiền thành công (Incoming Transfer)**.
5. Kiểm tra kết nối: Bấm **Gửi thử nghiệm (Test Webhook)** và kiểm tra log trong Supabase Edge Functions.

---

## 5. Build & Triển Khai Frontend (GitHub Pages)

### 5.1. Chạy Suite Kiểm Thử Toàn Diện
```bash
# Chạy 100% unit tests và integration tests
pnpm test

# Kiểm tra đồng bộ chỉ mục tài liệu
pnpm run docs:check
```

### 5.2. Biên Dịch Tĩnh Export
```bash
pnpm run build:pages
```
Kết quả xuất ra thư mục `out/`. Toàn bộ 13 trang tĩnh (Desk, Landing, Market, Dashboard, Profile, Auth, Terms, Privacy, FAQ, Manifest, v.v.) được tối ưu hóa sẵn sàng phục vụ từ CDN.

### 5.3. GitHub Actions Workflow
Mã nguồn đã tích hợp sẵn GitHub Actions `.github/workflows/deploy.yml` tự động build và deploy lên GitHub Pages mỗi khi push vào branch `main`.

---

## 6. Cấu Hình Discord Embedded App Activity (Tùy Chọn)

1. Truy cập [Discord Developer Portal](https://discord.com/developers/applications).
2. Tạo ứng dụng mới: **ViTudy — Bàn Học Tri Thức**.
3. Vào mục **Activities** $\to$ Bật cờ hoạt động.
4. Trong mục **URL Mappings**:
   - Thêm Prefix: `/` $\to$ Trỏ về `https://namtacozz.github.io/`
   - Thêm Prefix: `/supabase` $\to$ Trỏ về `https://<your-project-ref>.supabase.co`
5. Trong mục **OAuth2**:
   - Redirect URL: `https://namtacozz.github.io/auth/callback`
   - Scope: `identify`, `email`, `activities.write`.

---

## 7. Xử Lý Sự Cố Thường Gặp (Troubleshooting)

| Hiện tượng | Nguyên nhân | Cách khắc phục |
| :--- | :--- | :--- |
| **Lỗi 401 khi nạp ViToken** | Header API Key của Sepay không khớp với `SEPAY_API_KEY` | Kiểm tra lại secret trên Supabase Edge Function `supabase secrets list` |
| **Mặt bàn không load sách mẫu** | Chưa khởi tạo tài khoản mới | Chức năng tự động chèn `demoSpace` đã kích hoạt khi `spaces.length === 0` |
| **Không thể xoay bàn học** | Chế độ xoay đang tắt | Nhấp nút xoay trên thanh điều khiển hoặc giữ phím Alt |
| **Nét vẽ bị lệch khỏi tài liệu** | Sai hệ tọa độ cục bộ | Hệ thống đã tự động tính `ItemDrawingOverlay` theo `item-local coordinates` |
