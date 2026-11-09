import { StudySpace } from '@/types/studyspace';

export const INITIAL_SPACES: StudySpace[] = [
  {
    id: 'space-ai-math',
    name: 'Toán cho Trí tuệ Nhân tạo',
    subject: 'Khoa học Máy tính',
    description: 'Không gian nghiên cứu Đại số tuyến tính, Giải tích đa biến và Tối ưu hoá cho AI.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    items: [
      {
        id: 'doc-book-ml',
        type: 'book',
        title: 'Giáo trình Cơ Sở Machine Learning & Deep Learning',
        x: 160,
        y: 80,
        rotation: 0,
        scale: 1,
        zIndex: 10,
        pageCount: 8,
        currentPageIndex: 0,
        colorTheme: '#1e3a8a',
        isBinder: false,
        pages: [
          {
            id: 'p1',
            pageNumber: 1,
            title: 'Chương 1: Mở đầu về Học Máy',
            text: `Machine Learning (Học máy) là một phân nhánh của Trí tuệ Nhân tạo tập trung vào việc xây dựng các hệ thống có khả năng học hỏi từ dữ liệu thay vì tuân theo các quy tắc lập trình cứng.

1. Supervised Learning (Học có giám sát):
Mô hình được huấn luyện trên tập dữ liệu có gán nhãn (X, y). Mục tiêu là tìm hàm f(X) ≈ y.
Ví dụ: Phân loại hình ảnh, dự đoán giá nhà.

2. Unsupervised Learning (Học không giám sát):
Mô hình tìm kiếm các cấu trúc, cụm ẩn trong tập dữ liệu không có nhãn X.
Ví dụ: Phân cụm khách hàng (K-Means), giảm số chiều (PCA).`
          },
          {
            id: 'p2',
            pageNumber: 2,
            title: 'Chương 2: Các Độ đo Đánh giá Mô hình',
            text: `Để đánh giá một mô hình phân loại (Classification), ta sử dụng Ma trận nhầm lẫn (Confusion Matrix):
- True Positive (TP): Dự đoán Đúng là Dương tính
- False Positive (FP): Dự đoán Sai là Dương tính (Lỗi loại I)
- True Negative (TN): Dự đoán Đúng là Âm tính
- False Negative (FN): Dự đoán Sai là Âm tính (Lỗi loại II)

Độ chính xác (Accuracy):
Accuracy = (TP + TN) / (TP + TN + FP + FN)

Độ phủ (Recall / Sensitivity):
Recall = TP / (TP + FN)

Độ chuẩn xác (Precision):
Precision = TP / (TP + FP)

Điểm F1-Score:
F1 = 2 * (Precision * Recall) / (Precision + Recall)`
          },
          {
            id: 'p3',
            pageNumber: 3,
            title: 'Chương 3: Hồi quy Tuyến tính (Linear Regression)',
            text: `Hồi quy tuyến tính là thuật toán cơ bản mô hình hóa mối quan hệ giữa biến phụ thuộc liên tục y và một hoặc nhiều biến độc lập X.

Mô hình dạng ma trận:
y = X * w + b

Hàm mất mát (Mean Squared Error - MSE):
L(w) = (1 / 2m) * ∑ (f(x_i) - y_i)^2

Mục tiêu là tìm bộ trọng số w* sao cho hàm mất mát L(w) đạt giá trị cực tiểu.
Có hai phương pháp chính để tìm nghiệm:
1. Nghiệm giải tích (Normal Equation): w = (X^T * X)^(-1) * X^T * y
2. Thuật toán tối ưu Gradient Descent lặp từng bước.`
          },
          {
            id: 'p4',
            pageNumber: 4,
            title: 'Chương 3: Thuật toán Tối ưu Gradient Descent',
            text: `Gradient Descent là phương pháp tối ưu hóa bậc nhất tìm cực tiểu địa phương của hàm khả vi.

Quy tắc cập nhật trọng số:
$$w_{t+1} = w_t - \eta \nabla L(w_t)$$

Trong đó:
• $\eta$ (learning rate): Tốc độ học. Nếu $\eta$ quá lớn, thuật toán sẽ phân kỳ; nếu $\eta$ quá nhỏ, tốc độ hội tụ rất chậm.
• $\nabla L(w_t)$: Gradient (vectơ đạo hàm riêng) của hàm mất mát theo $w$.

Các biến thể chính:
• Batch Gradient Descent: Tính toán gradient trên toàn bộ tập dữ liệu.
• Stochastic Gradient Descent (SGD): Cập nhật trọng số theo từng mẫu ngẫu nhiên.
• Mini-batch SGD: Cập nhật theo nhóm nhỏ (kích thước batch: 32, 64, 128).`
          },
          {
            id: 'p5',
            pageNumber: 5,
            title: 'Chương 3: Mạng Nơ-ron Nhân tạo (Neural Networks)',
            text: `Mạng nơ-ron nhân tạo lấy cảm hứng từ cấu trúc sinh học của não bộ.

Thành phần cơ bản của một Perceptron:
$$z = \sum_{i=1}^{n} w_i x_i + b \quad \Longrightarrow \quad a = \sigma(z)$$

Các hàm kích hoạt phi tuyến (Activation Functions):
• Sigmoid: $\sigma(z) = \frac{1}{1 + e^{-z}}$ (nén giá trị về khoảng $[0, 1]$).
• ReLU: $f(z) = \max(0, z)$ (phổ biến nhất vì tính toán nhanh, tránh triệt tiêu gradient ở miền dương).
• Softmax: Biểu diễn phân phối xác suất ở lớp đầu ra cho phân loại đa lớp.`
          },
          {
            id: 'p6',
            pageNumber: 6,
            title: 'Chương 3: Lan truyền Ngược (Backpropagation)',
            text: `Thuật toán Lan truyền ngược là trụ cột huấn luyện mạng nơ-ron sâu (Deep Learning).

Nguyên lý Chain Rule (Quy tắc dây chuyền):
$$\frac{\partial L}{\partial w} = \frac{\partial L}{\partial a} \cdot \frac{\partial a}{\partial z} \cdot \frac{\partial z}{\partial w}$$

Các bước thực hiện trong mỗi lượt huấn luyện (Epoch):
1. Forward Pass: Truyền tín hiệu từ đầu vào qua các lớp ẩn để tính giá trị dự đoán $\hat{y}$ và hàm mất mát $L$.
2. Backward Pass: Tính đạo hàm của $L$ ngược từ lớp ra về lớp vào qua Chain Rule.
3. Weight Update: Điều chỉnh trọng số $w$ bằng Optimizer (SGD, Adam, RMSProp).`
          },
          {
            id: 'p7',
            pageNumber: 7,
            title: 'Chương 4: Hiện tượng Overfitting & Biện pháp Khắc phục',
            text: `Overfitting xảy ra khi mô hình học quá kỹ các chi tiết ngẫu nhiên và nhiễu (noise) của tập huấn luyện, dẫn đến độ chính xác cao trên Train nhưng suy giảm mạnh trên Test.

Các kỹ thuật Regularization phổ biến:
• L2 Regularization (Ridge / Weight Decay): Phạt các trọng số có độ lớn cao:
$$\mathcal{L}_{\text{reg}} = \mathcal{L} + \lambda \|w\|_2^2$$
• L1 Regularization (Lasso): Tạo ra các trọng số thưa: $\mathcal{L}_{\text{reg}} = \mathcal{L} + \lambda \|w\|_1$
• Dropout: Tắt ngẫu nhiên một tỷ lệ nơ-ron (20% – 50%) trong mỗi lượt huấn luyện.
• Early Stopping: Dừng huấn luyện khi mất mát trên tập Validation bắt đầu tăng.`
          },
          {
            id: 'p8',
            pageNumber: 8,
            title: 'Chương 4: Lời kết & Tài liệu Tham khảo',
            text: `Học thuyết về Học máy là nền tảng để tiếp cận các mô hình ngôn ngữ lớn (LLM), Thị giác máy tính (Computer Vision), và Hệ thống Tự hành.

Tài liệu khuyên đọc:
- "Deep Learning" - Ian Goodfellow, Yoshua Bengio
- "Pattern Recognition and Machine Learning" - Christopher Bishop
- Khoá học CS229 / CS231n của Đại học Stanford.

Ghi chú từ ViTudy: Hãy dùng tính năng Inteline bôi đen bất kỳ công thức hoặc thuật ngữ nào trong cuốn sách này để hỏi AI giải thích chi tiết!`
          }
        ]
      },
      {
        id: 'doc-paper-derivative',
        type: 'paper',
        title: 'Công thức Đạo hàm Cơ bản',
        x: -280,
        y: 100,
        rotation: 0,
        scale: 1,
        zIndex: 12,
        pageCount: 1,
        currentPageIndex: 0,
        colorTheme: '#047857',
        isBinder: false,
        pages: [
          {
            id: 'p-rev-1',
            pageNumber: 1,
            title: 'Công thức Đạo hàm Cơ bản',
            text: `Tờ ôn tập quy tắc đạo hàm trọng tâm:

• Hàm lũy thừa: $\\frac{d}{dx}(x^n) = n x^{n-1}$
• Hàm mũ: $\\frac{d}{dx}(e^x) = e^x$
• Logarit tự nhiên: $\\frac{d}{dx}(\\ln x) = \\frac{1}{x} \\quad (x > 0)$
• Quy tắc tích: $(u \\cdot v)' = u' v + u v'$
• Quy tắc thương: $\\left(\\frac{u}{v}\\right)' = \\frac{u' v - u v'}{v^2}$
• Quy tắc dây chuyền: $\\frac{dy}{dx} = \\frac{dy}{du} \\cdot \\frac{du}{dx}$`
          }
        ]
      },
      {
        id: 'doc-roadmap-ml',
        type: 'paper',
        title: 'Lộ trình Ôn tập Machine Learning',
        x: -280,
        y: 630,
        rotation: 0,
        scale: 1,
        zIndex: 14,
        pageCount: 1,
        currentPageIndex: 0,
        colorTheme: '#0284c7',
        isBinder: false,
        pages: [
          {
            id: 'p-road-1',
            pageNumber: 1,
            title: 'Lộ trình Ôn tập Machine Learning',
            text: `[CHẶNG 1: KHÁI NIỆM MỞ ĐẦU & PHÂN LOẠI]
  ├── [x] Định nghĩa Học có giám sát (Supervised) vs Không giám sát (Unsupervised)
  ├── [x] Ma trận nhầm lẫn (Confusion Matrix): TP, FP, TN, FN
  └── [x] Độ đo Accuracy, Precision, Recall, F1-Score

[CHẶNG 2: HỒI QUY TUYẾN TÍNH & HÀM MẤT MÁT]
  ├── [ ] Mô hình $y = X w + b$ và Hàm mất mát MSE
  ├── [ ] Nghiệm giải tích Normal Equation: $w = (X^T X)^{-1} X^T y$
  └── [ ] Thuật toán Gradient Descent: Batch, Mini-batch, SGD`
          }
        ]
      },
      {
        id: 'doc-paper-gradient',
        type: 'paper',
        title: 'Gradient trong Không gian Đa chiều',
        x: 1120,
        y: 350,
        rotation: 0,
        scale: 1,
        zIndex: 13,
        pageCount: 1,
        currentPageIndex: 0,
        colorTheme: '#0284c7',
        isBinder: false,
        pages: [
          {
            id: 'p-rev-2',
            pageNumber: 1,
            title: 'Gradient trong Không gian Đa chiều',
            text: `Cho hàm khả vi nhiều biến $f(x_1, x_2, \\dots, x_n)$:
Gradient của $f$, ký hiệu $\\nabla f$, là một vectơ gồm tất cả các đạo hàm riêng:
$$\\nabla f = \\left[ \\frac{\\partial f}{\\partial x_1}, \\frac{\\partial f}{\\partial x_2}, \\dots, \\frac{\\partial f}{\\partial x_n} \\right]^T$$

Ý nghĩa hình học quan trọng:
1. Vectơ $\\nabla f$ luôn chỉ theo hướng hàm số TĂNG NHANH NHẤT.
2. Vectơ đối nghịch $(-\\nabla f)$ luôn chỉ theo hướng hàm số GIẢM NHANH NHẤT (Nguyên lý Gradient Descent).
3. Độ dài (Norm) $\\|\\nabla f\\|$ thể hiện tốc độ biến thiên cực đại tại điểm xét.`
          }
        ]
      },
      {
        id: 'doc-sticky-1',
        type: 'sticky_note',
        title: 'Ghi chú nhớ ôn thi',
        x: 1120,
        y: 100,
        rotation: 0,
        scale: 1,
        zIndex: 15,
        pageCount: 1,
        currentPageIndex: 0,
        stickyColor: '#fef08a',
        stickyText: 'Lưu ý: Tuần sau thi giữa kỳ môn Học máy! Nhớ dùng công cụ STudy tạo 20 câu hỏi trắc nghiệm từ Chương 2 & 3 để luyện tập!',
        pages: []
      }
    ],
    threads: [
      {
        id: 'thread-demo-1',
        sourceItemId: 'doc-book-ml',
        sourcePageNumber: 1,
        selectedText: 'Supervised Learning (Học có giám sát)',
        sourceOffset: { x: 300, y: 140 },
        targetStickyId: 'doc-sticky-1',
        question: 'Tại sao cần ghi nhớ kỹ phần Học có giám sát?',
        answer: 'Vì đây là trọng tâm 40% câu hỏi trong đề thi giữa kỳ.',
        createdAt: '2026-01-01T00:00:00.000Z'
      }
    ]
  },
  {
    id: 'space-ml-deep-learning',
    name: 'Cơ sở Machine Learning & Deep Learning',
    subject: 'Khoa học Dữ liệu',
    description: 'Giáo trình, ma trận nhầm lẫn',
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    items: [
      {
        id: 'doc-book-dl',
        type: 'book',
        title: 'Cơ sở Machine Learning & Deep Learning',
        x: 160,
        y: 80,
        rotation: 0,
        scale: 1,
        zIndex: 10,
        pageCount: 6,
        currentPageIndex: 0,
        colorTheme: '#5c3920',
        isBinder: false,
        pages: [
          {
            id: 'p-dl-1',
            pageNumber: 1,
            title: 'Chương 1: Mạng Nơ-ron Nhân tạo (ANN)',
            text: `Mạng Nơ-ron Nhân tạo (Artificial Neural Network) được cấu thành từ các lớp perceptron liên kết với nhau qua các trọng số w và độ lệch bias b:
$$z = \\sum_{i=1}^n w_i x_i + b$$
Hàm kích hoạt (Activation Function) phi tuyến tính đưa tính phi tuyến vào mạng:
• Sigmoid: $\\sigma(z) = \\frac{1}{1 + e^{-z}}$
• ReLU: $f(z) = \\max(0, z)$`
          },
          {
            id: 'p-dl-2',
            pageNumber: 2,
            title: 'Chương 2: Ma trận Nhầm lẫn & Đánh giá',
            text: `Ma trận nhầm lẫn (Confusion Matrix) dùng để tính toán các chỉ số độ đo hiệu năng của mô hình:
• Precision (Độ chuẩn xác): $\\frac{TP}{TP + FP}$
• Recall (Độ thu hồi): $\\frac{TP}{TP + FN}$
• F1-Score: $2 \\cdot \\frac{Precision \\cdot Recall}{Precision + Recall}$`
          }
        ]
      },
      {
        id: 'doc-sticky-dl-1',
        type: 'sticky_note',
        title: 'Ghi chú ma trận nhầm lẫn',
        x: 1120,
        y: 100,
        rotation: 0,
        scale: 1,
        zIndex: 15,
        pageCount: 1,
        currentPageIndex: 0,
        stickyColor: '#fef08a',
        stickyText: 'Nhớ phân biệt rõ: Type I Error (False Positive) và Type II Error (False Negative)! Thường xuyên ra trong đề thi trắc nghiệm.',
        pages: []
      }
    ],
    threads: []
  }
];
