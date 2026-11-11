# 10_DECISIONS.md — Nhật Ký Quyết Định Kiến Trúc (ADR Log)

> **Commit Hash:** `74d4cc0`  
> **Cập nhật lần cuối:** `2026-11-07`  
> **Quy tắc:** Append-only. Không sửa đổi hoặc xoá các quyết định đã ban hành trong quá khứ.

---

### ADR-001 — Lựa Chọn Ngôn Ngữ & Nền Tảng: Unified Full-Stack Next.js 15
* **Ngày quyết định:** `2026-11-06`
* **Quyết định:** Sử dụng toàn diện TypeScript với `Next.js 15 (App Router)` cho cả giao diện Canvas 2.5D lẫn API AI Gateway.
* **Lý do:**
  * Giảm thiểu phân mảnh ngôn ngữ, tái sử dụng 100% khai báo kiểu (`DeskItem`, `StudySpace`, `ViTokenWallet`) từ client sang server.
  * Tối ưu tốc độ phát triển và triển khai trên một môi trường duy nhất.
* **Giải pháp thay thế bị bác bỏ:** Tách backend Python (FastAPI) và frontend React (Vite). Bị bác bỏ vì gây cồng kềnh, chi phí bảo trì nhân đôi và phức tạp hoá việc đồng bộ Type.

---

### ADR-002 — Xây Dựng Động Cơ Non-AI Chạy Cục Bộ (Zero-Token Cost)
* **Ngày quyết định:** `2026-11-06`
* **Quyết định:** Viết các thuật toán NLP cổ điển bằng TypeScript thuần chạy trực tiếp phía Client (`TextRank`, `TF-IDF`, `Cloze Deletion`, `Heuristic Heading Parser`).
* **Lý do:**
  * Đảm bảo mọi tính năng học tập cơ bản (tóm tắt, tạo câu hỏi trắc nghiệm, tạo flashcard, lập lộ trình học) đều miễn phí $0 vĩnh viễn cho học sinh/sinh viên.
  * Ứng dụng hoạt động ngay cả khi ngoại tuyến hoặc khi người dùng hết ViToken.
* **Giải pháp thay thế bị bác bỏ:** Gọi mô hình LLM (OpenAI/Gemini) cho mọi thao tác tóm tắt và sinh bài tập. Bị bác bỏ vì đốt token quá nhanh, người dùng hết token sẽ không thể học được.

---

### ADR-003 — Bảng Màu Giao Diện Đơn Sắc (Monochromatic Palette) & Bàn Trắng Tinh Khiết
* **Ngày quyết định:** `2026-11-06`
* **Quyết định:** Áp dụng bảng màu HUD trắng (`#ffffff`), đen (`#0f172a`) và dải xám slate; nền bàn học màu trắng tinh khiết kết hợp lưới ô kẻ caro mảnh nhẹ (`DeskGrid`).
* **Lý do:**
  * Giữ mắt người học luôn tập trung vào nội dung tài liệu, tránh ô nhiễm thị giác do các màu gradient tím, xanh đậm gây ra.
  * Nền trắng kẻ ô tạo cảm giác không gian học sáng sủa, sạch sẽ và chuẩn công thái học chống mỏi mắt.
* **Giải pháp thay thế bị bác bỏ:** Nền màu xanh tối (Dark navy blue). Bị bác bỏ vì làm tối không gian học, chữ đen trong sách bị chìm và gây mỏi mắt sau 30 phút đọc sách.

---

### ADR-004 — Kích Thước Sách Mở Đôi 940×630px & Phân Trang Động Tránh Cắt Cụt
* **Ngày quyết định:** `2026-11-07`
* **Quyết định:** Mở rộng kích thước sách `BookSpread` lên `940 × 630px`, thiết lập thuật toán đo đạc chiều cao `paginateDocument` với ngưỡng an toàn `MAX_PAGE_TEXT_HEIGHT = 370px` và cơ chế đệm `overflow-y-auto no-scrollbar`.
* **Lý do:**
  * Giữ nguyên vẹn 100% công thức toán học và các đoạn văn dài mà không để chữ bị cắt ngang dòng.
  * Bảo toàn ẩn dụ "tờ giấy vật lý" (không có thanh cuộn dọc lộ liễu bên trong trang sách).
