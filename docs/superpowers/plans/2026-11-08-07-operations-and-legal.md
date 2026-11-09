# Plan 07 — Vận Hành, Pháp Lý & Tăng Trưởng

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans`.

> **Điều kiện tiên quyết:** Plan 02a, 02, 03 (bảng `unmatched_payments`), 05 (listing). Test dùng Vitest + pgTAP. Sửa sau rà soát: admin xử lý `unmatched_payments`; không định nghĩa lại status listing; referral gọi `credit_vitoken`; CSP phải thêm domain Umami/Sentry khi bật; chủ dự án phải quyết D1–D7 ([`REVIEW-2026-11-08.md`](./REVIEW-2026-11-08.md)).

**Goal:** Hoàn thiện lớp vận hành thương mại: trang pháp lý, analytics, error tracking, admin, SEO, referral, trang bàn học công khai.

**Architecture:** Các trang pháp lý là static route (`/terms`, `/privacy`, `/refund`). Analytics dùng Umami Cloud (script tag, không cookie). Error tracking dùng Sentry browser SDK. Admin dashboard là route `/admin` chặn bằng cột `profiles.is_admin` + RLS + RPC `SECURITY DEFINER`. Referral xử lý bằng RPC nguyên tử trong Postgres.

**Tech Stack:** Next.js static export, Umami Cloud, `@sentry/browser`, Supabase RPC/RLS, Web Share API.

**Spec:** [`2026-11-08-00-master-roadmap.md`](./2026-11-08-00-master-roadmap.md) → Trụ 7 (7A, 7B, 7C).

## Global Constraints

- Xem Global Constraints của Master Plan.
- Mọi trang mới phải export tĩnh được (không `getServerSideProps`, không route động không có `generateStaticParams`). Trang `/space/{id}` dùng query `?id=` thay route động.
- Quyền admin chỉ xác định phía DB (`profiles.is_admin`), không tin cờ phía client.
- **Phạm vi học thuật (D6):** các trang pháp lý ghi rõ đây là **đồ án học thuật, bản trình diễn, không thu phí thật**; vẫn đầy đủ cấu trúc như sản phẩm thật. Không cần luật sư/đăng ký kinh doanh/kê khai thuế cho phạm vi này. Nếu sau này đưa ra bán thật thì **bắt buộc** làm lại mục pháp lý trước khi mở thanh toán.
- Analytics không thu nội dung tài liệu người dùng, chỉ sự kiện ẩn danh.
- Referral: mỗi tài khoản chỉ được dùng 1 mã giới thiệu, không tự giới thiệu chính mình.

## Review Focus

1. **Leo thang đặc quyền admin:** User thường gọi RPC admin → expect lỗi `permission denied`; user thường tự `update profiles set is_admin=true` → bị RLS chặn.
2. **Lạm dụng referral:** Tự nhập mã của mình, nhập mã 2 lần, hoặc 2 tài khoản cùng thiết bị → chỉ thưởng đúng 1 lần, không tự thưởng.
3. **Trang public lộ dữ liệu private:** `/space?id=` của bàn `is_public=false` → expect "Không tìm thấy", không lộ tên/nội dung.
4. **Sentry lộ dữ liệu nhạy cảm:** Lỗi chứa API key/JWT → `beforeSend` phải lọc trước khi gửi.
5. **Trang pháp lý 404 trên basePath:** Link footer `/ViTudy/terms` phải mở được sau static export.

---

## File Structure

```
src/
  app/
    terms/page.tsx            [CREATE] — Điều khoản sử dụng
    privacy/page.tsx          [CREATE] — Chính sách bảo mật
    refund/page.tsx           [CREATE] — Chính sách hoàn tiền ViToken
    copyright/page.tsx        [CREATE] — Chính sách bản quyền KnowInherit
    faq/page.tsx              [CREATE] — FAQ & hỗ trợ
    admin/page.tsx            [CREATE] — Admin dashboard
    space/page.tsx            [CREATE] — Xem bàn học công khai (?id=)
  components/
    legal/LegalLayout.tsx     [CREATE] — layout chung trang pháp lý
    layout/SiteFooter.tsx     [CREATE] — footer link pháp lý
    admin/AdminStats.tsx      [CREATE]
    admin/ReviewQueue.tsx     [CREATE] — hàng đợi duyệt listing/báo cáo
    referral/ReferralCard.tsx [CREATE] — mã mời + nhập mã
  lib/
    analytics.ts              [CREATE] — track(event, props) bọc Umami
    sentry.ts                 [CREATE] — init Sentry + beforeSend lọc
  services/
    AdminService.ts           [CREATE]
    ReferralService.ts        [CREATE]
