# 01_OVERVIEW.md — Tổng Quan Dự Án ViTudy

> **Commit Hash:** `74d4cc0`  
> **Cập nhật lần cuối:** `2026-11-07`

---

## 1. Giới Thiệu Dự Án (Project Definition)
ViTudy là không gian học thức số hóa tích hợp AI mô phỏng mặt bàn thực tế theo góc nhìn 2.5D kết hợp giao diện HUD kiểu thực tế ảo (VR). Nền tảng kết hợp động cơ xử lý học thuật độc lập không tốn phí (Non-AI Engine: OCR, TextRank, Cloze Quiz, Flashcard), cổng kết nối đa mô hình AI (ChatGPT Plus/Team Codex Gateway, Google Gemini BYOK, OpenAI System) thanh toán qua đơn vị tiền tệ ViToken, và chợ chia sẻ tài liệu học tập KnowInherit với tỷ lệ chia sẻ doanh thu 85/15.

---

## 2. Tech Stack & Phiên Bản Thực Tế
Nguồn gốc kiểm chứng: [`package.json:L11-L29`](file:///F:/AppMaking/ViTudy/package.json#L11-L29).

* **Core Framework:** Next.js `15.1.7` (App Router, Turbopack / Webpack, React Server Components & Client Components).
* **UI & Rendering:** React `19.0.0`, React DOM `19.0.0`, TailwindCSS `3.4.17`, Framer Motion `12.4.7`.
* **Icons & Assets:** Lucide React `1.16.0`.
* **Client OCR:** Tesseract.js `7.0.0` (Client/Web Worker).
* **Styling Utilities:** `clsx 2.1.1`, `tailwind-merge 3.0.2`, `postcss 8.5.2`, `autoprefixer 10.6.2`.
* **Language & Compiler:** TypeScript `5.7.3` / `5.9.3`, Node.js `v24.15.0`.
* **Backend & Database Infrastructure:** Supabase PostgreSQL + `pgvector` (Vector Embeddings 1536 chiều), Supabase Realtime (Broadcast/Presence), Supabase Storage.

---

## 3. Lệnh Thực Thi & Kiểm Thử (Commands)
* **Chạy môi trường phát triển (Dev Server):**
  ```bash
  pnpm dev
  # Server lắng nghe tại: http://localhost:3000
  ```
* **Biên dịch & Kiểm tra kiểu (Production Build):**
  ```bash
  pnpm build
  ```
* **Khởi chạy máy chủ Production:**
  ```bash
  pnpm start
  ```
* **Cập nhật chỉ mục tự động bộ nhớ AI:**
  ```bash
  pnpm run docs:index
  ```
* **Kiểm tra tính hợp lệ & chống stale ký hiệu tài liệu:**
  ```bash
  pnpm run docs:check
  ```
* **Kiểm tra Lint:**
  ```bash
  pnpm lint
  ```

---

## 4. Biến Môi Trường (Environment Variables)
*Nguồn kiểm chứng: [`src/app/api/ai/chat/route.ts:L100`](file:///F:/AppMaking/ViTudy/src/app/api/ai/chat/route.ts#L100).*
Chỉ liệt kê tên biến, **tuyệt đối không ghi giá trị bí mật**:

* `OPENAI_API_KEY`: API Key phía máy chủ cho tài khoản doanh nghiệp ViTudy (chế độ System Managed).
* `NEXT_PUBLIC_SUPABASE_URL`: Đường dẫn URL dự án Supabase BaaS (kết nối database & realtime) `[UNVERIFIED - Sẽ cấu hình khi kích hoạt cloud remote]`.
* `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Khóa công khai ẩn danh của Supabase client `[UNVERIFIED]`.
* `SUPABASE_SERVICE_ROLE_KEY`: Khóa dịch vụ quản trị backend Supabase `[UNVERIFIED]`.

---

## 5. Giai Đoạn Hiện Tại Theo SRS (Current SRS Phase)
*Nguồn kiểm chứng: [`SRS_ViTudy.md:L400-L418`](file:///F:/AppMaking/ViTudy/SRS_ViTudy.md).*

* **Phase 1 (MVP Cốt Lõi):** HOÀN THÀNH (Bàn học 2.5D, Sách mở đôi, Giấy A4, Note, Non-AI Engine).
* **Phase 2 (Đa chế độ AI & Inteline RAG):** HOÀN THÀNH (AI Gateway, Codex Originator `codex_cli_rs`, Gemini BYOK, Inteline modal, Visual link threads).
* **Phase 3 (GPU Acceleration & KnowInherit Marketplace):** HOÀN THÀNH (Hardware acceleration, Chợ tri thức 85/15, Modal xuất bản thẩm định AI, Điểm danh Streak).
* **Phase 4 (Realtime Multiplayer Canvas):** HOÀN THÀNH TẦNG UI / MOCK (Multiplayer Bar, Presence avatar, Đồng bộ góc nhìn, Lớp vẽ tương tác; CSDL sẵn sàng tại `supabase/schema.sql`).

---

## 6. Quy Ước Thư Mục & Đặt Tên (Conventions)

### Cấu Trúc Thư Mục
* `src/app/`: Các trang giao diện, layout gốc và API endpoints (App Router).
* `src/components/canvas/`: Thành phần dựng mặt bàn học 2.5D, lưới ô caro, canvas vẽ tay, minimap.
* `src/components/hud/`: Các cụm giao diện HUD 4 góc (Top-Left, Top-Right, Bottom-Left, Bottom-Right) và khung VR.
* `src/components/objects/`: Các vật thể vật lý đặt trên bàn học (`BookSpread`, `PaperSheet`, `StickyNoteItem`).
* `src/components/modals/`: Các hộp thoại tương tác nổi (`IntelineModal`, `StudyToolsModal`, `KnowInheritPublishModal`).
* `src/context/`: Các React Context toàn cục (`StudySpaceContext`, `ViTokenContext`).
* `src/lib/`: Động cơ xử lý nghiệp vụ thuần túy không AI (`nonAiEngine.ts`).
* `src/utils/`: Tiện ích đo đạc & phân trang (`pagination.ts`).
* `src/types/`: Khai báo kiểu TypeScript (`studyspace.ts`, `vitoken.ts`).
* `supabase/`: Tập lệnh SQL schema, migration và RLS (`schema.sql`).
* `docs/ai/`: Toàn bộ bộ nhớ dự án dành cho AI và chuyển giao kỹ thuật.
* `scripts/`: Script tự động hóa (`gen-docs-index.ts`, `capture.mjs`).

### Quy Ước Đặt Tên
* **React Components:** PascalCase (`BookSpread.tsx`, `StudySpaceDeskView.tsx`).
* **Hooks:** camelCase với tiền tố `use` (`useStudySpace`, `useViToken`).
* **Files & Scripts:** kebab-case (`gen-docs-index.ts`, `nonAiEngine.ts`).
* **Database Tables:** snake_case số nhiều (`study_spaces`, `desk_documents`, `vitoken_transactions`).
