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

    // Shot 1: Verify bottom-left buttons: Upload (Cam ViT), Camera (White, black icon), Share (White, black icon)
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'verified_recorder_button_bottom_left.png'), Buffer.from(shot1.data, 'base64'));
    console.log('Saved verified_recorder_button_bottom_left.png');

    // Click the Camera button to open the recording setup modal
    const evalRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const cameraBtn = document.querySelector('button[title*="Ghi hình buổi học"]');
          if (cameraBtn) {
            cameraBtn.click();
            return 'clicked camera button';
          }
          return 'camera button not found';
        })()
      `,
      returnByValue: true
    });
    console.log('Camera button click result:', evalRes.result?.value);
    await new Promise(r => setTimeout(r, 800));

    // Shot 2: Modal setup open
    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'verified_recorder_setup_modal.png'), Buffer.from(shot2.data, 'base64'));
    console.log('Saved verified_recorder_setup_modal.png');

    // Toggle Mic switch
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const micToggle = document.querySelector('div[class*="Thu âm Micro"]')?.closest('div[class*="cursor-pointer"]');
          if (micToggle) micToggle.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));

    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'verified_recorder_setup_modal_mic_off.png'), Buffer.from(shot3.data, 'base64'));
    console.log('Saved verified_recorder_setup_modal_mic_off.png');

    ws.close();
    process.exit(0);
  };
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
