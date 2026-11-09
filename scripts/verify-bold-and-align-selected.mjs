import fs from 'fs';
import path from 'path';

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
    const artDir = 'C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b';

    // 1. Click Center alignment on selected note
    const centerRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const selectedNote = document.querySelector('div[data-desk-item="true"].ring-2') || document.querySelector('div[data-desk-item="true"]');
        const midBtn = selectedNote?.querySelector('button[title*="Căn lề giữa"]');
        if (midBtn) {
          midBtn.click();
          const ta = selectedNote.querySelector('textarea');
          return { clicked: true, align: ta?.style.textAlign };
        }
        return { clicked: false };
      })()`,
      returnByValue: true
    });
    console.log('Center click:', centerRes.result?.value);
    await new Promise(r => setTimeout(r, 600));

    const shotCenter = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'verified_note_center_alignment.png'), Buffer.from(shotCenter.data, 'base64'));
    console.log('Saved verified_note_center_alignment.png');

    // 2. Click Right alignment
    const rightRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const selectedNote = document.querySelector('div[data-desk-item="true"].ring-2') || document.querySelector('div[data-desk-item="true"]');
        const rightBtn = selectedNote?.querySelector('button[title*="Căn lề phải"]');
        if (rightBtn) {
          rightBtn.click();
          const ta = selectedNote.querySelector('textarea');
          return { clicked: true, align: ta?.style.textAlign };
        }
        return { clicked: false };
      })()`,
      returnByValue: true
    });
    console.log('Right click:', rightRes.result?.value);
    await new Promise(r => setTimeout(r, 600));

    const shotRight = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'verified_note_right_alignment.png'), Buffer.from(shotRight.data, 'base64'));
    console.log('Saved verified_note_right_alignment.png');

    // 3. Toggle Bold ON
    const boldOnRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const selectedNote = document.querySelector('div[data-desk-item="true"].ring-2') || document.querySelector('div[data-desk-item="true"]');
        const boldBtn = Array.from(selectedNote?.querySelectorAll('button') || []).find(b => b.textContent.trim() === 'B');
        const ta = selectedNote.querySelector('textarea');
        if (boldBtn && ta.style.fontWeight !== '800') {
          boldBtn.click();
        }
        return { fontWeight: ta?.style.fontWeight };
      })()`,
      returnByValue: true
    });
    console.log('Bold ON:', boldOnRes.result?.value);
    await new Promise(r => setTimeout(r, 600));

    const shotBoldOn = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'verified_note_bold_on.png'), Buffer.from(shotBoldOn.data, 'base64'));
    console.log('Saved verified_note_bold_on.png');

    // 4. Toggle Bold OFF
    const boldOffRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const selectedNote = document.querySelector('div[data-desk-item="true"].ring-2') || document.querySelector('div[data-desk-item="true"]');
        const boldBtn = Array.from(selectedNote?.querySelectorAll('button') || []).find(b => b.textContent.trim() === 'B');
        const ta = selectedNote.querySelector('textarea');
        if (boldBtn && ta.style.fontWeight === '800') {
          boldBtn.click();
        }
        return { fontWeight: ta?.style.fontWeight };
      })()`,
      returnByValue: true
    });
    console.log('Bold OFF:', boldOffRes.result?.value);
    await new Promise(r => setTimeout(r, 600));

    const shotBoldOff = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'verified_note_bold_off.png'), Buffer.from(shotBoldOff.data, 'base64'));
    console.log('Saved verified_note_bold_off.png');

    ws.close();
    process.exit(0);
  };
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
