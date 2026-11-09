import fs from 'fs';

async function main() {
  const listRes = await fetch('http://127.0.0.1:9222/json/list');
  const pages = await listRes.json();
  const page = pages.find(p => p.url.includes('localhost:3000'));

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
    await new Promise(r => setTimeout(r, 3500));

    // Capture main view with timer and sound button
    let shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/modern_ui_overview.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved modern_ui_overview.png');

    // Click on the Coral Map Toggle button in bottom-right
    await send('Runtime.evaluate', {
      expression: `(() => {
        const mapBtn = document.querySelector('button[title*="Map Matrix"]') || document.querySelector('button[title*="Bản đồ"]');
        if (mapBtn) mapBtn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/modern_ui_map_open.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved modern_ui_map_open.png');

    // Select an option on the exam paper sheet to see the coral highlight
    await send('Runtime.evaluate', {
      expression: `(() => {
        // Find first option button in exam paper
        const optBtn = document.querySelector('[data-desk-item] button.group');
        if (optBtn) optBtn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 500));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/modern_ui_option_selected.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved modern_ui_option_selected.png');

    ws.close();
    process.exit(0);
  };
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
