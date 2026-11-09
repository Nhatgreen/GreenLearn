// scripts/test-single-card-flip.mjs
import fs from 'fs';

async function main() {
  const ws = new WebSocket('ws://127.0.0.1:9222/devtools/page/2BF8FEB7011DC9786B90A2ACCE409FD3');
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = rej;
  });

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 1000000);
    const timeout = setTimeout(() => reject(new Error(`Timeout ${method}`)), 7000);
    const handler = (evt) => {
      const data = JSON.parse(evt.data);
      if (data.id === id) {
        clearTimeout(timeout);
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

  console.log('--- Cleaning up desk and placing single exam card at x: 1060, y: 120 ---');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const saved = localStorage.getItem('vitudy_spaces');
      let spaces = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(spaces) || spaces.length === 0) return;
      
      // Filter out previous test cards
      spaces[0].items = spaces[0].items.filter(i => !i.id.includes('test-exam') && !i.id.includes('verify-flip'));

      // Add a single clean exam card
      spaces[0].items.push({
        id: 'clean-quiz-card',
        type: 'paper',
        title: 'Đề Ôn Tập Trắc Nghiệm: Giải Tích Đa Biến',
        x: 1060,
        y: 120,
        rotation: 0,
        scale: 1,
        zIndex: 50,
        pageCount: 1,
        currentPageIndex: 0,
        isExamSheet: true,
        stickyColor: '#bae6fd',
        width: 380,
        height: 490,
        examData: {
          timeLimitMinutes: 15,
          remainingSeconds: 900,
          questions: [
            {
              id: 'q1',
              question: 'Hướng nào sau đây là hướng mà hàm số đa biến f(x) TĂNG nhanh nhất tại một điểm?',
              options: [
                'Hướng ngược với vectơ Gradient (-∇f)',
                'Hướng của vectơ Gradient (∇f)',
                'Hướng trực giao với vectơ Gradient',
                'Hướng tiếp tuyến với đường mức'
              ],
              correctAnswer: 1,
              explanation: 'Vectơ Gradient ∇f luôn chỉ theo hướng hàm số tăng nhanh nhất.'
            },
            {
              id: 'q2',
              question: 'Ma trận đạo hàm bậc hai của hàm nhiều biến f(x_1, ..., x_n) được gọi là gì?',
              options: [
                'Ma trận Jacobian',
                'Ma trận Covariance',
                'Ma trận Hessian',
                'Ma trận Gram'
              ],
              correctAnswer: 2,
              explanation: 'Ma trận Hessian H chứa tất cả các đạo hàm riêng bậc hai.'
            }
          ],
          userAnswers: {},
          isGraded: false,
          totalQuestions: 2
        },
        pages: []
      });

      localStorage.setItem('vitudy_spaces', JSON.stringify(spaces));
    })()`
  });

  // Reload page
  console.log('Reloading page...');
  await send('Page.navigate', { url: 'http://localhost:3000/' });

  // Wait for load
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 400));
    const evalRes = await send('Runtime.evaluate', {
      expression: `document.querySelectorAll('[data-exam-card="true"]').length`
    });
    if (evalRes && evalRes.result && evalRes.result.value > 0) {
      console.log('Single quiz card mounted!');
      break;
    }
  }

  await new Promise(r => setTimeout(r, 600));

  // 1. Capture initial Cover screen
  console.log('Capturing Cover screen...');
  const shotCover = await send('Page.captureScreenshot', {});
  fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/verified_quiz_card_cover.png', Buffer.from(shotCover.data, 'base64'));

  // 2. Select card and Click "Bắt đầu làm bài"
  console.log('Clicking "Bắt đầu làm bài"...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const card = document.querySelector('[data-exam-card="true"]');
      if (!card) return;
      card.click();
      const btn = Array.from(card.querySelectorAll('button')).find(b => b.textContent.includes('Bắt đầu làm bài'));
      if (btn) btn.click();
    })()`
  });

  // Capture at 75ms (mid-flip between Cover and Question 1)
  await new Promise(r => setTimeout(r, 75));
  const shotMid = await send('Page.captureScreenshot', {});
  fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/verified_quiz_card_clean_mid_flip.png', Buffer.from(shotMid.data, 'base64'));

  // Wait for flip to settle into Question 1 (350ms)
  await new Promise(r => setTimeout(r, 380));
  const shotQ1 = await send('Page.captureScreenshot', {});
  fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/verified_quiz_card_question1_settled.png', Buffer.from(shotQ1.data, 'base64'));

  // Select Option B (index 1) and Confirm
  console.log('Selecting option and confirming...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const card = document.querySelector('[data-exam-card="true"]');
      const opt = Array.from(card.querySelectorAll('button')).find(b => b.textContent.includes('Hướng của vectơ Gradient'));
      if (opt) opt.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 150));

  await send('Runtime.evaluate', {
    expression: `(() => {
      const card = document.querySelector('[data-exam-card="true"]');
      const confirmBtn = Array.from(card.querySelectorAll('button')).find(b => b.textContent.includes('Xác nhận'));
      if (confirmBtn) confirmBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 200));

  const shotConfirmed = await send('Page.captureScreenshot', {});
  fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/verified_quiz_card_q1_confirmed.png', Buffer.from(shotConfirmed.data, 'base64'));

  ws.close();
  console.log('Single card test completed successfully!');
}

main().catch(console.error);
