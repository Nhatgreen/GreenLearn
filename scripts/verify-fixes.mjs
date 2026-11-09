import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\Vit\\.gemini\\antigravity\\brain\\fbb976ad-a049-4320-8f1d-4fc45e9ec5b9';
const VERIFY_DIR = path.join(ARTIFACT_DIR, 'test-suite-runs');

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
    const outPath = path.join(VERIFY_DIR, `${name}.png`);
    fs.writeFileSync(outPath, buf);
    console.log(`📸 [Verified] ${name}.png (${Math.round(buf.length / 1024)} KB)`);
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

async function verify() {
  console.log('=== KIỂM CHỨNG CÁC ĐIỂM SỬA ĐỔI HOÀN THIỆN ===');
  const res = await fetch('http://127.0.0.1:9222/json');
  const tabs = await res.json();
  const tab = tabs.find(t => t.type === 'page' && t.url.includes('localhost:3000'));
  if (!tab) return;

  const client = new CdpClient(tab.webSocketDebuggerUrl);
  await client.connect();
  await client.send('Page.enable');
  await client.send('Runtime.enable');
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  // 1. Kiểm tra Dashboard cho khách
  console.log('-> Kiểm tra Dashboard...');
  await client.send('Page.navigate', { url: 'http://localhost:3000/dashboard' });
  await new Promise(r => setTimeout(r, 2000));
  await client.capture('verify_dashboard_guest');

  // 2. Quay lại Bàn học và mở Modal TopUp
  console.log('-> Mở Bàn học và kiểm tra TopUp Modal...');
  await client.send('Page.navigate', { url: 'http://localhost:3000/' });
  await new Promise(r => setTimeout(r, 2500));

  // Đóng tour nếu có
  await client.eval(`
    const skipBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Bỏ qua') || b.textContent.includes('Đóng'));
    if (skipBtn) skipBtn.click();
  `);
  await new Promise(r => setTimeout(r, 600));

  // Mở TopUp Modal
  await client.eval(`
    const plusBtn = document.querySelector('button[aria-label="Nạp ViToken"], button[title*="Nạp"], .lucide-plus')?.closest('button');
    if (plusBtn) plusBtn.click();
  `);
  await new Promise(r => setTimeout(r, 1200));
  await client.capture('verify_topup_modal_fixed');

  // Thử chuyển sang bước QR
  await client.eval(`
    const payBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Tiếp tục thanh toán'));
    if (payBtn) payBtn.click();
  `);
  await new Promise(r => setTimeout(r, 1200));
  await client.capture('verify_topup_qr_fixed');

  // Đóng modal
  await client.eval(`
    const closeBtn = document.querySelector('button[aria-label="Đóng nạp ViToken"]');
    if (closeBtn) closeBtn.click();
  `);
  await new Promise(r => setTimeout(r, 600));

  // Chụp lại bàn học để xem Sticky Note và TopLeftNav
  await client.capture('verify_desk_clean');

  client.close();
}

verify().catch(console.error);
