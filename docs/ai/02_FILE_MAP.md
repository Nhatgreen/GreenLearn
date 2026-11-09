# 02_FILE_MAP.md — Bản Đồ Cấu Trúc File Dự Án ViTudy

> **Commit Hash:** `74d4cc0`  
> **Cập nhật lần cuối:** `2026-11-07`  
> **Quy ước kích thước:** `S` (<100 dòng), `M` (100–300 dòng), `L` (>300 dòng).

---

## 1. Phân Hệ Canvas & Mặt Bàn Học 2.5D (`src/components/canvas/`)

| Đường dẫn File | Mục đích (1 dòng) | Exports chính | Ai import | Size |
|---|---|---|---|---|
| [`StudySpaceDeskView.tsx`](file:///F:/AppMaking/ViTudy/src/components/canvas/StudySpaceDeskView.tsx) | Wrapper trung tâm kết nối Canvas, HUD 4 góc và modal | `StudySpaceDeskView` | `src/app/page.tsx` | `S` |
| [`InfiniteDesk.tsx`](file:///F:/AppMaking/ViTudy/src/components/canvas/InfiniteDesk.tsx) | Không gian bàn vô cực 2.5D, pan canvas, bắt click desk | `InfiniteDesk` | `StudySpaceDeskView.tsx` | `M` |
| [`DeskGrid.tsx`](file:///F:/AppMaking/ViTudy/src/components/canvas/DeskGrid.tsx) | Lưới caro nền trắng tinh khiết chống mỏi mắt | `DeskGrid` | `InfiniteDesk.tsx` | `S` |
| [`DeskDrawingCanvas.tsx`](file:///F:/AppMaking/ViTudy/src/components/canvas/DeskDrawingCanvas.tsx) | SVG canvas vẽ tự do nét bút & bút dạ quang multiply | `DeskDrawingCanvas` | `InfiniteDesk.tsx` | `S` |
| [`DeskDrawingInteractionLayer.tsx`](file:///F:/AppMaking/ViTudy/src/components/canvas/DeskDrawingInteractionLayer.tsx) | Bắt sự kiện chuột vẽ tự do, giữ Alt để di chuyển bàn | `DeskDrawingInteractionLayer` | `InfiniteDesk.tsx` | `M` |
| [`Minimap.tsx`](file:///F:/AppMaking/ViTudy/src/components/canvas/Minimap.tsx) | Bản đồ radar thu nhỏ, click/drag camera định vị nhanh | `Minimap` | `StudySpaceDeskView.tsx` | `M` |
| [`VisualLinkThreads.tsx`](file:///F:/AppMaking/ViTudy/src/components/canvas/VisualLinkThreads.tsx) | Vẽ đường dây nối SVG giữa đoạn sách và note Inteline | `VisualLinkThreads` | `InfiniteDesk.tsx` | `S` |

---

## 2. Vật Thể Học Tập 2.5D Trên Bàn (`src/components/objects/`)

| Đường dẫn File | Mục đích (1 dòng) | Exports chính | Ai import | Size |
|---|---|---|---|---|
| [`BookSpread.tsx`](file:///F:/AppMaking/ViTudy/src/components/objects/BookSpread.tsx) | Cuốn sách mở đôi 2.5D 940x630, phân trang động, popover Inteline | `BookSpread` | `InfiniteDesk.tsx` | `L` |
| [`PaperSheet.tsx`](file:///F:/AppMaking/ViTudy/src/components/objects/PaperSheet.tsx) | Tờ giấy đơn lẻ/đề thi/tóm tắt 2.5D có thể xoay tự do | `PaperSheet` | `InfiniteDesk.tsx` | `M` |
| [`StickyNoteItem.tsx`](file:///F:/AppMaking/ViTudy/src/components/objects/StickyNoteItem.tsx) | Giấy ghi chú dán bàn học (Patrick Hand font, placeholder rỗng) | `StickyNoteItem` | `InfiniteDesk.tsx` | `M` |

---

## 3. Giao Diện HUD Kiểu Kính VR (`src/components/hud/`)

| Đường dẫn File | Mục đích (1 dòng) | Exports chính | Ai import | Size |
|---|---|---|---|---|
| [`TopLeftNav.tsx`](file:///F:/AppMaking/ViTudy/src/components/hud/TopLeftNav.tsx) | HUD trên-trái: chuyển đổi bàn học, tìm tài liệu, đồng bộ góc nhìn | `TopLeftNav` | `StudySpaceDeskView.tsx` | `M` |
| [`TopRightWallet.tsx`](file:///F:/AppMaking/ViTudy/src/components/hud/TopRightWallet.tsx) | HUD trên-phải: ví ViToken, chuỗi streak, menu cấu hình AI | `TopRightWallet` | `StudySpaceDeskView.tsx` | `L` |
| [`BottomLeftKnowledge.tsx`](file:///F:/AppMaking/ViTudy/src/components/hud/BottomLeftKnowledge.tsx) | HUD dưới-trái: nút mở file explorer tải tài liệu & Chợ KnowInherit | `BottomLeftKnowledge` | `StudySpaceDeskView.tsx` | `L` |
| [`BottomRightToolkit.tsx`](file:///F:/AppMaking/ViTudy/src/components/hud/BottomRightToolkit.tsx) | HUD dưới-phải: công cụ bút dạ quang, tạo note, zoom 100% | `BottomRightToolkit` | `StudySpaceDeskView.tsx` | `M` |
| [`LeftCreationBar.tsx`](file:///F:/AppMaking/ViTudy/src/components/hud/LeftCreationBar.tsx) | Thanh công cụ sáng tạo dọc bên trái kiểu Miro (+Note, Bút, Dạ quang, Khóa, Hoàn tác) | `LeftCreationBar` | `StudySpaceDeskView.tsx` | `M` |
| [`MultiplayerBar.tsx`](file:///F:/AppMaking/ViTudy/src/components/hud/MultiplayerBar.tsx) | HUD giữa-trên: danh sách avatar online, thả emoji tương tác | `MultiplayerBar` | `StudySpaceDeskView.tsx` | `M` |
| [`VrFrameOverlay.tsx`](file:///F:/AppMaking/ViTudy/src/components/hud/VrFrameOverlay.tsx) | Khung viền 4 góc và nhãn "Không gian học 2.5D" phong cách VR | `VrFrameOverlay` | `StudySpaceDeskView.tsx` | `S` |

---

## 4. Hộp Thoại Nổi & Chế Độ Di Động (`src/components/modals/`, `src/components/mobile/`)

| Đường dẫn File | Mục đích (1 dòng) | Exports chính | Ai import | Size |
|---|---|---|---|---|
| [`IntelineModal.tsx`](file:///F:/AppMaking/ViTudy/src/components/modals/IntelineModal.tsx) | Modal hỏi đáp AI ngữ cảnh sâu từng dòng, tạo sticky thread | `IntelineModal` | `BookSpread.tsx`, `PaperSheet.tsx` | `M` |
| [`StudyToolsModal.tsx`](file:///F:/AppMaking/ViTudy/src/components/modals/StudyToolsModal.tsx) | Modal STudy toàn diện: Tóm tắt TextRank, Trắc nghiệm Cloze, Flashcard | `StudyToolsModal` | `BookSpread.tsx`, `PaperSheet.tsx` | `L` |
| [`KnowInheritPublishModal.tsx`](file:///F:/AppMaking/ViTudy/src/components/modals/KnowInheritPublishModal.tsx) | Modal chia sẻ tài liệu: AI chấm điểm chất lượng, tính giá 85/15 | `KnowInheritPublishModal` | `BottomLeftKnowledge.tsx` | `M` |
| [`MobileCompanionView.tsx`](file:///F:/AppMaking/ViTudy/src/components/mobile/MobileCompanionView.tsx) | Giao diện di động rút gọn khi màn hình hẹp (<768px) | `MobileCompanionView` | `src/app/page.tsx` | `M` |

---

## 5. Trạng Thái Toàn Cục & CSDL Cục Bộ (`src/context/`, `src/data/`)

| Đường dẫn File | Mục đích (1 dòng) | Exports chính | Ai import | Size |
|---|---|---|---|---|
| [`StudySpaceContext.tsx`](file:///F:/AppMaking/ViTudy/src/context/StudySpaceContext.tsx) | State Provider bàn học: vị trí items, rotation, nét vẽ, zIndex | `StudySpaceProvider`, `useStudySpace` | `src/app/layout.tsx`, Components | `L` |
| [`ViTokenContext.tsx`](file:///F:/AppMaking/ViTudy/src/context/ViTokenContext.tsx) | State Provider ví ViToken: số dư, chuỗi streak, cấu hình AI | `ViTokenProvider`, `useViToken` | `src/app/layout.tsx`, Components | `M` |
| [`mockSpaces.ts`](file:///F:/AppMaking/ViTudy/src/data/mockSpaces.ts) | Dữ liệu khởi tạo mẫu: 8 trang Machine Learning, lộ trình ôn thi | `INITIAL_SPACES` | `StudySpaceContext.tsx` | `M` |

---

## 6. Động Cơ Thuần Túy & Tiện Ích (`src/lib/`, `src/utils/`, `src/types/`)

| Đường dẫn File | Mục đích (1 dòng) | Exports chính | Ai import | Size |
|---|---|---|---|---|
| [`nonAiEngine.ts`](file:///F:/AppMaking/ViTudy/src/lib/nonAiEngine.ts) | Thuật toán TextRank, TF-IDF, Cloze Quiz, Flashcard quy tắc | `summarizeWithTextRank`, `generateClozeQuestions`, `generateFlashcardsFromRules`, `extractOutlineAndRoadmap` | `StudyToolsModal.tsx`, `BottomLeftKnowledge.tsx` | `M` |
| [`pagination.ts`](file:///F:/AppMaking/ViTudy/src/utils/pagination.ts) | Phân trang văn bản động dựa trên DOM, chống cụt công thức | `paginateDocument`, `PaginatedLeaf` | `BookSpread.tsx`, `PaperSheet.tsx` | `M` |
| [`studyspace.ts`](file:///F:/AppMaking/ViTudy/src/types/studyspace.ts) | Khai báo kiểu TypeScript: `DeskItem`, `StudySpace`, `DrawingStroke` | Toàn bộ type không gian học | Toàn hệ thống Canvas | `S` |
| [`vitoken.ts`](file:///F:/AppMaking/ViTudy/src/types/vitoken.ts) | Khai báo kiểu TypeScript: `ViTokenWallet`, `AiConfig`, `Transaction` | Toàn bộ type ví & AI Gateway | Toàn hệ thống AI/Wallet | `S` |

---

## 7. Tuyến API & CSDL Supabase (`src/app/api/`, `supabase/`)

| Đường dẫn File | Mục đích (1 dòng) | Exports chính | Ai import | Size |
|---|---|---|---|---|
| [`src/app/api/ai/chat/route.ts`](file:///F:/AppMaking/ViTudy/src/app/api/ai/chat/route.ts) | Route POST: Cổng kết nối AI đa chế độ (Codex, Gemini, OpenAI) | `POST` | Next.js API Runtime | `M` |
| [`supabase/schema.sql`](file:///F:/AppMaking/ViTudy/supabase/schema.sql) | DDL CSDL: 10 bảng PostgreSQL, pgvector, RLS, hàm chuyển tiền 85/15 | SQL Migration script | Supabase CLI / DB Admin | `M` |