* **Giải pháp thay thế bị bác bỏ:** Bật thanh cuộn dọc mặc định bên trong trang sách. Bị bác bỏ vì phá vỡ hoàn toàn cảm giác đọc sách 2.5D.

---

### ADR-005 — Cơ Chế Xoay Tự Do 360° Liên Tục Bằng Một Nút Xoay Chuột
* **Ngày quyết định:** `2026-11-07`
* **Quyết định:** Thay thế toàn bộ các nút bấm xoay cứng 90° bằng một nút xoay duy nhất: người dùng đè chuột và rê theo hướng nào thì tài liệu xoay theo góc chuột đó (`Math.atan2`).
* **Lý do:**
  * Cảm giác tương tác xoay giấy tờ trên bàn học đời thực tự nhiên, mượt mà.
  * Tích hợp cơ chế hút từ tính (`magnetic snap`) về 0° khi góc lệch trong khoảng ±2.5° và nhấp đúp để trả thẳng tức thì.
* **Giải pháp thay thế bị bác bỏ:** Giữ các nút xoay rời rạc 90°. Bị bác bỏ vì tạo ra cảm giác cứng nhắc của phần mềm máy tính thay vì không gian học thực tế.

---

### ADR-006 — Tương Tác Bút & Bút Dạ Quang Tự Do Trên Toàn Mặt Bàn
* **Ngày quyết định:** `2026-11-07`
* **Quyết định:** Khi người dùng chọn công cụ Bút (`pen`) hoặc Bút dạ quang (`highlighter`), đè chuột kéo ở bất kỳ đâu trên mặt bàn học đều tự động vẽ tự do nét mực (không dịch chuyển bàn). Khi muốn di chuyển bàn trong lúc cầm bút, giữ phím `Alt` và kéo chuột (`Alt + Drag`).
* **Lý do:**
  * Khắc phục triệt để lỗi nét bút bị co cụm thành một chấm do sự kiện kéo bàn chiếm quyền.
  * Tạo cảm giác cầm bút viết trực tiếp lên mặt bàn học thực tế.
* **Giải pháp thay thế bị bác bỏ:** Bắt người dùng phải chuyển về con trỏ chuột (`cursor`) mới được di chuyển bàn. Bị bác bỏ vì phím `Alt + Drag` là chuẩn công thái học quốc tế (Figma, Photoshop, Miro).

---

### ADR-007 — Nghiêm Cấm Tự Động Gom Trang Khi Kéo Thả Đè Lên Nhau
* **Ngày quyết định:** `2026-11-07`
* **Quyết định:** Loại bỏ hoàn toàn tính năng tự động gộp trang (silent swallowing) khi thả tài liệu lên sách. Mọi tài liệu khi kéo đè lên nhau phải giữ nguyên vẹn vị trí và z-index đè lên trên.
* **Lý do:**
  * Trên bàn học thực tế, học sinh thường để các tờ đề hoặc tài liệu đè lên nhau để đọc cùng lúc.
  * Việc tài liệu bị biến mất bất thình lình gây hoang mang và ức chế tột độ cho người dùng.
* **Giải pháp thay thế bị bác bỏ:** Giữ cơ chế tự động gộp nếu kéo vào giữa cuốn sách. Bị bác bỏ vì người dùng có thể vô tình thả tay làm mất tài liệu đang nghiên cứu.

---

### ADR-008 — Bản Đồ Radar Thu Nhỏ (Minimap) Tương Tác Thời Gian Thực
* **Ngày quyết định:** `2026-11-07`
* **Quyết định:** Xây dựng khung bản đồ thu nhỏ ở góc dưới bên phải HUD, hiển thị trực quan vị trí sách, tài liệu, note và khung nhìn camera hiện tại.
* **Lý do:**
  * Giúp người học định vị tức thời vị trí của mình trên không gian bàn học vô tận rộng lớn.
  * Cho phép nhấp chuột hoặc kéo rê khung nhìn trên Minimap để điều hướng camera đến mục tiêu nhanh chóng.
* **Giải pháp thay thế bị bác bỏ:** Chỉ dùng nút reset view về giữa bàn. Bị bác bỏ vì khi có nhiều tài liệu rải rác, người dùng rất dễ bị lạc góc nhìn.

