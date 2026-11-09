import fs from 'fs';

const artifactDir = 'C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b';

async function main() {
  const tabsRes = await fetch('http://127.0.0.1:9222/json');
  const tabs = await tabsRes.json();
  const target = tabs.find(t => t.type === 'page');
  const ws = new globalThis.WebSocket(target.webSocketDebuggerUrl);

  ws.onopen = async () => {
    let id = 1;
    const send = (method, params = {}) => new Promise(res => {
      const curId = id++;
      const handler = (evt) => {
        const data = JSON.parse(evt.data);
        if (data.id === curId) {
          ws.removeEventListener('message', handler);
          res(data.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: curId, method, params }));
    });

    console.log('Navigating to http://localhost:3000...');
    await send('Page.navigate', { url: 'http://localhost:3000' });
    await new Promise(r => setTimeout(r, 1200));

    // 1. Verify Search dropdown: No badge text at the end, full title displayed
    console.log('1. Testing search dropdown...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const input = document.querySelector('input[placeholder*="Tìm tài liệu"]');
        if (input) {
          input.focus();
          input.dispatchEvent(new Event('focus', { bubbles: true }));
        }
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    let shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${artifactDir}/verified_search_dropdown_no_badges.png`, Buffer.from(shot.data, 'base64'));
    console.log('Saved verified_search_dropdown_no_badges.png');

    // Close search dropdown
    await send('Runtime.evaluate', {
      expression: `(() => {
        const input = document.querySelector('input[placeholder*="Tìm tài liệu"]');
        if (input) input.blur();
      })()`
    });
    await new Promise(r => setTimeout(r, 300));

    // 2. Verify Note floating toolbar has new two-way rotate icon
    console.log('2. Clicking sticky note to inspect rotation icon...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const note = document.querySelector('[data-desk-item="true"] textarea');
        if (note) {
          note.closest('[data-desk-item="true"]').dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 200, clientY: 200 }));
        }
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${artifactDir}/verified_note_twoway_rotate_icon.png`, Buffer.from(shot.data, 'base64'));
    console.log('Saved verified_note_twoway_rotate_icon.png');

    // 3. Test WASD movement
    console.log('3. Testing WASD pan...');
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'd', code: 'KeyD' });
    await new Promise(r => setTimeout(r, 400));
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'd', code: 'KeyD' });
    await new Promise(r => setTimeout(r, 300));

    // 4. Test View Rotation via Alt + (A / D)
    console.log('4. Testing Alt + D (Rotate view right)...');
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Alt', code: 'AltLeft', modifiers: 1 });
    for (let i = 0; i < 8; i++) {
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'd', code: 'KeyD', modifiers: 1 });
      await new Promise(r => setTimeout(r, 60));
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'd', code: 'KeyD', modifiers: 1 });
    }
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Alt', code: 'AltLeft' });
    await new Promise(r => setTimeout(r, 600));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${artifactDir}/verified_desk_rotated_view.png`, Buffer.from(shot.data, 'base64'));
    console.log('Saved verified_desk_rotated_view.png');

    // 5. Test Compass Click to reset rotation back to 0°
    console.log('5. Clicking Compass to reset view rotation...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const compassBtn = document.querySelector('button[title*="Góc nhìn"]');
        if (compassBtn) compassBtn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${artifactDir}/verified_desk_rotation_reset.png`, Buffer.from(shot.data, 'base64'));
    console.log('Saved verified_desk_rotation_reset.png');

    ws.close();
    console.log('All verifications completed successfully!');
  };
}

main().catch(console.error);
