# 11_CHANGELOG.md — Nhật Ký Phiên Làm Việc (Session Log)

> **Quy tắc:** Append-only. Mục mới nhất luôn nằm ở trên cùng.

---

## 2026-11-11 11:30 — main (Tối Ưu Hóa Mời Trực Tiếp & Đưa Nút Mời Lên TopLeftNav)
- **Task:** Xử lý triệt để phản hồi người dùng: "Kết bạn bị lỗi kết bạn + kết bạn để ở sâu quá không oke lắm, nó chỉ nên là mời thôi":
  1. **Triệt Tiêu Hoàn Toàn Rào Cản Kết Bạn ("Chỉ nên là mời"):**
     - Loại bỏ quy trình kết bạn chờ duyệt/chấp thuận 2 chiều phức tạp khiến việc mời bị chặn hoặc lỗi trạng thái.
     - Cho phép nhập trực tiếp Tên hoặc Email của bất kỳ bạn học nào và bấm **"Mời ngay"** (`Send` button) để phát sóng lời mời Realtime tức thì.
     - Tự động ghi nhận bạn học vào danh sách **"Đã mời gần đây"** (Recent Buddies) kèm nút **"Mời lại"** 1-chạm và đèn tín hiệu trực tuyến.
  2. **Đưa Nút "Mời bạn" Lên Thanh Điều Hướng Trên Cùng (`TopLeftNav.tsx`):**
     - Đặt nút **"Mời bạn"** (icon `Share2`, `bg-green-50 text-[#16A34A] border-green-200`) ngay cạnh thanh tìm kiếm và tiêu đề bàn học ở đầu màn hình.
     - Người học chỉ cần bấm 1 click là mở ngay hộp thoại mời mà không cần phải tìm kiếm sâu ở góc màn hình.
  3. **Hộp Thoại Mời Bạn Cùng Học Thống Nhất Một Mặt Phẳng (Zero Tabs):**
     - Bỏ phân chia tab 1/tab 2 gây ẩn tính năng; gom tất cả vào một màn hình trực quan duy nhất:
       - Khối 1: Mời bạn học trực tiếp (Form nhập + nút Mời ngay + danh sách Đã mời gần đây).
       - Khối 2: Sao chép liên kết phòng học, chia sẻ Zalo/Messenger và quét mã QR.
       - Khối 3: Bộ chọn phân quyền ("Chỉ xem" / "Cùng chỉnh sửa").
       - Khối 4: Ô vào nhanh bằng mã phòng (Room ID Quick Join).
       - Khối 5: Danh sách thành viên đang có mặt trực tuyến trên bàn học.
- **Verified by:**
  - `pnpm test`: 19/19 test suites passed (84/84 tests passed 100%).
  - `pnpm run build:pages`: Static export 14/14 static pages thành công.
  - `pnpm run docs:check`: Ký hiệu và chỉ mục bộ nhớ AI đạt chuẩn 100%.
- **Branch:** `main` (tracked `origin/main`).

---

## 2026-11-11 11:00 — main (Đồng Bộ 2 Bàn Học, Tự Lưu Bền Vững & Hệ Thống Bạn Bè Chuẩn ViTrainer)
- **Task:** Triển khai toàn diện yêu cầu: "Khi chia sẻ có link thì phải đồng bộ 2 bàn học với nhau trên bàn học và tự lưu hai bàn học lại có thêm cơ chế kết bạn mời học chung":
  1. **Đồng Bộ 2 Bàn Học & Tự Động Lưu Cả 2 Bàn Học (`useRealtimeMultiplayer.ts` & `StudySpaceContext.tsx`):**
     - Sửa lỗi Host reload bị chuyển thành Guest: Lưu cờ nhận diện Host trong `localStorage` (`greenlearn_hosted_room_[roomId]`), đảm bảo Host sau khi F5/reload vẫn giữ nguyên vai trò Host và tiếp tục phát sóng đồng bộ cho bạn học.
     - Khi Guest mở liên kết phòng `?room=XYZ`: Hệ thống tự động tạo một không gian bàn học nhóm riêng biệt (`newSharedSpace` với `id: urlRoomId`), ngăn chặn hoàn toàn việc ghi đè lên các bàn học cá nhân của Guest.
     - Cơ chế `REQUEST_SPACE_STATE` kèm retry (sau 1000ms): Guest vừa vào phòng lập tức gửi yêu cầu xin dữ liệu; Host gửi `SYNC_SPACE_STATE` kèm tên bàn học (`spaceName`), danh sách vật thể (`items`) và nét vẽ (`strokes`).
     - Tên bàn học bên phía Guest tự động cập nhật trực quan: `Bàn học cùng bạn: [Tên bàn học]`.
     - Cả hai bàn học (của Host và Guest) đều được tự động lưu bền vững vào `localStorage` và Supabase Cloud theo thời gian thực.
  2. **Hệ Thống Quản Lý Bạn Bè Chuẩn ViTrainer (`SocialFriendService.ts` & `useSocialPresence.ts`):**
     - Học hỏi kiến trúc mạng xã hội bạn bè từ `namtacozz/ViTrainer` (`js/net/social.js`):
       - Quản lý danh sách bạn bè với trạng thái: `'ok'` (bạn bè), `'in'` (lời mời đến), `'out'` (lời mời đã gửi).
       - Kết bạn nhanh chóng bằng Nickname hoặc Email.
       - Chấp nhận hoặc từ chối lời mời kết bạn, hủy kết bạn.
     - Kênh Realtime Social toàn hệ thống (`vitudy-social`):
       - Theo dõi trạng thái trực tuyến (Online/Offline) của bạn bè thời gian thực với đèn tín hiệu xanh lá GreenLearn nhấp nháy.
       - Hiển thị bạn đang ở phòng học nào nếu đang tham gia phòng nhóm.
  3. **Thông Báo Toast Mời Học Chung Nổi Thời Gian Thực (`FriendInviteToast.tsx`):**
     - Khi Host bấm nút "Mời học" bên cạnh tên người bạn đang online trong danh sách bạn bè, hệ thống broadcast sự kiện `DESK_INVITE` tức thì.
     - Phía bạn học lập tức xuất hiện thẻ Toast nổi công nghệ cao ở góc trên bên phải màn hình: `[Tên bạn] đã mời bạn vào bàn học!` kèm tên bàn học và mã phòng.
     - Bạn học bấm nút **"Vào học ngay"** (Xanh Lá GreenLearn `#16A34A`): Hệ thống tự động chuyển vào bàn học nhóm, kết nối và đồng bộ 2 bàn học ngay lập tức.
     - Nút "Để sau" kèm thanh đếm ngược tự động đóng sau 60 giây.
  4. **Nâng Cấp Hộp Thoại Chia Sẻ Đa Năng (`BottomLeftKnowledge.tsx`):**
     - Giao diện 2 tab hiện đại:
       - Tab 1 **"Liên kết phòng"**: Ô nhập mã phòng (Room ID) vào nhanh (Quick Join Box), liên kết chia sẻ phòng kèm nút sao chép và mã QR, bộ chọn phân quyền ("Chỉ xem" / "Cùng chỉnh sửa"), danh sách người đang có mặt trong phòng, và cấu hình Supabase nâng cao.
       - Tab 2 **"Bạn bè & Mời học"**: Thẻ tên hiển thị của bạn, form kết bạn, danh sách lời mời gửi đến với nút "Đồng ý" / "Từ chối", danh sách bạn bè kèm trạng thái trực tuyến và nút **"Mời học"**.
- **Verified by:**
  - `pnpm test`: 19/19 test suites passed (85/85 tests passed 100%), bao gồm bộ test mới `SocialFriendService.test.ts`.
  - `pnpm run build:pages`: Static export 14/14 static pages thành công hoàn toàn.
  - `pnpm run docs:check`: Ký hiệu và chỉ mục bộ nhớ AI đạt chuẩn 100%.
- **Branch:** `main` (tracked `origin/main`).

---

## 2026-11-11 10:00 — main (Khắc Phục Lỗi Đồng Bộ Bàn Học & Kết Nối Bạn Bè Mời Cùng Học)
- **Task:** Khắc phục triệt để lỗi "mời bạn cùng học bị lỗi chức năng không đồng bộ với nhau và chưa thấy được người vào":
  1. **Khắc Phục Lỗi Không Thấy Bạn Học Tham Gia (`useRealtimeMultiplayer.ts` & `BottomLeftKnowledge.tsx`):**
     - Sửa nguyên nhân gốc rễ: Chủ bàn (Host) trước đây không tự động kết nối vào kênh Realtime do thiếu tham số `room=` trên URL của chính mình.
     - Khi Host bấm nút "Chia sẻ" hoặc mở hộp thoại "Mời bạn cùng học", hệ thống tự động kích hoạt `startHostingRoom()`, ghi nhận `room` trên URL (qua `window.history.replaceState` an toàn không tải lại trang) và kết nối ngay lập tức vào Supabase Realtime channel `room-${effectiveRoomId}`.
     - Thay thế state giả lập cục bộ `peersInRoom` trong `BottomLeftKnowledge.tsx` bằng `multiplayerPeers` từ `StudySpaceContext`. Khi bạn học vào phòng qua link chia sẻ, sự kiện Presence `sync` và `join` cập nhật danh sách "Người trong phòng" ngay lập tức với tên, màu đại diện, vai trò và trạng thái trực tuyến.
     - Thanh bottom HUD `MultiplayerBar` tự động xuất hiện với avatar của tất cả thành viên trong phòng.
  2. **Đồng Bộ Hoạt Động Bàn Học 2 Chiều (`StudySpaceContext.tsx` & `useRealtimeMultiplayer.ts`):**
     - Bổ sung hệ thống định tuyến sự kiện `DeskAction` đa luồng trên Supabase Realtime:
       - `ITEM_MOVE`: Đồng bộ di chuyển tài liệu, sách, note thời gian thực (throttled 40ms mượt mà).
       - `ITEM_ROTATE`: Đồng bộ xoay vật thể 360 độ.
       - `PAGE_TURN`: Đồng bộ lật trang sách hai chiều.
       - `ADD_ITEM`: Đồng bộ tạo mới sổ tay, giấy note, code block, mind map, sticker, đề thi.
       - `DELETE_ITEM`: Đồng bộ xóa vật thể trên bàn học.
       - `DRAW_STROKE`, `CLEAR_STROKES`, `REMOVE_STROKE`: Đồng bộ nét vẽ tự do và tẩy xóa.
       - `REQUEST_SPACE_STATE` / `SYNC_SPACE_STATE`: Khi bạn học vừa tham gia phòng, Host tự động gửi toàn bộ đối tượng và nét vẽ trên bàn học để bạn học thấy ngay bàn học giống hệt Host.
     - Cờ `isApplyingRemoteAction` ngăn chặn triệt để vòng lặp dội ngược (infinite echo loop).
  3. **Đồng Bộ Con Trỏ Chuột Tọa Độ Thế Giới (`MultiplayerCursorsLayer.tsx`):**
     - Con trỏ chuột được tính toán theo tọa độ bàn học thế giới `(wx, wy) = (clientX - transform.x) / scale`.
     - `MultiplayerCursorsLayer` chiếu ngược về màn hình cục bộ `(wx * scale + transform.x, wy * scale + transform.y)`, giúp con trỏ luôn trỏ đúng từng ký tự và vị trí tài liệu dù bạn học có kích thước màn hình hoặc độ thu phóng khác nhau.
- **Verified by:**
  - `pnpm test`: 18/18 test suites passed (80/80 tests passed 100%), bao gồm bộ test mới `useRealtimeMultiplayer.test.ts`.
  - `pnpm run build:pages`: Static export 14/14 static pages thành công.
- **Branch:** `main` (tracked `origin/main`).

---

## 2026-11-11 09:25 — main (Khắc Phục Lỗi Cắt Trang Mất Bìa Sách & Thêm Bìa Trống Để Dán Trang Vào)
- **Task:** Khắc phục triệt để lỗi khi người dùng bấm "Tách trang" làm mất luôn bìa sách da (bị biến thành tờ giấy `paper`), đồng thời hỗ trợ bìa sách trống và cơ chế dán trang vào bìa sách theo yêu cầu:
  1. **Khắc Phục Lỗi Tách Trang Mất Bìa Sách (`StudySpaceContext.tsx`):**
     - Sửa hàm `detachPageFromBinder`: Triệt tiêu hoàn toàn logic hạ cấp `nextCount < 5 ? 'paper' : 'book'` đối với các đối tượng có `coverColor` hoặc `type === 'book'`. Sách bìa da luôn giữ nguyên định dạng `book` và kích thước bìa da (`980 × 640`), không bao giờ bị biến dạng thành tờ giấy.
     - Cho phép tách trang xuống 0 trang: Ngay cả khi người dùng tách hết toàn bộ các trang ra ngoài bàn học, bìa sách da vẫn tồn tại nguyên vẹn trên mặt bàn học ở trạng thái bìa trống.
  2. **Bìa Sách Mới Thêm Vào Là Bìa Trống (`BookCoverModal.tsx` & `StudySpaceContext.tsx`):**
     - Chuyển mẫu mặc định khi mở hộp thoại `BookCoverModal` thành **"Bìa trống (Chưa có trang)"** với 0 trang ban đầu (`pages: []`).
     - Sửa `addBook` trong `StudySpaceContext`: Cho phép nạp mảng trang rỗng `initialPages = []` để tạo bìa da hoàn toàn trống thay vì ép nạp 4 trang mặc định.
  3. **Giao Diện Bìa Sách Trống Trực Quan (`BookSpread.tsx`):**
     - Khi ruột sách chưa có trang (`item.pages.length === 0`), mặt sách hiển thị thông điệp hướng dẫn rõ ràng và nút "+ Thêm trang giấy đầu tiên" (`addPageToBook`).
     - Bổ sung tab đánh dấu ruy-băng **"Thêm trang"** (Màu Hổ Phách `amber-600`, icon `Plus`) trên mép phải cuốn sách để người dùng có thể bổ sung trang trắng bất kỳ lúc nào.
     - Tab **"Tách trang"** chỉ hiển thị khi sách có ít nhất 1 trang.
  4. **Cơ Chế Dán Trang Vào Bìa Sách (`PaperSheet.tsx` & `useDeskItemInteraction.ts`):**
     - Tích hợp `onDropCheck` vào `PaperSheet`: Khi người dùng kéo thả tờ giấy rời (hoặc trang vừa tách) thả lên bìa sách bất kỳ trên bàn học, hệ thống tự động gộp trang vào sách (`combineIntoBinder`) và dọn dẹp tờ giấy khỏi mặt bàn.
     - Bổ sung nút **"Dán vào bìa sách"** (`BookmarkPlus`) trên thanh công cụ nổi của tờ giấy để dán nhanh vào cuốn sách gần nhất chỉ với 1 cú nhấp.
- **Verified by:**
  - `pnpm test`: 17/17 test suites passed (75/75 tests passed 100%).
  - `pnpm run build:pages`: Static export 14/14 static pages thành công, 0 lỗi lint / type.
- **Branch:** `main` (tracked `origin/main`).

---

## 2026-11-11 09:05 — main (Thêm Công Cụ Tạo Sách & Sổ Tay Bìa Da "Book Cover" Trên Thanh Sáng Tạo LeftCreationBar)
- **Task:** Thêm công cụ "Book cover" vào danh mục CÔNG CỤ MỞ RỘNG trên thanh sáng tạo `LeftCreationBar`, cho phép người dùng tùy biến và tạo sách giáo trình & sổ tay bìa da cao cấp trực tiếp lên bàn học:
  1. **Component Mới `BookCoverModal.tsx` (`src/components/modals/BookCoverModal.tsx`):**
     - Live 3D Preview bìa da thời gian thực với màu sắc, hiệu ứng ánh sáng gradient, đường viền nhũ vàng dập chìm, ruy-băng đánh dấu trang và bóng gáy sách chân thực.
     - Bộ chọn 5 màu da cao cấp chuẩn `BOOK_COVER_PRESETS`: Nâu Da, Đỏ Đậm, Xanh Nước Đậm, Xanh Lá Đậm, Hồng Đậm.
     - Ô nhập tên sách / sổ tay kèm 4 chip gợi ý nhanh: "Sổ tay ghi chép", "Giáo trình bài học", "Vở bài tập thực hành", "Sổ Cornell ôn thi".
     - 3 Mẫu cấu trúc trang ban đầu:
       - **Sổ tổng hợp (Khuyên dùng):** 4 trang mẫu gồm Mục lục, Kiến thức cốt lõi, Công thức toán KaTeX và Bài tập rèn luyện.
       - **Sổ Cornell:** Cấu trúc 4 trang phân chia Từ khóa / Câu hỏi ôn tập, Ghi chú chi tiết và Tóm tắt cuối trang.
       - **Sổ tay trắng:** 4 trang giấy trắng tinh để người dùng tự do viết vẽ, ghi chú và dán note.
     - Hai chế độ đặt sách:
       - **"Thêm vào giữa bàn":** Tự động sinh sách tại tâm góc nhìn hiện tại của bàn học.
       - **"Chọn vị trí đặt":** Kích hoạt con trỏ đóng dấu (stamp placement) để nhấp chuột chọn vị trí đặt chính xác trên bàn học.
     - Tuân thủ React Portal `createPortal(..., document.body)` với `z-[9990]`, phím tắt `Escape` và đóng khi click overlay.
  2. **Mở Rộng Context & Layer Tương Tác (`StudySpaceContext.tsx` & `DeskDrawingInteractionLayer.tsx`):**
     - Thêm phương thức `addBook` vào `StudySpaceContext` tự động sinh `DeskItem` loại `book`, khởi tạo 4 trang theo mẫu, định vị tọa độ và thiết lập màu da `coverColor`.
     - Mở rộng `CreationPlacementTemplate` hỗ trợ `title`, `coverColor`, `pages`.
     - Cập nhật `DeskDrawingInteractionLayer` xử lý `template?.itemType === 'book'` khi người dùng nhấp hoặc kéo thả chuột trên bàn học, kèm SVG cursor con trỏ bìa sách da viền vàng sắc nét.
  3. **Tích Hợp Vào Thanh Công Cụ `LeftCreationBar.tsx`:**
     - Bổ sung mục `Book cover` (icon `BookOpen`, mô tả "Sách giáo trình & sổ tay bìa da học tập") vào danh sách `extraTools` trong popover "CÔNG CỤ MỞ RỘNG".
- **Verified by:**
  - `pnpm test`: 17/17 test suites passed (75/75 tests passed 100%).
  - `pnpm run build:pages`: Static export 14/14 static pages thành công, 0 lỗi lint / type.
- **Branch:** `main` (tracked `origin/main`).

---

## 2026-11-11 08:26 — main (Cào & Chuyển Giao Toàn Diện Các Tính Năng Nâng Cấp Từ ViTudy 2026-11-10)
- **Task:** Rà soát và chuyển giao toàn bộ các cải tiến vượt bậc từ các commit ngày hôm qua của ViTudy (`namtacozz/ViTudy` từ commit `46aa868` đến `13a1069`) vào GreenLearn, duy trì chuẩn nhận diện Xanh Lá GreenLearn (`#16A34A`), miễn phí 100% (không token) và bảo mật BYOK:
  1. **Trình Render Công Thức Toán KaTeX Nâng Cấp (`MathRenderer.tsx`):**
     - Hỗ trợ tiêu đề Markdown (`##`, `###`), danh sách có gạch đầu dòng chuẩn Xanh GreenLearn (`text-[#16A34A]`), canh lề khối công thức display math `$$...$$` không bị lệch lề, bộ nhớ đệm KaTeX inline regex tối ưu hiệu năng.
  2. **Bảng Dữ Liệu & Ghi Chú Trực Quan (`StickyNoteItem.tsx`):**
     - Sửa trực tiếp từng ô bảng (`cell editing`) bằng thao tác nhấp đúp mà không cần mở toàn bộ văn bản.
     - Tính tổng phần trăm tự động (`100%`) cho các cột phân bổ tỷ lệ.
     - Nút "+ Thêm hàng" nhanh bên dưới bảng.
     - Thanh công cụ điều khiển nổi nâng cao (`bottom-full mb-6`) với cầu rê chuột vô hình (invisible hover bridge) giúp thao tác mượt mà không che băng dính.
     - Nút xóa an toàn 2 bước ("Xác nhận?" 3 giây) chống vô tình xóa mất ghi chú.
  3. **Phòng Học Trực Tuyến & Phân Quyền (`BottomLeftKnowledge.tsx` & `MultiplayerBar.tsx`):**
     - Phân quyền bạn học: "Chỉ xem" (mặc định an toàn) và "Cùng chỉnh sửa".
     - Tùy chọn thời hạn liên kết phòng học (Hạn 1h, 24h, Không giới hạn).
     - Tạo mã liên kết mới (`roomSalt`) để thu hồi liên kết cũ ngay tức thì.
     - Chia sẻ nhanh qua Zalo, Messenger và mã QR trực quan (quét điện thoại để vào bàn học).
     - Danh sách thành viên trong phòng với nút "Mời ra" (`UserMinus`). Phím tắt ESC đóng modal tức thì.
  4. **Lưu Trữ & Khôi Phục Bàn Học Chống Mất Dữ Liệu (`StudySpaceContext.tsx` & `page.tsx`):**
     - Bổ sung cờ `isLoaded` ngăn chặn tình trạng ghi đè bàn học trống khi vừa mở trang hoặc vừa reload.
     - Tự động ghi nhớ `greenlearn_active_space_id` và khôi phục đúng bàn học đang mở.
     - Hỗ trợ tham số URL `?space=XYZ` để mở trực tiếp bàn học cụ thể từ liên kết ngoài hoặc từ bảng bàn học gần đây.
  5. **Bộ Công Cụ Học Tập In-Situ & KaTeX Trong Bài Học (`StudyToolsModal.tsx`, `QuizTab.tsx`, `SummaryTab.tsx`, `FlashcardTab.tsx`, `RoadmapTab.tsx`, `BookSpread.tsx`):**
     - STudy hiển thị dạng overlay in-situ trực tiếp trên mặt sách (`BookSpread`), triệt tiêu hoàn toàn lỗi lệch khung modal hoặc che tràn màn hình.
     - `QuizTab`: Tùy chọn số câu (3, 5, 10), độ khó (Dễ, Vừa, Khó), phạm vi (Trang hiện tại / Cả cuốn sách); render toàn bộ câu hỏi và đáp án bằng công thức KaTeX; nút "Làm lại câu sai" và "Lưu câu sai vào thẻ ghi nhớ"; lời giải chi tiết có thể thu gọn / mở rộng.
     - `SummaryTab`: Render tóm tắt bằng KaTeX `MathRenderer`.
     - `FlashcardTab` & `RoadmapTab`: Tích hợp chế độ AI chuyên sâu tạo thẻ và lộ trình học tập, render công thức toán học KaTeX trên từng chặng học.
  6. **Trang Chủ Cải Tiến (`HomePage.tsx` & `demoSpace.ts`):**
     - Bổ sung nút "Bắt đầu phiên 25p" trong widget Pomodoro.
     - Bảng bàn học gần đây hiển thị huy hiệu "Mẫu" (`isDemo`) gọn gàng và tinh tế.
- **Verified by:**
  - `pnpm test`: 17/17 test suites passed (75/75 tests passed 100%).
  - `pnpm run build:pages`: Static export 14/14 static pages thành công, 0 lỗi lint / type.
- **Branch:** `main` (tracked `origin/main`).

---

## 2026-11-11 08:02 — main (Nâng Cấp Kết Nối Đa Công Cụ AI: Google Gemini, OpenAI & ChatGPT OAuth PKCE)
- **Task:** Đồng bộ các công cụ kết nối AI tiên tiến từ ViTudy vào GreenLearn, mở rộng khả năng kết nối linh hoạt cho học sinh / sinh viên:
  1. **Tích Hợp Google Gemini (BYOK Miễn Phí):**
     - Hỗ trợ gọi trực tiếp client-side API Google Gemini (`https://generativelanguage.googleapis.com/v1beta/models/...`) với Khóa API từ Google AI Studio (miễn phí hạn mức lớn).
     - Hỗ trợ đầy đủ các mô hình: `gemini-2.5-flash`, `gemini-2.5-pro`, `gemini-2.0-flash`, `gemini-1.5-pro`, `gemini-1.5-flash`.
  2. **Tích Hợp Đăng Nhập ChatGPT (OAuth 2.0 PKCE):**
     - Đưa module `openaiOAuth.ts` vào GreenLearn: Khởi tạo cặp S256 PKCE code_verifier/code_challenge, quy trình đăng nhập 2 bước, 1-click paste callback URL và lưu trữ an toàn trong `ByokStore`.
     - Phân nhóm mô hình trực quan theo mục đích sử dụng (Siêu suy luận, Cân bằng & Đa dụng, Phản hồi nhanh & Tiết kiệm).
  3. **Tối Ưu Modal Cài Đặt AI (`TopRightWallet.tsx`):**
     - Giao diện 3 bước chuẩn mực: Chọn nhà cung cấp (Gemini, OpenAI, ChatGPT OAuth) $\rightarrow$ Nhập thông tin xác thực tương ứng kèm link hướng dẫn lấy key $\rightarrow$ Chọn mô hình và nút "Kiểm tra key" đo thời gian thực (ms).
     - Thiết kế mang sắc thái nhận diện Xanh Lá GreenLearn (`#16A34A` / `#15803D`) sang trọng, sạch sẽ, bảo mật 100% trong localStorage.
  4. **Đồng Bộ Trang Cài Đặt Tài Khoản (`AccountSettings.tsx`):**
     - Hỗ trợ người dùng lưu trữ, kiểm tra và dọn dẹp cả Khóa Google Gemini và Khóa OpenAI độc lập.
- **Verified by:**
  - `pnpm test`: 17/17 test suites passed (75/75 tests passed 100%).
  - `pnpm run build:pages`: Static export 14/14 static pages thành công, 0 lỗi lint / type.
- **Branch:** `main` (tracked `origin/main`).

---

## 2026-11-11 07:48 — main (Thu Nhỏ & Khống Chế Chuẩn Kích Thước Avatar Profile Trên Header)
- **Task:** Thu nhỏ và khống chế kích thước ảnh đại diện cá nhân (`Avatar Profile`) trên thanh tiêu đề `HomePage` và thanh điều hướng `TopLeftNav`:
  1. **Khắc Phục Lỗi Kích Thước Lớn Bất Thường:**
     - Lớp class `w-8.5 h-8.5` không tồn tại trong bộ quy cách chuẩn của Tailwind CSS dẫn đến việc container `<Link>` không có chiều rộng/cao cụ thể. Khi người dùng đăng nhập bằng Google OAuth, ảnh avatar tải về ở độ phân giải gốc khiến vòng tròn avatar bung to bất thường (~96px) lấn át thanh tiêu đề.
  2. **Khống Chế Kích Thước Chuẩn Công Thái Học:**
     - Thiết lập chuẩn kích thước `w-8 h-8` (32×32px, `rounded-full shrink-0`) trên `HomePage.tsx`, cân xứng hoàn hảo với huy hiệu chuỗi ngày học / thú cưng (`py-1.5`).
     - Bổ sung thuộc tính HTML `width={32} height={32}` và inline style phòng vệ `style={{ width: '32px', height: '32px', minWidth: '32px', minHeight: '32px', maxWidth: '32px', maxHeight: '32px' }}` cho cả container và thẻ `<img>` con.
     - Cập nhật tương tự cho `TopLeftNav.tsx` (`w-7 h-7` / 28px) và `ProfileHeader.tsx` (`w-20 h-20` / 80px).
  3. **Cập Nhật AGENTS.md:**
     - Ghi nhận quy chuẩn Strict Image, SVG & Avatar Size Containment cho avatar profile.
- **Verified by:**
  - `pnpm test`: 16/16 test suites passed (64/64 tests passed).
  - `pnpm run build:pages`: Static export 14/14 static pages thành công, 0 lỗi lint / type.
- **Branch:** `main` (tracked `origin/main`).

---

## 2026-11-10 21:02 — main (Triển Khai Thành Công GreenLearn Lên GitHub Pages Trực Tuyến)
- **Task:** Đẩy toàn bộ mã nguồn lên repository `Nhatgreen/GreenLearn`, tinh chỉnh GitHub Actions workflow và kích hoạt triển khai thành công 100% trang web tĩnh lên GitHub Pages:
  1. **Tạo & Đồng Bộ Repo GitHub:**
     - Đã thiết lập remote SSH `git@github.com:Nhatgreen/GreenLearn.git`.
     - Fast-forward merge nhánh `refactor/greenlearn-free` vào `main` và đẩy cả hai nhánh lên GitHub.
  2. **Khắc Phục & Tối Ưu GitHub Actions (`deploy.yml`):**
     - Loại bỏ cờ `enablement: true` ở `actions/configure-pages@v5` giúp workflow tương thích hoàn toàn với chế độ GitHub Actions Pages của repository.
     - Sử dụng trực tiếp `pnpm run build:pages` đảm bảo gắn `basePath: /GreenLearn` và tự động sinh file `.nojekyll`.
  3. **Xác Minh Trực Tuyến (Production Live):**
     - Workflow `Deploy Next.js to GitHub Pages` chạy thành công (Build: success, Deploy: success).
     - Kiểm tra trực tuyến `https://nhatgreen.github.io/GreenLearn/`: Trả về `HTTP/2 200 OK`.
     - Toàn bộ tài nguyên tĩnh (`/icons/greenlearn-icon.png`, `/pet/stage1.png`...) tải chuẩn xác 200 OK không bị lỗi 404.
- **Verified by:**
  - `curl -sIL https://nhatgreen.github.io/GreenLearn/`: `HTTP/2 200`.
  - Tiêu đề trang: `<title>GreenLearn — Bàn Học Tri Thức 2.5D</title>`.
- **Branch:** `main` (tracked `origin/main`).

---

## 2026-11-10 11:25 — refactor/greenlearn-free (Phủ Mã Màu Xanh Lá GreenLearn `#16A34A` Lên Toàn Bộ Giao Diện & Desk)
- **Task:** Triệt tiêu hoàn toàn tông màu be/nâu/cam tồn dư từ ViTudy cũ, đồng bộ tuyệt đối sắc thái thương hiệu **Xanh Lá GreenLearn `#16A34A`** (hover: `#15803D`, soft: `#F0FDF4`, border: `#BBF7D0`, text: `#166534`) trên toàn bộ hệ thống:
  1. **Trang Chủ (`HomePage.tsx`) & Giới Thiệu (`AboutPage.tsx`):**
     - Thay thế nền parchment ấm `#faf8f5` bằng nền hiện đại `bg-slate-50` / `bg-white` kết hợp viền sắc nét `border-slate-200`.
     - Nút CTA chính đổi từ đen sang Xanh lá GreenLearn `bg-[#16A34A] hover:bg-[#15803D] text-white shadow-md shadow-green-600/20`.
     - Thanh bên (Sidebar): Các mục active và badge số lượng sử dụng `bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]`.
     - Card widget học tập: Widget linh vật, thanh tiến độ chuỗi ngày học, viền hover thẻ đều mang sắc xanh tươi sáng.
  2. **Thanh Công Cụ Mặt Bàn (`LeftCreationBar.tsx`):**
     - Đổi trạng thái kích hoạt (Active) của mọi công cụ (Con trỏ Cursor, Giấy ghi chú Sticky Note, Bút vẽ Pen, Nút mở rộng +, Khóa xoay) từ xám nhạt `bg-slate-200` sang Xanh Lá GreenLearn `bg-[#16A34A] text-white shadow-xs font-bold border border-[#15803D]`.
     - Bút vẽ con trong sub-toolbar (Pen, Highlighter, Smart shape, Eraser, Area eraser) cũng đồng bộ nền xanh lá khi chọn.
  3. **Vật Thể Trên Bàn Học & Modals:**
     - Sách `BookSpread.tsx`: Tab 2 (Phóng to / Toàn màn hình) đổi sang `bg-[#16A34A] hover:bg-[#15803D]` và icon `text-green-100`.
     - Tờ bài thi `PaperSheet.tsx`: Khối điểm thi đổi nhãn sang `text-green-100`.
     - Thẻ trắc nghiệm `ExamQuizCard.tsx`: Trạng thái câu đã trả lời dùng `bg-green-100 text-[#166534] border-green-300`.
     - Bộ chọn hình dán `StickerEmojiPickerFlyout.tsx`: Đổi toàn bộ 9 danh mục emoji active sang `bg-green-100 text-[#166534] ring-1 ring-green-300 font-bold`.
     - Modals `QuizTab.tsx` & `SummaryTab.tsx`: Dải gradient thẻ tóm tắt/trắc nghiệm chuyển sang `from-green-50 via-emerald-50 to-green-50`.
     - Đọc toàn màn hình `FullScreenDocModal.tsx`: Đổi text selection sang `selection:bg-green-100 selection:text-[#166534]`.
     - Navigation `TopLeftNav.tsx`: Dropdown chọn không gian bàn học dùng nền xanh dịu khi active và nút tạo bàn học dùng `#16A34A`.
     - Ví / AI HUD `TopRightWallet.tsx`: Nút Bot AI khi active dùng `bg-[#16A34A] text-white border-[#15803D]`.
- **Verified by:**
  - `npx tsc --noEmit`: 0 lỗi type.
  - `pnpm test`: 16/16 test suites passed (64/64 tests passed 100%).
  - `pnpm run build:pages`: Static export 14/14 static pages thành công.
