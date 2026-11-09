import fs from 'fs';

async function main() {
  const res = await fetch('http://127.0.0.1:9222/json');
  const tabs = await res.json();
  const tab = tabs.find(t => t.type === 'page' && t.url.includes('localhost:3000'));
  if (!tab) return;
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 1;
  const send = (m, p = {}) => new Promise(r => {
    const curId = id++;
    const handler = (ev) => {
      const data = JSON.parse(ev.data);
      if (data.id === curId) {
        ws.removeEventListener('message', handler);
        r(data.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: curId, method: m, params: p }));
  });
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 800)' });
  await new Promise(r => setTimeout(r, 400));

  await send('Runtime.evaluate', {
    expression: 'Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("thông số kỹ thuật"))?.click()'
  });
  await new Promise(r => setTimeout(r, 600));

  let shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/fbb976ad-a049-4320-8f1d-4fc45e9ec5b9/landing-tech-expanded.png', Buffer.from(shot.data, 'base64'));
  console.log('Saved landing-tech-expanded.png');
  ws.close();
}

main().catch(console.error);