---

### ADR-009 — Chế Độ Đọc Toàn Màn Hình Kiểu PDF View (`FullScreenDocModal`)
* **Ngày quyết định:** `2026-11-07`
* **Quyết định:** Bổ sung nút "Xem Full" (`Maximize2`) trên thanh overlay sách để mở trình đọc tài liệu chuyên dụng toàn màn hình.
* **Lý do:**
  * Phục vụ nhu cầu đọc sâu các tài liệu có chữ nhỏ hoặc nhiều biểu đồ chi tiết.
  * Hỗ trợ chuyển trang, phóng to thu nhỏ từ 60% đến 160%, chuyển đổi chế độ xem 1 trang / 2 trang song song và phím tắt `Esc` thoát nhanh.
* **Giải pháp thay thế bị bác bỏ:** Buộc người học phải tự zoom-in bàn học bằng con lăn chuột. Bị bác bỏ vì khi phóng to bàn học thì các tài liệu xung quanh bị tràn ra ngoài màn hình.

---

### ADR-010 — Chuyển Trang Không Giới Hạn & Phân Trang Thật Cho Mọi Cuốn Sách
* **Ngày quyết định:** `2026-11-07`
* **Quyết định:** Hàm `turnBookPage` luôn tiếp nhận tham số `maxPages` từ tổng số trang thật của tài liệu.
* **Lý do:**
  * Triệt tiêu lỗi người dùng bị kẹt cứng ở trang 13–14 khi cuốn sách có 17 trang.
  * Đảm bảo mọi trang sách đều có thể được lật mở tới trang cuối cùng.
* **Giải pháp thay thế bị bác bỏ:** Giữ cứng số trang theo mảng mẫu ban đầu. Bị bác bỏ vì tài liệu tải lên có thể có số trang bất kỳ.

---

### ADR-011 — Hỏi Nhanh Trí Tuệ Inteline Tại Vị Trí Bôi Đen Văn Bản
* **Ngày quyết định:** `2026-11-07`
* **Quyết định:** Xóa bỏ nút Inteline cứng trên overlay; Inteline chỉ kích hoạt khi người dùng bôi đen một đoạn văn bản trong sách và tự động hiển thị thẻ hỏi đáp tại tọa độ kết thúc của vùng bôi đen.
* **Lý do:**
  * Đảm bảo tính ngữ cảnh tuyệt đối: bôi đen đoạn nào hỏi đoạn đó, không làm xao nhãng người học bằng các nút bấm thừa.
  * Cung cấp các gợi ý câu hỏi nhanh (Giải thích, Ví dụ, Ý chính) và câu trả lời trực tiếp tại chỗ.
* **Giải pháp thay thế bị bác bỏ:** Đặt nút bấm Inteline trên thanh công cụ chung. Bị bác bỏ vì người dùng phải bấm thêm 1 bước và mất ngữ cảnh đoạn văn đang đọc.

---

### ADR-012 — Thẻ Ruy Băng V-Notch Gắn Dưới Mép Phải Bìa Sách Thay Thế Thanh Overlay Cũ
* **Ngày quyết định:** `2026-11-07`
* **Quyết định:** Thay thế toàn bộ thanh overlay lơ lửng bằng 4 thẻ ruy-băng khuyết chữ V gắn luồn dưới mép giấy sang bìa phải (Tóm tắt, Phóng to, Xoay, Xoá).
* **Lý do:**
  * Trực quan hóa tương tác theo ẩn dụ thanh nhắc trang sách thực tế.
  * Loại bỏ tình trạng overlay bị giật hoặc che khuất tầm nhìn của người học khi rê chuột.
* **Giải pháp thay thế bị bác bỏ:** Giữ thanh overlay đen mờ ở đỉnh sách. Bị bác bỏ vì thanh đen mang tính giao diện phần mềm AI, làm mất chất sách thật.

---

### ADR-013 — Số Trang Đặt Ở Góc Dưới Ngoài Trang Giấy Như Sách Thật
* **Ngày quyết định:** `2026-11-07`
* **Quyết định:** Số trang của trang bên trái đặt ở góc dưới cùng bên trái; số trang của trang bên phải đặt ở góc dưới cùng bên phải.
* **Lý do:**
  * Bám sát quy chuẩn in ấn của sách thực thể.
  * Xóa bỏ các dòng chữ thừa như "ViTudy Desk" hay tên sách lặp lại ở chân trang làm rối mắt.
