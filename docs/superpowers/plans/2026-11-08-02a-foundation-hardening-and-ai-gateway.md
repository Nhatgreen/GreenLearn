# Plan 02a — Nền Tảng: Test Infra, Siết Bảo Mật DB, AI Gateway (Edge Function)

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans`.
> **Plan này được thêm sau đợt rà soát** ([`REVIEW-2026-11-08.md`](./REVIEW-2026-11-08.md)). Nó chạy **trước Plan 02, 03, 05, 06** vì các plan đó phụ thuộc vào kết quả của nó.

**Goal:** (1) Có hạ tầng test chạy được; (2) vá các lỗ hổng bảo mật và lệch schema trong `supabase/schema.sql` trước khi có dữ liệu/tiền thật; (3) thay Next.js API route `/api/ai/chat` (không tồn tại trên GitHub Pages) bằng Supabase Edge Function có xác thực, rate limit và trừ ViToken phía server.

**Architecture:** Mọi thay đổi DB đi qua file migration có thứ tự trong `supabase/migrations/`. Mọi thao tác tiền (cộng/trừ ViToken) chỉ qua hàm Postgres `SECURITY DEFINER` mà **chỉ `service_role` gọi được**, hoặc hàm dùng `auth.uid()` (không nhận user id từ tham số). Client chỉ đọc số dư.

**Tech Stack:** Vitest + @testing-library/react + jsdom, Supabase CLI (`supabase test db` / pgTAP), Deno (Edge Functions).

**Spec:** [`REVIEW-2026-11-08.md`](./REVIEW-2026-11-08.md) mục B (bảo mật DB), C (lệch schema), D (AI gateway).

## Global Constraints

- Xem Master Plan.
- **Không sửa `supabase/schema.sql` cũ để chạy lại.** Giữ nguyên làm baseline lịch sử; mọi thay đổi mới là `supabase/migrations/NNNN_name.sql`, chạy đúng 1 lần theo thứ tự.
- Hai dự án Supabase: **staging** (test, SQL test chạy ở đây hoặc Supabase local) và **prod**. Không chạy migration thử nghiệm trên prod.
- Không có hàm tiền nào nhận `user_id` của người khác từ client. Hàm gọi từ client lấy danh tính bằng `auth.uid()`.
- Hàm `credit_vitoken` / `debit_vitoken`: `REVOKE ALL ... FROM PUBLIC, anon, authenticated; GRANT EXECUTE ... TO service_role;`.
- ID của mọi thực thể bàn học là UUID v4 do client sinh bằng `crypto.randomUUID()`.

## Review Focus (mỗi dòng có test ở task sở hữu)

1. User sửa số dư của chính mình bằng `update profiles set vitoken_balance = 9999` → phải bị từ chối. (A.2)
2. User thường gọi `credit_vitoken(...)` qua RPC → `permission denied`. (A.2)
3. Người lạ **ghi/xóa** vào bàn học công khai của người khác → bị từ chối (hiện schema cho phép: `FOR ALL USING (... OR is_public = true)`). (A.2)
4. Người chưa mua đọc được `full_content_url` / nội dung đầy đủ của listing → phải bị chặn. (A.2)
5. Hai lệnh trừ token song song khi chỉ đủ tiền cho 1 → đúng 1 lệnh thành công, số dư không âm. (A.2)
6. Gọi `ai-chat` không có JWT / vượt rate limit / provider lỗi sau khi đã trừ token → 401 / 429 / tự hoàn token. (A.3)

---

## File Structure

```
vitest.config.ts                          [CREATE]
src/test/setup.ts                         [CREATE]
supabase/
  migrations/
    0001_hardening.sql                    [CREATE] — policy, quyền cột, hàm tiền, trigger profile
    0002_desk_items_alignment.sql         [CREATE] — khớp schema với DeskItem/DrawingStroke/IntelineThread
    0003_rate_limit_and_ai_costs.sql      [CREATE] — consume_rate_limit, ai_model_costs
  tests/
    hardening.test.sql                    [CREATE] — pgTAP cho 6 Review Focus
  functions/
    ai-chat/index.ts                      [CREATE]
    _shared/cors.ts, auth.ts              [CREATE]
src/
  lib/aiClient.ts                         [CREATE] — gọi ai-chat
  components/modals/IntelineModal.tsx     [MODIFY] — thay fetch('/api/ai/chat')
  app/api/ai/chat/route.ts                [DELETE sau khi A.3 pass]
