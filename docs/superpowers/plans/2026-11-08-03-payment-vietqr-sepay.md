# Plan 03 — Thanh Toán VietQR + Sepay

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans`.
> **Viết lại sau rà soát** ([`REVIEW-2026-11-08.md`](./REVIEW-2026-11-08.md) A6–A8): xác thực Sepay là `Authorization: Apikey`, không phải HMAC; tạo yêu cầu thanh toán qua RPC; mã nội dung ngắn; webhook `--no-verify-jwt`; xử lý thanh toán trễ/lệch số tiền.

**Goal:** Người dùng nạp ViToken bằng chuyển khoản qua mã QR VietQR; hệ thống tự cộng token khi Sepay báo đã nhận tiền.

**Architecture:** Client gọi RPC `create_payment_request(package_id)` → nhận mã ngắn + QR URL. Người dùng chuyển khoản. Sepay gọi Edge Function `sepay-webhook` (deploy `--no-verify-jwt`, xác thực bằng header `Authorization: Apikey <SEPAY_API_KEY>`). Function khớp giao dịch theo `code`, kiểm tra số tiền, rồi gọi `credit_vitoken` (service role, idempotent). Client theo dõi bằng Supabase Realtime trên `payment_requests` (dự phòng polling 5s).

**Tech Stack:** Supabase Edge Function (Deno), `img.vietqr.io` (ảnh QR, không cần thư viện), Postgres RPC.

**Điều kiện tiên quyết:** Plan 02a (hàm `credit_vitoken`, Vitest), Plan 02 (bucket/types), Plan 01 (đăng nhập).

> **Demo mode (D6 đã chốt):** dự án học thuật, **không thu tiền của công chúng**. Luồng VietQR + Sepay + webhook vẫn làm đủ và chạy thật, nhưng chỉ dùng với tài khoản ngân hàng cá nhân của chủ dự án (nếu muốn demo chuyển tiền thật) **hoặc** giả lập bằng nút admin (Task 3.6). Không cần đăng ký kinh doanh/thuế cho phạm vi này. Mọi màn hình nạp tiền hiển thị biểu ngữ "Bản trình diễn học thuật — không thu phí thật". `[OWNER]` (chỉ khi demo tiền thật): có tài khoản Sepay, gắn 1 tài khoản ngân hàng cá nhân, cấu hình tiền tố mã thanh toán là `VT` (Sepay → Cấu hình công ty → Cấu trúc mã thanh toán).

## Global Constraints

- Xem Master Plan.
- Webhook phải là Supabase Edge Function URL; deploy bằng `supabase functions deploy sepay-webhook --no-verify-jwt` (Sepay không gửi JWT Supabase).
- **Khớp giao dịch chỉ theo `code` do Sepay trích ra** (tiền tố `VT` + 8 ký tự `A–Z0–9`, ví dụ `VT7K2M9QXA`). Không dùng UUID/dấu gạch trong nội dung chuyển khoản.
- Danh tính người nạp lấy từ `payment_requests.user_id` (ghi lúc tạo), **không** parse từ nội dung chuyển khoản.
- Idempotency theo `sepay_transaction_id` (trường `id` của Sepay, `UNIQUE`) **và** theo `reference` của `credit_vitoken`.
- Số tiền và số ViToken lấy từ bảng `vitoken_packages` phía server. Client không gửi số tiền.
- Chỉ xử lý `transferType = 'in'` và `accountNumber` khớp tài khoản nhận.
- Mã QR có hạn 15 phút trên UI. **Tiền về muộn vẫn được cộng** nếu còn trong 48 giờ và đủ số tiền (không để mất tiền người dùng); quá hạn hoặc không khớp → ghi `unmatched_payments` để admin đối soát (Plan 07 Task 7.4).
- Không đưa API key Sepay vào client. Số tài khoản/ngân hàng nhận tiền là thông tin công khai, đặt trong `NEXT_PUBLIC_*`.
- Cấm emoji; icon SVG Lucide.

## Review Focus (mỗi dòng có test)

1. Webhook gọi 2 lần cùng `id` Sepay → token chỉ cộng 1 lần, lần 2 trả 200 `{ success: true, duplicate: true }` (Sepay thử lại nếu không nhận 200).
2. Sai/thiếu `Authorization: Apikey` → 401, không chạm DB.
3. Số tiền **thiếu** so với gói → không cộng, ghi `unmatched_payments`; số tiền **dư** → cộng đúng gói và ghi phần dư vào `unmatched_payments` (đối soát tay).
4. Tiền về sau 16 phút (trong 48h) → vẫn cộng, `status='completed_late'`; sau 48h → `unmatched_payments`.
5. `transferType='out'` hoặc sai `accountNumber` → bỏ qua (200, không cộng).
6. Hai webhook song song cùng `code` khác `id` (chuyển khoản hai lần) → chỉ lần đầu gắn với request; lần sau vào `unmatched_payments`.
7. User A không đọc được `payment_requests` của user B; user không thể INSERT/UPDATE trực tiếp bảng này.

---

## File Structure

```
supabase/
  migrations/0005_payments.sql            [CREATE] — vitoken_packages, payment_requests, unmatched_payments, RPC
  tests/payments.test.sql                 [CREATE]
  functions/sepay-webhook/index.ts        [CREATE]
  functions/sepay-webhook/match.ts        [CREATE] — hàm thuần: matchPayment(payload, request) → quyết định
  functions/sepay-webhook/match.test.ts   [CREATE]
