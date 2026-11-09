# AGENTS.md — Quy Chuẩn Thiết Kế & Phát Triển ViTudy

> ### ⚡ BỘ CHỈ DẪN BẮT BUỘC CHO MỌI AGENT (MANDATORY AGENT DIRECTIVES)
> 1. **Before any work:** Read `docs/ai/00_INDEX.md`, then only the files relevant to the task. Use `03_SYMBOL_INDEX.md` and `02_FILE_MAP.md` to locate code instead of scanning the repo.
> 2. **After any work:** Follow the UPDATE PROTOCOL in `docs/ai/00_INDEX.md` Step 4.
> 3. **If docs and code disagree:** Code wins; fix the docs and log it in the changelog.
> 4. **Auto-Update Directives:** Bất cứ khi nào người dùng đề cập, thảo luận hoặc đưa ra yêu cầu chỉnh sửa liên quan đến một quy tắc thiết kế hay kỹ thuật nào, Agent **BẮT BUỘC TỰ ĐỘNG CẬP NHẬT NGAY** vào file `AGENTS.md` này mà không cần đợi người dùng phải nhắc.
> 5. **Single Source of Truth:** Codebase này chỉ sử dụng duy nhất file `AGENTS.md` cho các chỉ dẫn của Agent. Tuyệt đối không tạo hay sử dụng file `CLAUDE.md`.

---

Tài liệu này lưu giữ toàn bộ các quy tắc, quyết định kiến trúc và tiêu chuẩn thiết kế bắt buộc cho dự án **ViTudy** (Không gian học thức tích hợp AI 2.5D). Mọi Agent và lập trình viên khi thao tác trên codebase này **BẮT BUỘC** tuân thủ tuyệt đối các quy tắc dưới đây.

---

## 1. Bảng Màu & Thẩm Mỹ Giao Diện (Modern Educational Cockpit)

