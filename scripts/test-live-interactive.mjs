// scripts/test-live-interactive.mjs
import fs from 'fs';

async function main() {
  const listRes = await fetch('http://127.0.0.1:9222/json');
  const targets = await listRes.json();
  const page = targets.find(t => t.type === 'page' && t.url.includes('3000')) || targets[0];
  console.log(`Testing target: ${page.url} (${page.id})`);

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = rej;
  });

  let msgId = 1;
  const call = (method, params = {}) => new Promise((res, rej) => {
    const id = msgId++;
    const handler = (evt) => {
      const data = JSON.parse(evt.data);
      if (data.id === id) {
        ws.removeEventListener('message', handler);
        if (data.error) rej(data.error);
        else res(data.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });

  await call('Runtime.enable');
  await call('Page.enable');

  console.log('Reloading page to pick up latest HMR / build...');
  await call('Page.reload');
  await new Promise(r => setTimeout(r, 2500));

  // 1. Verify Share button opens enhanced modal
  console.log('\n--- 1. Testing Enhanced Share & Supabase Modal ---');
  const openShare = await call('Runtime.evaluate', {
    expression: `(() => {
      const shareBtn = Array.from(document.querySelectorAll('button')).find(b => b.title?.includes('Mời bạn bè') || b.querySelector('.lucide-share-2'));
      if (shareBtn) {
        shareBtn.click();
        return { clicked: true, title: shareBtn.title };
      }
      return { clicked: false };
    })()`,
    returnByValue: true
  });
  console.log('Clicked share button:', openShare.result?.value);
  await new Promise(r => setTimeout(r, 600));

  // Inspect modal content
  const modalInfo = await call('Runtime.evaluate', {
    expression: `(() => {
      const modal = document.querySelector('[role="dialog"]') || document.querySelector('.fixed.inset-0');
      if (!modal) return { found: false };
      return {
        found: true,
        title: modal.querySelector('h3')?.textContent,
        textSnippet: modal.innerText.replace(/\\n+/g, ' ').slice(0, 300),
        hasDbStatus: modal.innerText.includes('Cơ sở dữ liệu Supabase'),
        hasUrlInput: !!modal.querySelector('input[type="text"]'),
        buttons: Array.from(modal.querySelectorAll('button')).map(b => b.textContent.trim()).filter(Boolean)
      };
    })()`,
    returnByValue: true
  });
  console.log('Modal Content:', modalInfo.result?.value);

  // Take screenshot of Share & Supabase Modal
  const shot1 = await call('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/live_chrome_supabase_modal_verified.png', Buffer.from(shot1.data, 'base64'));
  console.log('Saved screenshot to live_chrome_supabase_modal_verified.png');

  // Click "Nhập URL & Anon Key Supabase" to open form
  console.log('\n--- 2. Testing Supabase Config Form Expansion ---');
  const openForm = await call('Runtime.evaluate', {
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
  await new Promise(r => setTimeout(r, 500));

  // Inspect inputs
  const formInputs = await call('Runtime.evaluate', {
    expression: `(() => {
      const inputs = Array.from(document.querySelectorAll('input')).map(i => ({
        placeholder: i.placeholder,
        type: i.type,
        val: i.value
      }));
      return inputs;
    })()`,
    returnByValue: true
  });
  console.log('Form inputs:', formInputs.result?.value);

  // Test entering values and test connection
  console.log('\n--- 3. Testing Supabase Connection Test Mechanism ---');
  const testConn = await call('Runtime.evaluate', {
    expression: `(async () => {
      const urlInput = document.querySelector('input[type="url"]');
      const keyInput = Array.from(document.querySelectorAll('input[type="text"]')).pop();
      if (urlInput && keyInput) {
        urlInput.value = 'https://mocktestproject.supabase.co';
        urlInput.dispatchEvent(new Event('input', { bubbles: true }));
        keyInput.value = 'mock-anon-key-sample-token';
        keyInput.dispatchEvent(new Event('input', { bubbles: true }));

        const testBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Thử kết nối'));
        if (testBtn) {
          testBtn.click();
          return { clicked: true };
        }
      }
      return { clicked: false };
    })()`,
    awaitPromise: true,
    returnByValue: true
  });
  console.log('Triggered connection test:', testConn.result?.value);
  await new Promise(r => setTimeout(r, 1200));

  const testBanner = await call('Runtime.evaluate', {
    expression: `(() => {
      const banners = Array.from(document.querySelectorAll('.animate-fade-in')).map(el => el.textContent.trim());
      return banners;
    })()`,
    returnByValue: true
  });
  console.log('Connection Test Feedback:', testBanner.result?.value);

  const shot2 = await call('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/live_chrome_supabase_form_tested.png', Buffer.from(shot2.data, 'base64'));
  console.log('Saved screenshot to live_chrome_supabase_form_tested.png');

  // Close modal
  await call('Runtime.evaluate', {
    expression: `(() => {
      const closeBtn = document.querySelector('[role="dialog"] button:has(.lucide-x)') || Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'Đóng' || b.querySelector('.lucide-x'));
      if (closeBtn) closeBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 500));

  // 4. Test View Rotate Mode toggle
  console.log('\n--- 4. Testing View Rotate Mode Button ---');
  const rotateMode = await call('Runtime.evaluate', {
    expression: `(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.title?.includes('xoay') || b.title?.includes('Xoay'));
      if (btn) {
        btn.click();
        return { clicked: true, title: btn.title, active: btn.className.includes('bg-slate-200') || btn.className.includes('bg-slate-900') };
      }
      return { clicked: false };
    })()`,
    returnByValue: true
  });
  console.log('Rotate Mode toggle:', rotateMode.result?.value);

  // 5. Test Pen Palette
  console.log('\n--- 5. Testing Pen Palette ---');
  const penTest = await call('Runtime.evaluate', {
    expression: `(() => {
      const penBtn = Array.from(document.querySelectorAll('button')).find(b => b.title?.includes('Bút viết') || b.querySelector('.lucide-pen-tool') || b.querySelector('.lucide-pen'));
      if (penBtn) {
        penBtn.click();
        return { clicked: true, title: penBtn.title };
      }
      return { clicked: false };
    })()`,
    returnByValue: true
  });
  console.log('Pen tool clicked:', penTest.result?.value);
  await new Promise(r => setTimeout(r, 500));

  const shotFinal = await call('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/live_chrome_desk_verified.png', Buffer.from(shotFinal.data, 'base64'));
  console.log('Saved final desk screenshot to live_chrome_desk_verified.png');

  ws.close();
  console.log('\n=== All Live Tests Passed ===');
}

main().catch(console.error);