src/
  services/PaymentService.ts              [CREATE]
  hooks/usePaymentStatus.ts               [CREATE] — Realtime + polling dự phòng
  components/payment/TopUpModal.tsx, PricingTiers.tsx, QRCodeDisplay.tsx, PaymentSuccess.tsx  [CREATE]
  components/payment/PaymentHistory.tsx   [CREATE] — roadmap 3.5
  components/hud/TopRightWallet.tsx       [MODIFY] — nút Nạp
```

---

### Task 3.1: Migration `0005_payments.sql`

**Interfaces — Produces:**
- `vitoken_packages(id TEXT PK, label TEXT, token_amount INT, price_vnd INT, sort INT, enabled BOOLEAN)`; seed theo **D4 đã chốt** (1 ViToken = 200đ): `demo` 10V/2.000đ (gói thử), `basic` 50V/10.000đ, `standard` 150V/27.000đ, `premium` 500V/85.000đ, `vip` 1.500V/255.000đ. RLS: SELECT công khai cho `enabled`.
- `payment_requests(id UUID PK, user_id UUID FK profiles, package_id TEXT FK, code TEXT UNIQUE NOT NULL, amount_vnd INT, token_amount INT, status TEXT CHECK in ('pending','completed','completed_late','expired','failed'), sepay_transaction_id BIGINT UNIQUE, created_at, expires_at DEFAULT now()+15min, completed_at)`. RLS: SELECT dòng của mình; **không** có policy INSERT/UPDATE/DELETE.
- `unmatched_payments(id UUID PK, sepay_transaction_id BIGINT UNIQUE, code TEXT, amount_vnd INT, reason TEXT, payload JSONB, created_at, resolved BOOLEAN DEFAULT false)`. RLS bật, không policy (chỉ service role/admin RPC).
- RPC `create_payment_request(p_package_id text) → TABLE(id uuid, code text, amount_vnd int, expires_at timestamptz)`: dùng `auth.uid()`; yêu cầu email đã xác minh; sinh `code` = `'VT' || 8 ký tự A–Z0–9` ngẫu nhiên (thử lại khi trùng); giới hạn tối đa 5 request `pending` đồng thời và 10 request/giờ/user (đếm trong hàm; vượt → `RAISE EXCEPTION 'too_many_requests'`).
- RPC `apply_payment(p_sepay_id bigint, p_code text, p_amount int, p_account text, p_payload jsonb) → jsonb` (**service_role only**): toàn bộ quy tắc khớp/idempotent/muộn/dư-thiếu **nằm trong SQL một transaction** (khóa dòng request `FOR UPDATE`), trả `{ result: 'credited'|'duplicate'|'unmatched', balance_after? }`. Edge Function chỉ xác thực rồi gọi hàm này — logic tiền ở một chỗ, test được bằng pgTAP.

- [ ] **Step 1:** Viết `payments.test.sql` (pgTAP) cho 7 Review Focus (gọi `apply_payment` trực tiếp bằng service role; test RLS bằng `SET ROLE authenticated` + `request.jwt.claims`).
- [ ] **Step 2:** `pnpm test:db` → FAIL.
- [ ] **Step 3:** Viết migration. `apply_payment` gọi `credit_vitoken(user, token_amount, 'purchase', desc, reference => 'sepay:' || p_sepay_id)`.
- [ ] **Step 4:** `pnpm test:db` → PASS.
- [ ] **Step 5:** Commit: `feat(db): payment packages, requests and atomic apply_payment`.

---

### Task 3.2: Edge Function `sepay-webhook`

**Files:** Create `supabase/functions/sepay-webhook/index.ts`.

**Interfaces:**
- Consumes: POST JSON của Sepay `{ id, gateway, transactionDate, accountNumber, code, content, transferType, transferAmount, accumulated, referenceCode, description }`; header `Authorization: Apikey <key>`.
- Produces: `200 { success: true, ... }` (kể cả duplicate/unmatched/bỏ qua — để Sepay không thử lại vô ích); `401` khi sai key; `400` khi body sai kiểu; `500` khi lỗi DB (để Sepay thử lại).

- [ ] **Step 1:** Test Deno: (a) thiếu/sai header → 401 và **không** gọi RPC; (b) so sánh khóa bằng hàm thời gian hằng (`timingSafeEqual`); (c) `transferType:'out'` → 200 và không gọi RPC; (d) body hợp lệ → gọi `apply_payment` đúng 5 tham số và trả 200; (e) RPC ném lỗi → 500.
- [ ] **Step 2:** Chạy → FAIL.
- [ ] **Step 3:** Implement: đọc `SEPAY_API_KEY`, `SEPAY_ACCOUNT_NUMBER` từ `Deno.env` (đặt bằng `supabase secrets set`, **không** commit). `code` lấy từ `payload.code`; nếu `null` thì thử regex `/VT[A-Z0-9]{8}/` trên `content` làm dự phòng.
- [ ] **Step 4:** `supabase functions deploy sepay-webhook --no-verify-jwt` lên staging; dùng tính năng "gửi thử webhook" của Sepay (hoặc `curl` với header Apikey) kiểm tra 3 tình huống: hợp lệ, trùng, sai key.
- [ ] **Step 5:** `[OWNER]` đăng ký URL webhook (`https://<ref>.supabase.co/functions/v1/sepay-webhook`) + Apikey trong Sepay Dashboard cho môi trường prod.
- [ ] **Step 6:** Commit: `feat(functions): sepay webhook`.

