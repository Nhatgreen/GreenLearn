# Plan 01 — Auth & Tài Khoản Người Dùng

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans`.

**Goal:** Tích hợp Supabase Auth để người dùng đăng ký, đăng nhập, quản lý phiên và truy cập tài khoản cá nhân.

**Architecture:** Supabase Auth (email+password + OAuth Google/Discord). `AuthContext` bọc toàn app. Trang `/auth` cho login/signup. Trang `/profile` cho quản lý tài khoản. Guard: route `/` hiển thị demo cho khách, nhưng chỉ người đăng nhập mới lưu dữ liệu lên cloud.

**Tech Stack:** `@supabase/supabase-js` v2 (đã có), Next.js App Router. **Không** thêm `@supabase/auth-helpers-nextjs` (đã deprecated, dành cho SSR; static export không dùng được). Client Supabase dùng `flowType: 'pkce'` và `detectSessionInUrl: true`.

> **Điều kiện tiên quyết:** Plan 02a đã xong (policy/hàm DB đã siết, Vitest đã có). Test trong plan này viết bằng Vitest (`vi.fn`, `vi.mock`).

> **Sửa sau rà soát:** Task 1.1 dùng PKCE; Task 1.3 dùng `exchangeCodeForSession`; xóa tài khoản qua Edge Function `delete-user` lấy `user_id` từ JWT; thêm trạng thái `guest` tường minh. Xem [`REVIEW-2026-11-08.md`](./REVIEW-2026-11-08.md) B1, B15, D5.

**Spec:** [`docs/superpowers/plans/2026-11-08-00-master-roadmap.md`](./2026-11-08-00-master-roadmap.md) → Trụ 1.

## Global Constraints

- Xem Global Constraints của Master Plan.
- Trang `/auth` và `/profile` phải hoạt động trên GitHub Pages static export — không dùng server-side `getServerSideProps`.
- Redirect sau đăng nhập về `/` (bàn học).
- Cho phép khách (anonymous) vào `/` nhưng hiển thị banner "Đăng nhập để lưu bàn học lên đám mây".
- Supabase Redirect URL cho OAuth phải trỏ về: `https://{username}.github.io/ViTudy/auth/callback`.

## Review Focus

1. **OAuth redirect loop:** Sau OAuth Google, callback URL cần đúng `basePath=/ViTudy` — expect redirect về `/` không phải 404.
2. **Session persist across page refresh:** `localStorage` session của Supabase còn sau F5 — expect user vẫn đăng nhập.
3. **Concurrent login trên 2 tab:** Tab 2 đăng xuất → Tab 1 phát hiện session mất và chuyển về state guest.
4. **Đăng ký email trùng:** Expect error message tiếng Việt rõ ràng "Email này đã được đăng ký".
5. **Anonymous → đăng nhập:** Dữ liệu demo localStorage không bị xóa khi user đăng nhập (migration sẽ xử lý ở Plan 02).

---

## File Structure

```
src/
  context/
    AuthContext.tsx          [CREATE] — session state, user, signIn, signOut, signUp
  app/
    auth/
      page.tsx               [CREATE] — form đăng nhập / đăng ký
      callback/
        page.tsx             [CREATE] — OAuth callback handler
    profile/
      page.tsx               [CREATE] — trang hồ sơ tài khoản
  components/
    auth/
      AuthForm.tsx           [CREATE] — form component (email+password)
      OAuthButtons.tsx       [CREATE] — nút Google / Discord OAuth
      GuestBanner.tsx        [CREATE] — banner thông báo cho khách
    profile/
      ProfileHeader.tsx      [CREATE] — avatar, tên, email
      AccountSettings.tsx    [CREATE] — đổi tên, đổi avatar
      DeleteAccount.tsx      [CREATE] — xóa tài khoản với confirmation
  hooks/
    useAuth.ts               [CREATE] — shortcut hook từ AuthContext
  lib/
    supabase.ts              [MODIFY] — thêm hàm auth helpers
```

---

### Task 1.1: AuthContext & useAuth Hook

**Files:**
- Create: `src/context/AuthContext.tsx`
- Create: `src/hooks/useAuth.ts`
- Modify: `src/app/layout.tsx` — bọc `<AuthProvider>`

