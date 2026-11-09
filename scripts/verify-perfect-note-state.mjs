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

    console.log('Reloading page...');
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 2500));

    // Focus and select the green note
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const notes = Array.from(document.querySelectorAll('div[data-desk-item="true"]'));
          const target = notes.find(n => n.querySelector('textarea')?.value.includes('Ôn tập')) || notes[0];
          if (target) {
            target.click();
            target.querySelector('textarea')?.focus();
          }
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));

    // Helper to get state
    const getState = async () => {
      const res = await send('Runtime.evaluate', {
        expression: `(() => {
          const target = document.querySelector('div[data-desk-item="true"].ring-2') || document.querySelector('div[data-desk-item="true"]');
          const ta = target?.querySelector('textarea');
          return {
            text: ta?.value,
            textAlign: ta?.style.textAlign,
            fontWeight: ta?.style.fontWeight,
            className: ta?.className
          };
        })()`,
        returnByValue: true
      });
      return res.result?.value;
    };

    // 1. Click Center Align
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const target = document.querySelector('div[data-desk-item="true"].ring-2') || document.querySelector('div[data-desk-item="true"]');
          const midBtn = target?.querySelector('button[title*="Căn lề giữa"]');
          if (midBtn) midBtn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));
    console.log('After Mid click:', await getState());
    const shotCenter = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'verified_note_center_alignment.png'), Buffer.from(shotCenter.data, 'base64'));

    // 2. Click Right Align
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const target = document.querySelector('div[data-desk-item="true"].ring-2') || document.querySelector('div[data-desk-item="true"]');
          const rightBtn = target?.querySelector('button[title*="Căn lề phải"]');
          if (rightBtn) rightBtn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));
    console.log('After Right click:', await getState());
    const shotRight = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'verified_note_right_alignment.png'), Buffer.from(shotRight.data, 'base64'));

    // 3. Click Left Align
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const target = document.querySelector('div[data-desk-item="true"].ring-2') || document.querySelector('div[data-desk-item="true"]');
          const leftBtn = target?.querySelector('button[title*="Căn lề trái"]');
          if (leftBtn) leftBtn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));
    console.log('After Left click:', await getState());
    const shotLeft = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'verified_note_left_alignment.png'), Buffer.from(shotLeft.data, 'base64'));

    // 4. Toggle Bold (make sure it's 800)
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const target = document.querySelector('div[data-desk-item="true"].ring-2') || document.querySelector('div[data-desk-item="true"]');
          const boldBtn = Array.from(target?.querySelectorAll('button') || []).find(b => b.textContent.trim() === 'B');
          const ta = target?.querySelector('textarea');
          if (boldBtn && ta.style.fontWeight !== '800') boldBtn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));
    console.log('Bold 800 state:', await getState());
    const shotBold = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'verified_note_bold_800.png'), Buffer.from(shotBold.data, 'base64'));

    // 5. Toggle Bold OFF (400)
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const target = document.querySelector('div[data-desk-item="true"].ring-2') || document.querySelector('div[data-desk-item="true"]');
          const boldBtn = Array.from(target?.querySelectorAll('button') || []).find(b => b.textContent.trim() === 'B');
          const ta = target?.querySelector('textarea');
          if (boldBtn && ta.style.fontWeight === '800') boldBtn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));
    console.log('Bold 400 state:', await getState());
    const shotRegular = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'verified_note_regular_400.png'), Buffer.from(shotRegular.data, 'base64'));

    ws.close();
    process.exit(0);
  };
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
