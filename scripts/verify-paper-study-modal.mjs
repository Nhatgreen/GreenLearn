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

    // Find or inspect PaperSheet
    const evalRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          // Look for paper sheets or documents
          const papers = Array.from(document.querySelectorAll('div')).filter(el => {
            return el.innerText && (el.innerText.includes('ĐẠO HÀM') || el.innerText.includes('Tờ ôn tập') || el.innerText.includes('XÁC SUẤT') || el.innerText.includes('BÀI TẬP'));
          });
          
          // Let's locate the overlay toolbar buttons for the paper sheet
          const studyBtn = document.querySelector('button[title*="STudy"]');
          const flashcardBtn = document.querySelector('button[title*="Thẻ Ghi Nhớ"]');
          
          return {
            hasStudyBtn: !!studyBtn,
            studyBtnTitle: studyBtn ? studyBtn.getAttribute('title') : null,
            studyBtnText: studyBtn ? studyBtn.innerText.trim() : null,
            hasFlashcardBtn: !!flashcardBtn,
            flashcardBtnTitle: flashcardBtn ? flashcardBtn.getAttribute('title') : null,
            papersCount: papers.length
          };
        })()
      `,
      returnByValue: true
    });

    console.log('Paper buttons check:', JSON.stringify(evalRes?.result?.value, null, 2));

    // Click STudy button
    console.log('Clicking STudy button on PaperSheet...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const studyBtn = document.querySelector('button[title*="STudy"]');
          if (studyBtn) {
            studyBtn.click();
            return true;
          }
          return false;
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));

    // Verify STudy modal layout
    const modalCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const modalHeader = document.querySelector('h3');
          const headerText = modalHeader ? modalHeader.innerText : '';
          const closeBtn = document.querySelector('button[title*="Đóng STudy"]');
          const tabs = Array.from(document.querySelectorAll('button')).filter(b => b.innerText.includes('Tóm Tắt') || b.innerText.includes('Trắc Nghiệm') || b.innerText.includes('Thẻ Ghi Nhớ') || b.innerText.includes('Lộ trình'));
          const tabTexts = tabs.map(t => t.innerText.trim());
          
          const titleLine = document.querySelector('h4');
          const titleText = titleLine ? titleLine.innerText.trim() : '';
          const checkboxLabel = Array.from(document.querySelectorAll('label')).find(l => l.innerText.includes('Sử dụng AI'));
          const summaryBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Tạo tóm tắt'));
          
          return {
            headerText,
            hasCloseBtn: !!closeBtn,
            tabTexts,
            titleText,
            hasCheckbox: !!checkboxLabel,
            hasSummaryBtn: !!summaryBtn,
            summaryBtnBg: summaryBtn ? window.getComputedStyle(summaryBtn).backgroundColor : null
          };
        })()
      `,
      returnByValue: true
    });
    console.log('STudy Modal Check (Summary Tab):', JSON.stringify(modalCheck?.result?.value, null, 2));

    // Click 'Tạo tóm tắt' button to verify generation & compact footer
    console.log('Generating summary...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Tạo tóm tắt'));
          if (btn) btn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));

    // Screenshot STudy modal Summary tab with generated content
    const shotSummaryGen = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'verified_paper_study_summary_generated.png'), Buffer.from(shotSummaryGen.data, 'base64'));
    console.log('Saved verified_paper_study_summary_generated.png');

    // Switch to Quiz Tab
    console.log('Switching to Quiz Tab...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const quizTab = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Trắc Nghiệm'));
          if (quizTab) quizTab.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 500));

    // Click 'Sinh Câu Hỏi' to test non-AI generation
    console.log('Generating quiz questions...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Sinh Câu Hỏi'));
          if (btn) btn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));

    const shotQuizGen = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'verified_paper_study_quiz_generated.png'), Buffer.from(shotQuizGen.data, 'base64'));
    console.log('Saved verified_paper_study_quiz_generated.png');

    const quizCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const titleLine = document.querySelector('h4');
          const titleText = titleLine ? titleLine.innerText.trim() : '';
          const checkboxLabel = Array.from(document.querySelectorAll('label')).find(l => l.innerText.includes('Sử dụng AI'));
          const quizBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Sinh Câu Hỏi') || b.innerText.includes('Tạo đề'));
          
          return {
            titleText,
            hasCheckbox: !!checkboxLabel,
            hasQuizBtn: !!quizBtn,
            quizBtnBg: quizBtn ? window.getComputedStyle(quizBtn).backgroundColor : null
          };
        })()
      `,
      returnByValue: true
    });
    console.log('STudy Modal Check (Quiz Tab):', JSON.stringify(quizCheck?.result?.value, null, 2));

    const shotQuiz = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'verified_paper_study_quiz.png'), Buffer.from(shotQuiz.data, 'base64'));
    console.log('Saved verified_paper_study_quiz.png');

    // Close STudy Modal
    console.log('Closing STudy modal via close button...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const closeBtn = document.querySelector('button[title*="Đóng STudy"]');
          if (closeBtn) closeBtn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 500));

    // Click Flashcard Button
    console.log('Opening Flashcard modal from PaperSheet overlay...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const flashcardBtn = document.querySelector('button[title*="Thẻ Ghi Nhớ"]');
          if (flashcardBtn) flashcardBtn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 500));

    const flashcardCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const fcTitle = document.querySelector('h3');
          const closeBtn = document.querySelector('button[title*="Đóng Thẻ Ghi Nhớ"]');
          const cards = document.querySelectorAll('button');
          return {
            fcTitle: fcTitle ? fcTitle.innerText : '',
            hasCloseBtn: !!closeBtn
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Flashcard Modal Check:', JSON.stringify(flashcardCheck?.result?.value, null, 2));

    const shotFlashcard = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'verified_paper_flashcard_modal.png'), Buffer.from(shotFlashcard.data, 'base64'));
    console.log('Saved verified_paper_flashcard_modal.png');

    // Close Flashcard Modal
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const closeBtn = document.querySelector('button[title*="Đóng Thẻ Ghi Nhớ"]');
          if (closeBtn) closeBtn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 400));

    ws.close();
    process.exit(0);
  };
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
