# 06_UI_MAP.md — Cấu Trúc Cây Giao Diện & HUD ViTudy

> **Commit Hash:** `Current Working Tree (Production Ready)`  
> **Cập nhật lần cuối:** `2026-11-07`

---

## 1. Cây Phân Cấp Giao Diện Tổng Thể (Component Hierarchy)

```
RootLayout (src/app/layout.tsx)
├── ViTokenProvider (src/context/ViTokenContext.tsx)
└── StudySpaceProvider (src/context/StudySpaceContext.tsx)
    └── StudySpacePage (src/app/page.tsx)
        ├── [Màn hình < 768px]: MobileCompanionView (src/components/mobile/MobileCompanionView.tsx)
        └── [Màn hình >= 768px]: StudySpaceDeskView (src/components/canvas/StudySpaceDeskView.tsx)
            ├── VrFrameOverlay (src/components/hud/VrFrameOverlay.tsx)
            ├── TopLeftNav (src/components/hud/TopLeftNav.tsx)
            ├── TopRightWallet (src/components/hud/TopRightWallet.tsx)
            ├── MultiplayerBar (src/components/hud/MultiplayerBar.tsx)
            ├── LeftCreationBar (src/components/hud/LeftCreationBar.tsx) [Miro-style Creation Tools]
            ├── BottomLeftKnowledge (src/components/hud/BottomLeftKnowledge.tsx)
            ├── BottomRightToolkit (src/components/hud/BottomRightToolkit.tsx)
            ├── Minimap (src/components/canvas/Minimap.tsx)
            └── InfiniteDesk (src/components/canvas/InfiniteDesk.tsx)
                ├── DeskGrid (src/components/canvas/DeskGrid.tsx)
                ├── DeskDrawingCanvas (src/components/canvas/DeskDrawingCanvas.tsx)
                ├── VisualLinkThreads (src/components/canvas/VisualLinkThreads.tsx)
                ├── Desk Items (Canvas Objects 2.5D) [Sử dụng hook useDeskItemInteraction]
                │   ├── BookSpread (src/components/objects/BookSpread.tsx)
                │   ├── PaperSheet (src/components/objects/PaperSheet.tsx) [Tờ đơn học thuật & In-Situ STudy]
                │   ├── ExamQuizCard (src/components/objects/ExamQuizCard.tsx) [Thẻ trắc nghiệm 3D lật mặt tương tác]
                │   └── StickyNoteItem (src/components/objects/StickyNoteItem.tsx)
                └── DeskDrawingInteractionLayer (src/components/canvas/DeskDrawingInteractionLayer.tsx)
```

---

## 2. Chi Tiết Các Cụm HUD (4 Góc & Overlay)