**Interfaces:**
- Produces:
  - `AuthContext` với shape: `{ user: User | null, session: Session | null, isLoading: boolean, signIn(email, password): Promise<AuthResult>, signUp(email, password, displayName): Promise<AuthResult>, signOut(): Promise<void>, signInWithOAuth(provider: 'google' | 'discord'): Promise<void> }`
  - `useAuth(): AuthContextType` hook
  - `AuthResult = { success: boolean; error?: string }`

- [ ] **Step 1:** Viết test kiểm tra `AuthContext` khởi tạo đúng:
  ```tsx
  // Test: context renders with null user when no session
  render(<AuthProvider><TestChild /></AuthProvider>)
  expect(screen.getByTestId('user')).toHaveTextContent('null')
  ```
- [ ] **Step 2:** Chạy test, verify FAIL.
- [ ] **Step 3:** Implement `AuthContext.tsx`:
  - Dùng `supabase.auth.getSession()` trên mount để load session ban đầu.
  - Subscribe `supabase.auth.onAuthStateChange()` để cập nhật `user`/`session` real-time.
  - `signIn`: gọi `supabase.auth.signInWithPassword({ email, password })`, map error sang tiếng Việt.
  - `signUp`: gọi `supabase.auth.signUp({ email, password, options: { data: { display_name } } })`.
  - `signOut`: gọi `supabase.auth.signOut()`.
  - `signInWithOAuth`: gọi `supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin + BASE_PATH + '/auth/callback' } })` (`BASE_PATH` = `process.env.NEXT_PUBLIC_BASE_PATH ?? ''`; rỗng khi dùng domain riêng).
- [ ] **Step 4:** Chạy test, verify PASS.
- [ ] **Step 5:** Modify `src/app/layout.tsx`: bọc `<AuthProvider>` bên ngoài `<ViTokenProvider>`.
- [ ] **Step 6:** Verify build: `pnpm build`.
- [ ] **Step 7:** Commit: `feat(auth): add AuthContext and useAuth hook`.

---

### Task 1.2: Trang Đăng Nhập / Đăng Ký (`/auth`)

**Files:**
- Create: `src/app/auth/page.tsx`
- Create: `src/components/auth/AuthForm.tsx`
- Create: `src/components/auth/OAuthButtons.tsx`

**Interfaces:**
- Consumes: `useAuth()` từ Task 1.1.
- Produces: Trang `/auth` hoạt động trên static export, hiển thị form login/signup, nút OAuth.

- [ ] **Step 1:** Viết test UI cho `AuthForm`:
  ```tsx
  // Test: submit với email+password gọi signIn
  const mockSignIn = vi.fn().mockResolvedValue({ success: true })
  render(<AuthForm mode="login" onSignIn={mockSignIn} />)
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } })
  fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: '123456' } })
  fireEvent.click(screen.getByText('Đăng nhập'))
  expect(mockSignIn).toHaveBeenCalledWith('a@b.com', '123456')
  ```
- [ ] **Step 2:** Chạy test, verify FAIL.
- [ ] **Step 3:** Implement `AuthForm.tsx`:
  - Props: `mode: 'login' | 'signup'`, `onSignIn`, `onSignUp`, `isLoading`, `error`.
  - Render email input (type=email), password input (type=password), display_name input (chỉ khi mode=signup).
  - Submit button text: "Đăng nhập" hoặc "Đăng ký".
  - Hiển thị `error` bên dưới form nếu có.
  - Zero emoji, style monochromatic slate.
- [ ] **Step 4:** Chạy test, verify PASS.
- [ ] **Step 5:** Implement `OAuthButtons.tsx`: nút "Tiếp tục với Google" (icon SVG Google), nút "Tiếp tục với Discord" (icon SVG Discord). Gọi `signInWithOAuth`.
- [ ] **Step 6:** Implement `src/app/auth/page.tsx`:
  - `'use client'`
  - Toggle mode giữa login/signup bằng state.
  - Sau đăng nhập thành công: `router.push('/')`.
  - Nếu user đã đăng nhập: redirect về `/`.
- [ ] **Step 7:** Verify: `pnpm build` pass.
- [ ] **Step 8:** Commit: `feat(auth): add login signup page and oauth buttons`.