---

### Task 3.3: `PaymentService` + `usePaymentStatus`

**Files:** Create `src/services/PaymentService.ts`, `src/hooks/usePaymentStatus.ts`.

**Interfaces — Produces:**
- `PaymentService.listPackages(): Promise<PaymentPackage[]>` (`{ id, label, tokenAmount, priceVnd }`)
- `PaymentService.createRequest(packageId: string): Promise<{ requestId: string; code: string; amountVnd: number; qrUrl: string; expiresAt: Date }>` (gọi RPC `create_payment_request`, dựng `qrUrl` bằng hàm dưới)
- `buildVietQrUrl(p: { bankId: string; accountNo: string; amount: number; addInfo: string; accountName?: string }): string` → `https://img.vietqr.io/image/{bankId}-{accountNo}-compact2.png?amount=…&addInfo=…&accountName=…` (mọi tham số `encodeURIComponent`)
- `PaymentService.listMyPayments(limit?: number): Promise<PaymentRequestRow[]>`
- `usePaymentStatus(requestId: string | null): { status: 'pending'|'completed'|'completed_late'|'expired'|'failed'; secondsLeft: number }` — subscribe Realtime `postgres_changes` trên `payment_requests` (`id=eq.<id>`); dự phòng poll 5s; dừng khi trạng thái cuối; dọn dẹp khi unmount; `secondsLeft` đếm từ `expiresAt`.

- [ ] **Step 1:** Test: `buildVietQrUrl` chứa đúng `amount`, `addInfo=VT7K2M9QXA`, tên có dấu được encode; `createRequest` bubble lỗi `too_many_requests` thành thông báo tiếng Việt; `usePaymentStatus` dừng poll sau `completed` (đếm số lần gọi), hủy subscribe khi unmount, và đặt `expired` khi `secondsLeft` về 0 mà chưa hoàn thành (UI vẫn chờ thêm webhook trễ — trạng thái hiển thị "Hết hạn mã, nếu đã chuyển khoản vui lòng đợi vài phút").
- [ ] **Step 2–4:** FAIL → implement → PASS.
- [ ] **Step 5:** Commit: `feat(payment): payment service and status hook`.

---

### Task 3.4: UI nạp ViToken + lịch sử