supabase/
  schema.sql                  [MODIFY] — is_admin, referral_codes, reports, RPC admin/referral
```

---

### Task 7.1: Trang Pháp Lý & Footer

**Files:**
- Create: `src/components/legal/LegalLayout.tsx`, `src/components/layout/SiteFooter.tsx`
- Create: `src/app/terms/page.tsx`, `privacy/page.tsx`, `refund/page.tsx`, `copyright/page.tsx`, `faq/page.tsx`
- Modify: `src/components/landing/LandingPage.tsx`, `src/components/auth/AuthForm.tsx` (checkbox đồng ý)

**Interfaces:**
- Produces: `LegalLayout({ title, updatedAt, children })`; `SiteFooter()` chứa link 4 trang pháp lý + FAQ.

- [ ] **Step 1:** Viết test render: mỗi trang có `<h1>` đúng tiêu đề và ngày cập nhật; `SiteFooter` có đủ 5 link với `href` đúng (dùng `NEXT_PUBLIC_BASE_PATH` làm prefix, rỗng khi deploy user site).
- [ ] **Step 2:** Chạy test, verify FAIL.
- [ ] **Step 3:** Implement `LegalLayout` (cột đọc hẹp, Open Sans, không emoji) và 5 trang. Nội dung bắt buộc: 
  - Terms: quyền/nghĩa vụ, ViToken không phải tiền điện tử và không quy đổi ngược, sở hữu trí tuệ, khóa tài khoản.
  - Privacy: dữ liệu thu (email, tài liệu, lịch sử học), bên xử lý (Supabase, nhà cung cấp AI, Sepay, Discord), quyền xóa dữ liệu.
  - Refund: nêu rõ ViToken đã nạp có/không hoàn, trường hợp ngoại lệ (lỗi hệ thống, trừ tiền nhưng không cộng token), kênh yêu cầu.
  - Copyright: người bán chịu trách nhiệm bản quyền, quy trình gỡ nội dung, hình phạt.
  - FAQ: nạp tiền, AI, bán tài liệu, mời bạn.
- [ ] **Step 4:** Thêm checkbox "Tôi đồng ý Điều khoản và Chính sách bảo mật" vào form đăng ký (bắt buộc tick mới submit).
- [ ] **Step 5:** Chạy test, verify PASS; `pnpm build` với `GITHUB_PAGES=true` xuất đủ 5 route.
- [ ] **Step 6:** Commit: `feat(legal): add legal pages, footer, signup consent`.

---

### Task 7.2: Analytics & Error Tracking

**Files:**
- Create: `src/lib/analytics.ts`, `src/lib/sentry.ts`
- Modify: `src/app/layout.tsx`, `.env.local.example`, `.github/workflows/deploy.yml`

**Interfaces:**
- Produces: `track(event: AnalyticsEvent, props?: Record<string, string | number>): void` với `AnalyticsEvent = 'signup' | 'login' | 'topup_started' | 'topup_completed' | 'listing_purchased' | 'document_uploaded' | 'discord_activity_opened'`; `initSentry(): void`.

- [ ] **Step 1:** Viết test: `track` là no-op an toàn khi `window.umami` chưa có; `sentry.beforeSend` xóa chuỗi khớp `sk-…`, `eyJ…` (JWT) và header `Authorization` khỏi event.
- [ ] **Step 2:** Chạy test, verify FAIL.
- [ ] **Step 3:** Implement `analytics.ts` (gọi `window.umami?.track`) và `sentry.ts` (`initSentry` chỉ chạy khi có `NEXT_PUBLIC_SENTRY_DSN`; `beforeSend` lọc như test).
- [ ] **Step 4:** Chèn script Umami (`NEXT_PUBLIC_UMAMI_WEBSITE_ID`) và `initSentry()` trong `layout.tsx`; thêm 3 biến env vào deploy.yml.
- [ ] **Step 5:** Gắn `track(...)` tại các điểm: đăng ký/đăng nhập (Plan 01), mở/hoàn tất nạp (Plan 03), mua listing (Plan 05C), upload (Plan 02), mở Discord (Plan 04).
- [ ] **Step 6:** Chạy test, verify PASS; `pnpm build` pass.
- [ ] **Step 7:** Commit: `feat(ops): analytics events and sentry with redaction`.

---

### Task 7.3: Báo Cáo Vi Phạm & Hàng Đợi Duyệt

**Files:**
- Modify: `supabase/schema.sql`
- Create: `src/components/market/ReportButton.tsx`

**Interfaces:**
- Produces: bảng `listing_reports(id, listing_id, reporter_id, reason TEXT CHECK in ('copyright','spam','adult','other'), detail, status CHECK in ('open','resolved','dismissed'), created_at)` với RLS: reporter chỉ INSERT + SELECT của mình; `listing.status` thêm giá trị `'pending_review'` và `'removed'`.

- [ ] **Step 1:** Viết test SQL (pgTAP hoặc script): user thường INSERT report được, SELECT report của người khác trả 0 dòng; trùng (listing_id, reporter_id) bị từ chối.
- [ ] **Step 2:** Chạy, verify FAIL.
- [ ] **Step 3:** Thêm DDL + RLS + `UNIQUE(listing_id, reporter_id)` (status listing đã có từ 02a).
- [ ] **Step 4:** Implement `ReportButton` (chọn lý do + ghi chú) đặt trên `ListingCard`/`ListingPreview`.
- [ ] **Step 5:** Verify PASS; commit: `feat(market): listing reports`.

---

### Task 7.4: Admin Dashboard

**Files:**
- Modify: `supabase/schema.sql` (thêm `profiles.is_admin BOOLEAN NOT NULL DEFAULT false`, RPC admin)
- Create: `src/services/AdminService.ts`, `src/components/admin/AdminStats.tsx`, `ReviewQueue.tsx`, `src/app/admin/page.tsx`

**Interfaces:**
- Produces (RPC `SECURITY DEFINER`, đầu hàm kiểm tra `is_admin` của `auth.uid()`, nếu không thì `RAISE EXCEPTION 'permission denied'`):
  - `admin_get_stats() → { total_users int, total_vitoken_supply bigint, revenue_vnd_30d bigint, open_reports int, pending_listings int }`
  - `admin_resolve_report(report_id uuid, action text)` với action `'remove_listing' | 'dismiss'`
  - `admin_review_listing(listing_id uuid, approve boolean)`
  - `admin_list_unmatched_payments() → setof unmatched_payments` và `admin_resolve_unmatched(p_id uuid, p_user uuid default null, p_credit_tokens int default 0)` — nếu có `p_user` và số token, gọi `credit_vitoken(..., reference => 'manual:' || sepay_transaction_id)` rồi đặt `resolved=true` (đối soát tiền về muộn/lệch từ Plan 03).
- `AdminService` bọc các RPC trên; cột `is_admin` **không** nằm trong `GRANT UPDATE` của `authenticated` (02a đã `REVOKE UPDATE` toàn bảng), nên không cần trigger riêng — test vẫn kiểm tra.
- Trạng thái listing dùng bộ giá trị chung `draft | pending_review | published | rejected | removed` đã tạo ở 02a (Task 7.3 **không** tự định nghĩa lại CHECK).

- [ ] **Step 1:** Viết test SQL: user thường gọi từng RPC → `permission denied`; user thường `UPDATE profiles SET is_admin=true` → bị chặn; admin gọi được và `admin_get_stats` trả đủ khóa.
- [ ] **Step 2:** Chạy, verify FAIL.
- [ ] **Step 3:** Thêm cột, trigger chặn tự nâng quyền, 3 RPC. Thiết lập admin đầu tiên thủ công bằng SQL Editor (ghi vào README triển khai, không commit email).
- [ ] **Step 4:** Implement `AdminService` + UI: `AdminStats` (4 số liệu), `ReviewQueue` (listing `pending_review` + report `open`, nút Duyệt/Gỡ/Bỏ qua). Trang `/admin` redirect về `/` nếu `admin_get_stats` báo `permission denied`.
- [ ] **Step 5:** Verify PASS; commit: `feat(admin): admin dashboard with guarded rpc`.

---

### Task 7.5: Referral

**Files:**
- Modify: `supabase/schema.sql`
- Create: `src/services/ReferralService.ts`, `src/components/referral/ReferralCard.tsx`
- Modify: `src/app/profile/page.tsx`, `src/app/auth/page.tsx` (đọc `?ref=`)

**Interfaces:**
- Produces: `profiles.referral_code TEXT UNIQUE` (tự sinh 8 ký tự khi tạo profile), `profiles.referred_by UUID NULL`; RPC `redeem_referral(code text) → { success boolean, reward int, error text }` nguyên tử: chặn mã của chính mình, chặn khi `referred_by` đã có, thưởng 10 ViToken cho cả hai qua `vitoken_transactions` loại `referral`.
- `ReferralService.getMyCode(): Promise<string>`, `ReferralService.redeem(code: string): Promise<RedeemResult>`.

- [ ] **Step 1:** Viết test SQL: tự nhập mã mình → `success=false`; nhập hợp lệ lần 1 → cả hai +10 và có 2 dòng transaction; nhập lần 2 → `success=false`, số dư không đổi; 2 lệnh song song cùng user → chỉ 1 thành công.
- [ ] **Step 2:** Chạy, verify FAIL.
- [ ] **Step 3:** Thêm cột, sinh mã trong `handle_new_user`, RPC có `SELECT … FOR UPDATE` trên hàng người nhập.
- [ ] **Step 4:** `ReferralCard`: hiển thị mã + nút Copy/Share (link `?ref=CODE`), ô nhập mã. Trang auth đọc `?ref=` lưu `sessionStorage`, tự redeem **sau khi email đã xác minh** (chống tài khoản ảo — D5). RPC thưởng bằng `credit_vitoken(..., 'referral', ..., reference => 'referral:' || <referred_user_id>)` nên idempotent ngay cả khi gọi lặp.
- [ ] **Step 5:** Verify PASS; commit: `feat(growth): referral program`.

---

### Task 7.6: SEO, Open Graph & Trang Bàn Học Công Khai

**Files:**
- Modify: `src/app/layout.tsx` (metadata), `public/og-image.png`, `public/robots.txt`, `public/sitemap.xml`
- Create: `src/app/space/page.tsx`
- Modify: `supabase/schema.sql` (RPC `get_public_space(space_id uuid)`)

**Interfaces:**
- Produces: RPC `get_public_space(space_id uuid) → study space + items` chỉ trả dữ liệu khi `is_public = true`, ngược lại trả rỗng. Trang `/space?id=<uuid>` hiển thị read-only (không toolbar chỉnh sửa, banner "Đăng ký để tạo bàn học của bạn").

- [ ] **Step 1:** Viết test: bàn `is_public=false` → RPC trả rỗng, trang hiện "Không tìm thấy"; bàn public → render được items ở chế độ chỉ xem (không có handle kéo).
- [ ] **Step 2:** Chạy, verify FAIL.
- [ ] **Step 3:** Thêm metadata (title, description tiếng Việt, `openGraph`, `twitter`, `metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://namtacozz.github.io')`), og-image 1200×630, robots/sitemap (liệt kê `/`, `/terms`, `/privacy`, `/faq`, `/market`).
- [ ] **Step 4:** Implement RPC và trang `/space`; thêm nút "Chia sẻ công khai" (toggle `is_public` + copy link) trong menu bàn học.
- [ ] **Step 5:** Verify PASS; Lighthouse SEO ≥ 90 trên trang landing; commit: `feat(seo): metadata, sitemap, public space view`.

