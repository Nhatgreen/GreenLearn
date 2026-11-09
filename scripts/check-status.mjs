import fs from 'fs';

async function main() {
  const listRes = await fetch('http://127.0.0.1:9222/json/list');
  const pages = await listRes.json();
  const page = pages.find(p => p.url.includes('localhost:3000'));
  if (!page) {
    console.error('Page not found');
    return;
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
    const res = await send('Runtime.evaluate', {
      expression: `(() => {
        const items = Array.from(document.querySelectorAll('[data-desk-item]')).map(el => ({
          type: el.getAttribute('data-desk-item'),
          text: el.innerText.slice(0, 50),
          transform: el.style.transform,
          rect: el.getBoundingClientRect()
        }));
        return {
          title: document.title,
          url: window.location.href,
          itemsCount: items.length,
          items,
          viewport: { w: window.innerWidth, h: window.innerHeight }
        };
      })()`,
      returnByValue: true
    });
    console.log(JSON.stringify(res.result.value, null, 2));

    // Also capture a fresh screenshot with clip or default
    const shot = await send('Page.captureScreenshot', {
      format: 'png',
      fromSurface: true
    });
    fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/check_status_screenshot.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved check_status_screenshot.png');
    ws.close();
  };
}

main().catch(console.error);
