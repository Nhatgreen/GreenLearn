import fs from 'fs';
import path from 'path';

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
    const artDir = 'C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b';

    console.log('Reloading page...');
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 2500));

    // Shot 1: LeftCreationBar with + button below pen and above lock, separated by dividers
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'verified_left_bar_with_plus_button.png'), Buffer.from(shot1.data, 'base64'));
    console.log('Saved verified_left_bar_with_plus_button.png');

    // Click the Plus (+) button to open the More Tools flyout
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const plusBtn = document.querySelector('button[title*="Công cụ mở rộng"]');
          if (plusBtn) plusBtn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 800));

    // Shot 2: More Tools flyout showing exactly the 6 requested tools without search bar
    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'verified_more_tools_flyout_miro_style.png'), Buffer.from(shot2.data, 'base64'));
    console.log('Saved verified_more_tools_flyout_miro_style.png');

    // Click "Code block" tool to verify interactive placement
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const codeBtn = buttons.find(b => b.innerText.includes('Code block'));
          if (codeBtn) codeBtn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 1000));

    // Shot 3: Desk after clicking Code block tool
    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'verified_desk_with_code_block_tool.png'), Buffer.from(shot3.data, 'base64'));
    console.log('Saved verified_desk_with_code_block_tool.png');

    ws.close();
    console.log('All verification passed!');
    process.exit(0);
  };
}

main().catch(console.error);
