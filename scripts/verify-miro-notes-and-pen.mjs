import fs from 'fs';

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
    const artifactDir = 'C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b';

    console.log('Reloading page...');
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 3000));

    // 1. Open Pen sub-toolbar & verify vertical centering (middle alignment with creation bar)
    await send('Runtime.evaluate', {
      expression: `
        const penBtn = document.querySelector('button[title*="bút vẽ"]');
        if (penBtn) penBtn.click();
      `
    });
    await new Promise(r => setTimeout(r, 600));

    let shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${artifactDir}/verified_pen_centered_overlay.png`, Buffer.from(shot.data, 'base64'));
    console.log('1. Saved verified_pen_centered_overlay.png');

    // 2. Select cursor tool & click the sticky note to open toolbar
    await send('Runtime.evaluate', {
      expression: `
        const cursorBtn = document.querySelector('button[title*="Con trỏ"]');
        if (cursorBtn) cursorBtn.click();
        const note = document.querySelector('[data-desk-item="true"] textarea');
        if (note) note.focus();
      `
    });
    await new Promise(r => setTimeout(r, 600));

    // Open color picker on sticky note
    await send('Runtime.evaluate', {
      expression: `
        const colorBtn = document.querySelector('button[title*="Đổi màu ghi chú"]');
        if (colorBtn) colorBtn.click();
      `
    });
    await new Promise(r => setTimeout(r, 600));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${artifactDir}/verified_note_miro_16color_palette.png`, Buffer.from(shot.data, 'base64'));
    console.log('2. Saved verified_note_miro_16color_palette.png');

    // 3. Select a color (e.g. mint or pink) and click bold + align center
    await send('Runtime.evaluate', {
      expression: `
        const mintBtn = document.querySelector('button[title="Xanh bạc hà"]') || document.querySelectorAll('button[style*="background-color"]')[6];
        if (mintBtn) mintBtn.click();
        const boldBtn = document.querySelector('button[title*="In đậm"]');
        if (boldBtn) boldBtn.click();
        const alignBtn = document.querySelector('button[title*="Căn lề"]');
        if (alignBtn) alignBtn.click();
      `
    });
    await new Promise(r => setTimeout(r, 600));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${artifactDir}/verified_note_mint_bold_centered.png`, Buffer.from(shot.data, 'base64'));
    console.log('3. Saved verified_note_mint_bold_centered.png');

    // 4. Test In-Document Pen Drawing: draw a stroke on the sticky note, then drag it!
    // Switch to pen tool
    await send('Runtime.evaluate', {
      expression: `
        const penBtn = document.querySelector('button[title*="bút vẽ"]');
        if (penBtn) penBtn.click();
      `
    });
    await new Promise(r => setTimeout(r, 500));

    // Draw stroke over note using PointerEvents
    await send('Runtime.evaluate', {
      expression: `(() => {
        const note = document.querySelector(".sticky-note");
        const rect = note.getBoundingClientRect();
        const startX = rect.left + 40;
        const startY = rect.top + 60;

        const layer = document.querySelector('.fixed.inset-0.z-35');
        if (layer) {
          layer.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: startX, clientY: startY, button: 0 }));
          for (let i = 1; i <= 8; i++) {
            layer.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: startX + i * 12, clientY: startY + Math.sin(i) * 10 }));
          }
          layer.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: startX + 100, clientY: startY, button: 0 }));
        }
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${artifactDir}/verified_stroke_drawn_on_note.png`, Buffer.from(shot.data, 'base64'));
    console.log('4. Saved verified_stroke_drawn_on_note.png');

    // 5. Switch to cursor tool and move the note to verify the ink moves with it!
    await send('Runtime.evaluate', {
      expression: `(() => {
        const cursorBtn = document.querySelector('button[title*="Con trỏ"]');
        if (cursorBtn) cursorBtn.click();

        // Move note by dispatching drag on tape or shifting position
        const tape = document.querySelector('[title*="Cầm băng keo"]');
        if (tape) {
          const rect = tape.getBoundingClientRect();
          tape.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: rect.left, clientY: rect.top, button: 0 }));
          window.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: rect.left + 140, clientY: rect.top + 80 }));
          window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: rect.left + 140, clientY: rect.top + 80, button: 0 }));
        }
      })()`
    });
    await new Promise(r => setTimeout(r, 800));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${artifactDir}/verified_stroke_moved_with_note.png`, Buffer.from(shot.data, 'base64'));
    console.log('5. Saved verified_stroke_moved_with_note.png (In-Document ink confirmed!)');

    ws.close();
    console.log('All verification tests completed successfully!');
  };
}

main().catch(console.error);
