# ViTudy Production Roadmap — Master Orchestration Plan (bản đã rà soát)

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans`. Steps use checkbox (`- [ ]`) syntax.
> **Đọc trước:** [`REVIEW-2026-11-08.md`](./REVIEW-2026-11-08.md) — danh sách lỗi đã tìm thấy ở bản plan đầu và cách sửa.

**Goal:** Đưa ViTudy từ demo kỹ thuật sang sản phẩm thương mại: người dùng thật, dữ liệu trên Supabase, thu tiền thật qua VietQR + Sepay, chạy được trong Discord Activity.

**Architecture:** GitHub Pages (Next.js `output: export`) + Supabase (Auth, Postgres + RLS, Storage, Realtime, **Edge Functions là toàn bộ backend**). Không có Next.js API route trong bản production. Mọi thao tác tiền chạy trong hàm Postgres chỉ `service_role` gọi được hoặc hàm dùng `auth.uid()`.

**Tech Stack:** Next.js 15.1.7, React 19, TypeScript 5.7, Supabase JS v2, Vitest + RTL, pgTAP (`supabase test db`), Deno (Edge Functions), pdfjs-dist, Discord Embedded App SDK.

**Spec:** [`roadmap-to-production.md`](file:///C:/Users/Vit/.gemini/antigravity/brain/fbb976ad-a049-4320-8f1d-4fc45e9ec5b9/roadmap-to-production.md) + [`REVIEW-2026-11-08.md`](./REVIEW-2026-11-08.md).

---

## Global Constraints

- `output: "export"` khi `GITHUB_PAGES=true`; **không** có API route trên production. `basePath` đọc từ `NEXT_PUBLIC_BASE_PATH` (rỗng khi dùng domain riêng).
- Không emoji; icon SVG Lucide. Cam ViT `#E0562D`; bảng màu đơn sắc; `spellCheck={false}`; KaTeX cho toán; font Open Sans + Patrick Hand (theo `AGENTS.md`).
- RLS bật 100% bảng; mọi thay đổi DB là file `supabase/migrations/NNNN_*.sql` có pgTAP test; **không** sửa `schema.sql` baseline.
- Client **không** ghi `vitoken_balance`; không hàm tiền nào nhận user id từ client; hàm `credit_vitoken`/`debit_vitoken` chỉ `service_role`.
- Mọi id thực thể là UUID v4 sinh ở client.
- Bí mật (Sepay key, Discord secret, service role key) chỉ trong `supabase secrets` / GitHub Secrets — không commit, không `NEXT_PUBLIC_*`.
- Trước mỗi commit: `pnpm test`, `pnpm test:db` (nếu đụng DB), `GITHUB_PAGES=true pnpm build`, `pnpm run docs:check`. Sau mỗi task: `pnpm run docs:index` + `11_CHANGELOG.md` (UPDATE PROTOCOL trong `AGENTS.md`).
- Test viết bằng Vitest: mọi `jest.*` trong plan con đọc là `vi.*`.
- Staging trước, prod sau. Không chạy thử nghiệm/migration chưa kiểm trên prod.

---

## Review Focus (toàn dự án)

1. Người dùng đăng nhập không thể tự tăng số dư hay sửa dữ liệu bàn học của người khác (A1, A2) — pgTAP ở Plan 02a.
2. Tiền: webhook trùng / sai khóa / thiếu-dư tiền / về muộn đều xử lý đúng, không mất tiền người dùng, không cộng đôi — pgTAP ở Plan 03.
3. Bản `out/` không còn lời gọi `/api/*` nào; AI chạy qua Edge Function — Plan 02a Task A.5.
4. Nội dung chợ trả phí không đọc được khi chưa mua, kể cả qua DevTools — Plan 05.
5. Ngoài Discord, app không nạp mã Discord; trong Discord, Realtime không bị CSP chặn — Plan 04.

---

## Quyết định đã chốt (D1–D7)

> **Đã chốt ngày 08/11/2026** — chi tiết và bảng giá ở [`DECISIONS-2026-11-08.md`](./DECISIONS-2026-11-08.md). Phạm vi: **đồ án học thuật, làm đủ luồng thương mại để thuyết trình, không thu tiền thật của công chúng.**

| Mã | Quyết định chốt |
|---|---|
| D1 | Không mua domain. Dùng user site miễn phí `https://namtacozz.github.io/` (basePath rỗng); đổi tên repo khi bắt đầu Plan 04 |
| D2 | 2 dự án Supabase **Free** (staging + prod); chấp nhận tự pause, tự sao lưu bằng `db dump` |
| D3 | **Bật** ChatGPT OAuth (`NEXT_PUBLIC_ENABLE_CODEX_OAUTH=true`), token chỉ lưu thiết bị, luôn có nhánh dự phòng |
| D4 | gpt-4o-mini 1V, gemini-1.5-flash 1V, gpt-4o 4V; 20 lượt/giờ, 60/ngày; gói 10/50/150/500/1500 ViToken = 2k/10k/27k/85k/255k đ |
| D5 | Quà 50V chỉ sau khi xác minh email |
| D6 | **Demo mode:** luồng thanh toán làm đủ nhưng không thu tiền công chúng; có biểu ngữ trình diễn + giả lập thanh toán cho admin; bỏ đăng ký kinh doanh/thuế/luật sư |
| D7 | Điểm danh bằng heartbeat server |

