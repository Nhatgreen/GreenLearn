// scripts/test-live-chrome.mjs
// Test live Chrome instance via Chrome DevTools Protocol (CDP) WebSocket

const WS_TARGET_PAGES = 'http://127.0.0.1:9222/json';

async function getTargets() {
  const res = await fetch(WS_TARGET_PAGES);
  return await res.json();
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
    this.events = [];
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.id && this.callbacks.has(data.id)) {
          const { resolve, reject } = this.callbacks.get(data.id);
          this.callbacks.delete(data.id);
          if (data.error) reject(data.error);
          else resolve(data.result);
        } else if (data.method) {
          this.events.push(data);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(JSON.stringify(res.exceptionDetails));
    }
    return res.result?.value;
  }

  async captureScreenshot() {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    return Buffer.from(res.data, 'base64');
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function main() {
  console.log('--- Fetching Chrome Debug Targets ---');
  const targets = await getTargets();
  const pages = targets.filter(t => t.type === 'page' && t.url.includes('ViTudy') || t.url.includes('localhost:3000'));
  console.log('Found ViTudy pages:', pages.map(p => ({ id: p.id, title: p.title, url: p.url })));

  if (pages.length === 0) {
    console.error('No ViTudy page found in Chrome!');
    process.exit(1);
  }

  // Pick the GitHub Pages tab first, or localhost
  const target = pages.find(p => p.url.includes('namtacozz.github.io')) || pages[0];
  console.log(`Connecting to: ${target.url} (${target.id})`);

  const client = new CDPClient(target.webSocketDebuggerUrl);
  await client.connect();
  console.log('Connected to CDP WebSocket!');

  // Enable Runtime and Page
  await client.send('Runtime.enable');
  await client.send('Page.enable');

  // 1. Test basic page info & React root
  console.log('\n--- 1. Page & React Health ---');
  const pageHealth = await client.evaluate(`(() => {
    return {
      title: document.title,
      url: window.location.href,
      readyState: document.readyState,
      hasRoot: !!document.getElementById('__next') || !!document.querySelector('main'),
      itemsCount: document.querySelectorAll('[data-desk-item]').length || document.querySelectorAll('.absolute').length,
    };
  })()`);
  console.log('Page Health:', pageHealth);

  // 2. Test Supabase Database & Multiplayer config in browser
  console.log('\n--- 2. Database (Supabase) & Multiplayer Realtime ---');
  const supabaseStatus = await client.evaluate(`(() => {
    const configStr = localStorage.getItem('vitudy_supabase_config');
    let config = null;
    if (configStr) {
      try { config = JSON.parse(configStr); } catch (e) {}
    }
    const hasEnvUrl = !!window.__NEXT_DATA__?.runtimeConfig?.NEXT_PUBLIC_SUPABASE_URL;
    return {
      hasLocalStorageConfig: !!config,
      savedUrl: config?.url || '(not set in localStorage)',
      savedKeySet: !!config?.anonKey,
      hasEnvUrl,
      // Check if multiplayer state or hook exists in window or context
      localStorageKeys: Object.keys(localStorage),
    };
  })()`);
  console.log('Supabase Browser Status:', supabaseStatus);

  // 3. Test Desk UI Elements existence
  console.log('\n--- 3. Desk UI Elements Audit ---');
  const uiAudit = await client.evaluate(`(() => {
    return {
      hasMinimap: !!document.querySelector('[data-testid="minimap"]') || !!document.querySelector('canvas'),
      hasBottomRightToolkit: !!document.querySelector('button[title*="Xoay"]') || !!document.querySelector('button[title*="xoay"]'),
      hasRotateModeBtn: !!document.querySelector('button[title*="Chế độ xoay"]') || !!document.querySelector('button[title*="Xoay"]'),
      hasScreenRecorderBtn: !!document.querySelector('button[title*="Ghi hình"]') || !!document.querySelector('button[title*="ghi hình"]') || !!document.querySelector('button svg.lucide-video'),
      hasPlusToolBtn: !!document.querySelector('button[title*="Công cụ khác"]') || !!document.querySelector('button[title*="Khác"]') || !!document.querySelector('button[title*="Miro"]'),
      hasStreakBadge: !!document.querySelector('[title*="chuỗi"]') || !!document.querySelector('[title*="Chuỗi"]') || !!document.querySelector('.lucide-flame'),
      notesCount: document.querySelectorAll('textarea').length,
    };
  })()`);
  console.log('UI Elements Audit:', uiAudit);

  // 4. Test Streak Modal
  console.log('\n--- 4. Testing Streak (Chuỗi) Modal ---');
  const streakTest = await client.evaluate(`(() => {
    // Click streak badge if found
    const streakBtn = document.querySelector('button:has(.lucide-flame)') || document.querySelector('[title*="chuỗi"]') || Array.from(document.querySelectorAll('button')).find(b => b.innerHTML.includes('lucide-flame') || b.textContent.includes('chuỗi') || b.textContent.includes('2'));
    if (streakBtn) {
      streakBtn.click();
      return { clicked: true, buttonText: streakBtn.textContent.trim() };
    }
    return { clicked: false, buttons: Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim().slice(0, 30)) };
  })()`);
  console.log('Streak Button Click:', streakTest);

  await new Promise(r => setTimeout(r, 600));

  const streakModalState = await client.evaluate(`(() => {
    const modal = document.querySelector('[role="dialog"]') || document.querySelector('.fixed.inset-0');
    if (!modal) return { modalFound: false };
    const text = modal.innerText;
    const hasCamVitButton = !!modal.querySelector('button.bg-\\\\[\\\\#E0562D\\\\]') || !!Array.from(modal.querySelectorAll('button')).find(b => b.textContent.includes('Nhận ViToken'));
    const days = Array.from(modal.querySelectorAll('div, span')).filter(el => ['T2','T3','T4','T5','T6','T7','CN'].includes(el.textContent.trim())).map(el => el.textContent.trim());
    return {
      modalFound: true,
      title: modal.querySelector('h2, h3, .font-bold, .font-semibold')?.textContent?.trim(),
      hasCamVitButton,
      buttonText: modal.querySelector('button.bg-\\\\[\\\\#E0562D\\\\]')?.textContent?.trim() || modal.querySelector('button')?.textContent?.trim(),
      daysFound: [...new Set(days)],
      fullTextSnippet: text.slice(0, 200),
    };
  })()`);
  console.log('Streak Modal State:', streakModalState);

  // Take screenshot
  const fs = await import('fs');
  const screenshotBuffer = await client.captureScreenshot();
  fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/live_chrome_test_streak.png', screenshotBuffer);
  console.log('Captured screenshot to live_chrome_test_streak.png');

  // Close modal if open
  await client.evaluate(`(() => {
    const closeBtn = document.querySelector('[role="dialog"] button:has(.lucide-x)') || document.querySelector('[role="dialog"] button');
    if (closeBtn) closeBtn.click();
  })()`);
  await new Promise(r => setTimeout(r, 400));

  // 5. Test Plus (+) Tools Miro Popover
  console.log('\n--- 5. Testing More Tools (+) Popover ---');
  const plusTest = await client.evaluate(`(() => {
    const plusBtn = Array.from(document.querySelectorAll('button')).find(b => b.title?.includes('Công cụ khác') || b.querySelector('.lucide-plus'));
    if (plusBtn) {
      plusBtn.click();
      return { clicked: true, title: plusBtn.title };
    }
    return { clicked: false };
  })()`);
  console.log('Plus Button Click:', plusTest);

  await new Promise(r => setTimeout(r, 400));

  const plusMenuState = await client.evaluate(`(() => {
    const items = Array.from(document.querySelectorAll('div, button')).filter(el => {
      const t = el.textContent?.trim() || '';
      return ['Shapes and lines', 'Stickers, Emojis and GIFs', 'Code block', 'Table', 'Mind map', 'Text'].includes(t);
    }).map(el => el.textContent.trim());
    return {
      menuItemsFound: [...new Set(items)],
    };
  })()`);
  console.log('More Tools Items Found:', plusMenuState);

  // Close popover
  await client.evaluate(`(() => {
    document.body.click();
  })()`);
  await new Promise(r => setTimeout(r, 400));

  // 6. Test Screen Recorder Button
  console.log('\n--- 6. Testing Screen Recorder (Camera) Button ---');
  const recorderTest = await client.evaluate(`(() => {
    const recBtn = Array.from(document.querySelectorAll('button')).find(b => b.title?.includes('Ghi hình') || b.querySelector('.lucide-video'));
    return {
      found: !!recBtn,
      title: recBtn?.title,
      classes: recBtn?.className,
    };
  })()`);
  console.log('Recorder Button:', recorderTest);

  // 7. Test Rotate Mode Button
  console.log('\n--- 7. Testing View Rotate Button ---');
  const rotateBtnTest = await client.evaluate(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.title?.includes('xoay') || b.title?.includes('Xoay'));
    return {
      found: !!btn,
      title: btn?.title,
      classes: btn?.className,
    };
  })()`);
  console.log('Rotate Button:', rotateBtnTest);

  // 8. Test Multiplayer / Supabase Modal
  console.log('\n--- 8. Testing Multiplayer & Supabase Modal ---');
  const multiplayerModalTest = await client.evaluate(`(() => {
    const shareBtn = Array.from(document.querySelectorAll('button')).find(b => b.title?.includes('Chia sẻ') || b.textContent.includes('Chia sẻ') || b.querySelector('.lucide-share-2') || b.querySelector('.lucide-users'));
    if (shareBtn) {
      shareBtn.click();
      return { clicked: true, title: shareBtn.title };
    }
    return { clicked: false };
  })()`);
  console.log('Share Button Click:', multiplayerModalTest);

  await new Promise(r => setTimeout(r, 600));

  const shareModalState = await client.evaluate(`(() => {
    const modal = document.querySelector('[role="dialog"]') || document.querySelector('.fixed.inset-0');
    if (!modal) return { modalFound: false };
    const buttons = Array.from(modal.querySelectorAll('button')).map(b => b.textContent.trim());
    const hasSupabaseConfigBtn = buttons.some(t => t.includes('Cấu hình') || t.includes('Supabase'));
    return {
      modalFound: true,
      title: modal.querySelector('h2, h3, .font-bold')?.textContent?.trim(),
      buttons,
      hasSupabaseConfigBtn,
      textSnippet: modal.innerText.slice(0, 300),
    };
  })()`);
  console.log('Share Modal State:', shareModalState);

  // If Supabase config button exists, click it to check configuration form
  const configFormTest = await client.evaluate(`(() => {
    const cfgBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Cấu hình'));
    if (cfgBtn) {
      cfgBtn.click();
      return { clickedConfig: true };
    }
    return { clickedConfig: false };
  })()`);
  console.log('Config Button Click:', configFormTest);

  await new Promise(r => setTimeout(r, 500));

  const configInputs = await client.evaluate(`(() => {
    const inputs = Array.from(document.querySelectorAll('input')).map(i => ({
      placeholder: i.placeholder,
      value: i.value ? '(has value)' : '(empty)',
      type: i.type,
    }));
    return inputs;
  })()`);
  console.log('Config Inputs:', configInputs);

  const screenshotModalBuffer = await client.captureScreenshot();
  fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/live_chrome_test_supabase_modal.png', screenshotModalBuffer);
  console.log('Captured screenshot to live_chrome_test_supabase_modal.png');

  client.close();
  console.log('\n=== Testing Complete ===');
}

main().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
