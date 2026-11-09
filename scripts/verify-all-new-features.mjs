// scripts/verify-all-new-features.mjs
import fs from 'fs';

async function main() {
  const ws = new WebSocket('ws://127.0.0.1:9222/devtools/page/2BF8FEB7011DC9786B90A2ACCE409FD3');
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = rej;
  });

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 1000000);
    const timeout = setTimeout(() => reject(new Error(`Timeout ${method}`)), 7000);
    const handler = (evt) => {
      const data = JSON.parse(evt.data);
      if (data.id === id) {
        clearTimeout(timeout);
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

  console.log('Reloading page ...');
  await send('Runtime.evaluate', { expression: `location.reload()` });

  // Wait for page load
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

  await new Promise(r => setTimeout(r, 800));

  // 1. Capture TopLeftNav (ViTudy in Cam ViT without compass icon)
  console.log('--- 1. Testing ViTudy text in TopLeftNav ---');
  const navBox = await send('Runtime.evaluate', {
    expression: `(() => {
      const el = document.querySelector('span.text-lg.font-black.text-\\[\\#E0562D\\]');
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return { x: rect.x - 15, y: rect.y - 10, width: rect.width + 120, height: rect.height + 20 };
    })()`,
    returnByValue: true
  });
  if (navBox && navBox.result && navBox.result.value) {
    const box = navBox.result.value;
    const shot = await send('Page.captureScreenshot', {
      clip: { x: Math.max(0, box.x), y: Math.max(0, box.y), width: box.width, height: box.height, scale: 2 }
    });
    fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/verified_vitudy_brand_text.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved verified_vitudy_brand_text.png');
  }

  // 2. Open Note Flyout in LeftCreationBar to verify no "NOTE" text
  console.log('--- 2. Testing Note Flyout (Zero "NOTE" text) ---');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const noteBtn = document.querySelector('button[title*="Tạo giấy ghi chú"]');
      if (noteBtn) noteBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 200));

  const noteFlyoutBox = await send('Runtime.evaluate', {
    expression: `(() => {
      const flyout = document.querySelector('.animate-fade-in');
      if (!flyout) return null;
      const rect = flyout.getBoundingClientRect();
      return { x: rect.x - 20, y: rect.y - 10, width: rect.width + 40, height: rect.height + 20 };
    })()`,
    returnByValue: true
  });
  if (noteFlyoutBox && noteFlyoutBox.result && noteFlyoutBox.result.value) {
    const box = noteFlyoutBox.result.value;
    const shot = await send('Page.captureScreenshot', {
      clip: { x: Math.max(0, box.x), y: Math.max(0, box.y), width: box.width, height: box.height, scale: 2 }
    });
    fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/verified_note_flyout_no_text.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved verified_note_flyout_no_text.png');
  }

  // Close flyout
  await send('Runtime.evaluate', {
    expression: `(() => {
      const noteBtn = document.querySelector('button[title*="Tạo giấy ghi chú"]');
      if (noteBtn) noteBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 200));

  // 3. Test Book Cover Color Bookmark Tab
  console.log('--- 3. Testing Book Cover Color Bookmark Tab ---');
  // Click "Màu bìa" bookmark tab
  await send('Runtime.evaluate', {
    expression: `(() => {
      const coverTabBtn = document.querySelector('button[title*="Đổi màu bìa sách"]');
      if (coverTabBtn) coverTabBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 300));

  const bookTabsShot = await send('Page.captureScreenshot', {});
  fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/verified_book_cover_tabs_open.png', Buffer.from(bookTabsShot.data, 'base64'));
  console.log('Saved verified_book_cover_tabs_open.png');

  // Select Navy Blue Cover (index 2)
  console.log('Switching book cover to Navy Blue...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const navyBtn = document.querySelector('button[title="Xanh Nước Đậm"]');
      if (navyBtn) navyBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 400));

  const navyBookShot = await send('Page.captureScreenshot', {});
  fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/verified_book_navy_cover.png', Buffer.from(navyBookShot.data, 'base64'));
  console.log('Saved verified_book_navy_cover.png');

  // 4. Test PDF Viewer (Full Screen Modal)
  console.log('--- 4. Testing PDF Reader Full Screen Modal ---');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const zoomBtn = document.querySelector('button[title*="Đọc toàn màn hình"]');
      if (zoomBtn) zoomBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 600));

  const pdfModalShot = await send('Page.captureScreenshot', {});
  fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/verified_pdf_viewer_hud_style.png', Buffer.from(pdfModalShot.data, 'base64'));
  console.log('Saved verified_pdf_viewer_hud_style.png');

  ws.close();
  console.log('All verifications completed successfully!');
}

main().catch(console.error);