* **Giải pháp thay thế bị bác bỏ:** Đặt thanh tiến trình phân trang ở giữa 2 trang. Bị bác bỏ vì tạo cảm giác máy móc, không tự nhiên.

---

### ADR-014 — Bìa Sách Da Màu Nâu Dày Dặn Sang Trọng & Không Dùng Bọc Viền Tablet
* **Ngày quyết định:** `2026-11-07`
* **Quyết định:** Sử dụng tông màu nâu da ấm sang trọng (`#5c3920` đến `#341c0c`) cho bìa sách, bo góc `rounded-2xl`, loại bỏ khung viền đen tablet bao quanh sách.
* **Lý do:**
  * Mang lại cảm xúc học tập ấm áp, sang trọng và chuẩn mực sách bìa da thực tế.
  * Triệt tiêu cảm giác giao diện phần mềm giả lập tablet thô kệch.
* **Giải pháp thay thế bị bác bỏ:** Bìa màu đen hoặc xám công nghệ. Bị bác bỏ vì mang cảm giác lạnh lẽo và không phù hợp với không gian học thức.

---

### ADR-015 — Hiệu Ứng Lật Trang Uốn Cong 3D Bằng Kéo Rê Chuột (Drag-to-Flip)
* **Ngày quyết định:** `2026-11-07`
* **Quyết định:** Khi rê chuột vào rìa ngoài mép sách, hiển thị nếp gấp gợi ý; người dùng có thể nhấp chuột hoặc đè chuột kéo để tờ giấy cuộn uốn cong trong không gian 3D (`rotateY`) theo vị trí con trỏ chuột.
* **Lý do:**
  * Tái hiện sống động cảm giác tay giữ và lật từng trang giấy vật lý ngoài đời thực.
  * Tự động đàn hồi về vị trí cũ nếu chưa kéo quá 30% hành trình và tự lật trang khi vượt ngưỡng.
* **Giải pháp thay thế bị bác bỏ:** Lật trang bằng hiệu ứng slide ngang 2D cứng nhắc. Bị bác bỏ vì thiếu chiều sâu và cảm giác chân thực.

---

### ADR-016 — Tinh Chỉnh Bìa Sách Mở Rộng 3X, Thẻ Đánh Dấu Chữ V 4 Màu, Loại Bỏ Bóng Bìa & Tắt Spellcheck
* **Ngày quyết định:** `2026-11-07`
* **Quyết định:**
  1. Tắt cờ kiểm tra chính tả `spellCheck={false}` toàn ứng dụng nhằm loại bỏ các đường gạch chân đỏ giả định lỗi chính tả tiếng Việt.
  2. Mở rộng khoảng cách hai bên viền bìa sách gấp 3 lần (`42px`, tổng chiều rộng sách 980px) tạo tỷ lệ bìa da thực tế.
  3. Loại bỏ bóng gáy trên bìa sách (chỉ giữ bóng rãnh gáy bên trong trang giấy) và xóa bỏ các thanh gờ giả độ sâu ngoài bìa sách.
  4. Thiết kế 4 thẻ đánh dấu luồn dưới mép giấy sang phải với đầu khuyết chữ V (V-notched ribbon tail) mang 4 màu: Xanh lá (Tóm tắt), Cam (Phóng to), Nâu (Xoay), Đỏ (Xoá), chỉ hiển thị icon vector SVG kèm tooltip.
  5. Xóa bỏ hoàn toàn chữ thừa "ViTudy Desk" và tên sách ở chân trang sách, chỉ để lại duy nhất số trang ở góc ngoài.
* **Lý do:** Tối ưu hóa tính thẩm mỹ và công thái học theo đúng phản hồi trực tiếp từ người dùng.

---

