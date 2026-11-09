import fs from 'fs';

async function test() {
  const ws = new WebSocket('ws://127.0.0.1:9222/devtools/page/2BF8FEB7011DC9786B90A2ACCE409FD3');
  await new Promise(r => ws.onopen = r);
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 1000000);
    const handler = (evt) => {
      const data = JSON.parse(evt.data);
      if (data.id === id) {
        ws.removeEventListener('message', handler);
        resolve(data.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });

  console.log('Reloading page with smooth zoom optimizations ...');
  await send('Runtime.evaluate', { expression: 'location.reload()' });

  // Wait for page ready
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 400));
    const evalRes = await send('Runtime.evaluate', {
      expression: `document.querySelectorAll('button').length`
    });
    if (evalRes && evalRes.result && evalRes.result.value > 10) {
      console.log('Page ready.');
      break;
    }
  }

  await new Promise(r => setTimeout(r, 600));

  // Perform smooth zoom-in sequence
  console.log('Testing smooth zoom in ...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const desk = document.querySelector('.cursor-default') || document.body;
      for (let i = 0; i < 15; i++) {
        desk.dispatchEvent(new WheelEvent('wheel', { deltaY: -80, clientX: 650, clientY: 420, bubbles: true, cancelable: true }));
      }
    })()`
  });

  // Wait 300ms for RAF to settle
  await new Promise(r => setTimeout(r, 300));
  const shotZoomIn = await send('Page.captureScreenshot', {});
  fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/verified_smooth_zoom_in.png', Buffer.from(shotZoomIn.data, 'base64'));
  console.log('Saved verified_smooth_zoom_in.png');

  // Perform smooth zoom-out sequence
  console.log('Testing smooth zoom out ...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const desk = document.querySelector('.cursor-default') || document.body;
      for (let i = 0; i < 20; i++) {
        desk.dispatchEvent(new WheelEvent('wheel', { deltaY: 80, clientX: 650, clientY: 420, bubbles: true, cancelable: true }));
      }
    })()`
  });

  await new Promise(r => setTimeout(r, 300));
  const shotZoomOut = await send('Page.captureScreenshot', {});
  fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/verified_smooth_zoom_out.png', Buffer.from(shotZoomOut.data, 'base64'));
  console.log('Saved verified_smooth_zoom_out.png');

  ws.close();
  console.log('Zoom verification complete!');
  process.exit(0);
}

test();
