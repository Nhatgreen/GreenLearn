import { DeskItem, StudySpace } from '@/types/studyspace';

export function createDemoStudySpace(userId?: string): StudySpace {
  const spaceId = crypto.randomUUID();

  const demoItems: DeskItem[] = [
    {
      id: crypto.randomUUID(),
      type: 'book',
      title: 'Giáo trình Giải Tích & Machine Learning Cơ Bản',
      x: 80,
      y: 60,
      rotation: 0,
      scale: 1,
      zIndex: 1,
      pageCount: 4,
      currentPageIndex: 0,
      coverColor: '#5c3920',
      pages: [
        {
          id: crypto.randomUUID(),
          pageNumber: 1,
          title: 'Chương 1: Đạo hàm hàm số & Gradient',
          text: `## 1.1 Khái niệm Gradient trong không gian đa chiều
Gradient của hàm khả vi $f: \\mathbb{R}^n \\to \\mathbb{R}$ tại điểm $x$ được định nghĩa bởi vector các đạo hàm riêng:

$$\\nabla f(x) = \\left[ \\frac{\\partial f}{\\partial x_1}, \\frac{\\partial f}{\\partial x_2}, \\dots, \\frac{\\partial f}{\\partial x_n} \\right]^T$$

• Hướng của $\\nabla f(x)$ là hướng mà hàm số tăng nhanh nhất.
• Độ lớn của gradient biểu thị tốc độ tăng của giá trị hàm số.`
        },
        {
          id: crypto.randomUUID(),
          pageNumber: 2,
          title: 'Chương 1 (tiếp): Thuật toán Gradient Descent',
          text: `## 1.2 Cập nhật trọng số trong Mạng Nơ-ron
Thuật toán Gradient Descent cập nhật vector tham số $\\theta$ theo công thức:

$$\\theta^{(t+1)} = \\theta^{(t)} - \\eta \\nabla L(\\theta^{(t)})$$

Trong đó:
• $\\eta > 0$ là tốc độ học (learning rate).
• $L(\\theta)$ là hàm mất mát (loss function).
• Dấu trừ biểu thị việc di chuyển ngược hướng gradient để tìm cực tiểu toàn cục hoặc địa phương.`
        },
        {
          id: crypto.randomUUID(),
          pageNumber: 3,
          title: 'Chương 2: Ma trận & Phân tích SVD',
          text: `## 2.1 Phân rã giá trị suy biến (SVD)
Mọi ma trận thực $A \\in \\mathbb{R}^{m \\times n}$ đều có thể phân rã thành:

$$A = U \\Sigma V^T$$

• $U \\in \\mathbb{R}^{m \\times m}$: ma trận trực giao chứa các vector riêng trái.
• $\\Sigma \\in \\mathbb{R}^{m \\times n}$: ma trận đường chéo chứa các giá trị suy biến $\\sigma_i \\ge 0$.
• $V \\in \\mathbb{R}^{n \\times n}$: ma trận trực giao chứa các vector riêng phải.`
        },
        {
          id: crypto.randomUUID(),
          pageNumber: 4,
          title: 'Chương 2 (tiếp): Ứng dụng SVD trong Giảm chiều dữ liệu',
          text: `## 2.2 Nén ảnh và Phân tích thành phần chính PCA
Bằng cách giữ lại $k$ giá trị suy biến lớn nhất ($k \\ll \\min(m, n)$), ma trận $A_k$ xấp xỉ tốt nhất cho $A$ theo chuẩn Frobenius:

$$\\min_{\\text{rank}(B) \\le k} \\|A - B\\|_F = \\|A - A_k\\|_F = \\sqrt{\\sum_{i=k+1}^r \\sigma_i^2}$$`
        }
      ]
    },
    {
      id: crypto.randomUUID(),
      type: 'sticky_note',
      title: 'Ghi chú khởi đầu',
      x: 1100,
      y: 90,
      rotation: -2,
      scale: 1,
      zIndex: 2,
      pageCount: 1,
      currentPageIndex: 0,
      stickyText: 'Chào mừng bạn đến với ViTudy — Không gian học thức tích hợp AI 2.5D!\n\n• Kéo chuột trên bàn học để di chuyển góc nhìn (Pan)\n• Cuộn chuột để phóng to/thu nhỏ (Zoom)\n• Bấm phím WASD hoặc phím mũi tên để lia bàn học\n• Nhấp vào sách để mở và lật trang 3D chân thực.',
      stickyColor: '#fef08a',
      pages: []
    }
  ];

  return {
    id: spaceId,
    name: 'Bàn Học Khởi Đầu (Demo)',
    subject: 'Khoa Học Máy Tính & AI',
    description: 'Không gian học tập mẫu trải nghiệm thực tế với sách và ghi chú 2.5D.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: demoItems,
    threads: [],
  };
}