### ADR-017 — Tối Ưu Độ Nét Zoom Nhỏ, Thẻ Ruy Băng Trượt Mở Hover, Triệt Tiêu Dev Indicator & Đổi Tên Nút "Tải lên"
* **Ngày quyết định:** `2026-11-07`
* **Quyết định:**
  1. **Độ sắc nét & Khử nhiễu ở mức thu nhỏ 40%–50%:** Loại bỏ hoàn toàn hiệu ứng chấm hạt moiré (`radial-gradient`) trên `.paper-texture` chuyển sang nền giấy ngà phẳng thuần khiết (`#fdfbf7`); thiết lập độ đậm `font-medium` (500) và `text-rendering: geometricPrecision;` cho thân văn bản sách và tài liệu giúp nét chữ đậm đà, không bị mờ đục hoặc đứt gãy nét khi downscale.
  2. **Thẻ đánh dấu ruy băng trượt mở (Slide-out Ribbon on Hover):** Căn chỉnh gốc thẻ luồn 8px dưới mép phải giấy, giúp icon SVG hiển thị 100% trọn vẹn ở trạng thái idle (`w-[60px]`). Khi rê chuột vào, thanh thẻ trượt mở mượt mà sang phải (`group-hover:w-[132px]`) để lộ tên chức năng ("Tóm tắt", "Phóng to", "Xoay", "Xoá") trực tiếp trên thân ruy băng và loại bỏ toàn bộ tooltip lơ lửng.
  3. **Xóa bỏ nút tia sét:** Cấu hình `devIndicators: { appIsrStatus: false, buildActivity: false }` trong `next.config.ts` và bổ sung CSS triệt tiêu selector `nextjs-portal, [data-nextjs-dev-indicator]` để ẩn hoàn toàn nút tia sét hệ thống.
  4. **Nút "Tải lên":** Đổi nhãn nút từ "Tải tài liệu" thành "Tải lên" ở HUD góc dưới bên trái.
* **Lý do:** Trực quan hóa tương tác thanh nhắc, tăng cường độ tương phản văn bản học thuật ở mọi góc nhìn và làm sạch HUD hệ thống.

---

### ADR-018 — Tích Hợp Hệ Thống Thiết Kế Hiện Đại Từ Dự Án Java Ôn Thi: Coral Accent, Question Card Nảy Động, Đồng Hồ Session & Bản Đồ Ma Trận
* **Ngày quyết định:** `2026-11-07`
* **Quyết định:**
  1. **Bảng màu nhận diện:** Chuyển nền bàn học sang Slate-50 dịu mắt (`#f8fafc`); áp dụng sắc Cam San Hô (`#E0562D` / `#FF5722`) làm signature accent cho toàn bộ các nút hành động, thẻ tiến độ và ma trận.
  2. **Tờ đề thi `PaperSheet`:** Áp dụng hệ thống Option Row chuẩn: badge chữ cái vuông bo góc 6px, hiệu ứng trượt nhẹ khi hover (`translateX(4px)`), nảy pop khi chọn, rung lắc khi chọn sai (`wrongShake`), tỏa xung khi chọn đúng (`correctPulse`) kèm verdict tag "ĐÚNG ✓" / "SAI ✕" và nút "Làm lại" (`resetExam`).
  3. **HUD Floating Docks:** Tích hợp Đồng hồ học tập (Pomodoro Session Timer) đếm giờ thực tế, Bộ chỉnh âm lượng trượt dọc (Volume popover slider) ở góc trái; Nút mở Bản đồ ma trận học tập (Matrix Map Popover) 8 cột kèm xem trước câu hỏi ở góc phải.
  4. **Inteline Popover:** Tái cấu trúc khung hỏi đáp bôi đen với tone cam san hô, icon bóng đèn và thẻ phân tích lý thuyết chuyên sâu.
* **Lý do:** Kế thừa bản sắc thiết kế công thái học cao cấp từ web ôn thi Java, tạo trải nghiệm học tập sinh động, đầm tay và giàu tính tương tác.

---