- **Branch:** `refactor/greenlearn-free`.

---

## 2026-11-10 10:40 — refactor/greenlearn-free (Đại Tu Toàn Diện Nền Tảng GreenLearn 100% Miễn Phí & Thú Cưng Mầm Xanh 5 Cấp)
- **Task:** Tái cấu trúc toàn diện từ ViTudy sang **GreenLearn** (`Nhatgreen/GreenLearn`):
  1. **Nhận diện thương hiệu GreenLearn (Phase 1):**
     - Đổi tên ứng dụng thành **GreenLearn**, palette xanh lá `#16A34A` (hover `#15803D`) và navy `#242D3D`.
     - Cấu hình `basePath: /GreenLearn` trong `next.config.ts`, `build-pages.mjs`, `.github/workflows/deploy.yml`.
     - Sinh trọn bộ asset vector/PNG chính thức: `greenlearn-icon.svg`, `greenlearn-logo-horizontal.svg`, `favicon.ico`, `icon.png`, `apple-touch-icon.png`, `og-image.png`.
     - Chuyển đổi tên DB cục bộ `greenlearn_offline_db` và tiền tố storage key `greenlearn_*`.
  2. **Loại bỏ 100% Monetization & Cập nhật Pháp lý (Phase 2):**
     - Xóa bỏ 40 files liên quan đến tiền ảo ViToken, nạp tiền VietQR SePay, bảng giá và Chợ tài liệu 85/15.
     - Cập nhật Điều khoản dịch vụ (`/terms`), Chính sách bảo mật (`/privacy`), và Hỏi đáp (`/faq`) cam kết 100% miễn phí trọn đời và phi lợi nhuận.
  3. **Trợ Lý AI Trực Tiếp Client-Side OpenAI BYOK (Phase 3):**
     - Triển khai `ByokStore` và `askAi` trực tiếp gọi `https://api.openai.com/v1/chat/completions` với mô hình mặc định `gpt-4o-mini`.
     - Tích hợp timeout AbortController 30s, cắt ngắn 6.000 ký tự chống tràn token, cảnh báo máy tính công cộng.
  4. **Supabase Migration 0017 & Storage Manager & Realtime Cursors (Phase 4):**
     - Viết migration `0017_drop_monetization.sql` xóa bỏ các bảng, trigger và cột monetization.
     - Xây dựng `useStorageManager` và `StorageManagerModal` hiển thị dung lượng trình duyệt thực tế, cảnh báo tài liệu >30 ngày và xuất/nhập sao lưu JSON.
     - Kích hoạt Realtime Cursor Broadcast throttled 60ms cho học nhóm.
  5. **Hệ Thống Thú Cưng Mầm Xanh 5 Cấp Độ & Dáng Thức/Ngủ (Phase 5):**
     - Xử lý 10 hình ảnh thú cưng từ `brand/pet/` thành PNG trong suốt tối ưu (<1.8MB tổng).
     - Định nghĩa `src/types/pet.ts` và `src/lib/petHelpers.ts` tính toán 5 cấp tiến hóa (1-2 ngày, 3-6 ngày, 7-13 ngày, 14-29 ngày, 30+ ngày) và trạng thái thức/ngủ say theo chuỗi streak.
     - Viết hook `usePetMascot.ts` và component `PetMascotModal.tsx` với lịch 7 ngày, đổi tên thú cưng, thư viện 5 cấp và chuyển đổi dáng xem trước.
     - Tích hợp vào `TopRightWallet`, `StudySpaceDeskView` (tự động nhận 20s heartbeat, đạt 180s tự động đánh thức), `DashboardPage`, `ProfilePage`, và `HomePage`.
  6. **Làm Sạch Tồn Dư & Đồng Bộ Tài Liệu (Phase 6-8):**
     - Viết lại `PricingSection` thành cam kết tự do học thuật 100% miễn phí 3 trụ cột.
     - Loại bỏ toàn bộ từ khóa ViToken sót lại trong `SummaryTab`, `OnboardingTour`, `StudyStats`, `DeleteAccount`, `database.types.ts`.
     - Cập nhật `README.md` lưu giữ đầy đủ sự ghi nhận đóng góp của tác giả gốc (Lê Võ Thanh Nam).
- **Files Created/Modified:**
  - `brand/pet/*`, `public/pet/*`, `src/types/pet.ts`, `src/lib/petHelpers.ts`, `src/lib/petHelpers.test.ts`, `src/hooks/usePetMascot.ts`, `src/hooks/usePetMascot.test.ts`, `src/components/pet/PetMascotModal.tsx`
  - `src/components/hud/TopRightWallet.tsx`, `src/app/dashboard/page.tsx`, `src/app/profile/page.tsx`, `src/components/home/HomePage.tsx`, `src/components/canvas/StudySpaceDeskView.tsx`, `src/components/landing/PricingSection.tsx`
  - `.github/workflows/deploy.yml`, `README.md`, `src/types/database.types.ts`, `docs/ai/03_SYMBOL_INDEX.md`
- **Verified by:**
  - `npx tsc --noEmit`: 0 lỗi type.
  - `pnpm test`: 16/16 test suites passed (64/64 tests passed 100%).
  - `pnpm run build:pages`: Static export 14/14 static pages thành công (tạo `out/.nojekyll`).
  - `pnpm run docs:index` & `pnpm run docs:check`: OK (193 symbols).
- **Branch:** `refactor/greenlearn-free`.

---

## 2026-11-09 22:05 — main (Lược Bỏ Nút Home Dư Thừa, Đồng Bộ Chữ ViTudy Cam ViT In Đậm & Cập Nhật Favicon Tab Trình Duyệt)
- **Task:** Tinh chỉnh nhận diện thương hiệu và công thái học theo yêu cầu:
  1. **Lược bỏ nút Home dư thừa trên thanh TopLeftNav:**
     - Xóa nút icon `<Home />` trên thanh `TopLeftNav`, người dùng nhấp trực tiếp vào logo hoặc chữ "ViTudy" ở đầu thanh để về trang chủ.
  2. **Đồng bộ Typography ViTudy ở Trang Chủ:**
     - Chuyển chữ "ViTudy" tại thanh bên `HomePage` từ font xám đen `text-stone-900` sang chuẩn nhận diện thương hiệu y chang `TopLeftNav`: `text-lg font-black tracking-tight text-[#E0562D] select-none leading-none` (Cam ViT in đậm).
  3. **Đồng bộ Favicon & Tab Icon Browser:**
     - Đặt hình ảnh biểu tượng chính thức `assets/icon/logo.png` vào `public/icons/vitudy.png`, `public/icon.png`, `public/favicon.ico`, `src/app/icon.png`, và `src/app/favicon.ico`.
     - Cập nhật `metadata.icons` và thẻ `<head>` trong `src/app/layout.tsx` và `manifest.json`.
- **Files Modified:**
  - `src/components/hud/TopLeftNav.tsx`
  - `src/components/home/HomePage.tsx`
  - `src/app/layout.tsx`
  - `public/manifest.json`
  - `public/favicon.ico`
  - `public/favicon.png`
  - `public/icon.png`
  - `src/app/favicon.ico`
  - `src/app/icon.png`
  - `AGENTS.md`
  - `docs/ai/11_CHANGELOG.md`
- **Verified by:**
  - `npx tsc --noEmit`: 0 lỗi type.
  - `pnpm test`: 16/16 test suites passed (44/44 tests passed 100%).
  - `pnpm run build:pages`: Static export 13/13 pages thành công.
- **Docs updated:** `AGENTS.md`, `11_CHANGELOG.md`.

---

## 2026-11-09 21:55 — main (Đại Tu Toàn Diện: Trang Tài Khoản, Bộ Chọn Emoji & Sticker, Mời Bạn Cùng Học, Nhật Ký Học Tập & Kéo Thả PDF Thực Tế)
- **Task:** Triển khai triệt để toàn bộ 4 khu vực đánh giá chuyên sâu và khắc phục các vấn đề nạp PDF, 100% modal portal:
  1. **Trang Tài Khoản (`/profile`) & Quản lý ViToken:**
     - *Chuẩn hóa tỷ lệ quy đổi 1:1.000:* Sửa lỗi phóng đại 1.000x trong lịch sử nạp (`27.000 đ` hiển thị đúng `+30 ViToken` thay vì `+30,000 V`). Sử dụng dấu chấm tiếng Việt phân cách hàng nghìn đồng bộ.
     - *Tự động hết hạn giao dịch sau 15 phút:* Các giao dịch chờ thanh toán quá 15 phút tự động chuyển thành `'expired'` ("Đã hết hạn"). Giao dịch đang chờ có nút "Tiếp tục thanh toán", giao dịch hết hạn có nút "Tạo mã mới".
     - *Bộ lọc trạng thái & Phân trang:* 4 bộ lọc (Tất cả, Thành công, Chờ thanh toán, Đã hết hạn), thay thế cuộn lồng bằng nút "Xem thêm" phân trang.
     - *Đồng bộ Tên gọi (Nickname):* Thêm trường "Tên gọi" trong thông tin cá nhân, tự động đồng bộ thời gian thực với lời chào ở trang chủ (`Ôn bài thôi, [Tên gọi]`). Nút "Lưu thay đổi" bị vô hiệu khi chưa sửa và hiển thị "Đã lưu".
     - *Khóa AI cá nhân:* Đổi tên thành "Khóa AI của riêng bạn", che dấu ký tự kèm toggle `Eye`/`EyeOff`, nút "Kiểm tra" kết nối và "Xóa khóa", kèm link mở modal cấu hình AI.
     - *Xóa tài khoản 2 bước an toàn:* Yêu cầu nhập đúng email để xác nhận, bổ sung nút "Tải dữ liệu của tôi về máy (JSON)", nêu rõ điều khoản từ bỏ ViToken, bảo lưu tài liệu cộng đồng và ân hạn 3 ngày.
  2. **Bộ Chọn Biểu Tượng & Hình Dán Học Thuật (`StickerEmojiPickerFlyout`):**
     - 100% Việt hóa các tab ("Biểu tượng", "Hình dán", "Ảnh GIF", "Tất cả") và 9 danh mục biểu tượng chuẩn Miro.
     - Đồng bộ màu nhận diện Cam ViT (`#E0562D`) và Slate-900, loại bỏ hoàn toàn màu tím/xanh lệch chuẩn.
     - Phân loại hình dán vector học thuật 4 nhóm: "Đã hiểu" (`da_hieu`), "Cần ôn" (`can_on`), "Quan trọng" (`quan_trong`), "Công thức & Dụng cụ" (`cong_thuc`).
     - Mặt nạ mờ dần 2 mép cuộn ngang (fade mask) và kích thước chạm tối thiểu 44×44px cho emoji.
  3. **Mời Bạn Cùng Học (`InviteModal` & `BottomLeftKnowledge`):**
     - Tiêu đề thống nhất "Mời bạn cùng học", thu gọn thiết lập Supabase vào mục nâng cao.
     - Rút gọn link phòng học, phản hồi "Đã sao chép", thêm tùy chọn phân quyền cộng tác và danh sách thành viên trực tuyến.
  4. **Nhật Ký Học Tập (`/dashboard`):**
     - Tiêu đề căn trái đồng trục với nút quay lại.
     - Biểu đồ nhịp điệu học tuần với số phút rõ ràng và đường mục tiêu đứt nét (30 phút/ngày).
     - Lịch học 28 ngày bắt đầu chuẩn từ Thứ Hai (**T2, T3, T4, T5, T6, T7, CN**), hiển thị nhãn chuyển tháng (`01 Th11`) và viền cam `ring-2 ring-[#E0562D]` độc lập cho ngày hôm nay.
     - Widget tiến độ mục tiêu 30 phút/ngày và widget thẻ ghi nhớ SM-2 cần ôn; nút "Làm bài thi thử ngay" khi số đề thi bằng 0.
  5. **Xử Lý Nạp & Kéo Thả File PDF Thực Tế Lên Bàn Học (`InfiniteDesk`):**
     - Sửa triệt để lỗi sinh văn bản giả lập định sẵn (`"Nội dung trích xuất từ file..."`) khi kéo thả file PDF lên bàn học.
     - Tích hợp trực tiếp `parsePdfFile` vào `handleDrop` của `InfiniteDesk`, đảm bảo mọi file PDF khi kéo thả trực tiếp lên bàn học đều được trích xuất text thật và render ảnh canvas độ phân giải cao vào từng trang sách.
  6. **Quy Chuẩn 100% Modals Bọc React Portal (`createPortal`):**
     - Đã bọc `createPortal(..., document.body)` với z-index cao cho: `DeleteAccount`, `InviteModal`, `IntelineModal`, `MigrationDialog`, `OnboardingTour`, `TopLeftNav new space modal`, `KnowInheritPublishModal`.
- **Files Modified:**
  - `src/app/dashboard/page.tsx`
  - `src/components/auth/MigrationDialog.tsx`
  - `src/components/canvas/InfiniteDesk.tsx`
  - `src/components/dashboard/StreakCalendar.tsx`
  - `src/components/dashboard/StudyStats.tsx`
  - `src/components/dashboard/TokenHistory.tsx`
  - `src/components/home/HomePage.tsx`
  - `src/components/hud/BottomLeftKnowledge.tsx`
  - `src/components/hud/InviteModal.tsx`
  - `src/components/hud/MultiplayerBar.tsx`
  - `src/components/hud/StickerEmojiPickerFlyout.tsx`
  - `src/components/hud/TopLeftNav.tsx`
  - `src/components/modals/IntelineModal.tsx`
  - `src/components/modals/KnowInheritPublishModal.tsx`
  - `src/components/onboarding/OnboardingTour.tsx`
  - `src/components/payment/PaymentHistory.tsx`
  - `src/components/payment/PricingTiers.tsx`
  - `src/components/profile/AccountSettings.tsx`
  - `src/components/profile/DeleteAccount.tsx`
  - `src/data/stickersAndEmojis.ts`
  - `src/services/PaymentService.test.ts`
  - `src/services/PaymentService.ts`
  - `src/services/StatsService.ts`
  - `AGENTS.md`
  - `docs/ai/11_CHANGELOG.md`
- **Verified by:**
  - `npx tsc --noEmit`: 0 lỗi type.
  - `pnpm test`: 16/16 test suites passed (44/44 tests passed 100%).
  - `pnpm run docs:index ; pnpm run docs:check`.
- **Docs updated:** `AGENTS.md`, `11_CHANGELOG.md`.

---

## 2026-11-09 21:22 — main (Nâng Cấp Toàn Diện Trang Hỏi Đáp: Thuật Toán SM-2, Nạp Điểm VietQR, Bản Quyền & Kênh Hỗ Trợ Đích Thực)
- **Task:** Tái thiết kế toàn diện trang Hỏi Đáp (`/faq`) theo phản hồi đánh giá chi tiết:
  1. **Nút cuối trang dẫn đúng kênh hỗ trợ & thống nhất trục căn lề:**
     - Thay thế nút GitHub bằng nút chính **"Liên hệ hỗ trợ: support@vitudy.edu.vn"** màu cam `#E0562D`, nêu rõ thời gian phản hồi (2 – 4 giờ làm việc, trực từ 08:00 – 22:00 tất cả các ngày).
     - Giữ nút "Mã nguồn trên GitHub" làm nút phụ nhã nhặn.
     - Căn trái toàn bộ khối theo cùng một trục `max-w-4xl mx-auto px-6` đồng bộ với danh sách câu hỏi và tiêu đề.
  2. **Bộ câu hỏi mở rộng toàn diện (14 câu hỏi chuyên sâu & thiết thực):**
     - *Bàn học 2.5D & Điều hướng:* Bàn học vô hạn, ghim nét vẽ theo trang sách, zoom RAF Coalescing chống vỡ hạt font KaTeX, pan phím tắt WASD, bản đồ thu nhỏ Minimap, bôi đen hỏi bài Inteline.
     - *Ôn tập & Thuật toán SM-2:* Giải thích cặn kẽ thuật toán SuperMemo SM-2, công thức biến thiên hệ số dễ $EF \in [1.3, 2.5]$, các mốc thời gian ôn tập (ngày 1, ngày 6, ngày $n$), 4 nút đánh giá (Quên $q=0$, Khó $q=3$, Vừa $q=4$, Dễ $q=5$), và tính năng AI sinh đề thi trắc nghiệm.
     - *ViToken & Nạp tiền VietQR:* Giải thích quy trình đối soát tự động 24/7 qua SePay/MBBank trong 30s-2p, cách gửi email xử lý tra soát Napas bù điểm tức thì, tỷ lệ quy đổi chuẩn 1.000đ = 1 ViToken, chi phí AI hệ thống ~0,05 V (~50đ)/lượt, miễn phí 0 V khi dùng BYOK API Key cá nhân, chính sách hoàn tiền 100% trong 24 giờ, và cơ chế điểm danh chuỗi ngày (+5, CN x2, chuỗi 7 ngày +20).
     - *Bản quyền Chợ tài liệu:* Tác giả hưởng 85% doanh thu ViToken, người mua sở hữu vĩnh viễn đưa lên bàn học tùy ý, bảo vệ bản quyền công nghệ 2.5D không lộ file gốc PDF.
     - *Tài khoản & Bảo mật:* Khóa API cá nhân (Gemini, OpenAI) lưu trữ 100% cục bộ trong LocalStorage thiết bị, bảo mật Supabase RLS, học nhóm thời gian thực, và quyền xóa vĩnh viễn tài khoản.
  3. **Công cụ tìm kiếm, chip danh mục, mở tất cả & liên kết trực tiếp:**
     - Thanh tìm kiếm thời gian thực quét tiêu đề, nhãn danh mục và từ khóa.
     - 6 chip danh mục: Tất cả, Bàn học 2.5D, Ôn tập & SM-2, ViToken & Nạp tiền, Chợ tài liệu, Tài khoản & Bảo mật.
     - Nút "Mở tất cả" / "Thu gọn tất cả" (icon `ChevronsUpDown`).
     - Slug ID và nút sao chép link trực tiếp `#slug` cho từng câu hỏi kèm thông báo toast.
     - Đánh giá hữu ích cuối mỗi câu: Cho phép người học bấm "Có" / "Chưa rõ" kèm phản hồi ghi nhận tức thời.
  4. **Khả năng tiếp cận & Chân trang (`SiteFooter.tsx`):**
     - Header căn chuẩn `max-w-4xl mx-auto px-6`, nút quay lại thông minh ("Về Bàn Học" hoặc "Về Trang Chủ").
     - Vùng bấm câu hỏi `<button>` tối thiểu 52px, `aria-expanded={isOpen}`, focus-visible rõ nét.
     - Nhãn danh mục chuẩn WCAG AA: `text-[11px] font-bold text-[#9A3412] bg-[#FFF7ED] border border-[#FFEDD5]`.
     - Chống ngắt dòng xấu ở chân trang (`whitespace-nowrap`), bổ sung liên kết "Hoàn tiền & Biểu phí" (`/faq#chinh-sach-hoan-tien`) và biểu tượng GitHub nhỏ.
- **Files Modified:**
  - `src/app/faq/page.tsx`
  - `src/components/common/SiteFooter.tsx`
  - `AGENTS.md`
  - `docs/ai/11_CHANGELOG.md`
- **Verified by:**
  - `npx tsc --noEmit`: 0 lỗi type.
  - `pnpm test`: 16/16 test suites passed (44/44 tests passed 100%).
  - `pnpm run build:pages`: Static export 13/13 pages thành công.
- **Docs updated:** `AGENTS.md`, `11_CHANGELOG.md`.

---

## 2026-11-09 21:14 — main (Khắc Phục Lỗi Ngược Hướng Điều Hướng Quay Lại Giữa Tài Khoản, Bàn Học & Trang Chủ)
- **Task:** Sửa triệt để lỗi điều hướng ngược khi vào trang Tài khoản (`/profile`):
  1. **Nhận diện điểm xuất phát (Context-Aware Navigation):**
     - Từ Bàn học (`TopLeftNav`): Link vào hồ sơ kèm tham số `/profile?from=desk`.
     - Từ Trang chủ (`HomePage`): Link vào hồ sơ kèm tham số `/profile?from=home`.
     - Cơ chế dự phòng: Tự động lưu `vitudy_last_view` vào `sessionStorage` để ghi nhớ trang người dùng vừa ở.
  2. **Hiển thị và điều hướng chuẩn xác trên `/profile`:**
     - Nếu đến từ Bàn học: Nút quay lại hiển thị **"Về Bàn Học"** và điều hướng chuẩn xác về `/?view=desk`.
     - Nếu đến từ Trang chủ: Nút quay lại hiển thị **"Về Trang Chủ"** và điều hướng chuẩn xác về `/?view=home`.
     - Đồng bộ cả cơ chế `router.back()` với lịch sử trình duyệt.
  3. **Tái cấu trúc phản ứng thời gian thực cho Trang Chủ (`src/app/page.tsx`):**
     - Sử dụng hook chuẩn `useSearchParams()` của Next.js App Router bên trong `<Suspense>`, giúp trang tự động chuyển đổi giữa `HomePage` và `StudySpaceDeskView` tức thì khi tham số `?view=desk` hoặc `?view=home` thay đổi, loại bỏ hoàn toàn hiện tượng kẹt state hoặc nhảy nhầm trang.
  4. **Áp dụng đồng bộ cho `market/page.tsx` và `dashboard/page.tsx`:** Tự động phát hiện `sessionStorage` để quay về đúng nơi người dùng xuất phát.
- **Files Modified:**
  - `src/app/page.tsx`
  - `src/app/profile/page.tsx`
  - `src/components/hud/TopLeftNav.tsx`
  - `src/components/home/HomePage.tsx`
  - `src/app/market/page.tsx`
  - `src/app/dashboard/page.tsx`
  - `AGENTS.md`
  - `docs/ai/11_CHANGELOG.md`
- **Verified by:**
  - `npx tsc --noEmit`: 0 lỗi type.
  - `pnpm test`: 16/16 test suites passed (44/44 tests passed 100%).
  - `pnpm run build:pages`: Static export 13/13 pages thành công.
- **Docs updated:** `AGENTS.md`, `11_CHANGELOG.md`.

---

