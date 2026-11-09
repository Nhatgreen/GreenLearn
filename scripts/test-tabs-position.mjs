import fs from 'fs';

async function main() {
  const listRes = await fetch('http://127.0.0.1:9222/json/list');
  const pages = await listRes.json();
  const page = pages.find(p => p.url.includes('localhost:3000'));
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

    // 1. Center camera on book so right tabs are fully visible
    await send('Runtime.evaluate', {
      expression: `(() => {
        // Find reset view or pan slightly left
        const book = document.querySelector('[data-desk-item]');
        // Close any search
        const input = document.querySelector('input[placeholder*="Tìm tài liệu"]');
        if (input) input.blur();
        document.body.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 400));

    // Pan camera to show right book tabs
    await send('Runtime.evaluate', {
      expression: `(() => {
        // Use fit to screen or pan
        const evt = new WheelEvent('wheel', { deltaY: -100, clientX: 700, clientY: 400 });
        window.dispatchEvent(evt);
      })()`
    });
    await new Promise(r => setTimeout(r, 500));

    // Capture clean desk overview centered
    let shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${artifactDir}/feature_desk_overview_clean.png`, Buffer.from(shot.data, 'base64'));
    console.log('Saved feature_desk_overview_clean.png');

    // Hover tab 1 (Tóm tắt)
    await send('Runtime.evaluate', {
      expression: `(() => {
        const tab1 = document.querySelectorAll('.group\\/tab')[0];
        if (tab1) {
          const btn = tab1.querySelector('button');
          if (btn) {
            btn.style.transform = 'translateX(0px)';
            const span = btn.querySelector('span');
            if (span) span.style.opacity = '1';
          }
        }
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${artifactDir}/feature_tab_slideout_visible.png`, Buffer.from(shot.data, 'base64'));
    console.log('Saved feature_tab_slideout_visible.png');

    // Hover tab 3 (Tách trang)
    await send('Runtime.evaluate', {
      expression: `(() => {
        const tab3 = document.querySelectorAll('.group\\/tab')[2];
        if (tab3) {
          const btn = tab3.querySelector('button');
          if (btn) {
            btn.style.transform = 'translateX(0px)';
            const span = btn.querySelector('span');
            if (span) span.style.opacity = '1';
          }
        }
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${artifactDir}/feature_tab_detach_slideout.png`, Buffer.from(shot.data, 'base64'));
    console.log('Saved feature_tab_detach_slideout.png');

    ws.close();
    process.exit(0);
  };
}

main().catch(console.error);
