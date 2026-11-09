// scripts/inspect-and-test-chrome.mjs
import fs from 'fs';

async function main() {
  const listRes = await fetch('http://127.0.0.1:9222/json');
  const targets = await listRes.json();
  const pages = targets.filter(t => t.type === 'page' && (t.url.includes('ViTudy') || t.url.includes('3000')));
  console.log('Detected pages:', pages.map(p => ({ title: p.title, url: p.url, ws: p.webSocketDebuggerUrl })));

  for (const page of pages) {
    console.log(`\n========================================`);
    console.log(`Testing target: ${page.url}`);
    console.log(`========================================`);

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

    // Enable console & runtime
    await call('Console.enable');
    await call('Runtime.enable');
    await call('Page.enable');

    // 1. Inspect LocalStorage
    const storage = await call('Runtime.evaluate', {
      expression: `(() => {
        const keys = Object.keys(localStorage);
        const data = {};
        for (const k of keys) {
          const val = localStorage.getItem(k);
          data[k] = val.length > 80 ? val.slice(0, 80) + '...' : val;
        }
        return data;
      })()`,
      returnByValue: true
    });
    console.log('LocalStorage snapshot:', storage.result?.value);

    // 2. Test Supabase config & connectivity inside browser
    const supabaseCheck = await call('Runtime.evaluate', {
      expression: `(async () => {
        const url = localStorage.getItem('vitudy_supabase_url');
        const anonKey = localStorage.getItem('vitudy_supabase_anon_key');
        if (!url || !anonKey) {
          return { configured: false, reason: 'Chưa có vitudy_supabase_url hoặc vitudy_supabase_anon_key trong localStorage' };
        }
        try {
          const res = await fetch(url + '/rest/v1/', {
            headers: {
              'apikey': anonKey,
              'Authorization': 'Bearer ' + anonKey
            }
          });
          return {
            configured: true,
            status: res.status,
            statusText: res.statusText,
            ok: res.ok,
            headers: Object.fromEntries(res.headers.entries())
          };
        } catch (e) {
          return { configured: true, error: e.message };
        }
      })()`,
      awaitPromise: true,
      returnByValue: true
    });
    console.log('Supabase Connection Test Result:', supabaseCheck.result?.value);

    // 3. Inspect desk items state
    const deskState = await call('Runtime.evaluate', {
      expression: `(() => {
        const docs = Array.from(document.querySelectorAll('[data-item-id], [data-desk-item]')).map(el => {
          return {
            id: el.getAttribute('data-item-id') || el.id,
            tag: el.tagName,
            text: el.innerText.slice(0, 40).replace(/\\n/g, ' ')
          };
        });
        const notes = Array.from(document.querySelectorAll('textarea')).map(ta => ({
          value: ta.value,
          fontSize: window.getComputedStyle(ta).fontSize,
          fontWeight: window.getComputedStyle(ta).fontWeight,
          textAlign: window.getComputedStyle(ta).textAlign
        }));
        return { docsCount: docs.length, docs, notes };
      })()`,
      returnByValue: true
    });
    console.log('Desk Items State:', deskState.result?.value);

    // 4. Capture screenshot
    const shot = await call('Page.captureScreenshot', { format: 'png' });
    const fileName = page.url.includes('github.io') ? 'live_test_gh_pages.png' : 'live_test_localhost.png';
    fs.writeFileSync(`C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/${fileName}`, Buffer.from(shot.data, 'base64'));
    console.log(`Saved screenshot to: ${fileName}`);

    ws.close();
  }
}

main().catch(console.error);
