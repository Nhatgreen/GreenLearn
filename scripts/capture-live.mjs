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

async function main() {
  const res = await fetch('http://127.0.0.1:9222/json');
  const tabs = await res.json();
  const tab = tabs.find(t => t.type === 'page' && t.url.includes('localhost:3000'));
  if (!tab) {
    console.error('Không tìm thấy tab localhost:3000');
    return;
  }

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

  // Mở trang Landing
  console.log('--- Mở Landing Page: http://localhost:3000/?view=landing ---');
  await client.send('Page.navigate', { url: 'http://localhost:3000/?view=landing' });
  await new Promise(r => setTimeout(r, 2500));

  // 1. Chụp Hero Section
  let shot = await client.send('Page.captureScreenshot', { format: 'png' });
  let buf = Buffer.from(shot.data, 'base64');
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'landing-hero-verified.png'), buf);
  console.log(`✅ landing-hero-verified.png: ${Math.round(buf.length / 1024)} KB`);

  // 2. Cuộn xuống phần Tính năng
  console.log('--- Cuộn xuống phần Tính năng (scrollY = 850) ---');
  await client.send('Runtime.evaluate', { expression: 'window.scrollTo({ top: 850, behavior: "instant" })' });
  await new Promise(r => setTimeout(r, 1000));

  shot = await client.send('Page.captureScreenshot', { format: 'png' });
  buf = Buffer.from(shot.data, 'base64');
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'landing-features-verified.png'), buf);
  console.log(`✅ landing-features-verified.png: ${Math.round(buf.length / 1024)} KB`);

  // 3. Cuộn xuống phần Bảng giá & Chân trang
  console.log('--- Cuộn xuống phần Bảng giá (scrollY = 1550) ---');
  await client.send('Runtime.evaluate', { expression: 'window.scrollTo({ top: 1550, behavior: "instant" })' });
  await new Promise(r => setTimeout(r, 1000));

  shot = await client.send('Page.captureScreenshot', { format: 'png' });
  buf = Buffer.from(shot.data, 'base64');
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'landing-pricing-verified.png'), buf);
  console.log(`✅ landing-pricing-verified.png: ${Math.round(buf.length / 1024)} KB`);

  client.close();
}

main().catch(console.error);
