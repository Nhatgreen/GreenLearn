import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\Vit\\.gemini\\antigravity\\brain\\fbb976ad-a049-4320-8f1d-4fc45e9ec5b9';

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

  close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

async function captureTab(tabInfo, filename, actions = null) {
  console.log(`\n📸 Kết nối tới tab: "${tabInfo.title}" (${tabInfo.url})`);
  const client = new CdpClient(tabInfo.webSocketDebuggerUrl);
  await client.connect();

  await client.send('Page.enable');
  await client.send('Runtime.enable');

  if (actions) {
    await actions(client);
  }

  await new Promise(r => setTimeout(r, 1500));

  console.log(`Đang chụp màn hình -> ${filename}...`);
  const screenshotResult = await client.send('Page.captureScreenshot', { format: 'png' });
  const buffer = Buffer.from(screenshotResult.data, 'base64');

  const outPath = path.join(ARTIFACT_DIR, filename);
  fs.writeFileSync(outPath, buffer);
  console.log(`✅ Đã lưu ảnh: ${outPath} (${Math.round(buffer.length / 1024)} KB)`);

  client.close();
  return outPath;
}

async function main() {
  const res = await fetch('http://127.0.0.1:9222/json');
  const tabs = await res.json();
  const localTab = tabs.find(t => t.type === 'page' && (t.url.includes('localhost:3000') || t.title.includes('localhost')));

  if (!localTab) {
    console.error('Không tìm thấy tab localhost:3000');
    return;
  }

  // 1. Landing Page đỉnh trang
  await captureTab(localTab, 'screenshot-landing-top.png', async (client) => {
    console.log('Navigating to Landing Page...');
    await client.send('Page.navigate', { url: 'http://localhost:3000/?view=landing' });
    await new Promise(r => setTimeout(r, 2000));
  });

  // 2. Cuộn trang Landing Page xuống mục Tính năng
  await captureTab(localTab, 'screenshot-landing-scroll.png', async (client) => {
    console.log('Scrolling down Landing Page (window.scrollBy 0, 750)...');
    await client.send('Runtime.evaluate', { expression: 'window.scrollTo({ top: 750, behavior: "instant" })' });
    await new Promise(r => setTimeout(r, 1000));
  });

  // 3. Cuộn trang Landing Page xuống Bảng giá & Chân trang
  await captureTab(localTab, 'screenshot-landing-pricing.png', async (client) => {
    console.log('Scrolling down to Pricing (window.scrollBy 0, 1500)...');
    await client.send('Runtime.evaluate', { expression: 'window.scrollTo({ top: 1500, behavior: "instant" })' });
    await new Promise(r => setTimeout(r, 1000));
  });

  // 4. Mở lại Bàn học Desk View
  await captureTab(localTab, 'screenshot-desk.png', async (client) => {
    console.log('Navigating back to Desk...');
    await client.send('Page.navigate', { url: 'http://localhost:3000/' });
    await new Promise(r => setTimeout(r, 2000));
  });

  console.log('\n🎉 Toàn bộ ảnh kiểm thử giao diện đã hoàn tất!');
}

main().catch(err => {
  console.error('Lỗi CDP:', err);
  process.exit(1);
});
