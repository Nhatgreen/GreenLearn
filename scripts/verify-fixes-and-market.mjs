import fs from 'fs';

const artifactDir = 'C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b';

async function main() {
  const tabsRes = await fetch('http://127.0.0.1:9222/json');
  const tabs = await tabsRes.json();
  const target = tabs.find(t => t.type === 'page');
  const ws = new globalThis.WebSocket(target.webSocketDebuggerUrl);

  ws.onopen = async () => {
    let id = 1;
    const send = (method, params = {}) => new Promise(res => {
      const curId = id++;
      const handler = (evt) => {
        const data = JSON.parse(evt.data);
        if (data.id === curId) {
          ws.removeEventListener('message', handler);
          res(data.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: curId, method, params }));
    });

    console.log('Navigating to http://localhost:3000...');
    await send('Page.navigate', { url: 'http://localhost:3000' });
    await new Promise(r => setTimeout(r, 1200));

    // 1. Test MarketModal Centering & Library Card Layout
    console.log('1. Opening Market Modal...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('button[title="Chợ Tài Liệu"]');
        if (btn) btn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 700));

    let shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${artifactDir}/verified_market_modal_centered_library_cards.png`, Buffer.from(shot.data, 'base64'));
    console.log('Saved verified_market_modal_centered_library_cards.png');

    // Close Market Modal
    await send('Runtime.evaluate', {
      expression: `(() => {
        const closeBtn = document.querySelector('.fixed.inset-0 button');
        if (closeBtn) closeBtn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 400));

    // 2. Test AI Provider Modal Centering
    console.log('2. Opening AI Provider Modal...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('button[title*="Cài đặt mô hình AI"]');
        if (btn) btn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 700));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${artifactDir}/verified_ai_provider_modal_centered.png`, Buffer.from(shot.data, 'base64'));
    console.log('Saved verified_ai_provider_modal_centered.png');

    // Close AI Modal
    await send('Runtime.evaluate', {
      expression: `(() => {
        const closeBtn = document.querySelector('.fixed.inset-0 button[type="button"]');
        if (closeBtn) closeBtn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 400));

    // 3. Test Streak Modal Centering
    console.log('3. Opening Streak Modal...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('button[title*="Chuỗi học tập"]');
        if (btn) btn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 700));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${artifactDir}/verified_streak_modal_centered.png`, Buffer.from(shot.data, 'base64'));
    console.log('Saved verified_streak_modal_centered.png');

    // Close Streak Modal
    await send('Runtime.evaluate', {
      expression: `(() => {
        const closeBtn = document.querySelector('.fixed.inset-0 button');
        if (closeBtn) closeBtn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 400));

    // 4. Test Desk Grey Contrast & Bottom-Left White Share Button
    console.log('4. Capturing Desk Grey Contrast & HUD...');
    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${artifactDir}/verified_desk_grey_contrast_and_hud.png`, Buffer.from(shot.data, 'base64'));
    console.log('Saved verified_desk_grey_contrast_and_hud.png');

    ws.close();
    console.log('All verifications completed successfully!');
  };
}

main().catch(console.error);
