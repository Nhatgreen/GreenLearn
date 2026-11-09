# Plan 02 — Kết Nối Supabase Cloud (Chuyển Từ localStorage)

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans`.

**Goal:** Chuyển toàn bộ dữ liệu ViTudy (bàn học, tài liệu, ViToken, nét vẽ, threads) từ `localStorage` sang Supabase Cloud, kết hợp offline-first với IndexedDB.

**Architecture:** Service Layer pattern — tạo các `*Service` class thuần TypeScript encapsulate mọi Supabase query. `StudySpaceContext` và `ViTokenContext` gọi Service, không gọi Supabase trực tiếp. Offline: ghi vào IndexedDB trước, sync lên Supabase khi online. ViToken mutations bắt buộc qua Supabase RPC (không write trực tiếp từ client).

**Tech Stack:** `@supabase/supabase-js` v2, `idb` (IndexedDB wrapper, cần thêm), Supabase CLI.

> **Điều kiện tiên quyết:** Plan 02a (policy đã siết, hàm token service_role, schema đã khớp kiểu client, Edge Function `ai-chat`) và Plan 01 (có `user.id`).
> **Sửa sau rà soát:** (1) Task 2.1 chỉ còn là "áp migration + trigger" vì `schema.sql` đã được thay bằng `migrations/` ở 02a; (2) **bỏ** Edge Function `spend-tokens`/`add-tokens` — tiền chỉ đi qua hàm DB service_role; (3) id phải là UUID, migrate có bảng remap; (4) auto-save theo dirty tracking, không ghi cả bàn; (5) offline queue có task riêng. Xem [`REVIEW-2026-11-08.md`](./REVIEW-2026-11-08.md) B2–B6.

**Spec:** [`docs/superpowers/plans/2026-11-08-00-master-roadmap.md`](./2026-11-08-00-master-roadmap.md) → Trụ 2.

## Global Constraints

- Xem Global Constraints của Master Plan.
- **Client KHÔNG ghi `vitoken_balance`** — bảo đảm bằng `REVOKE UPDATE` ở Plan 02a (không chỉ bằng quy ước).
- **Schema:** chạy theo `supabase/migrations/` (Plan 02a). Không dán lại `schema.sql`.
- File upload tối đa 20MB per file, bucket `documents` private, RLS theo thư mục `{uid}/`.
- Khi Supabase chưa cấu hình (`isConfigured = false`) hoặc `status==='guest'`: dùng localStorage — không crash.
- Id mọi thực thể là UUID v4 do client sinh (`crypto.randomUUID()`); cập nhật `src/data/mockSpaces.ts` và nơi sinh id (`addStickyNote`, `createSpace`, …) cho khớp.

## Review Focus

1. **RLS policy test:** Dùng `supabase.auth.signInAsUser(userB)` rồi query dữ liệu userA → expect 0 rows.
2. **Offline queue không mất khi refresh:** Thêm item khi offline → F5 → online → item vẫn được sync.
3. **ViToken race condition:** Gọi `rpc('spend_tokens')` 2 lần song song cùng amount → tổng trừ chỉ 1 lần (idempotency hoặc serialized).
4. **Migration không ghi đè dữ liệu cloud:** Nếu user đã có data cloud, migration localStorage KHÔNG được overwrite.
5. **Storage file path với basePath:** File URL từ Supabase Storage phải accessible từ GitHub Pages domain.

---

## File Structure

```
supabase/
  migrations/0004_storage.sql [CREATE] — buckets avatars/documents + policy
  functions/
    delete-user/
      index.ts               [CREATE] — Edge Function: xóa user (JWT → uid)
