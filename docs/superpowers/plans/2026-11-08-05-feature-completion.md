# Plan 05 — Feature Completion (PDF.js, SM-2, Chợ, Multiplayer, Dashboard)

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans`.

**Goal:** Hoàn thiện các tính năng sản phẩm còn thiếu: render PDF thật, Spaced Repetition SM-2 cho Flashcard, Chợ KnowInherit đầy đủ (duyệt/xem trước/đánh giá), Multiplayer realtime thật, Dashboard thống kê học tập.

**Architecture:** Tách thành 4 sub-streams độc lập có thể thực thi song song (5A/5B/5C/5D) sau khi Plan 02 (Supabase Cloud) hoàn thành.

**Tech Stack:** `pdfjs-dist` (PDF render), SM-2 thuần TS, Supabase Realtime (Presence + Broadcast + `postgres_changes`), CSS/SVG thuần cho biểu đồ (không thêm thư viện chart), `dompurify` (nội dung chợ), `jspdf` (xuất PDF).

> **Điều kiện tiên quyết:** Plan 02a + 02. **Sửa sau rà soát** ([`REVIEW-2026-11-08.md`](./REVIEW-2026-11-08.md) B10–B12, A4): PDF.js phải `ssr:false` + worker qua `new URL(..., import.meta.url)`; thêm bảng nguồn cho Dashboard (`study_sessions`, `exam_attempts`); trạng thái listing thống nhất; mua/đọc nội dung chợ qua RPC + storage policy (không qua cột `full_content_url`); bổ sung các hạng mục roadmap bị sót (upload ảnh/giới hạn, đồng bộ vật thể, quyền phòng, Pomodoro, xuất PDF, trang tác giả). Test dùng Vitest (`vi.*`).

**Spec:** [`docs/superpowers/plans/2026-11-08-00-master-roadmap.md`](./2026-11-08-00-master-roadmap.md) → Trụ 5.

## Global Constraints

- Xem Global Constraints của Master Plan.
- **PDF.js:** import bằng `next/dynamic` với `ssr:false` (import tĩnh làm build/SSR lỗi `DOMMatrix is not defined`). Worker: `GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()` (bundler tự xử lý `basePath`). File PDF lấy bằng **signed URL** của bucket `documents` (private), hết hạn 1 giờ.
- **SM-2:** Lịch ôn tập lưu trong bảng `flashcard_reviews` (migration `0008_learning.sql`).
- **Trạng thái listing (một bộ duy nhất):** `draft | pending_review | published | rejected | removed`. Chợ chỉ hiển thị `published`.
- **Nội dung chợ trả phí:** nằm ở bucket private `listing-content`; chỉ đọc được qua storage policy (đã mua hoặc là tác giả). Cột `full_content_url` bị `REVOKE SELECT`. Xem trước chỉ dùng `preview_content` (≤ 2 trang).
- **Multiplayer:** Presence + cursor (Broadcast, debounce 50ms) và đồng bộ vật thể bằng `postgres_changes` trên `desk_documents`/`desk_drawings` (các bảng đã nằm trong publication `supabase_realtime`); phát delta, không phát toàn bộ state; bỏ qua sự kiện do chính mình gây ra (so `updated_by`/clientId).
- **Dashboard:** chỉ dùng dữ liệu Supabase (`study_sessions`, `exam_attempts`, `flashcard_reviews`, `vitoken_transactions`).
- **Upload:** tối đa 20MB/file (kiểm tra client **và** giới hạn bucket); loại cho phép `application/pdf`, `image/jpeg`, `image/png`, `image/webp`.

## Review Focus

1. **PDF.js CORS:** File PDF từ Supabase Storage phải có CORS header cho phép domain GitHub Pages đọc.
2. **SM-2 negative interval:** Nếu user trả lời sai nhiều lần, `interval` không được âm — clamp về 1 ngày.
3. **Chợ preview leak:** User không được đọc nội dung đầy đủ qua Network tab khi chưa mua — preview content chỉ gửi X ký tự từ server.
4. **Multiplayer broadcast flood:** 60fps cursor movement không được flood channel — debounce 50ms.
5. **Dashboard empty state:** User mới chưa có data → hiển thị placeholder hướng dẫn, không crash.

---

## Sub-Stream 5A: PDF.js Render Thật

### Task 5A.1: Tích Hợp PDF.js

**Files:**
- Modify: `src/components/objects/BookSpread.tsx`
- Modify: `src/components/modals/FullScreenDocModal.tsx`
- Create: `src/lib/pdfRenderer.ts`

**Interfaces:**
- Produces:
  - `pdfRenderer.loadDocument(url: string): Promise<PDFDocumentProxy>`
  - `pdfRenderer.renderPage(doc: PDFDocumentProxy, pageNum: number, canvas: HTMLCanvasElement, scale: number): Promise<void>`

- [ ] **Step 1:** Thêm dependency: `pnpm add pdfjs-dist`.
- [ ] **Step 2:** Viết test:
  ```ts
  // Test: loadDocument trả về document với pageCount đúng
  const doc = await pdfRenderer.loadDocument('/test.pdf')
  expect(doc.numPages).toBeGreaterThan(0)
  ```
- [ ] **Step 3:** Chạy test, verify FAIL.
- [ ] **Step 4:** Implement `src/lib/pdfRenderer.ts` (chỉ được import từ component đã nạp bằng `next/dynamic({ ssr:false })`):
  - `workerSrc` như Global Constraints.
  - `loadDocument(url)`: `pdfjsLib.getDocument(url).promise`; hủy (`destroy()`) khi unmount.
  - `renderPage(doc, pageNum, canvas, scale)`: `page.render({ canvasContext, viewport })`; nhân `devicePixelRatio` (giới hạn 2) để chữ sắc nét; huỷ `renderTask` khi lật trang nhanh.
- [ ] **Step 5:** Modify `BookSpread.tsx`: khi `item.storagePath` tồn tại, render từng trang bằng `<canvas>` thay vì `<p>`. Lớp chữ để chọn/bôi đen (Inteline) dùng `pdfjs` text layer hoặc fallback văn bản đã trích (`document_pages.content`) — **không được** làm mất khả năng bôi đen để hỏi Inteline. Giữ fallback text khi không có PDF.
- [ ] **Step 6:** Modify `FullScreenDocModal.tsx`: tương tự.
- [ ] **Step 7:** Chạy test, verify PASS.
- [ ] **Step 8:** Verify: `GITHUB_PAGES=true pnpm build` pass; mở file PDF trên bản preview `out/` (serve tĩnh) không có 404 worker; PDF mật khẩu/hỏng → thông báo lỗi tiếng Việt, không crash.
- [ ] **Step 9:** Commit: `feat(pdf): integrate pdfjs for real pdf rendering`.

---

### Task 5A.2: Upload tài liệu (PDF + ảnh), giới hạn & trích văn bản

**Files:** Modify `src/components/hud/BottomLeftKnowledge.tsx`, `src/services/DocumentService.ts`; Create `src/lib/extractPdfText.ts`, `src/lib/imageCompress.ts`.

**Interfaces — Produces:** `extractPdfText(doc): Promise<{ pageNumber:number; text:string }[]>` (ghi `document_pages.content` để Non-AI engine/Inteline/tìm kiếm dùng được); `compressImage(file: File, maxEdge = 2000): Promise<Blob>` (WebP, chất lượng 0.85); ảnh thành `PaperSheet` có ảnh toàn trang; `validateUpload(file): { ok: true } | { ok: false; reason: 'too_large'|'bad_type' }`.

- [ ] **Step 1:** Test: file 21MB → `too_large`; `.exe` → `bad_type`; ảnh 4000px → cạnh dài ≤ 2000 sau nén; PDF 3 trang → `extractPdfText` trả 3 phần tử; PDF scan (không có text) → trả text rỗng và UI gợi ý chạy OCR (Tesseract đã có).
- [ ] **Step 2–4:** FAIL → implement → PASS.
- [ ] **Step 5:** Commit: `feat(upload): image pages, size limits and pdf text extraction`.

> **Hoãn có chủ đích:** hỗ trợ DOCX/PPTX (roadmap 5A.2 cũ, P2) — làm sau khi có số liệu người dùng cần.

---

## Sub-Stream 5B: Spaced Repetition SM-2 & Thống Kê

### Task 5B.1: Thuật Toán SM-2 & Schema

**Files:**
- Create: `supabase/migrations/0008_learning.sql` — **file migration chung** cho cả Task 5B.1 (bảng `flashcard_reviews`) và Task 5B.2 (`study_sessions`, `exam_attempts`, RPC). Làm 5B.1 trước, 5B.2 append vào cùng file trước khi apply.
- Create: `src/lib/sm2.ts`
- Create: `src/services/FlashcardService.ts`

**Interfaces:**
- Produces:
  - `sm2.calculateNextReview(quality: 0|1|2|3|4|5, card: SM2Card): SM2Card`
  - `SM2Card = { easinessFactor: number, interval: number, repetitions: number, nextReviewDate: string }`
  - `FlashcardService.getCardsForReview(userId: string): Promise<FlashcardReview[]>`
  - `FlashcardService.submitReview(cardId: string, quality: number): Promise<SM2Card>`

- [ ] **Step 1:** Thêm vào `supabase/migrations/0008_learning.sql` (tạo mới nếu chưa có):
  ```sql
  CREATE TABLE public.flashcard_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES desk_documents(id) ON DELETE CASCADE,
    card_hash TEXT NOT NULL, -- hash của front+back text
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    easiness_factor FLOAT NOT NULL DEFAULT 2.5,
    interval_days INT NOT NULL DEFAULT 1,
    repetitions INT NOT NULL DEFAULT 0,
    next_review_date DATE NOT NULL DEFAULT CURRENT_DATE,
    last_reviewed_at TIMESTAMPTZ,
    UNIQUE(user_id, card_hash)
  );
  ALTER TABLE public.flashcard_reviews ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users manage own reviews" ON public.flashcard_reviews
    FOR ALL USING (auth.uid() = user_id);
  ```
- [ ] **Step 2:** Implement `src/lib/sm2.ts` — thuật toán SM-2 chuẩn:
  ```ts
  // Test: quality=5 (hoàn hảo) tăng easinessFactor và interval
  const card = { easinessFactor: 2.5, interval: 1, repetitions: 0, nextReviewDate: '2026-11-08' }
  const next = sm2.calculateNextReview(5, card)
  expect(next.interval).toBeGreaterThan(1)
  expect(next.easinessFactor).toBeGreaterThanOrEqual(2.5)
  // Test: quality=0 (quên hoàn toàn) reset repetitions về 0
  const failed = sm2.calculateNextReview(0, card)
  expect(failed.repetitions).toBe(0)
  expect(failed.interval).toBe(1)
  ```
- [ ] **Step 3:** Chạy test, verify FAIL.
- [ ] **Step 4:** Implement `sm2.calculateNextReview`:
  - Nếu `quality >= 3`: tính `interval` mới theo công thức SM-2 chuẩn, tăng `repetitions`, cập nhật `easinessFactor`.
  - Nếu `quality < 3`: reset `repetitions = 0`, `interval = 1`.
  - Clamp `easinessFactor >= 1.3`.
  - Clamp `interval >= 1`.
- [ ] **Step 5:** Chạy test, verify PASS.
- [ ] **Step 6:** Implement `FlashcardService.ts`: `getCardsForReview` lọc `next_review_date <= TODAY`, `submitReview` gọi `sm2.calculateNextReview` rồi upsert.
- [ ] **Step 7:** Modify `FlashcardTab.tsx` trong `StudyToolsModal`: thêm chế độ "Ôn tập hôm nay" (cards đến hạn từ SM-2) bên cạnh chế độ xem tất cả.
- [ ] **Step 8:** Commit: `feat(sm2): add spaced repetition algorithm and flashcard scheduling`.

---

### Task 5B.2: Nguồn dữ liệu học tập (`study_sessions`, `exam_attempts`)

Dashboard cần dữ liệu mà hiện **không được lưu ở đâu** (`activeSecondsOnDesk` chỉ ở RAM; kết quả thi không lưu). Làm trước khi vẽ biểu đồ.

**Files:** Create `supabase/migrations/0008_learning.sql` (cùng `flashcard_reviews` ở 5B.1), `src/services/ActivityService.ts`.

**Interfaces:**
- `study_sessions(id, user_id, day DATE, seconds INT, UNIQUE(user_id, day))` + RPC `record_heartbeat(p_seconds int)` dùng `auth.uid()`, **cộng tối đa 30 giây mỗi lần gọi** và tối đa 1 lần/20 giây/user (chặn giả mạo thời gian), tính ngày theo `Asia/Ho_Chi_Minh`.
- `exam_attempts(id, user_id, document_id, score numeric, total int, correct int, taken_at)`; INSERT qua RPC `submit_exam_attempt(...)` (dùng `auth.uid()`).
- `ActivityService.startHeartbeat(isActive: () => boolean): () => void` — gọi `record_heartbeat(20)` mỗi 20 giây **chỉ khi** tab hiển thị và có tương tác trong 60 giây gần nhất; trả hàm dừng.
- Điểm danh (`claim_daily_streak`, Plan 02a) đọc `study_sessions` của hôm nay ≥ 180 giây thay cho biến RAM (quyết định D7).

- [ ] **Step 1:** pgTAP: heartbeat 2 lần liên tiếp < 20 giây → chỉ lần đầu cộng; seconds âm/quá lớn bị kẹp; user A không đọc `study_sessions` của B; `claim_daily_streak` từ chối khi hôm nay < 180 giây.
- [ ] **Step 2:** Test client: `startHeartbeat` không gọi khi tab ẩn / không tương tác; hàm dừng hủy timer.
- [ ] **Step 3:** FAIL → implement → PASS. Gọi `submit_exam_attempt` khi chấm bài ở `PaperSheet`/`ExamQuizCard` (người đăng nhập).
- [ ] **Step 4:** Commit: `feat(learning): study sessions heartbeat and exam attempts`.

---

### Task 5B.3: Dashboard Thống Kê Học Tập

**Files:**
- Create: `src/app/dashboard/page.tsx`
- Create: `src/components/dashboard/StudyStats.tsx`
- Create: `src/components/dashboard/StreakCalendar.tsx`
- Create: `src/components/dashboard/TokenHistory.tsx`
- Create: `src/services/StatsService.ts`

**Interfaces:**
- Produces:
  - `StatsService.getWeeklyStudyMinutes(userId): Promise<{ day: string, minutes: number }[]>`
  - `StatsService.getSubjectBreakdown(userId): Promise<{ subject: string, pages: number }[]>`
  - `StatsService.getStreakHistory(userId): Promise<{ date: string, claimed: boolean }[]>`

- [ ] **Step 1:** Implement `StatsService.ts`: query `vitoken_transactions`, `desk_documents`, `flashcard_reviews` để tổng hợp số liệu.
- [ ] **Step 2:** Implement `StreakCalendar.tsx`: hiển thị lịch dạng GitHub contribution graph (SVG thuần hoặc grid div) — mỗi ô là 1 ngày, màu Cam ViT nếu đã điểm danh, slate-200 nếu chưa.
- [ ] **Step 3:** Implement `StudyStats.tsx`: 3 số liệu nổi bật (tổng giờ học tuần này, số trang đọc, điểm trắc nghiệm trung bình).
- [ ] **Step 4:** Implement `TokenHistory.tsx`: danh sách giao dịch ViToken với icon, mô tả, +/- số token, thời gian.
- [ ] **Step 5:** Implement `src/app/dashboard/page.tsx`: ghép các component, guard redirect `/auth` nếu chưa đăng nhập.
- [ ] **Step 6:** Thêm link Dashboard vào `TopLeftNav.tsx` (icon `BarChart2`).
- [ ] **Step 7:** Commit: `feat(dashboard): add study stats and token history dashboard`.

---

## Sub-Stream 5C: Chợ KnowInherit Đầy Đủ

### Task 5C.1: Trang Duyệt Chợ & Xem Trước

**Files:**
- Create: `src/app/market/page.tsx`
- Create: `src/components/market/MarketBrowse.tsx`
- Create: `src/components/market/ListingCard.tsx`
- Create: `src/components/market/ListingPreview.tsx`
- Create: `src/services/MarketService.ts`

**Interfaces:**
- Produces:
  - `MarketService.getListings(filters: { tier?, sort?, search?, cursor? }): Promise<{ items: Listing[]; nextCursor: string | null }>` (chỉ `status='published'`; phân trang con trỏ, 20/trang; `search` dùng `ilike` trên `title`/`summary` đã escape ký tự `%` `_`)
  - `MarketService.getPreview(listingId: string): Promise<{ previewContent: string; totalPages: number; isOwned: boolean }>` (`isOwned` = có dòng trong `know_inherit_purchases` của mình hoặc là tác giả)
  - `MarketService.purchaseListing(listingId: string): Promise<void>` — gọi RPC `process_know_inherit_purchase(p_listing)` (02a, dùng `auth.uid()`; **không truyền buyer id**); map lỗi `insufficient_balance`, `already_purchased`, `self_purchase` sang tiếng Việt
  - `MarketService.openFullContent(listingId: string): Promise<Blob | string>` — tải từ bucket `listing-content` bằng signed URL (storage policy chỉ cho người đã mua/tác giả)

- [ ] **Step 1:** Implement `MarketService.ts` theo Interfaces; thêm test: người chưa mua gọi `openFullContent` → lỗi (bằng Supabase storage policy, test pgTAP/integration trên staging); `getListings` không trả `full_content_url` (cột bị REVOKE — test select cột đó phải lỗi); `search='%'` không khớp mọi dòng.
- [ ] **Step 2:** Implement `ListingCard.tsx`: card hiển thị tiêu đề, tác giả, hạng (C/B/A/S badge), giá ViToken, điểm AI, nút "Xem trước".
- [ ] **Step 3:** Implement `ListingPreview.tsx`: hiện `previewContent` rõ ràng + khối phía sau làm mờ **bằng placeholder tĩnh** (không đưa nội dung thật vào DOM rồi blur — người dùng mở DevTools sẽ đọc được) + nút "Mua X ViToken để đọc đầy đủ". Nội dung do tác giả viết phải qua `DOMPurify.sanitize` trước khi render (roadmap 6C.5).
- [ ] **Step 4:** Implement `MarketBrowse.tsx`: search input, filter buttons (All/C/B/A/S), sort (Mới nhất/Phổ biến/Điểm cao), infinite scroll hoặc pagination.
- [ ] **Step 5:** Implement `src/app/market/page.tsx`.
- [ ] **Step 6:** Thêm link Market vào `BottomLeftKnowledge.tsx` (nút "Duyệt chợ" dẫn sang `/market`).
- [ ] **Step 7:** Commit: `feat(market): full browse page with preview and purchase`.

---

### Task 5C.2: Hệ Thống Đánh Giá & Kiểm Duyệt

**Files:**
- Modify: `supabase/schema.sql` — thêm bảng `listing_reviews`
- Create: `src/components/market/ReviewForm.tsx`
- Create: `src/components/market/ReviewList.tsx`
- Modify: `supabase/functions/` — thêm hàm kiểm duyệt tự động

**Interfaces:**
- Produces: User đã mua có thể đánh giá 1-5 sao + comment. Listing hiển thị rating trung bình.

- [ ] **Step 1:** Schema:
  ```sql
  CREATE TABLE public.listing_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES know_inherit_listings(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(listing_id, reviewer_id)
  );
  ALTER TABLE public.listing_reviews ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Buyers can review" ON public.listing_reviews
    FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM know_inherit_purchases WHERE listing_id = listing_reviews.listing_id AND buyer_id = auth.uid())
    );
  ```
- [ ] **Step 1b:** Bổ sung policy còn thiếu cho `listing_reviews`: SELECT công khai; UPDATE/DELETE chỉ `reviewer_id = auth.uid()`; cấm tác giả tự đánh giá listing của mình (`author_id <> auth.uid()`); test pgTAP cho từng ý. Rating trung bình tính bằng view `listing_rating(listing_id, avg, count)`, không lưu cột trùng lặp.
- [ ] **Step 2:** Implement `ReviewForm.tsx`: 5 ngôi sao click + textarea comment (giới hạn 1000 ký tự, qua DOMPurify khi hiển thị) + submit. Chỉ hiển thị khi user đã mua.
- [ ] **Step 3:** Implement `ReviewList.tsx`: danh sách reviews, rating average hiển thị dạng sao rỗng/đặc.
- [ ] **Step 4:** Commit: `feat(market): add listing reviews and ratings`.

---

## Sub-Stream 5D: Multiplayer Realtime Thật

### Task 5D.1: Supabase Realtime Presence & Broadcast Thật

**Files:**
- Modify: `src/hooks/useRealtimeMultiplayer.ts`

**Interfaces:**
- Consumes: `useAuth()` (cần `user.id` thật để track presence).
- Produces: `peers` state chứa danh sách user thật đang online, không còn `DEFAULT_MOCK_PEERS`.

- [ ] **Step 1:** Viết test:
  ```ts
  // Test: khi Supabase null, peers = [] và isConnected = false
  vi.mock('@/lib/supabase', () => ({ getSupabase: () => null }))
  const { result } = renderHook(() => useRealtimeMultiplayer('space-1'))
  expect(result.current.peers).toEqual([])
  expect(result.current.isConnected).toBe(false)
  ```
- [ ] **Step 2:** Chạy test, verify PASS (đã có graceful fallback).
- [ ] **Step 3:** Modify `useRealtimeMultiplayer.ts`:
  - Thay `Math.random()` userId bằng `user.id` thật từ `useAuth()`.
  - Xóa hoàn toàn `DEFAULT_MOCK_PEERS` và `toggleSimulation`.
  - Track presence với `{ name: user.display_name, avatar_url: user.avatar_url, ... }`.
- [ ] **Step 4:** Thêm cursor broadcast debounced 50ms.
- [ ] **Step 5:** Modify `MultiplayerBar.tsx`: xóa nút "Giả lập", hiển thị đúng avatar Supabase Storage của user thật.
- [ ] **Step 6:** Commit: `feat(multiplayer): real supabase presence and cursor broadcast`.

---

### Task 5D.2: Invite Link & Room Join

**Files:**
- Create: `src/components/hud/InviteModal.tsx`
- Modify: `src/components/hud/BottomLeftKnowledge.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Produces: Link mời dạng `?room={spaceId}`. Người nhận vào link → tự động join phòng với role `viewer`.

