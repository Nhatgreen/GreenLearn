import fs from 'fs';

async function main() {
  const listRes = await fetch('http://127.0.0.1:9222/json/list');
  const pages = await listRes.json();
  const page = pages.find(p => p.type === 'page' && p.url.includes('localhost:3000')) || pages.find(p => p.type === 'page');

  if (!page) {
    console.error('Target not found:', pages);
    process.exit(1);
  }

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
    console.log('Connected to Chrome. Reloading...');
    await send('Page.reload');
    console.log('Waiting 4s for render...');
    await new Promise(r => setTimeout(r, 4000));

    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('latest_screenshot.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved screenshot to latest_screenshot.png');

    const evalRes = await send('Runtime.evaluate', {
      expression: 'document.querySelectorAll("[data-desk-item]").length',
      returnByValue: true
    });
    console.log('Desk items count on screen:', evalRes.result?.value);

    const titleRes = await send('Runtime.evaluate', {
      expression: 'document.title',
      returnByValue: true
    });
    console.log('Page title:', titleRes.result?.value);

    ws.close();
    process.exit(0);
  };
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
