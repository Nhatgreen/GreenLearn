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

    // Shot 1: Top Right HUD showing the flame filled with Cam ViT and large white number
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'verified_hud_flame_cam_vit_white_number.png'), Buffer.from(shot1.data, 'base64'));
    console.log('Saved verified_hud_flame_cam_vit_white_number.png');

    // Open Daily Streak Modal
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const streakBtn = document.querySelector('button[title*="Chuỗi học tập"]');
          if (streakBtn) streakBtn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 800));

    // Shot 2: Daily Streak Modal with 7-day visual bar, single-line streak, and Cam ViT button
    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'verified_daily_streak_modal_7days_cam_vit.png'), Buffer.from(shot2.data, 'base64'));
    console.log('Saved verified_daily_streak_modal_7days_cam_vit.png');

    // Click "Nhận ViToken" button
    const claimRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'Nhận ViToken');
          if (btn) {
            btn.click();
            return { clicked: true };
          }
          return { clicked: false, text: Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean) };
        })()
      `,
      returnByValue: true
    });
    console.log('Claim button click result:', claimRes?.value);
    await new Promise(r => setTimeout(r, 800));

    // Shot 3: Daily Streak Modal after claiming
    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'verified_daily_streak_after_claim.png'), Buffer.from(shot3.data, 'base64'));
    console.log('Saved verified_daily_streak_after_claim.png');

    ws.close();
    console.log('Verification finished successfully.');
    process.exit(0);
  };
}

main().catch(console.error);
