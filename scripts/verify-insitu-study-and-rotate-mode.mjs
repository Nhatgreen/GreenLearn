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

    // 1. Test Rotate View Mode Button
    console.log('Testing Rotate View Mode Button on left of Zoom bar...');
    const rotateBtnCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = document.querySelector('button[title*="xoay bàn học"]');
          return {
            hasRotateBtn: !!btn,
            title: btn ? btn.getAttribute('title') : null,
            bgBefore: btn ? window.getComputedStyle(btn).backgroundColor : null
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Rotate Button Check:', JSON.stringify(rotateBtnCheck?.result?.value, null, 2));

    // Click Rotate Button to toggle ON
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = document.querySelector('button[title*="xoay bàn học"]');
          if (btn) btn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 300));

    const rotateBtnActive = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = document.querySelector('button[title*="xoay"]');
          return {
            bgAfter: btn ? window.getComputedStyle(btn).backgroundColor : null
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Rotate Button Active State (Cam ViT):', JSON.stringify(rotateBtnActive?.result?.value, null, 2));

    // Turn rotate mode back off for now
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = document.querySelector('button[title*="xoay"]');
          if (btn) btn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 300));

    // 2. Test Flashcard Extraction (No popup, instant note next to paper)
    console.log('Testing Flashcard Extraction on PaperSheet (instant extraction without modal)...');
    const beforeNotesCount = await send('Runtime.evaluate', {
      expression: `document.querySelectorAll('[data-desk-item="true"]').length`,
      returnByValue: true
    });

    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const fcBtn = document.querySelector('button[title*="Thẻ Ghi Nhớ"]');
          if (fcBtn) fcBtn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 500));

    const afterFcCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const hasModal = !!document.querySelector('[role="dialog"]');
          const stickyNotes = Array.from(document.querySelectorAll('textarea')).map(t => t.value);
          const flashcardNote = stickyNotes.find(t => t.includes('THẺ GHI NHỚ'));
          return {
            hasModal,
            foundFlashcardNote: !!flashcardNote,
            flashcardSnippet: flashcardNote ? flashcardNote.slice(0, 100) : null
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Flashcard Instant Extraction Check:', JSON.stringify(afterFcCheck?.result?.value, null, 2));

    const shotFcInstant = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'verified_flashcard_instant_next_to_doc.png'), Buffer.from(shotFcInstant.data, 'base64'));
    console.log('Saved verified_flashcard_instant_next_to_doc.png');

    // 3. Test In-Situ STudy Overlay on PaperSheet
    console.log('Opening In-Situ STudy Overlay on PaperSheet...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const studyBtn = document.querySelector('button[title*="STudy"]');
          if (studyBtn) studyBtn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 500));

    const insituCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const overlay = document.querySelector('[data-overlay="true"]');
          const isInsidePaper = overlay ? !!overlay.closest('[data-desk-item="true"]') : false;
          const aiOption = document.querySelector('label input[type="checkbox"]');
          const aiLabel = aiOption ? aiOption.closest('label')?.innerText : '';
          return {
            hasOverlay: !!overlay,
            isInsidePaper,
            aiLabel: aiLabel?.replace(/\\s+/g, ' ').trim()
          };
        })()
      `,
      returnByValue: true
    });
    console.log('In-Situ STudy Overlay Check:', JSON.stringify(insituCheck?.result?.value, null, 2));

    const shotInsituSummary = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'verified_insitu_study_summary.png'), Buffer.from(shotInsituSummary.data, 'base64'));
    console.log('Saved verified_insitu_study_summary.png');

    // Click 'Tạo tóm tắt' and 'Ghim Tóm Tắt Lên Bàn'
    console.log('Generating summary in in-situ overlay and pinning to desk...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Tạo tóm tắt'));
          if (btn) btn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));

    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const pinBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Ghim Tóm Tắt'));
          if (pinBtn) pinBtn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 500));

    // Switch to Quiz Tab in In-Situ overlay
    console.log('Switching to Quiz Tab in in-situ overlay...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const quizTab = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Trắc Nghiệm'));
          if (quizTab) quizTab.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 500));

    const shotInsituQuiz = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'verified_insitu_study_quiz.png'), Buffer.from(shotInsituQuiz.data, 'base64'));
    console.log('Saved verified_insitu_study_quiz.png');

    // Generate questions and export to desk
    console.log('Generating questions and exporting Exam Sheet right next to paper...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Sinh Câu Hỏi'));
          if (btn) btn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));

    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const exportBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Xuất Đề Thi'));
          if (exportBtn) exportBtn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 500));

    const shotFinalDesk = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artDir, 'verified_all_exported_next_to_paper.png'), Buffer.from(shotFinalDesk.data, 'base64'));
    console.log('Saved verified_all_exported_next_to_paper.png');

    ws.close();
    process.exit(0);
  };
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