* **Bảng màu HUD / Hệ thống:**
  * Nền tảng: Sử dụng **Trắng (`#ffffff`)**, **Slate-50 (`#f8fafc`)**, **Đen (`#0f172a`)** và dải thang độ xám (`slate-100` đến `slate-800`).
  * **Màu điểm nhấn nhận diện — Thống nhất mã màu Cam ViT (Signature Brand Accent):**
    * Tên chuẩn: **Cam ViT** — Mã màu chính thức: **`#E0562D`** (trạng thái hover: **`#c9451e`**).
    * Phạm vi áp dụng đồng bộ: Nút Tải lên, nút Mở bản đồ khi ẩn, nút "Nhận ViToken" điểm danh, nút "Mở tài liệu" ở Chợ, ngọn lửa chuỗi học tập khi có chuỗi, điểm tiến độ, nút nộp bài, các huy hiệu trạng thái chính.
    * Hệ sắc độ đệm: Nền mềm `--accent-soft: #FFF7ED`, viền `--accent-border: #FFEDD5`, chữ `--accent-text: #9A3412` (chuẩn WCAG AA).
  * **Biểu Tượng Thương Hiệu ViTudy & Icon ViToken Chính Thức (Official Brand Logo & ViToken Coin):**
    * **Biểu tượng thương hiệu ViTudy (Logo đại diện Web ViTudy - Ảnh 1)**: Sử dụng hình ảnh `assets/icon/logo.png` (`/icons/vitudy.png`, `favicon.ico`, `src/app/icon.png`) làm logo đại diện chính thức của ViTudy trên toàn bộ thanh điều hướng `TopLeftNav`, trang chủ `HomePage`, trang giới thiệu `AboutPage`, và tiêu đề tab trình duyệt (Favicon).
    * **Kiểu chữ (Typography) thương hiệu ViTudy thống nhất:** Chữ "ViTudy" bên cạnh logo ở toàn bộ các màn hình (cả `TopLeftNav` lẫn thanh bên `HomePage`) bắt buộc sử dụng chuẩn nhận diện thương hiệu màu Cam ViT in đậm: `text-lg font-black tracking-tight text-[#E0562D] select-none leading-none`.
    * **Lược bỏ nút Home trên thanh TopLeftNav:** Do nhấp vào logo hoặc chữ "ViTudy" ở đầu thanh đã điều hướng về trang chủ (`/?view=home`), nút Home riêng biệt được lược bỏ để giữ thanh điều hướng tinh gọn và thanh thoát.
    * **Biểu tượng ViToken (Coin ViToken / Credit - Ảnh 2)**: Sử dụng vector `assets/icon/vitoken.svg` (`/icons/vitoken.svg`) làm đồng tiền ViToken chính thức trong toàn bộ số dư ví, ô credit trên HUD (`TopRightWallet`), danh sách giao dịch, bảng nạp VietQR, và các nơi hiển thị token trong Chợ tài liệu.
    * **Tương Thích Đường Dẫn Tài Nguyên Tĩnh (Static Asset Base Path Helper — `getAssetPath`):**
      * Khi triển khai trên môi trường có subpath như GitHub Pages (`basePath: "/ViTudy"`), toàn bộ thẻ `<img>` và đường dẫn file tĩnh trong `public/` (ví dụ `/icons/vitudy.png`, `/icons/vitoken.svg`, `/icon.svg`, `/manifest.json`) **BẮT BUỘC** được bọc qua hàm `getAssetPath(path)` (`@/lib/assets`).
      * Hàm `getAssetPath` tự động phát hiện `basePath` từ runtime (`window.location.pathname.startsWith('/ViTudy')`) hoặc biến môi trường `process.env.NEXT_PUBLIC_BASE_PATH`, ngăn chặn hoàn toàn lỗi ảnh 404 (broken image icon) trên GitHub Pages.
    * **Quy Chuẩn Khống Chế Kích Thước Ảnh & SVG (Strict Image & SVG Size Containment):**
      * File vector SVG ViToken (`vitoken.svg`) bắt buộc dùng `viewBox="0 0 1500 1500" width="100%" height="100%"`, triệt tiêu hoàn toàn kích thước tĩnh `width="2000" height="2000"`.
      * Mọi thẻ `<img>` hiển thị logo hoặc coin bắt buộc sử dụng class Tailwind hợp lệ (như `w-5 h-5`, `w-6 h-6`, `w-8 h-8`), kèm thuộc tính HTML `width={...} height={...}` và inline style phòng vệ `style={{ width, height, maxWidth, maxHeight }}`. Nghiêm cấm sử dụng các class không có trong bảng quy cách của Tailwind (như `w-5.5`), bảo đảm 100% icon luôn nằm đúng kích thước vị trí nó đứng, tuyệt đối không bị bung to che tràn màn hình.
  * **Quy Chuẩn React Portal Cho Toàn Bộ Hộp Thoại / Modal (Strict React Portal Rule — 100% Modals):**
    * Mọi hộp thoại (`Modal`, `Dialog`, `Overlay`) phải được bọc trong `createPortal(..., document.body)` với `z-[9990]..z-[9999]`.
    * Nghiêm cấm render modal trực tiếp bên trong container HUD có CSS `transform` (như `TopRightWallet`, `BottomLeftKnowledge`, `MultiplayerBar`), vì các thuộc tính CSS transform khiến phần tử con `fixed inset-0` bị giới hạn trong khung chứa của cha, dẫn đến việc modal bị co dúm thành thanh dọc 40px mép màn hình.
  * **Quy Chuẩn Thanh Học Nhóm Trực Tuyến (Multiplayer Presence Bar):**
    * Khi người dùng học cá nhân một mình (không có tham số `?room=` trên URL và không có bạn học cùng), thanh presence dưới đáy **tuyệt đối không hiển thị**.
    * Nút "Thoát" (`LogOut`) trên thanh sẽ ngắt kết nối kênh Realtime, dọn dẹp danh sách bạn bè, xóa tham số `room` khỏi URL và ẩn thanh ngay lập tức mà không cần tải lại trang.
  * **Quy Chuẩn Cài Đặt AI & Kiểm Tra Kết Nối (AI Configuration & Live Test):**
    * Giao diện cấu hình AI gồm 4 bước chuẩn mực:
      1. Chọn nhà cung cấp: Hệ thống ViTudy (mặc định), Google Gemini (BYOK), OpenAI (BYOK), OpenAI OAuth (ChatGPT Plus).
      2. Nhập thông tin xác thực tương ứng (Không cần với ViTudy; API Key kèm link lấy key cho Gemini/OpenAI; mã ủy quyền cho ChatGPT Plus).
      3. Chọn mô hình AI: Dropdown đồng bộ theo nhà cung cấp, hiển thị rõ ràng tên mô hình và công năng.
      4. Nút kiểm tra hoạt động (Test AI): Gửi truy vấn thực tế kiểm tra API và đo độ trễ mạng ms thời gian thực.
  * **Quy Chuẩn Thanh Toán VietQR & MBBank (SePay VietQR Standards):**
    * Sử dụng mã NAPAS BIN chính thức của MBBank: `970422` (hoặc `MB`) kèm template `compact2` để 100% ứng dụng ngân hàng và ví điện tử quét mã truy vấn thông tin thành công.
    * Tài khoản thụ hưởng mặc định: `99924052005` - `LE VO THANH NAM`.
    * Cơ chế dự phòng ngoại lệ: Khi hàm RPC Supabase chưa cập nhật trong schema cache, hệ thống tự động sinh mã VietQR hợp lệ trên client để trải nghiệm thanh toán luôn liền mạch.
  * **Khoảng Cách HUD Bám Sát Mép Tường Trình Duyệt (Snug HUD Wall Spacing — 4px Strict):**
    * Toàn bộ các khung, nút ở HUD được đưa sát vào tường trình duyệt: khoảng cách từ mép hướng ra ngoài của HUD đến rìa web chỉ còn **4px (`1/4` so với 16px mặc định cũ: `top-1`, `bottom-1`, `left-1`, `right-1`)**.
    * Áp dụng đồng bộ cho: `TopLeftNav` (`top-1 left-1`), `TopRightWallet` (`top-1 right-1`), `LeftCreationBar` (`left-1`), `BottomLeftKnowledge` (`bottom-1 left-1`), `BottomRightToolkit` (`bottom-1 right-1`), và `MultiplayerBar` (`bottom-1 left-1/2 -translate-x-1/2` căn giữa sát mép dưới).
    * Tối ưu hóa triệt để không gian học tập trung tâm của mặt bàn, triệt tiêu khoảng hở thừa không cần thiết.
  * **Biểu Tượng Chuỗi Ngày Học Tập (Streak Flame Icon):**
    * Biểu tượng ngọn lửa (`w-8.5 h-8.5`) màu Cam ViT (`#E0562D`) với phần bụng tròn ôm trọn số ngày chuỗi học tập màu trắng ở bên trong.
    * Tọa độ căn số tuyệt đối: `top-[62%] left-1/2 -translate-x-1/2 -translate-y-1/2`, số chuỗi nằm chính xác 100% trong tâm bụng lửa, cân đối 4 phía, không lệch, không che khuất và không tràn ra ngoài viền ngọn lửa.
  * **Quy Chuẩn Nút Mở Bản Đồ Khi Ẩn (Minimap Reopen Button):**
    * Đồng bộ hoàn toàn style với Nút Tải lên tài liệu: khung vuông bo góc `rounded-xl`, kích thước chuẩn `w-10 h-10`, nền trắng `bg-white hover:bg-orange-50/80`, viền `border border-slate-300 hover:border-orange-300`, đổ bóng nhẹ `shadow-sm`, icon `Map` SVG màu Cam ViT (`#E0562D`, `stroke-[2.4]`). Tuyệt đối không dùng nút tròn nền cam độc lập.
  * **Hệ thống màu trạng thái ngữ nghĩa (Status Tokens):**
    * **Đúng (Success / Correct):** Xanh lục bảo ngọc (`#15803D`), nền `#ECFDF5`, viền `#A7F3D0`.
    * **Sai (Danger / Wrong):** Đỏ ruby thanh nhã (`#DC2626`), nền `#FEF2F2`, viền `#FECACA`.
    * **Gợi ý (Warning / Hint):** Vàng mật ong hổ phách (`#92400E`), nền `#FEF3C7`, viền `#FDE68A`.
  * **Quy Chuẩn Điều Hướng Quay Lại (Context-Aware Back Navigation Standard):**
    * **Đúng ngữ cảnh điểm xuất phát:**
      * Khi người dùng vào Tài khoản từ Bàn học (`/profile?from=desk`), nút quay lại hiển thị rõ ràng **"Về Bàn Học"** và điều hướng chính xác về `/?view=desk`.
      * Khi người dùng vào Tài khoản từ Trang chủ (`/profile?from=home`), nút quay lại hiển thị rõ ràng **"Về Trang Chủ"** và điều hướng chính xác về `/?view=home`.
    * **Cơ chế lưu trữ ngữ cảnh dự phòng (`sessionStorage`):** Trạng thái view hiện tại (`'desk'` / `'home'`) được tự động ghi nhớ vào `sessionStorage('vitudy_last_view')` để các trang con (`/profile`, `/market`, `/dashboard`) luôn quay về đúng điểm xuất phát của người dùng.
    * **Đồng bộ phản ứng thời gian thực trên Trang Chủ (`useSearchParams`):** Trang chủ `/` sử dụng `useSearchParams()` để lắng nghe thay đổi của tham số `view` (`?view=desk` / `?view=home`) trong Next.js App Router, tự động render view tương ứng ngay lập tức mà không bị lỗi trễ chu kỳ render hoặc nhảy nhầm trang.
  * **Quy Chuẩn Bảng Chọn Emoji & Hình Dán Chuẩn Miro (Miro-Grade Emoji & Sticker Flyout):**
    * **9 danh mục biểu tượng chuẩn Miro:** Gần đây (`recent`), Biểu cảm & Con người (`people`), Động vật & Tự nhiên (`nature`), Đồ ăn & Thức uống (`food`), Hoạt động & Thể thao (`activities`), Du lịch & Địa điểm (`travel`), Đồ vật & Dụng cụ (`objects`), Ký hiệu & Biểu trưng (`symbols`), Cờ các quốc gia (`flags`).
    * **Hiển thị Twemoji Vector SVG sắc nét 100% ở mọi mức zoom:** Toàn bộ biểu tượng cảm xúc được render qua vector SVG chính thức của Twitter Twemoji (`https://cdn.jsdelivr.net/gh/twitter/twemoji@.../svg/{cp}.svg`), triệt tiêu hoàn toàn hiện tượng vỡ hạt, răng cưa hoặc mờ nét khi phóng to thu nhỏ bàn học.
    * **Bộ chọn tông màu da (Skin tone selector):** Cho phép người dùng chuyển đổi linh hoạt 5 tông màu da chuẩn Unicode (Sáng, Sáng vừa, Trung bình, Ngăm, Tối) cho các biểu tượng bàn tay và con người.
    * **Lưu trữ biểu tượng gần đây (Recent Emojis):** Tự động ghi nhớ các emoji vừa sử dụng vào `localStorage`, có nút `Clear` để xóa nhanh lịch sử.
    * **Kho GIF trực tuyến GIPHY thời gian thực:** Kết nối API trực tuyến GIPHY với cơ chế debounce tìm kiếm 300ms, bộ tag gợi ý nhanh (#Study, #Anime, #Cat, #Celebration...) và tự động truyền URL chất lượng cao (`downsized_large` / `original`) lên bàn học để ảnh động luôn sắc nét, không bị nhòe hình.
    * **Ghi hình màn hình (Record screen) tích hợp trong menu dấu "+":** Đưa tính năng quay video bài giảng vào danh mục công cụ mở rộng (`LeftCreationBar`), loại bỏ nút camera dư thừa ở góc dưới bên trái (`BottomLeftKnowledge`).
    * **Quy chuẩn độ sắc nét văn bản ClearType trên Windows:** Triệt tiêu hoàn toàn các cờ CSS `WebkitFontSmoothing: 'antialiased'` và `MozOsxFontSmoothing: 'grayscale'` gây mờ chữ trên màn hình Windows trong khối mã nguồn (`CodeBlockItem`) và sơ đồ tư duy (`MindMapNodeItem`), đảm bảo font chữ luôn đậm nét, rõ ràng và dễ đọc ở mọi độ phân giải.
* **Các vùng ngoại lệ có chủ đích (Màu sắc vật thể thực):**
  * **Giấy ghi chú (Sticky Note):** Giữ màu vàng ấm đặc trưng của giấy note (`#fef08a`, `#fed7aa`...).
  * **Bản đồ thu nhỏ (Minimap) & Ma trận (Matrix Map):** Cho phép màu nhận diện vật thể (sách xanh xám, tài liệu xanh ngọc, note vàng, ô xanh/đỏ bài thi).
  * **Nét vẽ bút / Bút dạ quang:** Giữ màu mực do người dùng chọn (vàng dạ quang, xanh, đen, đỏ).
  * **Đèn tín hiệu trạng thái:** Màu xanh lá (`emerald-400`) báo hiệu trạng thái hoạt động ("Đang đồng bộ góc nhìn").
* **Mặt bàn học (Desk Surface):**
  * Sử dụng nền **Slate xám nhạt thanh nhã (`#e8ebf0`)** kết hợp lưới ô kẻ caro mảnh nhẹ (`DeskGrid`), làm nổi bật các tài liệu thuần trắng hoặc các HUD trắng với độ tương phản cao, tạo cảm giác không gian học sáng sủa, tinh gọn, chống chói và chống mỏi mắt. Không dùng nền tối hay nền xanh chìm.
* **Thống Nhất Màu Sắc Icon HUD (Black & White Strict Icon Scheme):**
  * Toàn bộ biểu tượng icon trong HUD **chỉ sử dụng màu Đen (`text-slate-900`) trên nền trắng**, hoặc **Trắng (`text-white`) trên nền cam thương hiệu**. Tuyệt đối không phối màu đa dạng lung tung (xanh, đỏ, vàng...).
  * Khi người dùng nhấp chọn hoặc một công cụ/nút đang kích hoạt trên nền trắng: **phần nền chuyển sang xám đậm hơn (`bg-slate-200`)** để biểu thị trạng thái đang chọn.
* **Quy Chuẩn Đồng Bộ Chợ Tài Liệu (Marketplace Standards — Trang Chợ & Modal Chợ):**
  * **Thống nhất tên gọi & thương hiệu duy nhất:** Toàn bộ hệ thống (menu, sidebar, header, modal) gọi thống nhất là **"Chợ Tài Liệu"** (xóa bỏ hoàn toàn tên cũ "Chợ Tri Thức KnowInherit"). Phụ đề chuẩn: *"Kho tri thức mở ViTudy — Khám phá và trao đổi tài liệu học tập cùng cộng đồng."*
  * **Thống nhất 3 loại tài liệu & icon:**
    * **Sách (`book`):** Icon `BookOpen`, giá mặc định 50 ViToken.
    * **Tờ tóm tắt (`paper`):** Icon `FileText`, giá mặc định 15 ViToken.
    * **Đề thi (`exam`):** Icon `HelpCircle`, giá mặc định 30 ViToken.
  * **Thống nhất tiền tệ & Logo ViToken:**
    * Sử dụng đơn vị **ViToken** (ký hiệu viết tắt `V`, đi kèm chú thích rõ ràng `1 V = 1 ViToken`).
    * Sử dụng icon đồng xu chính thức `/icons/vitoken.svg` (Ảnh 2) qua helper `getAssetPath('/icons/vitoken.svg')` trong mọi khối số dư ví và giá tài liệu.
  * **Quy chuẩn thẻ tài liệu & Chế độ xem:**
    * **Chế độ xem mặc định:** Chế độ lưới thẻ (`grid`) là mặc định, cân xứng 3 cột (`max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5`), triệt tiêu khoảng hở lệch bên phải.
    * **Bìa da nâu bên trái (Modal):** Thiết kế tối giản, sang trọng với viền dập da, logo ViTudy, icon loại tài liệu dập chìm và ngày chia sẻ. Tuyệt đối không nhồi nhét lặp lại tiêu đề 3 lần lên bìa sách.
    * **Thông tin tin cậy bắt buộc:** Dấu xác thực tác giả (`CheckCircle2 text-sky-600`), số trang, lượt mua, ngày cập nhật, điểm AI có tiền tố `AI: [score]/100` kèm tooltip giải thích tiêu chí.
    * **Triệt tiêu lặp giá:** Khối giá hiển thị 1 lần duy nhất bên trái footer thẻ, bên phải là nút hành động "Xem thử" và "Mua [X] V" (hoặc "Thêm vào bàn học" khi đã sở hữu).
    * **Trạng thái Đã sở hữu:** Khi tài liệu đã được mua, hiển thị badge `Đã sở hữu` và nút `Thêm vào bàn học` (icon `ArrowRight` / `Plus`), nhấp vào sẽ tự động mount tài liệu lên bàn học đang mở và đóng modal.
    * **Bộ lọc trực quan & Nút Đặt lại:** Bộ lọc loại tài liệu, môn học, điểm AI, mức giá dạng chip hoặc dropdown tinh gọn, luôn có nút `Đặt lại` (`RotateCcw`) khi có bất kỳ bộ lọc nào kích hoạt.
    * **Tương phản WCAG AA:** Nhãn và chữ phụ dùng `text-stone-700` hoặc đậm hơn, bảo đảm tỷ lệ tương phản >= 4.5:1.
  * **Quy Chuẩn Trang Tài Khoản (`/profile`) & Quản Lý ViToken Chuẩn Mực:**
    * **Tỷ lệ quy đổi chuẩn duy nhất:** **1.000 VNĐ = 1 ViToken** (2.000 đ = 2 V; 10.000 đ = 10 V; 27.000 đ = 30 V gồm 3 V tặng kèm; 85.000 đ = 100 V gồm 15 V tặng; 255.000 đ = 300 V gồm 45 V tặng). Tuyệt đối cấm hiển thị tỷ lệ cũ 1đ = 1 ViToken gây phóng đại lố bịch (+30.000 V).
    * **Định dạng số tiếng Việt thống nhất:** Dấu chấm ngăn cách hàng nghìn (`27.000 đ`, `+30 ViToken`), triệt tiêu hoàn toàn sự lẫn lộn giữa dấu phẩy và dấu chấm.
    * **Quản lý vòng đời giao dịch nạp tiền:** Giao dịch VietQR ở trạng thái chờ thanh toán sau 15 phút phải tự động chuyển thành `expired` ("Đã hết hạn"). Giao dịch đang chờ trong hạn hiển thị nút `Tiếp tục thanh toán`, giao dịch hết hạn hiển thị `Tạo mã mới`.
    * **Bộ lọc trạng thái & Phân trang không cuộn lồng:** Cung cấp 4 bộ lọc trạng thái (Tất cả, Thành công, Chờ thanh toán, Đã hết hạn). Danh sách giao dịch hiển thị trên cùng mặt phẳng trang, sử dụng nút "Xem thêm" phân trang thay vì khung cuộn lồng gây kẹt thao tác cuộn.
    * **Đồng bộ Tên gọi (Nickname) với Trang Chủ:** Thêm trường "Tên gọi" (nickname ngắn) trong thông tin cá nhân, tự động đồng bộ thời gian thực với lời chào ở trang chủ (`Ôn bài thôi, [Tên gọi]`). Nút "Lưu thay đổi" bị vô hiệu hóa khi chưa chỉnh sửa và hiển thị phản hồi "Đã lưu".
    * **Khóa AI của riêng bạn (Personal AI Key):** Đổi tên chuẩn từ "BYOK" thành "Khóa AI của riêng bạn", che dấu ký tự nhập dạng mật khẩu kèm nút bật/tắt hiển thị (`Eye`/`EyeOff`), nút "Kiểm tra" kết nối trực tiếp đến mô hình và "Xóa khóa", kèm liên kết nhanh dẫn vào modal "Cài đặt kết nối AI".
    * **Quy trình xóa tài khoản 2 bước an toàn (Account Deletion & Data Portability):** Yêu cầu gõ lại chính xác email để xác nhận; cung cấp nút "Tải dữ liệu của tôi về máy (JSON)"; nêu rõ điều khoản từ bỏ số dư ViToken, tài liệu đã chia sẻ lên chợ cộng đồng sẽ được ẩn danh lưu trữ, kèm chính sách ân hạn khôi phục trong vòng 3 ngày qua email hỗ trợ.
  * **Quy Chuẩn Bộ Chọn Biểu Tượng & Hình Dán Học Thuật (`StickerEmojiPickerFlyout`):**
    * **100% Việt hóa:** Toàn bộ thanh phân loại tab ("Biểu tượng", "Hình dán", "Ảnh GIF", "Tất cả") và các chip danh mục phụ được dịch sang tiếng Việt trong sáng, tự nhiên.
    * **Thống nhất màu thương hiệu Cam ViT (`#E0562D`):** Triệt tiêu hoàn toàn các gam màu tím/xanh (`indigo-600`, `blue-100`) lạc quẻ; sử dụng Cam ViT cho trạng thái chọn và Slate-900 cho độ tương phản sắc sảo.
    * **Phân loại hình dán vector học thuật chuẩn:** Chia thành 4 nhóm thiết thực cho việc học tập trên bàn học: "Đã hiểu" (`da_hieu`), "Cần ôn" (`can_on`), "Quan trọng" (`quan_trong`), và "Công thức & Dụng cụ" (`cong_thuc`).
    * **Mặt nạ mờ dần 2 mép (Gradient Edge Fade Mask):** Triệt tiêu thanh cuộn thô dày ở danh mục chip ngang bằng mặt nạ gradient CSS mềm mại hai bên mép.
    * **Kích thước chạm chuẩn công thái học (44×44px):** Mỗi nút emoji đảm bảo kích thước tối thiểu `min-w-[44px] min-h-[44px] w-11 h-11`, có thuộc tính trợ năng `aria-label` và `title` hiển thị tên tiếng Việt.
  * **Quy Chuẩn Modal Mời Bạn Cùng Học (`InviteModal` & `BottomLeftKnowledge`):**
    * Tiêu đề thống nhất: **"Mời bạn cùng học"**.
    * Thu gọn các thông số kỹ thuật nội bộ (Supabase) vào mục mở rộng nâng cao riêng biệt cho lập trình viên.
    * Hiển thị đường dẫn phòng học gọn gàng, nút "Sao chép" có phản hồi thị giác tức thì ("Đã sao chép"), bổ sung tùy chọn phân quyền ("Cùng chỉnh sửa" / "Chỉ xem") và danh sách thành viên đang có mặt trong phòng kèm đèn tín hiệu xanh.
  * **Quy Chuẩn Nhật Ký Học Tập (`/dashboard`):**
    * Tiêu đề trang căn trái đồng trục với nút quay lại.
    * Biểu đồ nhịp điệu học tuần hiển thị rõ số phút khi rê chuột kèm đường mục tiêu đứt nét chuẩn (30 phút/ngày).
    * Lịch học 28 ngày bắt đầu chuẩn từ Thứ Hai (**T2, T3, T4, T5, T6, T7, CN**), hiển thị nhãn chuyển tháng (`01 Th11`) và vòng tròn viền cam `ring-2 ring-[#E0562D]` độc lập cho ngày hôm nay.
    * Nút hành động "Làm bài thi thử ngay" khi số bài thi bằng 0, widget tiến độ mục tiêu học ngày và widget thẻ ghi nhớ SM-2 cần ôn.
  * **Quy Chuẩn Nạp & Kéo Thả Tệp Thực Tế Lên Bàn Học (Zero-Simulated Text Policy):**
    * Khi người dùng kéo thả hoặc tải tệp `.pdf`, hình ảnh hoặc văn bản lên mặt bàn học, hệ thống **tuyệt đối không sinh văn bản giả lập định sẵn** (như `"Nội dung trích xuất từ tệp 'TenFile.pdf'..."`).
    * Bắt buộc sử dụng `parsePdfFile` trích xuất đầy đủ văn bản thực tế của từng trang tài liệu và đồng thời render canvas hình ảnh độ phân giải cao của trang gốc vào từng trang sách/tài liệu (`leaf.image`), đảm bảo trải nghiệm đọc tài liệu trung thực 100%.

---

## 2. Tuyệt Đối Cấm Emoji / Emote — Sử Dụng Icon SVG Chuẩn (Zero-Emoji Policy)

* **Nghiêm cấm tuyệt đối:** Không sử dụng bất kỳ ký tự emoji / emote Unicode nào (như 💡, 👏, 🔥, 🎯, ❓, ✨, ✂️, 📌, 🗺️, 📖, 🚀...) trên toàn bộ giao diện người dùng, nút bấm, HUD, nhãn trạng thái hay modal hệ thống.
* **Quy chuẩn thay thế:** Sử dụng 100% **Icon SVG vector** sắc nét, tối giản, lấy cảm hứng và phong cách chuẩn từ [Morphicons](https://www.morphicons.com/) hoặc bộ icon vector chuẩn mực như `lucide-react`. Các icon chuyển động phải mượt mà, đúng ngữ nghĩa công thái học.

---

## 3. Kỷ Luật Thiết Kế Giao Diện — Combo Skill Bắt Buộc (Skill-First UI/UX)

* **Cấm tuyệt đối tự ý vẽ mới giao diện ("Vibe Coding"):** Không tự tiện bịa đặt cấu trúc layout, khoảng cách hay hiệu ứng thị giác theo cảm tính.
* **Quy trình bắt buộc khi thiết kế, tạo mới hoặc tinh chỉnh UI:** Phải tự động kích hoạt và tuân thủ bộ combo skill giao diện cao cấp đã cài đặt:
  1. **`stageshow`**: Chuẩn mực thiết kế Faux UI, bố cục cận cảnh (hard crop), cửa sổ vệ tinh, loại bỏ text thừa (`standard fidelity`), chuyển động có nguyên nhân rõ ràng.
  2. **`hallmark` & `design-taste-frontend`**: Triệt tiêu các giao diện rập khuôn AI, chặn 3 card gradient tím / font Inter nhạt nhòa, định hướng thẩm mỹ chuẩn giải thưởng Awwwards / One Page Love.
  3. **`impeccable`**: Thanh tra và kiểm duyệt độ tương phản chuẩn WCAG 2.2 AA/AAA, phân cấp thị giác (visual hierarchy) chặt chẽ.
  4. **`awesome-design-md` & `google-design-md`**: Thiết lập và bám sát hợp đồng design tokens và triết lý thiết kế chuẩn mực.
  5. **`emil-kowalski-skills`**: Tối ưu vi tương tác (micro-interactions) phản hồi tức thì (<300ms), đường cong giảm tốc dứt khoát, loại bỏ animation rề rà hay giật lag.

---

## 4. Tương Tác Mặt Bàn Học (Infinite Desk Interaction)

* **Phân định thao tác Chuột & Công cụ Vẽ:**
  * **Khi ở chế độ con trỏ (`cursor`):** Kéo chuột trên mặt bàn dùng để di chuyển không gian bàn học (pan canvas).
  * **Tối Ưu Hiệu Năng Phóng To / Thu Nhỏ Bàn Học (Smooth 60fps Zero-Lag Canvas Zoom):**
    * Cơ chế gom sự kiện cuộn chuột qua `requestAnimationFrame` (RAF Coalescing): Toàn bộ các micro-ticks cuộn chuột phát sinh từ trackpad hoặc con lăn chuột được tích lũy theo tỷ lệ hàm mũ mượt mà (`Math.exp(-normalizedDelta * 0.0016)`) và áp dụng đúng 1 lần duy nhất trong mỗi frame màn hình 16.6ms, loại bỏ hoàn toàn bão re-render và hiện tượng giật lag.
    * Hiển Thị Vector Text Sắc Nét Ở Mọi Mức Zoom (Crisp Vector Sharpness at All Zoom Levels): Loại bỏ hoàn toàn `will-change: transform`, `backface-visibility: hidden` và `translate3d(..., 0)` trên container bàn học. Sử dụng 2D transform trực tiếp `translate(x, y) rotate(deg) scale(s)` cùng `text-rendering: geometricPrecision`. Nhờ đó Chromium không rasterize tĩnh một bitmap texture rồi phóng to gây vỡ hạt/pixelated font, mà luôn vẽ lại vector glyph ở độ phân giải thực của màn hình tại mọi mức zoom (kể cả 200% - 400%).
    * Bộ nhớ đệm toàn cục KaTeX (`katexHtmlCache`): Lưu trữ kết quả biên dịch HTML của công thức toán học trong `Map`, đảm bảo chi phí biên dịch bằng 0ms trên các lần render tiếp theo.
    * Memoization toàn diện (`React.memo`): Toàn bộ các thực thể bàn học (`BookSpread`, `PaperSheet`, `StickyNoteItem`, `ExamQuizCard`, `DeskGrid`, `DeskDrawingCanvas`, `VisualLinkThreads`, `Minimap`) được bọc `React.memo` để triệt tiêu re-render thừa khi camera thay đổi.
  * **Điều Hướng Bàn Học Bằng Phím (WASD & Phím Mũi Tên):**
    * Khi người dùng không đang nhập liệu văn bản (`input`, `textarea`, `contenteditable`), có thể bấm giữ các phím `W`, `A`, `S`, `D` hoặc 4 phím mũi tên (`Up`, `Left`, `Down`, `Right`) để lia tầm nhìn camera mượt mà theo thời gian thực (60fps).
    * `W` / `Mũi tên lên`: Lia camera lên trên.
    * `S` / `Mũi tên xuống`: Lia camera xuống dưới.
    * `A` / `Mũi tên trái`: Lia camera sang trái (khi không giữ `Alt`).
    * `D` / `Mũi tên phải`: Lia camera sang phải (khi không giữ `Alt`).
  * **Khi cầm bút (`pen` hoặc `highlighter`):**
    * Kéo chuột ở bất kỳ đâu trên mặt bàn sẽ **tự động vẽ tự do nét mực**. Tuyệt đối không được kéo dịch bàn học làm nét bút bị co cụm thành một chấm.
    * Khi muốn di chuyển bàn học trong lúc đang chọn bút: Người dùng **giữ phím `Alt` và kéo chuột (`Alt + Drag`)** để pan canvas.
* **Hitbox của Tài liệu & Vật thể:**
  * Vùng click / hitbox của sách và tài liệu phải bám sát chính xác kích thước hiển thị của UI.
  * Tuyệt đối không để margin, padding vô hình hoặc vùng bắt sự kiện tràn ra ngoài che khuất mặt bàn trắng, gây kẹt thao tác kéo chuột của người dùng.
* **Cấm Tự Động Nuốt/Gộp Vật Thể Khi Kéo Thả (Zero Silent Swallowing):**
  * Mọi tài liệu khi kéo đè lên sách hoặc vật thể khác phải giữ nguyên vẹn vị trí và z-index đè lên trên, cho phép người dùng tự do sắp đặt chồng chéo tài liệu như mặt bàn học thực tế.
  * Tuyệt đối không tự động gộp trang hay xóa biến mất vật thể đang kéo khi thả chuột lên vật thể khác. Thao tác gom gộp chỉ được thực hiện khi người dùng chủ động chọn chức năng tương ứng.
* **Vùng Cầm Nắm & Kéo Di Chuyển Chuyên Biệt (Dedicated Drag Handles):**
  * **Sách (`BookSpread`):** Chỉ cho phép kéo di chuyển bằng **phần viền da nâu của bìa sách**, **phần tiêu đề chương (header)**, **phần số trang (footer)**, và **huy hiệu tên sách dưới bìa**. Phần thân đoạn văn (`<p>`) nghiêm cấm bắt sự kiện kéo để người dùng tự do bôi đen chọn chữ.
  * **Tờ giấy đơn (`PaperSheet`):** Kéo di chuyển bằng **phần thanh tiêu đề ở trên** và **chân trang**. Thân giấy phục vụ bôi đen chữ và tương tác.
  * **Giấy ghi chú (`StickyNoteItem`):** Kéo di chuyển bằng **dải băng dính keo dán phía trên** và **thanh đếm ký tự phía dưới (footer)**. Vùng soạn thảo ghi chú (`textarea`) không bắt sự kiện kéo. Áp dụng `w-full flex-1 min-h-0 mb-1.5 pb-1` tách biệt độc lập với thanh footer `flex-shrink-0`, đồng thời chiều cao note tự động co dãn theo số dòng thực tế, đảm bảo dòng chữ cuối cùng luôn cách thanh ngang footer ít nhất 8-12px, triệt tiêu 100% tình trạng chữ bị đè dưới thanh ngang.
* **Sợi Chỉ Đỏ Nối Đinh Ghim (`VisualLinkThreads`):**
  * Luôn render ở lớp trên cùng (`z-index: 100+`) đè lên trên tất cả sách, tài liệu và giấy ghi chú. Khi người dùng nhấp vào note hoặc sách, sợi chỉ và đinh ghim luôn hiển thị rõ ràng trên mặt giấy, không bao giờ bị chìm ra phía sau.
* **Vẽ Nét Mực In Lên Tài Liệu & Di Chuyển Theo Vật Thể (In-Document Ink Attachment):**
  * Khi người dùng vẽ bằng bút (`pen`) hoặc bút dạ quang (`highlighter`) lên bề mặt **Sách (`BookSpread`)**, **Tờ giấy đơn (`PaperSheet`)** hoặc **Giấy ghi chú (`StickyNote`)**:
    * Hệ thống tự động xác định tài liệu nằm ngay dưới nét vẽ và chuyển đổi tọa độ điểm vẽ sang hệ tọa độ cục bộ (`item-local coordinates`) của tài liệu đó (`attachedToItemId`).
    * Lớp hiển thị mực cục bộ `<ItemDrawingOverlay />` được render trực tiếp bên trong container của tài liệu.
    * Khi người dùng kéo di chuyển hoặc xoay tài liệu ở bất kỳ góc độ nào, các nét vẽ trên đó **luôn bám chặt và di chuyển/xoay chuẩn xác 100% cùng tài liệu** mà không bị lệch hay trôi nét.
    * Khi tài liệu bị xóa khỏi bàn học, toàn bộ nét mực gắn với tài liệu đó tự động được dọn dẹp sạch sẽ.
* **Quy Chuẩn Nhận Diện Vẽ Thông Minh (Smart Shape Recognition Standards):**
  * **Triệt tiêu hoàn toàn lỗi Giọt Nước (Zero Teardrop Defect):** Các hình đa giác khép kín (`points.length <= 8` như tam giác 4 điểm `[p0, p1, p2, p0]`, hình vuông / chữ nhật 5 điểm `[p0, p1, p2, p3, p0]`) bắt buộc render bằng các đoạn thẳng `L` và góc nhọn sắc nét đóng bằng `Z` (`M p0 L p1 L p2 ... Z`). Nghiêm cấm dùng đường cong Bezier bậc 2 (`Q`) qua trung điểm trên các đỉnh đa giác, vì sẽ bo tròn các đỉnh giữa và biến hình vuông/tam giác thành hình giọt nước có một đỉnh nhọn duy nhất.
  * **Nhận Diện Hình Tròn Vẽ Tay Tự Nhiên (Natural Hand-Drawn Circles):** Người dùng vẽ bằng chuột/trackpad thường có xu hướng dẹt nhẹ theo cổ tay. Mở rộng dải tỷ lệ `aspectRatio` nhận diện Hình Tròn hoàn hảo từ `0.65` đến `1.55` khi nét vẽ có độ cong trơn tru. Tuyệt đối không ép nét vẽ hình tròn tự do thành Elip dẹt nằm ngang. Chỉ nhận diện **Elip** khi người dùng chủ động vẽ hình bầu dục thon dài rõ rệt (`aspectRatio < 0.65` hoặc `> 1.55`).
  * **Phân Biệt Chuẩn Xác Đa Giác vs Đường Cong:** Sử dụng thuật toán đếm góc ngoặt gấp (`countSharpCorners`) và độ biến thiên bán kính `cvR`. Hình tròn/elip trơn tru hầu như không có góc gãy nhọn ($\ge 50^\circ$), trong khi hình vuông/chữ nhật/tam giác có từ 3 đến 4 góc ngoặt gấp rõ rệt, ngăn chặn 100% tình trạng nhận diện nhầm hình tròn thành hình vuông.
* **Quy Chuẩn Đối Tượng Mở Rộng Trên Bàn Học (Code Block, Mind Map & Sticker/Emoji):**
  * **Khối Mã Nguồn Tối Giản (`CodeBlockItem`):**
    * Đúng theo chuẩn Whiteboard hiện đại: Chỉ gồm tiêu đề `Code block` màu xám trung tính phía trên và khung code bo góc lớn `rounded-xl` màu nền xanh navy đen tối `#060b1c`.
    * Cột số dòng bên trái (`1, 2, 3...` màu xám mờ) tự động tăng giảm theo nội dung code.
    * Vùng nhập code `textarea` font `font-mono text-xs md:text-sm text-slate-100` thuần túy, hỗ trợ thụt lề Tab 2 spaces, tự động co dãn chiều cao.
    * Bắt buộc có thuộc tính `data-desk-item="true"`. Tọa độ sử dụng `transform: translate(x, y) rotate(deg)` với `transformOrigin: '0 0'`. Thanh header là drag handle có `onMouseDown` gọi `e.stopPropagation()` và `handleMouseDown` để khi di chuyển khối lệnh thì camera bàn học đứng yên, không bị pan view.
  * **Sơ Đồ Tư Duy Chuẩn Viên Thuốc (`MindMapNodeItem` & `MindMapConnectors`):**
    * Node hình viên thuốc (Pill shape): bo tròn `rounded-full`, viền dày màu sắc nét `border-2 border-purple-500 bg-white`, ô nhập `Type something` ở tâm.
    * Bắt buộc có `data-desk-item="true"`. Tọa độ sử dụng `transform: translate(x, y) rotate(deg)` với `transformOrigin: '0 0'`, chặn nổi bọt sự kiện pan view.
    * 4 nút tròn dấu cộng `+` ở 4 hướng (Trên, Dưới, Trái, Phải): nhấp chuột tự động sinh node con ở hướng tương ứng và liên kết nhánh.
    * Đường nối nhánh mềm mại (`MindMapConnectors`): sử dụng đường cong Bezier cubic nối từ mép node cha sang mép node con với màu viền tương ứng.
    * Floating toolbar phía trên khi chọn node: chọn màu viền, in đậm `B`, cỡ chữ, xoay và xóa.
  * **Bảng Chọn Emoji / GIF / Sticker & Dán Tùy Ý (`StickerEmojiPickerFlyout` & `StickerItem`):**
    * Thanh công cụ `LeftCreationBar` gộp gọn mục Stickers, Emojis & GIFs thành 1 ô duy nhất (`stickers_and_emojis`).
    * Mở popover nổi bên trái gồm ô tìm kiếm `Search`, 4 tab lọc `All | Stickers | Emojis | GIFs`.
    * Khi click chọn: popover đóng, con trỏ chuột trên bàn học biến đổi thành hình ảnh của item đó kèm hướng dẫn click để dán.
    * Click vào bất kỳ đâu trên bàn học để dán `StickerItem` hiển thị trong suốt độc lập, có `data-desk-item="true"`, tọa độ `transform: translate(x, y) rotate(deg)`.
    * Kéo góc thu phóng (Corner Resize Handle): Khi `isSelected`, hiển thị núm tròn ở góc dưới bên phải (`cursor-nwse-resize`) để người dùng tự do kéo dãn/thu nhỏ kích thước emoji, sticker, gif theo tỷ lệ.
  * **Bút Vẽ Thời Gian Thực & Lớp Mực Trong Tài Liệu (Zero-Delay Realtime Ink & In-Document Overlay):**
    * Lớp nét vẽ đang thao tác (`currentStroke`) trong `DeskDrawingCanvas` luôn render ở lớp trên cùng (`z-[1000]`), bảo đảm nét mực tuôn ra tức thì ngay dưới ngòi chuột thời gian thực khi vẽ trên mặt bàn lẫn trên ruột sách hay tài liệu (triệt tiêu 100% hiện tượng trễ/delay chỉ hiện khi nhả chuột).
    * `ItemDrawingOverlay` trên `BookSpread` được gắn trực tiếp ở container ngoài của sách (`width: 980, height: 640`), đồng bộ tọa độ gốc `(0, 0)` với `item.x, item.y`, triệt tiêu hoàn toàn độ lệch 42px/12px so với bìa da.
  * **Chuẩn Hóa Phân Loại Nhận Diện Vẽ Thông Minh (Smart Shape Precision):**
    * **Tam giác:** Bắt buộc `fillRatio <= 0.62` kèm 3 góc nhọn. Mọi hình có `fillRatio > 0.62` không bao giờ bị nhận diện nhầm thành tam giác.
    * **Hình vuông / Chữ nhật:** Bắt buộc `fillRatio >= 0.63` và có ít nhất 2 góc vuông nhọn (`sharpCorners >= 2` hoặc `cornerCount === 4`). Tỷ lệ `aspectRatio in [0.70, 1.42]` ra hình vuông hoàn hảo, ngoài dải này ra hình chữ nhật.
    * **Hình tròn / Elip:** Nét cong trơn mượt (`sharpCorners <= 1`). `aspectRatio in [0.65, 1.55]` ra hình tròn, còn lại ra elip. Ngăn chặn 100% việc vẽ hình vuông bị nhận diện nhầm thành hình tròn hoặc tam giác.
  * **Triệt Tiêu Mờ Chữ & Ảnh GIF Khi Phóng To Bàn Học (Crisp Typography & High-Def Media at All Zooms):**
    * **Nguyên nhân gốc rễ:** Trong container có `transform: scale(...)`, việc sử dụng `transition: all`, `transition: shadow`, hoặc CSS filter `drop-shadow(...)` khiến Chromium cô lập phần tử thành một composited bitmap layer cố định ở tỷ lệ 1x, khi phóng to lên 200% - 400% trình duyệt chỉ kéo dãn ảnh bitmap thay vì re-rasterize vector glyphs, dẫn đến mờ chữ và nhòe hình.
    * **Giải pháp dứt điểm:**
      * Loại bỏ triệt để `transition-all`, `transition-shadow`, và `drop-shadow` trên `CodeBlockItem`, `MindMapNodeItem`, `StickerItem`.
      * Bổ sung `textRendering: 'geometricPrecision'`, `WebkitFontSmoothing: 'antialiased'` và `MozOsxFontSmoothing: 'grayscale'` trên toàn bộ container, input và textarea.
      * Sticker SVG luôn render ở độ phân giải gốc 100% (`[&>svg]:w-full [&>svg]:h-full`), Emojis tính toán cỡ chữ trực tiếp theo bounding box `Math.round(min(w, h) * 0.72)px`.
      * Tích hợp tìm kiếm **GIPHY Trực Tuyến Thời Gian Thực** (`GiphyService`), kéo ảnh động `original.url` chất lượng cao với tỷ lệ chuẩn và kích thước mặc định 260px, loại bỏ nhòe ảnh GIF.
  * **Kho Emoji & Sticker Đa Dạng Chuẩn Miro (`StickerEmojiPickerFlyout`):**
    * **Emoji Miro:** Bảng điều khiển phân loại 8 danh mục (`people`, `nature`, `food`, `activities`, `travel`, `objects`, `symbols`, `flags`) với thanh icon chọn danh mục chuẩn Miro (`🕒`, `😀`, `🌿`, `🍔`, `⚽`, `🚌`, `💡`, `💖`, `🚩`) cùng hơn 200 emoji phổ biến.
    * **Sticker Miro:** Tích hợp bộ sưu tập sticker vector Funky Lines (Quả táo sâu ngộ nghĩnh, Boombox retro, Bọ rùa, Mũ lưỡi trai, Mèo trong hộp, Laptop pixel, Quả cầu pha lê, v.v.), Học tập & Công việc, Biểu cảm năng lượng chuẩn phong cách Miro.
  * **Tích Hợp Ghi Màn Hình Vào Menu Dấu Cộng (`LeftCreationBar`):**
    * Đưa tính năng Ghi hình màn hình (`screen_record`) trực tiếp vào menu mở rộng `extraTools` của nút dấu cộng `+`.
    * Khi click chọn, hệ thống dispatch sự kiện `vitudy:open-record-modal`, mở ngay modal ghi hình bài giảng/học tập mà không cần thao tác qua menu phức tạp khác.

---

## 5. Quy Chuẩn Sách & Tài Liệu 2.5D (Book & Document Standards)

* **Quy Chuẩn Nạp & Trích Xuất File PDF Thực Tế (Real In-Browser PDF Extraction & High-Res Rendering):**
  * **Triệt Tiêu Hoàn Toàn Văn Bản Giả Lập / Mock Text (Zero Placeholder Text):**
    * Khi người dùng tải tệp `.pdf` lên bàn học, hệ thống **tuyệt đối không sinh văn bản giả lập định sẵn** (như `"Nội dung trích xuất từ tệp 'TenFile.pdf'..."`).
    * Trích xuất chính xác 100% nội dung thực tế của từng trang bằng thư viện chuẩn `pdfjs-dist` thông qua `PdfParserService`:
      1. **Trích xuất văn bản thực tế:** Đọc từng chuỗi ký tự qua `getTextContent()`, làm sạch khoảng trắng để phục vụ tìm kiếm, tóm tắt và hỏi AI Inteline / STudy.
      2. **Render trang hình ảnh chất lượng cao (High-Res Canvas Rendering):** Mỗi trang được render qua HTML5 Canvas với độ phân giải siêu nét (`scale: 1.5`, JPEG 88%) thành ảnh dataURL gắn vào trường `image` của từng trang (`PageContent`).
  * **Hiển Thị Trang Sách PDF Sắc Nét & Tương Tác Hai Lớp (Crisp Dual-Layer PDF Display):**
    * Trên **Sách mở đôi (`BookSpread`)**, **Tờ giấy đơn (`PaperSheet`)**, và **Chế độ xem toàn màn hình (`FullScreenDocModal`)**:
      * Nếu trang có ảnh `leaf.image`: Render trực tiếp ảnh trang PDF thật ở độ phân giải cao (`max-w-full max-h-full object-contain pointer-events-none select-none rounded-xs`).
      * **Lớp Text Phủ Bán Trong Suốt Cho Phép Bôi Đen (Interactive Text Overlay):** Đặt một lớp text vô hình phía trên ảnh (`opacity-0 hover:opacity-10 cursor-text select-text`) chứa toàn bộ văn bản của trang, cho phép người dùng bôi đen đoạn chữ trên trang PDF để hỏi AI Inteline hoặc tạo câu hỏi flashcard qua STudy một cách tự nhiên.
  * **Bảo Toàn Tỷ Lệ Phân Trang 1 Trang PDF = 1 Trang Sách:**
    * Trong `src/utils/pagination.ts`, khi một trang tài liệu đã có ảnh `image`, thuật toán phân trang bảo toàn nguyên vẹn 1 trang PDF ứng với đúng 1 trang sách (`PaginatedLeaf`), không chia cắt vụn đoạn văn thành nhiều trang con.
  * **Chỉ Báo Trạng Thái Trích Xuất (Extraction Loading Indicator):**
    * Nút Tải lên tài liệu tại HUD chuyển thành icon `Loader2 animate-spin` và bị disable trong lúc phân tích.
    * Hiển thị toast thông báo trạng thái tại đỉnh màn hình: `"Đang trích xuất các trang tài liệu PDF..."` và hiển thị số lượng trang đã trích xuất thành công trong modal xác nhận tải lên bàn học.

* **Hiển Thị Công Thức Toán Học Chuẩn Mực Bằng KaTeX (`MathRenderer`):**
  * Toàn bộ tài liệu, sách học thuật, công thức toán (đạo hàm, gradient $\nabla f$, ma trận, phân số, vector) bắt buộc render qua `<MathRenderer />` sử dụng thư viện `KaTeX` với cú pháp LaTeX inline (`$...$`) và display block (`$$...$$`).
  * Danh sách liệt kê học thuật chuẩn hóa bằng dấu bullet `•` rõ ràng, tiêu đề in đậm cho các định lý và khái niệm cốt lõi.
* **Chế Độ "Tập Trung Đọc" (Focus Reading Mode) & Khóa Điều Hướng Bàn Học:**
  * **Vị trí thanh nhắc chuẩn:** Nút chế độ tập trung được tích hợp trực tiếp thành **thanh nhắc (bookmark tab) màu Chàm (`indigo-600`)** nằm ngay dưới tab "Tóm tắt" và trên tab "Phóng to".
  * **Hành vi kéo ra / thụt vào:**
    * Khi kích hoạt chế độ tập trung: thanh nhắc tự động **được giữ yên ở trạng thái kéo ra** (`w-[116px]`, nền `indigo-700`, viền sáng `ring-2 ring-indigo-400/60`, hiện rõ chữ "Tập trung").
    * Khi nhấp vào lại: thanh nhắc tự động thụt vào (`w-[48px]`) và thoát chế độ tập trung.
    * Tuyệt đối không dùng overlay banner cố định ở đỉnh màn hình ("Đang ở chế độ tập trung... Thoát").
  * **Khóa thao tác camera & Popup cảnh báo:**
    * Trong lúc đang tập trung đọc: hệ thống **khóa hoàn toàn thao tác cuộn chuột (zoom) và di chuyển góc nhìn (kéo rê chuột, phím WASD, 4 phím mũi tên)**.
    * Khi người dùng cố gắng zoom hoặc lia camera, xuất hiện popup thông báo chuẩn style app: **`Đang tập trung (nhấn để thoát)`** kèm icon `Eye` Cam ViT.
    * Nhấp vào nút `(nhấn để thoát)` trên popup cũng lập tức giải phóng góc nhìn và thoát chế độ tập trung.
* **Xác Nhận An Toàn Khi Xóa Sách (Delete Confirmation Dialog):**
  * Nút Xóa (tab đỏ) trên thẻ bookmark sách được tách biệt bằng một vạch phân cách mỏng (`bg-amber-950/25`) và có tooltip rõ ràng.
  * Khi bấm nút Xóa, hệ thống bắt buộc mở modal xác nhận an toàn ("Xóa sách khỏi bàn học? [Hủy] [Xác nhận xóa]") để bảo vệ dữ liệu người dùng, tránh thao tác click nhầm.
* **Đường Nối Chỉ Đỏ Tránh Nội Dung Sách (Smart Bezier Routing):**
  * Khi sợi chỉ đỏ xuất phát từ một trang sách và nối sang tài liệu bên phải, đường cong Bezier tự động uốn cong dạng vòm bay vượt lên trên đỉnh gáy sách (`archApexY < sourceItem.y - 22`), hoàn toàn không đè lên nội dung văn bản Chương 2.
  * Nét chỉ mảnh tinh tế `1.5px`, bán trong suốt (`strokeOpacity="0.6"`), đinh ghim nhỏ gọn `r="4"`. Tuyệt đối không đính kèm nhãn chữ thừa (như "Liên quan đến") trên đường chỉ để giữ không gian học gọn gàng, thanh thoát.

* **Kích thước & Chiều sâu 2.5D:**
  * Sách dạng mở đôi (`BookSpread`) có kích thước chuẩn **`980 × 640px`**, chiếm khoảng 55–60% chiều ngang màn hình ở mức zoom 100%.
  * **Bìa Sách Dày Dặn Màu Nâu (Rich Brown Leather Hardcover):** Sử dụng tông màu nâu da ấm sang trọng (`#5c3920` đến `#341c0c`), viền bìa hai bên mở rộng gấp 3 lần (`42px`), bo góc lớn `rounded-2xl`, không dùng thanh giả độ sâu ngoài bìa và không đổ bóng lên bìa sách (chỉ giữ bóng rãnh gáy bên trong giấy).
  * Góc nghiêng mặc định: `0°` (ngay ngắn, thẳng thớm để triệt tiêu hiện tượng răng cưa/mờ viền chữ khi phóng to zoom-in trên lưới pixel màn hình).
  * **Xóa Bỏ Khái Niệm BINDER / Sổ Tổng Hợp:** Mọi cuốn sách đều là thực thể sách chuẩn mực, không hiển thị dải ruy-băng hay huy hiệu "SỔ TỔNG HỢP (BINDER)".
* **Thiết Kế Sách Thực Thể Chân Thực (Authentic Physical Book — Zero AI Bezel):**
  * Tuyệt đối không bọc viền đen/chassis dày kiểu tablet hay khung cửa sổ phần mềm xung quanh sách làm mất tính chân thực.
  * Sách mở đôi hiển thị trọn vẹn 2 trang giấy ngà (`#fdfbf7`), rãnh gáy sách trung tâm đổ bóng tự nhiên strictly bên trong ruột giấy.
  * **Thẻ Đánh Dấu Ruy Băng Chữ V (V-Notched Bookmark Index Tabs):**
    * Gắn luồn 8px phía dưới mép phải của trang giấy sách (`calc(100% - 50px)`, tờ giấy đè lên chân thanh nhắc).
    * **Trạng thái bình thường (idle - chưa kéo):** Thanh nhắc thu gọn tinh tế (`w-[48px]`, chỉ lộ ra ngoài giấy 40px), icon vector nằm sát mép giấy trắng (chỉ hở một khoảng đệm nhỏ 8px). Khoảng cách giữa icon và rìa phải khuyết chữ V được bảo toàn nguyên vẹn (`pr-4` kèm notch 10px).
    * **Hiệu ứng trượt mở khi hover (Compact Slide-out Ribbon on Hover):** Khi rê chuột, thanh nhắc trượt mở sang phải với chiều dài vừa khít nội dung (`w-[86px]` đến `w-[124px]`). Chữ cái đầu tiên (ví dụ chữ "T" của "Tóm tắt") nằm ngay sát hở 8px so với tờ giấy trắng, triệt tiêu hoàn toàn khoảng trống thừa ở giữa và không kéo thanh nhắc ra dài quá đà.
    * Đầu ngoài thanh nhắc có hình chữ V khuyết lõm vào trong (`polygon(0 0, 100% 0, calc(100% - 10px) 50%, 100% 100%, 0 100%)`).
    * Sử dụng 6 màu chuẩn theo thứ tự từ trên xuống dưới:
      1. **Màu Xanh Lá (`emerald-600`):** Icon `Sparkles` + Chữ **"Tóm tắt"** (Mở STudy).
      2. **Màu Chàm (`indigo-600`):** Icon `Eye` + Chữ **"Tập trung"** (Giữ yên kéo ra khi bật, nhấp lại để thoát).
      3. **Màu Cam (`orange-600`):** Icon `Maximize2` + Chữ **"Phóng to"** (Mở toàn màn hình PDF View).
      4. **Màu Xanh Lam (`sky-700`):** Icon `Scissors` + Chữ **"Tách trang"** (Tách trang đang mở ra tờ rời trên bàn học).
      5. **Màu Nâu (`#78350f`):** Icon `RotateTwoWay` + Chữ **"Xoay"** (Xoay tự do 360°, nhấn đúp căn $0^\circ$).
      6. **Màu Đỏ (`rose-600`):** Icon `Trash2` + Chữ **"Xoá"** (Xóa sách khỏi bàn học, có vạch ngăn cách & xác nhận an toàn).
  * **Số Trang Đặt Ở Góc Trang Như Sách Thật (Physical Corner Pagination):**
    * Trang bên trái: Chỉ hiển thị duy nhất số trang ở **góc dưới cùng bên trái** (không có chữ ViTudy Desk thừa).
    * Trang bên phải: Chỉ hiển thị duy nhất số trang ở **góc dưới cùng bên phải** (không có tên sách thừa ở chân trang).
  * **Tắt Kiểm Tra Chính Tả (Spellcheck Off):**
    * Toàn bộ hệ thống web và các trường nhập liệu ghi chú (Sticky Note), câu hỏi AI đều tắt cờ `spellCheck={false}` để triệt tiêu các gạch chân đỏ lượn sóng báo sai chính tả tiếng Việt.
  * **Hiệu Ứng Lật Trang Bằng Chuột Như Đời Thật (Interactive 3D Page-Curl & Drag Không Bị Cắt Khung):**
    * Khi rê chuột vào rìa ngoài bên trái hoặc bên phải trang sách, xuất hiện nếp gấp góc trang gợi ý (curled page hint).
    * Người dùng có thể **nhấp chuột hoặc đè chuột và kéo (drag-to-flip)**: tờ giấy sẽ cuộn uốn cong trong không gian 3D (`rotateY`) bám theo vị trí con trỏ chuột, để lộ trang tiếp theo bên dưới với bóng đổ nếp gấp giấy vật lý chân thực.
    * **Mở rộng không gian 2.5D (Unclipped 3D Bleed):** Container trang ruột áp dụng `overflow-visible`, tờ giấy lật mở rộng `top: -10px` và chiều cao `calc(100% + 20px)` uốn cong vươn tự nhiên vào phần viền da bìa sách màu nâu mà không bị ngắt cụt mép trên và mép dưới.
    * **Lật trang tức thì không trễ nội dung (Pre-rendered Underlying Leaves):** Trong lúc kéo lật, mặt giấy nằm bên dưới **đã được nạp sẵn nội dung của trang kế tiếp** (`underneathLeaf`), và mặt sau của tờ giấy lật hiển thị đúng trang chuẩn bị tiếp đất. Khi kết thúc hành trình lật trang, góc nhìn giữ nguyên vẹn 100% pixel, triệt tiêu hoàn toàn độ trễ hoặc hiện tượng chớp nháy tráo đổi nội dung sau khi lật.
    * Thả chuột quá 28% hành trình sẽ tự động hoàn tất lật trang; thả chuột khi chưa tới ngưỡng sẽ tự động đàn hồi trở lại vị trí cũ.
  * **Tên Sách Dưới Bìa (Bottom Title Badge):**
    * Chỉ hiển thị tên sách tinh gọn, không có icon quyển sách, không có thanh trượt tiến trình (scrubber) hay dòng chữ lật trang.
    * Nằm hở một khoảng cách bên dưới đáy bìa sách (`top-full mt-3.5`), tuyệt đối không đè lên trang sách hay bìa sách.
  * **Đa Dạng 5 Màu Bìa Sách Da Thật & Thanh Nhắc Bookmark "Màu Bìa" (Leather Hardcover Presets):**
    * Cung cấp 5 gam màu da bìa sách cao cấp giữ trọn chiều sâu sang trọng: **Nâu Da Cổ Điển** (`#5c3920`), **Đỏ Đậm Burgundy** (`#6b1d28`), **Xanh Nước Biển Đậm Navy** (`#1e3a5f`), **Xanh Lá Rừng Đậm Forest** (`#1b4d3e`), và **Hồng Mận Đậm Plum** (`#5b2149`).
    * Thanh nhắc bookmark thứ 5 màu Vàng Kim (`#ca8a04`) với biểu tượng `Palette`:
      * *Trạng thái nghỉ (idle):* Thu gọn `w-[48px]`, chỉ hiển thị icon `Palette`.
      * *Rê chuột (hover):* Trượt mở nhẹ hiển thị `Màu Bìa [Palette icon]` (`w-[120px]`).
      * *Nhấp chọn (click):* Trượt mở rộng hiển thị `[Bảng 5 màu da] | Màu Bìa [Palette icon]` (`w-[272px]`). Nhấp vào bất kỳ màu nào sẽ cập nhật tức thì màu bìa của cuốn sách.
  * **Hỏi AI Inteline:**
    * Kích hoạt độc quyền theo cơ chế bôi đen văn bản: Khi người dùng **bôi đen đoạn văn bản trong sách**, một thẻ card hỏi nhanh nổi lên **ngay tại vị trí kết thúc của đoạn bôi đen** kèm khung đặt câu hỏi, các gợi ý câu hỏi nhanh (Giải thích, Ví dụ, Ý chính) và trả lời trực tiếp tại chỗ.
    * Không đặt nút bấm Inteline rời rạc trên bất kỳ thanh overlay nào.
* **Chế Độ Xem Toàn Màn Hình Chuẩn Trình Duyệt PDF (Browser PDF Reader Standard):**
  * Nút "Xem Full" (`Maximize2`) trên thẻ bookmark tab bìa phải cho phép mở giao diện đọc toàn màn hình chuẩn trình duyệt PDF với ngôn ngữ thiết kế HUD đơn sắc:
    * Nền canvas `#e8ebf0` dịu mắt, chống lóa.
    * Thanh điều khiển trên đỉnh màn hình phong cách HUD màu trắng / Slate-50: nút bật/tắt bảng trang thu nhỏ (`PanelLeft`), tiêu đề tài liệu kèm số trang, chuyển trang trực tiếp (`< 1 / N >`), thanh trượt zoom (`- 100% + Đặt lại`), xoay trang (`RotateTwoWay`), chuyển đổi chế độ xem 1 trang / 2 trang song song, nút In (`Printer`), và nút Thoát (`X` kèm phím tắt `Esc`).
    * Bảng danh mục trang thu nhỏ bên trái (collapsible thumbnails sidebar) có thể thu gọn mượt mà, hiển thị thumbnail trực quan của từng trang, trang đang đọc được viền nổi bật bằng màu Cam ViT (`ring-2 ring-[#E0562D]`).
    * Tích hợp render công thức toán học KaTeX đầy đủ cho cả trang đọc và danh mục thu nhỏ.
* **Quy Chuẩn Thẻ Trắc Nghiệm Đề Thi (`ExamQuizCard`):**
  * **Triệt tiêu hoàn toàn viền đậm/ring đen:** Không sử dụng ring đen hay viền khung thô kệch quanh thẻ. Thẻ đổ bóng nhẹ nhàng tự nhiên (`shadow-xl` / `shadow-2xl`) bám theo mép giấy bo góc `rounded-2xl`.
  * **Nét chữ sắc nét tuyệt đối (Zero Font Blurring):** Chỉ kích hoạt thuộc tính 3D compositing (`perspective`, `transform-style: preserve-3d`) trong quá trình lật thẻ (`flipState.phase !== 'idle'`). Khi ở trạng thái nghỉ (`idle`), toàn bộ layer 3D được gỡ bỏ hoàn toàn, kết hợp `textRendering: 'geometricPrecision'` và `WebkitFontSmoothing: 'antialiased'` giúp văn bản và các lựa chọn đáp án hiển thị sắc nét 100% như trang sách ở mọi độ phân giải và mức zoom.
  * **Tùy biến màu nền thẻ trắc nghiệm (Color Picker):** Trên thanh công cụ nổi của thẻ trắc nghiệm, tích hợp nút tròn chọn màu với 8 gam màu pastel đồng bộ với bảng màu Sticky Note, cho phép người học thay đổi màu thẻ đề thi theo sở thích.
* **Quy Chuẩn Chữ Thương Hiệu ViTudy (Brand Identity):**
  * Bỏ hoàn toàn icon La bàn (Compass) bên trái chữ ViTudy ở thanh điều hướng `TopLeftNav`.
  * Giữ duy nhất chữ **ViTudy** với màu Cam ViT thương hiệu (`#E0562D`), phông chữ to rõ (`text-lg font-black leading-none`) tương đương chiều cao của cụm icon cũ.
* **Bỏ Chữ "NOTE" Khi Tạo Ghi Chú Mới:**
  * Flyout chọn màu giấy note ở thanh công cụ bên trái (`LeftCreationBar`) chỉ hiển thị thuần túy 5 ô màu pastel, triệt tiêu hoàn toàn nhãn chữ "NOTE" thừa để giữ giao diện tối giản.
* **Phân trang thật & Không kẹt số trang (Zero Text Clipping & Unbounded Navigation):**
  * `turnBookPage` luôn truyền và tiếp nhận tham số `totalPages` của tài liệu để người học có thể lật tới trang cuối cùng mà không bị chặn ở số trang thô.
  * Không dùng thanh cuộn dọc lộ liễu bên trong trang sách để giữ đúng ẩn dụ "tờ giấy", đồng thời tích hợp lớp bảo hiểm `overflow-y-auto no-scrollbar` để chống tràn sub-pixel.

* **Quy Chuẩn Tờ Giấy Đơn (`PaperSheet`):**
  * **Luôn là 1 trang duy nhất (Strictly Single-Page):** Nghiêm cấm phân trang trên mặt bàn. Nếu tài liệu có nhiều trang, phải tách thành các tờ rời độc lập hoặc gộp thành Sách.
  * **Không thanh cuộn & Tự co giãn phông chữ (Zero Scrollbars & Dynamic Font Scaling):** Tuyệt đối cấm xuất hiện thanh cuộn dọc/ngang trên tờ giấy đơn (`overflow-hidden`). Phông chữ tự động co giãn kích thước (từ `14.5px` xuống `10.5px`) dựa theo độ dài văn bản để nội dung luôn nằm gọn trọn vẹn trong trang.
  * **Tiêu đề tinh gọn & Cho phép chỉnh sửa trực tiếp:** Bỏ tiền tố `"TỜ TÓM TẮT NHANH:"`, chỉ hiển thị tên thực của tài liệu. Nhấp chuột vào tên tài liệu để chuyển sang chế độ gõ sửa tên trực tiếp (`updateItemTitle`).
  * **Thanh Công Cụ Nổi Tờ Giấy Đơn (PaperSheet Overlay Toolbar):**
    * Thứ tự chuẩn từ trái sang phải:
      1. **Nút STudy:** Chỉ hiển thị icon SVG `Sparkles` màu Cam ViT (`#E0562D`, `stroke-[2.4]`), không kèm text thừa, có tooltip trực quan `STudy: Tóm tắt & Trắc nghiệm`. Khi bấm, mở overlay STudy trực tiếp ngay trên mặt tờ giấy.
      2. **Nút Thẻ Ghi Nhớ:** Icon SVG `Layers` (`stroke-[2.4]`), tooltip `Trích xuất Thẻ Ghi Nhớ ra cạnh tài liệu`. Khi bấm, **hệ thống trích xuất ngay lập tức các thẻ Spaced Repetition ra giấy ghi chú đặt ngay cạnh tài liệu mà không hiện popup hay overlay nào**.
      3. **Vạch ngăn cách:** `<div className="w-[1px] h-4 bg-slate-200" />`.
      4. **Nút Đọc Toàn Màn Hình:** Icon `Maximize2`.
      5. **Nút Xoay 360°:** Icon `RotateTwoWay`.
      6. **Vạch ngăn cách:** `<div className="w-[1px] h-4 bg-slate-200" />`.
      7. **Nút Xóa Khỏi Bàn Học:** Icon `Trash2`.
  * **Quy Chuẩn Overlay STudy Tại Chỗ Cho Tờ Giấy Đơn (`In-Situ Paper STudy Overlay`):**
    * **Hiển thị trực tiếp che lên bề mặt tờ giấy:** Overlay STudy được render trực tiếp bên trong container tờ giấy (`absolute inset-0 z-30`), che phủ vừa vặn tờ giấy và di chuyển/xoay chuẩn xác 2.5D cùng tờ giấy thay vì mở modal giữa màn hình.
    * **Header siêu gọn gàng:** Chỉ gồm `[Icon Sparkles Cam ViT] STudy` và nút đóng tròn `X`, nhấp vào đóng overlay và hiển thị lại nội dung giấy ban đầu.
    * **Cân đối 2 tab 50/50 (Balanced Navigation):** Chia đều 2 tab **`Tóm Tắt` (50%)** và **`Trắc Nghiệm` (50%)** theo dạng `grid grid-cols-2`.
    * **Chặn hoàn toàn hiện tượng cuộn chuột làm zoom bàn học:** Thiết lập `data-overlay="true"` và chặn `onWheel` lan truyền (`e.stopPropagation()`), cho phép người dùng cuộn xem nội dung trong overlay mượt mà mà bàn học không bị zoom co giãn theo.
    * **Nổi bật dòng "Sử dụng AI.":** Hàng tùy chọn AI được đóng khung dạng thẻ badge nổi bật (`bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border-orange-300`), icon `Sparkles` nhấp nháy, chữ cam ViT bold và nhãn `Chuyên sâu`.
    * **Cấu trúc 3 dòng chuẩn mực trong mỗi Tab:**
      * **Tab 1 — Tóm tắt:**
        * Dòng 1: Tiêu đề viết ngang trọn vẹn: `Tóm tắt nội dung trọng tâm` (không mô tả phụ).
        * Dòng 2: Thẻ tùy chọn nổi bật `Sử dụng AI.`
        * Dòng 3: Nút nằm sát bên phải: `Tạo tóm tắt` nền Cam ViT (`#E0562D`), chữ trắng, không wrap text.
        * Chân trang ngắn gọn: `Ghim Tóm Tắt Lên Bàn` (tự động xuất ra note ngay cạnh tài liệu tương tác) và `Sao chép nội dung`.
      * **Tab 2 — Trắc nghiệm:**
        * Dòng 1: Tiêu đề viết ngang hết dòng: `Tạo đề ôn tập trắc nghiệm.`
        * Dòng 2: Thẻ tùy chọn nổi bật `Sử dụng AI.` (gọi AI sinh đề bám sát nội dung khi bật).
        * Dòng 3: Nút nằm sát bên phải: `Sinh Câu Hỏi` (hoặc `Tạo Đề Mới`) nền Cam ViT (`#E0562D`), chữ trắng.
        * Chân trang ngắn gọn: `Xuất Đề Thi Ra Bàn` (tự động tạo tờ đề thi nằm ngay cạnh tài liệu tương tác) và `Chấm Điểm Ngay`.
    * **Vị trí xuất vật thể tương tác luôn cạnh tài liệu gốc:** Mọi tài liệu xuất ra từ STudy hoặc Thẻ ghi nhớ (Flashcard note, Summary note, Exam sheet) đều tự động định vị tại `x = item.x + item.width + 30`, `y = item.y`.
  * **Hỏi AI Inteline:** Bôi đen bất kỳ đoạn văn bản nào trên giấy để làm nổi thẻ card Inteline ngay tại vị trí con trỏ chuột.

* **Quy Chuẩn Thẻ Trắc Nghiệm Tương Tác 3D Lật Mặt (`ExamQuizCard`):**
  * **Kích thước & Màu sắc thẻ:**
    * Kích thước chuẩn: `380 × 490px`, đủ cho 1 câu hỏi + 4 đáp án và bảng điều khiển mà không cần cuộn dọc.
    * Màu nền: Lấy ngẫu nhiên từ bộ màu giấy ghi chú pastel (`#fef08a`, `#fed7aa`, `#bbf7d0`, `#bae6fd`, `#fbcfe8`), bo góc lớn `rounded-2xl`, bóng đổ thẻ vật lý 2.5D.
  * **Màn hình Bìa Bộ Đề (Intro Screen):**
    * Tiêu đề bộ đề, số lượng câu hỏi, thời gian làm bài dự kiến.
    * Ở giữa đáy thẻ: Nút **"Bắt đầu làm bài"** nổi bật với màu **Cam ViT (`#E0562D`)**, chữ trắng.
  * **Cơ Chế Lật Mặt 3D Như Trang Sách (Interactive 3D Page Flip):**
    * Khi bấm "Bắt đầu làm bài", thẻ lật xoay 3D từ trái sang phải để lộ Câu 1 ở mặt sau.
    * **Khung định vị ngoài (`cardRef`):** Tuyệt đối KHÔNG gán `rounded-2xl`, `border`, `ring`, hay `shadow` lên thẻ cha. Thẻ cha thuần túy làm mốc tọa độ canvas (`translate`, `rotate`, `scale`).
    * **Quy trình Lật 3D 2 Giai Đoạn (2-Phase 3D Flip State Machine):**
      * *Giai đoạn 1 (Turn-Out):* Xoay từ `0deg` đến `90deg` (hoặc `-90deg` khi lật tới) trong 160ms (`cubic-bezier(0.4, 0, 0.7, 0.2)`).
      * *Điểm chết trung tâm:* Khi thẻ vuông góc màn hình (chiều rộng hiển thị = 0px, hoàn toàn vô hình), cập nhật nội dung câu hỏi/màn hình và lập tức tráo góc xoay sang phía đối diện (`-90deg` / `90deg`) không áp dụng transition.
      * *Giai đoạn 2 (Turn-In):* Xoay tiếp từ góc đối diện về `0deg` trong 180ms (`cubic-bezier(0.2, 0.8, 0.4, 1)`). Triệt tiêu 100% hiện tượng giật chữ, chớp nháy hoặc nhảy nội dung khi thẻ đang nghiêng.
    * **Viền chọn (`ring-2 ring-slate-900 shadow-2xl`):** Được gắn trực tiếp vào vỏ thẻ xoay bên trong (`preserve-3d`), và tự động ẩn khi đang lật (`flipState.phase !== 'idle'`), triệt tiêu hoàn toàn khung dây đen rỗng (ghost wireframe box) lơ lửng trên bàn học.
    * **Thanh công cụ nổi (`Rotate 360` / `Trash`):** Tự động ẩn khi đang lật thẻ để chống tình trạng lơ lửng mất liên kết.
    * Khi người dùng chọn đáp án và bấm **"Xác nhận"**: hiển thị phán quyết ngay lập tức (Xanh lá `✓ ĐÚNG` hoặc Đỏ `✕ SAI`), giải thích chi tiết, và nút chuyển thành **"Câu tiếp theo"** (hoặc **"Hoàn thành"** ở câu cuối cùng).
    * Bấm "Câu tiếp theo" sẽ tiếp tục lật xoay 3D sang câu tiếp theo.
  * **Thanh Điều Hướng Câu Hỏi Dạng List Ngang Ở Đáy Thẻ (Bottom Horizontal Strip):**
    * Nằm sát mép đáy bên trong thẻ, độ rộng được giới hạn nghiêm ngặt không vượt quá chiều rộng thẻ.
    * Hai đầu: 2 nút mũi tên chuyển câu `<` (Lùi) và `>` (Tiến).
    * Ở giữa: Danh sách các ô tròn/pill đại diện cho các câu hỏi:
      * **Câu đã làm:** Màu Xanh lá (`#15803D`) nếu trả lời đúng, Màu Đỏ (`#DC2626`) nếu trả lời sai.
      * **Câu hiện tại:** Tô xám đậm (`bg-slate-300 text-slate-900 border-slate-400 ring-1 ring-slate-400 font-black`) tương tự trạng thái công cụ HUD đang chọn.
      * **Câu tương lai / chưa làm:** Màu trắng chữ đen.
    * Người học có thể bấm vào bất kỳ ô nào để chủ động nhảy câu hoặc lật tới/lui tự do trong lúc làm bài.
  * **Màn hình Tổng Kết & Xem Lại Câu (Summary & Review Screen):**
    * Khi hoàn thành câu cuối và bấm "Hoàn thành", thẻ lật 3D sang màn hình Tổng kết.
    * **Tổng điểm cỡ to nổi bật ở trên giữa:** Render số điểm `X / 10` với cỡ chữ lớn (`text-4xl`/`text-5xl`) màu Cam ViT (`#E0562D`), kèm tỷ lệ phần trăm và lời nhận xét sư phạm.
    * **Bảng lưới các ô câu trả lời:** Hiển thị toàn bộ các câu hỏi kèm trạng thái đúng/sai.
    * **Chế độ Xem Lại Chi Tiết (Review Mode):** Nhấp vào ô câu hỏi bất kỳ trong bảng sẽ lật thẻ 3D từ trái sang phải về câu hỏi đó để xem lại đáp án và giải thích chi tiết.
    * Ở chế độ xem lại: Xuất hiện nút **"Quay lại tổng kết"** ở góc trên; bấm vào sẽ lật ngược từ phải sang trái về lại màn hình Tổng kết.
    * Nút **"Làm lại bộ đề này"** cho phép reset toàn bộ trạng thái để luyện tập lại từ đầu.

---

## 6. Cơ Chế Xoay Tự Do 360° & Chế Độ Xoay Bàn Học (View Rotation Mode)

* Thay vì đặt các nút quay cứng 90° rời rạc, mỗi vật thể (sách, tài liệu, note) sử dụng **một nút xoay chung**.
* **Biểu tượng Xoay Hai Chiều Trực Quan (`RotateTwoWay`):** Sử dụng icon hình vòng cung với 2 đầu mũi tên trái - phải đối xứng (`RotateTwoWay`), thay thế hoàn toàn icon quay 1 chiều `RotateCw` cũ, giúp người dùng nhìn vào là nhận biết ngay thao tác kéo xoay trái hoặc phải tự do.
* **Cơ chế tương tác trên vật thể:** 
  * Người dùng đè chuột vào nút xoay và rê theo hướng nào thì tài liệu/vật thể sẽ xoay mượt mà theo góc chuột hướng đó (tính góc qua `Math.atan2`).
  * **Hút từ tính về 0° (Magnetic Snap):** Khi góc xoay nằm trong khoảng $\pm 2.5^\circ$ so với trục thẳng đứng ($0^\circ$), hệ thống tự động hút về đúng $0^\circ$ giúp người dùng dễ dàng căn thẳng sách tài liệu để đọc sắc nét nhất.
  * **Nhấn đúp để căn thẳng tức thì:** Người dùng nhấn đúp chuột (`double-click`) vào nút xoay để lập tức trả tài liệu về góc $0^\circ$ ngay ngắn.
* **Chế Độ Xoay Toàn Bàn Học Qua Nút Bật Chuyên Dụng (Dedicated View Rotation Mode Button):**
  * **Loại bỏ hoàn toàn phím tắt `Alt + ...`:** Phím tắt WASD và mũi tên được bảo toàn 100% cho việc lia tầm nhìn camera (pan canvas) mượt mà.
  * **Nút kích hoạt bên trái thanh zoom:** Tích hợp 1 nút icon `RotateTwoWay` nằm ngay **bên trái thanh công cụ zoom** ở góc dưới bên phải (`BottomRightToolkit`).
  * **Trạng thái kích hoạt (Active):** Khi bật lên, nút chuyển sang màu Cam ViT (`#E0562D`) chữ trắng. Con trỏ chuột toàn bàn học đổi sang icon xoay hai chiều.
  * **Kéo xoay tự do bất kỳ đâu:** Khi đang ở chế độ xoay, **người dùng có thể nhấp và kéo chuột ở bất kỳ đâu trên màn hình (kể cả trên mặt bàn học, trong ruột sách, ruột giấy hay ghi chú) đều sẽ xoay góc nhìn bàn học theo chuột**.
  * **Căn thẳng tức thì:** Nhấn đúp chuột ở bất kỳ đâu trong chế độ xoay (hoặc nhấp kim La bàn ở góc trên bên trái) sẽ đưa góc nhìn trở về $0^\circ$.
  * Nhấp lại vào nút xoay ở thanh zoom để tắt chế độ xoay và trở về thao tác bình thường.

---

## 7. Giấy Ghi Chú (Sticky Notes)

* **Trạng thái Khởi tạo:** Ghi chú mới tạo có nội dung rỗng mặc định.
* **Placeholder & Cỡ Chữ Ban Đầu (1/3 Chiều Cao Note):**
  * Khi chưa viết gì hoặc chữ rất ngắn: Cỡ chữ hiển thị **ít nhất bằng 1/3 chiều cao của note** (`Math.round(height / 3.2)` $\approx 52\text{px}-60\text{px}$), tạo điểm nhấn thị giác lớn, đậm nét và rõ ràng.
* **Tự Động Co Nhỏ Chữ Sát Vạch Footer & Nghiêm Cấm Thanh Cuộn:**
  * Cho phép nội dung người dùng gõ mở rộng tiến sát tới vạch gạch phân cách với footer rồi mới bắt đầu co nhỏ dần để chữ vừa khít trọn vẹn trong khung note. Tuyệt đối không co chữ sớm khi mới gõ chưa đầy nửa trang. Nghiêm cấm xuất hiện thanh cuộn trên giấy note.
* **Dải Băng Dính Keo Dán Phóng To (Enlarged Tape Strip):** Tăng kích thước thêm 20% chiều cao (`h-6`, 24px) và 30% chiều rộng (`w-[84px]`). Dải keo đóng vai trò là điểm cầm nắm chính (`drag handle`) để kéo di chuyển ghi chú trên mặt bàn.
* **Đổi Tên Note Trực Tiếp Ở Chân Trang (Inline Editable Note Title):**
  * Nhấp chuột trực tiếp vào tên note ở footer (mặc định "Note") để chuyển sang ô nhập và đổi tên note ngay tại chỗ (`updateItemTitle`).
* **Bôi đen hỏi AI Inteline trên Ghi chú:** Khi người dùng bôi đen đoạn ghi chú, thẻ card Inteline ngay lập tức nổi lên hỗ trợ hỏi AI, giải thích nhanh hoặc mở rộng ý tưởng và ghim thành ghi chú mới.
* **Thanh Công Cụ Nổi Giấy Ghi Chú Chuẩn Miro (Miro-Standard Note Toolbar):**
  * **Vị trí cố định:** **Luôn luôn nằm ở PHÍA TRÊN note** (`bottom-full mb-3`), không đặt phía dưới để không che khuất nội dung note.
  * Thay vì trải ngang danh sách màu, chỉ hiển thị **1 ô tròn duy nhất là màu hiện tại của note**.
  * Khi bấm vào ô tròn, xổ ra **bảng màu Palette lưới 16 màu (4x4) chuẩn Miro** kèm dấu tích `✓` trên màu đang chọn.
  * Hỗ trợ đầy đủ bộ công cụ công thái học:
    * **In đậm toàn bộ văn bản (`B`):** Áp dụng toàn bộ văn bản trong note khi bật (`fontWeight: 800`, `font-black`, viền nét mực), và tắt toàn bộ văn bản trở về nét thường thanh mảnh (`fontWeight: 400`, `font-normal`) khi tắt. Nút `B` có nền `bg-slate-200` khi đang kích hoạt.
    * **Căn lề văn bản 3 chế độ (Left / Mid / Right):** Nhóm 3 nút căn lề: Căn lề trái (`AlignLeft`), Căn lề giữa (`AlignCenter`), và Căn lề phải (`AlignRight`), áp dụng chuẩn xác cho toàn bộ các dòng văn bản trong note.
    * **Bỏ nút A / A+ thủ công:** Cỡ chữ được quản lý 100% tự động qua thuật toán co giãn phông động (Dynamic Font Scaling), đảm bảo chữ to ít nhất 1/3 note khi ngắn và tự thu vừa khít khi nội dung tiến sát chân trang, không cần nút chỉnh cỡ chữ thủ công.
    * **Nhân bản nhanh:** Nút sao chép (`Copy`) tạo ngay một note giống hệt bên cạnh.
    * **Xoay tự do 360°** (`RotateTwoWay`) và nút **Xóa note** (`Trash2`).

---

## 8. Phông Chữ, Độ Nét & Chống Nhiễu Moiré (Crisp Rendering)

* **Toàn bộ UI và Thân sách/Tài liệu:** Bắt buộc sử dụng phông chữ **`Open Sans`** (`var(--font-ui)`), nạp đầy đủ các tập con `['latin', 'latin-ext', 'vietnamese']`. Tuyệt đối không dùng phông serif chân cứng.
* **Độ sắc nét khi zoom out:** Thân văn bản sách và tài liệu áp dụng độ đậm **`font-medium` (500)** và CSS `text-rendering: geometricPrecision; -webkit-font-smoothing: antialiased;` để đảm bảo khi thu nhỏ ở mức zoom 40%–50%, các nét chữ không bị mờ đục hoặc đứt gãy.
* **Căn ngay ngắn 0° mặc định cho Giấy và Ghi chú:** Mọi vật thể tài liệu (`PaperSheet`), đề thi và giấy note (`StickyNoteItem`) khởi tạo ở góc xoay `0°` (thay vì các góc lẻ như `4°` hay `-3°`), giúp bộ kết xuất phông chữ khớp hoàn hảo từng điểm ảnh phần cứng (subpixel rendering), loại bỏ hoàn toàn hiện tượng mờ đục hoặc nhòe nét khi thu nhỏ góc nhìn.
* **Triệt tiêu nhiễu Moiré:** Loại bỏ hoàn toàn các chấm hạt `radial-gradient` trên nền giấy `.paper-texture`; sử dụng nền ngà phẳng tự nhiên thuần khiết (`#fdfbf7`) giúp mắt không bị mỏi và không sinh nhiễu pixel.
* **Giấy ghi chú (Sticky Note):** Sử dụng phông viết tay **`Patrick Hand`** (`var(--font-note)`) có hỗ trợ tiếng Việt đầy đủ, áp dụng độ đậm `font-bold` (700) và `text-stone-950` để nét chữ viết tay luôn đậm đà, sắc bén ngay cả khi zoom nhỏ.
* **Chuẩn hóa Unicode NFC:** Toàn bộ chuỗi văn bản nạp vào hệ thống (tài liệu, sách, note, prompt AI) phải chạy qua `text.normalize('NFC')` để triệt tiêu hoàn toàn lỗi dấu rời (như *"Tuầ´n"*, *"trắ´c"*).

---

## 9. Nút "Tải lên" & Quy Trình Tải Tài Liệu Lên Bàn Học

* **Tên nút thao tác:** Sử dụng nhãn trực diện **"Tải lên"** (thay vì "Tải tài liệu") ở góc dưới bên trái HUD.
* **Triệt tiêu chỉ báo hệ thống thừa:** Ẩn hoàn toàn các biểu tượng tia sét hay chỉ báo dev indicator (`devIndicators: false`) của framework.
* Khi người dùng nhấn nút "Tải lên", hệ thống kích hoạt **hộp thoại chọn file gốc của hệ điều hành** (`<input type="file" />` mở Windows Explorer / macOS Finder / Linux File Manager).
* Sau khi người dùng đã chọn file thành công, mới hiển thị hộp thoại xác nhận để người dùng đặt tên tài liệu và nhập mô tả ngắn trước khi đưa lên mặt bàn.

---

## 10. Ngôn Ngữ & Giọng Văn Giao Diện (Humanized Vietnamese)

* Áp dụng nguyên tắc **Humanizer** cho toàn bộ các đoạn văn bản giao diện, tooltip, thông báo và nhãn hướng dẫn:
  * Viết bằng tiếng Việt tự nhiên, trực diện, dễ hiểu, đậm chất con người.
  * Loại bỏ hoàn toàn văn phong dịch máy, sáo rỗng hoặc rập khuôn kiểu AI.
  * Ví dụ chuẩn:
    * Đổi *"Theo dõi tôi"* $\rightarrow$ *"Đồng bộ góc nhìn"* (kèm đèn báo trạng thái rõ ràng).
    * Đổi *"RADAR"* $\rightarrow$ *"BẢN ĐỒ"*.
    * Đổi *"BÀN HỌC 2.5D"* $\rightarrow$ *"Không gian học 2.5D"*.
* **Ngoại lệ:** Nội dung trong sách, tài liệu học thuật và ghi chú của người dùng được giữ nguyên vẹn 100%, không tự ý thay đổi.

---

## 11. Kỷ Luật Kỹ Thuật (Anti-Bloat & Skill-First Protocol)

* **Surgical Changes:** Chỉ sửa đổi chính xác những dòng mã cần thiết, tôn trọng cấu trúc hiện có, không tái tạo mã nguồn bừa bãi hay thêm dependencies không rõ mục đích.
* **Kiểm định trước khi bàn giao:** Mọi chỉnh sửa mã nguồn đều phải vượt qua `pnpm build` (không có lỗi type hay lint) và chạy thử nghiệm mượt mà trên môi trường thực tế.

---

## 12. Bố Cục HUD & Thanh Công Cụ Sáng Tạo (Miro-Inspired Workspace Layout)

* **Thanh Công Cụ Sáng Tạo Dọc Bên Trái (`LeftCreationBar`):**
  * Tách biệt hoàn toàn công cụ sáng tạo (Creation Tools) sang thanh nổi dọc bên trái màn hình, **đặt sát vào mép trái màn hình** (giảm khoảng cách còn 1/3: `left-[5px] top-1/2 -translate-y-1/2`), lấy cảm hứng từ Miro nhưng giữ trọn bộ icon SVG và ngôn ngữ thẩm mỹ của ViTudy.
  * **Kích Thước Tăng 30% & Nét Icon Đậm Rõ (`stroke-[2.4]`):** Toàn bộ các nút công cụ tăng kích thước lên 30% (`w-12 h-12 rounded-xl`, nút đơn lẻ hoặc undo pill dùng `rounded-full`), biểu tượng SVG kích thước `w-5 h-5` nét đậm dày `stroke-[2.4]` rõ ràng.
  * **Nút Tạo Ghi Chú Kéo Thả Kích Thước (`create_note`):**
    * Khi bấm nút Ghi chú (`StickyNote`), xổ flyout bảng màu dọc (5 màu pastel), tiêu đề đổi thành **`NOTE`** (tinh gọn, không dùng "Màu note").
    * Chọn màu -> con trỏ chuột đổi sang icon ghi chú -> người dùng kéo thả chuột trên bàn học để sinh ra tờ ghi chú đúng kích thước vùng kéo thả.
    * Có ngưỡng giới hạn kích thước tối thiểu (`180 × 160px`) để đảm bảo không bị co cụm khi click nhấp chuột nhanh.
  * **Cụm Nút Bút Hợp Nhất Chuẩn Miro (`PenSubToolbar`):**
    * Gộp bút vẽ thường và bút dạ quang thành 1 nút Bút duy nhất.
    * Nhấp vào nút Bút mở flyout thanh công cụ phụ ngang chuẩn Miro, **được căn giữa trung điểm theo chiều dọc với thanh công cụ chính (`top-1/2 -translate-y-1/2`)** với chiều cao tối ưu không bao giờ bị lố khỏi màn hình hay bị che bởi các HUD. Bộ công cụ gồm:
      * **Bút vẽ thường (`pen`):** Nét mực mảnh rõ ràng.
      * **Bút dạ quang (`highlighter`):** Nét vẽ trong suốt bán nguyệt (opacity 0.4).
      * **Vẽ thông minh (`smart_shape`):** Tự động nhận diện nét vẽ phác thảo nguệch ngoạc và nắn thành hình học chuẩn xác (đường thẳng, hình tròn, elip, hình chữ nhật/vuông, hình tam giác).
      * **Tẩy nhấp chọn (`eraser`):** Nhấp trực tiếp vào nét vẽ nào để xóa nét đó.
      * **Tẩy vùng chọn (`area_eraser`):** Kéo thả khung chữ nhật trên mặt bàn để xóa toàn bộ các nét vẽ nằm bên trong hoặc giao với khung đó.
      * **3 Cỡ nét bút:** Nhỏ (`small`), Vừa (`medium`), Lớn (`large`).
      * **1 Ô Màu Hiện Tại & Bảng Màu Flyout:** Hiển thị **đúng 1 ô tròn là màu hiện tại của nét vẽ**. Nhấp vào ô tròn mới xổ ra bảng màu 6 màu (lưới 3x2) gọn gàng bên cạnh, triệt tiêu hoàn toàn tình trạng thanh bút quá dài tràn khung nhìn.
  * **Nút Thêm Công Cụ Mở Rộng (`+` More Tools):**
    * Vị trí: Đặt ngay **dưới nút Bút và trên nút Khóa bàn học**, có gạch phân cách mảnh nằm ở cả phía trên và phía dưới nút.
    * Khi bấm, mở flyout panel phong cách Miro hiển thị danh sách 6 công cụ mở rộng (không có thanh tìm kiếm):
      1. **Shapes and lines:** Vẽ hình học và đường kẻ thông minh.
      2. **Stickers:** Nhãn dán ghi chú trực quan.
      3. **Emojis and GIFs:** Biểu cảm và minh họa học tập.
      4. **Code block:** Khối mã nguồn lập trình có định dạng.
      5. **Table:** Bảng dữ liệu hàng và cột có cấu trúc.
      6. **Mind map:** Sơ đồ tư duy liên kết ý tưởng.
  * Danh mục công cụ thanh chính: Con trỏ di chuyển/chọn (`MousePointer`), Tạo ghi chú (`StickyNote`), Bút vẽ tích hợp (`PenTool`), Thêm công cụ mở rộng (`Plus`), Khóa góc nhìn (`Lock`), và cụm Hoàn tác/Xóa tròn (`Undo2` / `Trash2`).
* **Tinh Gọn Hệ Thống HUD Ngoại Vi & Quy Chuẩn Nút Tròn (Distraction-Free Workspace):**
  * **Quy chuẩn Hình Dạng Nút Riêng Lẻ (Circular Button Standard):** Mọi nút thao tác riêng lẻ không gộp thành bộ trên giao diện (như nút Tải lên, Mời bạn, nút Mở bản đồ) bắt buộc sử dụng **khung hình tròn (`rounded-full`)** cùng icon SVG nổi bật thay vì vuông bo góc.
  * **Độ Đậm Nét Toàn Bộ HUD/UI:** Toàn bộ icon áp dụng độ dày nét `stroke-[2.4]` (hoặc `strokeWidth={2.4}`), font chữ và số áp dụng độ đậm `font-bold` hoặc `font-black` (`text-slate-900`) để đảm bảo sắc nét tuyệt đối.
  * **HUD Góc Trên Bên Trái & Thanh Tìm Kiếm Trượt (`TopLeftNav`):**
    * Kích thước tăng 30% (`px-4 py-2.5 rounded-2xl`), logo `Compass` và icon điều hướng nét đậm `stroke-[2.4]`.
    * Thanh tìm kiếm ở trạng thái bình thường thu gọn tinh giản, chỉ hiển thị duy nhất icon kính lúp (`Search`).
    * Khi hover hoặc click, ô nhập trượt mượt sang phải (`w-52`).
    * Khi focus vào ô nhập, hiển thị dropdown danh sách tài liệu hiện có trên bàn học, giới hạn chiều cao tối đa hiển thị 3 tài liệu (`max-h-[142px]`) kèm thanh cuộn mượt nếu nhiều hơn.
    * **Tối Ưu Hiển Thị Danh Sách Tài Liệu (Zero Redundant Badges):** Bỏ hoàn toàn các badge text ở sau ("Sách • 8 trang", "Tờ giấy", "Ghi chú") do phía trước đã có icon vector nhận diện (`BookOpen`, `FileText`, `StickyNote`). Tên tài liệu chiếm trọn chiều rộng hàng, hiển thị đầy đủ, không bị co rút cắt chữ.
    * Tự động lọc tài liệu theo từ khóa tìm kiếm trong thời gian thực. Nhấp vào tài liệu lập tức lia camera và chọn tài liệu đó trên bàn học.
  * **HUD Góc Dưới Bên Trái (Cụm 3 Nút Tròn Tải Lên - Ghi Hình - Mời Bạn):**
    * Bỏ hoàn toàn chữ "Tải lên" và "Mời bạn".
    * Sử dụng 3 nút tròn riêng lẻ (`rounded-full w-12 h-12`):
      * Nút **"Tải lên"** (`Upload`): Nền cam thương hiệu (`bg-[#E0562D] hover:bg-[#c9451e]`), icon vector màu trắng tinh khiết (`text-white stroke-[2.4]`). Kích hoạt hộp thoại chọn file của OS.
      * Nút **"Ghi hình buổi học"** (`Video`): Nền trắng thanh nhã (`bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 shadow-md`), icon camera nét đậm (`text-slate-900 stroke-[2.4]`), **nằm ngay giữa nút Tải lên và Mời bạn**.
        * Hỗ trợ ghi lại toàn bộ màn hình bàn học trong lúc làm việc qua `getDisplayMedia`.
        * Tích hợp tùy chọn bật/tắt ghi âm micro giọng nói (`getUserMedia`), hòa trộn âm thanh hệ thống và micro qua Web Audio API (`AudioContext`).
        * Trạng thái đang ghi hình: Chuyển nút sang thanh trạng thái nhỏ gọn với đèn tròn đỏ nhấp nháy, đồng hồ đếm thời gian thực `00:00` font-mono và nút vuông dừng ghi hình (`Square`).
        * Kết thúc ghi hình: Mở modal xem trước video kèm thông tin dung lượng và nút **"Tải video về máy"** (`.webm`).
      * Nút **"Mời bạn"** (`Share2`): Nền trắng thanh nhã (`bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 shadow-md`), icon vector màu đen nét đậm (`text-slate-900 stroke-[2.4]`). Mở modal sao chép liên kết phòng học.
  * **HUD Góc Dưới Giữa Màn Hình:** Loại bỏ hoàn toàn nhãn/popup "Không gian học 2.5D" lơ lửng để giải phóng tầm nhìn giữa bàn.
  * **Chợ Tài Liệu (Library-Standard Book Catalog with Brown Covers & Multi-Filters):**
    * Nút hành động chính: `+ Chia sẻ tài liệu`.
    * **Banner Số Dư & Quy Đổi Đơn Vị:** Hiển thị rõ `Số dư của bạn: X ViToken (1 V = 1 ViToken)` cùng lời nhắc tích lũy ViToken từ Điểm danh hoặc Chia sẻ tài liệu.
    * Mô tả triết lý: *"Tài liệu được chia sẻ hoàn toàn từ mục đích học tập & nghiên cứu."*
    * **Kho Dữ Liệu Thư Viện Phong Phú:** Cung cấp 40 tài liệu học thuật đầy đủ 3 dạng: Sách giáo trình chuyên sâu, Tờ tóm tắt kiến thức cốt lõi, và Đề thi trắc nghiệm tương tác với đáp án và giải thích chi tiết.
    * **Chế Độ Xem Linh Hoạt (View Mode Toggle):** Hỗ trợ chuyển đổi giữa dạng lưới thẻ chi tiết (`Grid`) và dạng danh sách gọn (`Compact List`).
    * **Cấu trúc thẻ card tài liệu chuẩn phong cách thư viện:**
      * **Bên trái — Khung bìa cuốn sách màu nâu da sang trọng (`#4a2c17` đến `#2e1a0e`, gáy `#6b3e20`):**
        * Header bìa: `ViTudy` kèm loại tài liệu (`Sách`, `Tờ tóm tắt`, `Đề thi`). **Tuyệt đối không có phân hạng S, A**.
        * Thân bìa: Tên tài liệu viết to, đậm rõ ràng, tự động xuống dòng (word wrap) gọn gàng trong bìa sách.
        * Footer bìa: **Ngày chia sẻ** (`DD/MM/YYYY`) kèm icon lịch thanh nhã.
      * **Bên phải — Cột thông tin chi tiết:**
        * **Tiêu đề prominent:** Đưa tiêu đề tài liệu ra khung nội dung chính rõ nét, chữ đậm, hover đổi màu Cam ViT.
        * **Tác giả & Xác thực:** Tên tác giả kèm huy hiệu xác thực (`CheckCircle2 text-sky-600` với tooltip "Tác giả xác thực").
        * **Metadata đầy đủ:** Số trang (`X trang`), lượt tải/mua (`X lượt mua`), ngày cập nhật (`Cập nhật DD/MM/YYYY`).
        * **Điểm AI & Tooltip tiêu chí:** Thay "Đánh giá" thành **`Điểm AI: {score}/100`** (`text-[#E0562D]`), hover hiển thị tooltip giải thích 3 tiêu chí chấm điểm tự động (Độ chuẩn xác 40%, Cấu trúc 35%, Thực tiễn 25%) và số lượt phản hồi.
        * **Mô tả theo loại tài liệu:** Nhãn động theo định dạng: `MÔ TẢ SÁCH / GIÁO TRÌNH:`, `MÔ TẢ TÀI LIỆU TÓM TẮT:`, `MÔ TẢ BỘ ĐỀ TRẮC NGHIỆM:`.
        * **Trích đoạn xem trước:** Khung font monospace thanh nhã.
        * **Đặt Giá và Nút Hành Động Cạnh Nhau:** Mức giá hiển thị kèm huy hiệu chữ V tròn thương hiệu, nằm kề nút **"Xem thử"** (`Eye`) và nút **"Mua X V"** (hoặc nút **"Mở"** màu xanh lá khi đã sở hữu).
        * **Modal Xem Thử Trích Đoạn Chi Tiết:** Nhấp "Xem thử" mở modal đọc trích đoạn nội dung, xem danh sách các chương mục và nút mua/mở nhanh.
    * **Hệ Thống Tìm Kiếm & Bộ Lọc Đa Năng:**
      * Thanh tìm kiếm từ khóa thời gian thực (tên, tác giả, mô tả).
      * Bộ lọc phân loại dạng tài liệu: Tất cả, Sách, Tờ tóm tắt, Đề thi trắc nghiệm.
      * Bộ lọc môn học: Tất cả môn, Toán học, Trí tuệ nhân tạo (AI/ML), Khoa học máy tính, Kỹ thuật phần mềm, Khoa học dữ liệu.
      * Giới hạn điểm AI: Tất cả, $\ge 80$ điểm, $\ge 90$ điểm.
      * Giới hạn giá ViToken: Tất cả, $\le 15$ V, $\le 30$ V, $\le 50$ V.
      * Sắp xếp theo ngày chia sẻ: Mới nhất, Cũ nhất, Điểm cao nhất, Giá rẻ nhất.
      * **Chip bộ lọc đang bật & Nút Đặt lại:** Hiển thị nút `Đặt lại` (`RotateCcw`) màu cam khi có bất kỳ bộ lọc nào đang kích hoạt để xóa nhanh về mặc định.
      * Hỗ trợ phím tắt `Esc` để đóng modal an toàn.
  * **Loại Bỏ Hoàn Toàn Thuật Ngữ Kỹ Thuật (Zero Jargon Policy):** Tuyệt đối không để lộ các thuật ngữ kỹ thuật, mã phân đoạn hay mã đặc tả hệ thống (như *SRS*, *SRS 3.3*, *KnowInherit*...) trên toàn bộ giao diện người dùng.
  * **HUD Góc Dưới Bên Phải & Bản Đồ (Minimap):**
    * **Xóa Bỏ Dấu X Khỏi Map:** Triệt tiêu hoàn toàn nút `×` trên Minimap để chống thao tác bấm nhầm xóa mất bàn học.
    * **Phím Tắt M & Nút Tròn Mở Lại Map:** Người dùng bấm phím `M` để ẩn/hiện bản đồ. Khi bản đồ ẩn, một **nút tròn màu cam (`rounded-full w-12 h-12 bg-[#E0562D] text-white`)** chứa icon `Map` nét trắng lập tức xuất hiện tại góc đó để người dùng bấm trực tiếp vào mở lại bản đồ bất cứ lúc nào.
    * Thanh điều hướng zoom tăng 30% (`px-3.5 py-2 rounded-2xl gap-2`), icon zoom `stroke-[2.4]`, số phần trăm zoom in đậm font mono (`font-black text-xs text-slate-900`).
  * **HUD Góc Trên Bên Phải — Nhóm Thanh Ngang Hợp Nhất (`TopRightWallet`):**
    * Gộp toàn bộ các nút: Chuỗi (Streak), Chợ (Marketplace), Credit (Token) và AI Bot vào **một thanh ngang duy nhất** (`rounded-2xl bg-white/95 border border-slate-300 p-1.5 shadow-sm`), các nút con tăng 30% kích thước (`h-11`) ngăn cách bởi vạch phân chia mảnh nhẹ (`w-[1px] h-6 bg-slate-200`).
    * **Chuỗi ngày học (Streak) trên HUD:**
      * Khi có chuỗi (`streakDays > 0`): Ngọn lửa được **tô đầy ruột bằng màu Cam ViT** (`fill-[#E0562D] text-[#E0562D] w-8 h-8`), số chuỗi to ngang với icon ngọn lửa ở sau và có **màu trắng (`text-white font-black font-mono text-sm`)** nổi bần bật chính giữa ngọn lửa.
      * Khi chưa có chuỗi (`streakDays === 0`): Hiển thị icon lửa đường nét xám mảnh (`text-slate-400 stroke-[2]`) và số `0` màu xám.
    * **Modal Điểm Danh Nhận ViToken (`DailyStreakModal`):**
      * Header: Icon ngọn lửa Cam ViT nổi bật trong khung tròn viền ấm.
      * Mô tả cơ chế thưởng: *"Điểm danh mỗi ngày nhận 5 ViToken, riêng Chủ Nhật x2 nhận 10 ViToken."*
      * **Phân định rõ 4 trạng thái ô ngày (Thứ 2 đến Chủ Nhật - T2 đến CN):**
        1. **Đã nhận:** Nền xanh lá (`bg-emerald-500 border-emerald-600 text-white font-bold`) kèm dấu tích `✓` rõ ràng.
        2. **Hôm nay chưa nhận:** Nền mềm Cam ViT viền đậm (`bg-[#FFF7ED] border-[#E0562D] text-[#9A3412] font-black ring-2 ring-[#E0562D] ring-offset-1 animate-pulse`).
        3. **Bỏ lỡ:** Nền xám nhạt (`bg-slate-100 border-slate-200 text-slate-400`) kèm gạch ngang `-`.
        4. **Sắp tới:** Nền xám mềm (`bg-slate-50 border-slate-200 text-slate-600`) hiển thị số token (`+5` hoặc `+10`).
      * **Riêng ô Chủ Nhật (CN):** Áp dụng điểm nhấn cam (`bg-orange-50 border-orange-300 text-[#E0562D] font-black`).
      * Nhãn thứ trong tuần (`T2`, `T3`, `T4`, `T5`, `T6`, `T7`, `CN`) đặt phía dưới ô kèm tooltip đầy đủ (Thứ Hai $\rightarrow$ Chủ Nhật).
      * **Chuỗi ngày học & Mốc thưởng kế tiếp:** Hiển thị `Chuỗi X ngày` kèm icon ngọn lửa và mốc thưởng tiếp theo (ví dụ: `Mốc 7 ngày: +20 ViToken`) với thanh tiến trình trực quan.
      * **Đồng xu ViToken:** Hiển thị icon SVG đồng xu tròn cam chữ V thương hiệu thay vì text thô.
      * **Nhắc nhở điểm danh hàng ngày:** Tích hợp hộp kiểm "Nhắc tôi điểm danh mỗi ngày" đồng bộ `localStorage`.
      * **Trạng thái nút hành động chuẩn xác (Zero Status Conflict):**
        * Khi chưa nhận: Nút nổi bật Cam ViT **"Nhận ViToken ngay"** (`bg-[#E0562D] hover:bg-[#c9451e]`).
        * Khi đã nhận hôm nay: Vô hiệu hóa nút (`disabled`) và đổi text thành **"Đã nhận hôm nay • Nhận tiếp sau {X}h {Y}m"** với bộ đếm ngược thời gian thực đến nửa đêm.
      * Nút đóng chuẩn tiếp cận WCAG với vùng bấm tối thiểu 44px, hỗ trợ phím `Esc`.
    * **Modal Cài Đặt Kết Nối AI (AI Provider Modal):**
      * Hiển thị số dư ViToken của người dùng ngay trong modal: `Số dư ví của bạn: X ViToken`.
      * **Nhãn trạng thái rõ ràng cho từng lựa chọn:**
        * *Hệ thống ViTudy:* "Trừ ViToken" (`GPT-4o-mini`).
        * *Google Gemini:* "Miễn phí theo hạn mức" (`Gemini 1.5 Flash`).
        * *OpenAI cá nhân (BYOK):* "Khóa cá nhân" (`GPT-4o`).
        * *Đăng nhập bằng tài khoản ChatGPT:* "Ủy quyền tài khoản" (`GPT-4o Plus`).
      * Logo SVG vector chính thức sắc nét cho từng nhà cung cấp, huy hiệu "Đang dùng" cho provider active.
      * Trường nhập API Key tích hợp nút ẩn/hiện mật khẩu (`Eye`/`EyeOff`), nút kiểm tra kết nối (`Test`), và lưu ý an toàn cục bộ trên trình duyệt.
      * Nút "Lưu" chỉ kích hoạt khi có thay đổi thực sự so với cấu hình hiện tại, hiển thị thông báo xác nhận thành công.
      * Nút đóng tối thiểu 44px, hỗ trợ phím tắt `Esc`.
    * **Chợ Tài Liệu (`Store` icon):** Icon chợ nét đậm `stroke-[2.4]`, hover hiển thị tooltip `"Chợ Tài Liệu"`.
    * **Ô số dư Credit:** Huy hiệu `V` tròn (`w-6 h-6`) cùng số dư to rõ `text-sm font-black font-mono text-slate-900`.
    * **Nút Mô hình AI:** Icon `Bot` nét đậm `stroke-[2.4]`, bấm mở cài đặt model.
  * **HUD Giữa Trên & Cơ Chế Multiplayer (MultiplayerBar):**
    * **Chế độ Cá Nhân (Solo Mode - Mặc định khi chưa có peer):** Ẩn hoàn toàn thanh Multiplayer để giao diện sạch sẽ, thoáng đãng.
    * **Chế độ Học Nhóm (Khi có người cùng phòng):** Hiển thị thanh với avatar thành viên, cờ người thuyết trình và nút "Đồng bộ góc nhìn".
  * **Thanh Công Cụ Ngữ Cảnh Nổi Chuẩn Miro Trắng (Clean White Contextual Overlays — Anti-Dark AI Slop):**
    * Mọi thanh công cụ ngữ cảnh nổi xuất hiện khi click chọn vật thể (Sticky Note, Tờ giấy đơn PaperSheet, Huy hiệu tên sách BookSpread, Banner thông báo vẽ, Overlay thả file):
    * **Nghiêm cấm tuyệt đối:** Không sử dụng các khối màu đen/xanh đen tối tăm kiểu AI slop (`bg-slate-900`/`bg-stone-900`).
    * **Quy chuẩn bắt buộc:** Sử dụng nền **Trắng thanh nhã (`bg-white/95`)**, viền mảnh (`border border-slate-200/90`), chữ và icon màu than chì (`text-slate-700`), đổ bóng mềm (`shadow-lg backdrop-blur-md`). Nút chức năng nổi bật (như STudy) sử dụng điểm nhấn thương hiệu ấm (`bg-[#FFF7ED] text-[#9A3412] border border-[#FFEDD5]`).
  * **Thẻ Đánh Dấu Ruy Băng Sách Trượt Ra Từ Bên Trong (`BookSpread` Tab Slide-out):**
    * Toàn bộ 5 thanh nhắc ruy băng khi hover chuột sẽ trượt từ trong mép giấy sách sang bên phải (`translate-x-0`).
    * Icon luôn nằm ở mép ngoài bên phải cạnh vết khuyết chữ V, chữ chức năng trượt ra bên trái icon theo cấu trúc `[text] [icon]`.
  * **Đinh Ghim Sợi Chỉ Đỏ Di Chuyển Được (`VisualLinkThreads` Draggable Pushpin):**
    * Đinh ghim đỏ trên sách và ghi chú cho phép người dùng đè chuột kéo thả để di chuyển vị trí neo ghim sang vị trí khác trên trang sách hoặc mặt bàn.
    * Hitbox của đinh ghim được thu nhỏ chính xác bằng kích thước hạt nút ghim (`r=14`), không gây cản trở thao tác đọc và bôi đen chữ của sách.

---

## 8. Quy Chuẩn Kiến Trúc Modal & Điều Hướng Người Dùng (Modal Architecture & Navigation Strict Rules)

* **Quy chuẩn Portal bắt buộc cho mọi Modal toàn màn hình (Modal React Portals Strict):**
  * Toàn bộ modal toàn màn hình (`TopUpModal`, `MarketModal`, `StudyToolsModal`, `DailyModal` Streak, `HistoryModal`, `AiConfigModal`) **bắt buộc render qua `createPortal(..., document.body)`**.
  * **Lý do kỹ thuật cốt lõi:** Các thành phần HUD cha (như `TopRightWallet`, `LeftCreationBar`) sử dụng thuộc tính CSS `transform` (`translate-y-0`), điều này biến container cha thành containing block cho mọi phần tử con `position: fixed`. Nếu không dùng `createPortal`, modal toàn màn hình sẽ bị co hẹp thành cột nhỏ biến dạng ở góc màn hình.
  * Lớp hiển thị bắt buộc: `z-[9990]` đến `z-[9999]`, nền mờ tối `bg-black/60 backdrop-blur-xs`.
* **Cơ chế Backdrop Click-to-Close & Ngăn chặn sủi bọt (Backdrop Dismissal Protocol):**
  * Container nền mờ bắt buộc có xử lý đóng an toàn: `onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}`.
  * Hộp thoại trung tâm bắt buộc có `onClick={(e) => e.stopPropagation()}` để người dùng thao tác bên trong không bị đóng nhầm.
  * Nút đóng `X` phải có `id` định danh duy nhất (ví dụ: `#close-topup-modal`, `#close-market-modal`, `#close-study-tools-modal`) và `aria-label` rõ ràng.
* **Cơ chế Đóng Đơn Nhiệm trong HUD (Single-Active Modal Dispatcher):**
  * Khi người dùng nhấp mở bất kỳ modal nào trên HUD (`Streak`, `Chợ Tài Liệu`, `Lịch sử Ví`, `Nạp ViToken`, `Cài đặt AI`), hệ thống tự động gọi hàm dọn dẹp đóng tất cả các modal khác trước đó (`closeAllModals()`).
  * Tuyệt đối không cho phép nhiều modal/popup toàn màn hình mở chồng chéo lên nhau gây tắc nghẽn thao tác và xung đột thị giác.
* **Quy Chuẩn Điều Hướng Trang Chủ & Bàn Học (Home Dashboard & Desk View Sync):**
  * Trang chủ `/` thay thế hoàn toàn landing page quảng cáo cũ bằng **Trang chủ học tập (Dashboard)** công thái học hiện đại:
    * **Thanh bên (Sidebar):** Logo ViTudy, ô tìm kiếm ("Tìm bàn học, tài liệu..."), menu điều hướng (`Trang chủ`, `Bàn học của tôi`, `Đã gắn dấu sao`, `Chợ tài liệu`, `Nhật ký học`, `Hỏi đáp`, `Giới thiệu & Kỹ thuật`), widget "Mục tiêu hôm nay" (tiến độ Pomodoro 25 phút), ở đáy là thẻ Số dư ViToken font sans sắc nét kèm nút "Nạp ViToken" kích hoạt trực tiếp modal VietQR.
    * **Thanh trên cùng (Sticky Top Bar):** Cố định khi cuộn, khoảng đệm an toàn không bị cắt mép, gồm breadcrumb vị trí, nút điểm danh có phân biệt trạng thái rõ ràng (chưa điểm danh có chấm cam nhấp nháy, đã điểm danh có icon tích xanh ngọc), và nút avatar tròn đại diện người dùng bên phải trỏ về `/profile`.
    * **Lời chào định hướng tinh gọn:** "Ôn bài thôi, [Tên ngắn]" (ví dụ: "Thành") cỡ 36–40px kiểu chữ Serif trang nhã, màu cam `#B8431A` đạt chuẩn tương phản WCAG AA, căn trái cùng trục hoàn hảo với các khối nội dung bên dưới.
    * **Bắt đầu bàn học mới (4 Mẫu Trực Quan):**
      * Hình xem trước lớn, nổi bật:
        - `Bàn học trống`: Khung nét đứt lớn, icon Plus kèm dòng chữ thả tài liệu.
        - `Ôn thi giữa kỳ`: Cuốn sách nâu lớn rõ chi tiết 2 trang và tờ note vàng.
        - `Giáo trình + đề thi`: 2 tờ tài liệu A4 song song đính note góc.
        - `Học nhóm`: Bìa sổ chung và 2 con trỏ chuột SVG sống động kèm tên ("Thành" cam và "Bạn học" tím).
      * Cả 4 thẻ đều có dòng mô tả ngắn phân biệt công năng.
      * Trạng thái viền: Mặc định viền trung tính `border-stone-200/90`, chỉ hiện viền cam và đổ bóng khi hover hoặc focus. Bấm vào là tạo/mở bàn học ngay.
    * **Mở lại gần đây (Giá trị thực tế & Công thái học):**
      * Mỗi hàng có ảnh thu nhỏ bàn học 56×40px.
      * Tên bàn học đặt tự động theo nội dung/môn học thực tế.
      * Thay thế cột "Chủ sở hữu" bằng cột "Tài liệu & Ghi chú" hữu ích (ví dụ: "1 giáo trình · 3 ghi chú").
      * Cột thời gian hiển thị mốc cụ thể ("14:20 hôm nay", "2 giờ trước", "Hôm qua 21:15").
      * Tiêu đề bảng màu `text-stone-700` chữ hoa đậm nét, nút "Xem tất cả" màu cam `#B8431A` đạt độ tương phản WCAG AA >= 4.5:1.
    * **Chợ tài liệu:** Thu gọn thành dải thông tin nhỏ gọn ở đáy màn hình.
    * **Xử lý phần Landing page cũ:**
      * Bảng giá chuyển thành modal "Nạp ViToken qua VietQR" (`TopUpModal`).
      * Chi tiết kỹ thuật (KaTeX, SM-2, 60 FPS) và trang giới thiệu rút gọn cho khách chưa đăng nhập ("Trải giáo trình, đề thi và vở nháp trên cùng một bàn học") chuyển sang trang `/about`.
  * Hỗ trợ chuyển đổi mượt mà giữa Trang chủ (`/?view=home`) và Không gian bàn học (`/?view=desk`), lắng nghe sự kiện `popstate` của trình duyệt.
  * **Nguyên Tắc Điều Hướng URL Gốc & Trở Về Bàn Học (Root URL Home Priority & Desk Return Navigation):**
    * Khi người dùng truy cập link gốc `https://namtacozz.github.io/ViTudy/` hoặc `http://localhost:3000/` không kèm tham số truy vấn (`query param`), hệ thống **BẮT BUỘC** hiển thị **Trang chủ (HomePage)**. Tuyệt đối không tự động đọc `localStorage` để ép chuyển vào Bàn học khi người dùng chủ động vào link gốc.
    * Bàn học chỉ được mở khi:
      1. URL có tham số `?view=desk`.
      2. URL có tham số phòng học nhóm `?room=...`.
      3. Người dùng chủ động bấm vào mẫu bàn học hoặc danh sách bàn học gần đây trên Trang chủ.
    * Khi đang ở trên Bàn học và nhấn F5 (Refresh trang): Do URL vẫn giữ `?view=desk`, hệ thống bảo lưu phiên làm việc trên bàn học bình thường.
    * Tại các trang con phụ (`/profile`, `/dashboard`, `/market`, `/auth`), nút quay lại ("Về Bàn Học" / "Quay lại Bàn Học") **BẮT BUỘC** trỏ về `href="/?view=desk"` thay vì `href="/"`, đảm bảo người dùng đang học chuyển qua xem hồ sơ/thống kê rồi bấm quay lại thì quay thẳng về Bàn học mà không bị văng ra Trang chủ.

* **Quy Chuẩn Trang Hỏi Đáp & Chăm Sóc Người Học (FAQ & Support Page Standards — `/faq`):**
  * **Cấu trúc & Trục căn lề:**
    * Toàn bộ trang (Header, Tiêu đề, Ô tìm kiếm, Chip danh mục, Danh sách câu hỏi, và Khối Hỗ trợ cuối trang) **căn thẳng hàng một trục duy nhất** theo độ rộng `max-w-4xl mx-auto px-6`.
    * Triệt tiêu hoàn toàn khối CTA căn giữa cô lập làm lệch hướng đọc của người dùng.
  * **Bộ câu hỏi toàn diện & Thực tế (14+ câu hỏi chuyên sâu):**
    * Bắt buộc có các câu hỏi trọng yếu về tài chính và dữ liệu:
      - *VietQR nạp tiền:* Quy trình đối soát tự động qua SePay/MBBank trong 30s-2p; cơ chế hỗ trợ bù điểm tức thì qua email `support@vitudy.edu.vn`.
      - *Quy đổi & Chi phí:* 1.000đ = 1 ViToken; chi phí AI hệ thống ~0,05 V (~50đ)/lượt; miễn phí 0 V khi dùng BYOK API Key cá nhân.
      - *Chính sách hoàn tiền:* ViToken không bao giờ hết hạn; hỗ trợ hoàn tiền 100% trong 24 giờ cho giao dịch nạp nhầm chưa sử dụng.
      - *Bản quyền Chợ tài liệu:* Tác giả nhận 85% ViToken doanh thu mỗi lượt mở khóa; người mua sở hữu vĩnh viễn và chỉ đọc tương tác 2.5D, không lộ tệp tin gốc PDF.
      - *Bảo mật & Quyền riêng tư:* Khóa API cá nhân (Gemini, OpenAI) lưu trữ 100% cục bộ trên trình duyệt thiết bị người dùng, không bao giờ gửi về máy chủ ViTudy; dữ liệu bàn học bảo mật bằng Supabase Row-Level Security.
      - *Thuật toán SM-2:* Giải thích rõ công thức biến thiên hệ số dễ $EF \in [1.3, 2.5]$ và 4 mức đánh giá (Quên, Khó, Vừa, Dễ) với các mốc thời gian ôn tập lặp lại ngắt quãng.
  * **Công cụ lọc, tìm kiếm & Liên kết trực tiếp (Deep Linking):**
    * Thanh tìm kiếm thời gian thực: Quét cả tiêu đề câu hỏi, nhãn danh mục lẫn từ khóa nội dung (keywords).
    * Bộ lọc danh mục dạng chip gọn gàng: `Tất cả`, `Bàn học 2.5D`, `Ôn tập & SM-2`, `ViToken & Nạp tiền`, `Chợ tài liệu`, `Tài khoản & Bảo mật`.
    * Nút "Mở tất cả" / "Thu gọn tất cả" cho phép mở đồng thời nhiều câu hỏi.
    * Mỗi câu hỏi có định danh `id` slug duy nhất (ví dụ `#thuat-toan-on-tap-sm2`, `#chuyen-khoan-vietqr-chua-thay-vitoken`) kèm nút sao chép liên kết trực tiếp (Copy link) để đội ngũ hỗ trợ gửi nhanh đường dẫn cho người học.
    * Đánh giá hữu ích cuối câu: Cho phép người học bấm "Có" / "Chưa rõ" kèm phản hồi ghi nhận tức thời.
  * **Nút hành động & Kênh liên hệ hỗ trợ đích thực:**
    * Khối cuối trang dẫn đích thực đến **"Liên hệ hỗ trợ: support@vitudy.edu.vn"** với nút màu cam thương hiệu `#E0562D` và nêu rõ thời gian phản hồi (2 – 4 giờ làm việc, trực từ 08:00 – 22:00 hàng ngày).
    * Liên kết "Mã nguồn trên GitHub" đóng vai trò nút phụ nhã nhặn, không chiếm đoạt vị trí của kênh hỗ trợ.
  * **Chuẩn khả năng tiếp cận (Accessibility WCAG AA):**
    * Vùng bấm câu hỏi là `<button>` tối thiểu 52px, có `aria-expanded={isOpen}`, focus-visible viền cam rõ ràng.
    * Nhãn danh mục dùng `text-[11px] font-bold text-[#9A3412] bg-[#FFF7ED] border border-[#FFEDD5]`.
    * Chữ nội dung trả lời dùng `text-slate-700` đạt tỷ lệ tương phản >= 4.5:1.


