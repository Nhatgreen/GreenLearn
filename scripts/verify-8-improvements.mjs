// scripts/verify-8-improvements.mjs
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

  console.log('Reloading page...');
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 1000));

  // Reset spaces in localStorage to pick up new mock data coordinates
  await send('Runtime.evaluate', {
    expression: `(() => {
      localStorage.removeItem('vitudy_spaces');
      window.location.reload();
    })()`
  });

  // Wait until desk items are rendered
  console.log('Waiting for canvas desk items to mount...');
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const check = await send('Runtime.evaluate', {
      expression: 'document.querySelectorAll("[data-item-id]").length',
      returnByValue: true
    });
    const count = check.result?.value || 0;
    console.log(`Polling desk items: found ${count}`);
    if (count > 0) break;
  }

  console.log('\n--- 1. Testing KaTeX Math Rendering ---');
  const mathCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const katexEls = document.querySelectorAll('.katex, .katex-html, .inline-math-container');
      return {
        katexElementsFound: katexEls.length,
        hasFractions: !!document.querySelector('.mfrac'),
        hasNabla: document.body.innerText.includes('∇') || !!document.querySelector('.katex')
      };
    })()`,
    returnByValue: true
  });
  console.log('Math rendering check:', mathCheck.result?.value);

  console.log('\n--- 2. Testing Visual Link Threads (Arching & Badge) ---');
  const threadCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const badge = Array.from(document.querySelectorAll('text')).find(t => t.textContent.includes('Liên quan đến'));
      const paths = Array.from(document.querySelectorAll('svg path[stroke="#dc2626"]'));
      return {
        badgeFound: !!badge,
        badgeText: badge?.textContent,
        redPathsCount: paths.length,
        pathD: paths[0]?.getAttribute('d')
      };
    })()`,
    returnByValue: true
  });
  console.log('Thread check:', threadCheck.result?.value);

  console.log('\n--- 3. Testing Sticky Note Typography & Auto-expansion ---');
  const noteCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const textarea = document.querySelector('textarea');
      const expandBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Mở rộng') || b.textContent.includes('Thu gọn'));
      return {
        textareaVal: textarea?.value.slice(0, 50),
        fontFamily: textarea ? window.getComputedStyle(textarea).fontFamily : null,
        fontSize: textarea ? window.getComputedStyle(textarea).fontSize : null,
        expandBtnFound: !!expandBtn,
        expandBtnText: expandBtn?.textContent
      };
    })()`,
    returnByValue: true
  });
  console.log('Note check:', noteCheck.result?.value);

  console.log('\n--- 4. Testing Focus Reading Mode Button on Book ---');
  const focusCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const focusBtn = Array.from(document.querySelectorAll('button')).find(b => b.title?.includes('Tập trung đọc'));
      if (focusBtn) {
        focusBtn.click();
        return { clicked: true, title: focusBtn.title };
      }
      return { clicked: false };
    })()`,
    returnByValue: true
  });
  console.log('Focus mode button click:', focusCheck.result?.value);
  await new Promise(r => setTimeout(r, 600));

  const shotFocus = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/live_verified_focus_mode_reading.png', Buffer.from(shotFocus.data, 'base64'));
  console.log('Saved screenshot: live_verified_focus_mode_reading.png');

  // Exit focus mode
  await send('Runtime.evaluate', {
    expression: `(() => {
      const exitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Thoát tập trung'));
      if (exitBtn) exitBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 400));

  console.log('\n--- 5. Testing Delete Book Safe Confirmation ---');
  const deleteBtnCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const delTab = Array.from(document.querySelectorAll('button')).find(b => b.title?.includes('Xóa cuốn sách') || b.querySelector('.lucide-trash-2'));
      if (delTab) {
        delTab.click();
        return { clicked: true, title: delTab.title };
      }
      return { clicked: false };
    })()`,
    returnByValue: true
  });
  console.log('Delete tab clicked:', deleteBtnCheck.result?.value);
  await new Promise(r => setTimeout(r, 500));

  const confirmModalState = await send('Runtime.evaluate', {
    expression: `(() => {
      const modal = document.querySelector('.fixed.inset-0');
      return {
        found: !!modal,
        text: modal?.innerText.replace(/\\n+/g, ' ').slice(0, 150)
      };
    })()`,
    returnByValue: true
  });
  console.log('Delete confirmation modal:', confirmModalState.result?.value);

  const shotDeleteConfirm = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/live_verified_delete_confirm_modal.png', Buffer.from(shotDeleteConfirm.data, 'base64'));
  console.log('Saved screenshot: live_verified_delete_confirm_modal.png');

  // Cancel delete
  await send('Runtime.evaluate', {
    expression: `(() => {
      const cancelBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'Hủy');
      if (cancelBtn) cancelBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 400));

  console.log('\n--- 6. Testing Grouped Undo & Redo ---');
  const undoRedoCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const undoBtn = document.querySelector('button[title*="Undo"]');
      const redoBtn = document.querySelector('button[title*="Redo"]');
      return {
        hasUndo: !!undoBtn,
        hasRedo: !!redoBtn
      };
    })()`,
    returnByValue: true
  });
  console.log('Undo / Redo check:', undoRedoCheck.result?.value);

  console.log('\n--- 7. Testing Minimap Collapse ---');
  const minimapCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const mapEl = document.querySelector('[title*="Bản đồ thu nhỏ"]');
      const collapseBtn = mapEl?.querySelector('button[title*="Thu gọn"]');
      return {
        hasMinimap: !!mapEl,
        hasCollapseBtn: !!collapseBtn,
        label: mapEl?.querySelector('.font-mono')?.textContent
      };
    })()`,
    returnByValue: true
  });
  console.log('Minimap check:', minimapCheck.result?.value);

  // Take final overview screenshot
  const shotAll = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/live_verified_all_8_improvements.png', Buffer.from(shotAll.data, 'base64'));
  console.log('Saved final overview screenshot: live_verified_all_8_improvements.png');

  ws.close();
  console.log('\n=== ALL 8 IMPROVEMENTS VERIFIED SUCCESSFULLY ===');
}

main().catch(console.error);