- [ ] **Step 1:** Modify `src/app/page.tsx`: đọc `searchParams.room` → nếu có, gọi `StudySpaceService.joinSpace(spaceId)` (upsert vào `space_members` với role `viewer`).
- [ ] **Step 2:** Implement `InviteModal.tsx`: hiển thị link đầy đủ + nút copy, nút chia sẻ (Web Share API).
- [ ] **Step 3:** Modify `BottomLeftKnowledge.tsx`: nút "Mời bạn" mở `InviteModal` thay vì no-op.
- [ ] **Step 4:** Thêm vào `StudySpaceService`: `joinSpace(spaceId: string, userId: string, role: 'viewer' | 'editor'): Promise<void>`.
- [ ] **Step 5:** Verify: `pnpm build` pass.
- [ ] **Step 6:** Chạy `pnpm run docs:index`. Cập nhật `docs/ai/11_CHANGELOG.md`.
- [ ] **Step 7:** Commit: `feat(multiplayer): invite link and room join`.

---

## Bổ sung sau rà soát (hạng mục roadmap bị bỏ sót)

### Task 5D.3: Đồng bộ vật thể realtime & quyền phòng

**Files:** Create `src/hooks/useSpaceSync.ts`, `src/components/hud/MembersPanel.tsx`; Modify `StudySpaceContext.tsx`, migration `0009_members.sql`.

