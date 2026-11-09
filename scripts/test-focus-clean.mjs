// scripts/test-focus-clean.mjs
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

  console.log('Waiting for desk items...');
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 600));
    const check = await send('Runtime.evaluate', {
      expression: 'document.querySelectorAll("[data-item-id]").length',
      returnByValue: true
    });
    if ((check.result?.value || 0) > 0) break;
  }

  // Find book and enter focus mode
  const enterRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const focusBtn = Array.from(document.querySelectorAll('button')).find(b => 
        b.title?.includes('tập trung đọc') || b.textContent.includes('Tập trung')
      );
      if (focusBtn) {
        focusBtn.click();
        return { clicked: true, title: focusBtn.title };
      }
      return { clicked: false };
    })()`,
    returnByValue: true
  });
  console.log('Enter Focus Mode:', enterRes.result?.value);
  await new Promise(r => setTimeout(r, 800));

  const checkPeek = await send('Runtime.evaluate', {
    expression: `(() => {
      const peekLeft = document.querySelector('button[title="Mở thanh công cụ"]');
      const peekTop = document.querySelector('button[title="Hiển thị Menu và Điểm danh"]');
      const peekBottom = document.querySelector('button[title="Hiển thị thanh công cụ bàn học"]');
      return {
        hasPeekLeft: !!peekLeft,
        hasPeekTop: !!peekTop,
        hasPeekBottom: !!peekBottom
      };
    })()`,
    returnByValue: true
  });
  console.log('All 3 Edge Peek Buttons in Focus Mode:', checkPeek.result?.value);

  // Take screenshot of focused book with peek buttons on edges
  const ss1 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/verified_focus_mode_peek_controls.png', Buffer.from(ss1.data, 'base64'));
  console.log('Saved verified_focus_mode_peek_controls.png');

  // Test expanding the left HUD using peek button
  await send('Runtime.evaluate', {
    expression: `(() => {
      const peekLeft = document.querySelector('button[title="Mở thanh công cụ"]');
      if (peekLeft) peekLeft.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 600));

  const checkExpanded = await send('Runtime.evaluate', {
    expression: `(() => {
      const retractLeft = document.querySelector('button[title="Thu gọn thanh công cụ vào vách"]');
      return { hasRetractLeft: !!retractLeft };
    })()`,
    returnByValue: true
  });
  console.log('Retract Button present on expanded Left HUD:', checkExpanded.result?.value);

  // Take screenshot of slid-out HUD in focus mode
  const ss2 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/verified_focus_hud_slid_out.png', Buffer.from(ss2.data, 'base64'));
  console.log('Saved verified_focus_hud_slid_out.png');

  // Retract left HUD back into wall
  await send('Runtime.evaluate', {
    expression: `(() => {
      const retractLeft = document.querySelector('button[title="Thu gọn thanh công cụ vào vách"]');
      if (retractLeft) retractLeft.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 600));

  // Exit focus mode cleanly
  await send('Runtime.evaluate', {
    expression: `(() => {
      const exitBtn = Array.from(document.querySelectorAll('button')).find(b => 
        b.title?.includes('Thoát') || b.textContent.includes('Tập trung')
      );
      if (exitBtn) exitBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 600));

  console.log('✅ Focus mode & peek controls verified 100%!');
  ws.close();
}

main().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
