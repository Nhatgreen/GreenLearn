# Plan 04 — Discord Activity

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans`.
> **Viết lại sau rà soát** ([`REVIEW-2026-11-08.md`](./REVIEW-2026-11-08.md) B7–B9): nhận diện Discord bằng `frame_id`, đổi `code` → token ở Edge Function (cần `client_secret`), URL Mapping + `patchUrlMappings` cho Supabase, và **domain riêng** để `/` của Discord trỏ đúng app.

**Goal:** ViTudy chạy như Discord Activity trong voice channel, đăng nhập bằng danh tính Discord và dùng chung dữ liệu/ví với tài khoản ViTudy.

**Architecture:** Trong iframe Discord, app (1) khởi tạo `DiscordSDK`, (2) gọi `authorize()` lấy `code`, (3) gửi `code` tới Edge Function `discord-auth` (giữ `DISCORD_CLIENT_SECRET`), function đổi code lấy token Discord, xác định/tạo user Supabase, trả `token_hash` magic-link, (4) client `supabase.auth.verifyOtp({ token_hash, type: 'magiclink' })` để có session thật. Toàn bộ request ra ngoài (Supabase REST/Realtime) đi qua URL Mapping bằng `patchUrlMappings`.

**Tech Stack:** `@discord/embedded-app-sdk`, Supabase Edge Function, Discord Developer Portal.

**Điều kiện tiên quyết:** Plan 01, 02, 02a. **Quyết định D1 đã chốt: không mua domain.** App được phục vụ ở gốc của **user site miễn phí** `https://namtacozz.github.io/` (`basePath` rỗng), vì Discord ánh xạ theo **host** trong khi bản hiện tại nằm dưới `/ViTudy`. Cách làm mặc định: **đổi tên repo `namtacozz/ViTudy` thành `namtacozz.github.io`** (Settings → Rename; bật lại Pages với nguồn "GitHub Actions"). Phương án thay thế nếu muốn giữ tên repo: tạo repo `namtacozz.github.io` chỉ để nhận `out/`, workflow `deploy.yml` đẩy sang bằng PAT (`contents: write`) lưu trong GitHub Secrets. `[OWNER]` thực hiện bước đổi tên/tạo repo; agent chỉ sửa workflow/config.

## Global Constraints

- Xem Master Plan.
- Nhận diện môi trường Discord: `new URLSearchParams(location.search).has('frame_id')`. Không dùng `DiscordSDK.isEmbedded` (không tồn tại).
- Ngoài Discord, app chạy y như cũ; mã Discord chỉ nạp khi có `frame_id` (dynamic import, không làm nặng bundle chính).
- `DISCORD_CLIENT_SECRET` chỉ nằm ở Edge Function secrets. `NEXT_PUBLIC_DISCORD_CLIENT_ID` công khai được.
- Trong Discord không dùng popup OAuth của Supabase (iframe chặn) — chỉ dùng luồng `discord-auth`.
- Scope tối thiểu: `identify`, `guilds.members.read` (chỉ khi cần avatar/nickname trong guild). Không xin `email`.
- Mọi request mạng khởi tạo trước khi gọi `patchUrlMappings` có thể bị CSP chặn → khởi tạo Supabase client **sau** khi patch.
- Cấm emoji; icon SVG.

## Review Focus (mỗi dòng có test)

1. Ngoài Discord (không `frame_id`): `AuthContext` chạy luồng thường, không import SDK. 
2. `discord-auth` không tin `discord_user_id` từ client — lấy từ `GET /users/@me` bằng token vừa đổi.
3. Hai lần đăng nhập Discord cùng người → **cùng** một user Supabase (không tạo trùng); người đã có tài khoản email trùng email Discord đã xác minh → gộp vào tài khoản cũ (không tạo ví thứ hai nhận quà thứ hai).
4. Đóng Activity → Presence được `untrack`, channel Realtime hủy.
5. Realtime WebSocket hoạt động trong iframe (đi qua mapping), không lỗi `blocked:csp`.
6. `code` sai/hết hạn → `401` rõ ràng, UI hiển thị "Không thể đăng nhập Discord", không loop vô hạn.

---

## File Structure

```
src/
  lib/discord/detect.ts            [CREATE] — isDiscordActivity(): boolean
  lib/discord/sdk.ts               [CREATE] — initDiscord(): Promise<{ sdk, user, channelId, guildId }>
  lib/discord/urlMappings.ts       [CREATE] — patch + hằng số prefix
  hooks/useDiscordActivity.ts      [CREATE]
  context/AuthContext.tsx          [MODIFY] — nhánh Discord
  components/hud/MultiplayerBar.tsx, src/hooks/useRealtimeMultiplayer.ts [MODIFY]
supabase/
  migrations/0006_discord.sql      [CREATE] — profiles.discord_id UNIQUE, activity_rooms
  functions/discord-auth/index.ts  [CREATE]
  tests/discord.test.sql           [CREATE]
```