**Interfaces:**
- `useSpaceSync(spaceId: string): void` — subscribe `postgres_changes` trên `desk_documents` (`space_id=eq.<id>`) và `desk_drawings`; áp dụng INSERT/UPDATE/DELETE từ người khác vào state; **bỏ qua** thay đổi do chính client này gây ra (so `updated_by = auth.uid()` + `client_id` lưu trong module); trong lúc người dùng đang kéo một item, bỏ qua cập nhật tọa độ của item đó.
- RPC `set_member_role(p_space uuid, p_user uuid, p_role text)` và `remove_member(p_space uuid, p_user uuid)` — chỉ owner (kiểm bằng `auth.uid()`); không cho đổi/xóa chính owner.
- `MembersPanel`: danh sách thành viên + đổi quyền (editor/viewer) + xóa; công tắc `Công khai / Riêng tư` (đặt `study_spaces.is_public`).
- `viewer` thấy bàn nhưng mọi công cụ ghi bị khóa (UI) **và** bị RLS chặn (02a `can_edit_space`).

- [ ] **Step 1:** pgTAP: viewer không INSERT/UPDATE `desk_documents`; editor được; non-member không SELECT bàn riêng tư; non-owner gọi `set_member_role` → lỗi; owner không tự xóa mình.
- [ ] **Step 2:** Test hook (mock channel): sự kiện UPDATE từ người khác cập nhật vị trí item; sự kiện do mình gây ra không vòng lặp; item đang kéo không bị giật.
- [ ] **Step 3:** FAIL → implement → PASS. Smoke 2 trình duyệt trên staging.
- [ ] **Step 4:** Commit: `feat(multiplayer): realtime object sync and member roles`.