Agent không tự thay đổi các quyết định này.

---

## Thứ Tự Thực Thi

```
Task 0 (nhánh, env, staging)
  └─► Plan 02a  Nền tảng: test infra + siết DB + AI gateway   [BẮT BUỘC TRƯỚC TIÊN]
        └─► Plan 01  Auth
              └─► Plan 02  Cloud sync
                    ├─► Plan 03  Thanh toán   (song song được sau 02)
                    ├─► Plan 04  Discord      (cần D1)
                    └─► Plan 05  Tính năng
                          └─► Plan 06  Chất lượng & bảo mật
                                └─► Plan 07  Vận hành & pháp lý
                                      └─► Task 8  Phát hành
```

| Plan | File | Phần chạy được độc lập sau khi xong |
|---|---|---|
| 02a | [`02a-foundation-hardening-and-ai-gateway`](./2026-11-08-02a-foundation-hardening-and-ai-gateway.md) | Test chạy được; DB an toàn; AI chạy trên Pages |
| 01 | [`01-auth-and-accounts`](./2026-11-08-01-auth-and-accounts.md) | Đăng ký/đăng nhập, hồ sơ |
| 02 | [`02-supabase-cloud`](./2026-11-08-02-supabase-cloud.md) | Dữ liệu lên cloud, offline queue, migrate |
| 03 | [`03-payment-vietqr-sepay`](./2026-11-08-03-payment-vietqr-sepay.md) | Nạp ViToken |
| 04 | [`04-discord-activity`](./2026-11-08-04-discord-activity.md) | Chạy trong Discord |
| 05 | [`05-feature-completion`](./2026-11-08-05-feature-completion.md) | PDF, SM-2, dashboard, chợ, multiplayer |
| 06 | [`06-quality-and-security`](./2026-11-08-06-quality-and-security.md) | Onboarding, landing, PWA, culling, CSP |
| 07 | [`07-operations-and-legal`](./2026-11-08-07-operations-and-legal.md) | Pháp lý, analytics, admin, referral, SEO |

---

## Ma Trận Bao Phủ Roadmap → Plan

| Roadmap | Plan/Task | | Roadmap | Plan/Task |
|---|---|---|---|---|
| 1.1–1.3, 1.5 | 01 (1.1–1.4) | | 5B.1 SM-2 | 05 · 5B.1 |
| 1.4 Profile | 01 · 1.5 | | 5B.2 Dashboard | 05 · 5B.2, 5B.3 |
| 1.6 Xóa tài khoản | 01 · 1.5 + 02 · 2.2 | | 5B.3 Huy hiệu | **hoãn** (P2, sau khi có số liệu) |
| 2.1–2.3, 2.7 | 02a + 02 (2.1–2.5) | | 5B.4 Pomodoro, 5B.5 xuất PDF | 05 · 5E.1 |
| 2.4 Storage | 02 · 2.1, 2.6 | | 5C.1–5C.2 | 05 · 5C.1 |
| 2.5 Offline | 02 · 2.8 | | 5C.3 đánh giá | 05 · 5C.2 |
| 2.6 Migrate | 02 · 2.7 | | 5C.4 tác giả | 05 · 5E.1 |
| 3.1–3.4, 3.6 | 03 (3.1–3.4) | | 5C.5–5C.6 báo cáo/kiểm duyệt | 07 · 7.3, 7.4 |
| 3.5 Lịch sử nạp | 03 · 3.4 | | 5D.1, 5D.3 | 05 · 5D.1 |
| 3.7 Rút tiền tác giả | **hoãn** (P3, cần KYC/pháp lý) | | 5D.2, 5D.4 | 05 · 5D.3 |
| 4.1–4.5 | 04 | | 6A.1, 6A.3 | 06 · 6.3, 6.4 |
| 5A.1 PDF | 05 · 5A.1 | | 6A.2 Bàn demo | 05 · 5E.2 |
| 5A.2 DOCX/PPTX | **hoãn** (P2) | | 6A.4 FAQ | 07 · 7.1 |
| 5A.3–5A.4 ảnh/giới hạn | 05 · 5A.2 | | 6B.1, 6B.4 | 05 · 5A.1 (lazy page), 06 · 6.6 |
| 6B.2 thumbnail, 6B.3 Web Worker | **hoãn** (P2; đo hiệu năng trước) | | 6B.5 PWA | 06 · 6.5 |
| 6C.1 BYOK | 06 · 6.1 | | 6C.2 Rate limit | 02a · A.4, A.5 + 06 · 6.2 |
| 6C.3 Audit RLS | 02a · A.2 (+ checklist Task 8) | | 6C.4 CSP | 06 · 6.7 |
| 6C.5 Sanitize | 05 · 5C.1 | | 7A.1–7A.5 | 07 · 7.1, 7.7 |
| 7B.1–7B.3 | 07 · 7.2, 7.4 | | 7C.1–7C.2, 7C.4 | 07 · 7.5, 7.6 |
| 7C.3 Push | **hoãn** (P3) | | | |

