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

    // 1. Select the sticky note to show the floating toolbar
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const note = document.querySelector('div[data-desk-item="true"] textarea');
          if (note) {
            note.focus();
            note.closest('div[data-desk-item="true"]').click();
          }
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));

    // Shot 1: Sticky note with toolbar showing Bold (B) and Align group (Left, Mid, Right) - NO A/A+ button
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'verified_note_toolbar_no_A_with_align_and_bold.png'), Buffer.from(shot1.data, 'base64'));
    console.log('Saved verified_note_toolbar_no_A_with_align_and_bold.png');

    // 2. Click Bold (B) button to toggle OFF bold
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const boldBtn = document.querySelector('button[title*="in đậm"]');
          if (boldBtn) boldBtn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));

    // Shot 2: Note with bold OFF (regular font weight across entire text)
    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'verified_note_bold_toggled_off.png'), Buffer.from(shot2.data, 'base64'));
    console.log('Saved verified_note_bold_toggled_off.png');

    // 3. Click Center (Mid) alignment button
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const midBtn = document.querySelector('button[title*="Căn lề giữa"]');
          if (midBtn) midBtn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));

    // Shot 3: Note with Center alignment
    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'verified_note_aligned_center.png'), Buffer.from(shot3.data, 'base64'));
    console.log('Saved verified_note_aligned_center.png');

    // 4. Click Right alignment button
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const rightBtn = document.querySelector('button[title*="Căn lề phải"]');
          if (rightBtn) rightBtn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));

    // Shot 4: Note with Right alignment
    const shot4 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'verified_note_aligned_right.png'), Buffer.from(shot4.data, 'base64'));
    console.log('Saved verified_note_aligned_right.png');

    // 5. Toggle Bold back ON and Left align
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const boldBtn = document.querySelector('button[title*="in đậm"]');
          if (boldBtn) boldBtn.click();
          const leftBtn = document.querySelector('button[title*="Căn lề trái"]');
          if (leftBtn) leftBtn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));

    const shot5 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'verified_note_final_bold_left.png'), Buffer.from(shot5.data, 'base64'));
    console.log('Saved verified_note_final_bold_left.png');

    ws.close();
    process.exit(0);
  };
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