```

---

### Task A.1: Hạ tầng test (hiện **chưa có** test runner nào trong repo)

**Files:** Create `vitest.config.ts`, `src/test/setup.ts`; Modify `package.json`.

**Interfaces:** Produces lệnh `pnpm test` (Vitest, jsdom) và `pnpm test:db` (`supabase test db`).

- [ ] **Step 1:** `pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event`.
- [ ] **Step 2:** Cấu hình alias `@` → `src`, environment `jsdom`, `setupFiles: ['src/test/setup.ts']` (import `@testing-library/jest-dom/vitest`).
- [ ] **Step 3:** Thêm scripts `"test": "vitest run"`, `"test:db": "supabase test db"`.
- [ ] **Step 4:** Viết smoke test `src/lib/sm2.smoke.test.ts` giả (`expect(1+1).toBe(2)`), chạy `pnpm test` → PASS, rồi xóa file.
- [ ] **Step 5:** Ghi vào `AGENTS.md` mục lệnh test. Commit: `chore(test): add vitest and supabase db test scripts`.

> Mọi plan khác dùng `jest.fn/jest.mock` → khi thực thi phải đọc là `vi.fn/vi.mock`.

---

### Task A.2: Migration `0001_hardening.sql` + pgTAP

**Files:** Create `supabase/migrations/0001_hardening.sql`, `supabase/tests/hardening.test.sql`.

**Interfaces — Produces:**
- Hàm trợ giúp: `can_view_space(p_space uuid) → boolean`, `can_edit_space(p_space uuid) → boolean` (owner hoặc `space_members.role IN ('owner','editor')`; view thêm `viewer` và `is_public`).
- `credit_vitoken(p_user uuid, p_amount int, p_type text, p_description text, p_reference text DEFAULT NULL) → int` (trả `balance_after`; idempotent theo `p_reference` unique; **service_role only**).
- `debit_vitoken(p_user uuid, p_amount int, p_type text, p_description text, p_reference text DEFAULT NULL) → int` (khóa hàng `FOR UPDATE`; `RAISE EXCEPTION 'insufficient_balance'` nếu thiếu; **service_role only**).
- `claim_daily_streak() → TABLE(earned int, streak int, balance_after int)` dùng `auth.uid()`, ngày tính theo `Asia/Ho_Chi_Minh`, mỗi ngày 1 lần.
- `process_know_inherit_purchase(p_listing uuid) → boolean` **viết lại**: dùng `auth.uid()` (bỏ tham số buyer), `FOR UPDATE` trên cả hai profile, chỉ mua listing `status='published'`, cấm tự mua, cấm mua lại, ghi `vitoken_transactions` cho **cả người mua và tác giả** (`know_inherit_buy` / `know_inherit_earning`), phí nền tảng 15% làm tròn theo công thức hiện có.
- Trigger `handle_new_user()` (`AFTER INSERT ON auth.users`): tạo `profiles` (+ `referral_code` nếu Plan 07 đã có cột) và 1 dòng `signup_grant`.

**Quy tắc phân quyền cần có trong migration:**
- `profiles`: `REVOKE UPDATE ON public.profiles FROM authenticated; GRANT UPDATE (display_name, avatar_url) ON public.profiles TO authenticated;` Cột `custom_openai_key_encrypted`, `custom_gemini_key_encrypted`, `oauth_chatgpt_token`: `REVOKE SELECT` khỏi `authenticated` (client chỉ biết "đã có key" qua view/hàm `has_byok_key`).
- `study_spaces`: SELECT = owner ∨ member ∨ `is_public`; INSERT/UPDATE/DELETE = chỉ owner. **Xóa policy `FOR ALL ... OR is_public = true`.**
- `desk_documents`, `desk_drawings`, `inteline_threads`, `document_pages`: SELECT = `can_view_space`, INSERT/UPDATE/DELETE = `can_edit_space`. (`document_pages` và `inteline_threads` hiện **chưa có policy nào**.)
- `vitoken_transactions`: chỉ SELECT dòng của mình; không ai INSERT/UPDATE/DELETE từ client.
- `vitoken_transactions.transaction_type` CHECK mở rộng: thêm `'purchase','referral','refund','signup_grant'`; thêm cột `reference TEXT UNIQUE`.
- `know_inherit_listings`: SELECT khi `status='published'` hoặc là tác giả; **`REVOKE SELECT (full_content_url)` khỏi `authenticated`/`anon`**; INSERT chỉ khi `author_id = auth.uid()`; `status` CHECK mở rộng thành `draft | pending_review | published | rejected | removed` (**một bộ giá trị duy nhất cho toàn dự án**). Nội dung đầy đủ nằm ở bucket private `listing-content`; storage policy cho đọc khi tồn tại dòng trong `know_inherit_purchases` của `auth.uid()` hoặc là tác giả.
- `know_inherit_purchases`: SELECT dòng của mình (người mua) hoặc của listing mình là tác giả; không có INSERT từ client.
- `space_members`: chủ bàn quản lý; thành viên tự `DELETE` dòng của mình (rời phòng).

- [ ] **Step 1:** Viết `hardening.test.sql` (pgTAP, `plan(N)`) cho 6 Review Focus + các case: viewer không ghi được; owner ghi được; mua listing khi thiếu tiền → exception; mua lần 2 → exception; tự mua → exception; người mua và tác giả đều có dòng transaction; `claim_daily_streak` gọi 2 lần/ngày → lần 2 `earned = 0`.
- [ ] **Step 2:** `pnpm test:db` → FAIL (chưa có migration).
- [ ] **Step 3:** Viết migration theo danh sách trên (một transaction `BEGIN; ... COMMIT;`).
- [ ] **Step 4:** `pnpm test:db` → PASS toàn bộ.
- [ ] **Step 5:** Chạy migration lên **staging**, tạo 2 user thật, thử lại thủ công Review Focus #1 và #3 qua `supabase-js`.
- [ ] **Step 6:** Commit: `feat(db): harden rls, lock down token functions, rewrite purchase rpc`.

---

### Task A.3: Migration `0002_desk_items_alignment.sql` (khớp schema với kiểu TypeScript)

Hiện schema **lệch** `src/types/studyspace.ts` (doc `04_DATA_MODEL.md` ghi "khớp 100%" là sai):
- `desk_documents.item_type` chỉ cho `paper|book|exam_sheet`, client có thêm `sticky_note`, `roadmap`.
- Thiếu: `cover_color`, `color_theme`, `width`, `height`, `sticky_text`, `sticky_color`, `text_align`, `is_bold`, `exam_data`, `source_documents`.
- `desk_drawings` thiếu `attached_to_item_id` (nét vẽ gắn theo tài liệu).
- `inteline_threads.target_sticky_id` trỏ `desk_sticky_notes`, nhưng client coi sticky là một `DeskItem` trong cùng mảng.

**Quyết định (đã chốt):** lưu **mọi** vật thể (kể cả sticky) trong `desk_documents`; bỏ dùng `desk_sticky_notes`.

- [ ] **Step 1:** Test pgTAP: insert item `sticky_note` có `sticky_text`; insert drawing có `attached_to_item_id`; thread trỏ `target_sticky_id` vào `desk_documents` → OK; xóa item → drawing gắn theo bị xóa theo (`ON DELETE CASCADE`).
- [ ] **Step 2:** Chạy → FAIL.
- [ ] **Step 3:** Migration: nới CHECK `item_type`; thêm các cột trên (`exam_data JSONB`, `source_documents JSONB`); thêm `desk_drawings.attached_to_item_id UUID REFERENCES desk_documents ON DELETE CASCADE`; đổi FK `inteline_threads.target_sticky_id` sang `desk_documents(id)`; thêm cột `updated_at TIMESTAMPTZ DEFAULT NOW()` + trigger cập nhật cho `desk_documents` (dùng cho resolve xung đột last-write-wins ở Plan 02); `ALTER TABLE desk_sticky_notes` giữ nguyên (không xóa, đánh dấu deprecated bằng `COMMENT`).
- [ ] **Step 4:** Chạy → PASS. Sinh lại `src/types/database.types.ts`.
- [ ] **Step 5:** Cập nhật `docs/ai/04_DATA_MODEL.md` (bảng Drift Status phải phản ánh đúng). Commit: `feat(db): align desk schema with client types`.

---

### Task A.4: Migration `0003` — rate limit + bảng giá AI

**Interfaces — Produces:**
- `ai_model_costs(model TEXT PK, vitoken_cost INT NOT NULL CHECK (vitoken_cost >= 0), enabled BOOLEAN)`; seed theo **D4 đã chốt**: `gpt-4o-mini` = 1, `gemini-1.5-flash` = 1, `gpt-4o` = 4 (kiểm tra tên model còn hiệu lực lúc thực thi; đổi bằng UPDATE bảng, không cần deploy lại).
- `consume_rate_limit(p_user uuid, p_action text, p_limit int, p_window interval) → TABLE(allowed boolean, remaining int, reset_at timestamptz)` — một câu `INSERT ... ON CONFLICT DO UPDATE` nguyên tử, reset khi `window_start + p_window < now()`; **service_role only**. `ai-chat` gọi hai lần: `(…,'ai_chat_hour', 20, '1 hour')` và `(…,'ai_chat_day', 60, '1 day')` cho chế độ `system`.

- [ ] **Step 1:** pgTAP: gọi 20 lần `limit=20` đều `allowed`; lần 21 `allowed=false`; sau khi lùi `window_start` 61 phút → `allowed=true`, `remaining=19`.
- [ ] **Step 2–4:** FAIL → viết migration → PASS.
- [ ] **Step 5:** Commit: `feat(db): rate limit and ai model costs`.

---

### Task A.5: Edge Function `ai-chat` (thay `/api/ai/chat`)

**Files:** Create `supabase/functions/ai-chat/index.ts`, `_shared/cors.ts`, `_shared/auth.ts`, `src/lib/aiClient.ts`; Modify `src/components/modals/IntelineModal.tsx` (và mọi nơi gọi `/api/ai/chat` — tìm bằng `grep "api/ai/chat" src`).

**Interfaces:**
- Request: `POST {SUPABASE_URL}/functions/v1/ai-chat`, header `Authorization: Bearer <user JWT>`; body `{ provider: 'system'|'byok_openai'|'byok_gemini'|'oauth_chatgpt', model?: string, prompt: string, context?: string, apiKey?: string, accessToken?: string }` (`apiKey` cho BYOK, `accessToken` cho `oauth_chatgpt`; cả hai chỉ đi theo từng request, không lưu).
- Response 200: `{ reply: string, provider: string, balanceAfter?: number }`; lỗi: `401 {error:'unauthorized'}`, `402 {error:'insufficient_balance'}`, `429 {error:'rate_limited', resetAt}`, `502 {error:'provider_failed'}`.
- `aiClient.askAi(req): Promise<AiResult>` — gắn JWT từ `supabase.auth.getSession()`, map lỗi sang tiếng Việt.

**Luồng trong function (thứ tự bắt buộc):** xác thực JWT → validate body (prompt ≤ giới hạn ký tự, model nằm trong `ai_model_costs.enabled`) → `consume_rate_limit(user,'ai_chat',20,'1 hour')` → nếu `system`: `debit_vitoken(user, cost, 'ai_usage', ..., reference = requestId)` → gọi provider → nếu provider lỗi: `credit_vitoken(..., 'refund', reference = 'refund:' + requestId)` rồi trả 502. BYOK: không trừ token, key lấy từ body (key lưu trên thiết bị, không lưu server — xem Plan 06 Task 6.1).

**Ghi chú phạm vi:**
- Khách (chưa đăng nhập) **không dùng AI**; bộ máy Non-AI vẫn miễn phí. UI hiện "Đăng nhập để dùng AI".
- Chế độ `oauth_chatgpt` (gọi `chatgpt.com/backend-api/codex` với `originator: codex_cli_rs`) **được bật theo D3** (`NEXT_PUBLIC_ENABLE_CODEX_OAUTH=true`, vẫn là cờ để tắt nhanh). Yêu cầu: chạy **qua Edge Function** (trình duyệt gọi thẳng sẽ bị CORS); access token lấy từ thiết bị người dùng (gửi theo từng request như BYOK, **không lưu server**); không trừ ViToken; UI ghi chú "cơ chế không chính thức, có thể ngừng hoạt động"; khi gọi lỗi (401/403/chặn IP/đổi giao thức) trả `502 { error: 'codex_unavailable' }` để UI gợi ý chuyển sang chế độ `system`/Gemini. Đưa vào test: lỗi Codex không trừ token và không làm hỏng các provider khác. **Không** để buổi thuyết trình phụ thuộc duy nhất vào chế độ này.
- Giới hạn bảo vệ ngân sách (D4): `prompt + context` ≤ 12.000 ký tự (vượt → `400 { error: 'too_long' }`); `max_tokens` đầu ra ≤ 800 (OpenAI) / `maxOutputTokens` ≤ 800 (Gemini).
- CORS: cho phép origin GitHub Pages / domain riêng và `https://*.discordsays.com`.

