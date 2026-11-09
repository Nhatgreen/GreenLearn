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

    // Set text to short word "Học" on the green note
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const target = document.querySelector('div[data-desk-item="true"].ring-2') || document.querySelector('div[data-desk-item="true"]');
          const ta = target?.querySelector('textarea');
          if (ta) {
            // Use native value setter for React
            const prototypeValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
            prototypeValueSetter.call(ta, "Học");
            ta.dispatchEvent(new Event('input', { bubbles: true }));
          }
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));

    // Align Left
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const target = document.querySelector('div[data-desk-item="true"].ring-2') || document.querySelector('div[data-desk-item="true"]');
          target?.querySelector('button[title*="Căn lề trái"]')?.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));
    const shotLeft = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'verified_short_left.png'), Buffer.from(shotLeft.data, 'base64'));

    // Align Center
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const target = document.querySelector('div[data-desk-item="true"].ring-2') || document.querySelector('div[data-desk-item="true"]');
          target?.querySelector('button[title*="Căn lề giữa"]')?.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));
    const shotCenter = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'verified_short_center.png'), Buffer.from(shotCenter.data, 'base64'));

    // Align Right
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const target = document.querySelector('div[data-desk-item="true"].ring-2') || document.querySelector('div[data-desk-item="true"]');
          target?.querySelector('button[title*="Căn lề phải"]')?.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));
    const shotRight = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'verified_short_right.png'), Buffer.from(shotRight.data, 'base64'));

    // Toggle Bold OFF then ON
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
    const shotBoldOff = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'verified_short_bold_off.png'), Buffer.from(shotBoldOff.data, 'base64'));

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
    const shotBoldOn = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'verified_short_bold_on.png'), Buffer.from(shotBoldOn.data, 'base64'));

    console.log('All short text align & bold shots saved!');
    ws.close();
    process.exit(0);
  };
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