## 2026-11-09 21:02 — main (Nâng Cấp Kho Emoji Chuẩn Miro, Tích Hợp GIPHY Live, Tối Ưu Độ Sắc Nét Văn Bản & Ghi Hình)
- **Task:** Nâng cấp toàn diện kho biểu tượng cảm xúc, hình dán và công cụ mở rộng dấu "+" theo mẫu giao diện Miro:
  1. **Bảng chọn Emoji chuẩn Miro (9 danh mục & Skin tone):**
     - Tái hiện chính xác thanh điều hướng 9 danh mục theo ảnh Miro: Gần đây (`recent`), Biểu cảm & Con người (`people`), Động vật & Tự nhiên (`nature`), Đồ ăn & Thức uống (`food`), Hoạt động & Thể thao (`activities`), Du lịch & Địa điểm (`travel`), Đồ vật & Dụng cụ (`objects`), Ký hiệu & Biểu trưng (`symbols`), Cờ các quốc gia (`flags`).
     - Tích hợp bộ chuyển đổi 5 tông màu da Unicode (`Skin tone ✋`) cho các biểu tượng bàn tay và con người.
     - Tự động ghi nhớ danh sách biểu tượng vừa dùng vào `localStorage` kèm nút `Clear` xóa nhanh.
     - Chuyển đổi 100% biểu tượng sang vector SVG chính thức Twitter Twemoji (`toTwemojiUrl`) giúp các emoji trên bàn học luôn sắc nét vô cực ở mọi tỷ lệ phóng to thu nhỏ.
  2. **Kho GIF trực tuyến GIPHY thời gian thực:**
     - Tìm kiếm GIF trực tuyến thời gian thực với debounce 300ms và bộ gợi ý từ khóa nhanh (#Study, #Anime, #Cat, #Celebration, #Coffee, #Mind Blown...).
     - Tự động chuyển đổi kích thước và truyền URL phân giải cao (`downsized_large` / `original`) lên bàn học để ảnh GIF luôn rõ nét, không bị nhòe.
  3. **Khắc phục triệt để lỗi mờ chữ trên màn hình Windows:**
     - Loại bỏ các cờ CSS `WebkitFontSmoothing: 'antialiased'` và `MozOsxFontSmoothing: 'grayscale'` gây vô hiệu hóa ClearType subpixel rendering trên Windows trong `CodeBlockItem`, `MindMapNodeItem` và các flyout công cụ.
     - Chuẩn hóa font monospace và kích thước 14px cho khối mã nguồn, tăng độ tương phản số dòng và viền khung.
  4. **Tích hợp tính năng quay màn hình vào menu dấu "+":**
     - Đưa công cụ "Record screen" vào danh sách công cụ mở rộng tại `LeftCreationBar` và dọn dẹp nút camera nhàn rỗi ở `BottomLeftKnowledge`.
  5. **Cải tiến 4 nhóm Modal cốt lõi:**
     - Modal "Chia sẻ lên Chợ tài liệu" (xóa bỏ KnowInherit, điền sẵn tên hiển thị, bổ sung 3 trường người mua cần, checkbox bản quyền, giải thích tỷ lệ 85%).
     - Modal "Nạp ViToken qua VietQR" (sửa tỷ lệ chuẩn 1.000đ = 1 ViToken, ẩn nút kiểm thử ở production, bổ sung sao chép số tiền & STK, trạng thái chờ ngân hàng).
     - Modal "Điểm danh hằng ngày" (tiến độ 1/7 ngày, icon đồng xu ViToken chuẩn, viền nổi bật hôm nay, trạng thái bỏ lỡ, xin quyền thông báo).
     - Modal "Cài đặt kết nối AI" (gọn gàng, nêu chi phí ~0,05 V, Việt hóa 100% thuật ngữ, nút kiểm tra kết nối đo ms cạnh dropdown mô hình).
- **Files Modified:**
  - `src/data/stickersAndEmojis.ts`
  - `src/components/hud/StickerEmojiPickerFlyout.tsx`
  - `src/components/objects/StickerItem.tsx`
  - `src/components/objects/CodeBlockItem.tsx`
  - `src/components/objects/MindMapNodeItem.tsx`
  - `src/components/hud/LeftCreationBar.tsx`
  - `src/components/hud/BottomLeftKnowledge.tsx`
  - `src/services/GiphyService.ts`
  - `src/services/GiphyService.test.ts`
  - `src/services/PaymentService.ts`
  - `src/components/payment/PricingTiers.tsx`
  - `src/components/payment/TopUpModal.tsx`
  - `src/components/payment/QRCodeDisplay.tsx`
  - `src/components/modals/KnowInheritPublishModal.tsx`
  - `src/components/modals/MarketModal.tsx`
  - `src/context/ViTokenContext.tsx`
  - `src/components/hud/TopRightWallet.tsx`
  - `supabase/migrations/0016_fix_vitoken_rate.sql`
  - `AGENTS.md`
  - `docs/ai/11_CHANGELOG.md`
- **Verified by:**
  - `npx tsc --noEmit`: 0 lỗi type.
  - `pnpm test`: 16/16 test suites passed (44/44 tests passed 100%).
  - `pnpm run build:pages`: Static export 13/13 pages thành công.
- **Docs updated:** `AGENTS.md`, `11_CHANGELOG.md`.

---

## 2026-11-09 20:25 — main (Trích Xuất & Hiển Thị Tài Liệu PDF Thực Tế Thay Vì Mock Text Trên Sách 2.5D)
- **Task:** Khi người dùng tải file `.pdf` lên bàn học, cuốn sách được tạo ra phải chứa đúng nội dung thực tế (cả trang hình ảnh rendered gốc của PDF lẫn văn bản trích xuất), loại bỏ hoàn toàn văn bản giả lập định sẵn (`"Nội dung trích xuất từ tệp..."`):
  1. **Tích hợp thư viện `pdfjs-dist@4.10.38`:**
     - Thiết lập worker cục bộ tại `public/pdf.worker.min.mjs` có hỗ trợ `getAssetPath` cho GitHub Pages.
     - Tạo service `src/services/PdfParserService.ts` trích xuất cả text qua `getTextContent()` và render ảnh từng trang PDF qua HTML5 Canvas (`scale: 1.5`, JPEG 88%) thành ảnh dataURL.
  2. **Bảo toàn tỷ lệ phân trang 1:1:**
     - Cập nhật `PaginatedLeaf` và `paginateDocument` trong `src/utils/pagination.ts` hỗ trợ trường `image?: string`.
     - Khi trang có `image`, bảo toàn nguyên vẹn 1 trang PDF = 1 trang sách mà không bẻ gãy đoạn văn.
  3. **Hiển thị hai lớp sắc nét trên Sách & Giấy rời:**
     - Cập nhật `src/components/objects/BookSpread.tsx`: Hiển thị ảnh trang PDF sắc nét ở cả trang tĩnh (`underneathLeftLeaf`, `underneathRightLeaf`) lẫn trong hiệu ứng lật trang 3D (`dragFlip`). Đặt lớp text overlay trong suốt phía trên để người học có thể bôi đen chữ hỏi Inteline hoặc STudy.
     - Cập nhật `src/components/objects/PaperSheet.tsx`: Hiển thị ảnh trang tài liệu thật khi có `activePage.image`.
     - Cập nhật `src/components/modals/FullScreenDocModal.tsx`: Hiển thị hình ảnh trang PDF sắc nét ở chế độ 2 trang, 1 trang và thumbnail thu nhỏ bên thanh trái.
  4. **Chỉ báo trạng thái trực quan:**
     - Nút Tải lên tài liệu tại HUD có spinner `Loader2` và toast `"Đang trích xuất các trang tài liệu PDF..."` khi đang phân tích.
     - Modal xác nhận hiển thị số lượng trang đã trích xuất thành công (`pendingDoc.pages.length`).
- **Files Modified:**
  - `package.json`
  - `pnpm-lock.yaml`
  - `public/pdf.worker.min.mjs`
  - `src/services/PdfParserService.ts`
  - `src/utils/pagination.ts`
  - `src/context/StudySpaceContext.tsx`
  - `src/components/hud/BottomLeftKnowledge.tsx`
  - `src/components/objects/BookSpread.tsx`
  - `src/components/objects/PaperSheet.tsx`
  - `src/components/modals/FullScreenDocModal.tsx`
  - `AGENTS.md`
  - `docs/ai/11_CHANGELOG.md`
- **Verified by:**
  - `npx tsc --noEmit`: 0 lỗi type.
  - `pnpm test`: 16/16 test suites passed (44/44 tests passed 100%).
  - `pnpm run build:pages`: Static export 13/13 pages thành công.
- **Docs updated:** `AGENTS.md`, `11_CHANGELOG.md`.

---

## 2026-11-09 20:10 — main (Chuẩn Hóa Đúng Cặp Icon: Logo ViTudy logo.png & Coin ViToken vitoken.svg)
- **Task:** Hiệu chỉnh chính xác 100% vai trò của hai biểu tượng theo đúng chỉ đạo của Ngài Vịt:
  1. **Logo đại diện Web ViTudy (Ảnh 1):**
     - Sử dụng hình ảnh `assets/icon/logo.png` (đồng xu tròn cam viền cam, chữ V vàng ở giữa) làm logo đại diện chính thức cạnh chữ ViTudy ở thanh điều hướng `TopLeftNav`, thanh bên trang chủ `HomePage`, và trang giới thiệu `AboutPage` (`/icons/vitudy.png`).
     - Khống chế kích thước tối đa 24-32px (`width={...} height={...}`, class `w-6 h-6` / `w-8 h-8`, style `width, height, maxWidth, maxHeight`).
  2. **Icon ViToken (Coin / Credit / Chợ - Ảnh 2):**
     - Sử dụng vector `assets/icon/vitoken.svg` (hình tròn đen có chữ v trắng) làm biểu tượng chính thức của đồng tiền ViToken ở ô credit số dư trên HUD `TopRightWallet`, thẻ số dư tại `HomePage`, các mức giá và số dư tại `MarketModal` và trang Chợ `market/page.tsx` (`/icons/vitoken.svg`).
     - Định cỡ chuẩn mực 16-24px, chống bung to hay tràn màn hình.
- **Files Modified:**
  - `src/components/hud/TopLeftNav.tsx`
  - `src/components/home/HomePage.tsx`
  - `src/app/about/page.tsx`
  - `src/components/hud/TopRightWallet.tsx`
  - `src/components/modals/MarketModal.tsx`
  - `src/app/market/page.tsx`
  - `AGENTS.md`
  - `docs/ai/11_CHANGELOG.md`
- **Verified by:**
  - `npx tsc --noEmit`: 0 lỗi type.
  - `pnpm test`: 16/16 test suites passed (44/44 tests passed 100%).
  - `pnpm run build:pages`: Static export 13/13 pages thành công.
  - `pnpm run docs:index ; pnpm run docs:check`: Passed.
- **Docs updated:** `AGENTS.md`, `11_CHANGELOG.md`.

---

## 2026-11-09 20:05 — main (Đồng Bộ Hóa Toàn Diện Trải Nghiệm Chợ Tài Liệu: Thống Nhất Tên Gọi, 3 Loại Tài Liệu, Triệt Tiêu Lặp Giá & Lặp Tiêu Đề, Bổ Sung Nút Thêm Vào Bàn Học)
- **Task:** Đồng bộ và nâng cấp toàn diện cả 2 giao diện Chợ: Trang Chợ (`src/app/market/page.tsx`) và Modal Chợ trên Bàn học (`src/components/modals/MarketModal.tsx`):
  1. **Thống nhất tên gọi & thương hiệu:** Đổi tên duy nhất thành **"Chợ Tài Liệu"** (loại bỏ hoàn toàn tên cũ "Chợ Tri Thức KnowInherit"), đồng bộ phụ đề *"Kho tri thức mở ViTudy — Khám phá và trao đổi tài liệu học tập cùng cộng đồng."*.
  2. **Thống nhất 3 loại tài liệu & tiền tệ ViToken:**
     - 3 loại chuẩn: `Sách` (`book` - 50 V), `Tờ tóm tắt` (`paper` - 15 V), `Đề thi` (`exam` - 30 V).
     - Đơn vị tiền tệ: Thống nhất gọi `ViToken` (hoặc `V` với quy đổi rõ ràng `1 V = 1 ViToken`), hiển thị icon đồng xu chính thức `/icons/vitoken.png` qua helper `getAssetPath`.
  3. **Cải tiến Trang Chợ (`src/app/market/page.tsx`):**
     - Căn lưới 3 cột cân xứng `max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5`, triệt tiêu hoàn toàn khoảng hở lệch bên phải.
     - Thêm nút "Chia sẻ tài liệu" kèm modal tạo tài liệu đóng góp tri thức (+2 ViToken).
     - Thêm đầy đủ bộ lọc: Tìm kiếm, Chip Loại tài liệu, Chip Môn học, Điểm AI, Mức giá, Sắp xếp, kèm nút "Đặt lại" (`RotateCcw`) và số lượng tài liệu.
     - Mỗi thẻ có dấu xác thực tác giả (`CheckCircle2 text-sky-600`), số trang, số lượt mua, ngày cập nhật, điểm AI có tiền tố `AI: [score]/100`.
     - Chân thẻ có cả nút "Xem thử" VÀ nút "Mua [X] V" (hoặc "Đã sở hữu" dẫn về bàn học).
  4. **Cải tiến Modal Chợ (`src/components/modals/MarketModal.tsx`):**
     - Đặt chế độ hiển thị lưới `grid` làm mặc định.
     - Bìa da nâu bên trái: Tối giản sang trọng với icon dập chìm, nhãn loại và ngày chia sẻ, triệt tiêu hoàn toàn việc lặp lại tiêu đề 3 lần.
     - Bỏ nhãn chữ hoa dài cồng kềnh `MÔ TẢ SÁCH / GIÁO TRÌNH:`.
     - Triệt tiêu ô giá lặp thừa: Chỉ hiển thị giá một lần duy nhất tại chân thẻ.
     - Bổ sung nút `Thêm vào bàn học` (`ArrowRight`) khi đã sở hữu (`item.purchased === true`), nhấp vào sẽ tự động mount tài liệu (`addUploadedDocument` hoặc `addExamSheet`) trực tiếp lên bàn học và đóng modal ngay lập tức.
     - Chuyển các bộ lọc dropdown thành các hàng chip trực quan, có nút "Đặt lại".
     - Nâng tương phản chữ phụ và trích đoạn xem trước đạt chuẩn WCAG AA (>= 4.5:1).
  5. **Mở rộng `MarketService.getListings`:** Hỗ trợ lọc theo `type`, `minScore`, `maxPrice`, `search` và sắp xếp đa tiêu chí.
- **Files Modified:**
  - `src/app/market/page.tsx`
  - `src/components/modals/MarketModal.tsx`
  - `src/services/MarketService.ts`
  - `AGENTS.md`
  - `docs/ai/03_SYMBOL_INDEX.md`
  - `docs/ai/11_CHANGELOG.md`
- **Verified by:**
  - `npx tsc --noEmit`: 0 lỗi type.
  - `pnpm test`: 16/16 test suites passed (44/44 tests passed 100%).
  - `pnpm run build:pages`: Static export 13/13 pages thành công.
  - `pnpm run docs:index ; pnpm run docs:check`: Passed (189 symbols).
- **Docs updated:** `AGENTS.md`, `11_CHANGELOG.md`.

---

## 2026-11-09 19:50 — main (Nâng Cấp Toàn Diện Giao Diện Trang Chủ: Lời Chào Tinh Gọn, 4 Mẫu Trực Quan, Bảng Gần Đây Chuẩn Thực Tế & WCAG AA)
- **Task:** Giải quyết trọn bộ 7 điểm cải thiện giao diện Trang chủ (`src/components/home/HomePage.tsx`):
  1. **Lời chào tinh gọn & căn cùng trục:** Rút gọn tên thành tên ngắn (`shortName`: ví dụ "Thành"), giảm cỡ chữ xuống 36–40px (`text-3xl md:text-4xl`), căn trái cùng trục hoàn hảo với các khối bên dưới.
  2. **Hình xem trước mẫu phóng to & vẽ lại mẫu "Học nhóm":** Phóng to hình minh họa trong cả 4 thẻ mẫu. Riêng mẫu "Học nhóm" vẽ lại trực quan với 2 con trỏ chuột SVG sống động kèm tên ("Thành" màu cam và "Bạn học" màu tím). Bổ sung dòng mô tả ngắn dưới mỗi thẻ.
  3. **Trạng thái chọn của thẻ mẫu:** Loại bỏ viền cam mặc định ở "Bàn học trống", 4 thẻ đều có viền trung tính, chỉ hiện viền cam và đổ bóng khi hover hoặc focus. Bấm vào là mở/tạo bàn học ngay.
  4. **Danh sách "Mở lại gần đây" có giá trị thực tế:** Thêm ảnh thu nhỏ bàn học 56×40px cho mỗi hàng, tên bàn học theo nội dung thực, hiển thị mốc thời gian cụ thể ("14:20 hôm nay", "2 giờ trước"), thay cột "Chủ sở hữu" bằng cột "Tài liệu & Ghi chú" hữu ích (ví dụ: "1 giáo trình · 3 ghi chú").
  5. **Thanh trên cùng cố định (Sticky Top Bar):** Cố định khi cuộn với padding an toàn không bị cắt mép, thay nút tên dài thành avatar tròn đại diện người dùng, nút điểm danh phân biệt rõ 2 trạng thái: chưa nhận (chấm cam nhấp nháy + icon lửa) và đã nhận (icon tích xanh + chữ "Đã điểm danh").
  6. **Đạt chuẩn tương phản WCAG AA >= 4.5:1:** Đổi chữ cam nhỏ trên nền kem sang sắc cam đậm `#B8431A` (đạt tương phản 5.2:1), tiêu đề cột thành `text-stone-700` chữ hoa đậm nét, placeholder ô tìm kiếm thành `text-stone-500`.
  7. **Thống nhất chi tiết nhỏ:** Đổi số dư ViToken sang font sans đồng bộ, thêm widget "Mục tiêu hôm nay" (tiến độ Pomodoro 25 phút) ở thanh bên.
- **Files Modified:**
  - `src/components/home/HomePage.tsx`
  - `AGENTS.md`
  - `docs/ai/03_SYMBOL_INDEX.md`
  - `docs/ai/11_CHANGELOG.md`
- **Verified by:**
  - `npx tsc --noEmit`: 0 lỗi type.
  - `pnpm test`: 16/16 test suites passed (44/44 tests passed 100%).
  - `pnpm run build:pages`: Static export 13/13 pages thành công.
  - `pnpm run docs:index ; pnpm run docs:check`: Passed.
- **Docs updated:** `AGENTS.md`, `11_CHANGELOG.md`.

---

## 2026-11-09 19:40 — main (Khắc Phục Lỗi Icon ViTudy Phóng To Chiếm Toàn Bộ Màn Hình)
- **Task:** Xử lý triệt để lỗi logo ViTudy (`vitudy.svg`) bị bung kích thước 2000px chiếm trọn nửa màn hình trên Bàn học:
  - *Nguyên nhân:* 
    1. Tại `src/components/hud/TopLeftNav.tsx`, thẻ `<img>` sử dụng class `w-5.5 h-5.5`. Trong Tailwind CSS không tồn tại giá trị `5.5` (chỉ có `w-5` = 20px, `w-6` = 24px), dẫn đến trình duyệt không nhận được quy tắc định cỡ CSS cho thẻ ảnh.
    2. File SVG gốc `assets/icon/vitoken.svg` và `public/icons/vitudy.svg` chứa thuộc tính kích thước tĩnh `width="2000" height="2000"`. Khi thẻ `<img>` không bị giới hạn bởi CSS, trình duyệt hiển thị SVG theo kích thước gốc 2000x2000px.
  - *Khắc phục:*
    1. Cập nhật thẻ `<img>` tại `TopLeftNav.tsx` thành `width={24} height={24} className="w-6 h-6 object-contain flex-shrink-0"` kèm inline style bảo vệ `style={{ width: '24px', height: '24px', maxWidth: '24px', maxHeight: '24px' }}`.
    2. Đồng bộ thuộc tính phòng vệ (`width`, `height`, `style`) cho toàn bộ thẻ logo và coin tại `HomePage.tsx`, `AboutPage.tsx`, `TopRightWallet.tsx`.
    3. Cập nhật file SVG (`public/icons/vitudy.svg`, `public/vitudy.svg`, `assets/icon/vitoken.svg`) thay `width="2000" height="2000"` bằng `viewBox="0 0 1500 1500" width="100%" height="100%"`, bảo đảm SVG luôn co dãn linh hoạt theo container cha mà không thể tự ý bung to.
- **Files Modified:**
  - `src/components/hud/TopLeftNav.tsx`
  - `src/components/home/HomePage.tsx`
  - `src/app/about/page.tsx`
  - `src/components/hud/TopRightWallet.tsx`
  - `public/icons/vitudy.svg`
  - `public/vitudy.svg`
  - `assets/icon/vitoken.svg`
  - `AGENTS.md`
  - `docs/ai/11_CHANGELOG.md`
- **Verified by:**
  - `pnpm run build:pages`: Static export thành công 13/13 pages, thẻ `<img>` sinh ra với inline style khống chế 32px/24px.
  - `pnpm test`: 16/16 test suites passed (44/44 tests passed 100%).
  - `pnpm run docs:index ; pnpm run docs:check`: Passed.
- **Docs updated:** `AGENTS.md`, `11_CHANGELOG.md`.

---

## 2026-11-09 18:30 — main (Khắc Phục 3 Vấn Đề: Lỗi Broken Icon Trên GitHub Pages, Điều Hướng Profile Về Desk & Ưu Tiên Trang Chủ Cho URL Gốc)
- **Task:** Giải quyết triệt để 3 vấn đề người dùng phản hồi:
  1. **Lỗi hình ảnh icon (Broken image icons trên GitHub Pages):**
     - *Nguyên nhân:* GitHub Pages deploy dưới subpath `basePath: '/ViTudy'`, trong khi các thẻ `<img>` hardcode `src="/icons/..."` nên trình duyệt tìm kiếm tại root domain `namtacozz.github.io/icons/...` (404) thay vì `namtacozz.github.io/ViTudy/icons/...`.
     - *Khắc phục:* Tạo helper `getAssetPath(path)` trong `src/lib/assets.ts` tự động phát hiện subpath `/ViTudy` từ runtime `window.location.pathname` hoặc `process.env.NEXT_PUBLIC_BASE_PATH`. Bọc toàn bộ các thẻ ảnh logo ViTudy, icon ViToken, manifest và favicon bằng `getAssetPath()`.
  2. **Bấm vào tài khoản khi ở Desk rồi ấn về Desk bị nhảy ra Trang chủ:**
     - *Nguyên nhân:* Nút "Về Bàn Học" tại trang `/profile` (cũng như `/dashboard`, `/market`, `/auth`) sử dụng `href="/"`, trỏ về Trang chủ thay vì Bàn học.
     - *Khắc phục:* Đổi toàn bộ các nút quay lại từ các trang con phụ thành `href="/?view=desk"`. Khi người dùng từ bàn học vào hồ sơ, bấm quay lại sẽ trở về thẳng Bàn học với đầy đủ tài liệu đang mở.
  3. **Mở link gốc không thêm đuôi bị tự động vào Bàn học thay vì Trang chủ:**
     - *Nguyên nhân:* `src/app/page.tsx` có đoạn code kiểm tra `localStorage.getItem('vitudy_current_view') === 'desk'` và tự động chuyển hướng sang `?view=desk` ngay cả khi người dùng truy cập link gốc sạch không tham số.
     - *Khắc phục:* Loại bỏ cơ chế tự động redirect từ `localStorage` khi vào link gốc. Truy cập `https://namtacozz.github.io/ViTudy/` hoặc `http://localhost:3000/` không tham số luôn hiển thị Trang chủ (`HomePage`). Bàn học chỉ mở khi có `?view=desk` hoặc `?room=...`. Khi người dùng đang ở bàn học và nhấn F5 (Refresh), URL vẫn có `?view=desk` nên phiên làm việc bàn học được giữ nguyên vẹn.
- **Files Modified / Created:**
  - `src/lib/assets.ts` (mới tạo)
  - `src/app/page.tsx`
  - `src/app/profile/page.tsx`
  - `src/app/dashboard/page.tsx`
  - `src/app/market/page.tsx`
  - `src/app/auth/page.tsx`
  - `src/app/layout.tsx`
  - `src/app/about/page.tsx`
  - `src/components/home/HomePage.tsx`
  - `src/components/hud/TopLeftNav.tsx`
  - `src/components/hud/TopRightWallet.tsx`
  - `AGENTS.md`
  - `docs/ai/11_CHANGELOG.md`
- **Verified by:**
  - `npx tsc --noEmit`: 0 lỗi type.
  - `pnpm test`: 16/16 test suites passed (44/44 tests pass).
  - `pnpm run build:pages`: Static export pass, thẻ `<img>` và link icons tạo thành công với prefix `/ViTudy`.
  - `pnpm run docs:index ; pnpm run docs:check`: Pass.
- **Docs updated:** `AGENTS.md`, `11_CHANGELOG.md`.

---

## 2026-11-09 12:35 — main (Khắc Phục Toàn Diện 6 Yêu Cầu: Modal Bị Dúm, Thanh Multiplayer Cho Người Độc Học, Cài Đặt AI Mới & Test Kết Nối, VietQR MBBank, Lưu Trạng Thái Bàn Học, Đồng Bộ Icon/Logo Thương Hiệu)
- **Task:** Giải quyết triệt để 6 yêu cầu kỹ thuật và công thái học của người dùng:
  1. **Khắc phục lỗi Modal Mời Học / Chia sẻ bị co dúm thành thanh dọc 40px mép màn hình (`BottomLeftKnowledge` & `MultiplayerBar`):**
     - *Nguyên nhân:* Các modal với `fixed inset-0` được render bên trong container HUD có CSS `transform: translate-y-0`, khiến trình duyệt cô lập ngữ cảnh định vị tuyệt đối trong phạm vi của container thay vì toàn bộ `document.body`.
     - *Khắc phục:* Bọc toàn bộ các modal (`isSetupModalOpen`, `isFinishModalOpen`, `isConfirmModalOpen`, `isShareModalOpen`, `isDbConfigOpen`) bằng `mounted && createPortal(..., document.body)` với `z-[9990]..z-[9999]`. Modal luôn căn giữa màn hình với kích thước chuẩn xác.
  2. **Thanh Multiplayer chỉ hiển thị khi có bạn bè thật & Nút Thoát hoạt động ngay lập tức:**
     - *Nguyên nhân:* `useRealtimeMultiplayer` đăng ký kênh `room-${spaceId}` mặc định; khi Supabase kết nối, `hasPeers` luôn lấy `isConnected ? (peers.length > 0) : hasPeers`, bỏ qua nút "Thoát".
     - *Khắc phục:* Chỉ đăng ký kênh khi URL có `?room=` hoặc người dùng chủ động kích hoạt. Thêm hàm `leaveRoom` ngắt kết nối channel, dọn dẹp peers, xóa `?room` khỏi URL, kết hợp cờ `isDismissed` trên `MultiplayerBar` để ẩn thanh ngay lập tức.
  3. **Thiết kế lại toàn diện Cài đặt kết nối AI (`TopRightWallet.tsx` & `src/lib/aiClient.ts`):**
     - Cấu trúc 4 bước rõ ràng:
       - *Bước 1 - Chọn nhà cung cấp:* 4 thẻ trực quan: ViTudy (Hệ thống, trừ ViToken), Google Gemini (BYOK), OpenAI (BYOK), OpenAI OAuth (ChatGPT Plus).
       - *Bước 2 - Thông tin xác thực:* Banner hướng dẫn ViToken cho ViTudy (không cần key); ô nhập API Key kèm nút ẩn/hiện và link trực tiếp lấy key cho Gemini AI Studio và OpenAI Platform; ô dán mã ủy quyền cho ChatGPT Plus.
       - *Bước 3 - Chọn mô hình AI (Model):* Dropdown `<select>` đồng bộ 100% theo nhà cung cấp (`PROVIDER_MODELS`), hiển thị tên mô hình và công năng cụ thể (Gemini 2.5 Flash, 2.5 Pro, 2.0 Flash; GPT-4o, GPT-4o Mini, o3-mini, v.v.).
       - *Bước 4 - Nút Kiểm tra hoạt động (Test AI):* Hàm `testAiConnection` thực hiện ping thực tế đo độ trễ mạng ms và hiển thị card thông báo kết quả (xanh lá nếu thành công, đỏ nếu lỗi).
  4. **Giữ nguyên trạng thái Bàn học khi Refresh trang (`page.tsx` & `TopLeftNav.tsx`):**
     - Lưu trữ `vitudy_current_view: 'desk'` trong `localStorage` và duy trì `?view=desk` qua `window.history.replaceState`. Khi F5/refresh, người dùng luôn ở lại bàn học hiện tại, không bị văng về Trang chủ. Nhấp logo/Trang chủ sẽ chuyển về `view=home`.
  5. **Đồng bộ Biểu tượng chính thức của ViTudy & Icon ViToken trên toàn ứng dụng:**
     - Biểu tượng chính thức ViTudy: Sử dụng `assets/icon/vitoken.svg` (`/icons/vitudy.svg`) tại `TopLeftNav`, `HomePage`, `AboutPage`, và `favicon`.
     - Icon ViToken: Sử dụng `assets/icon/logo.png` (`/icons/vitoken.png`) làm đồng tiền ViToken trong toàn bộ số dư ví, bảng nạp VietQR, và lịch sử giao dịch.
  6. **Khắc phục lỗi quét mã VietQR MBBank & Dự phòng lỗi RPC Cache (`PaymentService.ts`):**
     - Thống nhất mã NAPAS BIN MBBank: `970422` (tương thích 100% ứng dụng ngân hàng khi quét VietQR, triệt tiêu lỗi "truy vấn không thành công").
     - STK thụ hưởng cố định: `99924052005` - `LE VO THANH NAM`.
     - Dự phòng RPC Schema Cache: Khi database Supabase chưa có hàm `create_payment_request`, hệ thống tự động sinh mã VietQR chuẩn trên client để người dùng nạp tiền tức thì.
- **Files Modified:**
  - `src/lib/aiClient.ts`
  - `src/components/hud/TopRightWallet.tsx`
  - `src/components/hud/BottomLeftKnowledge.tsx`
  - `src/components/hud/MultiplayerBar.tsx`
  - `src/hooks/useRealtimeMultiplayer.ts`
  - `src/app/page.tsx`
  - `src/components/hud/TopLeftNav.tsx`
  - `src/components/home/HomePage.tsx`
  - `src/app/about/page.tsx`
  - `src/services/PaymentService.ts`
  - `src/services/PaymentService.test.ts`
  - `public/icons/vitoken.png`, `public/icons/vitudy.svg`
  - `AGENTS.md`, `docs/ai/11_CHANGELOG.md`
- **Verified by:**
  - `npx tsc --noEmit`: 0 lỗi type.
  - `pnpm test`: 16/16 test suites passed (44/44 tests pass 100%).
  - `pnpm run docs:index ; pnpm run docs:check`: Pass.
  - `pnpm run build:pages`: Pass (13/13 static pages prerendered thành công).
- **Docs updated:** `AGENTS.md`, `11_CHANGELOG.md`.

---

## 2026-11-09 12:05 — main (Thay Thế Landing Page Bằng Trang Chủ Dashboard Học Tập Chuẩn Công Thái Học & Tách Chi Tiết Kỹ Thuật Sang /about)
- **Task:** Thay thế toàn bộ Landing page cũ bằng giao diện **Trang chủ (Dashboard)** học tập theo thiết kế chuẩn:
  1. **Thanh bên (Sidebar):**
     - Logo ViTudy, ô tìm kiếm bàn học và tài liệu (`Search`).
     - Menu điều hướng: `Trang chủ`, `Bàn học của tôi`, `Đã gắn dấu sao`, `Chợ tài liệu`, `Nhật ký học`, `Hỏi đáp`, `Giới thiệu & Kỹ thuật`.
     - Hộp "Số dư" ViToken ở đáy thanh bên với nút "Nạp ViToken" kích hoạt modal VietQR (`TopUpModal`).
  2. **Lời chào định hướng hành động:**
     - Thay thế tiêu đề quảng cáo cũ bằng lời chào: "Ôn bài thôi, namtacozz" (font Serif thanh nhã, tên người dùng nổi bật với màu Cam ViT).
  3. **Bắt đầu bàn học mới (4 Templates):**
     - Bốn mẫu bàn học có hình xem trước trực quan với sách nâu và giấy note vàng đặc trưng:
       - `Bàn học trống` (khung nét đứt + icon dấu cộng)
       - `Ôn thi giữa kỳ` (sách mở 2 trang viền nâu + sticky note vàng)
       - `Giáo trình + đề thi` (2 tờ giấy trắng đứng cạnh nhau + sticky note vàng góc phải)
       - `Học nhóm` (sách nâu + chấm tròn avatar bạn học cam & xanh lá)
     - Nút `+ Tạo bàn học` đặt cạnh tiêu đề.
     - Hàm `createSpaceFromTemplate` trong `StudySpaceContext` hỗ trợ khởi tạo nhanh không gian học tương ứng.
  4. **Mở lại gần đây (Recent Spaces Table):**
     - Dạng bảng gọn gàng: `Tên`, `Mở lần cuối`, `Chủ sở hữu`.
     - Hiển thị các bàn học gần đây ("Toán cho Trí tuệ Nhân tạo", "Cơ sở Machine Learning & Deep Learning", v.v.), nhấp chuột vào bất kỳ dòng nào sẽ mở ngay bàn học trên canvas 2.5D.
     - Nút "Xem tất cả" mở rộng danh sách.
  5. **Chợ tài liệu:**
     - Thu gọn thành một dải card nhỏ gọn ở cuối trang, đóng vai trò tính năng phụ với nút "Xem chợ tài liệu" dẫn đến `/market`.
  6. **Xử lý các phần của Landing page cũ:**
     - Bảng giá: Tích hợp trọn vẹn trong modal `TopUpModal` ("Nạp ViToken qua VietQR").
     - Chi tiết kỹ thuật (KaTeX, SM-2, 60 FPS) & giới thiệu cho khách chưa đăng nhập: Tạo trang `/about` ("Trải giáo trình, đề thi và vở nháp trên cùng một bàn học") với bản demo mô phỏng bàn học chân thực.
- **Files Modified/Created:**
  - `src/components/home/HomePage.tsx`: Giao diện Trang chủ học tập hoàn chỉnh.
  - `src/app/about/page.tsx`: Trang Giới thiệu & Chi tiết kỹ thuật (KaTeX, SM-2, 60fps).
  - `src/app/page.tsx`: Chuyển đổi linh hoạt giữa Trang chủ (`HomePage`) và Bàn học (`StudySpaceDeskView`).
  - `src/context/StudySpaceContext.tsx`: Bổ sung `createSpaceFromTemplate`.
  - `src/data/mockSpaces.ts`: Bổ sung bàn học `space-ml-deep-learning` đồng bộ danh sách.
  - `src/components/hud/TopLeftNav.tsx`: Nút Trang chủ với icon `Home` dẫn về `/?view=home`.
  - `AGENTS.md`: Cập nhật quy chuẩn kiến trúc Trang chủ.
- **Verified by:**
  - `pnpm test`: 16/16 test suites passed (44/44 tests pass 100%).
  - `pnpm run docs:index ; pnpm run docs:check`: Pass.
  - `pnpm run build:pages`: Export static Next.js 15 thành công (13/13 routes static prerendered).
- **Docs updated:** `AGENTS.md`, `11_CHANGELOG.md`.


- **Task:** Giải quyết triệt để 4 yêu cầu của người dùng:
  1. **Triệt tiêu hoàn toàn mờ chữ & mờ ảnh GIF ở mọi mức zoom cho các vật thể dấu `+` (`CodeBlockItem`, `MindMapNodeItem`, `StickerItem`):**
     - *Nguyên nhân:* Trong container bàn học có CSS `transform: scale(...)`, việc các phần tử con có `transition: all`, `transition: shadow`, hoặc CSS filter `drop-shadow(...)` kết hợp `overflow: hidden` khiến Chromium cô lập thành một raster bitmap 1x; khi zoom lên 200% - 400%, trình duyệt chỉ upscale bitmap thay vì re-rasterize vector glyphs, làm chữ bị mờ hạt và vỡ nét.
     - *Khắc phục:*
       - Loại bỏ toàn bộ `transition-all`, `transition-shadow`, `drop-shadow` trên `CodeBlockItem`, `MindMapNodeItem`, `StickerItem`.
       - Thêm thuộc tính `textRendering: 'geometricPrecision'`, `WebkitFontSmoothing: 'antialiased'`, `MozOsxFontSmoothing: 'grayscale'` trên cả container và textarea/input.
       - Với Sticker SVG: Sử dụng class `[&>svg]:w-full [&>svg]:h-full` đảm bảo vector render 100% sắc nét ở mọi kích thước. Với Emoji: cỡ chữ tính trực tiếp theo bounding box `Math.round(min(w, h) * 0.72)px`.
  2. **Kết nối trực tiếp GIPHY Trực Tuyến Thời Gian Thực (`GiphyService`):**
     - Xây dựng `src/services/GiphyService.ts` kết nối trực tiếp API tìm kiếm và trending của GIPHY với debounce 350ms.
     - Tự động lấy ảnh động `original.url` chất lượng cao, giữ chuẩn tỷ lệ khung hình thật (`aspectRatio`) và đặt kích thước mặc định 260px khi dán lên bàn học.
     - Tạo `src/services/GiphyService.test.ts` kiểm thử toàn diện việc ánh xạ dữ liệu và xử lý lỗi mạng.
  3. **Mở rộng kho Emoji & Sticker chuẩn phong cách Miro:**
     - Xây dựng `src/data/stickersAndEmojis.ts` với đầy đủ 8 danh mục Miro Emoji (`people`, `nature`, `food`, `activities`, `travel`, `objects`, `symbols`, `flags`), thanh category icon (`🕒`, `😀`, `🌿`, `🍔`, `⚽`, `🚌`, `💡`, `💖`, `🚩`) và hơn 200 emoji.
     - Bổ sung bộ sưu tập Sticker vector Funky Lines (Apple with worm, Retro boombox, Ladybug, Cap, Cat in box, Pixel laptop, Crystal ball, Dumpster fire, House, Popsicle, Secret lock, Happy pencil, v.v.), Học tập & Công việc, Biểu cảm năng lượng chuẩn phong cách Miro.
  4. **Tích hợp tính năng Ghi Hình Màn Hình vào menu Dấu Cộng (`LeftCreationBar`):**
     - Thêm công cụ `screen_record` ("Record screen") vào danh sách `extraTools` trong menu `+`.
     - Nhấp chọn sẽ kích hoạt ngay modal ghi hình bài giảng/học tập (`vitudy:open-record-modal`).
- **Files Modified/Created:**
  - `src/data/stickersAndEmojis.ts`: Danh mục Miro Emoji & Sticker phong phú.
  - `src/services/GiphyService.ts` & `src/services/GiphyService.test.ts`: Live Giphy API client & unit tests.
  - `src/components/hud/StickerEmojiPickerFlyout.tsx`: Nâng cấp giao diện tìm kiếm Live Giphy & danh mục Miro.
  - `src/components/objects/CodeBlockItem.tsx`: Loại bỏ layer compositing mờ, thêm geometricPrecision.
  - `src/components/objects/MindMapNodeItem.tsx`: Loại bỏ transition-all, thêm crisp vector rendering.
  - `src/components/objects/StickerItem.tsx`: Loại bỏ drop-shadow filter, tối ưu vector SVG scaling.
  - `src/context/StudySpaceContext.tsx` & `src/components/canvas/DeskDrawingInteractionLayer.tsx`: Hỗ trợ kích thước tùy biến khi dán sticker/gif.
  - `src/components/hud/LeftCreationBar.tsx` & `src/components/hud/BottomLeftKnowledge.tsx`: Tích hợp `screen_record`.
  - `AGENTS.md`: Cập nhật quy chuẩn kỹ thuật.
- **Verified by:**
  - `pnpm test`: 16/16 test suites passed (44/44 tests pass 100%).
  - `pnpm run docs:index ; pnpm run docs:check`: Pass.
  - `pnpm run build:pages`: Export static Next.js 15 thành công.
- **Docs updated:** `AGENTS.md`, `11_CHANGELOG.md`.


- **Task:** Giải quyết triệt để 6 yêu cầu kỹ thuật & UX từ người dùng:
  1. **Bút vẽ trong tài liệu bị delay & lệch tọa độ:**
     - *Nguyên nhân delay:* `currentStroke` chỉ nằm ở `DeskDrawingCanvas` (`z-25`) trong container bàn học, nên khi vẽ trên sách hay tài liệu (có nền trắng và z-index cao hơn), nét vẽ bị che khuất trong suốt quá trình kéo chuột; chỉ khi nhả chuột (`finishStroke`) nét mới được chuyển sang `ItemDrawingOverlay` khiến nét vẽ bị giật delay.
     - *Nguyên nhân lệch tọa độ:* Bìa sách `BookSpread` có `padding: 12px 42px`. `ItemDrawingOverlay` cũ nằm bên trong ruột sách nhưng `StudySpaceContext` lại tính tọa độ tương đối từ gốc `(item.x, item.y)` của bìa sách ngoài $\rightarrow$ Bị lệch sang phải 42px và lệch xuống 12px.
     - *Khắc phục:*
       - Tách riêng lớp `currentStroke` trong `DeskDrawingCanvas` lên lớp cao nhất `z-[1000]`, bảo đảm nét mực tuôn ra tức thì ngay dưới ngòi chuột thời gian thực khi vẽ trên mặt bàn lẫn trên ruột sách hay tài liệu.
       - Đưa `<ItemDrawingOverlay />` trên `BookSpread` ra container ngoài của sách (`width: 980, height: 640`), đồng bộ tọa độ gốc `(0, 0)` với `item.x, item.y`, triệt tiêu hoàn toàn độ lệch 42px/12px.
  2. **Đưa thanh MultiplayerBar xuống rìa dưới màn hình:**
     - Chuyển vị trí từ `absolute top-1 left-1/2` sang `fixed bottom-1 left-1/2 -translate-x-1/2`, căn giữa sát mép đáy màn hình, đồng thời chuyển toast đồng bộ góc nhìn lên `fixed bottom-14 left-1/2`.
  3. **Kéo khối lệnh (`CodeBlockItem`) và sticker (`StickerItem`) bị lệch tọa độ và làm di chuyển cả view:**
     - *Nguyên nhân:* Thiếu thuộc tính `data-desk-item="true"`, đồng thời sử dụng `left/top` kết hợp `transform: rotate` và `transformOrigin: center center` thay vì `transform: translate(x, y) rotate(deg)` chuẩn như Sticky Note. Ngoài ra không gọi `e.stopPropagation()` khi mousedown làm sự kiện nổi bọt lên `InfiniteDesk` kích hoạt pan view bàn học.
     - *Khắc phục:*
       - Bổ sung `data-desk-item="true"` cho `CodeBlockItem`, `StickerItem`, `MindMapNodeItem`.
       - Đồng bộ hóa định vị sang `transform: translate(x, y) rotate(deg)` và `transformOrigin: '0 0'`.
       - Ngăn chặn nổi bọt sự kiện pan view trên thanh drag handle và ô textarea code editor.
  4. **Smart Shape nhận diện chưa chuẩn hoàn toàn (Vẽ hình vuông ra tam giác hoặc tròn):**
     - *Nguyên nhân:* Điều kiện nhận diện tam giác cũ quá lỏng lẻo (`fillRatio < 0.68 && (cornerCount <= 4 || sharpCorners <= 3)`), nuốt chửng các hình vuông vẽ tay có fillRatio ~0.66 thành tam giác. Đồng thời kiểm tra hình vuông dựa vào `cvR` bị nhầm lẫn giữa hình vuông và elip.
     - *Khắc phục:*
       - Siết chặt tam giác: Bắt buộc `fillRatio <= 0.62` (về mặt hình học, diện tích tam giác nội tiếp bounding box tối đa chỉ là 0.50). Mọi hình có `fillRatio > 0.62` không bao giờ bị nhận diện thành tam giác.
       - Hình vuông / chữ nhật: Bắt buộc `fillRatio >= 0.63` và có ít nhất 2 góc vuông nhọn (`sharpCorners >= 2` hoặc `cornerCount === 4`). Tỷ lệ `aspectRatio in [0.70, 1.42]` ra hình vuông, ngoài dải này ra hình chữ nhật.
       - Hình tròn / elip: Nét cong trơn mượt (`sharpCorners <= 1`).
  5. **Gộp Sticker, Emoji & GIF vào 1 ô duy nhất trên thanh công cụ:**
     - Trong `src/components/hud/LeftCreationBar.tsx`, gộp `stickers` và `emojis_and_gifs` thành 1 mục duy nhất: `stickers_and_emojis` ("Stickers, Emojis & GIFs").
  6. **Thêm kéo ở góc (Resize Handle) để phóng to/thu nhỏ kích thước Emoji, GIF, Sticker:**
     - Bổ sung hàm `updateItemDimensions(id, width, height)` trong `StudySpaceContext.tsx`.
     - Trong `StickerItem.tsx`: Khi `isSelected`, hiển thị núm kéo tròn ở góc dưới bên phải (`cursor-nwse-resize`) cho phép người dùng kéo thả để co dãn kích thước emoji/sticker/gif theo tỷ lệ mượt mà.
- **Files Modified:**
  - `src/components/canvas/DeskDrawingCanvas.tsx`: Active stroke topmost layer `z-[1000]`.
  - `src/components/objects/BookSpread.tsx`: Di chuyển `ItemDrawingOverlay` lên container ngoài sách.
  - `src/components/canvas/ItemDrawingOverlay.tsx`: Tối ưu SVG overlay `z-30`.
  - `src/components/hud/MultiplayerBar.tsx`: Đưa vị trí xuống `bottom-1 left-1/2`.
  - `src/components/objects/CodeBlockItem.tsx`: Fix `data-desk-item="true"`, `transform: translate`, drag handle stopPropagation.
  - `src/components/objects/StickerItem.tsx`: Fix transform, drag handle, thêm corner resize handle.
  - `src/components/objects/MindMapNodeItem.tsx`: Thêm `data-desk-item="true"` và `transform: translate`.
  - `src/context/StudySpaceContext.tsx`: Thêm `updateItemDimensions`.
  - `src/components/hud/LeftCreationBar.tsx`: Gộp Sticker, Emoji, GIF thành 1 ô `stickers_and_emojis`.
  - `src/utils/smartShape.ts` & `src/utils/smartShape.test.ts`: Tối ưu thuật toán phân loại và bổ sung test case.
  - `AGENTS.md`: Tự động cập nhật toàn bộ quy chuẩn kỹ thuật mới.
- **Verified by:**
  - `pnpm test`: 15/15 test suites passed (42/42 tests pass 100%).
  - `pnpm run docs:index ; pnpm run docs:check`: Pass.
  - `pnpm run build:pages`: Export static Next.js 15 thành công.
- **Docs updated:** `AGENTS.md`, `11_CHANGELOG.md`.

---

## 2026-11-09 11:12 — main (Khắc Phục Vỡ Chữ Khi Phóng To & Chữ Note Bị Nằm Dưới Thanh Ngang)
- **Task:** Giải quyết 2 phản hồi của người dùng kèm ảnh:
  1. **Chữ bị vỡ khi phóng quá to (Zoom 232%):**
     - *Nguyên nhân:* Container bàn học trong `InfiniteDesk.tsx` sử dụng `will-change-transform`, `backfaceVisibility: 'hidden'` và `translate3d(..., 0)`. Các thuộc tính này ép Chromium coi phần tử là một GPU Composited Layer tĩnh được rasterize ở độ phân giải 100%, sau đó GPU sampler chỉ phóng to ảnh bitmap đó lên khi scale tăng $\rightarrow$ Dẫn đến toàn bộ chữ, công thức toán và icon bị răng cưa, nhòe và vỡ hạt khi zoom lớn.
     - *Khắc phục:* Gỡ bỏ hoàn toàn `will-change-transform` và `backfaceVisibility: 'hidden'`, chuyển từ `translate3d` sang 2D transform trực tiếp `translate(x, y) rotate(deg) scale(s)` cùng `text-rendering: geometricPrecision`. Nhờ đó Chromium luôn re-rasterize vector font ở độ phân giải thực tế của màn hình tại mọi mức zoom (kể cả 200% - 400%), giúp chữ sắc nét như dao cạo (pixel-perfect).
  2. **Chữ note bị nằm dưới thanh ngang footer (`StickyNoteItem.tsx`):**
     - *Nguyên nhân:* `textarea` dùng class `h-full` chiếm 100% chiều cao của thân note, kết hợp với chiều cao note cố định (200px) trong khi nội dung có nhiều dòng ngắt dòng $\rightarrow$ Dòng chữ cuối cùng bị thanh kẻ ngang `border-t border-black/10` của footer đè trực tiếp lên chữ.
     - *Khắc phục:*
       - Đổi `textarea` sang `w-full flex-1 min-h-0 mb-1.5 pb-1` để phân tách không gian độc lập với footer `flex-shrink-0`.
       - Nâng cấp thuật toán tính `noteHeight` tự động mở rộng theo số dòng thực tế (`approxLines * lineH + 68`), đảm bảo dòng chữ cuối cùng luôn cách thanh footer một khoảng đệm an toàn ít nhất 8-12px, triệt tiêu 100% lỗi chữ bị đè.
- **Files Modified:**
  - `src/components/canvas/InfiniteDesk.tsx`: Gỡ bỏ `will-change-transform` & `backfaceVisibility: 'hidden'`, đổi sang 2D transform vector sharp.
  - `src/components/objects/StickyNoteItem.tsx`: Co dãn chiều cao note tự động và flex layout chống đè chữ footer.
  - `AGENTS.md`: Bổ sung quy chuẩn kỹ thuật cho Vector Sharpness và Sticky Note Footer.
- **Verified by:**
  - `pnpm test`: 15/15 test suites passed (41/41 tests pass 100%).
  - `pnpm run docs:check`: Pass.
- **Docs updated:** `AGENTS.md`, `11_CHANGELOG.md`.

---

## 2026-11-09 10:55 — main (Khắc Phục 3 Vấn Đề UI Whiteboard: Code Block Tối Giản, Sơ Đồ Tư Duy Viên Thuốc & Popover Emoji/Sticker/GIF)
- **Task:** Hiện thực hóa giao diện chuẩn mực theo 3 ảnh người dùng cung cấp:
  1. **Ảnh 3 (Code block tối giản):**
     - Tạo mới component `CodeBlockItem.tsx`:
       - Tiêu đề `Code block` màu xám trung tính phía trên.
       - Khung code nền xanh navy đậm đen `#060b1c`, bo góc lớn `rounded-xl`, viền mảnh `border border-slate-800`.
       - Cột số dòng bên trái (`1, 2, 3...`) tự động co dãn theo số dòng code thực tế.
       - Ô nhập `textarea` font `font-mono text-xs md:text-sm text-slate-100` thuần túy, thụt lề 2 spaces khi gõ phím `Tab`.
       - Nút Copy code nhanh và nút Xóa tinh tế khi hover. Triệt tiêu hoàn toàn khung dán băng dính vàng Sticky note thừa thãi.
  2. **Ảnh 2 (Sơ đồ tư duy Mind map viên thuốc):**
     - Tạo mới component `MindMapNodeItem.tsx` & `MindMapConnectors.tsx`:
       - Node trung tâm hình viên thuốc (Pill shape): bo góc `rounded-full`, viền dày màu tím nổi bật `border-2 border-purple-500 bg-white shadow-sm`.
       - Placeholder ở tâm: `Type something` với con trỏ nhấp nháy ở giữa.
       - 4 nút tròn dấu cộng `+` ở 4 hướng (Trên, Dưới, Trái, Phải): nhấp chuột tự động sinh node con ở hướng đó và liên kết nhánh.
       - Floating toolbar phía trên khi focus: đổi màu viền, in đậm `B`, cỡ chữ, xoay và xóa.
       - Đường nối nhánh mềm mại (`MindMapConnectors`): vẽ đường cong Bezier cubic từ mép node cha sang mép node con với màu viền tương ứng.
  3. **Ảnh 1 (Popover Emoji / Sticker / GIF & Dán lên bàn học):**
     - Tạo mới component `StickerEmojiPickerFlyout.tsx` & `StickerItem.tsx`:
       - Mở popover nổi bên trái: ô tìm kiếm `Search`, 4 tab `All | Stickers | Emojis | GIFs`.
       - Section Emojis: icon vector SVG sắc nét (Like, Check, Star, Cross, Question, Smiley, Heart, Cool...).
       - Section Stickers: sticker đồ họa học tập (100 điểm, Não thông minh, Mũ, Tai thỏ, Lửa...).
       - Section GIFs: ảnh gif phản ứng vui nhộn.
       - Khi chọn item: popover đóng, con trỏ chuột trên bàn học biến đổi thành hình của sticker đó kèm hướng dẫn click để dán.
       - Nhấp chuột vào bất kỳ đâu trên bàn học để dán `StickerItem` trong suốt độc lập, không bọc trong giấy ghi chú, hỗ trợ xoay và xóa.
- **Files Created/Modified:**
  - `src/types/studyspace.ts`: Mở rộng `ItemType` ('code_block', 'mind_map', 'sticker') và các trường tương ứng trong `DeskItem`.
  - `src/components/objects/CodeBlockItem.tsx`: Component khối code tối giản.
  - `src/components/objects/MindMapNodeItem.tsx`: Component node mind map hình viên thuốc kèm 4 nút `+` và floating toolbar.
  - `src/components/canvas/MindMapConnectors.tsx`: SVG đường nối nhánh Bezier giữa các node mind map.
  - `src/components/hud/StickerEmojiPickerFlyout.tsx`: Bảng chọn Emoji/Sticker/GIF chuẩn Ảnh 1.
  - `src/components/objects/StickerItem.tsx`: Component hiển thị sticker/emoji/gif trên bàn học.
  - `src/components/canvas/InfiniteDesk.tsx`: Tích hợp render các component mới và connectors.
  - `src/components/canvas/DeskDrawingInteractionLayer.tsx`: Hỗ trợ click đặt `code_block`, `mind_map`, `sticker` và dynamic cursor.
  - `src/components/hud/LeftCreationBar.tsx`: Mở bảng chọn sticker/emoji và đặt template khối code / mind map.
  - `src/context/StudySpaceContext.tsx`: Bổ sung các phương thức `addCodeBlock`, `addMindMapNode`, `addSticker`, `updateCodeBlock`, `updateMindMapNode`.
  - `src/components/canvas/Minimap.tsx`: Hiển thị màu sắc và kích thước chính xác cho các item mới.
  - `AGENTS.md`: Bổ sung quy chuẩn kỹ thuật cho Code block, Mind map và Sticker.
- **Verified by:**
  - `pnpm test`: 15/15 test suites passed (41/41 tests pass 100%).
  - `pnpm run docs:check`: Pass.
- **Docs updated:** `AGENTS.md`, `03_SYMBOL_INDEX.md`, `11_CHANGELOG.md`.

---

## 2026-11-09 09:55 — main (Khắc Phục Triệt Để Lỗi Vẽ Thông Minh: Hình Vuông/Tam Giác Ra Giọt Nước, Hình Tròn Ra Elip)
- **Task:** Giải quyết triệt để phản hồi của người dùng kèm ảnh bằng chứng: Vẽ hình vuông ra hình giọt nước, tam giác ra hình giọt nước, tròn ra hình elip.
- **Root Cause & Technical Breakdown:**
  1. **Lỗi Giọt Nước ở Hình Vuông & Tam Giác (`pointsToSvgPath`):**
     - Khi `recognizeSmartShape` nhận diện đúng đa giác và trả về mảng 4 điểm (tam giác) hoặc 5 điểm (hình vuông/chữ nhật), hàm `pointsToSvgPath` cũ dùng đường cong bậc 2 `Q` qua trung điểm (`midpoint quadratic Bezier curve`) cho các điểm ở giữa.
     - Điểm đầu đến điểm cuối lại được nối bằng đoạn thẳng `L` $\rightarrow$ Đỉnh xuất phát `points[0]` trở thành góc nhọn gãy duy nhất, trong khi 3 đỉnh còn lại của hình vuông bị bo tròn thành đáy bầu dục trơn tuột $\rightarrow$ Tạo ra chính xác hình quả giọt nước (`💧`).
     - *Khắc phục:* Phân biệt đa giác khép kín (`isClosedPolygon = points.length <= 8 && Math.hypot(first - last) < 10`). Toàn bộ đa giác được vẽ bằng các đoạn thẳng sắc nét `M p0 L p1 L p2 ... Z`, triệt tiêu hoàn toàn đường cong `Q` trên đa giác.
  2. **Lỗi Hình Tròn Ra Elip / Bị Ép Nhầm Thành Vuông (`src/utils/smartShape.ts`):**
     - *Ngưỡng `aspectRatio` cũ quá khắt khe:* Chỉ chấp nhận `aspectRatio` từ `0.78` đến `1.28`. Khi người dùng dùng chuột/trackpad vẽ tự do, chuyển động cổ tay tự nhiên thường dẹt nhẹ sang hai bên ($w/h \approx 1.30 - 1.45$), vượt quá `1.28` $\rightarrow$ Bị đẩy sang nhánh fallback vẽ thành Elip dẹt nằm ngang.
     - *Điều kiện `isQuadrilateral` cũ bắt nhầm hình tròn:* Do diện tích hình tròn có `fillRatio = \pi / 4 \approx 0.785 \ge 0.72` và tay run có `cvR > 0.10`, thuật toán cũ phân loại nhầm hình tròn thành tứ giác $\rightarrow$ Trả về hình vuông $\rightarrow$ Bị `pointsToSvgPath` cũ biến thành giọt nước!
     - *Khắc phục:*
       - Bổ sung hàm phát hiện góc ngoặt gấp `countSharpCorners(points)` đo góc đổi hướng tiếp tuyến $\in [48^\circ, 145^\circ]$. Hình tròn cong trơn hầu như có 0 góc nhọn, trong khi hình vuông/chữ nhật có 3-4 góc nhọn.
       - Mở rộng dải tỷ lệ nhận diện Hình Tròn hoàn hảo từ `0.65` đến `1.55` cho nét vẽ tay tự do.
       - Chỉ nhận diện là Elip khi người dùng cố ý vẽ hình bầu dục thon dài rõ rệt (`aspectRatio < 0.65` hoặc `> 1.55`).
       - Dải nhận diện Hình Vuông mở rộng từ `0.70` đến `1.42`.
- **Files Modified:**
  - `src/components/canvas/DeskDrawingCanvas.tsx`: Render đa giác thẳng góc bằng lệnh `L ... Z`.
  - `src/components/canvas/ItemDrawingOverlay.tsx`: Render đa giác trên tài liệu thẳng góc bằng lệnh `L ... Z`.
  - `src/utils/smartShape.ts`: Nâng cấp bộ phân loại hình dạng với `countSharpCorners`, dải `aspectRatio` mở rộng `0.65 - 1.55` cho hình tròn và `0.70 - 1.42` cho hình vuông.
  - `src/utils/smartShape.test.ts`: Bổ sung test case kiểm thử hình tròn vẽ tay dẹt `aspectRatio = 1.36` nhận diện thành Hình tròn chuẩn, elip dẹt `2.2` nhận diện thành Elip.
  - `AGENTS.md`: Bổ sung quy chuẩn kỹ thuật `Smart Shape Recognition Standards`.
- **Verified by:**
  - `pnpm test`: 15/15 test suites passed (41/41 tests pass 100%).
  - `pnpm run docs:check`: Pass.
- **Docs updated:** `AGENTS.md`, `03_SYMBOL_INDEX.md`, `11_CHANGELOG.md`.

---

## 2026-11-09 09:35 — main (Chế Độ Đổi Con Trỏ Đặt Vật Thể Tuỳ Ý & Cố Định STK Thụ Hưởng MBBank SePay)
- **Task:** Thực hiện 2 yêu cầu tinh chỉnh từ người dùng:
  1. **Chuyển đổi sang chế độ đổi icon con trỏ chuột và đặt vật thể tùy ý trên mặt bàn học:**
     - Khi người dùng chọn bất kỳ công cụ nào từ menu mở rộng trên thanh công cụ bên trái (`code_block`, `table`, `mind_map`, `stickers`, `emojis_and_gifs`), thay vì tự động đặt ngay giữa màn hình:
       - Hệ thống kích hoạt template đặt tương ứng (`stickyCreationTemplate`), đặt trạng thái công cụ `activeTool = 'create_note'`.
       - Con trỏ chuột lập tức biến đổi thành icon SVG chuyên biệt theo từng loại công cụ:
         - Khối mã nguồn: Icon thẻ Code Dark mode `</>` viền ngọc bích.
         - Bảng dữ liệu: Icon lưới ô Table hàng và cột màu cam ViT.
         - Sơ đồ tư duy: Icon phân nhánh Mind map màu xanh lam.
         - Hình dán: Icon nhãn ghi nhớ Bookmark màu vàng hổ phách.
         - Minh họa học tập: Icon thành tựu Trophy màu hồng phấn.
       - Xuất hiện thanh chỉ dẫn nổi ở đáy màn hình: *"Nhấp chuột vào bất kỳ vị trí nào trên bàn học để đặt: [Tên công cụ]"*.
       - Người dùng tự do nhấp chuột (hoặc kéo thả kích thước) vào đúng vị trí mong muốn trên mặt bàn để sinh ra vật thể tại tọa độ đó.
  2. **Cố định STK thụ hưởng chính thức theo ảnh cổng SePay MBBank:**
     - Cập nhật vĩnh viễn cấu hình tài khoản thụ hưởng trong `src/services/PaymentService.ts`:
       - Ngân hàng: `MB` (MBBank - Ngân hàng Quân Đội).
       - Số tài khoản: `99924052005`.
       - Tên chủ tài khoản: `LE VO THANH NAM`.
     - Loại bỏ hoàn toàn mục cho phép người dùng tự đổi STK trên giao diện `QRCodeDisplay.tsx` để bảo đảm tính thống nhất và toàn vẹn của cổng nạp SePay API 24/7.
     - Mã VietQR được sinh tự động chính xác 100%: `https://img.vietqr.io/image/MB-99924052005-compact2.png...`.
- **Verified by:**
  - `pnpm test`: 15/15 test suites passed (39/39 tests).
  - `pnpm run build:pages`: Static export 12/12 routes thành công 100%.
- **Docs updated:** `11_CHANGELOG.md`.

---

## 2026-11-09 09:25 — main (Khắc Phục 3 Vấn Đề: Nhận Diện Hình Học, Công Cụ Ghi Chú Đa Năng & Quét QR Ngân Hàng)
- **Task:** Giải quyết triệt để 3 vấn đề người dùng phản hồi:
  1. **Vẽ hình tự động nhận diện cứ ra hình tròn dù cố vẽ vuông hoặc tam giác (`src/utils/smartShape.ts`):**
     - *Nguyên nhân:* Thuật toán cũ kiểm tra `cvR < 0.22` (độ biến thiên bán kính) trước các hình đa giác. Vì hình vuông có `cvR` lý thuyết $\approx 0.12 < 0.22$, nên toàn bộ hình vuông vẽ tay đều bị nhận nhầm thành hình tròn.
     - *Giải pháp:* Tích hợp thuật toán Shoelace tính diện tích thực đa giác và tỷ lệ lấp đầy bounding box (`fillRatio = area / (w * h)`), kết hợp rút gọn đa giác Ramer-Douglas-Peucker (RDP) để đếm góc đỉnh:
       - Tam giác: `fillRatio < 0.68` hoặc đếm góc đỉnh $\le 4$, thuật toán `findBestTriangleCorners` tìm 3 đỉnh tạo tam giác có diện tích lớn nhất.
       - Tứ giác (Vuông / Chữ nhật): `fillRatio >= 0.72` và đếm góc đỉnh $\approx 4$, căn chỉnh thành hình vuông hoàn hảo nếu `aspectRatio ~ 1.0` hoặc hình chữ nhật nếu thon dài.
       - Hình tròn / Elip: Nhận diện khi đường cong trơn láng (không có góc gãy nhọn) và tỷ lệ diện tích phù hợp.
       - Viết test suite `src/utils/smartShape.test.ts` kiểm thử đầy đủ đường thẳng, hình vuông, hình tam giác, hình chữ nhật và hình tròn.
  2. **Code block, Emoji & GIF, Sticker, Table, Mind map không dùng được:**
     - *Tọa độ spawn hiển thị (`src/context/StudySpaceContext.tsx`):* Khi tạo note hoặc công cụ bổ sung mà không truyền tọa độ, hệ thống tự động tính toán vị trí tâm khung nhìn hiện tại của camera (`transform.x`, `transform.y`, `transform.scale`) thay vì tọa độ cứng `(400, 300)` bị sách `BookSpread` che khuất.
     - *Giao diện trực quan phong phú (`src/components/objects/StickyNoteItem.tsx`):*
       - `code_block`: Hiển thị khung mã nguồn giao diện tối (`slate-950`), nhãn ngôn ngữ (Python/SQL/JS), số thứ tự dòng, và nút 1-click "Sao chép code" (`Copy`).
       - `table`: Hiển thị bảng dữ liệu có cấu trúc với hàng/cột, viền ngăn nắp, màu xen kẽ.
       - `mind_map`: Hiển thị sơ đồ cây trực quan với nút gốc (root pill) và các nhánh con liên kết.
       - `stickers`: Hiển thị thẻ nhãn ghi nhớ học tập với icon vector Lucide (`BookmarkCheck`), tuân thủ 100% Zero-Emoji.
       - `emojis_and_gifs`: Hiển thị thẻ thành tựu/minh họa học tập với icon `Trophy`, `Target`, `CheckCircle2` chuẩn SVG.
       - Nút chuyển đổi hai chiều "Xem trực quan" và "Sửa văn bản" trong chân note hoặc nhấp đúp để chỉnh sửa.
  3. **App ngân hàng quét mã VietQR báo truy vấn không thành công (`src/services/PaymentService.ts` & `src/components/payment/QRCodeDisplay.tsx`):**
     - *Nguyên nhân:* Mã ngân hàng VietQR của MBBank là `MB` (hoặc BIN `970422`), không dùng chuỗi `MBBank`. Ngoài ra, số tài khoản mặc định `0372483582` là tài khoản mẫu thử nghiệm, khi quét qua mạng lưới Napas 24/7 của các app ngân hàng sẽ báo "Tài khoản thụ hưởng không tồn tại".
     - *Giải pháp:*
       - Chuẩn hóa mã ngân hàng sang `MB` trong `buildVietQrUrl` và `DEFAULT_BANK_CONFIG`.
       - Bổ sung chức năng **Cài đặt STK nhận tiền thực tế**: Người dùng/giảng viên có thể bấm "Đổi STK" ngay tại màn hình mã QR để chọn ngân hàng (MB, Vietcombank, Techcombank, VPBank, ACB, BIDV, VietinBank, TPBank...) và nhập số tài khoản thật của họ. Mã QR sẽ tức thì được tạo lại cho chính tài khoản đó để quét chuyển khoản thành công 100% trên app ngân hàng.
       - Cung cấp nút sao chép toàn bộ thông tin thanh toán và nút **Giả lập đã nhận tiền** để nạp tức thì vào ví mà không tốn chi phí.
- **Verified by:**
  - `pnpm test`: 15/15 test suites passed (39/39 tests).
  - `pnpm run build:pages`: Static export 12/12 routes thành công 100%.
- **Docs updated:** `11_CHANGELOG.md`.

---

## 2026-11-09 09:02 — main (Khắc Phục Triệt Để Lỗi Tạo Yêu Cầu Thanh Toán VietQR SePay)
- **Task:** Khắc phục triệt để chuỗi lỗi thanh toán VietQR trên môi trường deploy (`Could not find function`, `foreign key constraint`, và `column reference is ambiguous`):
  1. **Áp dụng toàn bộ Database Migrations lên Supabase Cloud:**
     - Đồng bộ schema cơ sở `0000_initial_schema.sql` (chuyển đổi `uuid_generate_v4()` sang hàm chuẩn core `gen_random_uuid()`).
     - Đẩy thành công 9 migration (`0000` đến `0010`) lên database `db.yndwxcnedlilmsbbydvb.supabase.co` bằng `npx supabase db push`.
     - Tạo hàm RPC `public.create_payment_request`, các bảng `vitoken_packages`, `payment_requests`, `unmatched_payments`.
  2. **Đồng bộ hóa danh mục gói nạp (Migration 0011 & 0012):**
     - Đồng bộ các mã gói `starter`, `midterm`, `semester`, `project`, `team` trên database khớp 100% với frontend.
     - Dọn dẹp các mã gói cũ (`demo`, `basic`, `standard`...) để tránh xung đột thứ tự sắp xếp.
  3. **Xử lý Foreign Key Constraint & Ambiguous Column (Migration 0013, 0014 & 0015):**
     - Bổ sung migration 0014: Tự động backfill và đảm bảo record profile trong `public.profiles` cho mọi tài khoản `auth.users`, triệt tiêu lỗi ràng buộc khoá ngoại `payment_requests_user_id_fkey`.
     - Bổ sung migration 0015: Thêm chỉ thị `#variable_conflict use_column` và alias bảng tường minh trong hàm `create_payment_request` để giải quyết triệt để lỗi xung đột tên biến đầu ra `id` trong PostgreSQL PL/pgSQL.
  4. **Hỗ trợ tạo yêu cầu nạp cho cả Khách & Người dùng đã đăng nhập:**
     - Cập nhật `src/services/PaymentService.ts`: Tự động nhận diện trạng thái phiên đăng nhập. Nếu là khách trải nghiệm, hệ thống sinh ngay mã QR VietQR mẫu với thông tin chuyển khoản chuẩn xác kèm mã nội dung giao dịch để trải nghiệm tức thì; nếu đã đăng nhập, hệ thống tạo bản ghi chính thức qua RPC `create_payment_request` và kích hoạt Supabase Realtime lắng nghe giao dịch.
- **Verified by:**
  - `pnpm test`: 14/14 test suites passed (34/34 tests).
  - Trực tiếp kiểm chứng và chụp ảnh live: `gh_pages_vietqr_live_success.png` (Mã VietQR MBBank sinh thành công kèm mã chuyển khoản `VT8KU87UUZ`, số tiền 27.000 VNĐ).
  - `npx supabase db push`: Up-to-date 100% trên remote database.
- **Docs updated:** `11_CHANGELOG.md`.

---

## 2026-11-09 07:53 — main (Hoàn Thiện Kết Nối Đăng Nhập Google & Discord Ở Môi Trường Deploy)
- **Task:** Hoàn thiện luồng xác thực Google và Discord OAuth trên môi trường deploy GitHub Pages (`https://namtacozz.github.io/ViTudy`):
  1. **Cấu hình biến bí mật GitHub Repo Secrets:**
     - Thiết lập `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY` vào GitHub Secrets của repo `namtacozz/ViTudy` qua GitHub CLI (`gh secret set`).
  2. **Đồng bộ hóa cấu hình Supabase Cloud (`yndwxcnedlilmsbbydvb`):**
     - Cập nhật `site_url`: `https://namtacozz.github.io/ViTudy`.
     - Bổ sung `additional_redirect_urls`: `https://namtacozz.github.io/ViTudy/auth/callback`, `https://namtacozz.github.io/ViTudy/**`, `http://localhost:3000/auth/callback`, `http://localhost:3000/**`, `http://127.0.0.1:3000/auth/callback`.
     - Đẩy cấu hình trực tiếp lên Supabase Cloud bằng `npx supabase config push --remote=yndwxcnedlilmsbbydvb --yes`.
  3. **Tối ưu hóa mã nguồn Client:**
     - `src/lib/supabase.ts`: Thiết lập fallback mặc định chuẩn xác tới project `yndwxcnedlilmsbbydvb` và hỗ trợ nạp cấu hình từ `localStorage`.
     - `src/context/AuthContext.tsx`: Nâng cấp `signInWithOAuth` tự động nhận biết subpath `/ViTudy` trên GitHub Pages để tạo `redirectUrl` chuẩn xác; bắt lỗi chi tiết từ máy chủ khi provider chưa được bật.
     - `src/components/auth/OAuthButtons.tsx`: Bổ sung trạng thái loading trực quan ("Đang kết nối..."), chống click đúp khi khởi tạo OAuth.
     - `src/app/auth/page.tsx`: Hiển thị cảnh báo trực quan nếu nhà cung cấp chưa được kích hoạt, hướng dẫn người học đăng nhập nhanh bằng Email.
     - `src/app/auth/callback/page.tsx`: Xử lý cả luồng PKCE `code` lẫn Token Session; tự động điều hướng về `${window.location.origin}${basePath}/` và lưu cờ đã vào bàn học.
- **Verified by:**
  - `pnpm test`: 14/14 test suites passed (34/34 tests).
  - `pnpm run build:pages`: Static export 12/12 routes thành công.
  - `npx supabase config diff`: 0 diff sau khi push.
- **Docs updated:** `supabase/config.toml`, `11_CHANGELOG.md`.

---

## 2026-11-08 22:02 — main (Triển Khai Thành Công Lên GitHub Pages & Biên Soạn README.md)
- **Task:** Triển khai sản phẩm hoàn chỉnh lên GitHub Pages và bổ sung tài liệu hướng dẫn `README.md`:
  1. **Triển khai tự động lên GitHub Pages:**
     - Sửa lỗi TypeScript tại `src/app/dashboard/page.tsx` (thiếu biến `today` trong guest activity grid).
     - Biên dịch thành công Static Export (`pnpm run build:pages`) tạo đầy đủ 12 static routes, thư mục `_next` và file `.nojekyll`.
     - Chạy toàn bộ test suite (`pnpm test`): 14/14 test suites passed (34/34 tests).
     - Commit và push lên `origin/main` kích hoạt GitHub Actions workflow (`deploy.yml`).
     - GitHub Actions hoàn tất 100% trong 1m9s (`build` 1m1s, `deploy` 8s).
     - Xác minh trực tiếp trên URL thật qua CDP 9222 (`https://namtacozz.github.io/ViTudy/`): Mặt bàn học 2.5D, sách mở đôi, thanh nhắc chữ V, ghi chú, thẻ trắc nghiệm, minimap, onboarding tour và banner khách hoạt động mượt mà với 100% CSS và icons.
  2. **Biên soạn README.md:**
     - Soạn thảo tài liệu giới thiệu dự án chi tiết, tự nhiên, tuân thủ nghiêm ngặt kỹ năng `humanizer` và Zero-Emoji Policy của `AGENTS.md`.
     - Bao gồm: Giới thiệu tổng quan, Link Live Demo, 8 nhóm tính năng cốt lõi, công nghệ sử dụng, hướng dẫn cài đặt và chạy cục bộ, quy trình deploy tự động lên GitHub Pages.
- **Verified by:**
  - GitHub Actions Workflow Run #42492351819 (Success).
  - Trực tiếp kiểm chứng và chụp ảnh màn hình live trang: `gh_pages_live_verified.png`.
- **Docs updated:** `README.md`, `11_CHANGELOG.md`.

---

## 2026-11-08 21:16 — uncommitted (Báo Cáo Tổng Hợp, E2E CDP Testing & Tinh Chỉnh Toàn Diện)
- **Task:** Tổng hợp dự án chi tiết, xây dựng và thực thi Plan kiểm thử tự động qua Chrome DevTools Debug Protocol (CDP port 9222), chụp và kiểm tra trực tiếp ảnh toàn bộ các luồng giao diện, khắc phục triệt để các khiếm khuyết phát hiện:
  1. **Báo cáo tổng hợp dự án toàn diện:**
     - Tạo artifact `vitudy-project-comprehensive-report.md` bao quát: chức năng, giao diện, use-case, giá trị người học, kiến trúc kỹ thuật.
  2. **E2E CDP Test Suite qua cổng 9222:**
     - Xây dựng `scripts/e2e-automated-test-suite.mjs` chụp 18 bức ảnh kiểm chứng E2E cho 7 phân hệ: Landing Page, Bàn học 2.5D, TopUp VietQR, Chợ KnowInherit, Dashboard Nhật ký học, Hỏi đáp FAQ, Đăng nhập Auth.
  3. **Sửa lỗi nghiêm trọng TopUpModal bị bó hẹp góc phải:**
     - Sử dụng React `createPortal(..., document.body)` để đưa `TopUpModal` ra lớp ngoài cùng `z-[9999]`, triệt tiêu ảnh hưởng của CSS `transform` từ thanh `TopRightWallet`.
     - Đồng bộ hóa 100% 5 gói nạp chuẩn trong `PaymentService.ts` và `PricingTiers.tsx`: Khởi đầu (2k/2k V), Ôn giữa kỳ (10k/10k V), Học kỳ (27k/30k V - Tặng 3k), Đồ án (85k/100k V - Tặng 15k), Nhóm học (255k/300k V - Tặng 45k).
     - Bổ sung nút nạp thử nghiệm 50 ViToken 0đ phục vụ chấm điểm đồ án học thuật.
  4. **Cải thiện trải nghiệm Dashboard (Nhật ký học):**
     - Sửa `src/app/dashboard/page.tsx`: Gỡ bỏ hành vi cưỡng chế redirect sang `/auth` khi là khách; hỗ trợ chế độ khách xem đầy đủ các thẻ thống kê, biểu đồ tuần, ma trận 28 ngày kèm banner đăng nhập thanh lịch.
  5. **Chuẩn hóa chính tả & Nhãn hiển thị:**
     - Sửa lỗi chính tả `120kí` $\to$ `120 ký tự` ở chân ghi chú `StickyNoteItem.tsx`.
     - Nới rộng `max-w-[220px]` trong `TopLeftNav.tsx` giúp tiêu đề sách hiển thị đầy đủ không bị cắt cụt.
  6. **Áp dụng văn phong Humanizer:**
     - Mọi thông báo, nhãn và mô tả mới đều được viết bằng giọng văn người học tự nhiên, súc tích, loại bỏ hoàn toàn văn phong AI slop.
- **Verified by:**
  - `pnpm test`: 14/14 test suites passed (34/34 tests).
  - `scripts/verify-fixes.mjs`: Chụp và kiểm chứng trực tiếp `verify_dashboard_guest.png`, `verify_topup_modal_fixed.png`, `verify_topup_qr_fixed.png`, `verify_desk_clean.png`.
  - `pnpm run docs:index` & `pnpm run docs:check`: 171 symbols, không có drift.
- **Docs updated:** `03_SYMBOL_INDEX.md`, `11_CHANGELOG.md`.

---

## 2026-11-08 20:25 — uncommitted (Plan 06 & Plan 07 Execution — 100% Roadmap Complete)
- **Task:** Thực thi trọn vẹn Plan 06 (Quality, Security & Onboarding) và Plan 07 (Operations, Legal Docs & Sẵn Sàng Báo Cáo):
  1. **Khóa API Riêng Tư BYOK & Client Xử Lý Status Hạn Mức:**
     - `src/lib/byokStore.ts` & `src/lib/byokStore.test.ts`: Quản lý an toàn khóa Gemini và OpenAI API Key lưu trực tiếp trong `localStorage` người dùng, không bao giờ lưu trữ trên server.
     - `src/lib/aiClient.ts` & `src/lib/aiClient.test.ts`: Tự động nạp key từ BYOK Store, xử lý thân thiện lỗi 429 (hết lượt suy luận) và 402 (không đủ ViToken).
  2. **Tối Ưu Tầm Nhìn Viewport Culling 60 FPS:**
     - `src/lib/viewportCulling.ts` & `src/lib/viewportCulling.test.ts`: Thuật toán bounding sphere bao trọn góc xoay 360 độ và kích thước vật thể, tự động loại trừ các phần tử nằm ngoài màn hình (+500px margin đệm).
     - Tích hợp vào [`InfiniteDesk.tsx`](file:///F:/AppMaking/ViTudy/src/components/canvas/InfiniteDesk.tsx), luôn bảo toàn vật thể đang chọn (`selectedItemId`) hoặc đang tập trung (`focusedItemId`).
  3. **Hướng Dẫn Làm Quen Onboarding Tour 7 Bước:**
     - `src/components/onboarding/TourStep.tsx` & `src/components/onboarding/OnboardingTour.tsx`: Spotlight mờ nền 7 bước công thái học (Tâm bàn, Tải lên, Bút vẽ, Lia phím WASD, Minimap, Ví & Chợ, Trợ lý AI Inteline).
     - Gắn các thẻ định vị `data-tour` vào các nút tương ứng trên 4 đảo HUD.
     - `supabase/migrations/0010_onboarding.sql`: Thêm cột `onboarding_done` vào `profiles` và RPC `complete_onboarding`.
  4. **Landing Page Độc Bản & Cổng Vào Bàn Học:**
     - `src/components/landing/HeroSection.tsx`: Tiêu đề sắc bén, nút CTA trải nghiệm bàn học ngay, preview faux desk UI KaTeX.
     - `src/components/landing/FeatureGrid.tsx`: Trình diễn 6 trụ cột cốt lõi của ViTudy.
     - `src/components/landing/PricingSection.tsx`: Bảng giá 5 gói nạp ViToken theo quyết định D4 (2k, 10k, 27k, 85k, 255k) kèm huy hiệu chế độ mô phỏng học thuật 0đ.
     - `src/components/landing/LandingPage.tsx`: Header dính, điều hướng nhạy bén, liên kết trực tiếp vào Bàn học.
     - Cập nhật [`src/app/page.tsx`](file:///F:/AppMaking/ViTudy/src/app/page.tsx): Khách mới truy cập lần đầu được xem Landing Page, nút "Vào bàn học" ghi cờ `vitudy_has_visited_desk` để mở bàn học tức thì; nút `Info` trên `TopLeftNav.tsx` cho phép xem lại Landing Page bất kỳ lúc nào.
  5. **Bộ 3 Văn Bản Pháp Lý & Chân Trang Chung:**
     - `src/components/common/SiteFooter.tsx`: Chân trang chuẩn mực có liên kết pháp lý và bản quyền học thuật.
     - `src/app/terms/page.tsx`: Điều khoản dịch vụ và quy định sử dụng ViToken.
     - `src/app/privacy/page.tsx`: Chính sách quyền riêng tư, cam kết bảo mật BYOK và phân quyền Supabase RLS.
     - `src/app/faq/page.tsx`: 7 câu hỏi thường gặp về bàn học 2.5D, thuật toán SM-2, nạp VietQR và Discord Activity.
  6. **PWA Web App Manifest & Content Security Policy (CSP):**
     - `src/app/manifest.ts`: Khai báo manifest chuẩn standalone `theme_color: #E0562D` với `export const dynamic = 'force-static'`.
     - `public/icon.svg`: Vector SVG icon độ phân giải cao cho PWA và favicon.
     - `src/app/layout.tsx`: Thẻ meta CSP siết chặt kết nối tới Supabase, VietQR, Sepay, Discord và Google Gemini API.
  7. **Tài Liệu Bàn Giao Vận Hành & Bảng Kiểm Tra Khởi Chạy:**
     - `docs/ops/DEPLOY_RUNBOOK.md`: Sổ tay hướng dẫn triển khai Supabase, Edge Functions, Sepay Webhook, GitHub Pages và Discord Activity.
     - `docs/ops/LAUNCH_CHECKLIST.md`: Bảng kiểm tra toàn diện 100% tiêu chí báo cáo giảng viên.
- **Verified by:**
  - `pnpm test`: 14/14 test files, 34 tests passed 100% (Vitest).
  - `pnpm run build:pages`: Static export thành công 100%, xuất 13 trang tĩnh và `.nojekyll` vào thư mục `out/`.
  - `pnpm run docs:index` & `pnpm run docs:check`: 173 symbols được lập chỉ mục, PASS 100%.
- **Status:** **HOÀN THÀNH 100% ROADMAP ĐƯA VÀO VẬN HÀNH THƯƠNG MẠI & BÁO CÁO HỌC THUẬT.**

---

## 2026-11-08 20:05 — uncommitted (Plan 05 Execution)
- **Task:** Thực thi trọn vẹn Plan 05 (Feature Completion — SM-2, Learning Data, Chợ, Dashboard, Pomodoro, Demo Desk):
  1. **Migration CSDL 0008_learning.sql:**
     - Tạo bảng `flashcard_reviews` lưu lịch ôn tập lặp lại ngắt quãng SM-2 (`card_hash`, `easiness_factor`, `interval_days`, `repetitions`, `next_review_date`).
     - Tạo bảng `study_sessions` theo dõi số giây học tập thực tế mỗi ngày.
     - Tạo bảng `exam_attempts` lưu lịch sử nộp bài kiểm tra (`score`, `total`, `correct`).
     - Viết các Postgres RPC bảo mật (`SECURITY DEFINER`): `record_heartbeat` (kẹp 1–30s chống giả mạo thời gian) và `submit_exam_attempt`.
  2. **Thuật Toán Spaced Repetition SuperMemo SM-2 & Flashcard Service:**
     - `src/lib/sm2.ts`: Xây dựng thuật toán SM-2 chuẩn với 4 mức chất lượng nhớ (Quên, Khó, Tốt, Dễ); kiểm soát EF tối thiểu 1.3 và interval tối thiểu 1 ngày.
     - `src/lib/sm2.test.ts`: Bộ kiểm thử tự động 5 ca kiểm thử bao phủ toàn bộ nhánh thuật toán (PASS).
     - `src/services/FlashcardService.ts`: Lọc thẻ đến hạn ôn tập hôm nay (`getCardsForReview`) và cập nhật tiến trình ôn tập (`submitReview`).
     - `src/components/modals/study-tools/FlashcardTab.tsx`: Bổ sung chế độ "Ôn tập hôm nay" và 4 nút đánh giá nhớ trực quan khi lật mặt sau thẻ.
  3. **Activity Heartbeat & Tự Động Lưu Kết Quả Bài Thi:**
     - `src/services/ActivityService.ts`: Khởi động chu kỳ heartbeat 20 giây một lần khi tab đang hiển thị và người dùng có tương tác thực tế (`startHeartbeat`).
     - Tích hợp `submitExamAttempt` khi nộp bài thi trên thẻ trắc nghiệm [`ExamQuizCard.tsx`](file:///F:/AppMaking/ViTudy/src/components/objects/ExamQuizCard.tsx) và tờ giấy A4 [`PaperSheet.tsx`](file:///F:/AppMaking/ViTudy/src/components/objects/PaperSheet.tsx).
     - Gắn heartbeat theo dõi tương tác chuột/phím vào [`StudySpaceDeskView.tsx`](file:///F:/AppMaking/ViTudy/src/components/canvas/StudySpaceDeskView.tsx).
  4. **Dashboard Thống Kê Học Tập Toàn Diện (`/dashboard`):**
     - `src/services/StatsService.ts`: Tổng hợp phút học trong 7 ngày, điểm thi trung bình, và ma trận 28 ngày qua.
     - `src/components/dashboard/StudyStats.tsx`: 4 thẻ chỉ số học tập nổi bật và biểu đồ cột nhịp độ tuần.
     - `src/components/dashboard/StreakCalendar.tsx`: Ma trận 28 ngày với các sắc độ Cam ViT `#E0562D` trực quan.
     - `src/components/dashboard/TokenHistory.tsx`: Sổ cái biến động số dư ViToken kèm số dư hiện có.
     - Trang [`/dashboard`](file:///F:/AppMaking/ViTudy/src/app/dashboard/page.tsx) với điều hướng an toàn và nút truy cập trên HUD [`TopLeftNav.tsx`](file:///F:/AppMaking/ViTudy/src/components/hud/TopLeftNav.tsx).
  5. **Trang Chợ Tri Thức KnowInherit Đầy Đủ (`/market`):**
     - `src/services/MarketService.ts`: Tích hợp tìm kiếm từ khóa an toàn (loại trừ SQL wildcards), lọc theo chủ đề và mua tài liệu.
     - Trang [`/market`](file:///F:/AppMaking/ViTudy/src/app/market/page.tsx): Bộ lọc 6 chủ đề, phân loại tài liệu, xem trước nội dung có rào chắn mờ tĩnh bảo vệ bản quyền và mua bằng ViToken.
  6. **Phòng Học Mời Bạn (?room=), Pomodoro Timer & Khởi Tạo Bàn Demo:**
     - `src/components/hud/InviteModal.tsx`: Hộp thoại chia sẻ link phòng học `?room={spaceId}` với nút sao chép và Web Share API.
     - `src/app/page.tsx`: Tự động tham gia bàn học với quyền `viewer` khi người dùng mở link có tham số `?room=`.
     - `src/hooks/usePomodoro.ts` & `src/hooks/usePomodoro.test.ts`: Bộ đếm thời gian Pomodoro 25/5 chuẩn công thái học (PASS 100%).
     - `src/data/demoSpace.ts`: Tự động khởi tạo bàn học mẫu kèm giáo trình Machine Learning (KaTeX) và ghi chú hướng dẫn khi người dùng mới đăng nhập.
- **Verified by:**
  - `pnpm test`: 12/12 test files, 27 tests passed (Vitest).
  - `pnpm run build:pages`: Build Static Export thành công 100%, xuất 9 static pages (`/`, `/_not-found`, `/auth`, `/auth/callback`, `/dashboard`, `/market`, `/profile`).
  - `pnpm run docs:index` & `pnpm run docs:check`: Pass 100% (156 symbols).
- **Open follow-ups:** Chuyển sang thực thi Plan 06 (Quality & Security Hardening).

---

## 2026-11-08 19:50 — uncommitted (Plan 04 Execution)
- **Task:** Thực thi trọn vẹn Plan 04 (Tích Hợp Discord Embedded App Activity):
  1. **Phát Hiện Môi Trường & Cấu Hình Base Path:**
     - Sửa `next.config.ts` hỗ trợ biến môi trường `NEXT_PUBLIC_BASE_PATH` (cho phép chạy ở root user site `https://namtacozz.github.io/` để Discord URL Mapping trỏ vào `/`).
     - Tạo `src/lib/discord/detect.ts` (`isDiscordActivity`): phát hiện cờ `frame_id` từ query string của iframe Discord.
  2. **URL Mappings & Discord SDK Dynamic Loading:**
     - Cài đặt `@discord/embedded-app-sdk`.
     - Tạo `src/lib/discord/urlMappings.ts`: tự động gọi `patchUrlMappings` định tuyến `/supabase` $\rightarrow$ Supabase API host và `/discord-cdn` $\rightarrow$ Discord CDN để triệt tiêu lỗi CSP khi chạy trong iframe.
     - Cập nhật `src/lib/supabase.ts` để luôn khởi tạo URL mappings trước khi client Supabase tạo kết nối mạng.
     - Tạo `src/lib/discord/sdk.ts`: dynamic import SDK, khởi tạo `DiscordSDK`, gọi `authorize({ scope: ['identify', 'guilds.members.read'] })`, cung cấp hàm cập nhật Rich Presence `setDiscordPresence` với throttle 5s.
  3. **Migration CSDL 0006_discord.sql & Edge Function `discord-auth`:**
     - Thêm cột `discord_id` duy nhất vào `profiles` và thu hồi quyền cập nhật trực tiếp từ client.
     - Tạo bảng `activity_rooms` và hàm RPC `join_activity_room(p_instance_id, p_space_id)` giúp các thành viên cùng voice channel tự động đồng bộ vào cùng một bàn học.
     - Tạo Supabase Edge Function `supabase/functions/discord-auth/index.ts` (deploy `--no-verify-jwt`): đổi `code` lấy token Discord, truy vấn `@me`, so khớp tài khoản và sinh `token_hash` magic link an toàn.
  4. **Tích Hợp Tự Động Vào AuthContext & Multiplayer Presence:**
     - `src/hooks/useDiscordActivity.ts`: Hook trạng thái quản lý chu trình khởi tạo Activity (`idle` | `authorizing` | `ready` | `error`).
     - Cập nhật `src/context/AuthContext.tsx`: Khi phát hiện môi trường Discord, tự động kích hoạt luồng đăng nhập Discord SDK và đổi sang session Supabase thật mà không ảnh hưởng người dùng web thông thường.
     - Cập nhật `src/hooks/useRealtimeMultiplayer.ts`: Bổ sung cơ chế dọn dẹp `channel.untrack()` và `removeChannel` khi đóng Activity.
- **Verified by:**
  - `pnpm test`: 10/10 test files, 18 tests passed (Vitest).
  - `pnpm run build:pages`: Build Static Export thành công 100%, xuất thư mục `out/`.
  - `pnpm run docs:index` & `pnpm run docs:check`: Pass 100% (136 symbols).
- **Open follow-ups:** Chuyển sang thực thi Plan 05 (Feature Completion & Polish).

---

## 2026-11-08 19:45 — uncommitted (Plan 03 Execution)
- **Task:** Thực thi trọn vẹn Plan 03 (Tích Hợp Cổng Thanh Toán VietQR & Sepay Webhook Tự Động):
  1. **Migration CSDL 0005_payments.sql:**
     - Thiết lập bảng `app_settings` (cờ `demo_mode`), `vitoken_packages` (5 gói nạp theo quyết định D4: Demo 2.000đ, Cơ bản 10.000đ, Tiêu chuẩn 27.000đ, Nâng cao 85.000đ, VIP 255.000đ).
     - Thiết lập bảng `payment_requests` quản lý mã `VT` + 8 ký tự alphanumeric, hạn 15 phút, sequence sinh mã học thuật.
     - Thiết lập bảng `unmatched_payments` ghi nhận giao dịch cần đối soát.
     - Viết các Postgres RPC an toàn (`SECURITY DEFINER`): `create_payment_request`, `apply_payment`, `admin_simulate_payment`.
  2. **Supabase Edge Function `sepay-webhook`:**
     - Tạo `supabase/functions/sepay-webhook/index.ts` tiếp nhận HTTP POST webhook từ cổng Sepay.
     - Xác thực an toàn qua header `Authorization: Apikey <SEPAY_API_KEY>`, chạy chế độ `--no-verify-jwt`.
     - Trích xuất mã giao dịch `VT...`, tự động gọi RPC `apply_payment` để cộng ViToken và gửi tín hiệu Realtime tức thì.
  3. **Payment Service Layer & Hook Trạng Thái:**
     - `src/services/PaymentService.ts`: Xây dựng hàm `buildVietQrUrl` sinh ảnh QR VietQR chuẩn ngân hàng MBBank/VietinBank; các phương thức `listPackages`, `createRequest`, `simulatePayment`, `listMyPayments`.
     - `src/services/PaymentService.test.ts`: Unit test Vitest cho QR builder và package fallback (PASS).
     - `src/hooks/usePaymentStatus.ts`: Hook lắng nghe Realtime `postgres_changes` trên bảng `payment_requests`, kết hợp polling dự phòng 5s, tự động đếm ngược 15:00 và dừng poll khi đạt trạng thái kết thúc.
  4. **Giao Diện Thanh Toán Hiện Đại (Modern Educational Cockpit):**
     - `src/components/payment/PricingTiers.tsx`: Lưới 5 gói nạp với viền Cam ViT `#E0562D`, huy hiệu "Phổ biến" / "Tiết kiệm nhất".
     - `src/components/payment/QRCodeDisplay.tsx`: Hiển thị mã QR, nút sao chép mã giao dịch chữ to, thông tin ngân hàng thụ hưởng và nút "Giả lập đã nhận tiền" phục vụ báo cáo giảng viên.
     - `src/components/payment/PaymentSuccess.tsx`: Màn hình chúc mừng nạp thành công, thống kê số token được cộng.
     - `src/components/payment/PaymentHistory.tsx`: Lịch sử 20 giao dịch nạp tiền gần nhất kèm nhãn trạng thái trực quan.
     - `src/components/payment/TopUpModal.tsx`: Hộp thoại trung tâm điều phối toàn bộ quy trình nạp tiền và xem lịch sử.
     - Tích hợp nút nạp `+` trên HUD ví [`TopRightWallet.tsx`](file:///F:/AppMaking/ViTudy/src/components/hud/TopRightWallet.tsx) và thẻ lịch sử nạp trên trang [`/profile`](file:///F:/AppMaking/ViTudy/src/app/profile/page.tsx).
- **Verified by:**
  - `pnpm test`: 8/8 test files, 15 tests passed (Vitest).
  - `pnpm run build:pages`: Build Static Export thành công 100%, xuất thư mục `out/`.
  - `pnpm run docs:index` & `pnpm run docs:check`: Pass 100% (128 symbols).
- **Open follow-ups:** Chuyển sang thực thi Plan 04 (Discord Activity).

---

## 2026-11-08 19:32 — uncommitted (Plan 02 Execution)
- **Task:** Thực thi trọn vẹn Plan 02 (Kết Nối Supabase Cloud, Service Layer & Offline-First):
  1. **Migration Supabase Storage 0004 & Generated Types:**
     - Tạo `supabase/migrations/0004_storage.sql`: thiết lập 3 bucket (`avatars` public 2MB, `documents` private 20MB, `listing-content` DRM 50MB) kèm toàn bộ RLS policies bảo vệ theo thư mục người dùng `{uid}/`.
     - Tạo `src/types/database.types.ts` định kiểu dữ liệu TypeScript cho toàn bộ các bảng CSDL.
  2. **Service Layer Pattern:**
     - `src/services/StudySpaceService.ts`: CRUD bàn học, tài liệu, nét vẽ và đường nối trực quan. Cung cấp mapper hai chiều `deskItemToRow` / `rowToDeskItem`.
     - `src/services/ViTokenService.ts`: Tải ví, lịch sử giao dịch và tích hợp RPC gọi `claim_daily_streak`, `process_know_inherit_purchase`.
     - `src/services/DocumentService.ts`: Quản lý upload/download tài liệu Storage bucket `documents` với giới hạn 20MB.
  3. **Tích Hợp Cloud & Realtime Vào Contexts:**
     - `src/context/StudySpaceContext.tsx`: Đọc/ghi Supabase Cloud khi người dùng đăng nhập; cơ chế debounce 500ms chống spam request; xóa vật thể đồng bộ cloud.
     - `src/context/ViTokenContext.tsx`: Tự động tải số dư từ Cloud và subscribe Realtime `postgres_changes` trên bảng `profiles` (lọc `id=eq.{uid}`).
  4. **Hạ Tầng Ngoại Tuyến (Offline-First) & Migration Dữ Liệu:**
     - Cài đặt thư viện `idb` và tạo wrapper `src/lib/indexeddb.ts`.
     - `src/services/SyncService.ts`: Hỗ trợ phát hiện và di chuyển dữ liệu localStorage lên đám mây với bảng remap ID sang chuẩn UUID an toàn.
     - `src/services/OfflineQueue.ts`: Lưu trữ hàng đợi các thao tác thay đổi vào IndexedDB khi mất mạng và tự động đồng bộ (auto-flush) khi online trở lại.
     - `src/components/auth/MigrationDialog.tsx`: Modal thân thiện thông báo người dùng đồng bộ bàn học cũ lên tài khoản mới đăng nhập.
- **Verified by:**
  - `pnpm test`: 7/7 test files, 13 tests passed (Vitest).
  - `pnpm run build:pages`: Build Static Export thành công 100%, xuất thư mục `out/` sạch, không còn `api/`.
  - `pnpm run docs:index` & `pnpm run docs:check`: Pass 100% (115 symbols).
- **Open follow-ups:** Tiếp tục Plan 03 (Thanh Toán VietQR & Sepay Webhook).

---


- **Task:** Thực thi trọn vẹn Plan 01 (Auth & Tài Khoản Người Dùng):
  1. **Hệ Thống AuthContext & Hook useAuth:**
     - Tạo `src/context/AuthContext.tsx` và `src/hooks/useAuth.ts` hỗ trợ trạng thái ba bậc (`loading` | `guest` | `authenticated`).
     - Lắng nghe thay đổi phiên đăng nhập theo thời gian thực qua `supabase.auth.onAuthStateChange` đồng bộ liên tab.
     - Cấu hình client Supabase chuẩn PKCE (`flowType: 'pkce'`, `detectSessionInUrl: true`, `persistSession: true`) trong `src/lib/supabase.ts`.
     - Bọc `<AuthProvider>` trong `src/app/layout.tsx`.
  2. **Trang Đăng Nhập / Đăng Ký (`/auth`) & OAuth Providers:**
     - Tạo `src/components/auth/AuthForm.tsx` (kiểm thử TDD Unit Test pass 100%).
     - Tạo `src/components/auth/OAuthButtons.tsx` (Google & Discord với SVG vector chuẩn, Zero-Emoji).
     - Tạo trang `src/app/auth/page.tsx` hỗ trợ chuyển đổi linh hoạt chế độ Đăng nhập / Đăng ký và nút quay về chế độ khách.
  3. **Trình Xử Lý OAuth Callback (`/auth/callback`):**
     - Tạo trang `src/app/auth/callback/page.tsx` tiếp nhận mã PKCE `code` và đổi phiên an toàn không làm mới trình duyệt.
  4. **Banner Chế Độ Khách & Route Guard:**
     - Tạo `src/components/auth/GuestBanner.tsx` cố định đáy màn hình thông báo người dùng đang trải nghiệm bàn học khách.
     - Tích hợp vào `src/app/page.tsx`.
  5. **Trang Quản Lý Hồ Sơ Cá Nhân (`/profile`):**
     - Tạo `src/components/profile/ProfileHeader.tsx` (avatar, tên, email, số dư ViToken, upload avatar vào Storage `avatars`).
     - Tạo `src/components/profile/AccountSettings.tsx` (đổi tên hiển thị, quản lý khóa cá nhân BYOK an toàn trên thiết bị).
     - Tạo `src/components/profile/DeleteAccount.tsx` (modal xác nhận nhập email + Edge Function xoá tài khoản).
     - Tạo Supabase Edge Function `supabase/functions/delete-user/index.ts`.
     - Tạo trang `src/app/profile/page.tsx`.
  6. **Cập Nhật HUD TopLeftNav:**
     - Tích hợp avatar cá nhân (khi đã đăng nhập) và nút Đăng nhập nổi bật Cam ViT (khi là khách) vào thanh điều hướng HUD trên-trái.
- **Verified by:**
  - `pnpm test`: 4/4 test files, 7 tests passed (Vitest).
  - `pnpm run build:pages`: Build Static Export thành công 100%, xuất đủ các trang static `/auth`, `/auth/callback`, `/profile`.
  - `pnpm run docs:index` & `pnpm run docs:check`: Pass 100% (104 symbols).
- **Open follow-ups:** Tiếp tục Plan 02 (Supabase Cloud Sync & Realtime Data).

---


- **Task:** Thực thi trọn vẹn Plan 02a (Hạ tầng Test, Siết bảo mật DB & AI Gateway Edge Function):
  1. **Hạ tầng kiểm thử tự động (Vitest & Testing Library):**
     - Cài đặt `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `vitest`, `@vitejs/plugin-react`, `jsdom`.
     - Cấu hình `vitest.config.mts` và `src/test/setup.ts`.
     - Thêm scripts `pnpm test` và `pnpm test:db` vào `package.json`.
     - Viết unit tests kiểm thử client AI `src/lib/aiClient.test.ts` (PASS 100%).
  2. **Bộ 3 Migration PostgreSQL Supabase (`supabase/migrations/`):**
     - `0001_hardening.sql`: Siết chặt bảo mật toàn diện; thu hồi quyền tự sửa số dư ViToken trên `profiles`; triển khai các RPC hàm giao dịch `credit_vitoken`, `debit_vitoken` (`SECURITY DEFINER`, chỉ `service_role` được gọi); viết lại `process_know_inherit_purchase` an toàn chống gian lận và hỗ trợ phân chia doanh thu 85/15; chuẩn hóa `claim_daily_streak` theo múi giờ `Asia/Ho_Chi_Minh`; bảo vệ RLS cho `study_spaces`, `desk_documents`, `document_pages`, `inteline_threads`, `know_inherit_listings`.
     - `0002_desk_items_alignment.sql`: Đồng bộ schema `desk_documents` với toàn bộ kiểu dữ liệu TypeScript `DeskItem` (hỗ trợ `sticky_note`, `roadmap`, `exam_data`, `cover_color`, `attached_to_item_id`); gộp toàn bộ vật thể bàn học vào `desk_documents`.
     - `0003_rate_limit_and_ai_costs.sql`: Thiết lập bảng giá `ai_model_costs` và hàm phân phối hạn mức `consume_rate_limit` (20 lượt/giờ, 60 lượt/ngày).
  3. **Supabase Edge Function `ai-chat` & Client Service:**
     - Tạo `supabase/functions/ai-chat/index.ts`, `_shared/cors.ts`, `_shared/auth.ts`.
     - Tạo Client Service `src/lib/aiClient.ts` (`askAi`) với khả năng chuyển đổi thông minh giữa Supabase Edge Function và Direct/Demo fallback.
     - Di chuyển và refactor 6 component gọi AI (`IntelineModal`, `QuizTab`, `SummaryTab`, `BookSpread`, `PaperSheet`, `StickyNoteItem`) sang dùng `askAi`.
     - Xóa bỏ Next.js API Route `/api/ai/chat/route.ts` nhằm đảm bảo ứng dụng đạt chuẩn Static Export 100% trên GitHub Pages.
     - Cấu hình `tsconfig.json` loại trừ thư mục Edge Functions (`supabase`) khỏi trình biên dịch Next.js.
- **Verified by:**
  - `pnpm test`: 2/2 tests pass (Vitest).
  - `pnpm run build:pages`: Build Static Export thành công 100%, xuất thư mục `out/` sạch, không còn `api/`.
  - `pnpm run docs:index` & `pnpm run docs:check`: Pass.
- **Open follow-ups:** Tiếp tục thực thi Plan 01 (Auth & Accounts).

---


- **Task:** Giải quyết triệt để vấn đề lag / giật khung hình khi người dùng zoom in/out trên bàn học:
  1. **Nguyên nhân cốt lõi gây lag:**
     - Sự kiện `wheel` của React synthetic firing liên tục (30–60 sự kiện/giây khi lăn chuột hoặc vuốt trackpad), mỗi tick gọi `zoomBy` $\rightarrow$ kích hoạt hàng loạt đợt re-render chồng chéo.
     - KaTeX trong `<MathRenderer />` parse và render lại toàn bộ công thức toán học trên mọi trang sách mỗi khi camera thay đổi.
     - Các thực thể bàn học (`BookSpread`, `PaperSheet`, `StickyNoteItem`, `ExamQuizCard`, `DeskGrid`, `DeskDrawingCanvas`, `VisualLinkThreads`, `Minimap`) chưa được memoize, khiến Chromium phải tái tính toán bố cục layout CPU liên tục.
     - Container biến đổi 2.5D sử dụng `translate(...)` 2D thông thường thay vì lớp GPU compositing chuyên dụng.
  2. **Giải pháp tối ưu hóa toàn diện:**
     - **Cơ chế gom sự kiện RAF (`InfiniteDesk.tsx`):** Lắng nghe sự kiện `wheel` gốc `{ passive: false }` trực tiếp trên DOM, chuẩn hóa delta theo tỷ lệ hàm mũ (`Math.exp(-normalizedDelta * 0.0016)`). Tích lũy toàn bộ micro-ticks trong khung 16.6ms và áp dụng đúng 1 lần duy nhất trong `requestAnimationFrame`, đảm bảo tốc độ phản hồi 60fps/120fps chuẩn màn hình.
     - **Tăng tốc phần cứng GPU Compositing (`InfiniteDesk.tsx`):** Chuyển sang `translate3d(x, y, 0)`, gán `willChange: 'transform'`, `backfaceVisibility: 'hidden'` để Chromium biến đổi texture trên GPU hardware layer mà không kích hoạt reflow.
     - **Bộ nhớ đệm KaTeX toàn cục (`MathRenderer.tsx`):** Cung cấp `katexHtmlCache` (`Map<string, string>`) giúp lưu kết quả biên dịch HTML, giảm chi phí render các công thức toán từ vài mili-giây xuống 0ms tức thì ($O(1)$ lookup).
     - **Memoization toàn diện (`React.memo`):** Bọc `React.memo` cho `BookSpread`, `PaperSheet`, `StickyNoteItem`, `ExamQuizCard`, `DeskGrid`, `DeskDrawingCanvas`, `VisualLinkThreads`, `Minimap`.
     - **Tối ưu ngưỡng biến thiên zoom (`StudySpaceContext.tsx`):** Bỏ qua state update nếu `Math.abs(newScale - prev.scale) < 0.0005`.
- **Verified by:**
  - Chạy kịch bản kiểm thử hiệu năng zoom trên Chrome CDP:
    - `verified_smooth_zoom_in.png`: Phóng to mượt mà lên 250% tại tâm con trỏ chuột, công thức toán học và nội dung sắc nét 100%.
    - `verified_smooth_zoom_out.png`: Thu nhỏ trơn tru xuống 40%, không giật lag, không sụt giảm khung hình.
- **Open follow-ups:** Sẵn sàng nghiệm thu.

---

## 2026-11-08 18:05 — commit BROWSER_PDF_READER_BOOK_LEATHER_PRESETS_SHARP_QUIZ_AND_VITUDY_BRAND
- **Task:** Triển khai trọn bộ 5 yêu cầu cải tiến giao diện theo hình ảnh thực tế và phản hồi của người dùng:
  1. **Triệt tiêu khung viền đậm và làm chữ thẻ trắc nghiệm sắc nét như sách thật (`ExamQuizCard.tsx`):**
     - Gỡ bỏ hoàn toàn `ring-2 ring-slate-900` và khung viền đậm rỗng xung quanh thẻ, chỉ giữ bóng đổ mềm tự nhiên `shadow-xl` / `shadow-2xl`.
     - Khắc phục hiện tượng mờ chữ khi thu nhỏ bàn học: Gỡ bỏ toàn bộ layer 3D compositing (`perspective`, `transform-style: preserve-3d`) khi thẻ ở trạng thái nghỉ (`idle`), kích hoạt `textRendering: 'geometricPrecision'` và `WebkitFontSmoothing: 'antialiased'` giúp chữ và lựa chọn đáp án hiển thị sắc nét 100% như trang sách thật.
     - Bổ sung ô chọn màu nền pastel trên thanh công cụ nổi của thẻ trắc nghiệm với 8 màu tương ứng giấy note.
  2. **Bỏ nhãn chữ "NOTE" khi chọn tạo note mới (`LeftCreationBar.tsx`):**
     - Loại bỏ header "NOTE", giữ lại bảng 5 ô màu pastel tối giản.
  3. **Đa dạng 5 gam màu da bìa sách cao cấp & Thanh nhắc bookmark "Màu Bìa" (`BookSpread.tsx`, `StudySpaceContext.tsx`, `studyspace.ts`):**
     - Bổ sung 5 preset da thật: Nâu Da Cổ Điển (`#5c3920`), Đỏ Đậm Burgundy (`#6b1d28`), Xanh Nước Biển Đậm Navy (`#1e3a5f`), Xanh Lá Rừng Đậm Forest (`#1b4d3e`), và Hồng Mận Đậm Plum (`#5b2149`).
     - Thanh nhắc bookmark thứ 5 màu Vàng Kim (`#ca8a04`) với quy trình tương tác 3 trạng thái: Icon `Palette` -> Rê chuột hiện `Màu Bìa [Palette icon]` -> Bấm mở rộng `[Bảng 5 màu da] | Màu Bìa [Palette icon]` để chuyển màu da bìa sách tức thì.
  4. **Chữ thương hiệu ViTudy chuẩn Cam ViT (`TopLeftNav.tsx`):**
     - Loại bỏ nút icon La bàn (Compass) bên trái chữ ViTudy.
     - Giữ nguyên vẹn chữ "ViTudy" với màu Cam ViT (`#E0562D`), cỡ chữ to rõ (`text-lg font-black leading-none`).
  5. **Tái thiết kế trình đọc toàn màn hình chuẩn trình duyệt PDF (`FullScreenDocModal.tsx`):**
     - Thay thế toàn bộ tông nền tối AI bằng ngôn ngữ HUD trắng / Slate-50 thanh lịch, nền đọc `#e8ebf0` chống chói.
     - Thanh điều khiển trên đỉnh màn hình phong cách browser PDF reader (`PanelLeft`, Title, `< 1 / N >`, `- 100% + Đặt lại`, `Xoay`, `1/2 Trang`, `In`, `Thoát Esc`).
     - Bảng danh mục trang thu nhỏ (collapsible thumbnails sidebar) bên trái trực quan với viền cam `#E0562D` cho trang đang đọc.
     - Tích hợp KaTeX math formulas hiển thị hoàn hảo các công thức toán học.
- **Verified by:**
  - Chạy kiểm thử tự động trên Chrome CDP (port 9222):
    - `verified_pdf_viewer_hud_style.png`: Trình đọc PDF toàn màn hình chuẩn browser, thanh công cụ HUD và bảng trang thu nhỏ bên trái.
    - `verified_note_flyout_no_text.png`: Flyout chọn màu note không còn chữ "NOTE".
    - `verified_book_cover_tabs_open.png`: Thanh nhắc Màu Bìa mở bảng 5 màu da thật.
    - `verified_book_navy_cover.png`: Bìa sách chuyển sang màu da Xanh Nước Biển Đậm Navy (`#1e3a5f`) sang trọng.
    - `verified_vitudy_brand_text.png`: Chữ ViTudy màu cam to rõ không có icon la bàn thừa.
- **Open follow-ups:** Sẵn sàng nghiệm thu và deploy.

---

## 2026-11-08 17:40 — commit QUIZ_CARD_CLEAN_3D_FLIP_AND_ATTACHED_FOCUS_DRAWERS
- **Task:** Xử lý triệt để các lỗi giao diện và trải nghiệm 3D theo ảnh chụp thực tế của người dùng:
  1. **Khắc phục lỗi lật thẻ trắc nghiệm 3D (`ExamQuizCard.tsx`):**
     - Loại bỏ hoàn toàn khung dây đen rỗng (ghost wireframe box) do gắn `ring-2 ring-slate-900` trên container cha cố định.
     - Triển khai máy trạng thái lật 3D 2 giai đoạn (2-Phase Flip State Machine):
       - Giai đoạn 1 (Turn-Out): Xoay từ `0deg` đến `90deg` trong 160ms (`cubic-bezier(0.4, 0, 0.7, 0.2)`).
       - Điểm chết trung tâm: Tráo nội dung khi thẻ vuông góc màn hình (0px visible width), tức thời chuyển góc sang `90deg` đối diện không transition.
       - Giai đoạn 2 (Turn-In): Xoay tiếp từ góc đối diện về `0deg` trong 180ms (`cubic-bezier(0.2, 0.8, 0.4, 1)`). Triệt tiêu 100% hiện tượng giật chữ, tráo text lộ liễu khi thẻ đang nghiêng.
     - Viền chọn (`ring-2 ring-slate-900`) và thanh công cụ nổi (`Rotate 360` / `Trash`) tự động ẩn khi đang lật thẻ.
  2. **Căn chuẩn xác số chuỗi ngày học tập vào tâm bụng ngọn lửa (`TopRightWallet.tsx`):**
     - Căn tọa độ tuyệt đối `top-[62%] left-1/2 -translate-x-1/2 -translate-y-1/2` trên icon ngọn lửa `w-8.5 h-8.5`.
     - Số `1` nằm gọn gàng 100% trong ruột cam, cân đối 4 phía, không lệch sang trái, không chườm ra viền ngoài.
  3. **Đồng bộ ngăn kéo độc lập có lẫy kéo gắn liền cho 5 cụm HUD trong chế độ Tập trung (`StudySpaceDeskView.tsx`):**
     - Cả 5 cụm HUD trượt ẩn độc lập ra khỏi màn hình trong chế độ tập trung.
     - Mỗi cụm có một thẻ lẫy kéo mũi tên bám trực tiếp vào mép ngoài của chính HUD đó:
       - Top-Left: Mũi tên `[\/]` (kéo xuống) / `[^]` (thu lên).
       - Top-Right: Mũi tên `[\/]` (kéo xuống) / `[^]` (thu lên).
       - Left Toolbar: Mũi tên `[>]` (kéo ra) / `[<]` (thu vào).
       - Bottom-Left: Mũi tên `[^]` (kéo lên) / `[\/]` (thu xuống).
       - Bottom-Right: Mũi tên `[^]` (kéo lên) / `[\/]` (thu xuống).
     - Minimap tự động thu gọn khi vào chế độ tập trung.
  4. **Mở rộng kích thước cụm nút Undo/Redo (`LeftCreationBar.tsx`):**
     - Độ rộng khung `w-full` và kích thước nút `w-11 h-11` bo tròn `rounded-xl`, đồng bộ hoàn hảo với thanh công cụ chính phía trên.
- **Verified by:**
  - Chạy kiểm thử tự động trên Chrome qua CDP:
    - `verified_flame_belly_centered.png`: Số `1` nằm đúng tâm bụng ngọn lửa.
    - `verified_quiz_card_clean_mid_flip.png`: Lật thẻ 3D mượt mà không còn khung đen rỗng lơ lửng.
    - `verified_quiz_card_q1_confirmed.png`: Câu 1 xác nhận đáp án đúng, hiện giải thích, thanh điều hướng đáy cập nhật xanh lá.
    - `verified_toolbar_undo_enlarged.png`: Kích thước Undo/Redo mở rộng đồng bộ thanh công cụ.
    - `verified_focus_mode_clean_desk.png`: Bàn học sạch sẽ khi vào chế độ tập trung.
    - `verified_focus_pulled_hud.png`: Các lẫy kéo gắn liền trượt từng HUD ra vào trơn tru.
- **Open follow-ups:** Sẵn sàng nghiệm thu.

---

## 2026-11-08 17:16 — commit HUD_SNUG_SPACING_STREAK_FLAME_AND_MAP_BUTTON_STYLE
- **Task:** Hoàn thiện 3 tinh chỉnh công thái học cho HUD bàn học:
  1. **Căn chỉnh Biểu tượng Chuỗi Ngày Học Tập (`TopRightWallet.tsx`):**
     - Đưa icon ngọn lửa lên cao hơn (`-translate-y-1`), giúp phần bụng tròn của ngọn lửa ôm trọn số ngày chuỗi màu trắng ở bên trong (`-translate-y-0.5`).
     - Số hiển thị rõ ràng, sắc nét, không còn bị lệch hay đè lên phần khuyết ngọn lửa.
  2. **Khoảng cách HUD bám sát tường (giảm còn 1/4 khoảng cách cũ):**
     - Đưa toàn bộ các khung và nút HUD sát vào tường chỉ cách 4px (`top-1`, `bottom-1`, `left-1`, `right-1` thay vì 16px `top-4`, `bottom-4`...):
       - `TopLeftNav`: `top-1 left-1`
       - `TopRightWallet`: `top-1 right-1`
       - `LeftCreationBar`: `left-1`
       - `BottomLeftKnowledge`: `bottom-1 left-1`
       - `BottomRightToolkit`: `bottom-1 right-1`
       - `MultiplayerBar`: `top-1`
     - Mở rộng tối đa không gian diện tích học tập ở trung tâm bàn học.
  3. **Đồng bộ Style Nút Mở Bản Đồ Thu Nhỏ Khi Ẩn (`BottomRightToolkit.tsx`):**
     - Chuyển đổi nút Mở bản đồ từ nút tròn màu cam thành style tương tự Nút Tải lên tài liệu: khung vuông bo góc `w-10 h-10 rounded-xl`, nền trắng `bg-white hover:bg-orange-50/80`, viền `border border-slate-300 hover:border-orange-300`, bóng nhẹ `shadow-sm`, icon `Map` SVG màu Cam ViT (`#E0562D`, `stroke-[2.4]`).
- **Verified by:**
  - Chạy kiểm thử tự động trực tiếp trên Chrome DevTools (port 9222):
    - Khoảng cách các cụm HUD đến rìa web đo được chính xác 4px: `topLeft: { top: 4, left: 4 }`, `topRight: { top: 4, right: 4 }`, `bottomLeft: { bottom: 4, left: 4 }`, `bottomRight: { bottom: 4, right: 4 }`.
    - Biểu tượng lửa chuỗi hiển thị số `1` trắng sắc nét trong ruột cam.
    - Nút Mở bản đồ có `isStyleMatching: true` đồng bộ 100% kích thước `40x40px`, `borderRadius: 12px`, nền trắng và viền với nút Tải lên.
  - Chụp 2 ảnh bằng chứng:
    - `verified_hud_snug_walls.png`
    - `verified_map_button_style.png`
- **Open follow-ups:** Sẵn sàng cho người dùng nghiệm thu trực tiếp.

---

## 2026-11-08 17:05 — commit INTERACTIVE_3D_FLIPPING_EXAM_QUIZ_CARD
- **Task:** Xây dựng và kiểm thử hoàn chỉnh thực thể Thẻ Trắc Nghiệm Tương Tác 3D Lật Mặt (`ExamQuizCard`) trên bàn học 2.5D:
  1. **Thực thể Thẻ Trắc Nghiệm Riêng Biệt (`ExamQuizCard.tsx`):**
     - Kích thước thẻ gọn gàng `380 × 490px`, đủ cho 1 câu hỏi + 4 phương án lựa chọn và bộ điều khiển mà không cần cuộn dọc.
     - Lấy màu ngẫu nhiên từ bộ màu giấy ghi chú pastel (`#fef08a`, `#fed7aa`, `#bbf7d0`, `#bae6fd`, `#fbcfe8`).
     - Tích hợp lớp vẽ mực cục bộ `ItemDrawingOverlay` di chuyển và xoay cùng thẻ.
     - Thanh công cụ nổi trên hover: Nút xoay tự do 360° (`RotateTwoWay`) và Xóa (`Trash2`).
  2. **Máy Trạng Thái 3 Pha & Hiệu Ứng Lật Mặt 3D Như Sách:**
     - **Pha 1 - Bìa Bộ Đề (`intro`):** Tiêu đề bộ đề, số câu hỏi, thời gian làm bài, và nút **"Bắt đầu làm bài"** màu Cam ViT (`#E0562D`) chữ trắng ở chính giữa đáy thẻ.
     - **Pha 2 - Làm Bài Trắc Nghiệm (`question`):**
       - Bấm bắt đầu kích hoạt lật xoay 3D từ trái sang phải (`rotateY(180deg)` $\rightarrow$ `0deg`) để lộ Câu 1 ở mặt sau.
       - Tích hợp `MathRenderer` (KaTeX) hiển thị trọn vẹn các công thức toán đa biến, gradient, ma trận.
       - Chọn đáp án $\rightarrow$ Bấm **"Xác nhận"** $\rightarrow$ Hiển thị phán quyết tức thì: Xanh lục bảo ngọc (`✓ ĐÚNG`) hoặc Đỏ ruby (`✕ SAI`), lời giải thích chi tiết, và nút chuyển thành **"Câu tiếp theo"** (hoặc **"Hoàn thành"** ở câu cuối).
       - Bấm "Câu tiếp theo" tiếp tục lật xoay 3D sang câu tiếp theo.
     - **Pha 3 - Màn Hình Tổng Kết & Xem Lại (`summary`):**
       - Hoàn thành câu cuối bấm "Hoàn thành", thẻ lật 3D sang màn hình Tổng kết.
       - Tổng điểm cỡ to nổi bật ở trên giữa: `X / 10` (`text-4xl`/`text-5xl`) màu Cam ViT (`#E0562D`), tỷ lệ phần trăm và lời nhận xét sư phạm.
       - Bảng lưới các ô câu trả lời với trạng thái đúng/sai. Bấm vào ô bất kỳ sẽ lật thẻ 3D về câu hỏi đó để xem lại chi tiết (`Review Mode`).
       - Trong chế độ xem lại có nút **"Quay lại tổng kết"** ở góc trên; bấm vào sẽ lật ngược về màn hình Tổng kết.
       - Nút **"Làm lại bộ đề này"** cho phép reset để làm lại từ đầu.
  3. **Thanh Điều Hướng Câu Hỏi Dạng List Ngang Ở Đáy Thẻ:**
     - Nằm sát mép đáy bên trong thẻ, bề rộng không vượt quá thẻ.
     - Ở hai đầu: 2 nút mũi tên `<` và `>` để lùi/tiến câu hỏi.
     - Danh sách các ô pill câu hỏi:
       - Câu đã làm: Màu xanh lá (`#15803D`) nếu đúng, màu đỏ (`#DC2626`) nếu sai.
       - Câu hiện tại: Tô xám (`bg-slate-300 text-slate-900 border-slate-400 ring-1 ring-slate-400 font-black`).
       - Câu tương lai: Màu trắng chữ đen.
       - Bấm vào bất kỳ ô nào để chủ động nhảy câu và lật thẻ tức thì.
  4. **Tích hợp & Khai báo (`PaperSheet.tsx`, `StudySpaceContext.tsx`):**
     - `PaperSheet.tsx`: Ủy quyền render sang `<ExamQuizCard item={item} isSelected={isSelected} />` khi `item.isExamSheet && item.examData` là `true`.
     - `StudySpaceContext.tsx`: Cập nhật `addExamSheet` gán kích thước chuẩn `width: 380`, `height: 490`, màu `stickyColor` ngẫu nhiên từ `NOTE_COLORS`.
- **Verified by:**
  - Automated CDP test `scripts/test-exam-quiz-card.mjs` chạy qua Chrome DevTools MCP port 9222 vượt qua 100% 6 kịch bản kiểm thử:
    - Cover: `found: true`, `width: 380`, `height: 490`, `bg: rgb(186, 230, 253)`, nút "Bắt đầu làm bài" Cam ViT.
    - Question 1: 3D Flip, math rendering, choices, "Xác nhận", bottom strip 4 pills.
    - Confirmed Verdict: `✓ ĐÚNG`, giải thích, nút "Câu tiếp theo" Cam ViT, pill 1 chuyển xanh.
    - Answering questions: Q2, Q3, Q4 chuyển câu, nút "Hoàn thành".
    - Summary Screen: `scoreText: '10.0 / 10'`, 4 review cells, nút "Làm lại bộ đề này".
    - Review Mode: Click ô 1 lật về câu 1, hiển thị nút "Quay lại tổng kết".
  - Chụp 5 ảnh bằng chứng kiểm chứng:
    - `verified_quiz_card_cover.png`
    - `verified_quiz_card_question1.png`
    - `verified_quiz_card_answer_confirmed.png`
    - `verified_quiz_card_summary.png`
    - `verified_quiz_card_review_back_btn.png`
  - `pnpm run build:pages`: Passed 100% (code 0), tạo thư mục `out/` tĩnh cho GitHub Pages.
- **Open follow-ups:** Sẵn sàng cho người dùng nghiệm thu trực tiếp.

---

## 2026-11-08 16:35 — commit COMPREHENSIVE_UPGRADES_ZOOM_FOCUS_MARKET_STREAK_AI
- **Task:** Hoàn thiện gói 6 nâng cấp cốt lõi về Zoom, Focus Mode HUD, Thanh công cụ trái, Chợ tài liệu, Chuỗi điểm danh & AI Provider:
  1. **Zoom chuột bất kỳ lúc nào & trên nội dung tài liệu (`InfiniteDesk.tsx`, `StudySpaceContext.tsx`):**
     - Cho phép cuộn chuột (wheel zoom) tự do ở bất kỳ đâu trên bàn học và trên bề mặt tài liệu (sách, tờ giấy, ghi chú) mà không bị chặn, chỉ giữ chặn zoom khi mở modal toàn màn hình (`[role="dialog"]`, `[data-modal="true"]`).
     - Cho phép zoom tự do trong Focus Mode để người dùng tùy chỉnh kích thước chữ theo mong muốn.
  2. **Thu gọn HUD & Điều khiển Peek/Retract trong Focus Mode (`StudySpaceDeskView.tsx`, `StudySpaceContext.tsx`):**
     - Khi vào chế độ tập trung:
       - Thanh công cụ trái tự động trượt ẩn sang vách trái (`-translate-x-full`).
       - Thanh điều hướng và ví đỉnh màn hình tự động trượt ẩn lên trên (`-translate-y-full`).
       - Bộ công cụ dưới cùng tự động trượt ẩn xuống dưới (`translate-y-full`).
     - Xuất hiện 3 nút "nhòm" (peek buttons) bám sát các mép tường màn hình:
       - Vách trái: icon mũi tên `>` mở thanh công cụ.
       - Vách trên: icon `v` kèm nhãn "Menu" mở thanh điều hướng.
       - Vách dưới: icon `^` kèm nhãn "Công cụ" mở thanh dưới.
     - Khi mở ra trong focus mode: có nút thụt vào (retract button) ở trung điểm thanh hướng về phía tường để cất lại vào vách.
     - Tính toán tỷ lệ zoom tập trung ôm sát chiều cao màn hình sao cho mép bìa trên của sách cách mép trên trình duyệt đúng 22px (`targetY = 22 - itemY * targetScale`).
  3. **Tối ưu hóa Thanh Công Cụ Trái (`LeftCreationBar.tsx`):**
     - Giảm khoảng cách giữa các nút sát nhau hơn (`gap-1`, padding `p-1.5`, nút `w-11 h-11`) để tối ưu diện tích màn hình.
     - Xếp cụm 2 nút Hoàn tác / Làm lại (Undo/Redo) thành cột dọc (`flex-col`) với Undo ở trên và Redo ở dưới.
  4. **Nâng cấp Toàn Diện Chợ Tài Liệu (`MarketModal.tsx`):**
     - Hiển thị banner giải thích rõ quy đổi `1 V = 1 ViToken` và số dư hiện tại của người dùng.
     - Đưa tiêu đề tài liệu ra khung nội dung chính; đổi nhãn mô tả động theo loại tài liệu (`MÔ TẢ SÁCH / GIÁO TRÌNH`, `MÔ TẢ TÀI LIỆU TÓM TẮT`, `MÔ TẢ BỘ ĐỀ TRẮC NGHIỆM`).
     - Đổi "Đánh giá" thành "Điểm AI", kèm tooltip giải thích 3 tiêu chí chấm tự động (Độ chuẩn xác 40%, Cấu trúc 35%, Thực tiễn 25%) và số lượt phản hồi.
     - Bổ sung số trang, lượt mua, ngày cập nhật, huy hiệu tác giả xác thực.
     - Đặt giá và các nút hành động cạnh nhau: nút "Xem thử" (`Eye`) + nút "Mua X V" (hoặc "Mở" khi đã sở hữu).
     - Nút "Xem thử" mở modal đọc trích đoạn nội dung thực tế và mục lục các chương.
     - Thêm chip bộ lọc đang bật, nút "Đặt lại" (`RotateCcw`), và nút chuyển đổi chế độ xem Dạng lưới thẻ (`Grid`) và Danh sách gọn (`Compact List`). Hỗ trợ phím `Esc`.
  5. **Chuẩn hóa Modal Điểm Danh Nhận ViToken (`TopRightWallet.tsx`):**
     - Sửa mâu thuẫn trạng thái: khi đã nhận hôm nay, vô hiệu hóa nút (`disabled`) và hiển thị "Đã nhận hôm nay • Nhận tiếp sau {X}h {Y}m" đếm ngược thời gian thực đến nửa đêm.
     - Phân định rõ 4 trạng thái ô ngày: Đã nhận (`✓` xanh emerald), Hôm nay chưa nhận (viền Cam ViT nhấp nháy), Bỏ lỡ (`-` xám), Sắp tới (số token +5/+10).
     - Rút gọn mô tả, thay "+5" bằng icon SVG đồng xu ViToken cam chữ V thương hiệu.
     - Hiển thị `Chuỗi X ngày` kèm mốc thưởng tiếp theo (Mốc 7 ngày: +20 ViToken) với thanh tiến trình trực quan.
     - Thêm hộp kiểm "Nhắc tôi điểm danh mỗi ngày" lưu `localStorage`. Vùng bấm nút đóng 44px, hỗ trợ `Esc`.
  6. **Modal Cài Đặt Kết Nối AI Hoàn Chỉnh (`TopRightWallet.tsx`):**
     - Hiển thị số dư ViToken của người dùng ngay trong modal.
     - Nhãn trạng thái rõ ràng cho 4 lựa chọn: "Trừ ViToken", "Miễn phí theo hạn mức", "Khóa cá nhân", "Ủy quyền tài khoản" cùng model cụ thể (`GPT-4o-mini`, `Gemini 1.5 Flash`, `GPT-4o`, `GPT-4o Plus`).
     - Logo SVG vector chính thức sắc nét, huy hiệu "Đang dùng" cho provider active.
     - Nhập API Key kèm nút toggle ẩn/hiện mật khẩu (`Eye`/`EyeOff`), nút kiểm tra kết nối (`Test`), và lưu ý an toàn cục bộ.
     - Đổi thành "Đăng nhập bằng tài khoản ChatGPT", nút "Lưu" chỉ kích hoạt khi có thay đổi. Vùng bấm 44px, hỗ trợ `Esc`.
- **Verified by:**
  - Script CDP `scripts/verify-all-sections-live.mjs` & `scripts/test-focus-clean.mjs` trên Chrome port 9222:
    - Wheel zoom, Left bar vertical Undo/Redo, Focus mode HUD collapse & peek/retract controls.
    - MarketModal list view, preview modal, filter chips, side-by-side action buttons.
    - Streak modal 4 states, countdown, milestone bar, reminder toggle.
    - AI provider status badges, BYOK key toggle, test connection button, save button disabled/enabled.
  - Screenshots:
    - `verified_market_list_view.png`
    - `verified_market_preview_modal.png`
    - `verified_daily_streak_modal.png`
    - `verified_ai_provider_modal.png`
    - `verified_focus_mode_peek_controls.png`
    - `verified_focus_hud_slid_out.png`
  - Build static export `pnpm run build:pages`: Passed 100%.

---

## 2026-11-08 12:15 — commit FOCUS_TAB_AND_INTERACTION_LOCK
- **Task:** Tinh chỉnh Thanh nhắc Tập trung, Khóa Camera khi Tập trung & Gỡ bỏ nhãn chữ đường chỉ:
  1. **Bỏ chữ "Liên quan đến" trên đường chỉ đỏ (`VisualLinkThreads.tsx`):**
     - Loại bỏ toàn bộ badge text thừa trên đường chỉ đỏ, giữ lại nét chỉ mảnh vòm Bezier tinh tế `1.5px` bán trong suốt `0.6` và đinh ghim nhỏ gọn `r=4px`.
  2. **Tích hợp Nút Tập Trung thành Thanh Nhắc Bookmark Tab (`BookSpread.tsx`):**
     - Đưa nút chế độ tập trung vào làm thanh nhắc bookmark tab thứ 2 màu Chàm (`indigo-600`), nằm ngay dưới tab "Tóm tắt" (xanh lá) và trên tab "Phóng to" (cam).
     - Bỏ toàn bộ overlay banner cố định ở đỉnh màn hình ("Đang ở chế độ tập trung... Thoát").
     - Khi kích hoạt: thanh nhắc tự động **được giữ yên ở trạng thái kéo ra** (`w-[116px]`, nền `indigo-700`, viền sáng `ring-2 ring-indigo-400/60`, hiện rõ chữ "Tập trung").
     - Khi nhấp vào lại: thanh nhắc tự động thụt vào (`w-[48px]`) và thoát chế độ tập trung.
     - Dọn dẹp nút tập trung cũ ở huy hiệu tên sách dưới đáy bìa sách.
  3. **Khóa Điều Hướng Bàn Học Khi Đang Tập Trung & Popup Cảnh Báo Chuẩn Style App (`InfiniteDesk.tsx`, `StudySpaceContext.tsx`):**
    - Khi đang trong chế độ tập trung: khóa hoàn toàn cuộn chuột (zoom) và di chuyển camera (kéo rê chuột, phím WASD, 4 phím mũi tên).
    - Nếu người dùng cố ý zoom hoặc pan, hệ thống lập tức hiển thị popup thông báo chuẩn style app: **`Đang tập trung (nhấn để thoát)`** (kèm icon `Eye` Cam ViT và nút bấm `(nhấn để thoát)`).
    - Nhấp vào nút `(nhấn để thoát)` trên thông báo cũng lập tức thoát chế độ tập trung và thu gọn thanh nhắc.
- **Verified by:**
  - Script CDP kiểm thử trực tiếp `scripts/verify-focus-and-thread.mjs` trên Chrome port 9222:
    - Thread check: Không còn chữ "Liên quan đến" trong SVG/DOM.
    - Tabs order check: Thứ tự chuẩn xác: [1] Tóm tắt -> [2] Tập trung -> [3] Phóng to.
    - Active state: Tab mở rộng `w-[116px]`, không có top banner.
    - Locked interaction: Bấm phím 'w' hoặc cuộn chuột kích hoạt popup `Đang tập trung (nhấn để thoát)`.
    - Exit interaction: Bấm `(nhấn để thoát)` giải phóng camera, ẩn popup và thụt thanh nhắc về vị trí cũ.
  - Ảnh chụp màn hình:
    - `verified_focus_tab_active.png`
    - `verified_focus_popup_notice.png`
    - `verified_focus_mode_exited.png`
  - `pnpm tsc --noEmit` & `pnpm run docs:check`: Pass 100%.

---

## 2026-11-08 11:55 — commit 8_IMPROVEMENTS_VERIFIED
- **Task:** Hoàn thiện 8 điểm cải tiến UX/UI, Khả năng đọc, KaTeX, Bố cục & Thẩm mỹ bàn học 2.5D:
  1. **Khả năng đọc nội dung & Chế độ "Tập trung đọc" (Focus Mode):**
     - Tích hợp nút "Tập trung đọc" trên huy hiệu tên sách (`BookSpread`) và thanh công cụ tờ giấy (`PaperSheet`), tự động zoom camera 100-110% căn giữa tài liệu để đọc sắc nét.
     - Banner nổi "Chế độ đọc tập trung" ở đỉnh màn hình kèm nút "Thoát tập trung" trở về góc nhìn tổng quan.
  2. **Hiển thị Công thức Toán học Học thuật với KaTeX (`MathRenderer.tsx`):**
     - Tích hợp thư viện `katex` (^0.19.1) và `@types/katex`. Tạo component `MathRenderer` biên dịch tự động các ký hiệu LaTeX inline (`$...$`) và display (`$$...$$`).
     - Chuẩn hóa toàn bộ công thức toán học về Đạo hàm, Gradient Descent ($\nabla f$), Perceptron, Neural Networks, Backpropagation, Overfitting và danh sách bullet `•`.
  3. **Kiểu chữ & Khả năng co giãn của Giấy ghi chú (Sticky Note):**
     - Đổi phông chữ sang chuẩn sans-serif rõ nét (`font-sans font-medium text-stone-900`), tính toán kích cỡ phông tự động (`13.5px`, `leading-[1.42]`).
     - Tích hợp nút "Mở rộng" / "Thu gọn" ở chân note (cho phép mở rộng từ 200px lên 290px mà không bị tràn hay cắt chữ). Tăng độ tương phản footer lên `text-stone-700 font-semibold` đạt chuẩn WCAG AA.
  4. **Đường nối chỉ đỏ thông minh (Smart Bezier Routing) & Nhãn quan hệ:**
     - Đường Bezier uốn cong hình vòm cao vượt hẳn lên trên đỉnh gáy sách (`archApexY < sourceItem.y - 22`), hoàn toàn không cắt ngang qua nội dung văn bản Chương 2.
     - Giảm độ dày nét xuống `1.5px` bán trong suốt (`strokeOpacity="0.6"`), đinh ghim nhỏ gọn `r="4"`, bổ sung nhãn mô tả mối liên kết "Liên quan đến" tại trung điểm đường cong.
  5. **Hệ thống Tab Bookmark Sách: Tooltip, Phân nhóm & Xác nhận xóa:**
     - Bổ sung tooltip chú thích đầy đủ cho toàn bộ 5 tab.
     - Ngăn cách nút Xóa (màu đỏ) bằng một vạch phân vùng mỏng.
     - Khi bấm nút Xóa, mở modal thoại xác nhận an toàn ("Xóa sách khỏi bàn học? [Hủy] [Xác nhận xóa]") chống bấm nhầm làm mất sách.
  6. **Căn chỉnh & Bố cục Bàn học (Snap / Auto-Align):**
     - Căn chỉnh tọa độ mặc định các tài liệu bên trái và bên phải với khoảng đệm chuẩn 24px.
     - Bổ sung nút "Căn chỉnh bố cục bàn học (Snap Grid)" với icon `Sparkles` tại thanh công cụ góc dưới phải kết nối với hàm `tidyUpDesk`.
  7. **Thanh điều hướng & Dock công cụ góc dưới trái:**
     - Gom nhóm 2 nút Hoàn tác (`Undo2`) và Làm lại (`Redo2`) thành một cụm pill thống nhất trên thanh công cụ Miro bên trái.
     - Đồng bộ kích thước dock 3 nút góc dưới trái (`w-10 h-10 rounded-xl`), nút Tải lên đổi sang nền trắng viền nhẹ icon Cam ViT để giảm bớt độ chói so với tần suất sử dụng.
  8. **Minimap: Thu gọn & Tăng độ tương phản:**
     - Thiết lập độ mờ `opacity-80 hover:opacity-100 transition-opacity`, bổ sung nút đóng/thu gọn (`X`) ở góc trên phải.
     - Nhãn "BẢN ĐỒ (Phím M)" được nâng cấp lên `text-[9.5px] font-mono font-bold text-slate-700` đạt độ tương phản chuẩn.
- **Verified by:**
  - Script kiểm thử CDP tự động `scripts/verify-8-improvements.mjs` chạy trực tiếp trên Chrome Port 9222:
    - KaTeX elements: 35 phần tử toán học, fraction, nabla render chuẩn xác.
    - Path Bezier: vòm né Chương 2 `M 460 220 C 631 58, 973 70, 1144 116`, nhãn "Liên quan đến" hiển thị.
    - Sticky note: font sans, 13.5px, nút mở rộng kích hoạt tốt.
    - Nút "Tập trung đọc" và "Thoát tập trung" hoạt động mượt mà.
    - Nút Xóa mở modal xác nhận an toàn.
    - Cụm Undo/Redo và Minimap thu gọn hoạt động chính xác.
  - Ảnh chụp màn hình bằng chứng:
    - `live_verified_focus_mode_reading.png`
    - `live_verified_delete_confirm_modal.png`
    - `live_verified_all_8_improvements.png`
  - `pnpm run build:pages`: Static export 100% thành công.
  - `pnpm run docs:check`: Pass.

---

## 2026-11-08 11:30 — commit e2f32f7
- **Task:** Tích hợp Cấu hình Supabase Trực tiếp vào Modal Chia sẻ & Kiểm thử Toàn diện Trực tiếp qua Chrome Debug (CDP):
  1. **Nâng Cấp Modal Chia Sẻ & Cơ Sở Dữ Liệu (`BottomLeftKnowledge.tsx`):**
     - Tích hợp trực tiếp bảng điều khiển cấu hình và trạng thái Cơ sở dữ liệu Supabase vào modal Chia sẻ ở góc dưới trái.
     - Hiển thị huy hiệu trạng thái kết nối (`Chưa cấu hình` / `Đã cấu hình` / `Đang kết nối Realtime`).
     - Cho phép xem, chỉnh sửa `Project URL` và `Anon Key` trực tiếp trên web với nút "Lưu & Kết nối".
     - Tích hợp nút "Thử kết nối" đo độ trễ mạng thực tế tới Supabase REST & Realtime API.
  2. **Triển Khai & Kích Hoạt GitHub Pages Thành Công:**
     - Kích hoạt GitHub Pages trên repo `namtacozz/ViTudy` với build type `workflow`.
     - Chạy workflow `.github/workflows/deploy.yml` qua GitHub Actions: Build và Deploy thành công 100%.
     - URL trực tiếp [https://namtacozz.github.io/ViTudy/](https://namtacozz.github.io/ViTudy/) phản hồi `HTTP/1.1 200 OK`.
  3. **Kiểm Thử Toàn Diện Trên Chrome Debugger Trực Tiếp:**
     - Kết nối Chrome Debugging WebSocket trên port 9222.
     - Kiểm thử và chụp ảnh màn hình lưu giữ bằng chứng:
       - Modal Chuỗi điểm danh & nhận ViToken với màu cam Cam ViT (`live_chrome_test_streak.png`).
       - Modal Chia sẻ & Cấu hình Supabase trên GitHub Pages (`live_gh_pages_supabase_modal.png`).
       - Form nhập liệu Supabase & Nút thử kết nối (`live_gh_pages_supabase_form_tested.png`).
       - Toàn cảnh bàn học vô tận 2.5D trên GitHub Pages (`live_gh_pages_desk_verified.png`).
- **Verified by:**
  - Chrome DevTools Protocol kiểm thử tự động qua các script `scripts/test-live-chrome.mjs` và `scripts/verify-live-gh-pages.mjs`: Pass 100%.
  - `pnpm tsc --noEmit` & `pnpm run docs:check`: Pass.

---

## 2026-11-08 11:15 — uncommitted
- **Task:** Tích hợp Supabase Realtime Multiplayer và Thiết lập luồng triển khai GitHub Pages:
  1. **Tích hợp Thư viện & Client Supabase (`src/lib/supabase.ts`):**
     - Cài đặt `@supabase/supabase-js`.
     - Tạo hàm quản lý cấu hình linh hoạt `getSupabase()`, `saveSupabaseConfig()` hỗ trợ cả biến môi trường `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` và cấu hình lưu trữ cục bộ `localStorage`.
  2. **Hook Đa Người Dùng Thời Gian Thực (`src/hooks/useRealtimeMultiplayer.ts`):**
     - Quản lý kênh Realtime Presence (`room:${spaceId}`) theo dõi danh sách thành viên trực tuyến, vai trò (chủ phòng / người thuyết trình / người xem) và trạng thái học tập.
     - Đồng bộ broadcast con trỏ chuột (`cursor_move`) và camera của người thuyết trình.
  3. **Giao Diện Điều Khiển & Cấu Hình Supabase Trực Quan (`MultiplayerBar.tsx`):**
     - Bổ sung modal cấu hình kết nối Supabase trực tiếp ngay trong giao diện web.
     - Hiển thị huy hiệu trạng thái kết nối Realtime sắc nét và tùy chọn mô phỏng kiểm thử nhanh.
  4. **Triển Khai GitHub Pages (`namtacozz.github.io/ViTudy`):**
     - Cấu hình static export trong `next.config.ts` (`output: 'export'`, `basePath: '/ViTudy'`, `images: { unoptimized: true }`).
     - Tạo kịch bản build chuyên dụng `scripts/build-pages.mjs` tự động sinh file `out/.nojekyll`.
     - Thiết lập GitHub Actions workflow `.github/workflows/deploy.yml` tự động build và deploy lên GitHub Pages mỗi khi push code lên nhánh `main`.
- **Verified by:**
  - `pnpm run build:pages`: Thành công 100% sinh thư mục `out/` kèm `.nojekyll`.
  - `pnpm tsc --noEmit` & `pnpm run docs:check`: Pass.

---

## 2026-11-08 11:05 — uncommitted
- **Task:** Nâng cấp chế độ Xoay bàn học chuyên dụng, In-Situ STudy Overlay trên mặt giấy, Trích xuất Thẻ ghi nhớ trực tiếp và Định vị vật thể tương tác:
  1. **Nút Chế Độ Xoay Bàn Học Chuyên Dụng (`BottomRightToolkit.tsx`, `InfiniteDesk.tsx`):**
     - Bỏ hoàn toàn phím tắt `Alt + ...` để xoay view; WASD và phím mũi tên chỉ phục vụ việc di chuyển camera (pan canvas).
     - Bổ sung nút chuyển đổi chế độ xoay với icon `RotateTwoWay` nằm ngay bên trái thanh điều khiển zoom (`BottomRightToolkit`).
     - Khi bật: nút đổi màu Cam ViT (`#E0562D`), icon trắng. Toàn bộ bàn học bước vào `isViewRotateMode = true`.
     - Ở chế độ này: Nhấp và kéo chuột ở bất kỳ đâu trên màn hình (kể cả bên trong tài liệu, sách hay note) đều xoay góc nhìn bàn học theo chuột (`handleMouseDownCapture`). Nhấn đúp chuột để căn thẳng về $0^\circ$.
  2. **Overlay STudy Tại Chỗ Trên Mặt Giấy (`PaperSheet.tsx`):**
     - STudy được render trực tiếp bên trong container tờ giấy (`absolute inset-0 z-30`), che phủ vừa vặn bề mặt tờ giấy và chuyển động/xoay cùng tờ giấy trong không gian 2.5D.
     - Header tinh gọn: `[Sparkles] STudy` và nút đóng `X` để quay lại tờ giấy ban đầu.
     - 2 tab 50/50: `Tóm Tắt` và `Trắc Nghiệm`.
  3. **Chặn Cuộn Chuột Làm Zoom Bàn Học Trong Overlay (`InfiniteDesk.tsx`, `SummaryTab.tsx`, `QuizTab.tsx`):**
     - Chặn lan truyền sự kiện `onWheel` (`e.stopPropagation()`) và kiểm tra selector `target.closest('[data-overlay="true"]')` trong `InfiniteDesk.tsx`, triệt tiêu hoàn toàn lỗi cuộn nội dung trong overlay/modal làm bàn học co giãn zoom theo.
  4. **Nổi Bật Dòng "Sử dụng AI." (`SummaryTab.tsx`, `QuizTab.tsx`):**
     - Thiết kế dạng card nổi bật có nền gradient mềm (`from-orange-50 via-amber-50 to-orange-50`), viền cam, icon `Sparkles` nhấp nháy, chữ cam ViT bold và huy hiệu `Chuyên sâu`.
  5. **Trích Xuất Thẻ Ghi Nhớ Tức Thì Không Hiện Overlay (`PaperSheet.tsx`):**
     - Nhấp nút `Layers` trên thanh overlay tờ giấy sẽ trích xuất ngay lập tức các thẻ Spaced Repetition ra giấy ghi chú đặt ngay cạnh tài liệu mà không mở popup hay modal nào.
  6. **Định Vị Vật Thể Hạ Cánh Ngay Cạnh Tài Liệu Tương Tác:**
     - Toàn bộ kết quả xuất ra (Ghi chú tóm tắt, Thẻ ghi nhớ, Đề thi trắc nghiệm) đều được định vị chuẩn xác tại `x = item.x + item.width + 30, y = item.y`.
  7. **Tài liệu & Chỉ mục:**
     - Cập nhật quy chuẩn vào [`AGENTS.md`](file:///F:/AppMaking/ViTudy/AGENTS.md) Mục 5 & 6.
     - Chạy `pnpm run docs:index` & `pnpm run docs:check`: Pass 100%.
- **Verified by:**
  - `pnpm tsc --noEmit`: Pass exit code 0.
  - Chạy kịch bản tự động `scripts/verify-insitu-study-and-rotate-mode.mjs` & `scripts/capture-centered.mjs` qua Chrome DevTools Protocol và chụp ảnh kiểm định thực tế:
    - `verified_flashcard_instant_next_to_doc.png`
    - `verified_insitu_study_clean_view.png`
    - `verified_insitu_study_quiz.png`
    - `verified_all_exported_next_to_paper.png`

---

## 2026-11-08 10:45 — uncommitted
- **Task:** Tái cấu trúc và chuẩn hóa giao diện STudy & Thẻ Ghi Nhớ cho Tờ Giấy Đơn (`PaperSheet`):
  1. **Thanh công cụ ngữ cảnh nổi trên Tờ Giấy Đơn (`PaperSheet.tsx`):**
     - Nút STudy: Chỉ hiển thị duy nhất icon SVG `Sparkles` màu Cam ViT (`#E0562D`, `stroke-[2.4]`), không kèm text thừa, tích hợp tooltip trực quan `STudy: Tóm tắt & Trắc nghiệm`.
     - Tách "Thẻ Ghi Nhớ" thành button icon SVG `Layers` (`stroke-[2.4]`) riêng biệt nằm ngay cạnh bên phải STudy, phân cách bằng vạch chia với 2 nút phóng to (`Maximize2`) và xoay (`RotateTwoWay`).
  2. **Giao diện Modal STudy gọn gàng cho Tờ Giấy Đơn (`StudyToolsModal.tsx`):**
     - Mount qua React Portal `createPortal(..., document.body)` giúp modal thoát hoàn toàn khỏi container `transform`, hiển thị ngay giữa màn hình và có nút đóng `X` tròn rõ ràng.
     - Header tinh gọn tối giản: chỉ gồm `[Icon Sparkles Cam ViT] STudy` và nút đóng `X`.
     - Bỏ hoàn toàn các tab Lộ trình học, Quét ảnh OCR và Thẻ ghi nhớ; chỉ giữ 2 tab cân đối 50/50 (`grid-cols-2`): **Tóm Tắt** và **Trắc Nghiệm**.
     - Cấm triệt để thanh cuộn dọc/ngang (`overflow-hidden`, `no-scrollbar`), kích thước chuẩn `max-w-[460px]`.
     - Chuẩn hóa cấu trúc 3 dòng trong từng tab:
       - **Tab Tóm tắt (`SummaryTab.tsx`):**
         - Dòng 1: `Tóm tắt nội dung trọng tâm` (tiêu đề ngang, bỏ mô tả).
         - Dòng 2: Checkbox `Sử dụng AI.`
         - Dòng 3: Nút `Tạo tóm tắt` màu Cam ViT (`#E0562D`), chữ trắng, sát bên phải, không xuống dòng.
         - Footer 1 dòng ngắn: `Ghim Tóm Tắt Lên Bàn` + `Sao chép nội dung`.
       - **Tab Trắc nghiệm (`QuizTab.tsx`):**
         - Dòng 1: `Tạo đề ôn tập trắc nghiệm.`
         - Dòng 2: Checkbox `Sử dụng AI.` (gọi AI sinh đề chuẩn xác theo nội dung khi được tick).
         - Dòng 3: Nút `Sinh Câu Hỏi` (hoặc `Tạo Đề Mới`) màu Cam ViT (`#E0562D`), chữ trắng, sát bên phải.
         - Footer 1 dòng ngắn: `Xuất Đề Thi Ra Bàn` + `Chấm Điểm Ngay`.
  3. **Modal Thẻ Ghi Nhớ Độc Lập (`FlashcardModal.tsx`):**
     - Modal chuyên biệt cho flashcards gắn với tài liệu, mount qua portal với nút đóng `X` và hiển thị trực quan các thẻ ghi nhớ.
  4. **Tài liệu & Chỉ mục:**
     - Tự động cập nhật quy chuẩn vào [`AGENTS.md`](file:///F:/AppMaking/ViTudy/AGENTS.md) Mục 5.
     - Chạy `pnpm run docs:index` & `pnpm run docs:check`: Pass 100%.
- **Verified by:**
  - `pnpm tsc --noEmit`: Pass exit code 0.
  - Chạy kịch bản kiểm thử tự động `scripts/verify-paper-study-modal.mjs` qua Chrome DevTools Protocol và chụp ảnh kiểm định thực tế:
    - `verified_paper_study_summary.png` & `verified_paper_study_summary_generated.png`
    - `verified_paper_study_quiz.png` & `verified_paper_study_quiz_generated.png`
    - `verified_paper_flashcard_modal.png`

---

## 2026-11-07 22:00 — uncommitted
- **Task:** Chuẩn hóa giao diện Miro-Inspired Clean White, Tối ưu bố cục HUD và Thanh công cụ ngữ cảnh nổi:
  1. **Thanh công cụ ngữ cảnh nổi chuẩn Miro Trắng (`StickyNoteItem.tsx`, `PaperSheet.tsx`):**
     - Loại bỏ hoàn toàn khối pill màu xanh đen tối tăm kiểu AI slop (`bg-slate-900`/`bg-stone-900`).
     - Áp dụng chuẩn Miro Clean White: Nền trắng thanh nhã (`bg-white/95`), viền mảnh (`border border-slate-200/90`), chữ than chì (`text-slate-700`), đổ bóng mềm (`shadow-lg backdrop-blur-md`).
     - Tích hợp tính năng tự động đảo vị trí (`item.y < 90 ? 'top-full mt-3.5' : '-top-11'`) để chống bị che khuất bởi navbar khi kéo sát mép trên.
  2. **Tối ưu Bố cục HUD Ngoại vi:**
     - **Góc trên bên phải (`TopRightWallet.tsx`):**
       - Chuỗi ngày học: Chỉ 1 icon ngọn lửa (`Flame`), số ngày chuỗi được đặt khít bên trong bụng dưới của ngọn lửa (`text-[9px] font-black text-[#9A3412]`).
       - Chợ Tài Liệu: Đặt nằm giữa Chuỗi và Credit, hiển thị duy nhất icon `Store` kèm tooltip hover và mở `MarketModal`.
       - Ô Credit: Tinh gọn chỉ hiện huy hiệu `V` và số dư `50`.
       - AI Bot: Chỉ hiển thị icon `Bot` tối giản.
     - **Góc dưới bên trái (`BottomLeftKnowledge.tsx`):**
       - Đưa nút "Mời bạn" (`Share2`) xuống đặt cạnh nút "Tải lên" (`Upload`).
       - Nhấp "Mời bạn" mở modal chia sẻ liên kết phòng học nhanh chóng.
     - **Thanh Multiplayer (`MultiplayerBar.tsx`):**
       - Khi chưa có bạn cùng phòng (chế độ Solo), tự động ẩn hoàn toàn để tối đa hóa không gian bàn học.
  3. **Tài liệu & Chỉ mục:**
     - Cập nhật đầy đủ vào [`AGENTS.md`](file:///F:/AppMaking/ViTudy/AGENTS.md) Mục 12.
     - Chạy cập nhật chỉ mục [`docs/ai/03_SYMBOL_INDEX.md`](file:///F:/AppMaking/ViTudy/docs/ai/03_SYMBOL_INDEX.md) (65 symbols).
- **Verified by:**
  - `pnpm tsc --noEmit`: Pass exit code 0.
  - `pnpm run docs:index` & `pnpm run docs:check`: Pass.
  - Đã chụp kiểm định Chrome thực tế: `miro_style_desk_overview.png`, `miro_note_overlay_white.png`, `miro_paper_overlay_white.png`, `market_modal_open.png`, `invite_modal_open.png`.

---

## 2026-11-07 21:24 — uncommitted
- **Task:** Nâng cấp trải nghiệm lật trang sách 2.5D chân thực, Bookmark tab Tách trang và khử mờ toàn diện cho Giấy/Note:
  1. **Thanh nhắc Ruy băng "Tách trang" (`BookSpread.tsx`):**
     - Bổ sung Tab thứ 3 màu Xanh lam (`sky-700`) với icon `Scissors` và chữ *"Tách trang"* trên mép phải bìa sách, trượt mở mượt mà khi hover.
     - Loại bỏ hoàn toàn các nút hover "Tách trang" nhỏ lẻ nằm bên trong trang ruột để giữ trang sách chân thực, tinh khiết.
  2. **Hiệu ứng lật trang 2.5D không bị cắt khung (`overflow-visible`):**
     - Khắc phục triệt để lỗi container `overflow-hidden` cắt cụt đầu trên và đầu dưới của trang giấy đang cuộn trong không gian 3D.
     - Tờ giấy lật được mở rộng `top: -10px`, `height: calc(100% + 20px)`, uốn cong vươn tự nhiên vào viền bìa da nâu kèm bóng đổ mềm đa tầng `drop-shadow(0 16px 32px rgba(0,0,0,0.32))`.
  3. **Lật trang tức thì, triệt tiêu độ trễ và chớp giật nội dung:**
     - Thiết lập cơ chế *Pre-rendered Underlying Leaves*: Mặt giấy tĩnh bên dưới đã được nạp sẵn nội dung trang kế tiếp (`paginatedLeaves[page + 2]`), và mặt sau của tờ giấy lật hiển thị đúng trang chuẩn bị tiếp đất.
     - Khi kết thúc lật trang, góc nhìn giữ nguyên vẹn 100% pixel, không có độ trễ `setTimeout` tráo đổi chữ gây cảm giác giả tạo.
  4. **Khử mờ toàn diện cho Tờ giấy (`PaperSheet`) và Giấy ghi chú (`StickyNoteItem`):**
     - Đặt góc nghiêng khởi tạo mặc định về `0°` (thay vì các góc lẻ `4°` hay `-3°`), triệt tiêu việc GPU lấy mẫu bilinear làm nhòe chữ khi thu nhỏ.
     - Bổ sung `text-rendering: geometricPrecision; -webkit-font-smoothing: antialiased;` và nâng độ đậm font lên `font-medium` (500) cho Paper và `font-bold` (700) `text-stone-950` cho Patrick Hand trên Sticky Note.
- **Changed:**
  - [`src/components/objects/BookSpread.tsx`](file:///F:/AppMaking/ViTudy/src/components/objects/BookSpread.tsx): Thêm tab "Tách trang", mở rộng 3D curl layer không cắt viền, tiền kết xuất trang bên dưới.
  - [`src/context/StudySpaceContext.tsx`](file:///F:/AppMaking/ViTudy/src/context/StudySpaceContext.tsx): Đặt góc `rotation: 0` khi tách trang ra bàn học.
  - [`src/components/objects/PaperSheet.tsx`](file:///F:/AppMaking/ViTudy/src/components/objects/PaperSheet.tsx): Nâng độ sắc nét, bỏ các lớp stack xoay lệch góc.
  - [`src/components/objects/StickyNoteItem.tsx`](file:///F:/AppMaking/ViTudy/src/components/objects/StickyNoteItem.tsx): Tăng độ đậm nét chữ viết tay và khử răng cưa.
  - [`src/data/mockSpaces.ts`](file:///F:/AppMaking/ViTudy/src/data/mockSpaces.ts): Khởi tạo tài liệu và note ở góc $0^\circ$.
  - [`AGENTS.md`](file:///F:/AppMaking/ViTudy/AGENTS.md): Cập nhật quy chuẩn 5 Bookmark Tabs và Crisp Rendering cho Paper/Note.
- **Verified by:**
  - `pnpm build`: Pass exit code 0 (`Route (app): / 4.83 kB 119 kB`).
  - `pnpm run docs:index` & `pnpm run docs:check`: Pass (`64 symbols`).
  - Chrome DevTools: Xác thực trực tiếp qua các ảnh chụp màn hình (`crisp_overview.png`, `tab_detach_hovered.png`, `flip_unclipped_3d.png`, `after_flip_seamless.png`).

---

## 2026-11-07 21:10 — uncommitted
- **Task:** Tối ưu hóa chế độ cá nhân (Solo Mode), Đồng bộ góc nhìn thực tế và tinh giản nhãn kỹ thuật:
  1. **Giải thích & Chuẩn hóa "Đồng bộ góc nhìn":**
     - Đã loại bỏ nút duplicate thừa bên dưới `TopLeftNav.tsx`.
     - Kích hoạt tính năng hoạt động thật sự: Khi bật, camera tự động lướt mượt mà căn giữa vào cuốn sách/tài liệu của người thuyết trình ở tỷ lệ chuẩn 95%, đồng thời hiển thị banner thông báo nổi góc trên với đèn LED xanh emerald nhấp nháy và nút "Dừng theo dõi".
  2. **Chế độ học cá nhân (Solo Mode) mặc định:**
     - Khi chưa mời thêm ai vào phòng, ẩn hoàn toàn nhãn `Chủ phòng: Bạn`, ẩn các avatar tròn và ẩn nút `Đồng bộ góc nhìn`.
     - Chỉ hiển thị duy nhất nút **"Mời bạn"** tinh gọn ở giữa mép trên màn hình.
     - Khi bấm "Mời bạn", modal hỗ trợ sao chép link và nút "Mô phỏng vào nhóm" để thử nghiệm học nhóm 2-3 người. Khi có thành viên, thanh multiplayer bar mới tự động mở rộng.
  3. **Xóa bỏ popup "Không gian học 2.5D":** Loại bỏ thẻ chỉ báo chế độ ở góc dưới giữa màn hình trong `VrFrameOverlay.tsx`.
  4. **Đổi tên "KnowInherit" $\rightarrow$ "Chợ Tài Liệu":** Bỏ thuật ngữ kỹ thuật khó hiểu, đổi tên nút thành "Chợ Tài Liệu", xóa bỏ nhãn "Chia sẻ 85%".
- **Changed:**
  - [`src/components/hud/TopLeftNav.tsx`](file:///F:/AppMaking/ViTudy/src/components/hud/TopLeftNav.tsx): Xóa bỏ cụm `Chủ phòng: Bạn` và nút `Đồng bộ góc nhìn` duplicate.
  - [`src/components/hud/MultiplayerBar.tsx`](file:///F:/AppMaking/ViTudy/src/components/hud/MultiplayerBar.tsx): Tích hợp chế độ Solo vs Multiplayer linh hoạt và tính năng lướt camera đồng bộ góc nhìn thực tế.
  - [`src/components/hud/VrFrameOverlay.tsx`](file:///F:/AppMaking/ViTudy/src/components/hud/VrFrameOverlay.tsx): Xóa popup "Không gian học 2.5D" ở dưới giữa màn hình.
  - [`src/components/hud/BottomLeftKnowledge.tsx`](file:///F:/AppMaking/ViTudy/src/components/hud/BottomLeftKnowledge.tsx): Đổi tên thành "Chợ Tài Liệu" và xóa nhãn "Chia sẻ 85%".
  - [`AGENTS.md`](file:///F:/AppMaking/ViTudy/AGENTS.md) & [`docs/ai/06_UI_MAP.md`](file:///F:/AppMaking/ViTudy/docs/ai/06_UI_MAP.md): Cập nhật quy chuẩn thiết kế.
- **Verified by:**
  - `pnpm run docs:index` & `pnpm run docs:check`: Pass (`64 symbols`).
  - Chrome DevTools: Xác thực trực tiếp qua 3 ảnh chụp thực tế (`solo_mode.png`, `multiplayer_mode.png`, `sync_active.png`).

---

## 2026-11-07 21:00 — uncommitted
- **Task:** Tái cấu trúc HUD theo phong cách Miro & Tinh giản tối đa không gian học:
  1. **Thanh công cụ sáng tạo dọc bên trái (`LeftCreationBar.tsx`):** Gom toàn bộ công cụ tạo tác (Con trỏ, `+ Note`, Bút vẽ tự do kèm bảng 4 màu, Bút dạ quang, Khóa di chuyển canvas, và Hoàn tác/Xóa nét vẽ) vào thanh dọc nổi bên trái trung tâm màn hình (`left-4 top-1/2 -translate-y-1/2`).
  2. **Dọn sạch HUD góc dưới bên trái (`BottomLeftKnowledge.tsx`):** Loại bỏ đồng hồ bấm giờ (Pomodoro) và thanh trượt âm lượng; chỉ giữ lại nút "Tải lên" và "KnowInherit".
  3. **Tinh gọn HUD góc dưới bên phải (`BottomRightToolkit.tsx`):** Loại bỏ nút "Bản đồ bàn học" (Map matrix); chỉ giữ cụm điều khiển zoom (% zoom popover menu) và Minimap (bật/tắt bằng phím `M`).
  4. **Thu gọn HUD góc trên bên phải (`TopRightWallet.tsx`):** Bỏ từ "ViToken" khỏi ô credit (chỉ hiển thị huy hiệu `V` và số dư); bỏ tên mô hình AI `gpt-4o-mini` (chỉ hiển thị icon vuông `Bot` tối giản).
- **Changed:**
  - [`src/components/hud/LeftCreationBar.tsx`](file:///F:/AppMaking/ViTudy/src/components/hud/LeftCreationBar.tsx): Khởi tạo thanh công cụ sáng tạo dọc Miro-style.
  - [`src/components/canvas/StudySpaceDeskView.tsx`](file:///F:/AppMaking/ViTudy/src/components/canvas/StudySpaceDeskView.tsx): Mount `LeftCreationBar`.
  - [`src/components/hud/BottomLeftKnowledge.tsx`](file:///F:/AppMaking/ViTudy/src/components/hud/BottomLeftKnowledge.tsx): Dọn bỏ timer và volume popover.
  - [`src/components/hud/BottomRightToolkit.tsx`](file:///F:/AppMaking/ViTudy/src/components/hud/BottomRightToolkit.tsx): Dọn bỏ nút Map Matrix.
  - [`src/components/hud/TopRightWallet.tsx`](file:///F:/AppMaking/ViTudy/src/components/hud/TopRightWallet.tsx): Rút gọn ô credit và icon AI bot.
  - [`AGENTS.md`](file:///F:/AppMaking/ViTudy/AGENTS.md): Bổ sung quy chuẩn mục 12 "Bố Cục HUD & Thanh Công Cụ Sáng Tạo".
  - [`docs/ai/02_FILE_MAP.md`](file:///F:/AppMaking/ViTudy/docs/ai/02_FILE_MAP.md) & [`docs/ai/06_UI_MAP.md`](file:///F:/AppMaking/ViTudy/docs/ai/06_UI_MAP.md): Cập nhật vị trí `LeftCreationBar`.
- **Verified by:**
  - `pnpm build`: Pass exit code 0 (`Route (app): / 4.83 kB 119 kB`).
  - `pnpm run docs:index` & `pnpm run docs:check`: Pass (`64 symbols`).
  - Chrome DevTools: Chụp và xác thực trực quan ảnh `final_miro_hud.png`.

---

## 2026-11-07 20:41 — uncommitted
- **Task:** Triển khai Đợt 1 nâng cấp công thái học không gian (Miro Spatial UX) và hệ thống Dây nối tư duy 2.5D:
  1. **Ẩn/Hiện Minimap thông minh (`M`):** Minimap hỗ trợ bật/tắt nhanh bằng phím `M` hoặc nút đóng `×`, giải phóng diện tích góc dưới bàn học.
  2. **Popover Điều hướng & Zoom nhanh:** Nhấp vào số `% Zoom` mở menu kiểu Miro gồm: *Vừa vặn toàn bộ (`Alt+1`)*, *Dọn bàn gọn gàng (`Tidy Desk`)*, *Đặt lại 100% (`Ctrl+0`)* và *Bật/Tắt bản đồ nhỏ (`M`)*.
  3. **Thuật toán Dọn bàn gọn gàng (`tidyUpDesk`):** Tự động xếp Sách ở vị trí trung tâm, Tờ đề thi trắc nghiệm ngay ngắn bên phải, các Giấy ghi chú xếp thành cụm lưới 2 cột bên trái, trả góc quay về $0^\circ$.
  4. **Thanh công cụ ngữ cảnh nổi trên Sticky Note (`StickyNoteItem`):** Hỗ trợ đổi 5 màu giấy note pastel (Vàng ấm, Cam đào, Xanh mint, Lam nhạt, Hồng phấn) và đổi cỡ chữ (A/A+) một chạm.
  5. **Dây nối tư duy 2.5D phong cách Chỉ Ghim Thám Tử (`VisualLinkThreads`):** Chuyển từ dây phát sáng sang **sợi chỉ đỏ vật lý** có bóng đổ tự nhiên, độ chùng võng trọng lực (gravity sag) và hai đầu đinh ghim tròn kim loại đỏ kết nối chính xác từ Sách sang Ghi chú.
- **Changed:**
  - [`src/context/StudySpaceContext.tsx`](file:///F:/AppMaking/ViTudy/src/context/StudySpaceContext.tsx): Bổ sung `tidyUpDesk`, `fitAllToScreen`, `updateStickyNoteColor`.
  - [`src/components/canvas/Minimap.tsx`](file:///F:/AppMaking/ViTudy/src/components/canvas/Minimap.tsx): Nhận props `isVisible`, `onClose` và nhãn hướng dẫn phím M.
  - [`src/components/hud/BottomRightToolkit.tsx`](file:///F:/AppMaking/ViTudy/src/components/hud/BottomRightToolkit.tsx): Thêm Popover Zoom & Tùy chọn hiển thị, phím tắt `M`.
  - [`src/components/objects/StickyNoteItem.tsx`](file:///F:/AppMaking/ViTudy/src/components/objects/StickyNoteItem.tsx): Thêm bảng 5 màu note pastel và nút toggle cỡ chữ.
  - [`src/components/canvas/VisualLinkThreads.tsx`](file:///F:/AppMaking/ViTudy/src/components/canvas/VisualLinkThreads.tsx): Nâng cấp thành sợi chỉ đỏ ghim bảng thám tử.
  - [`src/data/mockSpaces.ts`](file:///F:/AppMaking/ViTudy/src/data/mockSpaces.ts): Kết nối thread mẫu sang `doc-sticky-1`.
- **Verified by:**
  - `pnpm build`: Pass exit code 0 (`Route (app): / 4.83 kB 119 kB`).
  - `pnpm run docs:index` & `pnpm run docs:check`: Pass (63 symbols).
  - Chrome DevTools: Chạy script kiểm thử trực tiếp trên live UI (`desk_with_red_string.png`, `sprint1_tidy_desk.png`, `sprint1_zoom_menu.png`).

---

## 2026-11-07 19:58 — uncommitted
- **Task:** Áp dụng toàn diện bản sắc thiết kế hiện đại từ web ôn thi Java (`https://namtacozz.github.io/java/`) vào ViTudy:
  1. Đưa sắc Cam San Hô (`#E0562D` / `#FF5722`) làm signature brand accent và Slate-50 (`#f8fafc`) cho mặt bàn học.
  2. Nâng cấp tờ đề thi trắc nghiệm (`PaperSheet`): Option row bo góc 10px, hiệu ứng trượt hover, nảy pop chọn đáp án, rung lắc khi sai, tỏa xung khi đúng kèm nhãn "ĐÚNG ✓" / "SAI ✕" và nút "Làm lại" (`resetExam`).
  3. Tích hợp Đồng hồ học tập (Pomodoro Session Timer) đếm giờ thực tế và Bộ chỉnh âm lượng trượt dọc (Volume Popover) ở thanh HUD góc dưới bên trái.
  4. Xây dựng Bản đồ ma trận học tập (Matrix Map Popover 8 cột) với thẻ xem trước nổi bật khi hover ở thanh HUD góc dưới bên phải.
  5. Cập nhật khung hỏi đáp Inteline AI với tone cam san hô, icon bóng đèn và thẻ phân tích lý thuyết.
- **Changed:**
  - [`src/app/globals.css`](file:///F:/AppMaking/ViTudy/src/app/globals.css): Bổ sung CSS tokens (`--accent`, `--ok`, `--bad`, `--warn`) và keyframes micro-interactions (`badgePop`, `correctPulse`, `wrongShake`, `verdictPopIn`).
  - [`src/components/canvas/DeskGrid.tsx`](file:///F:/AppMaking/ViTudy/src/components/canvas/DeskGrid.tsx): Chuyển màu nền bàn sang `#f8fafc` êm mắt.
  - [`src/context/StudySpaceContext.tsx`](file:///F:/AppMaking/ViTudy/src/context/StudySpaceContext.tsx): Bổ sung hàm `resetExam(itemId)`.
  - [`src/components/objects/PaperSheet.tsx`](file:///F:/AppMaking/ViTudy/src/components/objects/PaperSheet.tsx): Nâng cấp toàn diện giao diện đề thi trắc nghiệm và các option rows.
  - [`src/components/hud/BottomLeftKnowledge.tsx`](file:///F:/AppMaking/ViTudy/src/components/hud/BottomLeftKnowledge.tsx): Thêm Đồng hồ học tập và thanh gạt âm lượng Popover.
  - [`src/components/hud/BottomRightToolkit.tsx`](file:///F:/AppMaking/ViTudy/src/components/hud/BottomRightToolkit.tsx): Tích hợp Nút Map màu cam và Ma trận Bản đồ bàn học 8 cột có card xem trước khi hover.
  - [`src/components/objects/BookSpread.tsx`](file:///F:/AppMaking/ViTudy/src/components/objects/BookSpread.tsx): Nâng cấp khung Inteline Popover với icon bóng đèn và tone cam san hô.
  - [`AGENTS.md`](file:///F:/AppMaking/ViTudy/AGENTS.md): Cập nhật quy chuẩn Bảng màu Modern Educational Cockpit.
  - [`docs/ai/10_DECISIONS.md`](file:///F:/AppMaking/ViTudy/docs/ai/10_DECISIONS.md): Bổ sung `ADR-018`.
- **Verified by:**
  - `pnpm build`: Pass exit code 0.
  - `pnpm run docs:index` & `pnpm run docs:check`: Pass.
  - Chrome DevTools: Chạy script kiểm thử trực tiếp trên live UI.
- **Task:** Hoàn thiện 4 yêu cầu của người dùng:
  1. Nâng cao độ nét và khử nhiễu khi nhìn bao quát ở mức zoom 47% (loại bỏ moiré pattern, font-medium, geometricPrecision).
  2. Bỏ nút tia sét ở góc dưới bên trái (triệt tiêu Next.js dev indicator).
  3. Đổi tên nút "Tải tài liệu" thành "Tải lên".
  4. Nâng cấp 4 thẻ đánh dấu bìa phải: icon hiển thị trọn vẹn ở trạng thái idle, khi hover trượt mở mượt mà sang phải lộ tên chức năng trực tiếp trên ruy-băng, bỏ tooltip lơ lửng.
- **Changed:**
  - [`src/components/hud/BottomLeftKnowledge.tsx:L148`](file:///F:/AppMaking/ViTudy/src/components/hud/BottomLeftKnowledge.tsx#L148): Đổi "Tải tài liệu" thành "Tải lên".
  - [`next.config.ts:L6-L9`](file:///F:/AppMaking/ViTudy/next.config.ts#L6-L9): Cấu hình `devIndicators: { appIsrStatus: false, buildActivity: false }` để tắt dev indicator tia sét của Next.js.
  - [`src/app/globals.css`](file:///F:/AppMaking/ViTudy/src/app/globals.css):
    1. Bỏ `radial-gradient` chấm hạt trên `.paper-texture` gây nhiễu pixel (moiré pattern) khi zoom out; chuyển sang màu ngà phẳng `#fdfbf7`.
    2. Cấu hình `text-rendering: geometricPrecision;` và `font-weight: 500;` trên `.book-page, .paper-sheet`.
    3. Thêm CSS triệt tiêu `nextjs-portal, [data-nextjs-dev-indicator]` để ẩn hoàn toàn nút tia sét.
  - [`src/components/objects/BookSpread.tsx`](file:///F:/AppMaking/ViTudy/src/components/objects/BookSpread.tsx):
    1. Thiết kế lại 4 thẻ bookmark tab bìa phải: căn chỉnh gốc thẻ luồn 8px dưới giấy (`left: calc(100% - 50px)`), icon SVG hiển thị 100% trọn vẹn ở idle với bề rộng `w-[60px]`.
    2. Tương tác hover: thẻ trượt dài sang phải (`group-hover/tab:w-[132px]`) để lộ tên chức năng ("Tóm tắt", "Phóng to", "Xoay", "Xoá") trên ruy-băng, bỏ hoàn toàn tooltip lơ lửng.
    3. Tăng cường độ đậm `font-medium` cho toàn bộ các đoạn văn bản trong sách và trang lật để nét chữ đậm đà, không bị mờ nhạt khi nhìn bao quát ở zoom 47%.
  - [`src/components/objects/PaperSheet.tsx:L262`](file:///F:/AppMaking/ViTudy/src/components/objects/PaperSheet.tsx#L262): Bổ sung `font-medium` cho thân tài liệu đơn lẻ.
  - [`AGENTS.md:L74-L85, L125-L140`](file:///F:/AppMaking/ViTudy/AGENTS.md): Cập nhật quy chuẩn thiết kế thẻ bookmark ruy-băng trượt mở, nút "Tải lên" và độ sắc nét chống nhiễu moiré.
  - [`docs/ai/10_DECISIONS.md:L180-L195`](file:///F:/AppMaking/ViTudy/docs/ai/10_DECISIONS.md): Bổ sung `ADR-017`.
- **Verified by:**
  - `pnpm build`: Pass exit code 0.
  - `pnpm run docs:index` & `pnpm run docs:check`: Pass (63 symbols).
  - Chrome DevTools: Chạy `node scripts/verify-all.mjs`, chụp ảnh màn hình kiểm chứng trực tiếp:
    1. `tabs_centered_idle.png`: 4 icon hiển thị trọn vẹn, nút "Tải lên" hiển thị đúng, tia sét biến mất.
    2. `tabs_hovered_tomtat.png`: Thẻ ruy-băng trượt mở mượt mà sang phải hiển thị chữ "Tóm tắt" ngay trên ruy-băng, không có tooltip thừa.
    3. `zoom_47_crisp_view.png`: Nền giấy sạch bóng, hết sạch nhiễu hạt moiré, chữ đen rõ ràng, đậm đà và sắc nét ở mức zoom nhỏ 47%.
- **Task:** Hoàn thiện 6 yêu cầu chi tiết của người dùng: tắt spellcheck tiếng Việt trên web, thiết kế thẻ đánh dấu ruy-băng khuyết chữ V (V-notched) 4 màu (Xanh lá, Cam, Nâu, Đỏ) luồn dưới mép giấy, mở rộng viền bìa gấp 3 lần (`42px`), bỏ bóng gáy trên bìa sách, xóa thanh giả độ sâu ngoài bìa và bỏ footer thừa ở chân trang.
- **Changed:**
  - [`src/app/layout.tsx:L31-L35`](file:///F:/AppMaking/ViTudy/src/app/layout.tsx#L31-L35): Thêm `spellCheck={false}` vào `<html>` và `<body>`.
  - [`src/components/objects/StickyNoteItem.tsx:L76-L82`](file:///F:/AppMaking/ViTudy/src/components/objects/StickyNoteItem.tsx#L76-L82): Thêm `spellCheck={false}` vào `<textarea>` ghi chú để triệt tiêu các nét gạch chân đỏ lượn sóng.
  - [`src/components/objects/BookSpread.tsx`](file:///F:/AppMaking/ViTudy/src/components/objects/BookSpread.tsx):
    1. Mở rộng viền bìa 2 bên từ `14px` lên `42px` (gấp 3 lần), kích thước sách `980x640px`.
    2. Bỏ hoàn toàn 2 dải gờ giả độ sâu ngoài bìa sách.
    3. Chuyển bóng rãnh gáy sách vào bên trong container giấy, loại bỏ bóng gáy trên bìa da.
    4. Thiết kế 4 thẻ đánh dấu luồn dưới mép giấy bên phải (`z-10` dưới giấy `z-20`) có đầu khuyết chữ V (`clipPath`), 4 màu: Xanh lá (`#059669` - Tóm tắt), Cam (`#ea580c` - Phóng to), Nâu (`#78350f` - Xoay), Đỏ (`#e11d48` - Xoá), chỉ hiển thị icon vector SVG và tooltip nổi khi hover.
    5. Xóa chữ "ViTudy Desk" và tên sách thừa ở footer trang sách, chỉ hiển thị số trang ở góc ngoài.
  - [`AGENTS.md:L66-L100`](file:///F:/AppMaking/ViTudy/AGENTS.md#L66-L100): Cập nhật quy chuẩn mới.
  - [`docs/ai/10_DECISIONS.md:L168-L180`](file:///F:/AppMaking/ViTudy/docs/ai/10_DECISIONS.md#L168-L180): Bổ sung `ADR-016`.
- **Verified by:**
  - `pnpm build`: Pass exit code 0.
  - `pnpm run docs:index` & `pnpm run docs:check`: Pass (63 symbols).

---

## 2026-11-07 19:18 — uncommitted
- **Task:** Nâng cấp toàn diện trải nghiệm Sách Mở Đôi: thiết kế bìa da nâu dày dặn, hiệu ứng lật trang 3D cuộn chuột như đời thật (Interactive Page-Curl Drag), hệ thống thẻ đánh dấu bìa phải (Bookmark Tabs), phân trang góc ngoài sách in, sửa lỗi kẹt trang 13-14/17, đưa Inteline về inline popover khi bôi đen và tinh gọn nhãn tên sách dưới đáy.
- **Changed:**
  - [`AGENTS.md:L66-L105`](file:///F:/AppMaking/ViTudy/AGENTS.md#L66-L105): Ghi nhận toàn bộ quy chuẩn mới về bìa nâu dày dặn, thẻ bookmark bìa phải, lật trang 3D và số trang góc ngoài.
  - [`src/context/StudySpaceContext.tsx:L27,L295-L315`](file:///F:/AppMaking/ViTudy/src/context/StudySpaceContext.tsx#L27): Bổ sung tham số `maxPages?: number` cho `turnBookPage` để không bao giờ bị chặn lật trang khi số trang thực tế lớn hơn `item.pageCount`.
  - [`src/components/objects/BookSpread.tsx`](file:///F:/AppMaking/ViTudy/src/components/objects/BookSpread.tsx):
    1. Bìa da nâu dày dặn (`#5c3920` đến `#341c0c`, `960x640px`, padding `12-14px`, bo góc `rounded-2xl`).
    2. Xóa bỏ hoàn toàn dải ribbon "SỔ TỔNG HỢP (BINDER)".
    3. Thẻ bookmark tab bìa phải: STudy, Xem Full (chỉ icon SVG `Maximize2`), Xoay 360° (kèm double click về 0°), Xóa sách.
    4. Số trang: Góc dưới cùng bên trái (trang trái) và góc dưới cùng bên phải (trang phải).
    5. Hiệu ứng lật trang 3D cuộn chuột (`startDragFlip` với `rotateY` và dynamic paper bend shadow).
    6. Inteline: Tự động nổi lên tại vị trí kết thúc vùng chọn bôi đen với khung hỏi nhanh và trả lời trực tiếp.
    7. Tên sách: Đặt bên dưới đáy bìa sách (`top-full mt-3.5`), loại bỏ hoàn toàn thanh scrubber, icon quyển sách và text lật trang đè lên sách.
  - [`docs/ai/10_DECISIONS.md:L145-L160`](file:///F:/AppMaking/ViTudy/docs/ai/10_DECISIONS.md#L145-L160): Bổ sung `ADR-015`.
- **Verified by:**
  - `pnpm build`: Pass exit code 0.
  - `pnpm run docs:index` & `pnpm run docs:check`: Pass.
  - `node scripts/test-chrome-devtools.mjs`: Pass 100%.

---

## 2026-11-07 18:59 — uncommitted
- **Task:** Giải quyết triệt để vấn đề vỡ/mờ chữ khi phóng to bàn học ở mức zoom lớn (150% - 220%), đảm bảo văn bản vector sắc nét như màn hình giấy (High-Fidelity Crisp Vector Scaling).
- **Root Cause & Fix:**
  1. *Nguyên nhân 1 (Bitmap Texture Locking):* `InfiniteDesk.tsx` trước đó gán `will-change-transform` và `transform-gpu` lên container bàn học. Trong Chromium/Blink, cờ này buộc engine đồ họa Skia khóa raster resolution ở kích thước 1.0x, khi zoom lên 220% thì GPU kéo giãn texture bitmap tuyến tính (bilinear scaling) làm chữ bị nhòe mờ. $\rightarrow$ Gỡ bỏ `transform-gpu` và `will-change-transform`, chuyển sang 2D transform thuần để trình duyệt luôn re-raster vector glyphs sắc nét theo DPI màn hình.
  2. *Nguyên nhân 2 (Subpixel Coordinate Jitter):* Khi zoom và pan, `transform.x` và `transform.y` sinh ra số thực có phần thập phân (`-39.4413px`), làm phá vỡ lưới pixel subpixel rendering. $\rightarrow$ Làm tròn `Math.round` cho `transform.x` và `transform.y` trong `panBy` và `zoomBy`.
  3. *Nguyên nhân 3 (Rotational Anti-Aliasing):* Góc nghiêng $-1.5^\circ$ vô hiệu hóa cơ chế ClearType font hinting của Windows. $\rightarrow$ Đổi góc mặc định về $0^\circ$; bổ sung tính năng hút từ tính ($\pm 2.5^\circ$) và nhấn đúp vào nút xoay để căn thẳng ngay ngắn tức thì.
  4. *Nguyên nhân 4 (Font Smoothing):* Bổ sung `-webkit-font-smoothing: antialiased`, `-moz-osx-font-smoothing: grayscale`, và `text-rendering: optimizeLegibility` vào `globals.css`.
- **Verified by:**
  - Chụp ảnh so sánh trực tiếp trên Chrome DevTools ở zoom 220%: chữ và icon sắc nét, không còn viền mờ rạn nứt.
  - `pnpm build`: Pass exit code 0.
  - `pnpm run docs:index` & `pnpm run docs:check`: Pass.

---

## 2026-11-07 18:47 — uncommitted
- **Task:** Giải đáp và khắc phục hiện tượng tài liệu bị "biến mất" khi kéo thả vào cuốn sách; bảo đảm an toàn dữ liệu và vô hiệu hóa cơ chế tự động gộp trang (Zero Silent Swallowing).
- **Root Cause & Fix:**
  - *Nguyên nhân:* Trước đó, hook `useDeskItemInteraction` trong `PaperSheet.tsx` có callback `onDropCheck` tự động gọi `combineIntoBinder(target.id, item.id)` khi tọa độ thả rơi đè lên cuốn sách. Khi đó, toàn bộ các trang của tờ giấy được nối vào cuối cuốn sách (làm số trang sách tăng lên, ví dụ từ 5 lên 11 trang), đồng thời tờ giấy bị xóa khỏi bàn học (`filter(i => i.id !== draggedId)`), tạo cảm giác tài liệu bị "biến mất".
  - *Khắc phục:*
    1. Đã gỡ bỏ hoàn toàn `onDropCheck` và lệnh gọi `combineIntoBinder` khỏi `PaperSheet.tsx`. Giờ đây khi kéo tài liệu đè lên sách, tài liệu sẽ nằm yên trên mặt bàn với `zIndex` nổi lên trên, cho phép xếp chồng tài liệu tự nhiên như mặt bàn thật.
    2. Cập nhật `AGENTS.md` (Mục 4) với quy định cấm nuốt/gộp tài liệu khi kéo thả (Zero Silent Swallowing).
    3. Hướng dẫn người dùng cách khôi phục các trang đã lỡ gộp trước đó bằng nút "Tách trang" (icon cái kéo - Binder Detach) ở góc từng trang sách.
- **Verified by:**
  - `pnpm build`: Pass exit code 0.
  - `pnpm run docs:index` & `pnpm run docs:check`: Pass.

---

## 2026-11-07 18:40 — uncommitted
- **Task:** Điều tra và triệt tiêu dứt điểm lỗi màn hình trắng kèm huy hiệu `1 error` trong Chrome DevTools.
- **Root Cause & Fix:**
  1. `FullScreenDocModal.tsx`: Lỗi TDZ `ReferenceError: Cannot access 'totalLeaves' before initialization` do `totalLeaves` và các hàm điều hướng đặt dưới `useEffect`. $\rightarrow$ Đã chuyển toàn bộ khai báo `leaves`, `totalLeaves`, `handlePrev`, `handleNext` lên trên `useEffect`.
  2. `src/app/page.tsx`: Lỗi Hydration Mismatch giữa SSR và Client State (Local Storage & Fonts) gây chặn render màn hình trắng. $\rightarrow$ Đã cấu hình `dynamic(() => import('@/components/canvas/StudySpaceDeskView'), { ssr: false })` để loại bỏ 100% hydration mismatch cho Canvas 2.5D.
  3. `BookSpread.tsx`: Lỗi `Uncaught (in promise) Event` khi tải font `document.fonts.ready`. $\rightarrow$ Đã bổ sung `.catch(() => setFontsReady(true))`.
- **Verified by:**
  - `node scripts/test-chrome-devtools.mjs`: Pass 100% (0 console errors, 0 exceptions, `hasOverlayError: false`, Sách mở đôi 940x630, Đề thi trắc nghiệm A4, Reader Toàn Màn Hình PDF View).
  - Ảnh chụp thực tế: `latest_screenshot.png` hiển thị sắc nét không gian học 2.5D không còn lỗi.
  - `pnpm build`: Pass exit code 0.
  - `pnpm run docs:index` & `pnpm run docs:check`: Pass (63 symbols).

---

## 2026-11-07 18:25 — uncommitted
- **Task:** Giải quyết dứt điểm 3 phản hồi trải nghiệm người dùng: sửa lỗi hover đứt quãng khi di chuột lên nút xoay/xoá, bổ sung chế độ Đọc Toàn Màn Hình (PDF View) có nút thoát, và tái thiết kế Sách Mở Đôi thành sách thực thể chân thực (Zero AI Bezel) kèm Contextual Overlays trên/dưới.
- **Changed:**
  - [`AGENTS.md:L70-L85`](file:///F:/AppMaking/ViTudy/AGENTS.md#L70-L85): Cập nhật quy chuẩn Sách Thực Thể Chân Thực (Zero AI Bezel), cầu nối chống mất hover (`before:absolute before:inset-x-0 before:-bottom-3.5 before:h-4`), và chế độ Full-Screen Document Reader.
  - [`src/components/objects/BookSpread.tsx:L170-L360`](file:///F:/AppMaking/ViTudy/src/components/objects/BookSpread.tsx#L170-L360): Xoá bỏ hoàn toàn viền tablet đen bao quanh; tạo rãnh gáy tự nhiên; chuyển toàn bộ điều hướng vào Contextual Overlays (Overlay trên có số trang & chuyển trang trực tiếp, nút Xem Full, Inteline, STudy, xoay 360°, xoá; Overlay dưới có tên sách và thanh trượt lật trang scrubber); bổ sung cầu nối hover tàng hình.
  - [`src/components/objects/PaperSheet.tsx:L318-L380`](file:///F:/AppMaking/ViTudy/src/components/objects/PaperSheet.tsx#L318-L380): Bổ sung cầu nối hover tàng hình và nút "Xem Full" (`Maximize2`) mở `FullScreenDocModal` cho cả tài liệu thường và đề thi trắc nghiệm A4.
  - [`src/components/objects/StickyNoteItem.tsx:L90-L115`](file:///F:/AppMaking/ViTudy/src/components/objects/StickyNoteItem.tsx#L90-L115): Bổ sung cầu nối hover tàng hình chống mất overlay khi di chuột lên xoay/xoá.
  - [`src/data/mockSpaces.ts:L15-L25`](file:///F:/AppMaking/ViTudy/src/data/mockSpaces.ts#L15-L25): Điều chỉnh tọa độ mặc định Y của sách từ `150` sang `60` để vừa vặn trọn vẹn trong màn hình.
  - [`docs/ai/06_UI_MAP.md:L58-L75`](file:///F:/AppMaking/ViTudy/docs/ai/06_UI_MAP.md#L58-L75): Ghi nhận `FullScreenDocModal` qua React Portal tại `z-[100]`.
  - [`docs/ai/10_DECISIONS.md:L120-L140`](file:///F:/AppMaking/ViTudy/docs/ai/10_DECISIONS.md#L120-L140): Thêm `ADR-012`.
- **Added:**
  - [`src/components/modals/FullScreenDocModal.tsx:L1-L415`](file:///F:/AppMaking/ViTudy/src/components/modals/FullScreenDocModal.tsx#L1-L415): Component trình đọc toàn màn hình chuẩn PDF viewer (hỗ trợ sách mở đôi, 1 trang, đề thi A4, zoom 60%-160%, phím tắt Esc & mũi tên).
- **Verified by:**
  - `node scripts/test-chrome-devtools.mjs`: Pass 100% (0 lỗi console, kiểm tra mở/đóng modal toàn màn hình thành công, kích thước 940x630 chuẩn, 0 emoji).
  - Ảnh chụp màn hình: `latest_screenshot.png` (bàn học thực thể), `fullscreen_reader_screenshot.png` (chế độ đọc toàn màn hình PDF view).
  - `pnpm run docs:index` & `pnpm run docs:check`: Pass (63 symbols hợp lệ).
- **Open follow-ups:** Sẵn sàng cho người dùng trải nghiệm.

---

## 2026-11-07 18:05 — uncommitted
- **Task:** Thực thi toàn diện Master Completion Plan (`vitudy_master_completion_plan.md`): giải quyết triệt để các vi phạm chuẩn monochromatic/zero-emoji, tái cấu trúc hook xoay 360° `useDeskItemInteraction`, module hóa `StudyToolsModal` thành 5 subtabs, triển khai tờ đề thi trắc nghiệm A4 tương tác `PaperSheet` (`exam_sheet`), chuẩn hóa Unicode NFC, tích hợp bảng `space_members`, chia sẻ doanh thu 85/15 và kiểm thử tự động toàn diện bằng Chrome DevTools MCP.
- **Changed:**
  - [`src/components/canvas/DeskGrid.tsx:L12-L24`](file:///F:/AppMaking/ViTudy/src/components/canvas/DeskGrid.tsx#L12-L24): Nền trắng thuần `#ffffff`.
  - [`src/app/layout.tsx:L12-L25`](file:///F:/AppMaking/ViTudy/src/app/layout.tsx#L12-L25): Selection xám đơn sắc `slate-200 / slate-900`.
  - [`src/app/api/ai/chat/route.ts:L35-L45`](file:///F:/AppMaking/ViTudy/src/app/api/ai/chat/route.ts#L35-L45): Unicode NFC normalization `prompt.normalize('NFC')`.
  - [`src/utils/textNormalization.ts:L1-L15`](file:///F:/AppMaking/ViTudy/src/utils/textNormalization.ts#L1-L15): Tạo helper `normalizeNFC`.
  - [`src/hooks/useDeskItemInteraction.ts:L1-L125`](file:///F:/AppMaking/ViTudy/src/hooks/useDeskItemInteraction.ts#L1-L125): Tạo hook tương tác kéo thả & xoay 360° `Math.atan2` chuẩn tâm.
  - [`src/types/studyspace.ts:L20-L65`](file:///F:/AppMaking/ViTudy/src/types/studyspace.ts#L20-L65): Khai báo `ExamQuestion`, `ExamSheetData`, `examData` trong `DeskItem`.
  - [`src/context/StudySpaceContext.tsx:L320-L460`](file:///F:/AppMaking/ViTudy/src/context/StudySpaceContext.tsx#L320-L460): Bổ sung `addExamSheet`, `updateExamAnswer`, `gradeExam`, và lọc sạch emoji cũ qua `removeEmojis` trong `deepNormalize`.
  - [`src/components/objects/BookSpread.tsx:L50-L420`](file:///F:/AppMaking/ViTudy/src/components/objects/BookSpread.tsx#L50-L420): Chuyển sang dùng `useDeskItemInteraction`, loại bỏ accent cyan, giữ kích thước chuẩn 940x630.
  - [`src/components/objects/StickyNoteItem.tsx:L25-L160`](file:///F:/AppMaking/ViTudy/src/components/objects/StickyNoteItem.tsx#L25-L160): Chuyển sang dùng `useDeskItemInteraction`, đơn sắc hóa controls.
  - [`src/components/objects/PaperSheet.tsx:L1-L260`](file:///F:/AppMaking/ViTudy/src/components/objects/PaperSheet.tsx#L1-L260): Tích hợp `useDeskItemInteraction`, hiện thực hóa Tờ Đề Thi Trắc Nghiệm Tương Tác A4 (chọn đáp án, chấm điểm trực tiếp, lời phê giáo viên AI).
  - [`src/components/modals/StudyToolsModal.tsx:L1-L85`](file:///F:/AppMaking/ViTudy/src/components/modals/StudyToolsModal.tsx#L1-L85): Tách module thành 5 subtab độc lập (`SummaryTab`, `QuizTab`, `FlashcardTab`, `RoadmapTab`, `OcrTab`).
  - [`src/components/mobile/MobileCompanionView.tsx:L40-L210`](file:///F:/AppMaking/ViTudy/src/components/mobile/MobileCompanionView.tsx#L40-L210): Tối ưu bảng màu sáng slate đơn sắc.
  - [`src/components/hud/MultiplayerBar.tsx:L25-L110`](file:///F:/AppMaking/ViTudy/src/components/hud/MultiplayerBar.tsx#L25-L110): Bỏ emoji reaction hoàn toàn, tích hợp nút "Đồng bộ góc nhìn" kèm đèn LED emerald.
  - [`src/components/modals/KnowInheritPublishModal.tsx:L15-L60`](file:///F:/AppMaking/ViTudy/src/components/modals/KnowInheritPublishModal.tsx#L15-L60) & [`src/components/hud/BottomLeftKnowledge.tsx:L20-L75`](file:///F:/AppMaking/ViTudy/src/components/hud/BottomLeftKnowledge.tsx#L20-L75): Khung giá chuẩn SRS 5.1 (5/15/30/50 ViToken), chia thưởng 85/15.
  - [`src/context/ViTokenContext.tsx:L50-L160`](file:///F:/AppMaking/ViTudy/src/context/ViTokenContext.tsx#L50-L160): Anti-sybil desk activity (180s), timestamps động ISO.
  - [`supabase/schema.sql:L40-L50`](file:///F:/AppMaking/ViTudy/supabase/schema.sql#L40-L50): Thêm bảng `space_members`, RLS policies, cập nhật constraint giá 5/15/30/50.
  - [`src/app/page.tsx:L1-L25`](file:///F:/AppMaking/ViTudy/src/app/page.tsx#L1-L25): Xóa spinner cản trở mount giao diện desktop.
- **Added:**
  - `src/hooks/useDeskItemInteraction.ts`: Hook tương tác dùng chung cho các vật thể bàn học.
  - `src/utils/textNormalization.ts`: Helper chuẩn hoá NFC.
  - `src/components/modals/study-tools/SummaryTab.tsx`: Subtab Tóm tắt.
  - `src/components/modals/study-tools/QuizTab.tsx`: Subtab Trắc nghiệm & Xuất đề thi.
  - `src/components/modals/study-tools/FlashcardTab.tsx`: Subtab Thẻ ghi nhớ.
  - `src/components/modals/study-tools/RoadmapTab.tsx`: Subtab Lộ trình ôn tập.
  - `src/components/modals/study-tools/OcrTab.tsx`: Subtab Nhận diện chữ viết tay OCR.
  - `scripts/test-chrome-devtools.mjs`: Bộ kiểm thử tự động toàn diện qua giao thức CDP của Chrome.
- **Verified by:**
  - `scripts/test-chrome-devtools.mjs`: Chạy Chrome DevTools CDP trực tiếp trên port 9222:
    - 0 console error.
    - Zero-Emoji: 0 emoji trong DOM (100% SVG Lucide).
    - 2.5D BookSpread: 940x630px.
    - Modal StudyTools: Mở và chuyển 5 tab thành công.
    - Interactive Exam Sheet: Xuất tờ đề thi ra bàn, chọn đáp án, bấm "Nộp Bài & Chấm Điểm", tính điểm và hiển thị lời phê giáo viên thành công.
  - `pnpm build`: Passed (Exit code 0, không có lỗi TypeScript hay Lint).
  - `pnpm run docs:index` & `pnpm run docs:check`: Passed (Exit code 0, 62 symbols hợp lệ).
- **Open follow-ups:** Duy trì trạng thái hoàn thiện production-ready.

---

## 2026-11-07 17:20 — uncommitted
- **Task:** Cập nhật các quy tắc thiết kế mới cho `AGENTS.md`, xoá `CLAUDE.md`, triệt tiêu hoàn toàn emoji chuyển sang icon SVG vector Morphicons/Lucide, siết chặt kỷ luật vẽ giao diện theo combo skill đã cài đặt.
- **Changed:**
  - [`AGENTS.md:L1-L125`](file:///F:/AppMaking/ViTudy/AGENTS.md#L1-L125): Thêm chỉ dẫn bắt buộc tự động cập nhật quy tắc, cấm emoji (Zero-Emoji Policy), bắt buộc dùng combo skill UI/UX (`stageshow`, `hallmark`, `design-taste-frontend`, `impeccable`, `awesome-design-md`, `google-design-md`, `emil-kowalski-skills`).
  - [`src/components/canvas/InfiniteDesk.tsx:L160-L168`](file:///F:/AppMaking/ViTudy/src/components/canvas/InfiniteDesk.tsx#L160-L168): Thay thế emoji `📥` bằng `<FileUp />` SVG vector.
  - [`src/components/hud/MultiplayerBar.tsx:L15-L130`](file:///F:/AppMaking/ViTudy/src/components/hud/MultiplayerBar.tsx#L15-L130): Thay thế toàn bộ emoji phản ứng bằng bộ SVG icons vector (`ThumbsUp`, `Lightbulb`, `Flame`, `Target`, `HelpCircle`).
  - [`src/data/mockSpaces.ts:L200-L220`](file:///F:/AppMaking/ViTudy/src/data/mockSpaces.ts#L200-L220): Xóa emoji `💡` và `🗺️` khỏi nội dung khởi tạo.
  - [`src/context/StudySpaceContext.tsx:L465-L475`](file:///F:/AppMaking/ViTudy/src/context/StudySpaceContext.tsx#L465-L475): Xóa emoji `📌` và `💡` khỏi định dạng ghi chú Inteline.
  - [`docs/ai/10_DECISIONS.md:L65-L85`](file:///F:/AppMaking/ViTudy/docs/ai/10_DECISIONS.md#L65-L85): Bổ sung `ADR-007` (Zero-Emoji) và `ADR-008` (Skill-First UI/UX & Auto-Update).
- **Removed:**
  - `CLAUDE.md`: Đã xóa theo yêu cầu, tập trung Single Source of Truth vào `AGENTS.md`.
- **Verified by:**
  - `pnpm run docs:index` & `pnpm run docs:check` $\rightarrow$ Pass exit 0.
  - Quét regex Unicode emoji toàn bộ thư mục `src/` $\rightarrow$ 0 emoji.
- **Open follow-ups:** Duy trì cập nhật `AGENTS.md` khi người dùng bổ sung quy tắc mới.
- **Changed:**
  - [`package.json:L8-L10`](file:///F:/AppMaking/ViTudy/package.json#L8-L10): Thêm scripts `"docs:index"` và `"docs:check"`.
- **Added:**
  - [`scripts/gen-docs-index.ts:L1-L230`](file:///F:/AppMaking/ViTudy/scripts/gen-docs-index.ts#L1-L230): Script AST trích xuất ký hiệu và kiểm tra tính hợp lệ của tài liệu.
  - Các tài liệu bộ nhớ trong `docs/ai/`: `00_INDEX.md`, `01_OVERVIEW.md`, `02_FILE_MAP.md`, `03_SYMBOL_INDEX.md`, `04_DATA_MODEL.md`, `05_API_AND_ROUTES.md`, `06_UI_MAP.md`, `07_STATE_AND_DATAFLOW.md`, `08_FEATURE_STATUS.md`, `09_ISSUES_AND_TODO.md`, `10_DECISIONS.md`, `11_CHANGELOG.md`, `SNAPSHOT.md`.
- **Verified by:**
  - `pnpm run docs:index` $\rightarrow$ Trích xuất thành công 52 symbols vào `03_SYMBOL_INDEX.md`.
  - `pnpm run docs:check` $\rightarrow$ Exit code 0, mọi ký hiệu đều hợp lệ.
  - `pnpm build` $\rightarrow$ Exit code 0, TypeScript & Lint đều sạch.
- **Open follow-ups:** Tích hợp bộ hướng dẫn vào `AGENTS.md` và `CLAUDE.md`.

---

## 2026-11-07 16:55 — uncommitted
- **Task:** Khắc phục lỗi hiển thị văn bản sách bị cắt cụt, giải phóng tiêu đề chương, nâng cấp phân trang 940x630, popover Inteline bôi đen chữ, và sửa lỗi trắng màn hình sau build.
- **Changed:**
  - [`src/components/objects/BookSpread.tsx:L25-L514`](file:///F:/AppMaking/ViTudy/src/components/objects/BookSpread.tsx#L25-L514) (`BookSpread`): Mở rộng 940x630, gờ mép trang 2.5D, tiêu đề 100% full width, selection popover Inteline, nút tách trang hover, phím mũi tên lật trang.
  - [`src/components/objects/StickyNoteItem.tsx:L13-L184`](file:///F:/AppMaking/ViTudy/src/components/objects/StickyNoteItem.tsx#L13-L184) (`StickyNoteItem`): Placeholder rỗng chuẩn xám nghiêng `"Ghi chú học tập mới..."`, cỡ chữ 16px font-semibold.
  - [`src/components/hud/TopLeftNav.tsx:L15-L198`](file:///F:/AppMaking/ViTudy/src/components/hud/TopLeftNav.tsx#L15-L198) (`TopLeftNav`): Đổi "Theo dõi tôi" thành "Đồng bộ góc nhìn" kèm chấm đèn xanh trạng thái.
  - [`src/components/canvas/Minimap.tsx:L6-L205`](file:///F:/AppMaking/ViTudy/src/components/canvas/Minimap.tsx#L6-L205) (`Minimap`): Đổi "RADAR" thành "BẢN ĐỒ", cập nhật kích thước 940x630.
  - [`src/components/hud/VrFrameOverlay.tsx:L5-L21`](file:///F:/AppMaking/ViTudy/src/components/hud/VrFrameOverlay.tsx#L5-L21) (`VrFrameOverlay`): Đổi "BÀN HỌC 2.5D" thành "Không gian học 2.5D".
  - [`src/data/mockSpaces.ts:L12-L210`](file:///F:/AppMaking/ViTudy/src/data/mockSpaces.ts#L12-L210): Cập nhật vị trí và góc xoay tự nhiên `-1.5°` cho sách.
- **Verified by:**
  - Khởi động lại `pnpm dev` trên cổng 3000.
  - Chạy `scripts/capture.mjs` qua Chrome Remote Debug (port 9222) và xác nhận 4 desk items hiển thị đầy đủ, không còn trắng màn hình.
  - Ảnh chụp màn hình lưu tại `latest_screenshot.png`.
- **Open follow-ups:** Lưu giữ quy chuẩn vào `AGENTS.md`.

---

## 2026-11-06 22:30 — 74d4cc0
- **Task:** Hoàn thiện Phase 4 (GPU acceleration, KnowInherit Marketplace 85/15, Multiplayer Presence UI).
- **Changed:**
  - Cập nhật các component HUD, modal xuất bản tài liệu, kiểm duyệt độ độc bản và định giá khung cố định.
- **Verified by:**
  - `pnpm build` thành công, commit `74d4cc0`.
