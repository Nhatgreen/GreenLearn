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
    console.log('Connected to Chrome. Reloading...');
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 3500));

    // 1. Capture full desk overview
    let shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/miro_style_desk_overview.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved miro_style_desk_overview.png');

    // 2. Click Sticky Note to open floating white Miro toolbar
    await send('Runtime.evaluate', {
      expression: `(() => {
        const note = document.querySelector('.sticky-note')?.parentElement;
        if (note) note.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/miro_note_overlay_white.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved miro_note_overlay_white.png');

    // 3. Click Paper Sheet to open floating white Miro toolbar
    await send('Runtime.evaluate', {
      expression: `(() => {
        const paper = Array.from(document.querySelectorAll('[data-desk-item]')).find(el => el.innerText.includes('Đạo hàm'));
        if (paper) paper.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/miro_paper_overlay_white.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved miro_paper_overlay_white.png');

    // 4. Click Chợ Tài Liệu icon in Top Right to verify Market Modal opens
    await send('Runtime.evaluate', {
      expression: `(() => {
        const marketBtn = document.querySelector('button[title*="Chợ Tài Liệu"]');
        if (marketBtn) marketBtn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/market_modal_open.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved market_modal_open.png');

    // Close Market Modal
    await send('Runtime.evaluate', {
      expression: `(() => {
        const closeBtn = document.querySelector('.fixed button');
        if (closeBtn) closeBtn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 400));

    // 5. Click Mời bạn in Bottom Left to verify Share Modal opens
    await send('Runtime.evaluate', {
      expression: `(() => {
        const inviteBtn = document.querySelector('button[title*="Mời bạn"]');
        if (inviteBtn) inviteBtn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/invite_modal_open.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved invite_modal_open.png');

    ws.close();
    process.exit(0);
  };
}

main().catch(console.error);