- [ ] **Step 1:** Viết test Deno cho các nhánh: thiếu JWT → 401; rate limit hết → 429 và **không** gọi provider; thiếu số dư → 402 và **không** gọi provider; provider ném lỗi (mock `fetch`) → số dư trở về như cũ và có 2 dòng transaction (`ai_usage`, `refund`); BYOK → không có dòng transaction.
- [ ] **Step 2:** `deno test supabase/functions/ai-chat` → FAIL.
- [ ] **Step 3:** Implement function theo luồng trên (port logic gọi OpenAI/Gemini từ `src/app/api/ai/chat/route.ts`, giữ chuẩn hóa NFC prompt).
- [ ] **Step 4:** `deno test` → PASS. Deploy lên staging, gọi thật bằng `curl` có JWT thật.
- [ ] **Step 5:** Implement `aiClient.ts`; đổi `IntelineModal` và các nơi khác sang `askAi`. Test component: lỗi 402/429 hiện đúng thông báo tiếng Việt.
- [ ] **Step 6:** Xóa `src/app/api/ai/chat/route.ts`; `GITHUB_PAGES=true pnpm build` → PASS, kiểm tra `out/` và bundle **không còn** chuỗi `/api/ai/chat`.
- [ ] **Step 7:** `pnpm run docs:index`; cập nhật `05_API_AND_ROUTES.md` (route Next đã bị thay bằng Edge Function), `11_CHANGELOG.md`. Commit: `feat(ai): move ai gateway to supabase edge function`.
