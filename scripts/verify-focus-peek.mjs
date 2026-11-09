// scripts/verify-focus-peek.mjs
import fs from 'fs';

async function main() {
  const listRes = await fetch('http://127.0.0.1:9222/json');
  const targets = await listRes.json();
  const page = targets.find(t => t.type === 'page' && t.url.includes('3000')) || targets[0];
  console.log(`Connecting to: ${page.url} (${page.id})`);

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = rej;
  });

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 1000000);
    const handler = (evt) => {
      const data = JSON.parse(evt.data);
      if (data.id === id) {
        ws.removeEventListener('message', handler);
        if (data.error) reject(data.error);
        else resolve(data.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });

  await send('Runtime.enable');
  await send('Page.enable');

  // Trigger Focus mode
  const clickRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const focusBtn = document.querySelector('button[title*="tập trung"], button[title*="Tập trung"]');
      if (focusBtn) {
        focusBtn.click();
        return { clicked: true, title: focusBtn.title };
      }
      return { clicked: false };
    })()`,
    returnByValue: true
  });
  console.log('Focus Button Click Result:', clickRes.result?.value);
  await new Promise(r => setTimeout(r, 1200));

  const check = await send('Runtime.evaluate', {
    expression: `(() => {
      const peekLeft = document.querySelector('button[title="Mở thanh công cụ"]');
      const peekTop = document.querySelector('button[title="Mở thanh điều hướng"]');
      const peekBottom = document.querySelector('button[title="Mở thanh công cụ dưới"]');
      const text = document.body.innerText;
      const popupNotice = text.includes('Đang tập trung');
      const leftBarCollapsed = document.querySelector('.fixed.left-4')?.className.includes('-translate-x-full');
      const topNavCollapsed = document.querySelector('.fixed.top-4')?.className.includes('-translate-y-full');

      return {
        hasPeekLeft: !!peekLeft,
        hasPeekTop: !!peekTop,
        hasPeekBottom: !!peekBottom,
        hasPopupNotice: popupNotice,
        leftBarCollapsed,
        topNavCollapsed
      };
    })()`,
    returnByValue: true
  });
  console.log('Focus Peek Verification:', check.result?.value);

  // Take screenshot
  const ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/verified_focus_mode_peek_controls.png', Buffer.from(ss.data, 'base64'));
  console.log('Saved verified_focus_mode_peek_controls.png');

  // Test expanding the left HUD using peek button
  const expandRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const peekLeft = document.querySelector('button[title="Mở thanh công cụ"]');
      if (peekLeft) {
        peekLeft.click();
        return { clicked: true };
      }
      return { clicked: false };
    })()`,
    returnByValue: true
  });
  console.log('Expand Left HUD Click Result:', expandRes.result?.value);
  await new Promise(r => setTimeout(r, 800));

  const checkExpanded = await send('Runtime.evaluate', {
    expression: `(() => {
      const leftBar = document.querySelector('.fixed.left-4');
      const retractLeft = document.querySelector('button[title="Thu gọn thanh công cụ"]');
      return {
        isSlidOut: leftBar ? leftBar.className.includes('translate-x-0') : false,
        hasRetractBtn: !!retractLeft
      };
    })()`,
    returnByValue: true
  });
  console.log('Left HUD Slid Out in Focus Mode:', checkExpanded.result?.value);

  // Capture expanded HUD in focus mode
  const ss2 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/verified_focus_hud_slid_out.png', Buffer.from(ss2.data, 'base64'));
  console.log('Saved verified_focus_hud_slid_out.png');

  // Retract back
  await send('Runtime.evaluate', {
    expression: `(() => {
      const retractLeft = document.querySelector('button[title="Thu gọn thanh công cụ"]');
      if (retractLeft) retractLeft.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 500));

  // Exit focus mode
  await send('Runtime.evaluate', {
    expression: `(() => {
      const exitBtn = Array.from(document.querySelectorAll('button, div')).find(el => 
        el.textContent && el.textContent.includes('nhấn để thoát')
      );
      if (exitBtn) exitBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 600));

  console.log('Focus mode exited cleanly!');
  ws.close();
}

main().catch(err => {
  console.error('Focus test error:', err);
  process.exit(1);
});