### Task 5E.1: Pomodoro, xuất PDF, trang tác giả (P2)

- [ ] **Pomodoro:** `usePomodoro(workMin=25, breakMin=5)`; thời gian làm việc **không** tự cộng vào heartbeat (heartbeat chỉ dựa tương tác thật); HUD nhỏ, đơn sắc, không emoji, tắt được. Test: đếm ngược đúng khi giả lập đồng hồ (`vi.useFakeTimers`); chuyển pha đúng; tạm dừng/tiếp tục.
- [ ] **Xuất PDF:** nút "Xuất PDF" cho tóm tắt, flashcard, đề thi (`jspdf`, dynamic import); font tiếng Việt nhúng đúng dấu (test: văn bản có "ắ, ữ, đ" xuất ra không thành ô vuông — kiểm tra bằng đọc lại chuỗi từ PDF bằng pdfjs).
- [ ] **Trang tác giả:** `/author?id=<uuid>` (query, không route động): tên, danh sách listing `published`, rating TB, số lượt mua. RPC `get_author_public(p_author uuid)` chỉ trả trường công khai (không email).
- [ ] Commit theo từng mục: `feat(learning): pomodoro`, `feat(export): pdf export`, `feat(market): author page`.

### Task 5E.2: Bàn demo cho người dùng mới (roadmap 6A.2)

- [ ] **Step 1:** Test: tài khoản mới (không có bàn) → `StudySpaceContext` tạo 1 bàn demo gồm 1 sách mẫu (nội dung ngắn có công thức KaTeX), 1 note hướng dẫn; tài khoản đã có bàn → không tạo thêm; xóa bàn demo rồi đăng nhập lại → không tạo lại (cờ `demo_seeded` trong `profiles`).
- [ ] **Step 2:** FAIL → implement (dữ liệu mẫu trong `src/data/demoSpace.ts`, id UUID) → PASS. Commit: `feat(onboarding): seed demo desk`.
