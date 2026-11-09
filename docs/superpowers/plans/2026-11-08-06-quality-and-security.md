# Plan 06 — Chất Lượng, Bảo Mật & Onboarding

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans`.
> **Viết lại sau rà soát** ([`REVIEW-2026-11-08.md`](./REVIEW-2026-11-08.md) A9, A10, B13–B15): BYOK không lưu server; rate limit đã chuyển vào `ai-chat` (Plan 02a) nên không còn task riêng; sửa Landing/loading, PWA (manifest, SW tuỳ chọn), culling; thêm CSP.

**Goal:** Đạt chuẩn chất lượng cho sản phẩm thương mại: key BYOK an toàn, onboarding, landing page, PWA, hiệu năng bàn học lớn, CSP.

**Architecture:** Key BYOK **chỉ nằm trên thiết bị** người dùng (localStorage, mã hóa tuỳ chọn bằng mật khẩu phụ), gửi theo từng yêu cầu tới `ai-chat`; server không lưu → không có gì để rò. Onboarding là lớp phủ spotlight thuần React. Landing là một component riêng nạp nhẹ.

**Tech Stack:** React thuần, `next` Metadata API, Web Crypto (chỉ nếu bật khóa mật khẩu), Vitest.

**Điều kiện tiên quyết:** Plan 01, 02, 02a, 05.

## Global Constraints

- Xem Master Plan.
- **BYOK và token ChatGPT OAuth:** server **không bao giờ** nhận để lưu; cả hai chỉ nằm trên thiết bị (D3 bật Codex OAuth). `profiles.custom_openai_key_encrypted`, `custom_gemini_key_encrypted`, `oauth_chatgpt_token` bị bỏ khỏi UI và để trống (cột giữ lại, không dùng; `REVOKE SELECT` đã có ở 02a). Không log, không gửi vào analytics/Sentry (bộ lọc ở Plan 07). `byokStore` thêm provider `'chatgpt_oauth'` cho access token.
- **Rate limit:** chỉ thực thi ở `ai-chat` (02a). UI chỉ **hiển thị** thông báo khi nhận 429.
- **Landing:** LCP < 2.5s, CLS < 0.1 trên Lighthouse mobile mô phỏng; không video nhúng, không iframe, ảnh có `width/height`.
- **PWA:** manifest bắt buộc; Service Worker là **tuỳ chọn** và, nếu làm, chỉ cache tài nguyên tĩnh `_next/static` (cache-first); **không bao giờ** cache request tới `*.supabase.co`, Edge Function, Sepay, Discord.
- **Onboarding:** không chặn thao tác, bỏ qua được mọi bước, ghi cờ vào localStorage (khách) và `profiles.onboarding_done` (đã đăng nhập, để không hiện lại trên thiết bị khác).
- Cấm emoji; icon SVG; không đổi bảng màu.

## Review Focus (mỗi dòng có test)

1. Key BYOK không xuất hiện trong bất kỳ request tới Supabase (`rest/v1`, `functions/v1` ngoài `ai-chat`) và không nằm trong payload analytics.
2. Landing không nháy: trong lúc `status==='loading'` hiển thị khung tải, không render Landing rồi chuyển Desk.
3. Onboarding không hiện lại sau khi hoàn thành/bỏ qua, kể cả sau F5 và đăng nhập thiết bị khác.
4. Culling: sách 980×640 còn một góc trong màn hình **vẫn render**; item đang chọn/kéo/focus **không bao giờ** bị unmount; sợi chỉ đỏ nối tới item bị ẩn vẫn vẽ đúng.
5. CSP không làm hỏng KaTeX (style inline), Tesseract.js (worker, wasm), pdf.js worker, Supabase (REST + WebSocket), Discord Activity.
6. Manifest hợp lệ trên bản `output: export` với và không có `basePath`.

---

## File Structure

```
src/
  lib/byokStore.ts                         [CREATE] — get/set/clear key theo provider (localStorage)
  components/security/ByokKeyInput.tsx     [CREATE]
  components/onboarding/OnboardingTour.tsx, TourStep.tsx [CREATE]
  components/landing/LandingPage.tsx, HeroSection.tsx, FeatureGrid.tsx, PricingSection.tsx [CREATE]
  app/manifest.ts                          [CREATE]
  app/page.tsx                             [MODIFY]
  components/canvas/InfiniteDesk.tsx       [MODIFY] — culling
  lib/viewportCulling.ts                   [CREATE] — hàm thuần, có test
