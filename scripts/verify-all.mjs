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
    // Reset desk transform directly on the container or via mouse drag
    await send('Runtime.evaluate', {
      expression: `(() => {
        // Find the 2.5D container and set a centered transform
        const world = document.querySelector('.absolute.top-0.left-0.w-full.h-full');
        // Let's click the "Không gian học 2.5D" or reset pan if available
        // Or directly scroll the book into center view
        const book = document.querySelector('[data-desk-item="book"]') || document.querySelector('.group\\\\/book');
        const container = world?.parentElement;
        if (world) {
          world.style.transform = 'translate(100px, 80px) scale(0.85)';
        }
      })()`,
      returnByValue: true
    });
    await new Promise(r => setTimeout(r, 600));

    // Capture centered idle view
    let shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/tabs_centered_idle.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved tabs_centered_idle.png');

    // Get Tab 1 button pos
    const tab1 = await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelectorAll('.group\\\\/tab button')[0];
        if (!btn) return null;
        const rect = btn.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, rect };
      })()`,
      returnByValue: true
    });
    console.log('Tab 1 pos:', tab1.result?.value);

    if (tab1.result?.value) {
      const { x, y } = tab1.result.value;
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
      await new Promise(r => setTimeout(r, 600));

      shot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/tabs_hovered_tomtat.png', Buffer.from(shot.data, 'base64'));
      console.log('Saved tabs_hovered_tomtat.png');
    }

    // Now test zoom at 47% to verify text crispness and absence of noise
    await send('Runtime.evaluate', {
      expression: `(() => {
        const world = document.querySelector('.absolute.top-0.left-0.w-full.h-full');
        if (world) {
          world.style.transform = 'translate(150px, 120px) scale(0.47)';
        }
      })()`,
      returnByValue: true
    });
    await new Promise(r => setTimeout(r, 600));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/zoom_47_crisp_view.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved zoom_47_crisp_view.png');

    ws.close();
    process.exit(0);
  };
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