---

### Task 1.3: OAuth Callback Handler (`/auth/callback`)

**Files:**
- Create: `src/app/auth/callback/page.tsx`
- Modify: `src/lib/supabase.ts` (bỏ cấu hình URL/key nhập tay từ localStorage; chỉ đọc `NEXT_PUBLIC_SUPABASE_*`; `createClient(url, key, { auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true } })`)

**Interfaces:**
- Consumes: query `?code=` do Supabase trả về sau OAuth (PKCE).
- Produces: Trang `/auth/callback` đổi `code` thành session rồi chuyển về `/`.

- [ ] **Step 1:** Viết test: có `?code=abc` → gọi `supabase.auth.exchangeCodeForSession('abc')`; thành công → `router.replace('/')`; lỗi → `router.replace('/auth?error=oauth_failed')`; không có `code` và không có session → `/auth`.
- [ ] **Step 2:** Chạy test, verify FAIL.
- [ ] **Step 3:** Implement trang (`'use client'`, `useEffect` một lần, hiển thị "Đang xác thực..."). Nếu `detectSessionInUrl` đã tự đổi code (trong `getSession()`), gọi `getSession()` trước và chỉ gọi `exchangeCodeForSession` khi chưa có session — tránh đổi code hai lần (code dùng một lần).
- [ ] **Step 4:** Thêm vào Supabase Dashboard → Auth → URL Configuration: `Site URL` và **danh sách Redirect URLs chính xác** gồm `http://localhost:3000/auth/callback` và `https://<domain>/auth/callback` (kể cả dạng có `/` cuối nếu `trailingSlash` bật). Ghi vào `docs/ops/LAUNCH_CHECKLIST.md` mục `[OWNER]`.
- [ ] **Step 5:** `GITHUB_PAGES=true pnpm build` PASS; `out/auth/callback/index.html` tồn tại.
- [ ] **Step 6:** Commit: `feat(auth): add oauth pkce callback handler`.

---

### Task 1.4: Guest Banner & Route Guard

> **Chế độ khách (chốt):** `AuthContext` xuất `status: 'loading' | 'guest' | 'authenticated'`. Khách = chưa đăng nhập, dùng bàn demo, dữ liệu ở localStorage, **không dùng AI, không nạp, không mua chợ**. Trong lúc `loading` hiển thị khung tải trung tính (không nháy Landing). Khách bấm "Dùng thử" ở Landing → ghi `localStorage['vitudy_guest']='1'` rồi vào bàn học.
> **Chống farm quà tặng (D5):** quà `signup_grant` chỉ cấp sau khi `email_confirmed_at` khác null (kiểm tra trong trigger/hàm `claim_signup_grant()`); bật "Confirm email" trong Supabase Auth.

