'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MarketItem } from '@/data/marketMockData';
import { MarketService } from '@/services/MarketService';
import { useViToken } from '@/context/ViTokenContext';
import { useAuth } from '@/hooks/useAuth';
import { getAssetPath } from '@/lib/assets';
import { 
  ArrowLeft, 
  Store, 
  Search, 
  Sparkles, 
  BookOpen, 
  FileText, 
  HelpCircle, 
  Eye, 
  Check, 
  CheckCircle2, 
  X,
  RotateCcw,
  Plus,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function MarketPage() {
  const { wallet, spendTokens, addTokens } = useViToken();
  const { user } = useAuth();

  const [items, setItems] = useState<MarketItem[]>([]);
  const [selectedType, setSelectedType] = useState<'all' | 'book' | 'paper' | 'exam'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [minScore, setMinScore] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'score' | 'price_asc' | 'price_desc'>('newest');
  const [isLoading, setIsLoading] = useState(true);

  // Preview modal state
  const [previewItem, setPreviewItem] = useState<MarketItem | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [returnDestination, setReturnDestination] = useState<'desk' | 'home'>('desk');

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('vitudy_last_view');
      if (stored === 'home' || stored === 'desk') {
        setReturnDestination(stored);
      }
    } catch {
      // ignore
    }
  }, []);

  // New shared item form state
  const [shareTitle, setShareTitle] = useState('');
  const [shareAuthor, setShareAuthor] = useState('Thành (Bạn)');
  const [shareType, setShareType] = useState<'book' | 'paper' | 'exam'>('paper');
  const [shareCategory, setShareCategory] = useState<'math' | 'ai_ml' | 'cs' | 'software' | 'data'>('cs');
  const [shareSummary, setShareSummary] = useState('');
  const [sharePreview, setSharePreview] = useState('');

  const loadListings = () => {
    setIsLoading(true);
    MarketService.getListings({
      category: selectedCategory,
      type: selectedType,
      minScore,
      maxPrice,
      search: searchQuery,
      sort: sortBy,
    }).then((data) => {
      setItems(data);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    loadListings();
  }, [selectedCategory, selectedType, minScore, maxPrice, searchQuery, sortBy]);

  const handlePurchase = (item: MarketItem) => {
    if (wallet.balance < item.price) {
      alert(`Số dư ViToken không đủ (${wallet.balance}/${item.price} V). Vui lòng nạp thêm ViToken hoặc điểm danh để tích lũy.`);
      return;
    }
    const success = spendTokens(item.price, `Mua tài liệu Chợ: ${item.title}`);
    if (success) {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, purchased: true } : i));
      setPurchaseSuccess(`Đã mua thành công "${item.title}". Bạn có thể mở tài liệu ngay trên Bàn học!`);
      setTimeout(() => {
        setPurchaseSuccess(null);
        setPreviewItem(null);
      }, 1500);
    }
  };

  const hasActiveFilters = searchQuery.trim() !== '' || 
    selectedType !== 'all' || 
    selectedCategory !== 'all' || 
    minScore > 0 || 
    maxPrice > 0 || 
    sortBy !== 'newest';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedCategory('all');
    setMinScore(0);
    setMaxPrice(0);
    setSortBy('newest');
  };

  const handleCreateShareItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareTitle.trim() || !shareSummary.trim()) return;

    const newItem: MarketItem = {
      id: `mkt-custom-${Date.now()}`,
      title: shareTitle.trim(),
      author: shareAuthor.trim() || 'Bạn (Tác giả)',
      aiScore: 92,
      price: shareType === 'book' ? 50 : shareType === 'exam' ? 30 : 15,
      type: shareType,
      category: shareCategory,
      date: new Date().toLocaleDateString('vi-VN'),
      summary: shareSummary.trim(),
      previewText: sharePreview.trim() || shareSummary.trim(),
      purchased: true,
      pageCount: shareType === 'book' ? 24 : 1,
      downloadsCount: 1,
      updatedDate: new Date().toLocaleDateString('vi-VN'),
      isAuthorVerified: true,
      aiReviewCount: 1,
    };

    setItems(prev => [newItem, ...prev]);
    addTokens(2, `Chia sẻ tài liệu lên Chợ: ${newItem.title}`);
    setIsShareModalOpen(false);
    setShareTitle('');
    setShareSummary('');
    setSharePreview('');
    alert('Đăng tài liệu thành công! Bạn nhận được +2 ViToken đóng góp tri thức.');
  };

  const CATEGORIES = [
    { id: 'all', label: 'Tất cả môn học' },
    { id: 'ai_ml', label: 'Trí tuệ nhân tạo (AI/ML)' },
    { id: 'math', label: 'Toán học & Giải tích' },
    { id: 'cs', label: 'Khoa học máy tính' },
    { id: 'data', label: 'Khoa học dữ liệu' },
    { id: 'software', label: 'Kỹ thuật phần mềm' },
  ];

  const TYPES = [
    { id: 'all', label: 'Tất cả loại', icon: null },
    { id: 'book', label: 'Sách', icon: BookOpen },
    { id: 'paper', label: 'Tờ tóm tắt', icon: FileText },
    { id: 'exam', label: 'Đề thi', icon: HelpCircle },
  ];

  const getTypeLabel = (type: 'book' | 'paper' | 'exam') => {
    switch (type) {
      case 'book': return 'Sách';
      case 'paper': return 'Tờ tóm tắt';
      case 'exam': return 'Đề thi';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'math': return 'Toán học';
      case 'ai_ml': return 'Trí tuệ nhân tạo';
      case 'cs': return 'Khoa học máy tính';
      case 'software': return 'Kỹ thuật phần mềm';
      case 'data': return 'Khoa học dữ liệu';
      default: return category;
    }
  };

  return (
    <div className="min-h-screen bg-stone-100/70 py-8 px-4 sm:px-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={returnDestination === 'home' ? '/?view=home' : '/?view=desk'}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-700 hover:text-stone-900 transition-colors bg-white px-3.5 py-2 rounded-xl border border-stone-200 shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{returnDestination === 'home' ? 'Về Trang Chủ' : 'Về Bàn Học'}</span>
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center text-[#16A34A] shadow-xs">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-black text-stone-900 leading-tight">Chợ Tài Liệu</h1>
              <p className="text-[11px] text-stone-600">
                Kho tri thức mở ViTudy — Khám phá và trao đổi tài liệu học tập cùng cộng đồng.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-stone-900 hover:bg-black px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Chia sẻ tài liệu</span>
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-stone-200 rounded-xl shadow-xs">
              {/* Official ViToken coin icon */}
              <img
                src={getAssetPath('/icons/vitoken.svg')}
                alt="ViToken"
                width={20}
                height={20}
                className="w-5 h-5 rounded-full object-contain shrink-0"
                style={{ width: '20px', height: '20px', maxWidth: '20px', maxHeight: '20px' }}
              />
              <span className="text-xs text-stone-600 font-medium">Ví:</span>
              <span className="font-mono font-black text-xs text-[#16A34A]">{wallet.balance} ViToken</span>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-sm space-y-3.5">
          {/* Row 1: Search & Type Tabs */}
          <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full lg:w-96">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm kiếm tài liệu, tác giả, bài giải..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 outline-none focus:border-stone-800 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Type selector tabs */}
            <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-2xl w-full lg:w-auto overflow-x-auto no-scrollbar">
              {TYPES.map((t) => {
                const Icon = t.icon;
                const isSelected = selectedType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedType(t.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      isSelected
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {Icon && <Icon className="w-3.5 h-3.5 text-stone-600" />}
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 2: Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-stone-100">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  selectedCategory === cat.id
                    ? 'bg-[#16A34A] text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200/80'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Row 3: Sub-filters (Min Score, Max Price, Sort & Results count) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-stone-100 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              {/* Min score */}
              <select
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="bg-stone-50 border border-stone-200 text-stone-700 py-1.5 px-2.5 rounded-xl text-xs font-medium focus:outline-none focus:border-stone-400 cursor-pointer"
              >
                <option value={0}>Tất cả điểm AI</option>
                <option value={80}>Điểm AI ≥ 80</option>
                <option value={90}>Điểm AI ≥ 90 (Xuất sắc)</option>
              </select>

              {/* Max price */}
              <select
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="bg-stone-50 border border-stone-200 text-stone-700 py-1.5 px-2.5 rounded-xl text-xs font-medium focus:outline-none focus:border-stone-400 cursor-pointer"
              >
                <option value={0}>Tất cả mức giá</option>
                <option value={15}>≤ 15 ViToken</option>
                <option value={30}>≤ 30 ViToken</option>
                <option value={50}>≤ 50 ViToken</option>
              </select>

              {/* Sort by */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-stone-50 border border-stone-200 text-stone-700 py-1.5 px-2.5 rounded-xl text-xs font-medium focus:outline-none focus:border-stone-400 cursor-pointer"
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="score">Điểm AI cao nhất</option>
                <option value="price_asc">Giá tăng dần</option>
                <option value="price_desc">Giá giảm dần</option>
              </select>

              {/* Reset button */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="flex items-center gap-1 text-[11.5px] font-bold text-[#16A34A] hover:text-[#15803D] bg-green-50 hover:bg-green-100 border border-green-200 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Đặt lại</span>
                </button>
              )}
            </div>

            <div className="text-[11px] font-bold text-stone-600 bg-stone-100 px-3 py-1.5 rounded-xl">
              {items.length} tài liệu
            </div>
          </div>
        </div>

        {/* Listing Grid (3 Columns Balanced) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoading ? (
            <div className="col-span-full py-16 text-center text-xs text-stone-500">
              Đang tải danh mục tài liệu...
            </div>
          ) : items.length === 0 ? (
            <div className="col-span-full py-16 text-center text-xs text-stone-500 bg-white border border-stone-200 rounded-3xl p-8">
              <Search className="w-8 h-8 mx-auto mb-2 text-stone-300" />
              <p className="text-sm font-semibold text-stone-700">Không tìm thấy tài liệu phù hợp</p>
              <p className="text-xs text-stone-500 mt-1">Hãy thử xóa bộ lọc hoặc đổi từ khóa tìm kiếm</p>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-bold text-[#16A34A] bg-green-50 hover:bg-green-100 border border-green-200 px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Đặt lại tất cả bộ lọc</span>
                </button>
              )}
            </div>
          ) : (
            items.map((item) => {
              const pageCount = item.pageCount || (item.pages ? item.pages.length : (item.type === 'book' ? 48 : (item.type === 'exam' ? 4 : 1)));
              const downloadsCount = item.downloadsCount || (item.aiScore * 3 + 12);
              const updatedDate = item.updatedDate || item.date;

              return (
                <div
                  key={item.id}
                  className="bg-white border border-stone-200 rounded-3xl p-5 shadow-sm flex flex-col justify-between hover:border-stone-300 hover:shadow-md transition-all group"
                >
                  <div>
                    {/* Header: Document Type Badge + AI Score */}
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[10.5px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 uppercase tracking-wide">
                        {getTypeLabel(item.type)}
                      </span>

                      <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shadow-2xs">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        <span>AI: {item.aiScore}/100</span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-black text-stone-900 group-hover:text-[#16A34A] transition-colors line-clamp-2 leading-snug mb-1.5">
                      {item.title}
                    </h3>

                    {/* Author & Verified Badge */}
                    <div className="flex items-center gap-1 text-xs text-stone-700 mb-2">
                      <span className="text-stone-500">Tác giả:</span>
                      <strong className="font-semibold text-stone-800">{item.author}</strong>
                      <span title="Tác giả xác thực">
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 ml-0.5 inline" />
                      </span>
                    </div>

                    {/* Trust Metadata */}
                    <div className="text-[11px] text-stone-500 flex flex-wrap items-center gap-1.5 mb-3 font-medium">
                      <span>{pageCount} trang</span>
                      <span>•</span>
                      <span>{downloadsCount} lượt mua</span>
                      <span>•</span>
                      <span>{updatedDate}</span>
                    </div>

                    {/* Summary */}
                    <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed mb-4">
                      {item.summary}
                    </p>
                  </div>

                  {/* Footer: Price & Actions */}
                  <div className="pt-3.5 border-t border-stone-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-mono font-black text-[#16A34A]">
                      <img 
                        src={getAssetPath('/icons/vitoken.svg')} 
                        alt="ViToken" 
                        width={18} 
                        height={18} 
                        className="w-4.5 h-4.5 rounded-full object-contain shrink-0" 
                        style={{ width: '18px', height: '18px', maxWidth: '18px', maxHeight: '18px' }}
                      />
                      <span className="text-base">{item.price}</span>
                      <span className="text-xs">ViToken</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPreviewItem(item)}
                        className="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-stone-600" />
                        <span>Xem thử</span>
                      </button>

                      {item.purchased ? (
                        <Link
                          href="/?view=desk"
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Đã sở hữu</span>
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handlePurchase(item)}
                          className="px-3 py-1.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold flex items-center gap-1 transition-all shadow-xs cursor-pointer active:scale-95"
                        >
                          <span>Mua {item.price} V</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal Xem Trước Tài Liệu Chi Tiết */}
      {previewItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-stone-300 rounded-3xl w-full max-w-xl p-6 shadow-2xl relative text-stone-900 animate-fade-in font-sans max-h-[90vh] flex flex-col">
            <button
              onClick={() => setPreviewItem(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-3">
              <span className="text-[10.5px] font-bold font-mono px-2 py-0.5 rounded-full bg-green-50 text-[#16A34A] border border-green-200 uppercase">
                Bản xem trước bảo mật • {getTypeLabel(previewItem.type)}
              </span>
              <h2 className="text-base font-black text-stone-900 mt-2 leading-tight">
                {previewItem.title}
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 mt-1">
                <span>Tác giả: <strong className="text-stone-700 font-semibold">{previewItem.author}</strong></span>
                <span>•</span>
                <span>Điểm AI: <strong className="text-emerald-700 font-mono">{previewItem.aiScore}/100</strong></span>
                <span>•</span>
                <span>{getCategoryLabel(previewItem.category)}</span>
              </div>
            </div>

            {/* Scrollable Preview Content */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4">
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 text-xs text-stone-700 leading-relaxed">
                <div className="font-bold text-stone-800 text-[11px] mb-1 uppercase tracking-wide">
                  Tóm tắt trọng tâm:
                </div>
                <p>{previewItem.summary}</p>
              </div>

              {/* Preview Content Area with static blurred teaser */}
              <div className="relative bg-stone-50 border border-stone-200 rounded-2xl p-4 text-xs text-stone-700 leading-relaxed max-h-48 overflow-hidden">
                <div className="font-bold text-stone-800 text-[11px] mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-stone-500" />
                  <span>Đoạn trích dẫn xem trước:</span>
                </div>
                <p className="whitespace-pre-line font-mono text-xs text-stone-700 leading-relaxed">
                  {previewItem.previewText}
                </p>

                {/* Static blur gradient barrier */}
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-stone-100 via-stone-100/80 to-transparent flex items-end justify-center pb-2">
                  <span className="text-[11px] font-bold text-stone-500">
                    --- Mở khóa đầy đủ toàn bộ tài liệu sau khi sở hữu ---
                  </span>
                </div>
              </div>

              {previewItem.pages && previewItem.pages.length > 0 && (
                <div className="border border-stone-200 rounded-2xl p-3.5 bg-white space-y-2">
                  <div className="font-bold text-stone-800 text-[11px] uppercase tracking-wide flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-stone-500" />
                    <span>Mục lục các chương ({previewItem.pages.length} phần):</span>
                  </div>
                  <ul className="space-y-1 text-xs text-stone-600 list-disc list-inside">
                    {previewItem.pages.map((p, idx) => (
                      <li key={idx} className="font-medium text-stone-700">
                        {p.title || `Trang ${idx + 1}`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {purchaseSuccess ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{purchaseSuccess}</span>
              </div>
            ) : (
              <div className="flex items-center justify-between pt-3 border-t border-stone-200">
                <div className="flex items-center gap-1.5 font-mono font-black text-base text-[#16A34A]">
                  <img 
                    src={getAssetPath('/icons/vitoken.svg')} 
                    alt="ViToken" 
                    width={20} 
                    height={20} 
                    className="w-5 h-5 rounded-full object-contain shrink-0" 
                    style={{ width: '20px', height: '20px', maxWidth: '20px', maxHeight: '20px' }}
                  />
                  <span>{previewItem.price}</span>
                  <span className="text-xs">ViToken</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewItem(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 cursor-pointer"
                  >
                    Đóng
                  </button>

                  {previewItem.purchased ? (
                    <Link
                      href="/?view=desk"
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>Mở trên bàn học</span>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handlePurchase(previewItem)}
                      className="px-5 py-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                    >
                      Mua tài liệu ngay
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Chia Sẻ Tài Liệu Lên Chợ */}
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-stone-300 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative text-stone-900 animate-fade-in font-sans">
            <button
              onClick={() => setIsShareModalOpen(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <span className="text-[10.5px] font-bold font-mono px-2 py-0.5 rounded-full bg-green-50 text-[#16A34A] border border-green-200 uppercase">
                Đóng góp tri thức
              </span>
              <h2 className="text-base font-black text-stone-900 mt-2">
                Chia Sẻ Tài Liệu Lên Chợ
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Chia sẻ ghi chú, sách tóm tắt hoặc đề thi bổ ích. Nhận ngay +2 ViToken đóng góp!
              </p>
            </div>

            <form onSubmit={handleCreateShareItem} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-bold mb-1">Tên tài liệu / Tiêu đề:</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Tóm tắt 10 bài toán Tối ưu hóa trong AI..."
                  value={shareTitle}
                  onChange={e => setShareTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:border-stone-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Loại tài liệu:</label>
                  <select
                    value={shareType}
                    onChange={e => setShareType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:border-stone-800 cursor-pointer"
                  >
                    <option value="paper">Tờ tóm tắt (15 V)</option>
                    <option value="book">Sách / Giáo trình (50 V)</option>
                    <option value="exam">Đề thi trắc nghiệm (30 V)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">Môn học / Lĩnh vực:</label>
                  <select
                    value={shareCategory}
                    onChange={e => setShareCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:border-stone-800 cursor-pointer"
                  >
                    <option value="cs">Khoa học máy tính</option>
                    <option value="ai_ml">Trí tuệ nhân tạo (AI/ML)</option>
                    <option value="math">Toán học & Giải tích</option>
                    <option value="data">Khoa học dữ liệu</option>
                    <option value="software">Kỹ thuật phần mềm</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Tóm tắt ngắn (1-2 câu):</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Mô tả nội dung trọng tâm và giá trị tài liệu mang lại..."
                  value={shareSummary}
                  onChange={e => setShareSummary(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:border-stone-800"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Đoạn trích xem trước (cho người mua xem thử):</label>
                <textarea
                  rows={3}
                  placeholder="Đoạn trích dẫn hoặc dàn ý quan trọng..."
                  value={sharePreview}
                  onChange={e => setSharePreview(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:border-stone-800"
                />
              </div>

              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-black text-white font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  Đăng lên Chợ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}