src/
  services/
    StudySpaceService.ts     [CREATE] — CRUD bàn học và vật thể
    DocumentService.ts       [CREATE] — upload/download tài liệu, Supabase Storage
    ViTokenService.ts        [CREATE] — đọc số dư, lịch sử, gọi RPC spend/add
    SyncService.ts           [CREATE] — offline queue, IndexedDB, sync logic
  context/
    StudySpaceContext.tsx    [MODIFY] — gọi StudySpaceService thay vì localStorage
    ViTokenContext.tsx       [MODIFY] — gọi ViTokenService thay vì localStorage
  lib/
    indexeddb.ts             [CREATE] — wrapper IDB cho offline storage
    supabase.ts              [MODIFY] — thêm typed Database generic
  types/
    database.types.ts        [CREATE] — generated Supabase types (từ CLI)
```

---

### Task 2.1: Áp Migration Lên Staging/Prod & Tạo Types

**Files:** Modify `supabase/` (không sửa `schema.sql` cũ).

**Interfaces:**
- Produces: staging và prod đều ở trạng thái `schema.sql` (baseline) + `migrations/0001..0003`; trigger `handle_new_user` đã chạy (do 0001); `src/types/database.types.ts` sinh ra từ staging.

- [ ] **Step 1:** Trên **staging**: chạy baseline `schema.sql`, rồi `supabase db push` các migration 0001–0003. Chạy `pnpm test:db` → PASS.
- [ ] **Step 2:** Tạo bucket Storage: `avatars` (public read, ghi chỉ vào thư mục `{uid}/`), `documents` (private; policy: chỉ owner đọc/ghi `{uid}/...`; giới hạn 20MB, MIME `application/pdf`, `image/*`), `listing-content` (private, xem 02a). Thêm vào migration `0004_storage.sql` để lặp lại được.
- [ ] **Step 3:** Verify trên staging: đăng ký 1 user thật → có dòng `profiles` + 1 dòng `vitoken_transactions` loại `signup_grant`.
- [ ] **Step 4:** `npx supabase gen types typescript --project-id <staging> > src/types/database.types.ts`; `pnpm build` PASS.
- [ ] **Step 5:** Sau khi staging xanh mới áp lên **prod** (thủ công, `[OWNER]` xác nhận).
- [ ] **Step 6:** Commit: `feat(db): storage buckets migration and generated types`.

---

### Task 2.2: Hàm xóa tài khoản (Edge Function `delete-user`)

**Files:** Create `supabase/functions/delete-user/index.ts`.

> `spend-tokens` / `add-tokens` **đã bị loại** (A6/B6). Cộng tiền: Sepay webhook (Plan 03) và Edge Function `ai-chat` gọi `credit_vitoken`/`debit_vitoken` bằng service role. Client chỉ gọi hàm có `auth.uid()` (`claim_daily_streak`, `process_know_inherit_purchase`).

**Interfaces — Produces:** `POST /functions/v1/delete-user`, không body; xác thực JWT; xóa file Storage `avatars/{uid}`, `documents/{uid}`; gọi `auth.admin.deleteUser(uid)`; trả `{ success: true }`.

- [ ] **Step 1:** Test Deno: thiếu JWT → 401; có JWT hợp lệ → gọi `deleteUser` đúng với `uid` trong JWT (mock admin client) và **bỏ qua** mọi `user_id` trong body.
- [ ] **Step 2–4:** FAIL → implement → PASS; deploy staging.
- [ ] **Step 5:** Commit: `feat(functions): delete-user edge function`.

---

### Task 2.3: StudySpaceService — CRUD Bàn Học

**Files:**
- Create: `src/services/StudySpaceService.ts`

**Interfaces:**
- Consumes: `getSupabase()`, `Database` types từ Task 2.1.
- Produces:
  - `StudySpaceService.loadSpaces(userId: string): Promise<StudySpace[]>`
  - `StudySpaceService.saveSpace(space: StudySpace, userId: string): Promise<void>`
  - `StudySpaceService.deleteSpace(spaceId: string): Promise<void>`
  - `StudySpaceService.saveItem(spaceId: string, item: DeskItem): Promise<void>`
  - `StudySpaceService.deleteItem(itemId: string): Promise<void>`
  - `StudySpaceService.saveStrokes(spaceId: string, strokes: DrawingStroke[]): Promise<void>`
  - `StudySpaceService.saveThreads(spaceId: string, threads: IntelineThread[]): Promise<void>`

- [ ] **Step 1:** Viết test:
  ```ts
  // Test: loadSpaces trả về [] khi Supabase chưa cấu hình
  const mockGetSupabase = vi.fn().mockReturnValue(null)
  const result = await StudySpaceService.loadSpaces('user-1')
  expect(result).toEqual([])
  ```
- [ ] **Step 2:** Chạy test, verify FAIL.
- [ ] **Step 3:** Implement `StudySpaceService.ts`:
  - `loadSpaces`: một query lồng cho `study_spaces` + `desk_documents` + `desk_drawings` + `inteline_threads`; trang (`document_pages`) **tải theo yêu cầu** khi mở sách (không kéo toàn bộ nội dung mọi sách lúc khởi động). Sticky nằm trong `desk_documents` (quyết định ở Plan 02a Task A.3).
  - Mapper hai chiều `rowToDeskItem` / `deskItemToRow` (snake_case ↔ camelCase, gồm `exam_data`, `cover_color`, `sticky_*`, `attached_to_item_id`). Mỗi mapper có test round-trip: `rowToDeskItem(deskItemToRow(x))` bằng `x` cho đủ 4 loại item.
  - **Ghi theo thực thể bị đổi (dirty tracking):** `StudySpaceService.upsertItems(spaceId, items: DeskItem[])` chỉ nhận các item có thay đổi; trang sách ghi vào `document_pages` **chỉ khi nội dung trang đổi** (so hash). Cấm hàm "lưu cả bàn" trong vòng lặp auto-save.
  - **Xung đột:** last-write-wins theo `updated_at` (server). Khi đọc về mà `updated_at` server mới hơn bản local đang chờ ghi → hiển thị bản server và bỏ thay đổi local của chính item đó.
  - Nếu `supabase === null`: return `[]` / no-op (không crash).
- [ ] **Step 4:** Chạy test, verify PASS.
- [ ] **Step 5:** Commit: `feat(service): add StudySpaceService for cloud CRUD`.

---

### Task 2.4: Modify StudySpaceContext — Gọi Service

**Files:**
- Modify: `src/context/StudySpaceContext.tsx`

**Interfaces:**
- Consumes: `StudySpaceService` từ Task 2.3, `useAuth()` từ Plan 01.
- Produces: Context vẫn giữ nguyên interface (không thay đổi API surface) nhưng bên trong đọc từ Supabase thay vì localStorage khi user đăng nhập.

- [ ] **Step 1:** Thêm logic trong `StudySpaceContext`:
  - Khi `user` thay đổi sang non-null: gọi `StudySpaceService.loadSpaces(user.id)` và merge với localStorage (ưu tiên cloud).
  - Khi `user === null`: tiếp tục dùng localStorage như cũ.
  - Mọi mutation (addItem, updateItem, removeItem) → gọi service tương ứng song song với update state.
- [ ] **Step 2:** Thêm debounce 500ms cho auto-save để không spam Supabase mỗi pixel kéo.
- [ ] **Step 3:** Test: đăng nhập → tải trang → verify bàn học load từ Supabase (kiểm tra network tab).
- [ ] **Step 4:** Verify: `pnpm build` pass.
- [ ] **Step 5:** Commit: `feat(context): StudySpaceContext reads/writes Supabase when logged in`.

---

### Task 2.5: ViTokenService & Modify ViTokenContext

**Files:**
- Create: `src/services/ViTokenService.ts`
- Modify: `src/context/ViTokenContext.tsx`

**Interfaces:**
- Produces:
  - `ViTokenService.getWallet(): Promise<ViTokenWallet>` (đọc `vitoken_balance`, `daily_streak_days`, `last_claim_date` của `auth.uid()`)
  - `ViTokenService.getHistory(limit = 50): Promise<ViTokenTransaction[]>`
  - `ViTokenService.claimStreak(): Promise<{ success: boolean; earned: number; streak: number; balanceAfter: number }>` — gọi RPC `claim_daily_streak()` (02a)
  - `ViTokenService.purchaseListing(listingId: string): Promise<void>` — gọi RPC `process_know_inherit_purchase(p_listing)`
  - **Không có** `spendTokens` / `addTokens` ở client. Chi tiêu AI được trừ **bên trong** `ai-chat`; khi đăng nhập, `ViTokenContext.spendTokens/addTokens` bị loại khỏi API (chỉ còn khi khách dùng ví demo cục bộ).
- Client cập nhật số dư hiển thị bằng cách đọc lại ví sau mỗi hành động (hoặc `balanceAfter` trả về), không tự cộng trừ.

- [ ] **Step 1:** Viết test: `claimStreak` gọi `supabase.rpc('claim_daily_streak')`; `getWallet` đọc đúng cột và map sang `ViTokenWallet`; khi chưa đăng nhập `getWallet` ném lỗi `not_authenticated`.
- [ ] **Step 2:** Chạy test, verify FAIL.
- [ ] **Step 3:** Implement `ViTokenService.ts` như trên.
- [ ] **Step 4:** Chạy test, verify PASS.
- [ ] **Step 5:** Modify `ViTokenContext.tsx`: khi `status==='authenticated'` nạp ví từ Service và subscribe Realtime `postgres_changes` trên `profiles` (lọc `id=eq.<uid>`) để số dư tự cập nhật khi webhook nạp tiền (Plan 03) cộng token. Điểm danh: gửi heartbeat hoạt động (xem Plan 05 Task 5B.2, bảng `study_sessions`) thay vì tin `activeSecondsOnDesk` cục bộ (quyết định D7); trước khi có heartbeat, giữ kiểm tra 180s ở client và ghi `// ponytail: client-side check, harden with study_sessions`.
- [ ] **Step 6:** Verify: `pnpm build` pass.
- [ ] **Step 7:** Commit: `feat(service): add ViTokenService with cloud sync`.

---

### Task 2.6: DocumentService — Upload File Supabase Storage

**Files:**
- Create: `src/services/DocumentService.ts`

**Interfaces:**
- Produces:
  - `DocumentService.uploadFile(file: File, userId: string): Promise<{ path: string; publicUrl: string }>`
  - `DocumentService.getFileUrl(path: string): string`
  - `DocumentService.deleteFile(path: string): Promise<void>`

- [ ] **Step 1:** Viết test:
  ```ts
  // Test: uploadFile trả về path khi Supabase upload thành công
  const mockUpload = vi.fn().mockResolvedValue({ data: { path: 'user-1/doc.pdf' }, error: null })
  // ... mock supabase.storage.from().upload()
  const result = await DocumentService.uploadFile(mockFile, 'user-1')
  expect(result.path).toBe('user-1/doc.pdf')
  ```
- [ ] **Step 2:** Chạy test, verify FAIL.
- [ ] **Step 3:** Implement `DocumentService.ts`:
  - `uploadFile`: bucket `documents`, path = `{userId}/{Date.now()}-{file.name}`. Reject file > 20MB.
  - `getFileUrl`: `supabase.storage.from('documents').getPublicUrl(path)`.
  - Tích hợp vào `addUploadedDocument` trong `StudySpaceContext`.
- [ ] **Step 4:** Chạy test, verify PASS.
- [ ] **Step 5:** Commit: `feat(service): add DocumentService for Supabase Storage`.

---

### Task 2.7: Migration localStorage → Cloud & IndexedDB Offline

**Files:**
- Create: `src/lib/indexeddb.ts`
- Create: `src/services/SyncService.ts`
- Create: `src/components/auth/MigrationDialog.tsx`

**Interfaces:**
- Produces:
  - `SyncService.hasPendingLocalData(): boolean`
  - `SyncService.migrateToCloud(userId: string): Promise<{ migrated: number; errors: string[] }>`
  - `MigrationDialog`: hiển thị khi user đăng nhập lần đầu và có dữ liệu localStorage.

- [ ] **Step 1:** Implement `src/lib/indexeddb.ts`: wrapper `get(key)`, `set(key, value)`, `delete(key)`, `keys()` (dùng `idb`).
- [ ] **Step 2:** Test trước `SyncService.migrateToCloud` với fixture là `INITIAL_SPACES` thật (`src/data/mockSpaces.ts`):
  ```ts
  // id cũ dạng chuỗi ('book-1') phải thành UUID mới; thread/stroke phải trỏ đúng id mới
  const r = await SyncService.migrateToCloud('u1')
  expect(r.idMap['book-1']).toMatch(UUID_RE)
  expect(savedThreads.every(t => Object.values(r.idMap).includes(t.sourceItemId))).toBe(true)
  // chạy lần 2 không nhân đôi dữ liệu
  const r2 = await SyncService.migrateToCloud('u1')
  expect(r2.migrated).toBe(0)
  ```
- [ ] **Step 3:** Implement `SyncService`:
  - `hasPendingLocalData(): boolean` — `localStorage['vitudy_spaces']` có dữ liệu **khác** bộ demo mặc định (so với `INITIAL_SPACES`), và chưa có cờ `vitudy_migrated_<uid>`.
  - `migrateToCloud(userId): Promise<{ migrated: number; idMap: Record<string,string>; errors: string[] }>` — tạo bảng remap `idCũ → crypto.randomUUID()`, ghi item trước, rồi nét vẽ/thread với id đã remap; **chỉ chạy khi cloud của user đang rỗng** (nếu đã có bàn trên cloud → không ghi đè, hiện lựa chọn "Giữ bản cloud / Thêm bàn local như một bàn mới"); thành công thì ghi cờ `vitudy_migrated_<uid>` (idempotent). Không xóa localStorage (làm backup).
  - **Ví demo không migrate** (ViToken thật không được mang từ localStorage lên — tránh nhập số dư giả). Chỉ migrate nội dung học.
- [ ] **Step 4:** Implement `MigrationDialog.tsx` (2 nút "Đồng bộ lên đám mây" / "Bỏ qua") và tích hợp: hiện khi `status` chuyển `guest → authenticated` và `hasPendingLocalData()`.
- [ ] **Step 5:** Verify: `pnpm test`, `pnpm build` pass.
- [ ] **Step 6:** Commit: `feat(sync): localstorage to cloud migration with id remap`.

---

### Task 2.8: Hàng Đợi Offline

**Files:** Create `src/services/OfflineQueue.ts`; Modify `StudySpaceService.ts`.

**Interfaces — Produces:** `OfflineQueue.enqueue(op: { table: string; kind: 'upsert'|'delete'; row: object; clientTs: number }): Promise<void>`; `OfflineQueue.flush(): Promise<{ done: number; failed: number }>` (gọi khi sự kiện `online` và khi khởi động); lưu trong IndexedDB (sống qua F5).

- [ ] **Step 1:** Test: mất mạng → `upsertItems` đẩy vào queue thay vì ném lỗi; F5 (tạo instance mới) → queue vẫn còn; `flush()` khi online ghi đủ và rỗng queue; hai op cùng item được gộp (giữ op mới nhất); op bị server từ chối vĩnh viễn (403/400) chuyển sang `failed` và báo người dùng, không lặp vô hạn.
- [ ] **Step 2–4:** FAIL → implement → PASS.
- [ ] **Step 5:** Hiển thị trạng thái đồng bộ ("Đã lưu" / "Đang lưu..." / "Chưa đồng bộ (offline)") trên HUD — dùng icon SVG, không emoji.
- [ ] **Step 6:** `pnpm run docs:index`; cập nhật `docs/ai/11_CHANGELOG.md`. Commit: `feat(sync): offline queue with indexeddb`.