public/icons/ icon-192.png icon-512.png apple-touch-icon.png [CREATE]
next.config.ts                             [MODIFY] — headers/CSP không áp dụng với static export → meta CSP
```

---

### Task 6.1: BYOK — lưu trên thiết bị, không lưu server

**Files:** Create `src/lib/byokStore.ts`, `src/components/security/ByokKeyInput.tsx`; Modify `AccountSettings.tsx`, `src/lib/aiClient.ts` (02a), `ViTokenContext.tsx` (`aiConfig.apiKey`).

**Interfaces — Produces:** `byokStore.get(provider: 'openai'|'gemini'): string | null`, `set(provider, key): void`, `clear(provider): void`, `has(provider): boolean`; `ByokKeyInput({ provider })` hiển thị `••••••••` khi đã có key, nút "Xóa key". `aiClient.askAi` tự lấy key từ `byokStore` khi `provider` là `byok_*`.

- [ ] **Step 1:** Test: lưu key → `has()` true và giá trị hiển thị trong DOM luôn bị che; `askAi('byok_openai')` đặt key vào body gửi `ai-chat` và **không** gọi bất kỳ endpoint nào khác; sau `clear()` thì `askAi` báo "Chưa nhập key"; không có lời gọi `supabase.from('profiles')` nào mang chuỗi key (spy toàn bộ client).
- [ ] **Step 2:** FAIL → implement → PASS.
- [ ] **Step 3:** Ghi chú trong UI: "Key chỉ lưu trên trình duyệt này, ViTudy không lưu trên máy chủ. Đổi thiết bị phải nhập lại."
- [ ] **Step 4:** Commit: `feat(security): byok keys stay on device`.

---

### Task 6.2: Hiển thị giới hạn AI (UI)

**Files:** Modify `IntelineModal.tsx`, `src/lib/aiClient.ts`.

- [ ] **Step 1:** Test: `ai-chat` trả `429 { resetAt }` → UI hiển thị "Bạn đã dùng hết lượt hỏi AI trong giờ này. Có thể hỏi lại lúc HH:mm" (giờ địa phương) và khóa nút gửi đến lúc đó; `402` → hiển thị "Không đủ ViToken" kèm nút "Nạp thêm" mở `TopUpModal`.
- [ ] **Step 2:** FAIL → implement → PASS. Commit: `feat(ai): rate limit and balance messages`.

---

### Task 6.3: Onboarding Tour

**Files:** Create `OnboardingTour.tsx`, `TourStep.tsx`; Modify `StudySpaceDeskView.tsx`, migration `0010_onboarding.sql` (`profiles.onboarding_done BOOLEAN DEFAULT false`; cho phép client UPDATE đúng cột này — thêm vào `GRANT UPDATE (...)`).

**Interfaces:** `OnboardingTour({ steps?: TourStepDef[] })`; `TourStepDef = { target: string; title: string; body: string }`, `target` là selector `[data-tour="..."]` (thêm thuộc tính này vào các HUD liên quan). Nếu phần tử đích **không có trong DOM** (ví dụ HUD đang ẩn do chế độ tập trung) → bỏ qua bước đó, không crash.

- [ ] **Step 1:** Test: cờ `done` → không render; bước có target vắng mặt bị bỏ qua; Esc/"Bỏ qua tất cả" ghi cờ; hoàn thành ghi cờ (và gọi update `onboarding_done` khi đã đăng nhập); spotlight cập nhật khi cửa sổ đổi kích thước.
- [ ] **Step 2:** FAIL → implement 7 bước: mặt bàn, tải tài liệu, công cụ bút, WASD, minimap, ViToken & Chợ, hỏi AI Inteline (nội dung ngắn, tiếng Việt, không emoji) → PASS.
- [ ] **Step 3:** Commit: `feat(onboarding): guided tour`.

---

### Task 6.4: Landing Page & cổng vào

**Files:** Create `LandingPage.tsx`, `HeroSection.tsx`, `FeatureGrid.tsx`, `PricingSection.tsx`; Modify `src/app/page.tsx`.

**Interfaces:** `page.tsx` quyết định theo `useAuth().status`: `'loading'` → `<AppLoading />`; `'authenticated'` hoặc cờ khách → bàn học; còn lại → `<LandingPage />`. Nút "Dùng thử không cần đăng ký" ghi cờ khách. `PricingSection` đọc `vitoken_packages` (Plan 03) — khi chưa tải được thì hiển thị khung rỗng, không giá cứng trong code.

- [ ] **Step 1:** Test: `loading` không render Landing (Review Focus #2); khách có cờ → vào bàn; chưa đăng nhập, chưa cờ → Landing; sau đăng nhập → bàn học.
- [ ] **Step 2:** FAIL → implement. Hero dùng ảnh tĩnh WebP có kích thước cố định; FeatureGrid 6 thẻ (icon Lucide + 2 dòng); PricingSection từ DB; footer dùng `SiteFooter` (Plan 07).
- [ ] **Step 3:** PASS; Lighthouse (mobile) LCP < 2.5s, CLS < 0.1 (ghi kết quả vào `docs/ops/`).
- [ ] **Step 4:** Commit: `feat(landing): landing page and entry gate`.

---

### Task 6.5: PWA — manifest (+ SW tuỳ chọn)

**Files:** Create `src/app/manifest.ts` (có `export const dynamic = 'force-static'`), icons; Modify `layout.tsx` (`metadata.icons`, `appleWebApp`).

**Interfaces:** manifest `start_url` và `scope` dựa vào `process.env.NEXT_PUBLIC_BASE_PATH ?? ''` + `'/'`; `display: 'standalone'`; `theme_color: '#E0562D'`; icon 192/512 (`purpose: 'any'` và một bản `maskable`).

- [ ] **Step 1:** Test: `manifest()` với `BASE_PATH='/ViTudy'` cho `start_url='/ViTudy/'`; với rỗng cho `'/'`; có đủ icon 192 và 512.
- [ ] **Step 2:** FAIL → implement → PASS; `GITHUB_PAGES=true pnpm build` tạo `out/manifest.webmanifest`.
- [ ] **Step 3:** (Tuỳ chọn, P3) Service Worker tối thiểu cache `_next/static/*` + trang offline `/offline`; test: request tới `supabase.co` **không** đi qua cache. Nếu không đủ thời gian, bỏ bước này và ghi rõ "chỉ có manifest" trong `docs/ai/`.
- [ ] **Step 4:** Chrome DevTools → Application: manifest hợp lệ, cài đặt được. Commit: `feat(pwa): web app manifest`.

---

### Task 6.6: Culling vật thể ngoài màn hình

**Files:** Create `src/lib/viewportCulling.ts`; Modify `InfiniteDesk.tsx`.

**Interfaces — Produces:** `isItemVisible(item: { x:number; y:number; width:number; height:number; rotation:number }, view: { x:number; y:number; scale:number; rotation?:number; viewportW:number; viewportH:number }, margin = 500): boolean` — dùng hộp bao quanh (bán kính ngoại tiếp khi item xoay), **không** chỉ điểm `x,y`. `InfiniteDesk` luôn render: item đang `selectedItemId`, `focusedItemId`, đang kéo/xoay. `VisualLinkThreads` tính toán từ **dữ liệu** vị trí (không từ DOM) nên vẫn vẽ khi item bị ẩn.

- [ ] **Step 1:** Test thuần: sách 980×640 với góc phải-dưới còn trong màn hình → true; hoàn toàn ngoài + margin → false; xoay 45° làm hộp bao rộng hơn → true ở ranh giới trước đó là false; zoom 0.2 vs 2 cho kết quả đúng; item được chọn luôn hiển thị (kiểm ở cấp component).
- [ ] **Step 2:** FAIL → implement → PASS. Đo FPS bằng bàn 150 item (script CDP có sẵn `scripts/`): mục tiêu ≥ 50 FPS khi pan.
- [ ] **Step 3:** Kiểm tra thủ công: kéo item ra rồi thả ngoài màn hình không biến mất giữa chừng; nét vẽ gắn theo item vẫn đúng khi item vào lại.
- [ ] **Step 4:** Commit: `perf(canvas): viewport culling with bounding boxes`.

---

### Task 6.7: Content Security Policy

GitHub Pages không cho đặt header HTTP → dùng `<meta http-equiv="Content-Security-Policy">` trong `layout.tsx` (lưu ý: meta CSP không hỗ trợ `frame-ancestors`; chống bị nhúng bằng cách khác nếu cần).

- [ ] **Step 1:** Soạn chính sách tối thiểu: `default-src 'self'`; `script-src 'self' 'wasm-unsafe-eval'` + hash/nonce cho script inline của Next (kiểm tra `out/index.html`, không dùng `'unsafe-inline'` nếu tránh được; nếu bắt buộc, ghi lý do); `style-src 'self' 'unsafe-inline'` (KaTeX, Framer Motion); `worker-src 'self' blob:`; `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://img.vietqr.io`; `img-src 'self' data: blob: https://img.vietqr.io https://*.supabase.co https://cdn.discordapp.com`; `font-src 'self' data:`. Umami/Sentry domain thêm khi bật (Plan 07).
- [ ] **Step 2:** Test e2e bằng script CDP: mở trang với CSP, chạy: KaTeX hiển thị, OCR Tesseract chạy, mở PDF, đăng nhập giả, WebSocket Realtime kết nối; **console không có** `Refused to ...` (Review Focus #5). Thêm điều kiện để Discord Activity (`frame_id`) mở rộng `connect-src` theo URL Mapping.
- [ ] **Step 3:** Commit: `feat(security): content security policy via meta tag`.

---

### Task 6.8: Cập nhật tài liệu

- [ ] `pnpm run docs:index`, `docs:check`; cập nhật `06_UI_MAP.md`, `08_FEATURE_STATUS.md`, `09_ISSUES_AND_TODO.md`, `11_CHANGELOG.md`, `SNAPSHOT.md`. Commit: `docs: sync after quality and security plan`.
