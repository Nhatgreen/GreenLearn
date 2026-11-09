import fs from 'fs';
import path from 'path';

async function main() {
  const listRes = await fetch('http://127.0.0.1:9222/json/list');
  const pages = await listRes.json();
  const page = pages.find(p => p.url.includes('localhost:3000'));
  const ws = new WebSocket(page.webSocketDebuggerUrl);

  let id = 1;
  const send = (method, params = {}) => new Promise((resolve) => {
    const curId = id++;
    const handler = (evt) => {
      const data = JSON.parse(evt.data);
      if (data.id === curId) {
        ws.removeEventListener('message', handler);
        resolve(data.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });

  ws.onopen = async () => {
    const artDir = 'C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b';
    const res = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const clickable = Array.from(document.querySelectorAll('div')).find(d => d.className.includes('justify-between') && d.textContent.includes('Thu âm Micro'));
          if (clickable) {
            clickable.click();
            return 'clicked toggle: ' + clickable.textContent.replace(/\\s+/g, ' ').trim();
          }
          return 'not found';
        })()
      `,
      returnByValue: true
    });
    console.log(res.result?.value);
    await new Promise(r => setTimeout(r, 500));
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'verified_recorder_setup_modal_mic_toggled.png'), Buffer.from(shot.data, 'base64'));
    console.log('Saved shot');
    ws.close();
    process.exit(0);
  };
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
