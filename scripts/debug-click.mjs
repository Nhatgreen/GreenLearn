// scripts/debug-click.mjs
import fs from 'fs';

async function run() {
  const ws = new WebSocket('ws://127.0.0.1:9222/devtools/page/2BF8FEB7011DC9786B90A2ACCE409FD3');
  await new Promise(r => ws.onopen = r);
  const send = (method, params = {}) => new Promise((resolve) => {
    const id = Math.floor(Math.random() * 1000000);
    ws.addEventListener('message', function h(e) {
      const d = JSON.parse(e.data);
      if (d.id === id) { ws.removeEventListener('message', h); resolve(d.result); }
    });
    ws.send(JSON.stringify({ id, method, params }));
  });

  // Select the card to verify outline
  await send('Runtime.evaluate', {
    expression: `(() => {
      const card = document.querySelector('[data-exam-card="true"]');
      if (card) card.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 200));

  // Take screenshot of Question 1/4 with selection ring on the card
  const shot1 = await send('Page.captureScreenshot', {});
  fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/verified_question_1_selected.png', Buffer.from(shot1.data, 'base64'));
  console.log('Saved verified_question_1_selected.png');

  // Select Option B (correct answer)
  await send('Runtime.evaluate', {
    expression: `(() => {
      const card = document.querySelector('[data-exam-card="true"]');
      const optB = Array.from(card.querySelectorAll('button')).find(b => b.textContent.includes('Hướng của vectơ Gradient'));
      if (optB) optB.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 200));

  // Click Confirm
  await send('Runtime.evaluate', {
    expression: `(() => {
      const card = document.querySelector('[data-exam-card="true"]');
      const confirmBtn = Array.from(card.querySelectorAll('button')).find(b => b.textContent.includes('Xác nhận'));
      if (confirmBtn) confirmBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 200));

  // Now click "Câu tiếp theo" to trigger flip from Q1 to Q2!
  await send('Runtime.evaluate', {
    expression: `(() => {
      const card = document.querySelector('[data-exam-card="true"]');
      const nextBtn = Array.from(card.querySelectorAll('button')).find(b => b.textContent.includes('Câu tiếp theo'));
      if (nextBtn) nextBtn.click();
    })()`
  });

  // Capture at 80ms (mid-flip between Q1 and Q2)
  await new Promise(r => setTimeout(r, 80));
  const midFlipShot = await send('Page.captureScreenshot', {});
  fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/verified_q1_to_q2_mid_flip.png', Buffer.from(midFlipShot.data, 'base64'));
  console.log('Saved verified_q1_to_q2_mid_flip.png');

  // Wait for flip to settle into Question 2
  await new Promise(r => setTimeout(r, 400));
  const settledShot = await send('Page.captureScreenshot', {});
  fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/verified_question_2_settled.png', Buffer.from(settledShot.data, 'base64'));
  console.log('Saved verified_question_2_settled.png');

  ws.close();
}
run().catch(console.error);
