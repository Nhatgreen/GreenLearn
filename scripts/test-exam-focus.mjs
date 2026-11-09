import fs from 'fs';

async function main() {
  const listRes = await fetch('http://127.0.0.1:9222/json/list');
  const pages = await listRes.json();
  const page = pages.find(p => p.url.includes('localhost:3000'));

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 1;
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const curId = id++;
    const handler = (evt) => {
      const data = JSON.parse(evt.data);
      if (data.id === curId) {
        ws.removeEventListener('message', handler);
        if (data.error) reject(data.error);
        else resolve(data.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });

  ws.onopen = async () => {
    // Pan directly to the exam paper sheet
    await send('Runtime.evaluate', {
      expression: `(() => {
        const world = document.querySelector('.absolute.top-0.left-0.w-full.h-full');
        if (world) {
          // Center the exam sheet (usually at x around -200, y around -500 relative to screen)
          world.style.transform = 'translate(-350px, -200px) scale(0.95)';
        }
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    let shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/exam_sheet_view.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved exam_sheet_view.png');

    // Click an option in the exam sheet
    await send('Runtime.evaluate', {
      expression: `(() => {
        const opts = document.querySelectorAll('button.group');
        if (opts.length > 0) opts[0].click();
        if (opts.length > 1) opts[1].click();
      })()`
    });
    await new Promise(r => setTimeout(r, 500));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/exam_sheet_selected.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved exam_sheet_selected.png');

    ws.close();
    process.exit(0);
  };
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
