import fs from 'fs';

async function main() {
  const listRes = await fetch('http://127.0.0.1:9222/json/list');
  const pages = await listRes.json();
  const page = pages.find(p => p.url.includes('namtacozz.github.io/java'));

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
    console.log('Connected to Java web page. Waiting 3s for render...');
    await new Promise(r => setTimeout(r, 3000));

    let shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/java_web_home.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved java_web_home.png');

    // Click on an option to see active/feedback state
    await send('Runtime.evaluate', {
      expression: `(() => {
        const firstOpt = document.querySelector('.option-row');
        if (firstOpt) firstOpt.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/java_web_selected.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved java_web_selected.png');

    // Open map popover
    await send('Runtime.evaluate', {
      expression: `(() => {
        const mapBtn = document.querySelector('#btn-map-toggle');
        if (mapBtn) mapBtn.click();
        const mapPop = document.querySelector('.map-popover');
        if (mapPop) mapPop.classList.add('is-open');
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/java_web_map.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved java_web_map.png');

    ws.close();
    process.exit(0);
  };
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
