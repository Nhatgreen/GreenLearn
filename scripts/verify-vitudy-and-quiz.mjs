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

  // Close full screen modal if open
  await send('Runtime.evaluate', { 
    expression: `(() => { 
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.title && b.title.includes('Đóng') || b.textContent.includes('Esc') || b.querySelector('svg.lucide-x')); 
      if (btn) btn.click(); 
    })()` 
  });
  await new Promise(r => setTimeout(r, 600));

  // Screenshot TopLeftNav
  const navBox = await send('Runtime.evaluate', {
    expression: `(() => { 
      const el = document.querySelector('.top-1.left-1') || document.querySelector('nav'); 
      const r = el.getBoundingClientRect(); 
      return {x: r.x, y: r.y, width: r.width, height: r.height}; 
    })()`,
    returnByValue: true
  });
  console.log('Nav box:', navBox.result?.value);
  if (navBox.result?.value) {
    const clip = { 
      x: Math.max(0, navBox.result.value.x), 
      y: Math.max(0, navBox.result.value.y), 
      width: Math.max(10, navBox.result.value.width + 10), 
      height: Math.max(10, navBox.result.value.height + 10), 
      scale: 1 
    };
    const navShot = await send('Page.captureScreenshot', { clip });
    fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/verified_vitudy_brand_text.png', Buffer.from(navShot.data, 'base64'));
    console.log('Saved verified_vitudy_brand_text.png');
  }

  // Full desk overview
  const fullShot = await send('Page.captureScreenshot', {});
  fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/verified_live_desk_overview.png', Buffer.from(fullShot.data, 'base64'));
  console.log('Saved verified_live_desk_overview.png');
  process.exit(0);
}

test();
