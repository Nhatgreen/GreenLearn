# 04_DATA_MODEL.md — Lược Đồ Dữ Liệu & RLS ViTudy

> **Commit Hash:** `74d4cc0`  
> **Cập nhật lần cuối:** `2026-11-07`  
> **Nguồn SQL:** [`supabase/schema.sql`](file:///F:/AppMaking/ViTudy/supabase/schema.sql) + [`supabase/migrations/0001..0004`](file:///F:/AppMaking/ViTudy/supabase/migrations/)  
> **Nguồn TypeScript:** [`src/types/database.types.ts`](file:///F:/AppMaking/ViTudy/src/types/database.types.ts), [`src/types/studyspace.ts`](file:///F:/AppMaking/ViTudy/src/types/studyspace.ts), [`src/types/vitoken.ts`](file:///F:/AppMaking/ViTudy/src/types/vitoken.ts)

---

## 1. Danh Mục Các Bảng CSDL (PostgreSQL Supabase)

### 1. `public.profiles`
*Nguồn: [`supabase/schema.sql:L12-L25`](file:///F:/AppMaking/ViTudy/supabase/schema.sql#L12-L25)*
* **Mục đích:** Lưu trữ hồ sơ người học, số dư ví ViToken và token xác thực AI cá nhân.
* **Cột dữ liệu:**
  * `id` (`UUID`, PK, references `auth.users(id) ON DELETE CASCADE`)
  * `email` (`TEXT NOT NULL`)
  * `display_name` (`TEXT`)
  * `avatar_url` (`TEXT`)
  * `vitoken_balance` (`INT NOT NULL DEFAULT 50 CHECK (vitoken_balance >= 0)`)
  * `daily_streak_days` (`INT NOT NULL DEFAULT 1`)
  * `last_claim_date` (`DATE DEFAULT CURRENT_DATE`)
  * `custom_openai_key_encrypted` (`TEXT`)
  * `custom_gemini_key_encrypted` (`TEXT`)
  * `oauth_chatgpt_token` (`JSONB`)
  * `created_at`, `updated_at` (`TIMESTAMPTZ`)

### 2. `public.study_spaces`
*Nguồn: [`supabase/schema.sql:L28-L37`](file:///F:/AppMaking/ViTudy/supabase/schema.sql#L28-L37)*
* **Mục đích:** Quản lý không gian bàn học 2.5D của người dùng hoặc phòng học nhóm.
* **Cột dữ liệu:**
  * `id` (`UUID`, PK)
  * `owner_id` (`UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE`)
  * `name` (`TEXT NOT NULL DEFAULT 'Bàn Học Cá Nhân'`)
  * `subject` (`TEXT NOT NULL DEFAULT 'Học tập'`)
  * `is_public` (`BOOLEAN NOT NULL DEFAULT false`)
  * `camera_transform` (`JSONB NOT NULL DEFAULT '{"x": 0, "y": 0, "scale": 1}'`)
  * `created_at`, `updated_at` (`TIMESTAMPTZ`)

### 3. `public.space_members`
*Nguồn: [`supabase/schema.sql:L40-L50`](file:///F:/AppMaking/ViTudy/supabase/schema.sql#L40-L50)*
* **Mục đích:** Quản lý thành viên và phân quyền trong phòng học cộng tác thời gian thực.
* **Cột dữ liệu:**
  * `id` (`UUID`, PK)
  * `space_id` (`UUID NOT NULL REFERENCES study_spaces(id) ON DELETE CASCADE`)
  * `user_id` (`UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE`)
  * `role` (`TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer'))`)
  * `joined_at` (`TIMESTAMPTZ DEFAULT NOW()`)
* **Khóa duy nhất:** `UNIQUE(space_id, user_id)`

### 4. `public.desk_documents`
*Nguồn: [`supabase/schema.sql:L53-L68`](file:///F:/AppMaking/ViTudy/supabase/schema.sql#L53-L68)*
* **Mục đích:** Quản lý sách giáo trình, tệp bài giảng và tờ giấy A4 đặt trên bàn.
* **Cột dữ liệu:**
  * `id` (`UUID`, PK)
  * `space_id` (`UUID NOT NULL REFERENCES study_spaces(id) ON DELETE CASCADE`)
  * `title` (`TEXT NOT NULL`)
  * `item_type` (`TEXT CHECK (item_type IN ('paper', 'book', 'exam_sheet'))`)
  * `x`, `y`, `rotation`, `scale` (`DOUBLE PRECISION`)
  * `z_index` (`INT NOT NULL DEFAULT 10`)
  * `page_count` (`INT NOT NULL DEFAULT 1`)
  * `current_page_index` (`INT NOT NULL DEFAULT 0`)
  * `is_binder` (`BOOLEAN NOT NULL DEFAULT false`)
  * `storage_file_path` (`TEXT` - DRM Supabase Storage)

### 5. `public.document_pages`
*Nguồn: [`supabase/schema.sql:L71-L80`](file:///F:/AppMaking/ViTudy/supabase/schema.sql#L71-L80)*
* **Mục đích:** Phân tách từng trang sách phục vụ Inteline Hybrid RAG và chống đạo văn.
* **Cột dữ liệu:**
  * `id` (`UUID`, PK)
  * `document_id` (`UUID NOT NULL REFERENCES desk_documents(id) ON DELETE CASCADE`)
  * `page_number` (`INT NOT NULL`)
  * `title` (`TEXT`)
  * `content` (`TEXT NOT NULL`)
  * `embedding` (`vector(1536)` - text-embedding-3-small / Gemini)
* **Index:** `idx_doc_pages_embedding` (`ivfflat` vector_cosine_ops với lists = 100).

### 6. `public.desk_sticky_notes`
*Nguồn: [`supabase/schema.sql:L88-L98`](file:///F:/AppMaking/ViTudy/supabase/schema.sql#L88-L98)*
* **Cột dữ liệu:** `id`, `space_id` (FK), `content`, `color`, `x`, `y`, `rotation`, `z_index`, `created_at`.

### 7. `public.desk_drawings`
*Nguồn: [`supabase/schema.sql:L101-L110`](file:///F:/AppMaking/ViTudy/supabase/schema.sql#L101-L110)*
* **Cột dữ liệu:** `id`, `space_id` (FK), `author_id` (FK profiles), `color`, `width`, `is_highlighter`, `points (JSONB array [{x, y}])`, `created_at`.

### 8. `public.inteline_threads`
*Nguồn: [`supabase/schema.sql:L113-L123`](file:///F:/AppMaking/ViTudy/supabase/schema.sql#L113-L123)*
* **Cột dữ liệu:** `id`, `space_id` (FK), `source_item_id` (FK desk_documents), `source_page_number`, `selected_text`, `target_sticky_id` (FK desk_sticky_notes), `question`, `answer`, `created_at`.

### 9. `public.know_inherit_listings`
*Nguồn: [`supabase/schema.sql:L126-L139`](file:///F:/AppMaking/ViTudy/supabase/schema.sql#L126-L139)*
* **Cột dữ liệu:** `id`, `author_id` (FK), `title`, `summary`, `tier (C, B, A, S)`, `ai_quality_score (0-100)`, `max_similarity_score`, `price (5, 15, 30, 50 ViToken)`, `preview_content`, `full_content_url`, `status`.

### 10. `public.know_inherit_purchases`
*Nguồn: [`supabase/schema.sql:L142-L151`](file:///F:/AppMaking/ViTudy/supabase/schema.sql#L142-L151)*
* **Cột dữ liệu:** `id`, `listing_id` (FK), `buyer_id` (FK), `total_price`, `author_payout (85%)`, `platform_fee (15%)`, `purchased_at`. Khóa duy nhất: `UNIQUE(listing_id, buyer_id)`.

### 11. `public.vitoken_transactions`
*Nguồn: [`supabase/schema.sql:L154-L163`](file:///F:/AppMaking/ViTudy/supabase/schema.sql#L154-L163)*
* **Cột dữ liệu:** `id`, `user_id` (FK profiles), `amount`, `balance_after`, `transaction_type (signup_grant, daily_streak, ai_usage, know_inherit_buy, know_inherit_earning, transfer)`, `description`, `created_at`.

---

## 2. Row Level Security (RLS) Policies
*Nguồn: [`supabase/schema.sql:L165-L208`](file:///F:/AppMaking/ViTudy/supabase/schema.sql#L165-L208)*

* `profiles`: `auth.uid() = id` (chỉ xem và sửa hồ sơ cá nhân).
* `study_spaces`: `auth.uid() = owner_id OR is_public = true` (chủ sở hữu hoặc phòng công khai).
* `space_members`: `auth.uid() = user_id OR auth.uid() IN (SELECT owner_id FROM study_spaces WHERE id = space_members.space_id)`.
* `desk_documents`, `desk_sticky_notes`, `desk_drawings`: Kiểm tra sự tồn tại trong `study_spaces` thuộc quyền truy cập của người dùng (`EXISTS (...)`).

---

## 3. Hàm Xử Lý Nguyên Tử & Vector Search (Database Functions)

1. **`match_document_pages`:**
   * *Nguồn:* [`supabase/schema.sql:L214-L246`](file:///F:/AppMaking/ViTudy/supabase/schema.sql#L214-L246).
   * *Nhiệm vụ:* Tìm kiếm ngữ nghĩa cosine similarity `1 - (p.embedding <=> query_embedding)` vượt ngưỡng `match_threshold` trong phạm vi `target_space_id`.
2. **`process_know_inherit_purchase`:**
   * *Nguồn:* [`supabase/schema.sql:L249-L301`](file:///F:/AppMaking/ViTudy/supabase/schema.sql#L249-L301).
   * *Nhiệm vụ:* Giao dịch tài chính nguyên tử an toàn (`SECURITY DEFINER`): kiểm tra số dư, trừ tiền người mua, cộng 85% cho tác giả, cộng 15% phí nền tảng, ghi nhật ký giao dịch.

---

## 4. Đối Soát TypeScript Mirror Types & Độ Lệch (Schema Drift)

| Bảng CSDL | TypeScript Type | Vị trí định nghĩa | Đánh giá độ lệch (Drift Status) |
|---|---|---|---|
| `study_spaces` | `StudySpace` | [`src/types/studyspace.ts:L63-L73`](file:///F:/AppMaking/ViTudy/src/types/studyspace.ts#L63-L73) | **Khớp 100%**: `id`, `name`, `subject`, `description`, `items`, `threads`. |
| `desk_documents` | `DeskItem` (kèm `ExamSheetData`) | [`src/types/studyspace.ts`](file:///F:/AppMaking/ViTudy/src/types/studyspace.ts) | **Đã đồng bộ 100% qua migration 0002:** Bảng `desk_documents` chứa toàn bộ thuộc tính (`cover_color`, `sticky_text`, `sticky_color`, `exam_data`, `attached_to_item_id`). Bảng cũ `desk_sticky_notes` đã deprecated. |
| `desk_drawings` | `DrawingStroke` | [`src/types/studyspace.ts:L75-L81`](file:///F:/AppMaking/ViTudy/src/types/studyspace.ts#L75-L81) | **Khớp 100%**: `id`, `points`, `color`, `width`, `isHighlighter`. |
| `inteline_threads` | `IntelineThread` | [`src/types/studyspace.ts:L3-L20`](file:///F:/AppMaking/ViTudy/src/types/studyspace.ts#L3-L20) | **Khớp 100%**: nguồn, đích note, câu hỏi, câu trả lời. |
| `profiles` & `vitoken_transactions` | `ViTokenWallet` & `ViTokenTransaction` | [`src/types/vitoken.ts:L1-L24`](file:///F:/AppMaking/ViTudy/src/types/vitoken.ts#L1-L24) | **Khớp 100%**: Quản lý số dư, lịch sử giao dịch và chuỗi streak (Anti-sybil 180s desk activity). |
| `know_inherit_listings` | Trạng thái Modal & Store | [`src/components/modals/KnowInheritPublishModal.tsx:L8-L20`](file:///F:/AppMaking/ViTudy/src/components/modals/KnowInheritPublishModal.tsx#L8-L20) | **Khớp 100%**: Khung giá chuẩn SRS 5.1 (5/15/30/50 ViToken), hạng C/B/A/S, tỷ lệ chia thưởng 85/15. |
