import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\Vit\\.gemini\\antigravity\\brain\\fbb976ad-a049-4320-8f1d-4fc45e9ec5b9';
const SCREENSHOT_DIR = path.join(ARTIFACT_DIR, 'test-suite-runs');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

class CdpClient {
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
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async capture(name) {
    const shot = await this.send('Page.captureScreenshot', { format: 'png' });
    const buf = Buffer.from(shot.data, 'base64');
    const outPath = path.join(SCREENSHOT_DIR, `${name}.png`);
    fs.writeFileSync(outPath, buf);
    console.log(`📸 [Captured] ${name}.png (${Math.round(buf.length / 1024)} KB)`);
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

  close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

async function runTests() {
  console.log('=== KHỞI ĐỘNG BỘ KIỂM THỬ TỰ ĐỘNG CHROME DEBUG CDP ===');
  const res = await fetch('http://127.0.0.1:9222/json');
  const tabs = await res.json();
  const tab = tabs.find(t => t.type === 'page' && t.url.includes('localhost:3000'));
  if (!tab) {
    console.error('LỖI: Không tìm thấy tab localhost:3000 đang mở trên Chrome port 9222!');
    return;
  }

  const client = new CdpClient(tab.webSocketDebuggerUrl);
  await client.connect();
  await client.send('Page.enable');
  await client.send('Runtime.enable');

  // Đặt kích thước viewport chuẩn Desktop 1440x900
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  // ----------------------------------------------------
  // TEST SCENARIO 1: LANDING PAGE & TƯƠNG TÁC HERO
  // ----------------------------------------------------
  console.log('\n--- SCENARIO 1: LANDING PAGE ---');
  await client.send('Page.navigate', { url: 'http://localhost:3000/?view=landing' });
  await new Promise(r => setTimeout(r, 2000));
  await client.capture('01_landing_hero');

  // Thao tác kéo thử mẩu note vàng
  console.log('-> Kéo thử mẩu note vàng...');
  await client.eval(`
    const note = document.querySelector('div[style*="cursor"]');
    if (note) {
      const box = note.getBoundingClientRect();
      const downEv = new MouseEvent('mousedown', { clientX: box.left + 50, clientY: box.top + 20, bubbles: true });
      note.dispatchEvent(downEv);
      const moveEv = new MouseEvent('mousemove', { clientX: box.left + 120, clientY: box.top + 60, bubbles: true });
      window.dispatchEvent(moveEv);
      const upEv = new MouseEvent('mouseup', { clientX: box.left + 120, clientY: box.top + 60, bubbles: true });
      window.dispatchEvent(upEv);
    }
  `);
  await new Promise(r => setTimeout(r, 500));
  await client.capture('01b_landing_note_dragged');

  // Cuộn xuống Feature Grid
  await client.eval('window.scrollTo({ top: 750, behavior: "instant" })');
  await new Promise(r => setTimeout(r, 600));
  await client.capture('01c_landing_features');

  // Click mở rộng khối chi tiết kỹ thuật
  console.log('-> Mở rộng chi tiết kỹ thuật...');
  await client.eval(`
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('thông số kỹ thuật'));
    if (btn) btn.click();
  `);
  await new Promise(r => setTimeout(r, 600));
  await client.eval('window.scrollTo({ top: 1100, behavior: "instant" })');
  await new Promise(r => setTimeout(r, 600));
  await client.capture('01d_landing_tech_specs');

  // Cuộn xuống Bảng giá & Chân trang
  await client.eval('window.scrollTo({ top: 1800, behavior: "instant" })');
  await new Promise(r => setTimeout(r, 600));
  await client.capture('01e_landing_pricing');

  await client.eval('window.scrollTo({ top: 99999, behavior: "instant" })');
  await new Promise(r => setTimeout(r, 600));
  await client.capture('01f_landing_footer');

  // ----------------------------------------------------
  // TEST SCENARIO 2: BÀN HỌC 2.5D (DESK CANVAS)
  // ----------------------------------------------------
  console.log('\n--- SCENARIO 2: BÀN HỌC 2.5D ---');
  await client.send('Page.navigate', { url: 'http://localhost:3000/' });
  await new Promise(r => setTimeout(r, 3000));
  await client.capture('02a_desk_overview');

  // Đóng onboarding tour nếu có
  console.log('-> Kiểm tra & đóng Onboarding Tour...');
  await client.eval(`
    const skipBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Bỏ qua') || b.textContent.includes('Đóng'));
    if (skipBtn) skipBtn.click();
  `);
  await new Promise(r => setTimeout(r, 800));
  await client.capture('02b_desk_without_tour');

  // Thử tương tác thanh bookmark sách: Mở bảng màu bìa
  console.log('-> Mở bảng chọn màu bìa sách...');
  await client.eval(`
    const colorTab = Array.from(document.querySelectorAll('button, div')).find(el => el.textContent && el.textContent.includes('Màu bìa'));
    if (colorTab) colorTab.click();
  `);
  await new Promise(r => setTimeout(r, 800));
  await client.capture('02c_book_color_palette');

  // Thử chuyển màu bìa sách sang màu Burgundy hoặc Navy
  console.log('-> Chọn màu bìa mới...');
  await client.eval(`
    const colorDots = document.querySelectorAll('button[title*="Đỏ"], button[title*="Xanh"], button[style*="background-color"]');
    if (colorDots.length > 1) {
      colorDots[1].click();
    }
  `);
  await new Promise(r => setTimeout(r, 800));
  await client.capture('02d_book_new_color');

  // Thử bật chế độ Tập trung (Focus Reading Mode)
  console.log('-> Bật chế độ Tập trung...');
  await client.eval(`
    const focusTab = Array.from(document.querySelectorAll('button, div')).find(el => el.textContent && el.textContent.includes('Tập trung'));
    if (focusTab) focusTab.click();
  `);
  await new Promise(r => setTimeout(r, 800));
  await client.capture('02e_desk_focus_mode');

  // Tắt chế độ Tập trung
  await client.eval(`
    const exitFocus = Array.from(document.querySelectorAll('button, div')).find(el => el.textContent && (el.textContent.includes('nhấn để thoát') || el.textContent.includes('Tập trung')));
    if (exitFocus) exitFocus.click();
  `);
  await new Promise(r => setTimeout(r, 800));

  // Kiểm tra Minimap
  console.log('-> Thử ẩn / hiện Minimap...');
  await client.eval(`
    const closeMapBtn = document.querySelector('button[aria-label="Đóng bản đồ"], button[title*="Đóng"]');
    if (closeMapBtn) closeMapBtn.click();
  `);
  await new Promise(r => setTimeout(r, 800));
  await client.capture('02f_minimap_hidden');

  // Mở lại Minimap
  await client.eval(`
    const openMapBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Bản đồ') || b.querySelector('svg.lucide-map'));
    if (openMapBtn) openMapBtn.click();
  `);
  await new Promise(r => setTimeout(r, 800));
  await client.capture('02g_minimap_reopened');

  // ----------------------------------------------------
  // TEST SCENARIO 3: MODAL NẠP TIỀN VIETQR
  // ----------------------------------------------------
  console.log('\n--- SCENARIO 3: MODAL NẠP VITOKEN ---');
  await client.eval(`
    const topUpBtn = document.querySelector('button[aria-label="Nạp ViToken"], button[title*="Nạp"], .lucide-plus')?.closest('button');
    if (topUpBtn) topUpBtn.click();
  `);
  await new Promise(r => setTimeout(r, 1200));
  await client.capture('03a_topup_modal_opened');

  // Chọn gói 27.000đ để xem VietQR
  console.log('-> Chọn gói 27.000đ để sinh mã VietQR...');
  await client.eval(`
    const pkg27 = Array.from(document.querySelectorAll('button, div')).find(el => el.textContent && el.textContent.includes('27.000'));
    if (pkg27) pkg27.click();
  `);
  await new Promise(r => setTimeout(r, 1000));
  await client.capture('03b_topup_vietqr_code');

  // Đóng modal Nạp tiền
  await client.eval(`
    const closeBtn = document.querySelector('button[aria-label="Đóng"], button.lucide-x')?.closest('button') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Hủy') || b.textContent.includes('Đóng'));
    if (closeBtn) closeBtn.click();
  `);
  await new Promise(r => setTimeout(r, 800));

  // ----------------------------------------------------
  // TEST SCENARIO 4: CHỢ TÀI LIỆU (/market)
  // ----------------------------------------------------
  console.log('\n--- SCENARIO 4: CHỢ TÀI LIỆU (/market) ---');
  await client.send('Page.navigate', { url: 'http://localhost:3000/market' });
  await new Promise(r => setTimeout(r, 2000));
  await client.capture('04a_market_page');

  // Thử mở modal xem trước một tài liệu
  console.log('-> Mở modal Xem trước tài liệu...');
  await client.eval(`
    const docCard = document.querySelector('div[class*="rounded-2xl"], div[class*="border"] button, a[href*="market"]');
    const previewBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Xem trước') || b.textContent.includes('Mở'));
    if (previewBtn) previewBtn.click();
  `);
  await new Promise(r => setTimeout(r, 1000));
  await client.capture('04b_market_preview_modal');

  // ----------------------------------------------------
  // TEST SCENARIO 5: NHẬT KÝ HỌC & THỐNG KÊ (/dashboard)
  // ----------------------------------------------------
  console.log('\n--- SCENARIO 5: NHẬT KÝ HỌC (/dashboard) ---');
  await client.send('Page.navigate', { url: 'http://localhost:3000/dashboard' });
  await new Promise(r => setTimeout(r, 2000));
  await client.capture('05a_dashboard_overview');

  // Cuộn xuống xem biểu đồ và lịch sử giao dịch
  await client.eval('window.scrollTo({ top: 400, behavior: "instant" })');
  await new Promise(r => setTimeout(r, 600));
  await client.capture('05b_dashboard_matrix_and_history');

  // ----------------------------------------------------
  // TEST SCENARIO 6: TRANG HỎI ĐÁP FAQ (/faq)
  // ----------------------------------------------------
  console.log('\n--- SCENARIO 6: TRANG HỎI ĐÁP (/faq) ---');
  await client.send('Page.navigate', { url: 'http://localhost:3000/faq' });
  await new Promise(r => setTimeout(r, 1500));
  await client.capture('06a_faq_page');

  // Mở thử 1 câu hỏi
  console.log('-> Click mở câu hỏi FAQ...');
  await client.eval(`
    const faqItem = document.querySelector('button[class*="w-full text-left"]');
    if (faqItem) faqItem.click();
  `);
  await new Promise(r => setTimeout(r, 600));
  await client.capture('06b_faq_expanded');

  // ----------------------------------------------------
  // TEST SCENARIO 7: TRANG ĐĂNG NHẬP (/auth)
  // ----------------------------------------------------
  console.log('\n--- SCENARIO 7: TRANG ĐĂNG NHẬP (/auth) ---');
  await client.send('Page.navigate', { url: 'http://localhost:3000/auth' });
  await new Promise(r => setTimeout(r, 1500));
  await client.capture('07a_auth_page');

  console.log('\n=== HOÀN THÀNH TẤT CẢ CÁC BƯỚC KIỂM THỬ TỰ ĐỘNG ===');
  client.close();
}

runTests().catch(console.error);
