# 03_SYMBOL_INDEX.md — Chỉ Mục Toàn Bộ Ký Hiệu Codebase ViTudy

> **Commit Hash:** `70ec0f3`  
> **Cập nhật lần cuối:** `2026-11-12`  
> **Quy ước:** Symbol | Kind | File:Lines (Symbol) | Vai trò chức năng

<!-- manual:start -->
Tài liệu này được đồng bộ tự động qua `npm run docs:index` và kiểm tra bởi `npm run docs:check`.
<!-- manual:end -->

### Canvas & 2.5D Desk

| Ký hiệu (Symbol) | Loại (Kind) | Vị trí (File:Lines) | Vai trò chức năng |
|---|---|---|---|
| `DeskDrawingCanvas` | `component` | [src/components/canvas/DeskDrawingCanvas.tsx:L6-L112](file:////home/nhat/Documents/DUT/ViTudy/src/components/canvas/DeskDrawingCanvas.tsx) | Canvas vẽ nét bút dạ quang và bút vẽ tự do với chế độ multiply blend |
| `DeskDrawingInteractionLayer` | `component` | [src/components/canvas/DeskDrawingInteractionLayer.tsx:L6-L683](file:////home/nhat/Documents/DUT/ViTudy/src/components/canvas/DeskDrawingInteractionLayer.tsx) | Lớp đón bắt sự kiện kéo vẽ mượt mà, phân định vẽ nét vs di chuyển bàn |
| `DeskGrid` | `component` | [src/components/canvas/DeskGrid.tsx:L5-L50](file:////home/nhat/Documents/DUT/ViTudy/src/components/canvas/DeskGrid.tsx) | Lưới caro toạ độ bàn học trắng tinh khiết chống mỏi mắt |
| `InfiniteDesk` | `component` | [src/components/canvas/InfiniteDesk.tsx:L20-L643](file:////home/nhat/Documents/DUT/ViTudy/src/components/canvas/InfiniteDesk.tsx) | Mặt bàn vô cực 2.5D: quản lý pan, zoom, phím tắt Alt+Drag, bắt sự kiện click |
| `ItemDrawingOverlay` | `component` | [src/components/canvas/ItemDrawingOverlay.tsx:L6-L90](file:////home/nhat/Documents/DUT/ViTudy/src/components/canvas/ItemDrawingOverlay.tsx) | Thành phần nghiệp vụ của phân hệ Canvas & 2.5D Desk |
| `MindMapConnectors` | `component` | [src/components/canvas/MindMapConnectors.tsx:L6-L103](file:////home/nhat/Documents/DUT/ViTudy/src/components/canvas/MindMapConnectors.tsx) | Thành phần nghiệp vụ của phân hệ Canvas & 2.5D Desk |
| `Minimap` | `component` | [src/components/canvas/Minimap.tsx:L12-L234](file:////home/nhat/Documents/DUT/ViTudy/src/components/canvas/Minimap.tsx) | Bản đồ radar thu nhỏ góc nhìn toàn cảnh không gian bàn học 2.5D |
| `MultiplayerCursorsLayer` | `component` | [src/components/canvas/MultiplayerCursorsLayer.tsx:L12-L62](file:////home/nhat/Documents/DUT/ViTudy/src/components/canvas/MultiplayerCursorsLayer.tsx) | Thành phần nghiệp vụ của phân hệ Canvas & 2.5D Desk |
| `StudySpaceDeskView` | `component` | [src/components/canvas/StudySpaceDeskView.tsx:L20-L235](file:////home/nhat/Documents/DUT/ViTudy/src/components/canvas/StudySpaceDeskView.tsx) | Component trung tâm tích hợp toàn bộ Canvas bàn học, HUD 4 góc và modal |
| `VisualLinkThreads` | `component` | [src/components/canvas/VisualLinkThreads.tsx:L6-L215](file:////home/nhat/Documents/DUT/ViTudy/src/components/canvas/VisualLinkThreads.tsx) | Vẽ các đường dây nối SVG trực quan từ đoạn trích sách sang giấy note Inteline |

### Objects (Sách, Giấy, Note)

| Ký hiệu (Symbol) | Loại (Kind) | Vị trí (File:Lines) | Vai trò chức năng |
|---|---|---|---|
| `BOOK_COVER_PRESETS` | `component` | [src/components/objects/BookSpread.tsx:L39-L80](file:////home/nhat/Documents/DUT/ViTudy/src/components/objects/BookSpread.tsx) | Thành phần nghiệp vụ của phân hệ Objects (Sách, Giấy, Note) |
| `BookSpread` | `component` | [src/components/objects/BookSpread.tsx:L1188-L1188](file:////home/nhat/Documents/DUT/ViTudy/src/components/objects/BookSpread.tsx) | Mô phỏng cuốn sách mở 2.5D, phân trang động DOM, bìa cứng, gờ gáy và popover Inteline |
| `BookSpreadComponent` | `component` | [src/components/objects/BookSpread.tsx:L82-L1186](file:////home/nhat/Documents/DUT/ViTudy/src/components/objects/BookSpread.tsx) | Thành phần nghiệp vụ của phân hệ Objects (Sách, Giấy, Note) |
| `CodeBlockItem` | `component` | [src/components/objects/CodeBlockItem.tsx:L15-L197](file:////home/nhat/Documents/DUT/ViTudy/src/components/objects/CodeBlockItem.tsx) | Thành phần nghiệp vụ của phân hệ Objects (Sách, Giấy, Note) |
| `ExamQuizCard` | `component` | [src/components/objects/ExamQuizCard.tsx:L750-L750](file:////home/nhat/Documents/DUT/ViTudy/src/components/objects/ExamQuizCard.tsx) | Thành phần nghiệp vụ của phân hệ Objects (Sách, Giấy, Note) |
| `ExamQuizCardComponent` | `component` | [src/components/objects/ExamQuizCard.tsx:L46-L748](file:////home/nhat/Documents/DUT/ViTudy/src/components/objects/ExamQuizCard.tsx) | Thành phần nghiệp vụ của phân hệ Objects (Sách, Giấy, Note) |
| `MindMapNodeItem` | `component` | [src/components/objects/MindMapNodeItem.tsx:L24-L320](file:////home/nhat/Documents/DUT/ViTudy/src/components/objects/MindMapNodeItem.tsx) | Thành phần nghiệp vụ của phân hệ Objects (Sách, Giấy, Note) |
| `PaperSheet` | `component` | [src/components/objects/PaperSheet.tsx:L807-L807](file:////home/nhat/Documents/DUT/ViTudy/src/components/objects/PaperSheet.tsx) | Mô phỏng tờ giấy A4/ghi chép đơn lẻ 2.5D với độ xoay tự do và texture giấy |
| `PaperSheetComponent` | `component` | [src/components/objects/PaperSheet.tsx:L41-L805](file:////home/nhat/Documents/DUT/ViTudy/src/components/objects/PaperSheet.tsx) | Thành phần nghiệp vụ của phân hệ Objects (Sách, Giấy, Note) |
| `StickerItem` | `component` | [src/components/objects/StickerItem.tsx:L15-L192](file:////home/nhat/Documents/DUT/ViTudy/src/components/objects/StickerItem.tsx) | Thành phần nghiệp vụ của phân hệ Objects (Sách, Giấy, Note) |
| `StickyNoteItem` | `component` | [src/components/objects/StickyNoteItem.tsx:L1143-L1143](file:////home/nhat/Documents/DUT/ViTudy/src/components/objects/StickyNoteItem.tsx) | Giấy ghi chú dán bàn học (Patrick Hand font, NFC normalized, xoay 360°) |
| `StickyNoteItemComponent` | `component` | [src/components/objects/StickyNoteItem.tsx:L38-L1141](file:////home/nhat/Documents/DUT/ViTudy/src/components/objects/StickyNoteItem.tsx) | Thành phần nghiệp vụ của phân hệ Objects (Sách, Giấy, Note) |

### HUD & Overlays

| Ký hiệu (Symbol) | Loại (Kind) | Vị trí (File:Lines) | Vai trò chức năng |
|---|---|---|---|
| `BottomLeftKnowledge` | `component` | [src/components/hud/BottomLeftKnowledge.tsx:L51-L1194](file:////home/nhat/Documents/DUT/ViTudy/src/components/hud/BottomLeftKnowledge.tsx) | HUD góc dưới-trái: nút tải tài liệu và mở chợ chia sẻ tri thức KnowInherit 85/15 |
| `BottomRightToolkit` | `component` | [src/components/hud/BottomRightToolkit.tsx:L17-L208](file:////home/nhat/Documents/DUT/ViTudy/src/components/hud/BottomRightToolkit.tsx) | HUD góc dưới-phải: công cụ bút dạ quang, tạo note, khoá góc nhìn, zoom 100% |
| `FriendInviteToast` | `component` | [src/components/hud/FriendInviteToast.tsx:L14-L124](file:////home/nhat/Documents/DUT/ViTudy/src/components/hud/FriendInviteToast.tsx) | Thành phần nghiệp vụ của phân hệ HUD & Overlays |
| `FriendInviteToastProps` | `type` | [src/components/hud/FriendInviteToast.tsx:L8-L12](file:////home/nhat/Documents/DUT/ViTudy/src/components/hud/FriendInviteToast.tsx) | Thành phần nghiệp vụ của phân hệ HUD & Overlays |
| `FriendsRightDrawer` | `component` | [src/components/hud/FriendsRightDrawer.tsx:L27-L436](file:////home/nhat/Documents/DUT/ViTudy/src/components/hud/FriendsRightDrawer.tsx) | Thành phần nghiệp vụ của phân hệ HUD & Overlays |
| `InviteModal` | `component` | [src/components/hud/InviteModal.tsx:L15-L131](file:////home/nhat/Documents/DUT/ViTudy/src/components/hud/InviteModal.tsx) | Thành phần nghiệp vụ của phân hệ HUD & Overlays |
| `LeftCreationBar` | `component` | [src/components/hud/LeftCreationBar.tsx:L33-L610](file:////home/nhat/Documents/DUT/ViTudy/src/components/hud/LeftCreationBar.tsx) | Thành phần nghiệp vụ của phân hệ HUD & Overlays |
| `MultiplayerBar` | `component` | [src/components/hud/MultiplayerBar.tsx:L20-L397](file:////home/nhat/Documents/DUT/ViTudy/src/components/hud/MultiplayerBar.tsx) | HUD cộng tác học nhóm thời gian thực: danh sách avatar, thả cảm xúc emoji |
| `StickerEmojiPickerFlyout` | `component` | [src/components/hud/StickerEmojiPickerFlyout.tsx:L35-L718](file:////home/nhat/Documents/DUT/ViTudy/src/components/hud/StickerEmojiPickerFlyout.tsx) | Thành phần nghiệp vụ của phân hệ HUD & Overlays |
| `TopLeftNav` | `component` | [src/components/hud/TopLeftNav.tsx:L28-L397](file:////home/nhat/Documents/DUT/ViTudy/src/components/hud/TopLeftNav.tsx) | HUD góc trên-trái: chuyển đổi bàn học, tìm kiếm tài liệu, đồng bộ góc nhìn |
| `TopRightWallet` | `component` | [src/components/hud/TopRightWallet.tsx:L53-L673](file:////home/nhat/Documents/DUT/ViTudy/src/components/hud/TopRightWallet.tsx) | HUD góc trên-phải: hiển thị số dư ViToken, chuỗi điểm danh streak, chọn model AI |
| `VrFrameOverlay` | `component` | [src/components/hud/VrFrameOverlay.tsx:L5-L15](file:////home/nhat/Documents/DUT/ViTudy/src/components/hud/VrFrameOverlay.tsx) | Khung viền 4 góc và nhãn chế độ "Không gian học 2.5D" phong cách VR HUD |

### Modals & Workflows

| Ký hiệu (Symbol) | Loại (Kind) | Vị trí (File:Lines) | Vai trò chức năng |
|---|---|---|---|
| `BookCoverModal` | `component` | [src/components/modals/BookCoverModal.tsx:L40-L416](file:////home/nhat/Documents/DUT/ViTudy/src/components/modals/BookCoverModal.tsx) | Thành phần nghiệp vụ của phân hệ Modals & Workflows |
| `BookInitialPage` | `type` | [src/components/modals/BookCoverModal.tsx:L18-L22](file:////home/nhat/Documents/DUT/ViTudy/src/components/modals/BookCoverModal.tsx) | Thành phần nghiệp vụ của phân hệ Modals & Workflows |
| `FlashcardModal` | `component` | [src/components/modals/FlashcardModal.tsx:L15-L65](file:////home/nhat/Documents/DUT/ViTudy/src/components/modals/FlashcardModal.tsx) | Thành phần nghiệp vụ của phân hệ Modals & Workflows |
| `FlashcardTab` | `component` | [src/components/modals/study-tools/FlashcardTab.tsx:L26-L310](file:////home/nhat/Documents/DUT/ViTudy/src/components/modals/study-tools/FlashcardTab.tsx) | Thành phần nghiệp vụ của phân hệ Modals & Workflows |
| `FullScreenDocModal` | `component` | [src/components/modals/FullScreenDocModal.tsx:L32-L587](file:////home/nhat/Documents/DUT/ViTudy/src/components/modals/FullScreenDocModal.tsx) | Thành phần nghiệp vụ của phân hệ Modals & Workflows |
| `IntelineModal` | `component` | [src/components/modals/IntelineModal.tsx:L26-L251](file:////home/nhat/Documents/DUT/ViTudy/src/components/modals/IntelineModal.tsx) | Hộp thoại AI hỏi đáp ngữ cảnh sâu Inteline theo từng dòng/trang tài liệu |
| `MobileCompanionView` | `component` | [src/components/mobile/MobileCompanionView.tsx:L12-L116](file:////home/nhat/Documents/DUT/ViTudy/src/components/mobile/MobileCompanionView.tsx) | Giao diện di động rút gọn đồng bộ tài liệu từ máy tính |
| `OcrTab` | `component` | [src/components/modals/study-tools/OcrTab.tsx:L12-L153](file:////home/nhat/Documents/DUT/ViTudy/src/components/modals/study-tools/OcrTab.tsx) | Thành phần nghiệp vụ của phân hệ Modals & Workflows |
| `QuizTab` | `component` | [src/components/modals/study-tools/QuizTab.tsx:L30-L685](file:////home/nhat/Documents/DUT/ViTudy/src/components/modals/study-tools/QuizTab.tsx) | Thành phần nghiệp vụ của phân hệ Modals & Workflows |
| `RoadmapTab` | `component` | [src/components/modals/study-tools/RoadmapTab.tsx:L23-L188](file:////home/nhat/Documents/DUT/ViTudy/src/components/modals/study-tools/RoadmapTab.tsx) | Thành phần nghiệp vụ của phân hệ Modals & Workflows |
| `StorageManagerModal` | `component` | [src/components/modals/StorageManagerModal.tsx:L26-L264](file:////home/nhat/Documents/DUT/ViTudy/src/components/modals/StorageManagerModal.tsx) | Thành phần nghiệp vụ của phân hệ Modals & Workflows |
| `StudyToolsModal` | `component` | [src/components/modals/StudyToolsModal.tsx:L28-L170](file:////home/nhat/Documents/DUT/ViTudy/src/components/modals/StudyToolsModal.tsx) | Bộ công cụ ôn tập toàn diện STudy: TextRank, Cloze Quiz, Flashcard, Roadmap |
| `SummaryTab` | `component` | [src/components/modals/study-tools/SummaryTab.tsx:L17-L221](file:////home/nhat/Documents/DUT/ViTudy/src/components/modals/study-tools/SummaryTab.tsx) | Thành phần nghiệp vụ của phân hệ Modals & Workflows |

### Context & State

| Ký hiệu (Symbol) | Loại (Kind) | Vị trí (File:Lines) | Vai trò chức năng |
|---|---|---|---|
| `AuthContextType` | `type` | [src/context/AuthContext.tsx:L23-L34](file:////home/nhat/Documents/DUT/ViTudy/src/context/AuthContext.tsx) | Thành phần nghiệp vụ của phân hệ Context & State |
| `AuthProvider` | `context` | [src/context/AuthContext.tsx:L38-L296](file:////home/nhat/Documents/DUT/ViTudy/src/context/AuthContext.tsx) | Thành phần nghiệp vụ của phân hệ Context & State |
| `AuthResult` | `type` | [src/context/AuthContext.tsx:L18-L21](file:////home/nhat/Documents/DUT/ViTudy/src/context/AuthContext.tsx) | Thành phần nghiệp vụ của phân hệ Context & State |
| `AuthStatus` | `type` | [src/context/AuthContext.tsx:L9-L9](file:////home/nhat/Documents/DUT/ViTudy/src/context/AuthContext.tsx) | Thành phần nghiệp vụ của phân hệ Context & State |
| `CreationPlacementTemplate` | `type` | [src/context/StudySpaceContext.tsx:L12-L34](file:////home/nhat/Documents/DUT/ViTudy/src/context/StudySpaceContext.tsx) | Thành phần nghiệp vụ của phân hệ Context & State |
| `MyPendingJoinRequest` | `type` | [src/context/SocialPresenceContext.tsx:L39-L46](file:////home/nhat/Documents/DUT/ViTudy/src/context/SocialPresenceContext.tsx) | Thành phần nghiệp vụ của phân hệ Context & State |
| `RoomJoinRequest` | `type` | [src/context/SocialPresenceContext.tsx:L15-L25](file:////home/nhat/Documents/DUT/ViTudy/src/context/SocialPresenceContext.tsx) | Thành phần nghiệp vụ của phân hệ Context & State |
| `RoomJoinResponse` | `type` | [src/context/SocialPresenceContext.tsx:L27-L37](file:////home/nhat/Documents/DUT/ViTudy/src/context/SocialPresenceContext.tsx) | Thành phần nghiệp vụ của phân hệ Context & State |
| `SocialPresenceContextType` | `type` | [src/context/SocialPresenceContext.tsx:L48-L67](file:////home/nhat/Documents/DUT/ViTudy/src/context/SocialPresenceContext.tsx) | Thành phần nghiệp vụ của phân hệ Context & State |
| `SocialPresenceProvider` | `context` | [src/context/SocialPresenceContext.tsx:L71-L466](file:////home/nhat/Documents/DUT/ViTudy/src/context/SocialPresenceContext.tsx) | Thành phần nghiệp vụ của phân hệ Context & State |
| `StudySpaceProvider` | `context` | [src/context/StudySpaceContext.tsx:L165-L2304](file:////home/nhat/Documents/DUT/ViTudy/src/context/StudySpaceContext.tsx) | Provider quản lý toàn bộ state bàn học, tài liệu, toạ độ, nét vẽ, zIndex |
| `useAuth` | `hook` | [src/context/AuthContext.tsx:L302-L308](file:////home/nhat/Documents/DUT/ViTudy/src/context/AuthContext.tsx) | Thành phần nghiệp vụ của phân hệ Context & State |
| `UserProfile` | `type` | [src/context/AuthContext.tsx:L11-L16](file:////home/nhat/Documents/DUT/ViTudy/src/context/AuthContext.tsx) | Thành phần nghiệp vụ của phân hệ Context & State |
| `useSocialPresenceContext` | `hook` | [src/context/SocialPresenceContext.tsx:L468-L471](file:////home/nhat/Documents/DUT/ViTudy/src/context/SocialPresenceContext.tsx) | Thành phần nghiệp vụ của phân hệ Context & State |
| `useStudySpace` | `hook` | [src/context/StudySpaceContext.tsx:L2306-L2312](file:////home/nhat/Documents/DUT/ViTudy/src/context/StudySpaceContext.tsx) | Hook truy cập trạng thái không gian bàn học, camera, danh sách tài liệu |

### Non-AI Engine & Utils

| Ký hiệu (Symbol) | Loại (Kind) | Vị trí (File:Lines) | Vai trò chức năng |
|---|---|---|---|
| `AiProvider` | `type` | [src/lib/aiClient.ts:L15-L15](file:////home/nhat/Documents/DUT/ViTudy/src/lib/aiClient.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `applyDiscordUrlMappings` | `fn` | [src/lib/discord/urlMappings.ts:L5-L39](file:////home/nhat/Documents/DUT/ViTudy/src/lib/discord/urlMappings.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `askAi` | `fn` | [src/lib/aiClient.ts:L373-L419](file:////home/nhat/Documents/DUT/ViTudy/src/lib/aiClient.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `AskAiRequest` | `type` | [src/lib/aiClient.ts:L17-L25](file:////home/nhat/Documents/DUT/ViTudy/src/lib/aiClient.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `AskAiResult` | `type` | [src/lib/aiClient.ts:L27-L31](file:////home/nhat/Documents/DUT/ViTudy/src/lib/aiClient.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `base64UrlDecode` | `fn` | [src/lib/openaiOAuth.ts:L45-L59](file:////home/nhat/Documents/DUT/ViTudy/src/lib/openaiOAuth.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `base64UrlEncode` | `fn` | [src/lib/openaiOAuth.ts:L33-L43](file:////home/nhat/Documents/DUT/ViTudy/src/lib/openaiOAuth.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `buildOpenAiAuthorizeUrl` | `fn` | [src/lib/openaiOAuth.ts:L91-L104](file:////home/nhat/Documents/DUT/ViTudy/src/lib/openaiOAuth.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `ByokProvider` | `type` | [src/lib/byokStore.ts:L1-L1](file:////home/nhat/Documents/DUT/ViTudy/src/lib/byokStore.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `calculateNextReview` | `fn` | [src/lib/sm2.ts:L16-L58](file:////home/nhat/Documents/DUT/ViTudy/src/lib/sm2.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `calculateNextStageProgress` | `fn` | [src/lib/petHelpers.ts:L45-L71](file:////home/nhat/Documents/DUT/ViTudy/src/lib/petHelpers.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `calculatePetStage` | `fn` | [src/lib/petHelpers.ts:L10-L16](file:////home/nhat/Documents/DUT/ViTudy/src/lib/petHelpers.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `callDirectGemini` | `fn` | [src/lib/aiClient.ts:L219-L289](file:////home/nhat/Documents/DUT/ViTudy/src/lib/aiClient.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `callDirectOpenAi` | `fn` | [src/lib/aiClient.ts:L294-L368](file:////home/nhat/Documents/DUT/ViTudy/src/lib/aiClient.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `CHATGPT_MODEL_GROUPS` | `component` | [src/lib/aiClient.ts:L48-L70](file:////home/nhat/Documents/DUT/ViTudy/src/lib/aiClient.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `clearOpenAiOAuthSession` | `fn` | [src/lib/openaiOAuth.ts:L328-L331](file:////home/nhat/Documents/DUT/ViTudy/src/lib/openaiOAuth.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `clearPendingPkce` | `fn` | [src/lib/openaiOAuth.ts:L131-L137](file:////home/nhat/Documents/DUT/ViTudy/src/lib/openaiOAuth.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `clearSupabaseConfig` | `fn` | [src/lib/supabase.ts:L86-L94](file:////home/nhat/Documents/DUT/ViTudy/src/lib/supabase.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `DEFAULT_PET_NAME` | `component` | [src/lib/petHelpers.ts:L8-L8](file:////home/nhat/Documents/DUT/ViTudy/src/lib/petHelpers.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `DiscordAuthResult` | `type` | [src/lib/discord/sdk.ts:L3-L14](file:////home/nhat/Documents/DUT/ViTudy/src/lib/discord/sdk.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `DocumentOutlineNode` | `type` | [src/lib/nonAiEngine.ts:L45-L51](file:////home/nhat/Documents/DUT/ViTudy/src/lib/nonAiEngine.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `ensureValidOpenAiSession` | `fn` | [src/lib/aiClient.ts:L200-L214](file:////home/nhat/Documents/DUT/ViTudy/src/lib/aiClient.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `exchangeOpenAiCode` | `fn` | [src/lib/aiClient.ts:L123-L198](file:////home/nhat/Documents/DUT/ViTudy/src/lib/aiClient.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `extractOpenAiJwtClaims` | `fn` | [src/lib/openaiOAuth.ts:L150-L192](file:////home/nhat/Documents/DUT/ViTudy/src/lib/openaiOAuth.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `extractOutlineAndRoadmap` | `fn` | [src/lib/nonAiEngine.ts:L272-L298](file:////home/nhat/Documents/DUT/ViTudy/src/lib/nonAiEngine.ts) | Thuật toán trích xuất tiêu đề dựng lộ trình học tương tác theo thời gian |
| `Flashcard` | `type` | [src/lib/nonAiEngine.ts:L28-L33](file:////home/nhat/Documents/DUT/ViTudy/src/lib/nonAiEngine.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `formatDateStr` | `fn` | [src/lib/petHelpers.ts:L18-L23](file:////home/nhat/Documents/DUT/ViTudy/src/lib/petHelpers.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `GEMINI_MODELS` | `component` | [src/lib/aiClient.ts:L33-L39](file:////home/nhat/Documents/DUT/ViTudy/src/lib/aiClient.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `generateClozeQuestions` | `fn` | [src/lib/nonAiEngine.ts:L125-L207](file:////home/nhat/Documents/DUT/ViTudy/src/lib/nonAiEngine.ts) | Thuật toán Cloze Deletion tự động đục lỗ từ khoá tạo bài tập trắc nghiệm |
| `generateFlashcardsFromRules` | `fn` | [src/lib/nonAiEngine.ts:L212-L267](file:////home/nhat/Documents/DUT/ViTudy/src/lib/nonAiEngine.ts) | Quy tắc bóc tách câu định nghĩa thành bộ thẻ nhớ Flashcard ôn tập |
| `generatePkcePair` | `fn` | [src/lib/openaiOAuth.ts:L73-L89](file:////home/nhat/Documents/DUT/ViTudy/src/lib/openaiOAuth.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `getAppBasePath` | `fn` | [src/lib/assets.ts:L4-L11](file:////home/nhat/Documents/DUT/ViTudy/src/lib/assets.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `getAppBaseUrl` | `fn` | [src/lib/assets.ts:L13-L20](file:////home/nhat/Documents/DUT/ViTudy/src/lib/assets.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `getAssetPath` | `fn` | [src/lib/assets.ts:L37-L42](file:////home/nhat/Documents/DUT/ViTudy/src/lib/assets.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `getDiscordSdk` | `fn` | [src/lib/discord/sdk.ts:L18-L28](file:////home/nhat/Documents/DUT/ViTudy/src/lib/discord/sdk.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `getIDB` | `fn` | [src/lib/indexeddb.ts:L8-L25](file:////home/nhat/Documents/DUT/ViTudy/src/lib/indexeddb.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `getOpenAiOAuthSession` | `fn` | [src/lib/openaiOAuth.ts:L292-L326](file:////home/nhat/Documents/DUT/ViTudy/src/lib/openaiOAuth.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `getPendingPkce` | `fn` | [src/lib/openaiOAuth.ts:L118-L129](file:////home/nhat/Documents/DUT/ViTudy/src/lib/openaiOAuth.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `getPetAssetUrl` | `fn` | [src/lib/petHelpers.ts:L130-L133](file:////home/nhat/Documents/DUT/ViTudy/src/lib/petHelpers.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `getShareRoomUrl` | `fn` | [src/lib/assets.ts:L22-L29](file:////home/nhat/Documents/DUT/ViTudy/src/lib/assets.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `getSupabase` | `fn` | [src/lib/supabase.ts:L46-L76](file:////home/nhat/Documents/DUT/ViTudy/src/lib/supabase.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `getSupabaseConfig` | `fn` | [src/lib/supabase.ts:L10-L42](file:////home/nhat/Documents/DUT/ViTudy/src/lib/supabase.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `idbDelete` | `fn` | [src/lib/indexeddb.ts:L39-L43](file:////home/nhat/Documents/DUT/ViTudy/src/lib/indexeddb.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `idbGet` | `fn` | [src/lib/indexeddb.ts:L27-L31](file:////home/nhat/Documents/DUT/ViTudy/src/lib/indexeddb.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `idbSet` | `fn` | [src/lib/indexeddb.ts:L33-L37](file:////home/nhat/Documents/DUT/ViTudy/src/lib/indexeddb.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `initDiscord` | `fn` | [src/lib/discord/sdk.ts:L30-L71](file:////home/nhat/Documents/DUT/ViTudy/src/lib/discord/sdk.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `isDiscordActivity` | `fn` | [src/lib/discord/detect.ts:L5-L13](file:////home/nhat/Documents/DUT/ViTudy/src/lib/discord/detect.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `isItemVisible` | `fn` | [src/lib/viewportCulling.ts:L21-L48](file:////home/nhat/Documents/DUT/ViTudy/src/lib/viewportCulling.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `isOpenAiSessionExpired` | `fn` | [src/lib/openaiOAuth.ts:L333-L339](file:////home/nhat/Documents/DUT/ViTudy/src/lib/openaiOAuth.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `isSameDay` | `fn` | [src/lib/petHelpers.ts:L25-L28](file:////home/nhat/Documents/DUT/ViTudy/src/lib/petHelpers.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `isYesterday` | `fn` | [src/lib/petHelpers.ts:L30-L35](file:////home/nhat/Documents/DUT/ViTudy/src/lib/petHelpers.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `ItemBounds` | `type` | [src/lib/viewportCulling.ts:L1-L7](file:////home/nhat/Documents/DUT/ViTudy/src/lib/viewportCulling.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `LEGACY_STREAK_KEY` | `component` | [src/lib/petHelpers.ts:L5-L5](file:////home/nhat/Documents/DUT/ViTudy/src/lib/petHelpers.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `migrateLegacyStorage` | `fn` | [src/lib/storageMigration.ts:L8-L57](file:////home/nhat/Documents/DUT/ViTudy/src/lib/storageMigration.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `navigateToRoom` | `fn` | [src/lib/assets.ts:L31-L35](file:////home/nhat/Documents/DUT/ViTudy/src/lib/assets.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `NextStageProgress` | `type` | [src/lib/petHelpers.ts:L37-L43](file:////home/nhat/Documents/DUT/ViTudy/src/lib/petHelpers.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `normalizeNFC` | `fn` | [src/utils/textNormalization.ts:L5-L8](file:////home/nhat/Documents/DUT/ViTudy/src/utils/textNormalization.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `normalizeNFCAndTrim` | `fn` | [src/utils/textNormalization.ts:L15-L18](file:////home/nhat/Documents/DUT/ViTudy/src/utils/textNormalization.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `normalizeNFCPreserveWhitespace` | `fn` | [src/utils/textNormalization.ts:L10-L13](file:////home/nhat/Documents/DUT/ViTudy/src/utils/textNormalization.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `OPENAI_AUTHORIZE_URL` | `component` | [src/lib/openaiOAuth.ts:L5-L5](file:////home/nhat/Documents/DUT/ViTudy/src/lib/openaiOAuth.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `OPENAI_MODELS` | `component` | [src/lib/aiClient.ts:L41-L46](file:////home/nhat/Documents/DUT/ViTudy/src/lib/aiClient.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `OPENAI_OAUTH_CLIENT_ID` | `component` | [src/lib/openaiOAuth.ts:L3-L3](file:////home/nhat/Documents/DUT/ViTudy/src/lib/openaiOAuth.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `OPENAI_OAUTH_REDIRECT_URI` | `component` | [src/lib/openaiOAuth.ts:L4-L4](file:////home/nhat/Documents/DUT/ViTudy/src/lib/openaiOAuth.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `OPENAI_TOKEN_URL` | `component` | [src/lib/openaiOAuth.ts:L6-L6](file:////home/nhat/Documents/DUT/ViTudy/src/lib/openaiOAuth.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `OpenAiOAuthSession` | `type` | [src/lib/openaiOAuth.ts:L11-L19](file:////home/nhat/Documents/DUT/ViTudy/src/lib/openaiOAuth.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `PaginatedLeaf` | `type` | [src/utils/pagination.ts:L7-L15](file:////home/nhat/Documents/DUT/ViTudy/src/utils/pagination.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `paginateDocument` | `fn` | [src/utils/pagination.ts:L167-L288](file:////home/nhat/Documents/DUT/ViTudy/src/utils/pagination.ts) | Động cơ phân trang chính xác theo chiều cao trang, chống cắt cụt công thức |
| `ParsedOpenAiInput` | `type` | [src/lib/openaiOAuth.ts:L27-L31](file:////home/nhat/Documents/DUT/ViTudy/src/lib/openaiOAuth.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `parseOpenAiCallbackInput` | `fn` | [src/lib/openaiOAuth.ts:L194-L275](file:////home/nhat/Documents/DUT/ViTudy/src/lib/openaiOAuth.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `PendingPkceState` | `type` | [src/lib/openaiOAuth.ts:L21-L25](file:////home/nhat/Documents/DUT/ViTudy/src/lib/openaiOAuth.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `PET_STORAGE_KEY` | `component` | [src/lib/petHelpers.ts:L4-L4](file:////home/nhat/Documents/DUT/ViTudy/src/lib/petHelpers.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `Point` | `type` | [src/utils/smartShape.ts:L12-L15](file:////home/nhat/Documents/DUT/ViTudy/src/utils/smartShape.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `PROVIDER_MODELS` | `component` | [src/lib/aiClient.ts:L72-L85](file:////home/nhat/Documents/DUT/ViTudy/src/lib/aiClient.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `QuizQuestion` | `type` | [src/lib/nonAiEngine.ts:L19-L26](file:////home/nhat/Documents/DUT/ViTudy/src/lib/nonAiEngine.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `recognizeSmartShape` | `fn` | [src/utils/smartShape.ts:L17-L175](file:////home/nhat/Documents/DUT/ViTudy/src/utils/smartShape.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `refreshOpenAiSession` | `fn` | [src/lib/aiClient.ts:L87-L121](file:////home/nhat/Documents/DUT/ViTudy/src/lib/aiClient.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `resolvePetState` | `fn` | [src/lib/petHelpers.ts:L73-L128](file:////home/nhat/Documents/DUT/ViTudy/src/lib/petHelpers.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `ReviewQuality` | `type` | [src/lib/sm2.ts:L8-L8](file:////home/nhat/Documents/DUT/ViTudy/src/lib/sm2.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `RoadmapStep` | `type` | [src/lib/nonAiEngine.ts:L35-L43](file:////home/nhat/Documents/DUT/ViTudy/src/lib/nonAiEngine.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `saveOpenAiOAuthSession` | `fn` | [src/lib/openaiOAuth.ts:L277-L290](file:////home/nhat/Documents/DUT/ViTudy/src/lib/openaiOAuth.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `savePendingPkce` | `fn` | [src/lib/openaiOAuth.ts:L106-L116](file:////home/nhat/Documents/DUT/ViTudy/src/lib/openaiOAuth.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `saveSupabaseConfig` | `fn` | [src/lib/supabase.ts:L78-L84](file:////home/nhat/Documents/DUT/ViTudy/src/lib/supabase.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `setDiscordPresence` | `fn` | [src/lib/discord/sdk.ts:L75-L97](file:////home/nhat/Documents/DUT/ViTudy/src/lib/discord/sdk.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `SM2Card` | `type` | [src/lib/sm2.ts:L1-L6](file:////home/nhat/Documents/DUT/ViTudy/src/lib/sm2.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `splitSentences` | `fn` | [src/lib/nonAiEngine.ts:L56-L62](file:////home/nhat/Documents/DUT/ViTudy/src/lib/nonAiEngine.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `startOpenAiPkceLogin` | `fn` | [src/lib/openaiOAuth.ts:L139-L148](file:////home/nhat/Documents/DUT/ViTudy/src/lib/openaiOAuth.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `summarizeWithTextRank` | `fn` | [src/lib/nonAiEngine.ts:L79-L120](file:////home/nhat/Documents/DUT/ViTudy/src/lib/nonAiEngine.ts) | Thuật toán TextRank & TF-IDF trích xuất tóm tắt nội dung không cần AI |
| `testAiConnection` | `fn` | [src/lib/aiClient.ts:L424-L589](file:////home/nhat/Documents/DUT/ViTudy/src/lib/aiClient.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `ViewportTransform` | `type` | [src/lib/viewportCulling.ts:L9-L15](file:////home/nhat/Documents/DUT/ViTudy/src/lib/viewportCulling.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |
| `VITUDY_STREAK_KEY` | `component` | [src/lib/petHelpers.ts:L6-L6](file:////home/nhat/Documents/DUT/ViTudy/src/lib/petHelpers.ts) | Thành phần nghiệp vụ của phân hệ Non-AI Engine & Utils |

### Types & Data

| Ký hiệu (Symbol) | Loại (Kind) | Vị trí (File:Lines) | Vai trò chức năng |
|---|---|---|---|
| `AboutPage` | `component` | [src/app/about/page.tsx:L9-L181](file:////home/nhat/Documents/DUT/ViTudy/src/app/about/page.tsx) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `AccountSettings` | `component` | [src/components/profile/AccountSettings.tsx:L30-L493](file:////home/nhat/Documents/DUT/ViTudy/src/components/profile/AccountSettings.tsx) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `ActiveToolType` | `type` | [src/types/studyspace.ts:L98-L105](file:////home/nhat/Documents/DUT/ViTudy/src/types/studyspace.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `AuthCallbackPage` | `component` | [src/app/auth/callback/page.tsx:L8-L98](file:////home/nhat/Documents/DUT/ViTudy/src/app/auth/callback/page.tsx) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `AuthForm` | `component` | [src/components/auth/AuthForm.tsx:L15-L139](file:////home/nhat/Documents/DUT/ViTudy/src/components/auth/AuthForm.tsx) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `AuthPage` | `component` | [src/app/auth/page.tsx:L12-L143](file:////home/nhat/Documents/DUT/ViTudy/src/app/auth/page.tsx) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `CanvasTransform` | `type` | [src/types/studyspace.ts:L116-L121](file:////home/nhat/Documents/DUT/ViTudy/src/types/studyspace.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `createDemoStudySpace` | `fn` | [src/data/demoSpace.ts:L3-L97](file:////home/nhat/Documents/DUT/ViTudy/src/data/demoSpace.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `DashboardPage` | `component` | [src/app/dashboard/page.tsx:L13-L229](file:////home/nhat/Documents/DUT/ViTudy/src/app/dashboard/page.tsx) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `Database` | `type` | [src/types/database.types.ts:L9-L321](file:////home/nhat/Documents/DUT/ViTudy/src/types/database.types.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `DayStudyTime` | `type` | [src/services/StatsService.ts:L3-L7](file:////home/nhat/Documents/DUT/ViTudy/src/services/StatsService.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `DeleteAccount` | `component` | [src/components/profile/DeleteAccount.tsx:L23-L262](file:////home/nhat/Documents/DUT/ViTudy/src/components/profile/DeleteAccount.tsx) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `DeskAction` | `type` | [src/hooks/useRealtimeMultiplayer.ts:L20-L31](file:////home/nhat/Documents/DUT/ViTudy/src/hooks/useRealtimeMultiplayer.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `DeskInviteNotification` | `type` | [src/services/SocialFriendService.ts:L21-L29](file:////home/nhat/Documents/DUT/ViTudy/src/services/SocialFriendService.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `DeskItem` | `type` | [src/types/studyspace.ts:L37-L73](file:////home/nhat/Documents/DUT/ViTudy/src/types/studyspace.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `deskItemToRow` | `fn` | [src/services/StudySpaceService.ts:L8-L44](file:////home/nhat/Documents/DUT/ViTudy/src/services/StudySpaceService.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `DrawingStroke` | `type` | [src/types/studyspace.ts:L107-L114](file:////home/nhat/Documents/DUT/ViTudy/src/types/studyspace.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `EMOJI_CATEGORIES` | `component` | [src/data/stickersAndEmojis.ts:L65-L412](file:////home/nhat/Documents/DUT/ViTudy/src/data/stickersAndEmojis.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `EmojiCategory` | `type` | [src/data/stickersAndEmojis.ts:L13-L18](file:////home/nhat/Documents/DUT/ViTudy/src/data/stickersAndEmojis.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `ExamAttemptPayload` | `type` | [src/services/ActivityService.ts:L3-L8](file:////home/nhat/Documents/DUT/ViTudy/src/services/ActivityService.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `ExamQuestion` | `type` | [src/types/studyspace.ts:L17-L24](file:////home/nhat/Documents/DUT/ViTudy/src/types/studyspace.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `ExamSheetData` | `type` | [src/types/studyspace.ts:L26-L35](file:////home/nhat/Documents/DUT/ViTudy/src/types/studyspace.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `ExamStats` | `type` | [src/services/StatsService.ts:L9-L12](file:////home/nhat/Documents/DUT/ViTudy/src/services/StatsService.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `FaqPage` | `component` | [src/app/faq/page.tsx:L664-L676](file:////home/nhat/Documents/DUT/ViTudy/src/app/faq/page.tsx) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `FeatureGrid` | `component` | [src/components/landing/FeatureGrid.tsx:L75-L160](file:////home/nhat/Documents/DUT/ViTudy/src/components/landing/FeatureGrid.tsx) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `FlashcardReview` | `type` | [src/services/FlashcardService.ts:L4-L16](file:////home/nhat/Documents/DUT/ViTudy/src/services/FlashcardService.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `generateCardHash` | `fn` | [src/services/FlashcardService.ts:L18-L27](file:////home/nhat/Documents/DUT/ViTudy/src/services/FlashcardService.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `getDocAccessLog` | `fn` | [src/hooks/useStorageManager.ts:L46-L54](file:////home/nhat/Documents/DUT/ViTudy/src/hooks/useStorageManager.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `GuestBanner` | `component` | [src/components/auth/GuestBanner.tsx:L12-L54](file:////home/nhat/Documents/DUT/ViTudy/src/components/auth/GuestBanner.tsx) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `HeroSection` | `component` | [src/components/landing/HeroSection.tsx:L52-L238](file:////home/nhat/Documents/DUT/ViTudy/src/components/landing/HeroSection.tsx) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `HomePage` | `component` | [src/components/home/HomePage.tsx:L48-L1645](file:////home/nhat/Documents/DUT/ViTudy/src/components/home/HomePage.tsx) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `HostApprovalModal` | `component` | [src/components/social/HostApprovalModal.tsx:L14-L177](file:////home/nhat/Documents/DUT/ViTudy/src/components/social/HostApprovalModal.tsx) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `INITIAL_SPACES` | `component` | [src/data/mockSpaces.ts:L3-L332](file:////home/nhat/Documents/DUT/ViTudy/src/data/mockSpaces.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `IntelineThread` | `type` | [src/types/studyspace.ts:L75-L85](file:////home/nhat/Documents/DUT/ViTudy/src/types/studyspace.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `ItemType` | `type` | [src/types/studyspace.ts:L1-L1](file:////home/nhat/Documents/DUT/ViTudy/src/types/studyspace.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `Json` | `type` | [src/types/database.types.ts:L1-L7](file:////home/nhat/Documents/DUT/ViTudy/src/types/database.types.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `LandingPage` | `component` | [src/components/landing/LandingPage.tsx:L16-L81](file:////home/nhat/Documents/DUT/ViTudy/src/components/landing/LandingPage.tsx) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `loadStoredPetState` | `fn` | [src/hooks/usePetMascot.ts:L30-L56](file:////home/nhat/Documents/DUT/ViTudy/src/hooks/usePetMascot.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `MathRenderer` | `component` | [src/components/common/MathRenderer.tsx:L105-L235](file:////home/nhat/Documents/DUT/ViTudy/src/components/common/MathRenderer.tsx) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `metadata` | `const` | [src/app/layout.tsx:L36-L47](file:////home/nhat/Documents/DUT/ViTudy/src/app/layout.tsx) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `MigrationDialog` | `component` | [src/components/auth/MigrationDialog.tsx:L10-L110](file:////home/nhat/Documents/DUT/ViTudy/src/components/auth/MigrationDialog.tsx) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `MigrationResult` | `type` | [src/services/SyncService.ts:L5-L9](file:////home/nhat/Documents/DUT/ViTudy/src/services/SyncService.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `OAuthButtons` | `component` | [src/components/auth/OAuthButtons.tsx:L10-L64](file:////home/nhat/Documents/DUT/ViTudy/src/components/auth/OAuthButtons.tsx) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `OfflineOp` | `type` | [src/services/OfflineQueue.ts:L4-L10](file:////home/nhat/Documents/DUT/ViTudy/src/services/OfflineQueue.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `OnboardingTour` | `component` | [src/components/onboarding/OnboardingTour.tsx:L56-L151](file:////home/nhat/Documents/DUT/ViTudy/src/components/onboarding/OnboardingTour.tsx) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `PageContent` | `type` | [src/types/studyspace.ts:L3-L15](file:////home/nhat/Documents/DUT/ViTudy/src/types/studyspace.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `ParsedPage` | `type` | [src/services/PdfParserService.ts:L5-L11](file:////home/nhat/Documents/DUT/ViTudy/src/services/PdfParserService.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `parsePdfFile` | `fn` | [src/services/PdfParserService.ts:L17-L94](file:////home/nhat/Documents/DUT/ViTudy/src/services/PdfParserService.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `PeerUser` | `type` | [src/hooks/useRealtimeMultiplayer.ts:L8-L18](file:////home/nhat/Documents/DUT/ViTudy/src/hooks/useRealtimeMultiplayer.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `PendingApprovalModal` | `component` | [src/components/social/PendingApprovalModal.tsx:L13-L139](file:////home/nhat/Documents/DUT/ViTudy/src/components/social/PendingApprovalModal.tsx) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `PET_STAGES` | `component` | [src/types/pet.ts:L14-L65](file:////home/nhat/Documents/DUT/ViTudy/src/types/pet.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `PetMascotModal` | `component` | [src/components/pet/PetMascotModal.tsx:L29-L490](file:////home/nhat/Documents/DUT/ViTudy/src/components/pet/PetMascotModal.tsx) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `PetStage` | `type` | [src/types/pet.ts:L1-L1](file:////home/nhat/Documents/DUT/ViTudy/src/types/pet.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `PetStageInfo` | `type` | [src/types/pet.ts:L3-L12](file:////home/nhat/Documents/DUT/ViTudy/src/types/pet.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `PetState` | `type` | [src/types/pet.ts:L67-L75](file:////home/nhat/Documents/DUT/ViTudy/src/types/pet.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `PomodoroPhase` | `type` | [src/hooks/usePomodoro.ts:L5-L5](file:////home/nhat/Documents/DUT/ViTudy/src/hooks/usePomodoro.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `PricingSection` | `component` | [src/components/landing/PricingSection.tsx:L11-L161](file:////home/nhat/Documents/DUT/ViTudy/src/components/landing/PricingSection.tsx) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `PrivacyPage` | `component` | [src/app/privacy/page.tsx:L8-L99](file:////home/nhat/Documents/DUT/ViTudy/src/app/privacy/page.tsx) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `ProfileHeader` | `component` | [src/components/profile/ProfileHeader.tsx:L13-L146](file:////home/nhat/Documents/DUT/ViTudy/src/components/profile/ProfileHeader.tsx) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `ProfilePage` | `component` | [src/app/profile/page.tsx:L161-L167](file:////home/nhat/Documents/DUT/ViTudy/src/app/profile/page.tsx) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `RecentBuddy` | `type` | [src/services/SocialFriendService.ts:L7-L17](file:////home/nhat/Documents/DUT/ViTudy/src/services/SocialFriendService.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `recordDocAccess` | `fn` | [src/hooks/useStorageManager.ts:L56-L63](file:////home/nhat/Documents/DUT/ViTudy/src/hooks/useStorageManager.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `RootLayout` | `component` | [src/app/layout.tsx:L49-L79](file:////home/nhat/Documents/DUT/ViTudy/src/app/layout.tsx) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `RotateTwoWay` | `component` | [src/components/icons/RotateTwoWay.tsx:L11-L29](file:////home/nhat/Documents/DUT/ViTudy/src/components/icons/RotateTwoWay.tsx) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `rowToDeskItem` | `fn` | [src/services/StudySpaceService.ts:L46-L77](file:////home/nhat/Documents/DUT/ViTudy/src/services/StudySpaceService.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `savePetState` | `fn` | [src/hooks/usePetMascot.ts:L58-L73](file:////home/nhat/Documents/DUT/ViTudy/src/hooks/usePetMascot.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `SiteFooter` | `component` | [src/components/common/SiteFooter.tsx:L19-L71](file:////home/nhat/Documents/DUT/ViTudy/src/components/common/SiteFooter.tsx) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `SKIN_TONES` | `component` | [src/data/stickersAndEmojis.ts:L42-L49](file:////home/nhat/Documents/DUT/ViTudy/src/data/stickersAndEmojis.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `SocialFriend` | `type` | [src/services/SocialFriendService.ts:L19-L19](file:////home/nhat/Documents/DUT/ViTudy/src/services/SocialFriendService.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `STICKER_CATEGORIES` | `component` | [src/data/stickersAndEmojis.ts:L417-L608](file:////home/nhat/Documents/DUT/ViTudy/src/data/stickersAndEmojis.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `StickerCategory` | `type` | [src/data/stickersAndEmojis.ts:L20-L25](file:////home/nhat/Documents/DUT/ViTudy/src/data/stickersAndEmojis.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `StickerPickerItem` | `type` | [src/data/stickersAndEmojis.ts:L1-L11](file:////home/nhat/Documents/DUT/ViTudy/src/data/stickersAndEmojis.ts) | Thành phần nghiệp vụ của phân hệ HUD & Overlays |
| `StorageItemInfo` | `type` | [src/hooks/useStorageManager.ts:L7-L18](file:////home/nhat/Documents/DUT/ViTudy/src/hooks/useStorageManager.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `StorageUsage` | `type` | [src/hooks/useStorageManager.ts:L20-L26](file:////home/nhat/Documents/DUT/ViTudy/src/hooks/useStorageManager.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `StreakCalendar` | `component` | [src/components/dashboard/StreakCalendar.tsx:L18-L108](file:////home/nhat/Documents/DUT/ViTudy/src/components/dashboard/StreakCalendar.tsx) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `StudySpace` | `type` | [src/types/studyspace.ts:L87-L96](file:////home/nhat/Documents/DUT/ViTudy/src/types/studyspace.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `StudySpacePage` | `component` | [src/app/page.tsx:L89-L95](file:////home/nhat/Documents/DUT/ViTudy/src/app/page.tsx) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `StudyStats` | `component` | [src/components/dashboard/StudyStats.tsx:L14-L189](file:////home/nhat/Documents/DUT/ViTudy/src/components/dashboard/StudyStats.tsx) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `TermsPage` | `component` | [src/app/terms/page.tsx:L8-L83](file:////home/nhat/Documents/DUT/ViTudy/src/app/terms/page.tsx) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `toTwemojiUrl` | `fn` | [src/data/stickersAndEmojis.ts:L30-L40](file:////home/nhat/Documents/DUT/ViTudy/src/data/stickersAndEmojis.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `TourStep` | `component` | [src/components/onboarding/TourStep.tsx:L19-L66](file:////home/nhat/Documents/DUT/ViTudy/src/components/onboarding/TourStep.tsx) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `TourStepConfig` | `type` | [src/components/onboarding/TourStep.tsx:L4-L9](file:////home/nhat/Documents/DUT/ViTudy/src/components/onboarding/TourStep.tsx) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `useDeskItemInteraction` | `hook` | [src/hooks/useDeskItemInteraction.ts:L16-L180](file:////home/nhat/Documents/DUT/ViTudy/src/hooks/useDeskItemInteraction.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `useDiscordActivity` | `hook` | [src/hooks/useDiscordActivity.ts:L22-L114](file:////home/nhat/Documents/DUT/ViTudy/src/hooks/useDiscordActivity.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `UseDiscordActivityResult` | `type` | [src/hooks/useDiscordActivity.ts:L8-L20](file:////home/nhat/Documents/DUT/ViTudy/src/hooks/useDiscordActivity.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `usePetMascot` | `hook` | [src/hooks/usePetMascot.ts:L75-L214](file:////home/nhat/Documents/DUT/ViTudy/src/hooks/usePetMascot.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `UsePetMascotResult` | `type` | [src/hooks/usePetMascot.ts:L19-L28](file:////home/nhat/Documents/DUT/ViTudy/src/hooks/usePetMascot.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `usePomodoro` | `hook` | [src/hooks/usePomodoro.ts:L23-L83](file:////home/nhat/Documents/DUT/ViTudy/src/hooks/usePomodoro.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `UsePomodoroOptions` | `type` | [src/hooks/usePomodoro.ts:L7-L11](file:////home/nhat/Documents/DUT/ViTudy/src/hooks/usePomodoro.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `UsePomodoroResult` | `type` | [src/hooks/usePomodoro.ts:L13-L21](file:////home/nhat/Documents/DUT/ViTudy/src/hooks/usePomodoro.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `useRealtimeMultiplayer` | `hook` | [src/hooks/useRealtimeMultiplayer.ts:L58-L497](file:////home/nhat/Documents/DUT/ViTudy/src/hooks/useRealtimeMultiplayer.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `UseRealtimeMultiplayerOptions` | `type` | [src/hooks/useRealtimeMultiplayer.ts:L49-L56](file:////home/nhat/Documents/DUT/ViTudy/src/hooks/useRealtimeMultiplayer.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `useSocialPresence` | `hook` | [src/hooks/useSocialPresence.ts:L10-L212](file:////home/nhat/Documents/DUT/ViTudy/src/hooks/useSocialPresence.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `useStorageManager` | `hook` | [src/hooks/useStorageManager.ts:L65-L216](file:////home/nhat/Documents/DUT/ViTudy/src/hooks/useStorageManager.ts) | Thành phần nghiệp vụ của phân hệ Types & Data |
| `viewport` | `const` | [src/app/layout.tsx:L8-L13](file:////home/nhat/Documents/DUT/ViTudy/src/app/layout.tsx) | Thành phần nghiệp vụ của phân hệ Types & Data |