---

### Task 7.7: Tài Liệu Vận Hành & Nghĩa Vụ Kinh Doanh

**Files:**
- Create: `docs/ops/RUNBOOK.md`, `docs/ops/LAUNCH_CHECKLIST.md`
- Modify: `docs/ai/*` theo UPDATE PROTOCOL

- [ ] **Step 1:** `RUNBOOK.md`: quy trình sự cố (webhook Sepay lỗi → đối soát `payment_requests` pending có tiền vào; Supabase down; lộ key → xoay key), sao lưu DB (bật PITR/backup), cách cấp admin, cách gỡ listing khẩn.
- [ ] **Step 2:** `LAUNCH_CHECKLIST.md` (phiên bản đồ án): 
  - Kỹ thuật: 2 dự án Supabase Free đã tạo; **mở lại dự án (không bị pause) và smoke test trước ngày báo cáo**; xuất `supabase db dump` sau mỗi mốc lớn và ngay trước buổi báo cáo; theo dõi hạn mức Free (Edge Function, băng thông, Realtime); `demo_mode=true`.
  - Tài khoản `[OWNER]`: Supabase, Discord Application, Sepay + 1 tài khoản ngân hàng cá nhân (chỉ nếu demo chuyển tiền thật), OpenAI/Gemini key cho chế độ `system`, đổi tên repo thành `namtacozz.github.io` (Plan 04).
  - Kịch bản thuyết trình dự phòng: nếu Codex OAuth hoặc Sepay không hoạt động → chuyển sang chế độ `system`/Gemini và nút giả lập thanh toán.
  - **Không áp dụng** (đánh dấu rõ lý do "đồ án học thuật, không thu phí thật"): đăng ký hộ kinh doanh, kê khai thuế, luật sư duyệt điều khoản, domain riêng.
- [ ] **Step 3:** `pnpm run docs:index`, `pnpm run docs:check`; cập nhật `08_FEATURE_STATUS.md`, `09_ISSUES_AND_TODO.md`, `11_CHANGELOG.md`, `SNAPSHOT.md`.
- [ ] **Step 4:** Commit: `docs: ops runbook and launch checklist`.
