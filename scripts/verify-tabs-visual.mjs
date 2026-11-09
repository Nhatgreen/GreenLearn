import fs from 'fs';

async function main() {
  const listRes = await fetch('http://127.0.0.1:9222/json/list');
  const pages = await listRes.json();
  const page = pages.find(p => p.type === 'page' && p.url.includes('localhost:3000'));
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
    console.log('Connected to Chrome.');

    // Center the book in the viewport
    await send('Runtime.evaluate', {
      expression: `(() => {
        const book = document.querySelector('[data-desk-item="book"]') || document.querySelector('.group\\\\/book');
        if (book) {
          book.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'center' });
        }
      })()`,
      returnByValue: true
    });
    await new Promise(r => setTimeout(r, 800));

    // Capture idle view
    let shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/tabs_idle_view.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved tabs_idle_view.png');

    // Hover over the first tab (Tóm tắt)
    const tab1Info = await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelectorAll('.group\\\\/tab button')[0];
        if (!btn) return null;
        const rect = btn.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, rect };
      })()`,
      returnByValue: true
    });

    console.log('Tab 1 info:', tab1Info.result?.value);
    if (tab1Info.result?.value) {
      const { x, y } = tab1Info.result.value;
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
      await new Promise(r => setTimeout(r, 600));

      shot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/tabs_hovered_tomtat.png', Buffer.from(shot.data, 'base64'));
      console.log('Saved tabs_hovered_tomtat.png');
    }

    // Hover over the second tab (Phóng to)
    const tab2Info = await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelectorAll('.group\\\\/tab button')[1];
        if (!btn) return null;
        const rect = btn.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, rect };
      })()`,
      returnByValue: true
    });

    console.log('Tab 2 info:', tab2Info.result?.value);
    if (tab2Info.result?.value) {
      const { x, y } = tab2Info.result.value;
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
      await new Promise(r => setTimeout(r, 600));

      shot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/tabs_hovered_phongto.png', Buffer.from(shot.data, 'base64'));
      console.log('Saved tabs_hovered_phongto.png');
    }

    ws.close();
    process.exit(0);
  };
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