**Files:**
- Create: `src/components/auth/GuestBanner.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `useAuth()`.
- Produces: Khách thấy banner cố định "Đăng nhập để lưu bàn học". User đăng nhập không thấy banner.

- [ ] **Step 1:** Viết test:
  ```tsx
  // Test: banner hiện khi user=null
  render(<GuestBanner user={null} />)
  expect(screen.getByText(/Đăng nhập để lưu/)).toBeInTheDocument()

  // Test: banner ẩn khi user có giá trị
  render(<GuestBanner user={{ id: '1' } as User} />)
  expect(screen.queryByText(/Đăng nhập để lưu/)).toBeNull()
  ```
- [ ] **Step 2:** Chạy test, verify FAIL.
- [ ] **Step 3:** Implement `GuestBanner.tsx`:
  - Nếu `user === null`: hiển thị banner cố định `bottom-0` full-width.
  - Text: "Đang dùng chế độ khách — Dữ liệu chỉ lưu trên trình duyệt này."
  - Nút "Đăng nhập / Đăng ký" → `router.push('/auth')`.
  - Style: nền `slate-900`, chữ trắng, z-index cao.
- [ ] **Step 4:** Chạy test, verify PASS.
- [ ] **Step 5:** Modify `src/app/page.tsx`: import và render `<GuestBanner user={user} />`.
- [ ] **Step 6:** Commit: `feat(auth): add guest banner and route guard`.

---

### Task 1.5: Trang Hồ Sơ Tài Khoản (`/profile`)

**Files:**
- Create: `src/app/profile/page.tsx`
- Create: `src/components/profile/ProfileHeader.tsx`
- Create: `src/components/profile/AccountSettings.tsx`
- Create: `src/components/profile/DeleteAccount.tsx`

**Interfaces:**
- Consumes: `useAuth()`, `supabase` client.
- Produces: Trang `/profile` hiển thị thông tin user, cho phép đổi tên, upload avatar, xem lịch sử ViToken, xóa tài khoản.

- [ ] **Step 1:** Implement `ProfileHeader.tsx`:
  - Hiển thị avatar (ảnh hoặc initials từ display_name).
  - Hiển thị display_name, email.
  - Nút "Đổi avatar" → input file `accept="image/*"` → upload lên Supabase Storage bucket `avatars/{user.id}/avatar.webp` → update `profiles.avatar_url`.
- [ ] **Step 2:** Implement `AccountSettings.tsx`:
  - Form đổi display_name: input + nút "Lưu" → `supabase.from('profiles').update({ display_name })`.
  - Section API Key AI (BYOK): input cho OpenAI Key, Gemini Key — chỉ hiển thị `***` sau khi lưu.
- [ ] **Step 3:** Implement `DeleteAccount.tsx`:
  - Nút "Xóa tài khoản" → Modal xác nhận (gõ email để xác nhận).
  - Sau confirm: gọi Edge Function `delete-user` (không có body; **`user_id` lấy từ JWT**, không nhận từ client; function dùng service role gọi `auth.admin.deleteUser`) → `signOut()` → redirect `/`. Function xóa luôn file trong bucket `avatars/{uid}` và `documents/{uid}`; dữ liệu DB xóa theo `ON DELETE CASCADE`. Giữ lại `payment_requests`/`vitoken_transactions` ẩn danh hóa (`user_id` NULL) nếu pháp luật yêu cầu lưu chứng từ thanh toán — chốt cùng Plan 07 Task 7.1.
  - Trong form BYOK của `AccountSettings`: **chỉ làm giao diện** nhập key và lưu vào `localStorage` trên thiết bị (Plan 06 Task 6.1); không ghi key lên `profiles`.
- [ ] **Step 4:** Implement `src/app/profile/page.tsx`: ghép các component, guard redirect `/auth` nếu chưa đăng nhập.
- [ ] **Step 5:** Verify: `pnpm build` pass.
- [ ] **Step 6:** Chạy `pnpm run docs:index`.
- [ ] **Step 7:** Commit: `feat(auth): add profile page with account management`.

---

### Task 1.6: TopLeftNav — Thêm Nút Đăng Nhập / Avatar

**Files:**
- Modify: `src/components/hud/TopLeftNav.tsx`

**Interfaces:**
- Consumes: `useAuth()`.
- Produces: HUD trên-trái hiển thị avatar user (đăng nhập) hoặc icon `User` + "Đăng nhập" (khách).

- [ ] **Step 1:** Thêm vào `TopLeftNav.tsx`: nếu `user !== null`, hiển thị `<img src={user.avatar_url || initials} />` nhỏ 28px. Click → `router.push('/profile')`.
- [ ] **Step 2:** Nếu `user === null`: hiển thị nút icon `LogIn` nhỏ. Click → `router.push('/auth')`.
- [ ] **Step 3:** Verify style đúng monochromatic, không emoji, khoảng cách HUD 4px.
- [ ] **Step 4:** Commit: `feat(auth): integrate user avatar into TopLeftNav HUD`.

---

### Task 1.7: Verification & Docs Update

- [ ] **Step 1:** `pnpm build` → exit 0.
- [ ] **Step 2:** `pnpm run docs:check` → `[CHECK OK]`.
- [ ] **Step 3:** `pnpm run docs:index`.
- [ ] **Step 4:** Cập nhật `docs/ai/08_FEATURE_STATUS.md`: thêm dòng Auth.
- [ ] **Step 5:** Cập nhật `docs/ai/11_CHANGELOG.md`: thêm mục phiên làm việc.
- [ ] **Step 6:** Final commit: `docs: update docs after auth implementation`.
