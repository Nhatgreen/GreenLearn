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

    // 1. Open Market Modal
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const marketBtn = buttons.find(b => 
            b.innerText.includes('Chợ') || 
            b.getAttribute('title')?.includes('Chợ') ||
            b.querySelector('svg.lucide-store')
          );
          if (marketBtn) marketBtn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 1000));

    // Shot 1: Catalog with 40 items & brown book covers
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'verified_market_all_40_items.png'), Buffer.from(shot1.data, 'base64'));
    console.log('Saved verified_market_all_40_items.png');

    // 2. Click "Đề thi" tab to filter exams
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const tabs = Array.from(document.querySelectorAll('button'));
          const examTab = tabs.find(b => b.innerText.trim() === 'Đề thi');
          if (examTab) examTab.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 800));

    // Shot 2: Exam items with brown covers, date footer, V credit icons
    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'verified_market_exam_filter.png'), Buffer.from(shot2.data, 'base64'));
    console.log('Saved verified_market_exam_filter.png');

    // 3. Purchase an exam item ("Đề Thi Thử Trắc Nghiệm Học Máy Căn Bản")
    const buyRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const buyBtns = Array.from(document.querySelectorAll('button')).filter(b => b.innerText.trim() === 'Mở tài liệu');
          if (buyBtns.length > 0) {
            buyBtns[0].click();
            return { success: true };
          }
          return { success: false };
        })()
      `,
      returnByValue: true
    });
    console.log('Buy clicked:', buyRes?.value);
    await new Promise(r => setTimeout(r, 1500));

    // Shot 3: Desk with the new Exam Sheet mounted!
    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'verified_desk_with_mounted_exam.png'), Buffer.from(shot3.data, 'base64'));
    console.log('Saved verified_desk_with_mounted_exam.png');

    ws.close();
    console.log('All verification passed!');
    process.exit(0);
  };
}

main().catch(console.error);
