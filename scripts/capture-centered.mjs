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

    await send('Runtime.evaluate', { expression: `localStorage.clear()` });
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 2200));

    // Position the paper sheet in clear view and open its STudy overlay
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const papers = Array.from(document.querySelectorAll('[data-desk-item="true"]')).filter(el => el.innerText.includes('Đạo hàm'));
          if (papers.length > 0) {
            papers[0].style.transform = 'translate(300px, 120px) rotate(0deg) scale(1)';
            const studyBtn = papers[0].querySelector('button[title*="STudy"]');
            if (studyBtn) studyBtn.click();
          }
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));

    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'verified_insitu_study_clean_view.png'), Buffer.from(shot.data, 'base64'));
    console.log('Saved verified_insitu_study_clean_view.png');

    ws.close();
    process.exit(0);
  };
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
