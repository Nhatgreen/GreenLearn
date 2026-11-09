import { ExamQuestion } from '@/types/studyspace';

export interface MarketItem {
  id: string;
  title: string;
  author: string;
  aiScore: number;
  price: number;
  type: 'book' | 'paper' | 'exam';
  category: 'math' | 'ai_ml' | 'cs' | 'software' | 'data';
  date: string; // DD/MM/YYYY
  summary: string;
  previewText: string;
  purchased?: boolean;
  pages?: { title?: string; text: string }[];
  examQuestions?: ExamQuestion[];
  pageCount?: number;
  downloadsCount?: number;
  updatedDate?: string;
  isAuthorVerified?: boolean;
  aiReviewCount?: number;
}

export const INITIAL_MARKET_ITEMS: MarketItem[] = [
  // 1. Math - Book
  {
    id: 'mkt-01',
    title: 'Tuyển tập 100 Câu Hỏi Tối Ưu Giải Tích & Đại Số Tuyến Tính',
    author: 'Lê Hoàng (Khoa CNTT)',
    aiScore: 95,
    price: 50,
    type: 'book',
    category: 'math',
    date: '05/11/2026',
    summary: 'Trọng tâm giải tích hàm nhiều biến, đạo hàm ma trận, ứng dụng trong lan truyền ngược mạng nơ-ron.',
    previewText: 'CHƯƠNG 1: ĐẠO HÀM MA TRẬN & TỐI ƯU HOÁ KHÔNG RÀNG BUỘC\n1.1 Khái niệm vi phân toàn phần trong Rn.\n1.2 Ma trận Hessian và quy tắc kiểm tra cực trị địa phương: Điểm cực tiểu ngặt khi H(x*) xác định dương.',
    pages: [
      { title: 'Chương 1: Đạo hàm Ma trận', text: 'Nền tảng vi phân ma trận trong học máy và tối ưu hóa.' },
      { title: 'Chương 2: Ma trận Hessian', text: 'Kiểm tra độ cong của hàm mất mát qua ma trận đạo hàm bậc hai.' },
      { title: 'Chương 3: Nhân tử Lagrange', text: 'Tối ưu hóa có ràng buộc đẳng thức và bất đẳng thức KKT.' },
      { title: 'Chương 4: Phân rã SVD', text: 'Singular Value Decomposition và giảm chiều dữ liệu PCA.' },
      { title: 'Chương 5: Gradient Descent', text: 'Các biến thể SGD, Momentum, Adam và bài toán bước nhảy.' },
      { title: 'Chương 6: Ứng dụng Học Sâu', text: 'Lan truyền ngược Backpropagation qua đồ thị tính toán đạo hàm.' }
    ]
  },

  // 2. Data - Paper
  {
    id: 'mkt-02',
    title: 'Sổ Tay Tóm Tắt Xác Suất Thống Kê & Phân Tích Dữ Liệu',
    author: 'Trần Minh Đức',
    aiScore: 89,
    price: 15,
    type: 'paper',
    category: 'data',
    date: '04/11/2026',
    summary: 'Các phân phối xác suất quan trọng (Gaussian, Poisson, Bernoulli), định lý giới hạn trung tâm, kiểm định giả thuyết.',
    previewText: 'PHẦN 1: CÁC PHÂN PHỐI XÁC SUẤT CỐT LÕI\n- Phân phối Chuẩn: N(mu, sigma^2).\n- Định lý Giới hạn Trung tâm: Tổng các biến ngẫu nhiên độc lập hội tụ về phân phối chuẩn.',
    pages: [
      { title: 'Tóm tắt Xác suất Thống kê', text: 'Toàn bộ công thức phân phối xác suất, kỳ vọng E(X), phương sai Var(X), khoảng tin cậy và p-value.' }
    ]
  },

  // 3. AI/ML - Exam
  {
    id: 'mkt-03',
    title: 'Đề Thi Thử Trắc Nghiệm Học Máy Căn Bản & Phân Loại',
    author: 'TS. Nguyễn Văn Hùng',
    aiScore: 96,
    price: 30,
    type: 'exam',
    category: 'ai_ml',
    date: '03/11/2026',
    summary: 'Bộ 10 câu hỏi trắc nghiệm chuẩn hóa về hồi quy tuyến tính, logistic regression, độ đo Precision/Recall và F1-score.',
    previewText: 'Bộ đề thi kiểm tra kiến thức cốt lõi trước kỳ thi giữa kỳ môn Machine Learning, có giải thích đáp án chi tiết.',
    examQuestions: [
      {
        id: 'q1',
        question: 'Độ đo nào phù hợp nhất khi đánh giá mô hình phát hiện gian lận ngân hàng có tập dữ liệu mất cân bằng cao?',
        options: ['Accuracy (Độ chính xác toàn phần)', 'F1-Score hoặc PR-AUC', 'MSE (Sai số toàn phương)', 'R2 Score'],
        correctAnswer: 1,
        explanation: 'Dữ liệu mất cân bằng nghiêm trọng khiến Accuracy bị sai lệch, cần dùng F1-score hoặc PR-AUC.'
      },
      {
        id: 'q2',
        question: 'Kỹ thuật Regularization L1 (Lasso) có đặc điểm nổi bật nào so với L2 (Ridge)?',
        options: ['Làm nhỏ đồng đều mọi trọng số', 'Triệt tiêu trọng số về 0 giúp chọn lọc đặc trưng (Sparsity)', 'Làm tăng nguy cơ Overfitting', 'Không phụ thuộc siêu tham số lambda'],
        correctAnswer: 1,
        explanation: 'L1 regularization tạo ra các trọng số bằng đúng 0, hữu ích cho việc lọc biến và nén mô hình.'
      },
      {
        id: 'q3',
        question: 'Hàm kích hoạt nào thường được sử dụng ở tầng đầu ra của bài toán phân loại đa lớp (Multi-class)?',
        options: ['Sigmoid', 'ReLU', 'Softmax', 'Tanh'],
        correctAnswer: 2,
        explanation: 'Softmax chuyển đổi vector logit thành phân phối xác suất có tổng bằng 1 cho các lớp.'
      }
    ]
  },

  // 4. CS - Book
  {
    id: 'mkt-04',
    title: 'Giáo Trình Cấu Trúc Dữ Liệu & Giải Thuật Toàn Tập',
    author: 'ThS. Vũ Quang Minh',
    aiScore: 92,
    price: 45,
    type: 'book',
    category: 'cs',
    date: '02/11/2026',
    summary: 'Từ mảng, danh sách liên kết, cây nhị phân tìm kiếm đến đồ thị Dijkstra, Floyd-Warshall và quy hoạch động.',
    previewText: 'CHƯƠNG 1: ĐỘ PHỨC TẠP THUẬT TOÁN BIG-O\nPhân tích thời gian chạy T(n) và bộ nhớ phụ O(1), O(n), O(n log n).',
    pages: [
      { title: 'Chương 1: Big-O & Độ phức tạp', text: 'Khái niệm chặn trên Big-O, chặn dưới Omega và độ phức tạp trung bình.' },
      { title: 'Chương 2: Danh sách & Ngăn xếp', text: 'Cài đặt Linked List, Stack, Queue và hàng đợi ưu tiên.' },
      { title: 'Chương 3: Cây nhị phân & AVL', text: 'Cây tìm kiếm nhị phân BST và thuật toán tự cân bằng AVL.' },
      { title: 'Chương 4: Đồ thị & DFS/BFS', text: 'Biểu diễn ma trận kề, danh sách kề và duyệt đồ thị.' },
      { title: 'Chương 5: Đường đi ngắn nhất', text: 'Thuật toán Dijkstra với Heap và Bellman-Ford xử lý trọng số âm.' },
      { title: 'Chương 6: Quy hoạch động', text: 'Nguyên lý tối ưu con, bài toán Knapsack và dãy con tăng dài nhất.' }
    ]
  },

  // 5. Software - Paper
  {
    id: 'mkt-05',
    title: 'Cheat Sheet Design Patterns & Nguyên Lý SOLID',
    author: 'Đặng Tuấn Kiệt (Senior Dev)',
    aiScore: 94,
    price: 15,
    type: 'paper',
    category: 'software',
    date: '01/11/2026',
    summary: 'Tóm lược 23 mẫu thiết kế GoF và 5 nguyên lý SOLID trên 1 trang trực quan, dễ áp dụng vào phỏng vấn.',
    previewText: 'SOLID PRINCIPLES:\n- S: Single Responsibility (Một lý do thay đổi)\n- O: Open/Closed (Mở rộng, đóng sửa đổi)\n- L: Liskov Substitution\n- I: Interface Segregation\n- D: Dependency Inversion',
    pages: [
      { title: 'SOLID & GoF Design Patterns', text: 'Tóm tắt Singleton, Factory, Observer, Strategy, Decorator và nguyên lý thiết kế sạch.' }
    ]
  },

  // 6. AI/ML - Book
  {
    id: 'mkt-06',
    title: 'Nhập Môn Học Sâu & Thị Giác Máy Tính (CNNs)',
    author: 'Lab Trí Tuệ Nhân Tạo ViTudy',
    aiScore: 97,
    price: 50,
    type: 'book',
    category: 'ai_ml',
    date: '31/10/2026',
    summary: 'Kiến trúc mạng tích chập từ LeNet, AlexNet, VGG đến ResNet với kết nối tắt Skip Connection.',
    previewText: 'CHƯƠNG 1: TÍCH CHẬP 2D & LỌC TÍN HIỆU\nCách hoạt động của Kernel, Stride, Padding và lớp Pooling giảm số chiều.',
    pages: [
      { title: 'Chương 1: Phép tích chập', text: 'Toán học của Convolution và trích xuất đặc trưng biên cạnh.' },
      { title: 'Chương 2: Kiến trúc AlexNet & VGG', text: 'Sự bùng nổ của GPU và xu hướng mạng sâu nhiều tầng.' },
      { title: 'Chương 3: ResNet & Skip Connections', text: 'Giải quyết triệt để vấn đề triệt tiêu Gradient trong mạng cực sâu.' },
      { title: 'Chương 4: Phân đoạn ảnh U-Net', text: 'Kiến trúc Encoder-Decoder ứng dụng trong y tế và xe tự hành.' },
      { title: 'Chương 5: Object Detection YOLO', text: 'Nhận diện vật thể theo thời gian thực một giai đoạn duy nhất.' }
    ]
  },

  // 7. Math - Exam
  {
    id: 'mkt-07',
    title: 'Đề Thi Thử Giải Tích 2: Tích Phân Kép & Đường Mặt',
    author: 'Khoa Toán Ứng Dụng',
    aiScore: 88,
    price: 20,
    type: 'exam',
    category: 'math',
    date: '30/10/2026',
    summary: 'Kiểm tra kỹ năng đổi biến trong tọa độ cực, công thức Green, Gauss-Ostrogradsky và Stokes.',
    previewText: '10 câu hỏi trắc nghiệm rèn luyện phương pháp tính tích phân bội hai, bội ba và ứng dụng cơ học.',
    examQuestions: [
      {
        id: 'qm1',
        question: 'Công thức Green liên hệ tích phân đường loại hai với tích phân kép trên miền đóng D có biên C là gì?',
        options: ['∬ (dQ/dx - dP/dy) dxdy', '∬ (dP/dx + dQ/dy) dxdy', '∬ (dQ/dy - dP/dx) dxdy', '∬ (P*Q) dxdy'],
        correctAnswer: 0,
        explanation: 'Định lý Green: ∮ (Pdx + Qdy) = ∬ (dQ/dx - dP/dy) dxdy.'
      },
      {
        id: 'qm2',
        question: 'Khi đổi biến tích phân kép sang tọa độ cực x = r cos(phi), y = r sin(phi), định thức Jacobi J bằng bao nhiêu?',
        options: ['1', 'r', 'r^2', 'cos(phi)'],
        correctAnswer: 1,
        explanation: 'Jacobian của phép biến đổi tọa độ cực là J = r.'
      }
    ]
  },

  // 8. Software - Book
  {
    id: 'mkt-08',
    title: 'Lập Trình Web Hiện Đại với React & Next.js App Router',
    author: 'Phạm Nhật Huy',
    aiScore: 91,
    price: 40,
    type: 'book',
    category: 'software',
    date: '29/10/2026',
    summary: 'Chuyên sâu Server Components, Streaming SSR, Suspense và quản lý state không gian học 2.5D.',
    previewText: 'CHƯƠNG 1: SERVER VS CLIENT COMPONENTS\nTối ưu bundle size bằng cách giữ logic nặng trên Node.js runtime.',
    pages: [
      { title: 'Chương 1: Kiến trúc App Router', text: 'Cơ chế định tuyến dạng file và cấu trúc layout lồng nhau.' },
      { title: 'Chương 2: Server Components', text: 'Giảm tải JavaScript gửi về trình duyệt và bảo mật secrets.' },
      { title: 'Chương 3: Suspense & Streaming', text: 'Hiển thị giao diện tức thì với HTTP streaming chunked.' },
      { title: 'Chương 4: Tối ưu hiệu năng 60fps', text: 'Loại bỏ re-render thừa với useMemo, useCallback và canvas DOM.' },
      { title: 'Chương 5: Triển khai Full-stack', text: 'Tích hợp Edge Functions, Database listeners và WebSockets.' }
    ]
  },

  // 9. CS - Paper
  {
    id: 'mkt-09',
    title: 'Bảng Tra Cứu Câu Lệnh Git & Quy Trình GitFlow',
    author: 'Lê Thanh Bình',
    aiScore: 86,
    price: 10,
    type: 'paper',
    category: 'cs',
    date: '28/10/2026',
    summary: 'Toàn bộ câu lệnh rebase, cherry-pick, merge squash, stash và mẹo khôi phục commit mất bằng reflog.',
    previewText: 'MẸO KHÔI PHỤC COMMIT: git reflog -> git reset --hard HEAD@{n}.\nQUY TRÌNH REBASE: git fetch origin -> git rebase origin/main.',
    pages: [
      { title: 'Git Master Cheat Sheet', text: 'Hướng dẫn trực quan từng bước xử lý xung đột merge conflict và git hooks.' }
    ]
  },

  // 10. AI/ML - Paper
  {
    id: 'mkt-10',
    title: 'Tóm Tắt Mô Hình Transformer & Cơ Chế Attention',
    author: 'Trần Bảo Long (AI Researcher)',
    aiScore: 98,
    price: 25,
    type: 'paper',
    category: 'ai_ml',
    date: '27/10/2026',
    summary: 'Công thức toán học Self-Attention, Multi-Head Attention, Positional Encoding và FlashAttention.',
    previewText: 'ATTENTION FORMULA:\nAttention(Q, K, V) = softmax(Q * K^T / sqrt(d_k)) * V.\nĐộ phức tạp O(N^2) theo chiều dài ngữ cảnh.',
    pages: [
      { title: 'Cơ chế Attention Cốt lõi', text: 'Toàn bộ kiến trúc Transformer gốc trong bài báo Attention Is All You Need.' }
    ]
  },

  // 11. Data - Book
  {
    id: 'mkt-11',
    title: 'Học Máy Cho Phân Tích Dữ Liệu Lớn & Big Data',
    author: 'Võ Minh Khôi',
    aiScore: 89,
    price: 35,
    type: 'book',
    category: 'data',
    date: '26/10/2026',
    summary: 'Xử lý dữ liệu phân tán với PySpark, mô hình MapReduce, tối ưu truy vấn SQL và feature store.',
    previewText: 'CHƯƠNG 1: NGUYÊN LÝ MAPREDUCE\nCách dữ liệu được chia nhỏ thành các partition và tính toán song song.',
    pages: [
      { title: 'Chương 1: MapReduce & RDD', text: 'Cấu trúc Resilient Distributed Datasets trong Apache Spark.' },
      { title: 'Chương 2: DataFrames & SparkSQL', text: 'Tối ưu hóa Catalyst Optimizer và lập kế hoạch thực thi truy vấn.' },
      { title: 'Chương 3: Feature Engineering', text: 'Chuẩn hóa, mã hóa one-hot và vector assembler quy mô lớn.' },
      { title: 'Chương 4: Huấn luyện phân tán', text: 'Spark MLlib và chiến lược đồng bộ tham số Parameter Server.' },
      { title: 'Chương 5: Stream Processing', text: 'Xử lý luồng thời gian thực với Spark Structured Streaming.' }
    ]
  },

  // 12. CS - Exam
  {
    id: 'mkt-12',
    title: 'Đề Thi Trắc Nghiệm Hệ Điều Hành & Quản Lý Bộ Nhớ',
    author: 'Khoa Công Nghệ Máy Tính',
    aiScore: 93,
    price: 25,
    type: 'exam',
    category: 'cs',
    date: '25/10/2026',
    summary: 'Tiến trình, luồng, đồng bộ khóa Mutex/Semaphore, Deadlock và bộ nhớ ảo Phân trang Paging.',
    previewText: 'Kiểm tra toàn diện kiến thức Hệ điều hành Linux/Windows dành cho sinh viên IT năm 2 và năm 3.',
    examQuestions: [
      {
        id: 'qos1',
        question: 'Điều kiện nào sau đây KHÔNG PHẢI là một trong 4 điều kiện cần để xảy ra Deadlock (bế tắc)?',
        options: ['Mutual Exclusion', 'Hold and Wait', 'Preemption (Cho phép cưỡng chế)', 'Circular Wait'],
        correctAnswer: 2,
        explanation: 'Điều kiện để xảy ra Deadlock là NO PREEMPTION (không cho phép cưỡng chế tài nguyên).'
      },
      {
        id: 'qos2',
        question: 'Hiện tượng Thrashing trong quản lý bộ nhớ ảo xảy ra khi nào?',
        options: ['CPU bị quá nhiệt', 'Thời gian tráo đổi trang (paging) lớn hơn thời gian thực thi lệnh', 'Bộ nhớ RAM còn trống quá nhiều', 'Ổ cứng bị đầy bộ nhớ'],
        correctAnswer: 1,
        explanation: 'Thrashing xảy ra khi hệ điều hành tốn phần lớn thời gian để tráo đổi trang vào/ra khỏi đĩa.'
      }
    ]
  },

  // 13. Software - Exam
  {
    id: 'mkt-13',
    title: 'Trắc Nghiệm Kiến Thức Lập Trình Hướng Đối Tượng Java',
    author: 'CLB Lập Trình ViTudy',
    aiScore: 90,
    price: 15,
    type: 'exam',
    category: 'software',
    date: '24/10/2026',
    summary: 'Bốn tính chất OOP, cơ chế JVM Garbage Collection, nạp chồng nạp đè và Java Collections.',
    previewText: 'Bộ đề thi chuẩn hóa trắc nghiệm Java OCA giúp củng cố kiến thức phỏng vấn thực tập sinh.',
    examQuestions: [
      {
        id: 'qj1',
        question: 'Trong Java, từ khóa "final" đặt trước một phương thức (method) có ý nghĩa gì?',
        options: ['Phương thức không thể bị ghi đè (override) ở lớp con', 'Phương thức không thể được gọi', 'Phương thức trả về hằng số', 'Phương thức là hàm tĩnh static'],
        correctAnswer: 0,
        explanation: 'Phương thức final ngăn không cho các lớp con override lại hành vi của nó.'
      }
    ]
  },

  // 14. Math - Paper
  {
    id: 'mkt-14',
    title: 'Bảng Công Thức Lượng Giác & Đạo Hàm Nhanh',
    author: 'Phan Đình Trọng',
    aiScore: 87,
    price: 5,
    type: 'paper',
    category: 'math',
    date: '23/10/2026',
    summary: 'Đầy đủ công thức nhân đôi, nhân ba, biến đổi tích thành tổng, đạo hàm hàm hợp và bảng tích phân cơ bản.',
    previewText: 'Bảng tra cứu tốc hành phục vụ làm bài tập tính toán nhanh trong phòng thi.',
    pages: [
      { title: 'Bảng Đạo hàm & Lượng giác', text: 'Toàn bộ công thức sơ cấp và hàm lượng giác ngược arcsin, arccos, arctan.' }
    ]
  },

  // 15. AI/ML - Book
  {
    id: 'mkt-15',
    title: 'Xử Lý Ngôn Ngữ Tự Nhiên & Các Mô Hình Ngôn Ngữ Lớn (LLMs)',
    author: 'TS. Hoàng Đức Thắng',
    aiScore: 99,
    price: 50,
    type: 'book',
    category: 'ai_ml',
    date: '22/10/2026',
    summary: 'Từ Word2Vec, GloVe, BERT, GPT đến kỹ thuật RAG, Prompt Engineering và Fine-tuning LoRA.',
    previewText: 'CHƯƠNG 1: BIỂU DIỄN VĂN BẢN\nTừ One-hot Encoding, TF-IDF đến Vector nhúng ngữ nghĩa chiều sâu.',
    pages: [
      { title: 'Chương 1: Vector Embeddings', text: 'Biểu diễn từ trong không gian vector và độ tương đồng Cosine.' },
      { title: 'Chương 2: BERT & Mô hình Masked LM', text: 'Cơ chế đọc hai chiều hiểu ngữ cảnh văn bản sâu sắc.' },
      { title: 'Chương 3: GPT & Sinh văn bản', text: 'Autoregressive Language Modeling và học không cần mẫu Few-shot.' },
      { title: 'Chương 4: Kỹ thuật RAG', text: 'Retrieval Augmented Generation kết hợp cơ sở tri thức ngoài.' },
      { title: 'Chương 5: LoRA & Tinh chỉnh mô hình', text: 'Low-Rank Adaptation giảm 90% bộ nhớ khi huấn luyện lại LLM.' }
    ]
  },

  // 16. CS - Book
  {
    id: 'mkt-16',
    title: 'Mạng Máy Tính & Giao Thức Internet Toàn Tập',
    author: 'Đỗ Hữu Đạt',
    aiScore: 89,
    price: 35,
    type: 'book',
    category: 'cs',
    date: '21/10/2026',
    summary: 'Mô hình OSI 7 tầng, giao thức TCP/IP, bắt tay 3 bước 3-Way Handshake, DNS, HTTP/2 và TLS 1.3.',
    previewText: 'CHƯƠNG 1: MÔ HÌNH OSI VÀ TCP/IP\nSo sánh tầng ứng dụng, tầng vận chuyển, tầng mạng và liên kết dữ liệu.',
    pages: [
      { title: 'Chương 1: Các tầng mạng', text: 'Đóng gói dữ liệu (Encapsulation) từ Application xuống Physical.' },
      { title: 'Chương 2: Giao thức TCP & UDP', text: 'Kiểm soát luồng Flow Control, chống nghẽn và cơ chế ACK.' },
      { title: 'Chương 3: Định tuyến IP & Subnetting', text: 'Chia mạng con CIDR, giao thức OSPF và BGP trên Internet.' },
      { title: 'Chương 4: Tầng Ứng Dụng DNS & HTTP', text: 'Phân giải tên miền và sự tiến hóa từ HTTP/1.1 đến HTTP/3 QUIC.' },
      { title: 'Chương 5: An ninh mạng & Mã hóa', text: 'Mã hóa đối xứng, bất đối xứng RSA và chứng chỉ số SSL/TLS.' }
    ]
  },

  // 17. Software - Paper
  {
    id: 'mkt-17',
    title: 'Sổ Tay Thiết Kế Cơ Sở Dữ Liệu Quan Hệ Chuẩn Hóa 3NF',
    author: 'Nguyễn Thị Mai',
    aiScore: 92,
    price: 15,
    type: 'paper',
    category: 'software',
    date: '20/10/2026',
    summary: 'Các dạng chuẩn 1NF, 2NF, 3NF, BCNF, kỹ thuật đánh chỉ mục B-Tree Index và tối ưu hóa câu lệnh SQL.',
    previewText: 'QUY TẮC 3NF:\n- 1NF: Dữ liệu nguyên tử, không lặp cột.\n- 2NF: Thuộc tính không khóa phụ thuộc toàn bộ vào khóa chính.\n- 3NF: Không phụ thuộc bắc cầu.',
    pages: [
      { title: 'Chuẩn hóa CSDL & Tối ưu SQL', text: 'Mẹo thiết kế bảng chống dư thừa dữ liệu và chiến lược lập Index tối ưu.' }
    ]
  },

  // 18. Data - Exam
  {
    id: 'mkt-18',
    title: 'Đề Thi Thử Phân Tích Dữ Liệu Với Python & Pandas',
    author: 'Data Science Hub',
    aiScore: 91,
    price: 20,
    type: 'exam',
    category: 'data',
    date: '19/10/2026',
    summary: 'Xử lý missing data, groupby, merge/join bảng dữ liệu, pivot table và trực quan hóa Matplotlib.',
    previewText: 'Bộ câu hỏi trắc nghiệm kiểm tra kỹ năng thao tác DataFrame chuẩn bị cho đồ án thực tế.',
    examQuestions: [
      {
        id: 'qp1',
        question: 'Phương thức nào trong Pandas được dùng để điền giá trị khuyết thiếu (NaN)?',
        options: ['fillna()', 'dropna()', 'replace()', 'impute()'],
        correctAnswer: 0,
        explanation: 'Hàm df.fillna() thay thế các giá trị NaN bằng một giá trị cố định hoặc thống kê.'
      }
    ]
  },

  // 19. Math - Book
  {
    id: 'mkt-19',
    title: 'Đại Số Tuyến Tính Ứng Dụng Cho Khoa Học Dữ Liệu',
    author: 'PGS.TS Trần Văn Hạnh',
    aiScore: 96,
    price: 50,
    type: 'book',
    category: 'math',
    date: '18/10/2026',
    summary: 'Không gian vector, cơ sở, số chiều, ánh xạ tuyến tính, trị riêng vector riêng và ma trận hiệp phương sai.',
    previewText: 'CHƯƠNG 1: KHÔNG GIAN VECTOR RN\nĐộc lập tuyến tính, hệ sinh và định lý số chiều Rank-Nullity.',
    pages: [
      { title: 'Chương 1: Vector & Ma trận', text: 'Các phép toán cơ bản và ý nghĩa hình học của phép biến đổi tuyến tính.' },
      { title: 'Chương 2: Hệ phương trình tuyến tính', text: 'Phương pháp khử Gauss-Jordan và không gian nghiệm.' },
      { title: 'Chương 3: Trị riêng & Vector riêng', text: 'Đa thức đặc trưng, chéo hóa ma trận và ứng dụng PageRank.' },
      { title: 'Chương 4: Tích vô hướng & Trực giao', text: 'Quá trình Gram-Schmidt và phép chiếu trực giao trong hồi quy.' },
      { title: 'Chương 5: Dạng toàn phương', text: 'Ma trận đối xứng, dạng toàn phương xác định dương và cực trị elip.' }
    ]
  },

  // 20. CS - Paper
  {
    id: 'mkt-20',
    title: 'Cheat Sheet 50 Thuật Toán Phỏng Vấn LeetCode Hay Gặp',
    author: 'Coder Pro ViTudy',
    aiScore: 95,
    price: 20,
    type: 'paper',
    category: 'cs',
    date: '17/10/2026',
    summary: 'Hai con trỏ Two Pointers, Cửa sổ trượt Sliding Window, Tìm kiếm nhị phân và Duyệt cây đệ quy.',
    previewText: 'MẪU SLIDING WINDOW:\nwhile right < len(arr): window.add(arr[right]); while invalid: window.remove(arr[left]); left += 1.',
    pages: [
      { title: 'Top 50 LeetCode Patterns', text: 'Mẫu mã hóa (code template) Python/C++ giải quyết nhanh 80% câu hỏi phỏng vấn FAANG.' }
    ]
  },

  // 21. AI/ML - Exam
  {
    id: 'mkt-21',
    title: 'Đề Thi Trắc Nghiệm Thị Giác Máy Tính & Nhận Diện Ảnh',
    author: 'TS. Lê Quốc Trung',
    aiScore: 94,
    price: 25,
    type: 'exam',
    category: 'ai_ml',
    date: '16/10/2026',
    summary: 'Trích xuất đặc trưng SIFT/HOG, mạng CNN, Transfer Learning và độ đo mAP trong Object Detection.',
    previewText: 'Kiểm tra lý thuyết thị giác máy tính và ứng dụng xử lý ảnh thực tế.',
    examQuestions: [
      {
        id: 'qcv1',
        question: 'Độ đo IoU (Intersection over Union) trong bài toán phát hiện vật thể đo lường điều gì?',
        options: ['Tỷ lệ phần trăm diện tích giao nhau trên diện tích hợp của hai hộp bao', 'Số lượng nhãn đoán đúng', 'Tốc độ xử lý FPS của mô hình', 'Độ phân giải của ảnh đầu vào'],
        correctAnswer: 0,
        explanation: 'IoU = Diện tích giao / Diện tích hợp giữa bounding box dự đoán và ground truth.'
      }
    ]
  },

  // 22. Software - Book
  {
    id: 'mkt-22',
    title: 'Kiến Trúc Microservices & Hệ Thống Phân Tán Thực Chiến',
    author: 'Kỹ Sư Trưởng Nguyễn Hữu Nam',
    aiScore: 93,
    price: 45,
    type: 'book',
    category: 'software',
    date: '15/10/2026',
    summary: 'Thiết kế API Gateway, Service Mesh, Kafka Event Streaming, Saga Pattern và chống chịu lỗi Circuit Breaker.',
    previewText: 'CHƯƠNG 1: TỪ MONOLITH ĐẾN MICROSERVICES\nĐánh giá đánh đổi giữa tính độc lập triển khai và độ phức tạp dữ liệu.',
    pages: [
      { title: 'Chương 1: Phân rã dịch vụ', text: 'Chiến lược Domain-Driven Design (DDD) và ranh giới Bounded Context.' },
      { title: 'Chương 2: Giao tiếp bất đồng bộ', text: 'Event-driven architecture với Apache Kafka và RabbitMQ.' },
      { title: 'Chương 3: Quản lý giao dịch Saga', text: 'Xử lý giao dịch phân tán bằng Choreography và Orchestration.' },
      { title: 'Chương 4: Chống chịu lỗi Resiliency', text: 'Cơ chế Retry, Timeout, Bulkhead và Circuit Breaker Resilience4j.' },
      { title: 'Chương 5: Giám sát Observability', text: 'Theo dõi phân tán Distributed Tracing OpenTelemetry, Prometheus và Grafana.' }
    ]
  },

  // 23. Math - Paper
  {
    id: 'mkt-23',
    title: 'Tóm Tắt Phương Trình Vi Phân & Ứng Dụng Vật Lý',
    author: 'ThS. Hoàng Văn Cường',
    aiScore: 85,
    price: 10,
    type: 'paper',
    category: 'math',
    date: '14/10/2026',
    summary: 'Phương trình vi phân cấp 1 tách biến, tuyến tính bậc nhất Bernoulli và vi phân cấp 2 hệ số hằng.',
    previewText: 'CÁCH GIẢI Y" + pY\' + qY = 0:\nXét phương trình đặc trưng k^2 + pk + q = 0. Nghiệm thực phân biệt, nghiệm kép hoặc nghiệm phức.',
    pages: [
      { title: 'Phương trình Vi phân Cốt lõi', text: 'Tóm tắt các dạng phương trình vi phân thường gặp trong kỹ thuật và vật lý.' }
    ]
  },

  // 24. CS - Book
  {
    id: 'mkt-24',
    title: 'Nhập Môn An Toàn Thông Tin & Mật Mã Học Ứng Dụng',
    author: 'Chuyên Gia CyberSecurity ViTudy',
    aiScore: 91,
    price: 40,
    type: 'book',
    category: 'cs',
    date: '13/10/2026',
    summary: 'Mã hóa cổ điển, AES, RSA, Hàm băm SHA-256, chữ ký điện tử, tấn công XSS, SQLi và phòng thủ Web App.',
    previewText: 'CHƯƠNG 1: NGUYÊN LÝ BẢO MẬT CIA\nTính bí mật Confidentiality, toàn vẹn Integrity và sẵn sàng Availability.',
    pages: [
      { title: 'Chương 1: Tam giác bảo mật CIA', text: 'Các trụ cột cốt lõi và mô hình đe dọa an toàn thông tin.' },
      { title: 'Chương 2: Mật mã học đối xứng', text: 'Cơ chế hoạt động của AES, DES và các chế độ CBC, GCM.' },
      { title: 'Chương 3: Mật mã khóa công khai', text: 'Toán học số học mô-đun đằng sau thuật toán RSA và đường cong Elliptic.' },
      { title: 'Chương 4: Lỗ hổng Web OWASP Top 10', text: 'Nhận diện và phòng chống SQL Injection, XSS, CSRF và SSRF.' },
      { title: 'Chương 5: Xác thực & Phân quyền', text: 'Kiến trúc bảo mật OAuth 2.0, OpenID Connect và phân quyền RBAC.' }
    ]
  },

  // 25. Data - Paper
  {
    id: 'mkt-25',
    title: 'Sổ Tay Trực Quan Hóa Dữ Liệu Với Seaborn & Plotly',
    author: 'Vũ Thảo Vy',
    aiScore: 88,
    price: 10,
    type: 'paper',
    category: 'data',
    date: '12/10/2026',
    summary: 'Bản đồ nhiệt Heatmap, biểu đồ phân tán Scatter, Boxplot phát hiện ngoại lai và đồ thị tương tác 3D.',
    previewText: 'HƯỚNG DẪN CHỌN ĐỒ THỊ:\n- So sánh phân phối: Histogram, KDE, Boxplot.\n- Mối quan hệ tương quan: Scatter plot, Heatmap.',
    pages: [
      { title: 'Data Visualization Cheat Sheet', text: 'Cẩm nang chọn đúng biểu đồ truyền tải câu chuyện dữ liệu thuyết phục.' }
    ]
  },

  // 26. AI/ML - Book
  {
    id: 'mkt-26',
    title: 'Học Tăng Cường (Reinforcement Learning) Cơ Bản & Nâng Cao',
    author: 'TS. Đặng Quốc Toàn',
    aiScore: 97,
    price: 50,
    type: 'book',
    category: 'ai_ml',
    date: '11/10/2026',
    summary: 'Q-Learning, Policy Gradient, Deep Q-Networks (DQN), PPO và ứng dụng huấn luyện AI chơi game.',
    previewText: 'CHƯƠNG 1: MARKOV DECISION PROCESS (MDP)\nTrạng thái S, Hành động A, Phần thưởng R và hệ số chiết khấu Gamma.',
    pages: [
      { title: 'Chương 1: Khung bài toán MDP', text: 'Mô hình hóa quá trình ra quyết định tuần tự trong môi trường không chắc chắn.' },
      { title: 'Chương 2: Phương trình Bellman', text: 'Phương trình tối ưu Bellman cho hàm giá trị V(s) và Q(s, a).' },
      { title: 'Chương 3: Q-Learning & SARSA', text: 'Thuật toán học không mô hình Model-free và chiến lược khám phá Epsilon-Greedy.' },
      { title: 'Chương 4: Deep Q-Networks (DQN)', text: 'Kết hợp mạng nơ-ron sâu với bộ nhớ Experience Replay.' },
      { title: 'Chương 5: Policy Gradient & PPO', text: 'Tối ưu hóa trực tiếp hàm chính sách trong không gian hành động liên tục.' }
    ]
  },

  // 27. Software - Exam
  {
    id: 'mkt-27',
    title: 'Đề Thi Trắc Nghiệm Clean Code & Tối Ưu Hóa Mã Nguồn',
    author: 'Senior Architect ViTudy',
    aiScore: 92,
    price: 20,
    type: 'exam',
    category: 'software',
    date: '10/10/2026',
    summary: 'Đặt tên biến, hàm ngắn gọn, xử lý ngoại lệ an toàn, kiểm thử đơn vị Unit Test và refactoring mã bốc mùi.',
    previewText: 'Bộ đề thi kiểm tra tư duy viết mã sạch và kỹ năng phát hiện code smell.',
    examQuestions: [
      {
        id: 'qcc1',
        question: 'Theo nguyên tắc Clean Code của Robert C. Martin, một hàm lý tưởng nên có độ dài và số lượng tham số như thế nào?',
        options: ['Càng dài càng chi tiết, không giới hạn tham số', 'Hàm chỉ làm một việc duy nhất và có tối đa 2-3 tham số', 'Hàm nên gom nhiều tính năng để tái sử dụng', 'Mọi hàm đều phải có chú thích dài'],
        correctAnswer: 1,
        explanation: 'Clean Code: Hàm chỉ nên làm duy nhất một việc (Do one thing) và giữ tham số tối giản.'
      }
    ]
  },

  // 28. CS - Exam
  {
    id: 'mkt-28',
    title: 'Đề Thi Trắc Nghiệm Cơ Sở Dữ Liệu SQL & NoSQL',
    author: 'Bộ Môn Hệ Thống Thông Tin',
    aiScore: 89,
    price: 20,
    type: 'exam',
    category: 'cs',
    date: '09/10/2026',
    summary: 'Các phép Join, subquery, transaction ACID, định lý CAP và so sánh MongoDB với PostgreSQL.',
    previewText: 'Bộ đề thi tổng hợp kiểm tra kiến thức truy vấn và thiết kế lưu trữ hiện đại.',
    examQuestions: [
      {
        id: 'qsql1',
        question: 'Trong định lý CAP cho các hệ thống phân tán, ba yếu tố C, A, P đại diện cho những gì?',
        options: ['Consistency, Availability, Partition Tolerance', 'Concurrency, Accuracy, Persistence', 'Cost, Agility, Performance', 'Control, Authentication, Privacy'],
        correctAnswer: 0,
        explanation: 'CAP Theorem: Tính nhất quán (Consistency), Tính sẵn sàng (Availability), Tính chịu lỗi phân vùng (Partition Tolerance).'
      }
    ]
  },

  // 29. Math - Exam
  {
    id: 'mkt-29',
    title: 'Đề Thi Thử Toán Rời Rạc & Lý Thuyết Đồ Thị',
    author: 'TS. Bùi Minh Quân',
    aiScore: 90,
    price: 20,
    type: 'exam',
    category: 'math',
    date: '08/10/2026',
    summary: 'Tập hợp, quan hệ tương đương, thứ tự bán phần, đồ thị Euler, Hamilton, cây khung Kruskal và định lý Euler.',
    previewText: '10 câu hỏi trắc nghiệm rèn luyện tư duy logic và thuật toán rời rạc căn bản.',
    examQuestions: [
      {
        id: 'qdis1',
        question: 'Một đồ thị liên thông vô hướng có chu trình Euler khi và chỉ khi nào?',
        options: ['Mọi đỉnh đều có bậc chẵn', 'Chỉ có đúng 2 đỉnh bậc lẻ', 'Số đỉnh bằng số cạnh', 'Đồ thị là cây nhị phân'],
        correctAnswer: 0,
        explanation: 'Định lý Euler: Đồ thị liên thông có chu trình Euler khi mọi đỉnh đều có bậc chẵn.'
      }
    ]
  },

  // 30. Software - Book
  {
    id: 'mkt-30',
    title: 'Kỹ Thuật CI/CD & Tự Động Hóa Triển Khai với Docker, K8s',
    author: 'DevOps Lead Đoàn Văn Phong',
    aiScore: 95,
    price: 45,
    type: 'book',
    category: 'software',
    date: '07/10/2026',
    summary: 'Đóng gói Container Docker, viết pipeline GitHub Actions, điều phối Kubernetes Cluster và Helm chart.',
    previewText: 'CHƯƠNG 1: NỀN TẢNG CONTAINER DOCKER\nSo sánh máy ảo Hypervisor với Container cgroups và namespaces.',
    pages: [
      { title: 'Chương 1: Containerization', text: 'Cơ chế cô lập tiến trình bằng Linux cgroups và namespaces.' },
      { title: 'Chương 2: Dockerfile tối ưu', text: 'Kỹ thuật Multi-stage build giảm kích thước image từ 1GB xuống 50MB.' },
      { title: 'Chương 3: CI/CD GitHub Actions', text: 'Tự động chạy unit test, linter và build container mỗi commit.' },
      { title: 'Chương 4: Kiến trúc Kubernetes', text: 'Các thành phần Control Plane, Pod, Service, Ingress và ConfigMap.' },
      { title: 'Chương 5: Triển khai không gián đoạn', text: 'Chiến lược Rolling Update, Blue-Green và Canary Deployment.' }
    ]
  },

  // 31. Data - Book
  {
    id: 'mkt-31',
    title: 'Khai Phá Dữ Liệu & Thuật Toán Phân Cụm K-Means, DBSCAN',
    author: 'ThS. Nguyễn Quỳnh Chi',
    aiScore: 88,
    price: 30,
    type: 'book',
    category: 'data',
    date: '06/10/2026',
    summary: 'Phân tích cụm không giám sát, tìm tập mục tiêu phổ biến Apriori và phát hiện bất thường Anomaly Detection.',
    previewText: 'CHƯƠNG 1: THUẬT TOÁN K-MEANS\nCách khởi tạo tâm cụm K-Means++ và tối ưu hàm khoảng cách Euclidean.',
    pages: [
      { title: 'Chương 1: Phân cụm K-Means', text: 'Thuật toán lặp gán điểm và cập nhật tâm cụm đến khi hội tụ.' },
      { title: 'Chương 2: Đánh giá chất lượng cụm', text: 'Chỉ số Silhouette score và phương pháp cùi chỏ Elbow method.' },
      { title: 'Chương 3: Phân cụm mật độ DBSCAN', text: 'Khả năng tìm cụm hình dạng bất kỳ và loại bỏ điểm nhiễu Outlier.' },
      { title: 'Chương 4: Luật kết hợp Apriori', text: 'Độ hỗ trợ Support, độ tin cậy Confidence và độ nâng Lift.' }
    ]
  },

  // 32. CS - Paper
  {
    id: 'mkt-32',
    title: 'Tóm Tắt Mô Hình Bộ Nhớ C++ & Quản Lý Con Trỏ Thông Minh',
    author: 'Lâm Tuấn Hưng',
    aiScore: 91,
    price: 15,
    type: 'paper',
    category: 'cs',
    date: '05/10/2026',
    summary: 'Stack vs Heap, con trỏ thô, std::unique_ptr, std::shared_ptr, RAII và phòng tránh rò rỉ bộ nhớ Memory Leak.',
    previewText: 'NGUYÊN LÝ RAII: Tài nguyên được cấp phát trong hàm dựng Constructor và giải phóng trong hàm hủy Destructor.',
    pages: [
      { title: 'Modern C++ Memory Management', text: 'Cẩm nang quản lý con trỏ an toàn, move semantics và rvalue reference.' }
    ]
  },

  // 33. AI/ML - Paper
  {
    id: 'mkt-33',
    title: 'Mẹo Prompt Engineering Chuyên Sâu Cho Nhà Phát Triển',
    author: 'AI Solutions Architect',
    aiScore: 96,
    price: 20,
    type: 'paper',
    category: 'ai_ml',
    date: '04/10/2026',
    summary: 'Chain-of-Thought (CoT), Few-Shot, ReAct Framework, Structured JSON Output và kỹ thuật giảm ảo giác Hallucination.',
    previewText: 'MẪU PROMPT REACT: Suy nghĩ (Thought) -> Hành động (Action) -> Quan sát (Observation) -> Kết luận.',
    pages: [
      { title: 'Prompt Engineering Playbook', text: 'Bộ khung câu lệnh tối ưu cho các tác vụ suy luận phức tạp và gọi hàm Function Calling.' }
    ]
  },

  // 34. Math - Book
  {
    id: 'mkt-34',
    title: 'Giải Tích Hàm & Không Gian Hilbert Dành Cho Kỹ Sư',
    author: 'GS. Tạ Quang Bửu',
    aiScore: 94,
    price: 45,
    type: 'book',
    category: 'math',
    date: '03/10/2026',
    summary: 'Không gian Banach, không gian Hilbert, toán tử tuyến tính liên tục, chuỗi Fourier và biến đổi Laplace.',
    previewText: 'CHƯƠNG 1: KHÔNG GIAN ĐỊNH CHUẨN\nKhái niệm chuẩn, khoảng cách và sự hội tụ trong không gian vô hạn chiều.',
    pages: [
      { title: 'Chương 1: Không gian định chuẩn', text: 'Định nghĩa chuẩn vector và không gian đầy đủ Banach.' },
      { title: 'Chương 2: Không gian Hilbert', text: 'Tích vô hướng vô hạn chiều và hệ trực chuẩn hoàn toàn.' },
      { title: 'Chương 3: Chuỗi Fourier', text: 'Biểu diễn tín hiệu tuần hoàn dưới dạng tổng sóng hài điều hòa.' },
      { title: 'Chương 4: Biến đổi Laplace', text: 'Giải phương trình vi phân và hàm truyền trong lý thuyết điều khiển.' }
    ]
  },

  // 35. Software - Paper
  {
    id: 'mkt-35',
    title: 'Tóm Tắt Chuẩn Thiết Kế RESTful API & GraphQL',
    author: 'Hoàng Minh Nhật',
    aiScore: 89,
    price: 10,
    type: 'paper',
    category: 'software',
    date: '02/10/2026',
    summary: 'Các mã trạng thái HTTP (200, 201, 400, 401, 403, 404, 500), định dạng URL chuẩn và so sánh Over-fetching GraphQL.',
    previewText: 'MÃ HTTP THÔNG DỤNG:\n- 200 OK, 201 Created\n- 400 Bad Request, 401 Unauthorized, 403 Forbidden\n- 500 Internal Error',
    pages: [
      { title: 'API Design Best Practices', text: 'Nguyên tắc thiết kế API bảo mật, hỗ trợ phân trang và định phiên bản API.' }
    ]
  },

  // 36. Data - Exam
  {
    id: 'mkt-36',
    title: 'Đề Thi Trắc Nghiệm SQL Truy Vấn Dữ Liệu Nâng Cao',
    author: 'Database Administrator Team',
    aiScore: 93,
    price: 25,
    type: 'exam',
    category: 'data',
    date: '01/10/2026',
    summary: 'Hàm cửa sổ Window Functions (ROW_NUMBER, RANK, DENSE_RANK), CTE đệ quy và giải bài toán kinh doanh.',
    previewText: 'Bài tập trắc nghiệm phân tích dữ liệu chuyên nghiệp bằng các câu lệnh SQL nâng cao.',
    examQuestions: [
      {
        id: 'qw1',
        question: 'Sự khác biệt chính giữa RANK() và DENSE_RANK() khi có hai giá trị bằng nhau là gì?',
        options: ['DENSE_RANK() nhảy cóc thứ hạng, RANK() không nhảy', 'RANK() nhảy cóc thứ hạng kế tiếp, còn DENSE_RANK() duy trì thứ hạng liên tục', 'Cả hai đều giống hệt nhau', 'DENSE_RANK() chỉ chạy được trên số âm'],
        correctAnswer: 1,
        explanation: 'RANK() tạo khoảng nhảy thứ hạng (ví dụ 1, 2, 2, 4), còn DENSE_RANK() thì không nhảy (1, 2, 2, 3).'
      }
    ]
  },

  // 37. CS - Book
  {
    id: 'mkt-37',
    title: 'Lập Trình Hướng Đối Tượng & Mẫu Thiết Kế với C++',
    author: 'Đinh Công Tráng',
    aiScore: 90,
    price: 40,
    type: 'book',
    category: 'cs',
    date: '30/09/2026',
    summary: 'Đa hình tĩnh qua Template, đa hình động qua vtable, nạp chồng toán tử và tối ưu hóa zero-cost abstraction.',
    previewText: 'CHƯƠNG 1: BẢNG ẢO VTABLE VÀ CON TRỎ VPTR\nCách trình biên dịch C++ hiện thực hóa hàm ảo virtual function.',
    pages: [
      { title: 'Chương 1: Đa hình ảo trong C++', text: 'Chi tiết cơ chế bảng vtable và con trỏ vptr ở mức nhị phân.' },
      { title: 'Chương 2: Lập trình Template', text: 'Generic Programming và kỹ thuật tính toán tại thời điểm biên dịch SFINAE.' },
      { title: 'Chương 3: Nạp chồng toán tử', text: 'Tự định nghĩa toán tử số học, so sánh và toán tử gán sao chép.' },
      { title: 'Chương 4: Quản lý ngoại lệ', text: 'Cơ chế Stack Unwinding và đảm bảo an toàn ngoại lệ Exception Safety.' }
    ]
  },

  // 38. AI/ML - Paper
  {
    id: 'mkt-38',
    title: 'Tóm Tắt Các Kỹ Thuật Đánh Giá Mô Hình Máy Học (Evaluation Metrics)',
    author: 'Data Enthusiast ViTudy',
    aiScore: 91,
    price: 10,
    type: 'paper',
    category: 'ai_ml',
    date: '29/09/2026',
    summary: 'Ma trận nhầm lẫn Confusion Matrix, ROC-AUC, Log-Loss, MAE, RMSE, R-squared và Cross-Validation K-Fold.',
    previewText: 'ROC-AUC:\nDiện tích dưới đường cong ROC biểu thị khả năng phân tách giữa lớp âm tính và dương tính ở mọi ngưỡng.',
    pages: [
      { title: 'Metrics Evaluation Cheat Sheet', text: 'Bảng tra cứu chọn đúng chỉ số đánh giá cho từng bài toán Regression và Classification.' }
    ]
  },

  // 39. Math - Paper
  {
    id: 'mkt-39',
    title: 'Sổ Tay Xác Suất Điều Kiện & Công Thức Định Lý Bayes',
    author: 'Phan Minh Khang',
    aiScore: 89,
    price: 10,
    type: 'paper',
    category: 'math',
    date: '28/09/2026',
    summary: 'Xác suất có điều kiện P(A|B), định lý xác suất đầy đủ và công thức Bayes cập nhật niềm tin theo bằng chứng.',
    previewText: 'ĐỊNH LÝ BAYES:\nP(A|B) = [P(B|A) * P(A)] / P(B).\nTrong đó P(A) là Prior, P(B|A) là Likelihood, P(A|B) là Posterior.',
    pages: [
      { title: 'Bayes Theorem in Action', text: 'Minh họa trực quan bài toán chẩn đoán y khoa và lọc thư rác Naive Bayes.' }
    ]
  },

  // 40. CS - Paper
  {
    id: 'mkt-40',
    title: 'Tóm Tắt Các Giao Thức Bảo Mật & Xác Thực JWT, OAuth2',
    author: 'Security Specialist ViTudy',
    aiScore: 95,
    price: 15,
    type: 'paper',
    category: 'cs',
    date: '27/09/2026',
    summary: 'Cấu trúc Token JWT (Header.Payload.Signature), luồng ủy quyền Authorization Code Flow với PKCE an toàn.',
    previewText: 'CẤU TRÚC JWT:\n1. Header (Thuật toán ký HS256/RS256)\n2. Payload (Claims dữ liệu người dùng)\n3. Signature (Chữ ký chống giả mạo)',
    pages: [
      { title: 'Authentication & Authorization Playbook', text: 'Cẩm nang triển khai xác thực không trạng thái an toàn cho ứng dụng web.' }
    ]
  }
];