---

### Task 4.0: Cấu hình ngoài mã `[OWNER]` + user site

- [ ] **Step 1:** `[OWNER]` đổi tên repo thành `namtacozz.github.io` (hoặc tạo repo deploy thứ hai — xem trên); xác nhận `https://namtacozz.github.io/` hiển thị app. Agent sửa `next.config.ts` để `basePath` đọc từ `NEXT_PUBLIC_BASE_PATH` (mặc định rỗng) và `deploy.yml` truyền biến này rỗng; cập nhật Redirect URL Supabase (Plan 01 Task 1.3) và mọi tham chiếu `/ViTudy` còn sót (`grep -rn "/ViTudy" src .github`).
- [ ] **Step 2:** Discord Developer Portal → New Application "ViTudy" → bật **Activities** → ghi `Application ID` (client id) và `Client Secret`.
- [ ] **Step 3:** Tab Activities → **URL Mappings**: `/` → `namtacozz.github.io`, `/supabase` → `<project-ref>.supabase.co`. (Kiểm tra giao diện portal lúc làm: nếu target cho phép đường dẫn thì ghi; nếu chỉ nhận host thì giữ như trên.)
- [ ] **Step 4:** OAuth2 → thêm redirect URI placeholder theo yêu cầu portal (Activity dùng `authorize()` của SDK, không điều hướng thật).
- [ ] **Step 5:** `supabase secrets set DISCORD_CLIENT_ID=… DISCORD_CLIENT_SECRET=…`; thêm `NEXT_PUBLIC_DISCORD_CLIENT_ID` vào GitHub Secrets + `.env.local.example`.
- [ ] **Step 6:** Commit chỉ phần mã/docs (`next.config.ts`, `.env.local.example`, `docs/ops/LAUNCH_CHECKLIST.md`): `chore(discord): configurable base path and setup docs`.

---

### Task 4.1: Phát hiện môi trường & SDK

**Files:** Create `src/lib/discord/detect.ts`, `sdk.ts`, `urlMappings.ts`.

**Interfaces — Produces:**
- `isDiscordActivity(search = window.location.search): boolean`
- `initDiscord(): Promise<{ sdk: DiscordSDK; user: { id: string; username: string; avatar: string | null }; channelId: string | null; guildId: string | null; code: string }>` — `await sdk.ready()`, `authorize({ client_id, response_type:'code', state:'', prompt:'none', scope:['identify','guilds.members.read'] })`.
- `applyDiscordUrlMappings(): void` — `patchUrlMappings([{ prefix: '/supabase', target: '<ref>.supabase.co' }])`; `getSupabase()` đọc URL Supabase đã được proxy khi `isDiscordActivity()`.

- [ ] **Step 1:** Test `detect`: `?frame_id=123&instance_id=…` → true; không có → false; chuỗi rỗng → false.
- [ ] **Step 2:** Chạy → FAIL → implement → PASS.
- [ ] **Step 3:** Test `applyDiscordUrlMappings` gọi `patchUrlMappings` đúng một lần với prefix `/supabase` (mock SDK).
- [ ] **Step 4:** Implement `sdk.ts` và `urlMappings.ts`; sửa `src/lib/supabase.ts` để dựng client **sau** `applyDiscordUrlMappings()` khi ở trong Discord (client Realtime cũng dùng URL đã proxy).
- [ ] **Step 5:** `pnpm add @discord/embedded-app-sdk`; kiểm tra bundle chính **không** chứa SDK (chỉ chunk dynamic). Commit: `feat(discord): environment detection and sdk init`.

---

### Task 4.2: Migration + Edge Function `discord-auth`

**Files:** Create `supabase/migrations/0006_discord.sql`, `supabase/functions/discord-auth/index.ts`, `supabase/tests/discord.test.sql`.

