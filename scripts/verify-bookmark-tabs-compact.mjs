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

    // Shot 1: Idle state of all bookmark tabs
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'verified_bookmark_tabs_idle_compact.png'), Buffer.from(shot1.data, 'base64'));
    console.log('Saved verified_bookmark_tabs_idle_compact.png');

    // Hover over Tab 1 (Green - "Tóm tắt")
    const tab1Coords = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const tab1 = document.querySelector('button[style*="clip-path"]');
          if (tab1) {
            const rect = tab1.getBoundingClientRect();
            return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
          }
          return null;
        })()
      `,
      returnByValue: true
    });

    if (tab1Coords.result?.value) {
      const { x, y } = tab1Coords.result.value;
      console.log('Hovering over Tab 1 at:', x, y);
      await send('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x,
        y
      });
      await new Promise(r => setTimeout(r, 600));

      const shot2 = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(artDir, 'verified_bookmark_tab1_hover_tom_tat.png'), Buffer.from(shot2.data, 'base64'));
      console.log('Saved verified_bookmark_tab1_hover_tom_tat.png');
    }

    // Hover over Tab 3 (Blue - "Tách trang")
    const tab3Coords = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const tabs = Array.from(document.querySelectorAll('button[style*="clip-path"]'));
          const tab3 = tabs[2];
          if (tab3) {
            const rect = tab3.getBoundingClientRect();
            return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
          }
          return null;
        })()
      `,
      returnByValue: true
    });

    if (tab3Coords.result?.value) {
      const { x, y } = tab3Coords.result.value;
      console.log('Hovering over Tab 3 at:', x, y);
      await send('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x,
        y
      });
      await new Promise(r => setTimeout(r, 600));

      const shot3 = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(artDir, 'verified_bookmark_tab3_hover_tach_trang.png'), Buffer.from(shot3.data, 'base64'));
      console.log('Saved verified_bookmark_tab3_hover_tach_trang.png');
    }

    ws.close();
    process.exit(0);
  };
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
