# 00_INDEX.md — Chỉ Mục & Giao Thức Bộ Nhớ Dự Án ViTudy

> **Commit Hash:** `Current Working Tree`  
> **Cập nhật lần cuối:** `2026-11-11`  
> **Trạng thái Codebase:** Đã khắc phục triệt để lỗi học nhóm trực tuyến (kết nối realtime phòng học, hiển thị bạn học trong phòng, đồng bộ 2 chiều di chuyển/lật trang/vẽ nét, chiếu con trỏ chuột tọa độ thế giới), 18/18 test suites pass, docs:check pass.

---

## 1. Mục Đích Của Thư Mục `docs/ai/`

Thư mục `docs/ai/` đóng vai trò là "Bộ nhớ dài hạn" (Project Memory) của dự án **ViTudy**:
1. Giúp bất kỳ Agent lập trình nào định vị ngay lập tức file, symbol, cấu trúc dữ liệu và luồng xử lý trong vài giây mà không cần duyệt quét toàn bộ repo.
2. Cho phép con người tải toàn bộ thư mục này lên các mô hình AI khác để nắm bắt 100% hiện trạng dự án tức thì qua `SNAPSHOT.md`.

---

## 2. Danh Sách Tài Liệu Trong Bộ Nhớ

| Tên File | Mô Tả Một Dòng |
|---|---|
| [`00_INDEX.md`](file:///F:/AppMaking/ViTudy/docs/ai/00_INDEX.md) | Mục đích thư mục, danh mục tài liệu, giao thức cập nhật bắt buộc (Update Protocol) |
| [`01_OVERVIEW.md`](file:///F:/AppMaking/ViTudy/docs/ai/01_OVERVIEW.md) | Tóm tắt sản phẩm, Tech Stack, lệnh thực thi, biến môi trường, quy ước đặt tên |
| [`02_FILE_MAP.md`](file:///F:/AppMaking/ViTudy/docs/ai/02_FILE_MAP.md) | Cây thư mục chú giải chi tiết, phân nhóm module, kích thước S/M/L, quan hệ import |
| [`03_SYMBOL_INDEX.md`](file:///F:/AppMaking/ViTudy/docs/ai/03_SYMBOL_INDEX.md) | Bảng chỉ mục toàn bộ ký hiệu code (`Symbol \| Kind \| File:Lines \| Role`) |
| [`04_DATA_MODEL.md`](file:///F:/AppMaking/ViTudy/docs/ai/04_DATA_MODEL.md) | Lược đồ CSDL PostgreSQL Supabase, pgvector, RLS Policies, TypeScript mirror types, Drift check |
| [`05_API_AND_ROUTES.md`](file:///F:/AppMaking/ViTudy/docs/ai/05_API_AND_ROUTES.md) | Danh mục Next.js App Router API, phương thức, đầu vào/ra, cổng AI Codex/Gemini/OpenAI |
| [`06_UI_MAP.md`](file:///F:/AppMaking/ViTudy/docs/ai/06_UI_MAP.md) | Cây phân cấp UI: Layout → HUD 4 góc → Contextual Overlay → Canvas Objects 2.5D |
| [`07_STATE_AND_DATAFLOW.md`](file:///F:/AppMaking/ViTudy/docs/ai/07_STATE_AND_DATAFLOW.md) | Kiến trúc State Context (`StudySpaceContext`, `ViTokenContext`), luồng dữ liệu & Mermaid diagram |
| [`08_FEATURE_STATUS.md`](file:///F:/AppMaking/ViTudy/docs/ai/08_FEATURE_STATUS.md) | Ma trận đối soát tính năng với SRS ViTudy (`SRS section \| Feature \| Status \| Evidence \| Gap`) |
| [`09_ISSUES_AND_TODO.md`](file:///F:/AppMaking/ViTudy/docs/ai/09_ISSUES_AND_TODO.md) | Danh sách lỗi, nợ kỹ thuật, rủi ro bảo mật/hiệu năng, ID, độ ưu tiên, giải pháp đề xuất |
| [`10_DECISIONS.md`](file:///F:/AppMaking/ViTudy/docs/ai/10_DECISIONS.md) | Nhật ký quyết định kiến trúc bất biến (ADR Log): Lý do chọn, giải pháp thay thế bị bác bỏ |
| [`11_CHANGELOG.md`](file:///F:/AppMaking/ViTudy/docs/ai/11_CHANGELOG.md) | Nhật ký thay đổi từng phiên làm việc (Session log append-only theo thứ tự mới nhất ở trên) |
| [`SNAPSHOT.md`](file:///F:/AppMaking/ViTudy/docs/ai/SNAPSHOT.md) | Bản tóm lược toàn diện một file độc lập (<600 dòng) dành để nạp cho AI khác |

---

## 3. GIAO THỨC CẬP NHẬT BẮT BUỘC (UPDATE PROTOCOL — STEP 4)

Trước khi tuyên bố hoàn thành bất kỳ tác vụ nào, Agent **BẮT BUỘC** thực hiện tuần tự 6 bước sau:

1. **Chạy cập nhật tự động:**
   ```bash
   pnpm run docs:index
   pnpm run docs:check
   ```
2. **Cập nhật các file tài liệu bị ảnh hưởng:**
   - Thay đổi Schema CSDL hoặc Type $\rightarrow$ Cập nhật [`04_DATA_MODEL.md`](file:///F:/AppMaking/ViTudy/docs/ai/04_DATA_MODEL.md).
   - Thêm/sửa Route hoặc API $\rightarrow$ Cập nhật [`05_API_AND_ROUTES.md`](file:///F:/AppMaking/ViTudy/docs/ai/05_API_AND_ROUTES.md).
   - Thay đổi Component, HUD, Canvas $\rightarrow$ Cập nhật [`06_UI_MAP.md`](file:///F:/AppMaking/ViTudy/docs/ai/06_UI_MAP.md).
   - Cập nhật tiến độ tính năng $\rightarrow$ Cập nhật [`08_FEATURE_STATUS.md`](file:///F:/AppMaking/ViTudy/docs/ai/08_FEATURE_STATUS.md).
   - Phát hiện hoặc sửa lỗi mới $\rightarrow$ Cập nhật [`09_ISSUES_AND_TODO.md`](file:///F:/AppMaking/ViTudy/docs/ai/09_ISSUES_AND_TODO.md).
3. **Ghi nhận quyết định kiến trúc (nếu có):**
   - Thêm bản ghi mới vào [`10_DECISIONS.md`](file:///F:/AppMaking/ViTudy/docs/ai/10_DECISIONS.md) khi đưa ra quyết định phi tầm thường (chọn thư viện, đổi cấu trúc dữ liệu, đổi thuật toán).
4. **Ghi nhật ký phiên làm việc:**
   - Thêm mục mới lên đầu file [`11_CHANGELOG.md`](file:///F:/AppMaking/ViTudy/docs/ai/11_CHANGELOG.md) theo mẫu:
     ```markdown
     ## YYYY-MM-DD HH:mm — <commit hash hoặc "uncommitted">
     - Task: <nhiệm vụ được giao>
     - Changed: <file:Lines (symbol)> ...
     - Added/Removed: ...
     - Verified by: <lệnh kiểm tra + kết quả>
     - Open follow-ups: ...
     ```
5. **Đồng bộ SNAPSHOT.md:**
   - Tạo lại bản tiêu hóa [`SNAPSHOT.md`](file:///F:/AppMaking/ViTudy/docs/ai/SNAPSHOT.md) từ dữ liệu các file trên và cập nhật commit hash / ngày trong [`00_INDEX.md`](file:///F:/AppMaking/ViTudy/docs/ai/00_INDEX.md).
6. **Báo cáo hoàn tất:**
   - Trong câu trả lời cuối cùng, Agent phải tuyên bố rõ: `"Docs updated: <danh sách các file đã cập nhật>"`.