### 1. HUD Góc Trên-Trái: Quản Lý Bàn & Đổi Tên
* **Vị trí file:** [`src/components/hud/TopLeftNav.tsx`](file:///F:/AppMaking/ViTudy/src/components/hud/TopLeftNav.tsx) (`TopLeftNav`)
* **Context/State phụ thuộc:** `useStudySpace()` (`spaces`, `activeSpaceId`, `activeSpace`, `switchSpace`, `createSpace`, `searchQuery`, `setSearchQuery`).
* **Bảng màu:** Monochromatic (Nền `white/95`, viền `slate-300`, chữ `slate-900`).

### 2. HUD Góc Trên-Phải: Chuỗi Ngày, Chợ Tài Liệu, Ví ViToken & Cấu Hình AI
* **Vị trí file:** [`src/components/hud/TopRightWallet.tsx`](file:///F:/AppMaking/ViTudy/src/components/hud/TopRightWallet.tsx) (`TopRightWallet`)
* **Context/State phụ thuộc:** `useViToken()` (`wallet`, `aiConfig`, `claimDailyStreak`, `updateAiConfig`, `activeSecondsOnDesk`).
* **Thành phần hiển thị:**
  1. **Chuỗi Ngày (`Flame` icon):** Chỉ 1 biểu tượng ngọn lửa duy nhất với số ngày nằm gọn khít trong bụng ngọn lửa.
  2. **Chợ Tài Liệu (`Store` icon):** Nằm giữa Chuỗi và Credit, mở modal `MarketModal`.
  3. **Credit (`V` badge):** Tinh gọn chỉ hiện chữ `V` và số dư `50`.
  4. **AI Bot (`Bot` icon):** Biểu tượng bot tối giản mở modal cấu hình AI.

### 3. HUD Góc Giữa-Trên: Thanh Cộng Tác Trực Tuyến & Đồng Bộ Thuyết Trình
* **Vị trí file:** [`src/components/hud/MultiplayerBar.tsx`](file:///F:/AppMaking/ViTudy/src/components/hud/MultiplayerBar.tsx) (`MultiplayerBar`)
* **Chế độ Solo:** Tự động ẩn hoàn toàn để tối đa hóa không gian bàn học.
* **Chế độ Nhóm:** Hiện huy hiệu "Chủ phòng: Bạn", avatar thành viên, và nút "Đồng bộ góc nhìn" có chức năng lướt camera bám sát sách của người thuyết trình.

### 4. HUD Góc Dưới-Trái: Tải Lên & Mời Bạn
* **Vị trí file:** [`src/components/hud/BottomLeftKnowledge.tsx`](file:///F:/AppMaking/ViTudy/src/components/hud/BottomLeftKnowledge.tsx) (`BottomLeftKnowledge`)
* **Context/State phụ thuộc:** `useStudySpace()`, `useViToken()`.
* **Tính năng:** Nút "Tải lên" qua OS File Dialog, nút "Mời bạn" mở modal chia sẻ liên kết phòng học. Đã loại bỏ hoàn toàn Pomodoro timer và volume slider.

### 5. Thanh Công Cụ Sáng Tạo Dọc Bên Trái (Left Creation Bar)
* **Vị trí file:** [`src/components/hud/LeftCreationBar.tsx`](file:///F:/AppMaking/ViTudy/src/components/hud/LeftCreationBar.tsx) (`LeftCreationBar`)
* **Kiểu dáng Miro:** Thanh dọc nổi bên trái trung tâm (`left-4 top-1/2 -translate-y-1/2`), gom toàn bộ công cụ tạo tác:
  * Con trỏ (`cursor`)
  * Tạo note (`+ Note` với icon StickyNote)
  * Bút vẽ tự do (`pen`) kèm flyout chọn 4 màu mực
  * Bút dạ quang (`highlighter`)
  * Khóa di chuyển canvas (`lock`)
  * Hoàn tác nét vẽ (`undo`) & Xóa nét vẽ

### 5. Modal STudy Đã Được Module Hóa
* **Vị trí thư mục:** `src/components/modals/study-tools/`
  * `SummaryTab.tsx`: Tóm tắt TextRank & AI.
  * `QuizTab.tsx`: Tạo trắc nghiệm & Xuất đề thi A4 ra bàn học.
  * `FlashcardTab.tsx`: Tạo & lật thẻ ghi nhớ 2 mặt.
  * `RoadmapTab.tsx`: Lộ trình học đồng bộ số trang.
  * `OcrTab.tsx`: Nhận diện chữ viết tay qua OCR.

### 6. Modal Đọc Toàn Màn Hình (Full-Screen Document Reader / PDF View)
* **Vị trí file:** [`src/components/modals/FullScreenDocModal.tsx`](file:///F:/AppMaking/ViTudy/src/components/modals/FullScreenDocModal.tsx) (`FullScreenDocModal`)
* **Cơ chế Portal:** Gắn trực tiếp vào `document.body` tại `z-[100]` qua `createPortal`, che phủ 100% màn hình trên toàn bộ các lớp HUD.
* **Tính năng:**
  * Chế độ đọc PDF không xao nhãng cho cả Sách mở đôi (`BookSpread`), Tờ tài liệu (`PaperSheet`) và Tờ đề thi A4 (`exam_sheet`).
  * Thanh công cụ trên: chuyển trang, nhảy trang, chuyển đổi 1 trang / 2 trang, thu phóng zoom 60%-160%, nút thoát rõ ràng (kèm phím tắt `Esc`).
  * Điều hướng bằng phím mũi tên `←` và `→`.
  * `QuizTab.tsx`: Trắc nghiệm Cloze Deletion & nút Xuất đề thi ra bàn học.
  * `FlashcardTab.tsx`: Spaced Repetition lật thẻ tương tác.
  * `RoadmapTab.tsx`: Lộ trình học tương tác chia theo chặng và thời gian đọc.
  * `OcrTab.tsx`: Quét ảnh Tesseract.js WebAssembly client-side.

---

## 3. Các Vật Thể 2.5D Trên Bàn Học (Canvas Objects)

### 1. `BookSpread.tsx` — Cuốn Sách Mở Đôi 2.5D
* **Kích thước & Kiểu dáng:** `940 × 630px`, gờ xếp lớp trang mép ngoài, góc nghiêng tự nhiên `-1.5°`, bóng đổ mềm đa tầng.
* **Xoay & Kéo:** Tích hợp `useDeskItemInteraction`, góc xoay `atan2` mượt mà.

### 2. `PaperSheet.tsx` — Tờ Giấy Đơn Lẻ & Tờ Đề Thi A4 (SRS 4.3)
* **Kích thước & Kiểu dáng:** `360 × 500px` (Tài liệu thường) hoặc `460 × 620px` (Tờ đề thi A4).
* **Chế độ Exam Sheet:**
  * Hiển thị tiêu đề bài thi, mã đề, bộ đếm giờ thi.
  * Học sinh chọn đáp án A, B, C, D trực tiếp trên tờ giấy.
  * Nút "Nộp bài & Chấm điểm" tự động tính điểm số thang 10, vẽ icon đúng/sai và hiển thị lời nhận xét sư phạm.

### 3. `StickyNoteItem.tsx` — Giấy Ghi Chú
* **Kích thước:** `220 × 200px`, font viết tay `Patrick Hand`, cỡ chữ `16px font-semibold text-stone-900`. Tích hợp `useDeskItemInteraction`, bảo toàn khoảng trắng Unicode NFC và cách ly bộ gõ tiếng Việt qua `isTypingRef` + debounce 280ms.

---

## 4. Hệ Thống Điều Hướng Đáp Ứng Đa Nền Tảng (Responsive Multi-Device Layout)

* **Phân lớp thiết bị:**
  * **Desktop (≥ 1024px):** Thanh bên đầy đủ `w-64`, bảng dữ liệu mở rộng 3 cột, lưới 4 thẻ mẫu.
  * **Tablet (640px – 1023px):** Thanh bên thu gọn thành icon bar 72px (`w-18`), lưới thẻ 2 cột, bảng dữ liệu thu gọn.
  * **Mobile (< 640px):** Ẩn thanh bên, kích hoạt bộ đôi điều hướng di động:
    - **Mobile Drawer:** Ngăn kéo trượt từ trái (`w-72 max-w-[85vw] pb-safe`) mở bằng nút hamburger trên header, chứa đầy đủ các menu điều hướng, widget Pet Mascot và mục tiêu Pomodoro ngày.
    - **Bottom Navigation Bar:** Thanh 5 tab cố định dưới đáy (`fixed bottom-0 inset-x-0 pb-safe z-40 bg-white/95`) gồm Trang chủ, Bàn học, Bạn bè, Nhật ký, Hỏi đáp với vùng chạm tối thiểu 44×44px.
    - **Mobile Recent Desks:** Danh sách thẻ xếp dọc (`space-y-3`) thay thế bảng ngang, triệt tiêu 100% tràn thanh cuộn ngang trang.

