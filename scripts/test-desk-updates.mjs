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
    console.log('Connected to Chrome. Clearing old storage and reloading...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        localStorage.removeItem('vitudy_spaces');
      })()`
    });
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 3000));

    // Capture initial fresh view
    let shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/desk_updated_overview.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved desk_updated_overview.png');

    // Click on book and sticky note to verify red string stays on top
    await send('Runtime.evaluate', {
      expression: `(() => {
        const book = document.querySelector('[data-desk-item="true"]');
        if (book) book.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/book_selected_thread_ontop.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved book_selected_thread_ontop.png');

    // Test text selection on the single paper sheet to pop up Inteline
    await send('Runtime.evaluate', {
      expression: `(() => {
        const paperText = document.querySelectorAll('[data-desk-item="true"]')[1]?.querySelector('.select-text') || document.querySelector('.select-text');
        if (paperText) {
          const range = document.createRange();
          range.selectNodeContents(paperText);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          
          // Dispatch mouseup on paper to trigger popover
          paperText.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: 200, clientY: 280 }));
        }
      })()`
    });
    await new Promise(r => setTimeout(r, 800));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/paper_inteline_popover.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved paper_inteline_popover.png');

    // Test text selection on the sticky note to pop up Inteline
    await send('Runtime.evaluate', {
      expression: `(() => {
        const textarea = document.querySelector('textarea');
        if (textarea) {
          textarea.focus();
          textarea.setSelectionRange(7, 35);
          textarea.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: 1360, clientY: 390 }));
        }
      })()`
    });
    await new Promise(r => setTimeout(r, 800));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/note_inteline_popover.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved note_inteline_popover.png');

    ws.close();
    process.exit(0);
  };
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
