import fs from 'fs';
import path from 'path';

async function main() {
  const listRes = await fetch('http://127.0.0.1:9222/json/list');
  const pages = await listRes.json();
  const page = pages.find(p => p.url.includes('localhost:3000'));
  const ws = new WebSocket(page.webSocketDebuggerUrl);

  let id = 1;
  const send = (method, params = {}) => new Promise(r => {
    const curId = id++;
    const h = (e) => {
      const d = JSON.parse(e.data);
      if (d.id === curId) { ws.removeEventListener('message', h); r(d.result); }
    };
    ws.addEventListener('message', h);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });

  ws.onopen = async () => {
    const artDir = 'C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b';

    // Set multi-line text on the first note so alignment is very clear
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const noteContainer = document.querySelector('div[data-desk-item="true"] textarea');
          if (noteContainer) {
            noteContainer.focus();
            noteContainer.value = "Toán giải tích\\nĐạo hàm ma trận\\nÔn tập thi cuối kỳ";
            noteContainer.dispatchEvent(new Event('input', { bubbles: true }));
            noteContainer.dispatchEvent(new Event('change', { bubbles: true }));
          }
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));

    // Align Left + Bold ON
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const leftBtn = document.querySelector('button[title*="Căn lề trái"]');
          if (leftBtn) leftBtn.click();
          const boldBtn = document.querySelector('button[title*="In đậm"], button[title*="in đậm"]');
          const isCurrentlyBold = boldBtn?.className.includes('bg-slate-200');
          if (!isCurrentlyBold && boldBtn) boldBtn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));

    const shotBoldLeft = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'verified_note_multiline_bold_left.png'), Buffer.from(shotBoldLeft.data, 'base64'));
    console.log('Saved verified_note_multiline_bold_left.png');

    // Bold OFF (Regular)
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const boldBtn = document.querySelector('button[title*="in đậm"]');
          const isCurrentlyBold = boldBtn?.className.includes('bg-slate-200');
          if (isCurrentlyBold && boldBtn) boldBtn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));

    const shotRegularLeft = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'verified_note_multiline_regular_left.png'), Buffer.from(shotRegularLeft.data, 'base64'));
    console.log('Saved verified_note_multiline_regular_left.png');

    // Align Center (Mid)
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const midBtn = document.querySelector('button[title*="Căn lề giữa"]');
          if (midBtn) midBtn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));

    const shotCenter = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'verified_note_multiline_center.png'), Buffer.from(shotCenter.data, 'base64'));
    console.log('Saved verified_note_multiline_center.png');

    // Align Right
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const rightBtn = document.querySelector('button[title*="Căn lề phải"]');
          if (rightBtn) rightBtn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));

    const shotRight = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'verified_note_multiline_right.png'), Buffer.from(shotRight.data, 'base64'));
    console.log('Saved verified_note_multiline_right.png');

    ws.close();
    process.exit(0);
  };
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
