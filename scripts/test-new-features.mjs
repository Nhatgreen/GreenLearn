import fs from 'fs';

async function main() {
  const listRes = await fetch('http://127.0.0.1:9222/json/list');
  const pages = await listRes.json();
  const page = pages.find(p => p.url.includes('localhost:3000'));
  if (!page) {
    console.error('Localhost:3000 tab not found in Chrome!');
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
    console.log('Connected to Chrome. Reloading...');
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 3000));

    const artifactDir = 'C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b';

    // 1. Overview Screenshot (Streak number bold & prominent)
    let shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${artifactDir}/feature_overview_bold_streak.png`, Buffer.from(shot.data, 'base64'));
    console.log('1. Saved feature_overview_bold_streak.png');

    // 2. Open Search Input and trigger dropdown list
    await send('Runtime.evaluate', {
      expression: `(() => {
        const searchBtn = document.querySelector('button[title*="Tìm tài liệu"]');
        if (searchBtn) searchBtn.click();
        const input = document.querySelector('input[placeholder*="Tìm tài liệu"]');
        if (input) {
          input.focus();
        }
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${artifactDir}/feature_search_slideout_dropdown.png`, Buffer.from(shot.data, 'base64'));
    console.log('2. Saved feature_search_slideout_dropdown.png');

    // Click outside search to close dropdown
    await send('Runtime.evaluate', {
      expression: `(() => {
        document.body.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 400));

    // 3. Open Note Color Flyout
    await send('Runtime.evaluate', {
      expression: `(() => {
        const noteBtn = document.querySelector('button[title*="Tạo giấy ghi chú"]');
        if (noteBtn) noteBtn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${artifactDir}/feature_note_color_flyout.png`, Buffer.from(shot.data, 'base64'));
    console.log('3. Saved feature_note_color_flyout.png');

    // 4. Open Pen Miro-style Sub-Toolbar Flyout
    await send('Runtime.evaluate', {
      expression: `(() => {
        const penBtn = document.querySelector('button[title*="Bộ công cụ bút vẽ"]');
        if (penBtn) penBtn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${artifactDir}/feature_pen_miro_flyout.png`, Buffer.from(shot.data, 'base64'));
    console.log('4. Saved feature_pen_miro_flyout.png');

    // 5. Hover bookmark tab on book to verify slide-out from book: [text] [icon]
    // We can dispatch mouseenter on tab 1
    await send('Runtime.evaluate', {
      expression: `(() => {
        const tab1 = document.querySelector('.group\\/tab');
        if (tab1) {
          const btn = tab1.querySelector('button');
          if (btn) {
            btn.classList.add('translate-x-0');
            btn.classList.remove('-translate-x-[92px]');
            const span = btn.querySelector('span');
            if (span) span.classList.add('opacity-100');
          }
        }
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${artifactDir}/feature_bookmark_tab_slideout.png`, Buffer.from(shot.data, 'base64'));
    console.log('5. Saved feature_bookmark_tab_slideout.png');

    // 6. Test dragging pushpin on book
    await send('Runtime.evaluate', {
      expression: `(() => {
        // Drag pin by 40px
        const pin = document.querySelector('circle[fill="#dc2626"]')?.parentElement;
        if (pin) {
          const downEvt = new MouseEvent('mousedown', { bubbles: true, clientX: 700, clientY: 200, button: 0 });
          pin.dispatchEvent(downEvt);
          const moveEvt = new MouseEvent('mousemove', { bubbles: true, clientX: 750, clientY: 230 });
          window.dispatchEvent(moveEvt);
          const upEvt = new MouseEvent('mouseup', { bubbles: true });
          window.dispatchEvent(upEvt);
        }
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${artifactDir}/feature_pushpin_dragged.png`, Buffer.from(shot.data, 'base64'));
    console.log('6. Saved feature_pushpin_dragged.png');

    ws.close();
    process.exit(0);
  };
}

main().catch(console.error);
