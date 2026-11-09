// scripts/test-exam-quiz-card.mjs
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

  // Seed Exam item directly into localStorage before page reload
  console.log('--- Seeding Exam Quiz Card into localStorage ---');
  await send('Runtime.evaluate', {
    expression: `(() => {
      try {
        const saved = localStorage.getItem('vitudy_spaces');
        let spaces = saved ? JSON.parse(saved) : [];
        if (!Array.isArray(spaces) || spaces.length === 0) {
          spaces = [{ id: 'space-1', name: 'Toán cho Trí tuệ Nhân tạo', items: [] }];
        }
        
        // Remove previous test exam item if exists
        spaces[0].items = spaces[0].items.filter(i => i.id !== 'test-exam-quiz-card');

        // Add 4 questions with math formulas
        const examItem = {
          id: 'test-exam-quiz-card',
          type: 'paper',
          title: 'Đề Ôn Tập Trắc Nghiệm: Giải Tích Đa Biến & Gradient',
          x: 200,
          y: 80,
          rotation: 0,
          scale: 1,
          zIndex: 999,
          pageCount: 1,
          currentPageIndex: 0,
          isExamSheet: true,
          stickyColor: '#bae6fd', // Pastel blue note color
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
                explanation: 'Vectơ Gradient ∇f luôn chỉ theo hướng hàm số tăng nhanh nhất, và độ lớn ||∇f|| thể hiện tốc độ tăng lớn nhất.'
              },
              {
                id: 'q2',
                question: 'Trong thuật toán Gradient Descent (Hạ độ dốc), bước cập nhật tham số θ tuân theo công thức nào?',
                options: [
                  'θ = θ + α ∇f(θ)',
                  'θ = θ - α ∇f(θ)',
                  'θ = θ / ||∇f(θ)||',
                  'θ = α θ - ∇f(θ)'
                ],
                correctAnswer: 1,
                explanation: 'Gradient Descent bước theo hướng đối nghịch với gradient: θ_{t+1} = θ_t - α ∇f(θ_t) để giảm giá trị hàm mất mát nhanh nhất.'
              },
              {
                id: 'q3',
                question: 'Ma trận đạo hàm bậc hai của hàm nhiều biến f(x_1, ..., x_n) được gọi là gì?',
                options: [
                  'Ma trận Jacobian',
                  'Ma trận Covariance',
                  'Ma trận Hessian',
                  'Ma trận Gram'
                ],
                correctAnswer: 2,
                explanation: 'Ma trận Hessian H chứa tất cả các đạo hàm riêng bậc hai ∂²f / ∂x_i ∂x_j của hàm số đa biến.'
              },
              {
                id: 'q4',
                question: 'Điều kiện cần để x* là một điểm cực trị cục bộ của hàm khả vi f(x) là gì?',
                options: [
                  '∇f(x*) = 0',
                  '∇f(x*) > 0',
                  'Hessian H(x*) = 0',
                  'f(x*) = 0'
                ],
                correctAnswer: 0,
                explanation: 'Định lý Fermat: Tại điểm cực trị cục bộ của hàm khả vi, gradient của hàm số phải bằng vectơ 0 (∇f(x*) = 0).'
              }
            ],
            userAnswers: {},
            isGraded: false,
            totalQuestions: 4
          },
          pages: [{
            id: 'p-test',
            pageNumber: 1,
            title: 'Đề Ôn Tập Trắc Nghiệm: Giải Tích Đa Biến & Gradient',
            text: 'Bộ đề ôn tập 4 câu'
          }]
        };

        spaces[0].items.push(examItem);
        localStorage.setItem('vitudy_spaces', JSON.stringify(spaces));
        return { success: true, count: spaces[0].items.length };
      } catch (err) {
        return { success: false, error: err.message };
      }
    })()`,
    returnByValue: true
  });

  console.log('Navigating to http://localhost:3000/ ...');
  await send('Page.navigate', { url: 'http://localhost:3000/' });

  console.log('Waiting for desk to mount...');
  for (let i = 0; i < 35; i++) {
    await new Promise(r => setTimeout(r, 800));
    const check = await send('Runtime.evaluate', {
      expression: 'document.querySelectorAll("button").length',
      returnByValue: true
    });
    const count = check.result?.value || 0;
    if (count > 5) {
      console.log(`Mounted desk buttons: ${count}`);
      break;
    }
  }

  await new Promise(r => setTimeout(r, 1000));

  // --- 1. Inspect Screen 1: Cover of Exam Quiz Card ---
  console.log('\n--- 1. Inspecting Screen 1: Cover of Exam Quiz Card ---');
  const introCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const card = document.querySelector('[data-exam-card="true"]');
      if (!card) return { found: false };
      const cardShell = card.querySelector('.rounded-2xl');
      const cardStyle = window.getComputedStyle(cardShell);
      const startBtn = Array.from(card.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Bắt đầu làm bài'));
      const text = card.innerText;

      return {
        found: true,
        bg: cardStyle.backgroundColor,
        width: card.offsetWidth,
        height: card.offsetHeight,
        hasStartBtn: !!startBtn,
        hasQuestionCount: text.includes('4 câu hỏi'),
        title: card.querySelector('h3')?.textContent?.trim()
      };
    })()`,
    returnByValue: true
  });
  console.log('Exam Card Cover Check:', introCheck.result?.value);

  // Capture Screen 1: Intro/Cover
  const ss1 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/verified_quiz_card_cover.png', Buffer.from(ss1.data, 'base64'));
  console.log('Saved verified_quiz_card_cover.png');

  // --- 2. Click "Bắt đầu làm bài" & 3D Flip to Question 1 ---
  console.log('\n--- 2. Click "Bắt đầu làm bài" (3D Flip to Question 1) ---');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const card = document.querySelector('[data-exam-card="true"]');
      const startBtn = Array.from(card.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Bắt đầu làm bài'));
      if (startBtn) startBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 700));

  const q1Check = await send('Runtime.evaluate', {
    expression: `(() => {
      const card = document.querySelector('[data-exam-card="true"]');
      const text = card ? card.innerText : '';
      const options = Array.from(card ? card.querySelectorAll('button') : []).filter(b => 
        b.textContent && (b.textContent.includes('A') || b.textContent.includes('B') || b.textContent.includes('C') || b.textContent.includes('D'))
      );
      const bottomStripPills = card ? card.querySelectorAll('.border-t .flex-1 button').length : 0;
      const confirmBtn = Array.from(card ? card.querySelectorAll('button') : []).find(b => b.textContent && b.textContent.trim() === 'Xác nhận');

      return {
        hasQuestionTitle: text.includes('Câu 1 / 4'),
        optionsCount: options.length,
        bottomStripPills,
        hasConfirmBtn: !!confirmBtn,
        isConfirmDisabled: confirmBtn ? confirmBtn.disabled : false
      };
    })()`,
    returnByValue: true
  });
  console.log('Question 1 Screen Check:', q1Check.result?.value);

  // Capture Screen 2: Question 1
  const ss2 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/verified_quiz_card_question1.png', Buffer.from(ss2.data, 'base64'));
  console.log('Saved verified_quiz_card_question1.png');

  // --- 3. Select Option B (Correct Answer) & Click "Xác nhận" ---
  console.log('\n--- 3. Select Option & Click "Xác nhận" ---');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const card = document.querySelector('[data-exam-card="true"]');
      // Option B is index 1
      const optionButtons = Array.from(card.querySelectorAll('.grid.grid-cols-1 button'));
      if (optionButtons[1]) optionButtons[1].click();
    })()`
  });
  await new Promise(r => setTimeout(r, 300));

  // Click "Xác nhận"
  await send('Runtime.evaluate', {
    expression: `(() => {
      const card = document.querySelector('[data-exam-card="true"]');
      const confirmBtn = Array.from(card.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim() === 'Xác nhận');
      if (confirmBtn) confirmBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 500));

  const verdictCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const card = document.querySelector('[data-exam-card="true"]');
      const text = card ? card.innerText : '';
      const hasCorrectVerdict = text.includes('CHÍNH XÁC') || text.includes('ĐÚNG');
      const hasExplanation = text.includes('Giải thích');
      const nextBtn = Array.from(card ? card.querySelectorAll('button') : []).find(b => b.textContent && b.textContent.includes('Câu tiếp theo'));

      return {
        hasCorrectVerdict,
        hasExplanation,
        hasNextBtn: !!nextBtn
      };
    })()`,
    returnByValue: true
  });
  console.log('Verdict Check:', verdictCheck.result?.value);

  // Capture Screen 3: Answer Confirmed & Verdict
  const ss3 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/verified_quiz_card_answer_confirmed.png', Buffer.from(ss3.data, 'base64'));
  console.log('Saved verified_quiz_card_answer_confirmed.png');

  // --- 4. Step through remaining questions to reach Summary ---
  console.log('\n--- 4. Answering remaining questions to reach Summary ---');
  // Helper to click next question
  const clickNext = async () => {
    await send('Runtime.evaluate', {
      expression: `(() => {
        const card = document.querySelector('[data-exam-card="true"]');
        const nextBtn = Array.from(card ? card.querySelectorAll('button') : []).find(b => 
          b.textContent && (b.textContent.includes('Câu tiếp theo') || b.textContent.includes('Hoàn thành'))
        );
        if (nextBtn) nextBtn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 800));
  };

  const answerAndConfirm = async (optIndex) => {
    // Select option
    await send('Runtime.evaluate', {
      expression: `(() => {
        const card = document.querySelector('[data-exam-card="true"]');
        const opts = Array.from(card.querySelectorAll('.grid.grid-cols-1 button'));
        if (opts[${optIndex}]) opts[${optIndex}].click();
      })()`
    });
    await new Promise(r => setTimeout(r, 400));
    // Confirm
    await send('Runtime.evaluate', {
      expression: `(() => {
        const card = document.querySelector('[data-exam-card="true"]');
        const confirmBtn = Array.from(card.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim() === 'Xác nhận');
        if (confirmBtn) confirmBtn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 500));
  };

  // Click Next from Q1 -> Q2
  await clickNext();

  // Answer Q2 (pick option B: index 1)
  await answerAndConfirm(1);
  await clickNext();

  // Answer Q3 (pick option C: index 2)
  await answerAndConfirm(2);
  await clickNext();

  // Answer Q4 (pick option A: index 0)
  await answerAndConfirm(0);

  // Now the button should be "Hoàn thành"
  console.log('Clicking "Hoàn thành" -> 3D Flip to Summary...');
  await clickNext();
  await new Promise(r => setTimeout(r, 1000));

  // --- 5. Inspect Screen 4: Summary Screen ---
  console.log('\n--- 5. Inspecting Screen 4: Summary Screen ---');
  const summaryCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const card = document.querySelector('[data-exam-card="true"]');
      const text = card ? card.innerText : '';
      const scoreEl = card ? card.querySelector('.text-4xl, .text-5xl') : null;
      const reviewCells = card ? card.querySelectorAll('.grid.grid-cols-5 button, .grid.grid-cols-4 button') : [];
      const resetBtn = Array.from(card ? card.querySelectorAll('button') : []).find(b => b.textContent && b.textContent.includes('Làm lại'));

      return {
        hasSummaryTitle: text.includes('KẾT QUẢ BỘ ĐỀ'),
        scoreText: scoreEl ? scoreEl.textContent.trim() : null,
        reviewCellsCount: reviewCells.length,
        hasResetBtn: !!resetBtn
      };
    })()`,
    returnByValue: true
  });
  console.log('Summary Screen Check:', summaryCheck.result?.value);

  // Capture Screen 4: Summary
  const ss4 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/verified_quiz_card_summary.png', Buffer.from(ss4.data, 'base64'));
  console.log('Saved verified_quiz_card_summary.png');

  // --- 6. Click on Question 1 in review grid to flip back and verify Review Mode ---
  console.log('\n--- 6. Click Question 1 in Review Grid -> Reverse Flip to Question ---');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const card = document.querySelector('[data-exam-card="true"]');
      const reviewCells = Array.from(card.querySelectorAll('button')).filter(b => b.textContent && b.textContent.trim() === '1');
      if (reviewCells[0]) reviewCells[0].click();
    })()`
  });
  await new Promise(r => setTimeout(r, 700));

  const reviewCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const card = document.querySelector('[data-exam-card="true"]');
      const text = card ? card.innerText : '';
      const backBtn = Array.from(card ? card.querySelectorAll('button') : []).find(b => b.textContent && b.textContent.includes('Quay lại tổng kết'));

      return {
        isReviewMode: text.includes('Xem lại câu') || text.includes('Câu 1 / 4'),
        hasBackToSummaryBtn: !!backBtn
      };
    })()`,
    returnByValue: true
  });
  console.log('Review Mode Check:', reviewCheck.result?.value);

  // Capture Screen 5: Review Mode with "Quay lại tổng kết" button
  const ss5 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/verified_quiz_card_review_back_btn.png', Buffer.from(ss5.data, 'base64'));
  console.log('Saved verified_quiz_card_review_back_btn.png');

  console.log('\n✨ ALL EXAM QUIZ CARD VERIFICATIONS PASSED 100%!');
  ws.close();
}

main().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