### ADR-019 — Công Thái Học Không Gian Miro: Minimap Tắt/Bật Phím M, Menu Zoom Dropdown, Dọn Bàn Gọn Gàng & Dây Chỉ Ghim Thám Tử
* **Ngày quyết định:** `2026-11-07`
* **Quyết định:**
  1. **Ẩn/Hiện Minimap thông minh:** Cho phép người học bật/tắt bản đồ thu nhỏ bằng phím `M` hoặc nút `×` trên bản đồ, tránh chiếm diện tích cố định trên mặt bàn.
  2. **Popover Zoom & Điều hướng nhanh:** Nhấp vào số `% Zoom` ở góc dưới phải mở menu điều hướng kiểu Miro: *Vừa vặn toàn bộ (`Alt+1`)*, *Dọn bàn gọn gàng (`Tidy Desk`)*, *Đặt lại 100% (`Ctrl+0`)* và *Bật/Tắt bản đồ nhỏ (`M`)*.
  3. **Tính năng Dọn bàn gọn gàng (`tidyUpDesk`):** Tự động sắp xếp Sách ở trung tâm, Tờ đề thi trắc nghiệm ngay ngắn bên phải, các Giấy ghi chú xếp lưới 2 cột bên trái, góc xoay đưa về $0^\circ$.
  4. **Thanh công cụ ngữ cảnh nổi trên Sticky Note (`StickyNoteItem`):** Tích hợp bảng đổi 5 màu giấy note pastel (Vàng ấm, Cam đào, Xanh mint, Lam nhạt, Hồng phấn) và nút phóng to cỡ chữ (A/A+) một chạm.
  5. **Dây nối tư duy 2.5D phong cách Chỉ Ghim Thám Tử (`VisualLinkThreads`):** Chuyển từ dây laser phát sáng sang sợi chỉ đỏ vật lý có bóng đổ tự nhiên, độ chùng võng trọng lực (gravity sag) và hai đầu đinh ghim tròn kim loại đỏ kết nối từ Sách sang Ghi chú.
* **Lý do:** Tối ưu hóa không gian hiển thị, tăng cường tính trực quan học tập và kế thừa những tinh hoa công thái học tốt nhất từ Miro.

---

### ADR-020 — Kiến Trúc Đồng Bộ Học Nhóm Thời Gian Thực 2 Chiều (Realtime Multiplayer Architecture & Centralized Desk Sync)
* **Ngày quyết định:** `2026-11-11`
* **Quyết định:**
  1. **Đồng Bộ Phòng Học & Hiện Diện Tập Trung Qua Context:** Chuyển toàn bộ quản lý kết nối và danh sách bạn học `multiplayerPeers` vào `StudySpaceContext`. Khi Host mở hộp thoại chia sẻ, hệ thống tự động kích hoạt `startHostingRoom()`, cập nhật query param `?room=XYZ` trên URL mà không tải lại trang và kết nối tức thì vào kênh Realtime Supabase.
  2. **Hệ Thống Bus Sự Kiện `DeskAction` Đa Luồng:**
     - Phát sóng và xử lý 2 chiều các thao tác trên bàn học: di chuyển (`ITEM_MOVE`), xoay (`ITEM_ROTATE`), lật trang (`PAGE_TURN`), thêm/xóa vật thể (`ADD_ITEM`/`DELETE_ITEM`), nét vẽ tự do (`DRAW_STROKE`/`CLEAR_STROKES`).
     - Tự động nạp đồng bộ bàn học ban đầu (`REQUEST_SPACE_STATE`/`SYNC_SPACE_STATE`) cho bạn học mới tham gia.
     - Sử dụng cờ `isApplyingRemoteAction` loại bỏ hoàn toàn hiện tượng dội ngược lặp vô tận (infinite echo loop).
  3. **Chiếu Con Trỏ Chuột Tọa Độ Thế Giới (`MultiplayerCursorsLayer`):**
     - Phát đi tọa độ thế giới của bàn học `(wx, wy) = (clientX - transform.x) / scale`.
     - Phía máy nhận chiếu ngược về pixel màn hình cục bộ `(wx * scale + transform.x, wy * scale + transform.y)`, bảo đảm con trỏ chuột luôn chỉ đúng chính xác vị trí tài liệu dù hai bên có độ thu phóng hay kích thước màn hình khác nhau.
* **Lý do:** Khắc phục triệt để lỗi không thấy bạn học vào phòng và bàn học không đồng bộ thao tác giữa các thành viên, mang lại trải nghiệm học nhóm trực quan, liền mạch và sống động.
* **Giải pháp thay thế bị bác bỏ:** Lưu từng thao tác kéo thả vào Database PostgreSQL qua REST API. Bị bác bỏ vì gây nghẽn database, độ trễ cao (>300ms) và làm giảm hiệu năng trải nghiệm kéo thả mượt mà 60fps.
