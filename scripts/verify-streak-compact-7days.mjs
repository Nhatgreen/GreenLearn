import fs from 'fs';
import path from 'path';

async function main() {
  const listRes = await fetch('http://127.0.0.1:9222/json/list');
  const pages = await listRes.json();
  const page = pages.find(p => p.url.includes('localhost:3000'));
  if (!page) {
    console.error('No localhost:3000 page found!');
    process.exit(1);
  }

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

    console.log('Reloading page...');
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 2500));

    // Open Streak Modal
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const streakBtn = document.querySelector('button[title*="Chuỗi học tập"]');
          if (streakBtn) streakBtn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 800));

    // Capture screenshot of the updated 7-day visual bar
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'verified_streak_7days_compact_camvit_cn.png'), Buffer.from(shot.data, 'base64'));
    console.log('Saved verified_streak_7days_compact_camvit_cn.png');

    ws.close();
    console.log('Verification finished successfully.');
    process.exit(0);
  };
}

main().catch(console.error);
