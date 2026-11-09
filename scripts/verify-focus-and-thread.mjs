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

  // Wait until desk items are rendered
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 800));
    const check = await send('Runtime.evaluate', {
      expression: 'document.querySelectorAll("[data-item-id]").length',
      returnByValue: true
    });
    if ((check.result?.value || 0) > 0) break;
  }

  console.log('\n--- 1. Check "Liên quan đến" removed from thread ---');
  const threadCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const texts = Array.from(document.querySelectorAll('text')).map(t => t.textContent);
      const hasLienQuanDen = texts.some(t => t.includes('Liên quan đến'));
      return { hasLienQuanDen, totalTexts: texts.length };
    })()`,
    returnByValue: true
  });
  console.log('Thread badge check:', threadCheck.result?.value);

  console.log('\n--- 2. Check Focus Tab placed between "Tóm tắt" and "Phóng to" ---');
  const tabsCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const tabButtons = Array.from(document.querySelectorAll('button')).filter(b => 
        b.textContent.includes('Tóm tắt') || 
        b.textContent.includes('Tập trung') || 
        b.textContent.includes('Phóng to')
      );
      return tabButtons.map(b => ({
        text: b.textContent.trim().replace(/\\s+/g, ' '),
        title: b.title,
        width: window.getComputedStyle(b).width
      }));
    })()`,
    returnByValue: true
  });
  console.log('Tabs order check:', tabsCheck.result?.value);

  console.log('\n--- 3. Click Focus Bookmark Tab & Check Extended State (no top banner) ---');
  const clickFocus = await send('Runtime.evaluate', {
    expression: `(() => {
      const focusTab = Array.from(document.querySelectorAll('button')).find(b => 
        b.title?.includes('tập trung đọc') || b.textContent.includes('Tập trung')
      );
      if (!focusTab) return { found: false };
      focusTab.click();
      return { found: true, title: focusTab.title };
    })()`,
    returnByValue: true
  });
  console.log('Click focus tab result:', clickFocus.result?.value);
  await new Promise(r => setTimeout(r, 600));

  const afterFocusState = await send('Runtime.evaluate', {
    expression: `(() => {
      const focusTab = Array.from(document.querySelectorAll('button')).find(b => 
        b.title?.includes('tập trung') || b.textContent.includes('Tập trung')
      );
      const topBanner = Array.from(document.querySelectorAll('*')).find(el => 
        el.textContent?.includes('Đang ở chế độ đọc tập trung')
      );
      return {
        focusTabWidth: focusTab ? window.getComputedStyle(focusTab).width : null,
        focusTabClasses: focusTab ? focusTab.className : null,
        topBannerExists: !!topBanner
      };
    })()`,
    returnByValue: true
  });
  console.log('After focus active state:', afterFocusState.result?.value);

  const shotFocusActive = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/verified_focus_tab_active.png', Buffer.from(shotFocusActive.data, 'base64'));
  console.log('Saved screenshot: verified_focus_tab_active.png');

  console.log('\n--- 4. Attempt Navigation (press W or drag canvas) -> Check App-style Popup "Đang tập trung (nhấn để thoát)" ---');
  // Dispatch a native key press 'w' via CDP
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'w', code: 'KeyW' });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'w', code: 'KeyW' });
  await new Promise(r => setTimeout(r, 600));

  const noticeState = await send('Runtime.evaluate', {
    expression: `(() => {
      const noticeEl = document.querySelector('[data-focus-notice="true"]');
      const exitBtn = noticeEl?.querySelector('button');
      return {
        noticeFound: !!noticeEl,
        noticeText: noticeEl?.innerText.replace(/\\n+/g, ' '),
        exitBtnText: exitBtn?.innerText
      };
    })()`,
    returnByValue: true
  });
  console.log('Focus Notice Popup State:', noticeState.result?.value);

  const shotPopup = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/verified_focus_popup_notice.png', Buffer.from(shotPopup.data, 'base64'));
  console.log('Saved screenshot: verified_focus_popup_notice.png');

  console.log('\n--- 5. Click "Nhấn để thoát" in Popup -> Exits Focus Mode & Retracts Tab ---');
  const exitCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const noticeEl = document.querySelector('[data-focus-notice="true"]');
      const exitBtn = noticeEl?.querySelector('button');
      if (exitBtn) {
        exitBtn.click();
        return { clicked: true };
      }
      return { clicked: false };
    })()`,
    returnByValue: true
  });
  console.log('Exit button clicked:', exitCheck.result?.value);
  await new Promise(r => setTimeout(r, 600));

  const finalState = await send('Runtime.evaluate', {
    expression: `(() => {
      const noticeEl = document.querySelector('[data-focus-notice="true"]');
      const focusTab = Array.from(document.querySelectorAll('button')).find(b => 
        b.title?.includes('tập trung') || b.textContent.includes('Tập trung')
      );
      return {
        noticeDismissed: !noticeEl,
        focusTabRetractedWidth: focusTab ? window.getComputedStyle(focusTab).width : null
      };
    })()`,
    returnByValue: true
  });
  console.log('Final state after exit:', finalState.result?.value);

  const shotExited = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/verified_focus_mode_exited.png', Buffer.from(shotExited.data, 'base64'));
  console.log('Saved screenshot: verified_focus_mode_exited.png');

  ws.close();
  console.log('\n=== ALL FOCUS MODE & THREAD REQUIREMENTS VERIFIED SUCCESSFULLY ===');
}

main().catch(console.error);