**Interfaces:**
- Migration: `profiles.discord_id TEXT UNIQUE`; `REVOKE UPDATE (discord_id)` khỏi `authenticated` (client không tự gán).
- Function: `POST /functions/v1/discord-auth` body `{ code: string }` (**deploy `--no-verify-jwt`** vì người gọi chưa có session) → `200 { token_hash: string, email: string }` hoặc `401 { error: 'discord_auth_failed' }`.
- Luồng: đổi `code` ở `https://discord.com/api/oauth2/token` (`grant_type=authorization_code`, kèm client id/secret) → `GET /users/@me` → tìm `profiles.discord_id`; nếu chưa có, tìm user Supabase theo email Discord **nếu `verified`**; còn không thì `admin.createUser({ email: \`discord_<id>@users.vitudy.invalid\`, email_confirm: true, user_metadata: { display_name, avatar_url } })` → gán `discord_id` → `admin.generateLink({ type: 'magiclink', email })` → trả `hashed_token` làm `token_hash`.

- [ ] **Step 1:** Test Deno (mock Discord API + admin client): `code` sai → 401 và không tạo user; user lần đầu → tạo đúng 1 user; lần hai cùng `discord id` → không tạo thêm; email đã xác minh trùng user cũ → gán `discord_id` vào user cũ, không tạo user mới.
- [ ] **Step 2:** pgTAP: `discord_id` duy nhất; user thường UPDATE `discord_id` → bị từ chối.
- [ ] **Step 3:** FAIL → implement → PASS; deploy staging `--no-verify-jwt`; kiểm tra cấu hình CORS cho `https://<client_id>.discordsays.com`.
- [ ] **Step 4:** Commit: `feat(discord): discord-auth edge function and discord_id`.

---

### Task 4.3: `useDiscordActivity` + AuthContext

**Files:** Create `src/hooks/useDiscordActivity.ts`; Modify `src/context/AuthContext.tsx`.

**Interfaces — Produces:** `useDiscordActivity(): { isDiscord: boolean; status: 'idle'|'authorizing'|'ready'|'error'; discordUser: {...}|null; channelId: string|null }`. Trong Discord: `AuthContext` gọi `initDiscord()` → `POST discord-auth` → `verifyOtp({ token_hash, type:'magiclink' })`; thất bại → `status='guest'` kèm lỗi hiển thị.

- [ ] **Step 1:** Test hook/context (mock `initDiscord`, `fetch`, `supabase.auth.verifyOtp`): luồng thành công → `authenticated`; `discord-auth` trả 401 → không loop, hiển thị lỗi; ngoài Discord → các hàm Discord **không** được gọi (Review Focus #1).
- [ ] **Step 2–4:** FAIL → implement → PASS. `pnpm build` PASS.
- [ ] **Step 5:** Commit: `feat(discord): discord login flow in auth context`.

---

### Task 4.4: Phòng học theo voice channel + Rich Presence

**Files:** Modify `useRealtimeMultiplayer.ts`, `MultiplayerBar.tsx`; Create migration `0007_activity_rooms.sql`.

**Interfaces:**
- `activity_rooms(instance_id TEXT PK, space_id UUID FK study_spaces, created_by UUID, created_at)`; RPC `join_activity_room(p_instance_id text, p_space_id uuid default null) → uuid` (`auth.uid()`; nếu phòng chưa có thì tạo bàn mới/dùng `p_space_id` thuộc owner; thêm người gọi vào `space_members` role `editor`; chỉ cho phép tham gia khi người gọi đang ở cùng `instance_id` — Discord đảm bảo bằng việc `instance_id` chỉ có trong iframe của người trong activity).
- `useRealtimeMultiplayer` dùng `instance_id` làm tên channel khi ở Discord; hiển thị avatar từ `https://cdn.discordapp.com/avatars/{id}/{hash}.png` (được proxy qua mapping `/discord-cdn` → `cdn.discordapp.com`, thêm mapping).
- Rich Presence: `sdk.commands.setActivity({ activity: { type: 0, details: 'Đang học', state: title } })` khi đổi sách/trang, giới hạn tần suất 1 lần/5 giây.

- [ ] **Step 1:** pgTAP: `join_activity_room` lần 1 tạo phòng, lần 2 cùng instance trả cùng `space_id` và không nhân đôi `space_members`; người chưa đăng nhập bị từ chối.
- [ ] **Step 2:** Test hook: `unmount` gọi `untrack` + `removeChannel` (Review Focus #4); `setActivity` bị throttle.
- [ ] **Step 3:** FAIL → implement → PASS.
- [ ] **Step 4:** Smoke thủ công `[OWNER]`: bật chế độ developer, chạy Activity bằng URL `https://discord.com/activities/<client_id>` trong một voice channel với 2 tài khoản; xác nhận nhìn thấy nhau, Realtime không lỗi CSP (Review Focus #5).
- [ ] **Step 5:** `pnpm run docs:index`; cập nhật `docs/ai/*`. Commit: `feat(discord): voice channel rooms and rich presence`.
