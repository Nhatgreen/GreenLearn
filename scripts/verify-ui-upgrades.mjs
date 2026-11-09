import fs from 'fs';

async function main() {
  const listRes = await fetch('http://127.0.0.1:9222/json/list');
  const pages = await listRes.json();
  const page = pages.find(p => p.url.includes('localhost:3000'));
  if (!page) {
    console.error('No localhost:3000 page found in Chrome debug targets!');
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
    const artifactDir = 'C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b';

    console.log('Reloading page...');
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 3200));

    // 1. Overview with Map open, orange round buttons (bottom-left), grouped top-right bar, left bar at left-[5px]
    let shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${artifactDir}/ui_upgrade_1_overview.png`, Buffer.from(shot.data, 'base64'));
    console.log('1. Saved ui_upgrade_1_overview.png');

    // 2. Press M to hide Minimap -> verify orange circular Map button appears in bottom right
    await send('Runtime.evaluate', {
      expression: `
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'm', code: 'KeyM', bubbles: true }));
      `
    });
    await new Promise(r => setTimeout(r, 600));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${artifactDir}/ui_upgrade_2_map_hidden_circular_btn.png`, Buffer.from(shot.data, 'base64'));
    console.log('2. Saved ui_upgrade_2_map_hidden_circular_btn.png');

    // 3. Click the circular map button to reopen Minimap
    await send('Runtime.evaluate', {
      expression: `
        const btn = document.querySelector('button[title*="Mở bản đồ"]');
        if (btn) btn.click();
      `
    });
    await new Promise(r => setTimeout(r, 600));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${artifactDir}/ui_upgrade_3_map_reopened.png`, Buffer.from(shot.data, 'base64'));
    console.log('3. Saved ui_upgrade_3_map_reopened.png');

    // 4. Open Note flyout on left creation bar to see larger scaled buttons
    await send('Runtime.evaluate', {
      expression: `
        const noteBtn = document.querySelector('button[title*="Tạo giấy ghi chú"]');
        if (noteBtn) noteBtn.click();
      `
    });
    await new Promise(r => setTimeout(r, 500));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${artifactDir}/ui_upgrade_4_left_bar_palette.png`, Buffer.from(shot.data, 'base64'));
    console.log('4. Saved ui_upgrade_4_left_bar_palette.png');

    ws.close();
    console.log('Done all verification screenshots!');
  };
}

main().catch(console.error);