**Files:** Create `TopUpModal.tsx`, `PricingTiers.tsx`, `QRCodeDisplay.tsx`, `PaymentSuccess.tsx`, `PaymentHistory.tsx`; Modify `TopRightWallet.tsx`, `src/app/profile/page.tsx` (tab "Lịch sử nạp").

- [ ] **Step 1:** Test component: chưa đăng nhập bấm "Nạp" → điều hướng `/auth`; chọn gói → gọi `createRequest` đúng `packageId`; hiển thị mã `VT…` **chữ lớn, có nút sao chép** (nội dung chuyển khoản phải nhập đúng); khi status `completed` → hiện `PaymentSuccess` và ví cập nhật; lỗi mạng → thông báo và nút thử lại, không tạo thêm request ẩn.
- [ ] **Step 2:** FAIL → implement. `PricingTiers`: lưới 2×2, gói chọn viền Cam ViT `#E0562D`. `QRCodeDisplay`: ảnh QR, đếm ngược `mm:ss`, số tiền, tên ngân hàng/số tài khoản/nội dung (cho người nhập tay), cảnh báo "Nhập đúng nội dung chuyển khoản". `PaymentSuccess`: hiệu ứng CSS nhẹ, không thư viện confetti. `PaymentHistory`: bảng mã giao dịch, số tiền, số ViToken, thời gian, trạng thái.
- [ ] **Step 3:** PASS; `GITHUB_PAGES=true pnpm build` PASS.
- [ ] **Step 4:** Smoke thủ công trên staging bằng chuyển khoản số tiền nhỏ thật (hoặc giả lập webhook bằng `curl`): ví tăng, có 1 dòng `vitoken_transactions` loại `purchase`.
- [ ] **Step 5:** `pnpm run docs:index`; cập nhật `05_API_AND_ROUTES.md`, `11_CHANGELOG.md`. Commit: `feat(payment): top-up modal, vietqr and payment history`.

---

### Task 3.5: Đối soát (runbook ngắn, liên kết Plan 07)

- [ ] **Step 1:** Thêm vào `docs/ops/RUNBOOK.md`: cách xem `unmatched_payments` chưa `resolved`; cách cộng tay bằng `credit_vitoken` với `reference = 'manual:<sepay_id>'`; cách xử lý khi Sepay báo webhook lỗi (xem log Edge Function, gửi lại từ Sepay).
- [ ] **Step 2:** Admin hiển thị `unmatched_payments` (làm ở Plan 07 Task 7.4).
- [ ] **Step 3:** Commit: `docs(ops): payment reconciliation runbook`.

---

### Task 3.6: Giả lập thanh toán cho buổi trình diễn (D6)

Để demo trọn luồng nạp tiền mà không cần chuyển tiền thật.

**Files:** Create migration `0005b_demo_payment.sql`; Modify `QRCodeDisplay.tsx` (hoặc bảng admin ở Plan 07).

**Interfaces — Produces:** RPC `admin_simulate_payment(p_request_id uuid) → jsonb` — chỉ `is_admin` gọi được (kiểm tra bằng `auth.uid()`); chỉ chạy khi cờ DB `app_settings.demo_mode = true`; gọi lại **đúng** `apply_payment` với `sepay_transaction_id` âm duy nhất (`-nextval(...)`), `code`/`amount` lấy từ request → đi qua toàn bộ logic thật (idempotent, ghi `vitoken_transactions`). Trên prod thật sau này đặt `demo_mode=false` là nút biến mất và RPC từ chối.

- [ ] **Step 1:** pgTAP: user thường gọi → `permission denied`; admin với `demo_mode=false` → từ chối; admin với `demo_mode=true` → request thành `completed`, ví +token đúng gói, có 1 dòng transaction `purchase`; gọi lần 2 → `duplicate`, ví không đổi.
- [ ] **Step 2:** FAIL → viết migration → PASS.
- [ ] **Step 3:** UI: khi người dùng là admin và `demo_mode=true`, modal QR có nút "Giả lập đã nhận tiền" (nhãn rõ là chỉ dành cho trình diễn); người dùng thường không thấy nút.
- [ ] **Step 4:** Biểu ngữ "Bản trình diễn học thuật — không thu phí thật" trong `TopUpModal`, `PricingSection` (Plan 06) và `SiteFooter` (Plan 07), hiển thị theo `demo_mode`.
- [ ] **Step 5:** Commit: `feat(payment): demo mode simulation for presentation`.
