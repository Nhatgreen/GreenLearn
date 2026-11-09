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

    await send('Runtime.evaluate', {
      expression: `localStorage.removeItem('vitudy_spaces');`
    });

    console.log('Reloading page...');
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 3200));

    // 1. Full Desk Overview
    let shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${artifactDir}/verified_1_desk_overview.png`, Buffer.from(shot.data, 'base64'));
    console.log('1. Saved verified_1_desk_overview.png');

    // 2. Search Bar Slide-Out & 3 Items Dropdown
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
    fs.writeFileSync(`${artifactDir}/verified_2_search_dropdown.png`, Buffer.from(shot.data, 'base64'));
    console.log('2. Saved verified_2_search_dropdown.png');

    // Close search dropdown
    await send('Runtime.evaluate', {
      expression: `(() => {
        const input = document.querySelector('input[placeholder*="Tìm tài liệu"]');
        if (input) input.blur();
        window.dispatchEvent(new MouseEvent('mousedown', { clientX: 10, clientY: 10 }));
      })()`
    });
    await new Promise(r => setTimeout(r, 400));

    // 3. Bookmark Tab Slide-Out from Inside Book [text] [icon]
    await send('Runtime.evaluate', {
      expression: `(() => {
        const tabBtn = document.querySelectorAll('.group\\/tab button')[0];
        if (tabBtn) {
          tabBtn.style.setProperty('--tw-translate-x', '0px');
          tabBtn.style.transform = 'translateX(0px)';
          const span = tabBtn.querySelector('span');
          if (span) span.style.opacity = '1';
        }
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${artifactDir}/verified_3_bookmark_tab_slid_out.png`, Buffer.from(shot.data, 'base64'));
    console.log('3. Saved verified_3_bookmark_tab_slid_out.png');

    // Reset Tab 1
    await send('Runtime.evaluate', {
      expression: `(() => {
        const tabBtn = document.querySelectorAll('.group\\/tab button')[0];
        if (tabBtn) {
          tabBtn.style.transform = '';
          tabBtn.style.removeProperty('--tw-translate-x');
          const span = tabBtn.querySelector('span');
          if (span) span.style.opacity = '';
        }
      })()`
    });
    await new Promise(r => setTimeout(r, 300));

    // 4. Note Color Vertical Palette Flyout
    await send('Runtime.evaluate', {
      expression: `(() => {
        const noteBtn = document.querySelector('button[title*="Tạo giấy ghi chú"]');
        if (noteBtn) noteBtn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 500));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${artifactDir}/verified_4_note_color_palette.png`, Buffer.from(shot.data, 'base64'));
    console.log('4. Saved verified_4_note_color_palette.png');

    // 5. Pen Miro-Style Sub-Toolbar Flyout
    await send('Runtime.evaluate', {
      expression: `(() => {
        const penBtn = document.querySelector('button[title*="Bộ công cụ bút vẽ"]');
        if (penBtn) penBtn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 500));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${artifactDir}/verified_5_pen_miro_flyout.png`, Buffer.from(shot.data, 'base64'));
    console.log('5. Saved verified_5_pen_miro_flyout.png');

    // 6. Select Note Color & Drag Bounding Box
    await send('Runtime.evaluate', {
      expression: `(() => {
        // Open note flyout and click Yellow
        const noteBtn = document.querySelector('button[title*="Tạo giấy ghi chú"]');
        if (noteBtn) noteBtn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 300));

    await send('Runtime.evaluate', {
      expression: `(() => {
        const yellow = document.querySelector('button[title*="màu Vàng"]');
        if (yellow) yellow.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 400));

    // Start Drag Box
    await send('Runtime.evaluate', {
      expression: `(() => {
        const layer = document.querySelector('.fixed.inset-0.z-35');
        if (layer) {
          layer.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 740, clientY: 280, button: 0 }));
          layer.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: 1000, clientY: 520 }));
        }
      })()`
    });
    await new Promise(r => setTimeout(r, 500));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${artifactDir}/verified_6_note_drag_preview.png`, Buffer.from(shot.data, 'base64'));
    console.log('6. Saved verified_6_note_drag_preview.png');

    // Finish Note Creation
    await send('Runtime.evaluate', {
      expression: `(() => {
        const layer = document.querySelector('.fixed.inset-0.z-35');
        if (layer) {
          layer.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: 1000, clientY: 520, button: 0 }));
        }
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${artifactDir}/verified_7_note_created_custom_size.png`, Buffer.from(shot.data, 'base64'));
    console.log('7. Saved verified_7_note_created_custom_size.png');

    // 7. Drag Detective Pushpin to New Position on Book
    await send('Runtime.evaluate', {
      expression: `(() => {
        const pin = document.querySelector('circle[fill="#dc2626"]')?.parentElement;
        if (pin) {
          pin.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 680, clientY: 260, button: 0 }));
          window.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 800, clientY: 340 }));
          window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        }
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${artifactDir}/verified_8_pushpin_dragged_live.png`, Buffer.from(shot.data, 'base64'));
    console.log('8. Saved verified_8_pushpin_dragged_live.png');

    ws.close();
    process.exit(0);
  };
}

main().catch(console.error);
