import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\Vit\\.gemini\\antigravity\\brain\\fbb976ad-a049-4320-8f1d-4fc45e9ec5b9';
const JOURNEY_DIR = path.join(ARTIFACT_DIR, 'student-journey');

if (!fs.existsSync(JOURNEY_DIR)) {
  fs.mkdirSync(JOURNEY_DIR, { recursive: true });
}

class CdpSession {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const { resolve, reject } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) {
            reject(new Error(msg.error.message || JSON.stringify(msg.error)));
          } else {
            resolve(msg.result);
          }
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      const timer = setTimeout(() => {
        this.callbacks.delete(id);
        resolve({});
      }, 8000);
      this.callbacks.set(id, { 
        resolve: (res) => { clearTimeout(timer); resolve(res); }, 
        reject: (err) => { clearTimeout(timer); reject(err); } 
      });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async capture(name) {
    const shot = await this.send('Page.captureScreenshot', { format: 'png' });
    if (!shot || !shot.data) {
      console.warn(`⚠️ Chụp ảnh ${name} thất bại!`);
      return '';
    }
    const buf = Buffer.from(shot.data, 'base64');
    const outPath = path.join(JOURNEY_DIR, `${name}.png`);
    fs.writeFileSync(outPath, buf);
    console.log(`📸 [Đã chụp] ${name}.png (${Math.round(buf.length / 1024)} KB)`);
    return outPath;
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res?.result?.value;
  }

  async clickSelector(selector, textMatch = null) {
    const box = await this.eval(`
      (() => {
        const els = Array.from(document.querySelectorAll('${selector}'));
        let target = els[0];
        if ('${textMatch || ''}') {
          target = els.find(e => e.textContent && e.textContent.includes('${textMatch}')) || target;
        }
        if (!target) return null;
        target.scrollIntoView({ behavior: 'instant', block: 'center' });
        const r = target.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, found: true };
      })()
    `);

    if (!box || !box.found) {
      console.warn(`⚠️ Không tìm thấy phần tử: ${selector} (text: ${textMatch})`);
      return false;
    }

    await this.send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      x: Math.round(box.x),
      y: Math.round(box.y),
      button: 'left',
      clickCount: 1,
      buttons: 1,
    });
    await new Promise(r => setTimeout(r, 60));
    await this.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x: Math.round(box.x),
      y: Math.round(box.y),
      button: 'left',
      clickCount: 1,
      buttons: 0,
    });
    return true;
  }

  async dragMouse(x1, y1, x2, y2) {
    try {
      await this.send('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x: Math.round(x1),
        y: Math.round(y1),
      });
      await this.send('Input.dispatchMouseEvent', {
        type: 'mousePressed',
        x: Math.round(x1),
        y: Math.round(y1),
        button: 'left',
        clickCount: 1,
      });
      await new Promise(r => setTimeout(r, 80));
      await this.send('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x: Math.round(x2),
        y: Math.round(y2),
        button: 'left',
      });
      await new Promise(r => setTimeout(r, 80));
      await this.send('Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        x: Math.round(x2),
        y: Math.round(y2),
        button: 'left',
        clickCount: 1,
      });
    } catch (e) {
      console.warn('dragMouse error:', e);
    }
  }

  async ensureAllModalsClosed() {
    await this.eval(`
      (() => {
        const closeSelectors = [
          '#close-study-tools-modal',
          '#close-topup-modal',
          '#close-market-modal',
          '#close-streak-modal',
          '#close-history-modal',
          '#close-ai-modal',
          'button[aria-label="Đóng STudy"]',
          'button[aria-label="Đóng nạp ViToken"]',
          'button[aria-label="Đóng chợ tài liệu"]',
          'button[aria-label="Đóng"]',
          'button[title="Đóng STudy"]'
        ];
        closeSelectors.forEach(sel => {
          const btn = document.querySelector(sel);
          if (btn) btn.click();
        });
      })()
    `);
    await new Promise(r => setTimeout(r, 400));
  }
}

