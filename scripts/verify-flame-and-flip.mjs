// scripts/verify-flame-and-flip.mjs
import fs from 'fs';

async function main() {
  const listRes = await fetch('http://127.0.0.1:9222/json');
  const targets = await listRes.json();
  const page = targets.find(t => t.type === 'page' && t.url.includes('localhost:3000'));
  if (!page) {
    console.error('Target page localhost:3000 not found!');
    process.exit(1);
  }
  console.log(`Connecting to: ${page.url} (${page.id})`);

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = rej;
  });

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 1000000);
    const timeout = setTimeout(() => {
      reject(new Error(`Timeout waiting for ${method} (id=${id})`));
    }, 7000);
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

  console.log('Navigating to http://localhost:3000/ ...');
  await send('Page.navigate', { url: 'http://localhost:3000/' });

  // Wait for initial load
  let loaded = false;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 500));
    const evalRes = await send('Runtime.evaluate', {
      expression: `document.querySelectorAll('button').length`
    });
    if (evalRes && evalRes.result && evalRes.result.value > 5) {
      loaded = true;
      break;
    }
  }

  // Seed Exam Quiz Card into active space in localStorage and reload
  console.log('Seeding exam quiz card to test clean 3D flip...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const saved = localStorage.getItem('vitudy_spaces');
      let spaces = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(spaces) || spaces.length === 0) return;
      spaces[0].items = spaces[0].items.filter(i => i.id !== 'verify-flip-card');
      spaces[0].items.push({
        id: 'verify-flip-card',
        type: 'paper',
        title: 'Đề Ôn Tập Trắc Nghiệm: Giải Tích Đa Biến',
        x: 350,
        y: 120,
        rotation: 0,
        scale: 1,
        zIndex: 999,
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
              options: ['Ngược vectơ Gradient (-∇f)', 'Hướng vectơ Gradient (∇f)', 'Trực giao với vectơ Gradient', 'Tiếp tuyến với đường mức'],
              correctAnswer: 1,
              explanation: 'Vectơ Gradient ∇f luôn chỉ theo hướng hàm số tăng nhanh nhất.'
            },
            {
              id: 'q2',
              question: 'Ma trận đạo hàm bậc hai của hàm nhiều biến được gọi là gì?',
              options: ['Ma trận Jacobian', 'Ma trận Covariance', 'Ma trận Hessian', 'Ma trận Gram'],
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

  // Reload page to reflect seeded item
  await send('Page.navigate', { url: 'http://localhost:3000/' });
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 500));
    const evalRes = await send('Runtime.evaluate', {
      expression: `document.querySelectorAll('[data-exam-card="true"]').length`
    });
    if (evalRes && evalRes.result && evalRes.result.value > 0) {
      console.log('Exam card loaded and mounted.');
      break;
    }
  }

  await new Promise(r => setTimeout(r, 1000));

  // 1. Capture Top-Right Flame Icon
  console.log('--- Capturing Top-Right Flame Icon ---');
  const flameBox = await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('button[title*="Chuỗi"]');
      if (!btn) return null;
      const rect = btn.getBoundingClientRect();
      return { x: rect.x - 10, y: rect.y - 10, width: rect.width + 20, height: rect.height + 20 };
    })()`,
    returnByValue: true
  });

  if (flameBox && flameBox.result && flameBox.result.value) {
    const box = flameBox.result.value;
    const shot = await send('Page.captureScreenshot', {
      clip: {
        x: Math.max(0, box.x),
        y: Math.max(0, box.y),
        width: Math.max(10, box.width),
        height: Math.max(10, box.height),
        scale: 2
      }
    });
    fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/verified_flame_belly_centered.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved verified_flame_belly_centered.png');
  }

  // 2. Check Exam Card & Flip
  console.log('--- Checking Exam Quiz Card Flip ---');
  const cardFound = await send('Runtime.evaluate', {
    expression: `(() => {
      const card = document.querySelector('[data-exam-card="true"]');
      return !!card;
    })()`,
    returnByValue: true
  });

  if (cardFound && cardFound.result && cardFound.result.value) {
    // 1. Click card to select it (so isSelected is true)
    await send('Runtime.evaluate', {
      expression: `(() => {
        const card = document.querySelector('[data-exam-card="true"]');
        if (card) card.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 200));

    // Capture initial selected state
    const cardRect = await send('Runtime.evaluate', {
      expression: `(() => {
        const card = document.querySelector('[data-exam-card="true"]');
        if (!card) return null;
        const rect = card.getBoundingClientRect();
        return { x: rect.x - 30, y: rect.y - 30, width: rect.width + 60, height: rect.height + 60 };
      })()`,
      returnByValue: true
    });

    // 2. Click Start Exam button via synthetic MouseEvent with bubbles: true
    console.log('Finding and clicking "Bắt đầu làm bài" button...');
    const clickResult = await send('Runtime.evaluate', {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('[data-exam-card="true"] button'));
        const startBtn = btns.find(b => b.textContent.includes('Bắt đầu làm bài'));
        if (!startBtn) return 'NOT_FOUND';
        startBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        return 'CLICKED';
      })()`,
      returnByValue: true
    });
    console.log('Click result:', clickResult.result.value);

    // Wait 80ms (midpoint of flip) to capture mid-flip
    await new Promise(r => setTimeout(r, 80));
    const midShot = await send('Page.captureScreenshot', {});
    fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/verified_quiz_card_mid_flip.png', Buffer.from(midShot.data, 'base64'));
    console.log('Saved verified_quiz_card_mid_flip.png');

    // Wait for flip to completely settle (450ms)
    await new Promise(r => setTimeout(r, 450));
    const settledShot = await send('Page.captureScreenshot', {});
    fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/verified_quiz_card_settled_flip.png', Buffer.from(settledShot.data, 'base64'));
    console.log('Saved verified_quiz_card_settled_flip.png');
  } else {
    console.log('No exam card on desk currently, capturing full desk');
    const fullShot = await send('Page.captureScreenshot', {});
    fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/verified_desk_current_state.png', Buffer.from(fullShot.data, 'base64'));
  }

  ws.close();
  console.log('Test complete!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
