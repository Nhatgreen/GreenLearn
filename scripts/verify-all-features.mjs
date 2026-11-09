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
    // 1. Clear local storage and reload
    await send('Runtime.evaluate', {
      expression: 'localStorage.removeItem("vitudy_spaces");'
    });
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 3500));

    // 2. Capture clean desk overview
    let shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/desk_clean_organized.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved desk_clean_organized.png');

    // 3. Test inline title editing on paper sheet
    await send('Runtime.evaluate', {
      expression: `(() => {
        const titleEl = document.querySelector('[title="Bấm để đổi tên tài liệu"]');
        if (titleEl) {
          titleEl.click();
        }
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/paper_title_editing.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved paper_title_editing.png');

    // Cancel editing
    await send('Runtime.evaluate', {
      expression: `(() => {
        const input = document.querySelector('input[type="text"][value*="Đạo hàm"]');
        if (input) {
          input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        }
      })()`
    });

    // 4. Test text selection on Book to pop up Inteline
    await send('Runtime.evaluate', {
      expression: `(() => {
        const bookP = document.querySelector('.book-page p');
        if (bookP) {
          const range = document.createRange();
          range.selectNodeContents(bookP);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          bookP.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: 600, clientY: 280 }));
        }
      })()`
    });
    await new Promise(r => setTimeout(r, 800));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/book_inteline_popup.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved book_inteline_popup.png');

    // Close popover
    await send('Runtime.evaluate', {
      expression: `(() => {
        window.getSelection()?.removeAllRanges();
        const closeBtn = document.querySelector('[data-inteline-popover] button');
        if (closeBtn) closeBtn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 400));

    // 5. Test text selection on Sticky Note to pop up Inteline
    await send('Runtime.evaluate', {
      expression: `(() => {
        const ta = document.querySelector('textarea');
        if (ta) {
          ta.focus();
          ta.setSelectionRange(7, 36);
          ta.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: 1520, clientY: 530 }));
        }
      })()`
    });
    await new Promise(r => setTimeout(r, 800));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/note_inteline_popup.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved note_inteline_popup.png');

    ws.close();
    process.exit(0);
  };
}

main().catch(console.error);
