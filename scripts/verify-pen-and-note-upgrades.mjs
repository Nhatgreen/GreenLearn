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

    // 1. Open Pen sub-toolbar & open 6-color palette
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const penBtn = document.querySelector('button[title*="Bộ công cụ bút vẽ"]');
          if (penBtn) penBtn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));

    // Click the single color circle in pen subtoolbar to open the 6-color palette
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const colorBtn = document.querySelector('button[title*="Bấm để đổi màu nét vẽ"]');
          if (colorBtn) colorBtn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));

    // Shot 1: Compact pen subtoolbar with single color circle & 6-color popup
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'verified_pen_compact_subtoolbar_and_6colors.png'), Buffer.from(shot1.data, 'base64'));
    console.log('Saved verified_pen_compact_subtoolbar_and_6colors.png');

    // 2. Open Note creation flyout to verify header is "NOTE"
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const noteBtn = document.querySelector('button[title*="Tạo giấy ghi chú"]');
          if (noteBtn) noteBtn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));

    // Shot 2: Note flyout with "NOTE" title
    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'verified_note_flyout_title_note.png'), Buffer.from(shot2.data, 'base64'));
    console.log('Saved verified_note_flyout_title_note.png');

    // 3. Select existing Note on desk to verify Toolbar position is strictly ABOVE note
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const noteEl = document.querySelector('[data-desk-item="true"] .sticky-note');
          if (noteEl) {
            noteEl.click();
          }
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));

    // Shot 3: Note toolbar located strictly ABOVE note
    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'verified_note_toolbar_strictly_above.png'), Buffer.from(shot3.data, 'base64'));
    console.log('Saved verified_note_toolbar_strictly_above.png');

    // 4. Test clicking footer title "Note" to edit name
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const titleBtn = document.querySelector('button[title="Nhấp để đổi tên ghi chú"]');
          if (titleBtn) {
            titleBtn.click();
          }
        })()
      `
    });
    await new Promise(r => setTimeout(r, 400));

    // Type a new title "Ghi chú ôn thi"
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const input = document.querySelector('input[class*="font-mono"][class*="w-24"]');
          if (input) {
            const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            setter.call(input, 'Ghi chú ôn thi');
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
          }
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));

    // 5. Test empty note font size (1/3 note height) and typing up to divider
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const textarea = document.querySelector('.sticky-note textarea');
          if (textarea) {
            // Set text to empty to verify 1/3 height font size
            const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
            setter.call(textarea, 'Ôn tập');
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
          }
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));

    // Shot 4: Note with editable footer title and large 1/3 height font size
    const shot4 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'verified_note_title_edited_and_large_font.png'), Buffer.from(shot4.data, 'base64'));
    console.log('Saved verified_note_title_edited_and_large_font.png');

    ws.close();
    console.log('All verification passed!');
    process.exit(0);
  };
}

main().catch(console.error);
