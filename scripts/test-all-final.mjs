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

    console.log('Resetting localStorage...');
    await send('Runtime.evaluate', {
      expression: `localStorage.removeItem('vitudy_spaces');`
    });

    console.log('Reloading page...');
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 3200));

    // 1. Overview screenshot
    let shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${artifactDir}/1_overview_bold_streak.png`, Buffer.from(shot.data, 'base64'));
    console.log('1. Saved 1_overview_bold_streak.png');

    // 2. Open Search Dropdown
    await send('Runtime.evaluate', {
      expression: `(() => {
        const searchBtn = document.querySelector('button[title*="Tìm tài liệu"]');
        if (searchBtn) searchBtn.click();
        const input = document.querySelector('input[placeholder*="Tìm tài liệu"]');
        if (input) input.focus();
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${artifactDir}/2_search_dropdown_max3.png`, Buffer.from(shot.data, 'base64'));
    console.log('2. Saved 2_search_dropdown_max3.png');

    // Close search dropdown
    await send('Runtime.evaluate', {
      expression: `(() => {
        const input = document.querySelector('input[placeholder*="Tìm tài liệu"]');
        if (input) input.blur();
        window.dispatchEvent(new MouseEvent('mousedown', { clientX: 10, clientY: 10 }));
      })()`
    });
    await new Promise(r => setTimeout(r, 400));

    // 3. Hover Bookmark Tab 1 (Tóm tắt) to show slide out from book
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('.group\\/btn');
        if (btn) {
          btn.style.transform = 'translateX(0px)';
          const span = btn.querySelector('span');
          if (span) span.style.opacity = '1';
        }
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${artifactDir}/3_bookmark_tab_slid_out.png`, Buffer.from(shot.data, 'base64'));
    console.log('3. Saved 3_bookmark_tab_slid_out.png');

    // Reset tab 1
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('.group\\/btn');
        if (btn) {
          btn.style.transform = '';
          const span = btn.querySelector('span');
          if (span) span.style.opacity = '';
        }
      })()`
    });
    await new Promise(r => setTimeout(r, 300));

    // 4. Open Note Color Palette Flyout
    await send('Runtime.evaluate', {
      expression: `(() => {
        const noteBtn = document.querySelector('button[title*="Tạo giấy ghi chú"]');
        if (noteBtn) noteBtn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 500));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${artifactDir}/4_note_color_palette.png`, Buffer.from(shot.data, 'base64'));
    console.log('4. Saved 4_note_color_palette.png');

    // 5. Open Pen Miro-style Sub-Toolbar
    await send('Runtime.evaluate', {
      expression: `(() => {
        const penBtn = document.querySelector('button[title*="Bộ công cụ bút vẽ"]');
        if (penBtn) penBtn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 500));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${artifactDir}/5_pen_miro_subtoolbar.png`, Buffer.from(shot.data, 'base64'));
    console.log('5. Saved 5_pen_miro_subtoolbar.png');

    // 6. Test Dragging Note Box
    await send('Runtime.evaluate', {
      expression: `(() => {
        const yellowBtn = document.querySelector('button[title*="màu Vàng"]');
        if (yellowBtn) yellowBtn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 400));

    // Drag note preview
    await send('Runtime.evaluate', {
      expression: `(() => {
        const layer = document.querySelector('.fixed.inset-0.z-35');
        if (layer) {
          layer.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 740, clientY: 280, button: 0 }));
          layer.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: 990, clientY: 500 }));
        }
      })()`
    });
    await new Promise(r => setTimeout(r, 500));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${artifactDir}/6_note_drag_preview.png`, Buffer.from(shot.data, 'base64'));
    console.log('6. Saved 6_note_drag_preview.png');

    // Complete note creation
    await send('Runtime.evaluate', {
      expression: `(() => {
        const layer = document.querySelector('.fixed.inset-0.z-35');
        if (layer) {
          layer.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: 990, clientY: 500, button: 0 }));
        }
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${artifactDir}/7_note_created_live.png`, Buffer.from(shot.data, 'base64'));
    console.log('7. Saved 7_note_created_live.png');

    ws.close();
    process.exit(0);
  };
}

main().catch(console.error);
