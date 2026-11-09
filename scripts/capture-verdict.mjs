import fs from 'fs';

async function main() {
  const listRes = await fetch('http://127.0.0.1:9222/json/list');
  const pages = await listRes.json();
  const page = pages.find(p => p.url.includes('namtacozz.github.io/java'));

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
    // Click "Xác nhận"
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('#btn-main-action');
        if (btn) btn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 800));

    let shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/java_web_verdict.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved java_web_verdict.png');

    // Click Hint / Proof Image
    await send('Runtime.evaluate', {
      expression: `(() => {
        const hintBtn = document.querySelector('#btn-proof-image') || document.querySelector('.btn-hint-pill');
        if (hintBtn) hintBtn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/java_web_modal.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved java_web_modal.png');

    ws.close();
    process.exit(0);
  };
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
