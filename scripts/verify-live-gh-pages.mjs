// scripts/verify-live-gh-pages.mjs
import fs from 'fs';

async function main() {
  const pages = await (await fetch('http://127.0.0.1:9222/json')).json();
  const p = pages.find(x => x.type === 'page' && x.url.includes('ViTudy'));
  console.log('Connecting to:', p.url);

  const ws = new WebSocket(p.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

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

  console.log('1. Reloading GitHub Pages...');
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 3000));

  // Close any open modal
  await send('Runtime.evaluate', {
    expression: `(() => {
      const closeBtns = document.querySelectorAll('.lucide-x');
      closeBtns.forEach(b => b.closest('button')?.click());
    })()`
  });
  await new Promise(r => setTimeout(r, 500));

  console.log('2. Clicking Share button...');
  const clickShare = await send('Runtime.evaluate', {
    expression: `(() => {
      const shareBtn = Array.from(document.querySelectorAll('button')).find(b => b.title?.includes('Mời bạn bè'));
      if (shareBtn) {
        shareBtn.click();
        return { clicked: true, title: shareBtn.title };
      }
      return { clicked: false };
    })()`,
    returnByValue: true
  });
  console.log('Click share result:', clickShare.result?.value);
  await new Promise(r => setTimeout(r, 600));

  const modalState = await send('Runtime.evaluate', {
    expression: `(() => {
      const modal = document.querySelector('.fixed.inset-0');
      if (!modal) return { found: false };
      return {
        found: true,
        title: modal.querySelector('h3')?.textContent?.trim(),
        text: modal.innerText.replace(/\\n+/g, ' ').slice(0, 300),
        buttons: Array.from(modal.querySelectorAll('button')).map(b => b.textContent.trim()).filter(Boolean)
      };
    })()`,
    returnByValue: true
  });
  console.log('Modal State on GitHub Pages:', modalState.result?.value);

  // Take screenshot of the Share & Supabase modal
  const shotModal = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/live_gh_pages_supabase_modal.png', Buffer.from(shotModal.data, 'base64'));
  console.log('Saved screenshot: live_gh_pages_supabase_modal.png');

  console.log('3. Opening Supabase Config Form...');
  const openForm = await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Nhập URL') || b.textContent.includes('Chỉnh sửa'));
      if (btn) {
        btn.click();
        return { clicked: true, text: btn.textContent.trim() };
      }
      return { clicked: false };
    })()`,
    returnByValue: true
  });
  console.log('Opened config form:', openForm.result?.value);
  await new Promise(r => setTimeout(r, 600));

  console.log('4. Testing Connection Button...');
  const testConn = await send('Runtime.evaluate', {
    expression: `(() => {
      const urlInput = document.querySelector('input[type="url"]');
      const keyInput = Array.from(document.querySelectorAll('input[type="text"]')).pop();
      if (urlInput && keyInput) {
        urlInput.value = 'https://mock-test.supabase.co';
        urlInput.dispatchEvent(new Event('input', { bubbles: true }));
        keyInput.value = 'sb_mock_token_sample_123';
        keyInput.dispatchEvent(new Event('input', { bubbles: true }));

        const testBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Thử kết nối'));
        if (testBtn) {
          testBtn.click();
          return { clicked: true };
        }
      }
      return { clicked: false };
    })()`,
    returnByValue: true
  });
  console.log('Test Connection clicked:', testConn.result?.value);
  await new Promise(r => setTimeout(r, 1200));

  const testFeedback = await send('Runtime.evaluate', {
    expression: `(() => {
      const alerts = Array.from(document.querySelectorAll('.animate-fade-in')).map(el => el.textContent.trim());
      return alerts;
    })()`,
    returnByValue: true
  });
  console.log('Test Connection Feedback on live page:', testFeedback.result?.value);

  // Take screenshot of the form with feedback
  const shotForm = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/live_gh_pages_supabase_form_tested.png', Buffer.from(shotForm.data, 'base64'));
  console.log('Saved screenshot: live_gh_pages_supabase_form_tested.png');

  // Close modal to return to desk
  await send('Runtime.evaluate', {
    expression: `(() => {
      const closeBtn = document.querySelector('.fixed.inset-0 button:has(.lucide-x)') || Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'Đóng');
      if (closeBtn) closeBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 600));

  // Take final desk screenshot
  const shotDesk = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/live_gh_pages_desk_verified.png', Buffer.from(shotDesk.data, 'base64'));
  console.log('Saved final desk screenshot: live_gh_pages_desk_verified.png');

  ws.close();
  console.log('\n=== LIVE TEST ON GITHUB PAGES COMPLETED SUCCESSFULLY ===');
}

main().catch(console.error);