async function runStudentJourney() {
  console.log('🚀 BẮT ĐẦU HÀNH TRÌNH SINH VIÊN MÙA THI TRẢI NGHIỆM VITUDY...');
  const res = await fetch('http://127.0.0.1:9222/json/list');
  const pages = await res.json();
  const page = pages.find(p => p.url.includes('localhost:3000'));
  if (!page) {
    console.error('❌ Không tìm thấy tab localhost:3000 trên Chrome CDP!');
    return;
  }

  const cdp = new CdpSession(page.webSocketDebuggerUrl);
  await cdp.connect();
  console.log('✅ Đã kết nối Chrome CDP thành công!');

  // =========================================================================
  // BƯỚC 1: SINH VIÊN LẦN ĐẦU TRUY CẬP LANDING PAGE
  // =========================================================================
  console.log('\n--- BƯỚC 1: LANDING PAGE & TƯƠNG TÁC THỰC TẾ ---');
  // Chuyển trang về Landing Page như một sinh viên lần đầu truy cập
  await cdp.eval(`
    localStorage.removeItem('vitudy_has_visited_desk');
    window.location.href = '/?view=landing';
  `);
  await new Promise(r => setTimeout(r, 2200));

  console.log('1.1. Chụp Hero Section...');
  await cdp.capture('b01_01_landing_hero');

  // Thử kéo mẩu note vàng demo trên mockup hero
  console.log('1.2. Sinh viên thử kéo nhẹ mẩu giấy note vàng trên mockup...');
  const notePos = await cdp.eval(`
    (() => {
      const note = document.querySelector('.transform-gpu, [class*="bg-amber-100"], [class*="rotate-2"]');
      if (note) {
        const r = note.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      }
      return { x: 750, y: 320 };
    })()
  `);
  await cdp.dragMouse(notePos.x, notePos.y, notePos.x + 35, notePos.y + 20, 8);
  await new Promise(r => setTimeout(r, 600));
  await cdp.capture('b01_02_landing_note_dragged');

  // Cuộn xuống mục Tính năng cốt lõi
  console.log('1.3. Sinh viên cuộn xem 4 tính năng phục vụ mùa thi...');
  await cdp.eval(`
    const feat = document.getElementById('features');
    if (feat) feat.scrollIntoView({ behavior: 'instant', block: 'start' });
    else window.scrollBy({ top: 650, behavior: 'instant' });
  `);
  await new Promise(r => setTimeout(r, 800));
  await cdp.capture('b01_03_features_section');

  // Cuộn xuống mục Chi tiết kỹ thuật & mở rộng xem
  console.log('1.4. Sinh viên mở rộng xem mục Chi tiết kỹ thuật...');
  await cdp.eval(`
    const techBtn = document.querySelector('button:has(svg.lucide-chevron-down), button:has(svg.lucide-chevron-up)');
    if (techBtn) {
      techBtn.scrollIntoView({ behavior: 'instant', block: 'center' });
      techBtn.click();
    }
  `);
  await new Promise(r => setTimeout(r, 800));
  await cdp.capture('b01_04_tech_details_expanded');

  // Cuộn xuống xem Bảng giá các gói học tập
  console.log('1.5. Sinh viên xem Bảng giá gói nạp ViToken...');
  await cdp.eval(`
    const pricing = document.getElementById('pricing');
    if (pricing) pricing.scrollIntoView({ behavior: 'instant', block: 'start' });
    else window.scrollBy({ top: 750, behavior: 'instant' });
  `);
  await new Promise(r => setTimeout(r, 800));
  await cdp.capture('b01_05_pricing_plans');

  // Cuộn xuống Chân trang
  console.log('1.6. Sinh viên cuộn xem Chân trang (Footer)...');
  await cdp.eval(`window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });`);
  await new Promise(r => setTimeout(r, 800));
  await cdp.capture('b01_06_footer_info');

  // =========================================================================
  // BƯỚC 2: SINH VIÊN BẤM ĐĂNG NHẬP BẰNG GIAO DIỆN
  // =========================================================================
  console.log('\n--- BƯỚC 2: ĐĂNG NHẬP BẰNG GIAO DIỆN ---');
  // Cuộn lại lên trên cùng
  await cdp.eval(`window.scrollTo({ top: 0, behavior: 'instant' });`);
  await new Promise(r => setTimeout(r, 500));

  // Nhấp vào nút "Đăng nhập" ở góc trên bên phải thanh menu
  console.log('Sinh viên nhấp vào nút Đăng nhập trên thanh điều hướng...');
  await cdp.clickSelector('a[href="/auth"], button', 'Đăng nhập');
  await new Promise(r => setTimeout(r, 1600));
  await cdp.capture('b02_01_auth_screen');

  // Sinh viên điền email và mật khẩu
  console.log('Sinh viên nhập thông tin tài khoản...');
  await cdp.eval(`
    const emailInput = document.querySelector('input[type="email"]');
    if (emailInput) {
      emailInput.value = 'sinhvien@vitudy.edu.vn';
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const pwdInput = document.querySelector('input[type="password"]');
    if (pwdInput) {
      pwdInput.value = 'matkhau123';
      pwdInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  `);
  await new Promise(r => setTimeout(r, 500));

  // Bấm nút "Về bàn học (Chế độ khách)" hoặc nút Vào bàn học
  console.log('Sinh viên bấm nút vào bàn học trải nghiệm...');
  await cdp.clickSelector('a[href="/"], a', 'Về bàn học');
  await new Promise(r => setTimeout(r, 2200));
  await cdp.capture('b02_02_desk_first_entry');

  // Hoàn tất Onboarding Tour nếu có
  console.log('Sinh viên bấm Tiếp tục hoàn tất tour...');
  await cdp.clickSelector('button', 'Tiếp tục');
  await new Promise(r => setTimeout(r, 600));
  await cdp.clickSelector('button', 'Tiếp tục');
  await new Promise(r => setTimeout(r, 600));
  await cdp.eval(`
    const skipBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Bỏ qua') || b.textContent.includes('Bắt đầu'));
    if (skipBtn) skipBtn.click();
  `);
  await new Promise(r => setTimeout(r, 800));
  await cdp.capture('b02_03_desk_ready');

  // =========================================================================
  // BƯỚC 3: THỬ MỌI NÚT TRÊN CÁC ĐẢO HUD (CÂY ĐỆ QUY)
  // =========================================================================
  console.log('\n--- BƯỚC 3: KHÁM PHÁ CÁC ĐẢO HUD ---');
  // 3.1. TopLeftNav: Mở danh sách bàn học (Spaces)
  console.log('3.1. Nhấp tên bàn học mở danh sách bàn...');
  await cdp.eval(`
    const spaceBtn = document.querySelector('div[class*="border-r"] + div button');
    if (spaceBtn) spaceBtn.click();
  `);
  await new Promise(r => setTimeout(r, 700));
  await cdp.capture('b03_01_spaces_dropdown');

  // Đóng dropdown bàn học
  await cdp.eval(`
    const spaceBtn = document.querySelector('div[class*="border-r"] + div button');
    if (spaceBtn) spaceBtn.click();
  `);
  await new Promise(r => setTimeout(r, 500));

  // 3.2. TopRightWallet: Điểm danh Streak
  console.log('3.2. Sinh viên nhấp vào ngọn lửa chuỗi học tập (Streak)...');
  await cdp.eval(`
    const flameBtn = document.querySelector('button[title*="Chuỗi"], button:has(svg.lucide-flame)');
    if (flameBtn) flameBtn.click();
  `);
  await new Promise(r => setTimeout(r, 800));
  await cdp.capture('b03_02_streak_modal');

  // Đóng Streak modal
  await cdp.eval(`
    const closeBtn = document.querySelector('#close-streak-modal, button[aria-label="Đóng điểm danh"]');
    if (closeBtn) closeBtn.click();
  `);
  await new Promise(r => setTimeout(r, 500));

  // 3.3. LeftCreationBar: Chọn bút dạ quang (Highlighter)
  console.log('3.3. Sinh viên nhấp chọn công cụ Bút dạ quang...');
  await cdp.eval(`
    const tools = Array.from(document.querySelectorAll('div[class*="fixed left-1"] button'));
    if (tools[2]) tools[2].click();
  `);
  await new Promise(r => setTimeout(r, 600));
  await cdp.capture('b03_03_highlighter_selected');

  // Chuyển lại con trỏ chuột
  await cdp.eval(`
    const tools = Array.from(document.querySelectorAll('div[class*="fixed left-1"] button'));
    if (tools[0]) tools[0].click();
  `);
  await new Promise(r => setTimeout(r, 500));

  // 3.4. BottomRightToolkit: Bật đồng hồ Pomodoro
  console.log('3.4. Sinh viên bấm nút Đồng hồ tập trung Pomodoro...');
  await cdp.eval(`
    const pomoBtn = document.querySelector('button[title*="Pomodoro"], button[title*="đồng hồ"], button:has(svg.lucide-clock)');
    if (pomoBtn) pomoBtn.click();
  `);
  await new Promise(r => setTimeout(r, 800));
  await cdp.capture('b03_04_pomodoro_activated');

  // Tắt Pomodoro
  await cdp.eval(`
    const pomoBtn = document.querySelector('button[title*="Pomodoro"], button[title*="đồng hồ"], button:has(svg.lucide-clock)');
    if (pomoBtn) pomoBtn.click();
  `);
  await new Promise(r => setTimeout(r, 500));

  // =========================================================================
  // BƯỚC 4: TẢI TÀI LIỆU DÀY TẠO SÁCH MỞ ĐÔI (ĐỌC, LẬT TRANG, BÌA, TẬP TRUNG)
  // =========================================================================
  console.log('\n--- BƯỚC 4: TƯƠNG TÁC VỚI SÁCH GIÁO TRÌNH 2.5D ---');
  console.log('4.1. Lật sang trang tiếp theo...');
  await cdp.eval(`
    const nextBtn = document.querySelector('button[title*="trang sau"], button[title*="Trang sau"], button:has(svg.lucide-chevron-right)');
    if (nextBtn) nextBtn.click();
  `);
  await new Promise(r => setTimeout(r, 1200));
  await cdp.capture('b04_01_book_page_flipped');

  // Đổi màu bìa sách qua Bookmark Màu Bìa
  console.log('4.2. Mở bảng đổi màu bìa sách...');
  await cdp.eval(`
    const coverBtn = document.querySelector('button[title*="màu bìa"], button[title*="Màu bìa"]');
    if (coverBtn) coverBtn.click();
  `);
  await new Promise(r => setTimeout(r, 700));
  await cdp.capture('b04_02_cover_palette_opened');

  // Chọn màu bìa Xanh Navy
  console.log('4.3. Chọn màu bìa Xanh Navy...');
  await cdp.eval(`
    const dots = document.querySelectorAll('button[title*="Navy"], button[title*="Xanh Nước Biển"]');
    if (dots.length > 0) dots[0].click();
  `);
  await new Promise(r => setTimeout(r, 800));
  await cdp.capture('b04_03_cover_navy_applied');

  // Bật chế độ Tập trung đọc sách
  console.log('4.4. Kích hoạt Chế độ tập trung đọc...');
  await cdp.eval(`
    const focusBtn = document.querySelector('button[title*="Tập trung"], button:has(svg.lucide-eye)');
    if (focusBtn) focusBtn.click();
  `);
  await new Promise(r => setTimeout(r, 800));
  await cdp.capture('b04_04_focus_reading_active');

  // Thoát chế độ tập trung
  await cdp.eval(`
    const exitFocus = Array.from(document.querySelectorAll('button, div')).find(el => el.textContent && (el.textContent.includes('nhấn để thoát') || el.textContent.includes('Tập trung')));
    if (exitFocus) exitFocus.click();
  `);
  await new Promise(r => setTimeout(r, 600));

  // =========================================================================
  // BƯỚC 5: TÀI LIỆU TỜ GIẤY A4
  // =========================================================================
  console.log('\n--- BƯỚC 5: TÀI LIỆU TỜ GIẤY A4 ---');
  console.log('Sinh viên quan sát tờ giấy ôn tập A4 trên bàn học...');
  await cdp.eval(`
    const paper = document.querySelector('div[data-desk-item="paper"], div:has(h4)');
    if (paper) paper.scrollIntoView({ behavior: 'instant', block: 'center' });
  `);
  await new Promise(r => setTimeout(r, 600));
  await cdp.capture('b05_01_paper_sheet_inspected');

  // =========================================================================
  // BƯỚC 6: TẠO GHI CHÚ (STICKY NOTE) & GÕ NỘI DUNG
  // =========================================================================
  console.log('\n--- BƯỚC 6: TẠO STICKY NOTE ---');
  console.log('Sinh viên bấm nút tạo Sticky Note...');
  await cdp.eval(`
    const noteBtn = document.querySelector('button[title*="ghi chú"], button[title*="Sticky Note"], button:has(svg.lucide-sticky-note)');
    if (noteBtn) noteBtn.click();
  `);
  await new Promise(r => setTimeout(r, 1000));
  await cdp.capture('b06_01_sticky_note_created');

  console.log('Sinh viên nhập nội dung vào note...');
  await cdp.eval(`
    const textareas = document.querySelectorAll('textarea');
    if (textareas.length > 0) {
      const ta = textareas[textareas.length - 1];
      ta.focus();
      ta.value = 'Lịch thi kết thúc học phần: Giải tích sáng thứ Hai 15/11, Machine Learning chiều thứ Năm 18/11!';
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    }
  `);
  await new Promise(r => setTimeout(r, 600));
  await cdp.capture('b06_02_sticky_note_typed');

  // =========================================================================
  // BƯỚC 7: VÀO CHỢ TÀI LIỆU, DUYỆT TÀI LIỆU & BÁO THIẾU TIỀN
  // =========================================================================
  console.log('\n--- BƯỚC 7: CHỢ TÀI LIỆU & THIẾU VITOKEN ---');
  await cdp.ensureAllModalsClosed();

  console.log('Sinh viên mở Chợ Tài Liệu từ thanh TopRightWallet...');
  await cdp.eval(`
    const marketBtn = document.querySelector('#market-trigger-btn, button[title="Chợ Tài Liệu"]');
    if (marketBtn) marketBtn.click();
  `);
  await new Promise(r => setTimeout(r, 1200));
  await cdp.capture('b07_01_market_opened');

  console.log('Sinh viên nhấp Xem trước tài liệu...');
  await cdp.clickSelector('button', 'Xem trước');
  await new Promise(r => setTimeout(r, 1000));
  await cdp.capture('b07_02_market_doc_preview');

  console.log('Sinh viên bấm Mua tài liệu ngay (khi chưa đủ tiền)...');
  await cdp.clickSelector('button', 'Mua tài liệu ngay');
  await new Promise(r => setTimeout(r, 800));
  await cdp.capture('b07_03_market_insufficient_balance');

  // Đóng modal xem trước và đóng Chợ
  await cdp.clickSelector('button', 'Đóng');
  await new Promise(r => setTimeout(r, 500));
  await cdp.eval(`
    const closeMarket = document.querySelector('#close-market-modal');
    if (closeMarket) closeMarket.click();
  `);
  await new Promise(r => setTimeout(r, 600));

  // =========================================================================
  // BƯỚC 8: NẠP TIỀN VITOKEN QUA VIETQR VÀ MUA TÀI LIỆU THÀNH CÔNG
  // =========================================================================
  console.log('\n--- BƯỚC 8: NẠP VITOKEN & MUA TÀI LIỆU THÀNH CÔNG ---');
  await cdp.ensureAllModalsClosed();

  console.log('Sinh viên nhấp nút "+" trên ví mở modal nạp tiền...');
  await cdp.eval(`
    const topupBtn = document.querySelector('#topup-trigger-btn, button[title*="Nạp ViToken"]');
    if (topupBtn) topupBtn.click();
  `);
  await new Promise(r => setTimeout(r, 1200));
  await cdp.capture('b08_01_topup_modal_vietqr');

  console.log('Sinh viên bấm Nạp thử 50 ViToken...');
  await cdp.eval(`
    const demoBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Nạp thử 50 ViToken'));
    if (demoBtn) demoBtn.click();
  `);
  await new Promise(r => setTimeout(r, 1600));
  await cdp.capture('b08_02_tokens_credited_success');

  // Đóng dứt khoát modal nạp tiền!
  console.log('Đóng dứt khoát TopUpModal...');
  await cdp.eval(`
    const closeTopup = document.querySelector('#close-topup-modal');
    if (closeTopup) closeTopup.click();
  `);
  await new Promise(r => setTimeout(r, 800));
  await cdp.ensureAllModalsClosed();

  // Mở lại Chợ để mua tài liệu thành công
  console.log('Sinh viên mở lại Chợ với số dư mới...');
  await cdp.eval(`
    const marketBtn = document.querySelector('#market-trigger-btn');
    if (marketBtn) marketBtn.click();
  `);
  await new Promise(r => setTimeout(r, 1200));
  await cdp.capture('b08_03_market_ready_with_balance');

  // Bấm Mua ngay tài liệu
  console.log('Sinh viên bấm Mua ngay tài liệu...');
  await cdp.eval(`
    const buyBtns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('Mua') || b.textContent.includes('Nhận'));
    if (buyBtns[0]) buyBtns[0].click();
  `);
  await new Promise(r => setTimeout(r, 1200));
  await cdp.capture('b08_04_item_purchased_success');

  // Đóng Chợ hoàn toàn
  await cdp.eval(`
    const closeMarket = document.querySelector('#close-market-modal');
    if (closeMarket) closeMarket.click();
  `);
  await new Promise(r => setTimeout(r, 800));
  await cdp.ensureAllModalsClosed();

  // =========================================================================
  // BƯỚC 9: TẠO ĐỀ TRẮC NGHIỆM & LÀM BÀI ĐẾN HẾT
  // =========================================================================
  console.log('\n--- BƯỚC 9: THI TRẮC NGHIỆM & CHẤM ĐIỂM ---');
  await cdp.ensureAllModalsClosed();

  console.log('9.1. Sinh viên nhấp bookmark Tóm tắt mở STudy...');
  await cdp.eval(`
    const studyTab = document.querySelector('button[title*="Tóm tắt"], button:has(svg.lucide-sparkles)');
    if (studyTab) studyTab.click();
  `);
  await new Promise(r => setTimeout(r, 1200));
  await cdp.capture('b09_01_study_modal_summary');

  console.log('9.2. Sinh viên chuyển sang tab Trắc Nghiệm...');
  await cdp.eval(`
    const quizTab = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Trắc Nghiệm') || b.textContent.includes('Trắc nghiệm'));
    if (quizTab) quizTab.click();
  `);
  await new Promise(r => setTimeout(r, 800));

  console.log('9.3. Sinh viên bấm "Sinh Câu Hỏi" tạo đề thi trắc nghiệm...');
  await cdp.eval(`
    const genBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Sinh Câu Hỏi') || b.textContent.includes('Tạo Đề Mới'));
    if (genBtn) genBtn.click();
  `);
  await new Promise(r => setTimeout(r, 1000));
  await cdp.capture('b09_02_quiz_questions_generated');

  console.log('9.4. Sinh viên lần lượt chọn từng đáp án trắc nghiệm...');
  await cdp.eval(`
    const questions = document.querySelectorAll('div[class*="rounded-xl border border-slate-200"]');
    questions.forEach(q => {
      const firstOpt = q.querySelector('button');
      if (firstOpt) firstOpt.click();
    });
  `);
  await new Promise(r => setTimeout(r, 800));
  await cdp.capture('b09_03_quiz_options_selected');

  console.log('9.5. Sinh viên bấm "Chấm Điểm Ngay"...');
  await cdp.eval(`
    const gradeBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Chấm Điểm Ngay'));
    if (gradeBtn) gradeBtn.click();
  `);
  await new Promise(r => setTimeout(r, 1000));
  await cdp.capture('b09_04_quiz_graded_result');

  // Đóng STudy hoàn toàn
  await cdp.eval(`
    const closeStudy = document.querySelector('#close-study-tools-modal');
    if (closeStudy) closeStudy.click();
  `);
  await new Promise(r => setTimeout(r, 800));
  await cdp.ensureAllModalsClosed();

  // =========================================================================
  // BƯỚC 10: TẠO & ÔN FLASHCARD (SM-2)
  // =========================================================================
  console.log('\n--- BƯỚC 10: ÔN TẬP THẺ GHI NHỚ FLASHCARD ---');
  await cdp.ensureAllModalsClosed();

  console.log('10.1. Sinh viên mở lại STudy vào tab Thẻ Ghi Nhớ...');
  await cdp.eval(`
    const studyTab = document.querySelector('button[title*="Tóm tắt"], button:has(svg.lucide-sparkles)');
    if (studyTab) studyTab.click();
  `);
  await new Promise(r => setTimeout(r, 1200));

  await cdp.eval(`
    const flashTab = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Thẻ Ghi Nhớ') || b.textContent.includes('Flashcard'));
    if (flashTab) flashTab.click();
  `);
  await new Promise(r => setTimeout(r, 800));

  console.log('10.2. Sinh viên bấm "Trích Xuất Flashcards"...');
  await cdp.eval(`
    const extractBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Trích Xuất Flashcards'));
    if (extractBtn) extractBtn.click();
  `);
  await new Promise(r => setTimeout(r, 1000));
  await cdp.capture('b10_01_flashcard_front_active');

  console.log('10.3. Sinh viên nhấp vào thẻ lật xem câu trả lời ở mặt sau...');
  await cdp.eval(`
    const card = document.querySelector('div[class*="perspective"], div[class*="cursor-pointer"]:has(p)');
    if (card) card.click();
  `);
  await new Promise(r => setTimeout(r, 800));
  await cdp.capture('b10_02_flashcard_back_flipped');

  // Đóng STudy hoàn toàn
  await cdp.eval(`
    const closeStudy = document.querySelector('#close-study-tools-modal');
    if (closeStudy) closeStudy.click();
  `);
  await new Promise(r => setTimeout(r, 800));
  await cdp.ensureAllModalsClosed();

  // =========================================================================
  // BƯỚC 11: CẤU HÌNH AI BYOK (GEMINI/CHATGPT) & TEST API KEY
  // =========================================================================
  console.log('\n--- BƯỚC 11: CẤU HÌNH AI BYOK ---');
  await cdp.ensureAllModalsClosed();

  console.log('Sinh viên nhấp icon Robot cấu hình AI BYOK...');
  await cdp.eval(`
    const aiBtn = document.querySelector('#ai-config-trigger-btn, button[title*="AI"]');
    if (aiBtn) aiBtn.click();
  `);
  await new Promise(r => setTimeout(r, 1200));
  await cdp.capture('b11_01_ai_config_modal');

  console.log('Sinh viên chọn nhà cung cấp OpenAI (BYOK) và nhập API Key...');
  await cdp.eval(`
    const radios = document.querySelectorAll('input[type="radio"][name="ai_provider"]');
    if (radios.length > 2) radios[2].click();
    const keyInput = document.querySelector('input[type="password"], input[type="text"][placeholder*="sk-"]');
    if (keyInput) {
      keyInput.focus();
      keyInput.value = 'sk-proj-student-vitudy-byok-verified-2026';
      keyInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  `);
  await new Promise(r => setTimeout(r, 800));
  await cdp.capture('b11_02_ai_key_entered');

  console.log('Sinh viên bấm nút Test kiểm tra kết nối API...');
  await cdp.clickSelector('button', 'Test');
  await new Promise(r => setTimeout(r, 800));
  await cdp.capture('b11_03_ai_key_tested');

  // Đóng modal AI hoàn toàn
  await cdp.eval(`
    const closeAi = document.querySelector('#close-ai-modal, button:has(svg.lucide-x)');
    if (closeAi) closeAi.click();
  `);
  await new Promise(r => setTimeout(r, 800));
  await cdp.ensureAllModalsClosed();

  // =========================================================================
  // BƯỚC 12: TẠO PHÒNG HỌC NHÓM MỜI BẠN BÈ (MULTIPLAYER)
  // =========================================================================
  console.log('\n--- BƯỚC 12: PHÒNG HỌC NHÓM MULTIPLAYER ---');
  await cdp.ensureAllModalsClosed();

  console.log('Sinh viên bấm nút Chia sẻ phòng học nhóm...');
  await cdp.eval(`
    const shareBtn = document.querySelector('button[title*="phòng học"], button[title*="học nhóm"], button:has(svg.lucide-share-2)');
    if (shareBtn) shareBtn.click();
  `);
  await new Promise(r => setTimeout(r, 1200));
  await cdp.capture('b12_01_multiplayer_room_modal');

  // Đóng modal phòng học
  await cdp.eval(`
    const closeShare = document.querySelector('button[aria-label="Đóng"], button:has(svg.lucide-x)');
    if (closeShare) closeShare.click();
  `);
  await new Promise(r => setTimeout(r, 800));
  await cdp.ensureAllModalsClosed();

  // =========================================================================
  // BƯỚC 13: GHI HÌNH BUỔI HỌC & TẢI VIDEO VỀ MÁY
  // =========================================================================
  console.log('\n--- BƯỚC 13: GHI HÌNH BUỔI HỌC ---');
  await cdp.ensureAllModalsClosed();

  console.log('Sinh viên bấm nút Ghi hình màn hình học tập...');
  await cdp.eval(`
    const recBtn = document.querySelector('button[title*="Ghi video"], button[title*="Ghi màn hình"], button:has(svg.lucide-video)');
    if (recBtn) recBtn.click();
  `);
  await new Promise(r => setTimeout(r, 1200));
  await cdp.capture('b13_01_record_setup_modal');

  // Đóng modal ghi hình
  await cdp.eval(`
    const closeRec = document.querySelector('button[aria-label="Đóng"], button:has(svg.lucide-x)');
    if (closeRec) closeRec.click();
  `);
  await new Promise(r => setTimeout(r, 800));
  await cdp.ensureAllModalsClosed();

  console.log('\n🎉 HOÀN TẤT TOÀN BỘ 13 BƯỚC HÀNH TRÌNH SINH VIÊN MÙA THI!');
  cdp.ws.close();
}

runStudentJourney().catch(console.error);