---

## Tasks (cấp điều phối)

### Task 0: Chuẩn bị môi trường

**Files:** Create `.env.local.example`, `docs/ops/LAUNCH_CHECKLIST.md` (khung); Modify `.github/workflows/deploy.yml`, `next.config.ts` (basePath từ env).

**Interfaces — Produces:** nhánh làm việc theo từng plan (`feat/p02a-foundation`, `feat/p01-auth`, …) thay vì một nhánh dài; hai dự án Supabase; danh sách biến môi trường.

- [ ] **Step 1:** Mỗi plan một nhánh từ `main`, merge vào `integration` sau khi plan xanh; `main` (nguồn deploy production) chỉ nhận ở Task 8.
- [ ] **Step 2:** `[OWNER]` tạo hai dự án Supabase **staging** và **prod**; ghi `ref` vào `docs/ops/LAUNCH_CHECKLIST.md` (không ghi khóa).
- [ ] **Step 3:** `.env.local.example` (chỉ tên biến + ví dụ rỗng):
  ```
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  NEXT_PUBLIC_BASE_PATH=
  NEXT_PUBLIC_BANK_ID=
  NEXT_PUBLIC_BANK_ACCOUNT_NO=
  NEXT_PUBLIC_BANK_ACCOUNT_NAME=
  NEXT_PUBLIC_DISCORD_CLIENT_ID=
  NEXT_PUBLIC_UMAMI_WEBSITE_ID=
  NEXT_PUBLIC_SENTRY_DSN=
  NEXT_PUBLIC_ENABLE_CODEX_OAUTH=true
  ```
  Bí mật Edge Function (đặt bằng `supabase secrets set`, **không** có trong file này): `SEPAY_API_KEY`, `SEPAY_ACCOUNT_NUMBER`, `DISCORD_CLIENT_SECRET`, `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- [ ] **Step 4:** Sửa `deploy.yml`: truyền các biến `NEXT_PUBLIC_*` ở trên từ GitHub Secrets; chạy `pnpm test` trước `pnpm build`; (bản `main` → prod, nhánh `integration` → không deploy).
- [ ] **Step 5:** Commit: `chore: env template, branch strategy and ci tests`.

### Task 1–7: Thực thi từng Plan theo thứ tự trên

Với mỗi plan: tạo nhánh → thực thi từng task (TDD) → `pnpm test` + `pnpm test:db` + `GITHUB_PAGES=true pnpm build` + `docs:check` → code review (subagent reviewer) → merge vào `integration`.

- [ ] Plan 02a → [ ] Plan 01 → [ ] Plan 02 → [ ] Plan 03 → [ ] Plan 04 *(sau D1)* → [ ] Plan 05 → [ ] Plan 06 → [ ] Plan 07

### Task 8: Kiểm thử tích hợp & phát hành

- [ ] **Step 1 — Audit RLS (roadmap 6C.3):** chạy `supabase db advisors` (hoặc Security Advisor trên Dashboard) trên staging; mỗi bảng ở `public` phải có RLS và policy đúng; kiểm tra thủ công bằng 2 tài khoản.
- [ ] **Step 2 — Smoke toàn luồng trên staging:** đăng ký (xác minh email) → nhận quà → tải PDF → hỏi AI (trừ token) → nạp tiền (giả lập webhook + 1 giao dịch thật nhỏ) → mua tài liệu chợ → mời bạn học nhóm → mở trong Discord Activity.
- [ ] **Step 3 — Kiểm tra bản `out/`:** không còn chuỗi `/api/`; không có khóa bí mật trong bundle (`grep` các tiền tố `sk-`, `eyJ` của service role, `SEPAY`); Lighthouse landing đạt ngưỡng ở Plan 06.
- [ ] **Step 4 — Hoàn tất `docs/ops/LAUNCH_CHECKLIST.md`** (phiên bản đồ án, mục `[OWNER]`; pháp lý/thuế/domain đánh dấu "không áp dụng" theo D1/D6).
- [ ] **Step 5:** Áp migration lên prod (`[OWNER]` xác nhận) → merge `integration` vào `main` → xác nhận Actions deploy thành công → smoke ngắn trên prod.
- [ ] **Step 6:** Cập nhật `docs/ai/00_INDEX.md` (commit hash), `SNAPSHOT.md`; commit `docs: sync production snapshot`.
