import fs from 'fs';

async function main() {
  const listRes = await fetch('http://127.0.0.1:9222/json/list');
  const pages = await listRes.json();
  const page = pages.find(p => p.type === 'page' && p.url.includes('localhost:3000')) || pages.find(p => p.type === 'page');

  if (!page) {
    console.error('Target not found:', pages);
    process.exit(1);
  }

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 1;
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const curId = id++;
    const handler = (evt) => {
      const data = JSON.parse(evt.data);
      if (data.id === curId) {
        ws.removeEventListener('message', handler);
        if (data.error) reject(data.error);
        else resolve(data.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });

  ws.onopen = async () => {
    console.log('Connected to Chrome.');
    await new Promise(r => setTimeout(r, 1000));

    // Check button "Tải lên" text
    const btnText = await send('Runtime.evaluate', {
      expression: `
        Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Tải lên'))?.innerText || 'NOT_FOUND'
      `,
      returnByValue: true
    });
    console.log('Button with "Tải lên":', btnText.result?.value);

    // Check for any lightning bolt or dev indicator
    const devIndicator = await send('Runtime.evaluate', {
      expression: `
        Boolean(document.querySelector('nextjs-portal, [data-nextjs-dev-indicator], [data-nextjs-toast]'))
      `,
      returnByValue: true
    });
    console.log('Dev indicator present:', devIndicator.result?.value);

    // Check tabs
    const tabsInfo = await send('Runtime.evaluate', {
      expression: `
        const tabs = Array.from(document.querySelectorAll('.group\\\\/tab button')).map(b => ({
          text: b.innerText.trim(),
          width: b.offsetWidth,
          height: b.offsetHeight,
          classes: b.className
        }));
        JSON.stringify(tabs);
      `,
      returnByValue: true
    });
    console.log('Bookmark tabs found:', tabsInfo.result?.value);

    // Get position of the first tab and hover mouse over it
    const tabPos = await send('Runtime.evaluate', {
      expression: `
        const btn = document.querySelector('.group\\\\/tab button');
        if (!btn) null;
        else {
          const rect = btn.getBoundingClientRect();
          ({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
        }
      `,
      returnByValue: true
    });
    console.log('First tab position:', tabPos.result?.value);

    if (tabPos.result?.value) {
      const { x, y } = tabPos.result.value;
      console.log('Moving mouse to tab at (' + x + ', ' + y + ')...');
      await send('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x,
        y
      });
      // Wait for CSS transition
      await new Promise(r => setTimeout(r, 500));

      const hoveredWidth = await send('Runtime.evaluate', {
        expression: `
          const btn = document.querySelector('.group\\\\/tab button');
          ({ width: btn.offsetWidth, height: btn.offsetHeight, text: btn.innerText.trim() })
        `,
        returnByValue: true
      });
      console.log('Hovered tab state:', hoveredWidth.result?.value);

      const shot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync('hovered_tab_screenshot.png', Buffer.from(shot.data, 'base64'));
      console.log('Saved hovered_tab_screenshot.png');
    }

    ws.close();
    process.exit(0);
  };
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
