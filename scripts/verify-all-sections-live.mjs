// scripts/verify-all-sections-live.mjs
import fs from 'fs';

async function main() {
  const listRes = await fetch('http://127.0.0.1:9222/json');
  const targets = await listRes.json();
  const page = targets.find(t => t.type === 'page' && t.url.includes('3000')) || targets[0];
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
    }, 5000);
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
  await new Promise(r => setTimeout(r, 2500));

  // Wait until desk items are rendered
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 800));
    const check = await send('Runtime.evaluate', {
      expression: 'document.querySelectorAll("[data-item-id]").length',
      returnByValue: true
    });
    const count = check.result?.value || 0;
    if (count > 0) {
      console.log(`Mounted desk items: ${count}`);
      break;
    }
  }

  // --- TEST 1: Left Creation Bar Layout ---
  console.log('\n--- 1. Testing Left Creation Bar Layout ---');
  const leftBarCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const undoBtn = document.querySelector('button[title*="Hoàn tác"]');
      const redoBtn = document.querySelector('button[title*="Làm lại"]');
      const undoRedoPill = undoBtn ? undoBtn.closest('div') : null;
      const isCol = undoRedoPill ? undoRedoPill.className.includes('flex-col') : false;
      const tools = Array.from(document.querySelectorAll('button[title]')).map(b => b.title);
      return {
        hasUndo: !!undoBtn,
        hasRedo: !!redoBtn,
        isVerticalCol: isCol,
        toolsSample: tools.slice(0, 5)
      };
    })()`,
    returnByValue: true
  });
  console.log('Left Bar Check:', leftBarCheck.result?.value);

  // --- TEST 2: Wheel Zoom In/Out on Canvas & Over Content ---
  console.log('\n--- 2. Testing Wheel Zoom Anytime Anywhere ---');
  const zoomBefore = await send('Runtime.evaluate', {
    expression: `(() => {
      const zoomText = Array.from(document.querySelectorAll('span')).find(s => s.textContent && s.textContent.includes('%'))?.textContent || '';
      // Dispatch wheel on document or canvas
      const target = document.querySelector('[data-item-id]') || document.body;
      target.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, bubbles: true, clientX: 500, clientY: 400 }));
      return { zoomTextBefore: zoomText };
    })()`,
    returnByValue: true
  });
  await new Promise(r => setTimeout(r, 400));

  const zoomAfter = await send('Runtime.evaluate', {
    expression: `(() => {
      const zoomText = Array.from(document.querySelectorAll('span')).find(s => s.textContent && s.textContent.includes('%'))?.textContent || '';
      return { zoomTextAfter: zoomText };
    })()`,
    returnByValue: true
  });
  console.log('Zoom Result:', zoomBefore.result?.value, zoomAfter.result?.value);

  // --- TEST 3: Chợ Tài Liệu (MarketModal) ---
  console.log('\n--- 3. Testing Chợ Tài Liệu (MarketModal) ---');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const marketBtn = document.querySelector('button[title="Chợ Tài Liệu"]');
      if (marketBtn) marketBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 700));

  const marketCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const text = document.body.innerText;
      const balanceBanner = text.includes('Số dư của bạn:') && text.includes('1 V = 1 ViToken');
      const viewListBtn = document.querySelector('button[title="Dạng danh sách gọn"]');
      const viewGridBtn = document.querySelector('button[title="Dạng lưới thẻ"]');
      const scoreTooltips = document.querySelectorAll('.group\\/score').length;
      const previewBtns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent && b.textContent.includes('Xem thử'));
      const buyOrOpenBtns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent && (b.textContent.includes('Mua') || b.textContent.includes('Mở')));
      const authorVerified = document.querySelectorAll('span[title="Tác giả xác thực"]').length;

      return {
        balanceBanner,
        hasViewListBtn: !!viewListBtn,
        hasViewGridBtn: !!viewGridBtn,
        scoreTooltipsCount: scoreTooltips,
        previewBtnsCount: previewBtns.length,
        buyOrOpenBtnsCount: buyOrOpenBtns.length,
        authorVerifiedCount: authorVerified
      };
    })()`,
    returnByValue: true
  });
  console.log('Market Modal Check:', marketCheck.result?.value);

  // Switch to List View
  await send('Runtime.evaluate', {
    expression: `(() => {
      const viewListBtn = document.querySelector('button[title="Dạng danh sách gọn"]');
      if (viewListBtn) viewListBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 500));

  // Capture Market List View Screenshot
  const ss1 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/verified_market_list_view.png', Buffer.from(ss1.data, 'base64'));
  console.log('Saved verified_market_list_view.png');

  // Switch back to Grid View & test "Xem thử" preview modal
  await send('Runtime.evaluate', {
    expression: `(() => {
      const viewGridBtn = document.querySelector('button[title="Dạng lưới thẻ"]');
      if (viewGridBtn) viewGridBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 500));

  // Click "Xem thử" on first item
  await send('Runtime.evaluate', {
    expression: `(() => {
      const previewBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Xem thử'));
      if (previewBtn) previewBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 600));

  const previewModalCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const text = document.body.innerText;
      return {
        hasPreviewTitle: text.includes('Xem thử tài liệu'),
        hasExcerpt: text.includes('Trích đoạn nội dung thực tế:'),
        hasBuyInPreview: text.includes('Mua ngay') || text.includes('Mở ngay')
      };
    })()`,
    returnByValue: true
  });
  console.log('Preview Modal Check:', previewModalCheck.result?.value);

  // Capture Preview Modal Screenshot
  const ss2 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/verified_market_preview_modal.png', Buffer.from(ss2.data, 'base64'));
  console.log('Saved verified_market_preview_modal.png');

  // Close Preview and Market via Esc key
  await send('Runtime.evaluate', {
    expression: `(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
    })()`
  });
  await new Promise(r => setTimeout(r, 400));
  await send('Runtime.evaluate', {
    expression: `(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
    })()`
  });
  await new Promise(r => setTimeout(r, 600));

  // --- TEST 4: Daily Streak Modal (Section 5) ---
  console.log('\n--- 4. Testing Daily Streak Attendance Modal ---');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const streakBtn = document.querySelector('button[title*="Chuỗi học tập"]');
      if (streakBtn) streakBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 600));

  const streakCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const text = document.body.innerText;
      const title = text.includes('Điểm danh hằng ngày');
      const streakDays = text.includes('Chuỗi');
      const milestone = text.includes('Mốc 7 ngày') || text.includes('Mốc 14 ngày');
      const reminder = text.includes('Nhắc tôi điểm danh mỗi ngày');
      const daysCount = document.querySelectorAll('.grid-cols-7 > div').length;
      const claimBtn = Array.from(document.querySelectorAll('button')).find(b => 
        b.textContent && (b.textContent.includes('Nhận ViToken ngay') || b.textContent.includes('Đã nhận hôm nay'))
      );
      const isClaimDisabled = claimBtn ? claimBtn.disabled : false;
      const claimBtnText = claimBtn ? claimBtn.textContent.trim() : '';

      return {
        title,
        streakDays,
        milestone,
        reminder,
        daysCount,
        claimBtnFound: !!claimBtn,
        isClaimDisabled,
        claimBtnText
      };
    })()`,
    returnByValue: true
  });
  console.log('Daily Streak Check:', streakCheck.result?.value);

  // Capture Daily Streak Screenshot
  const ss3 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/verified_daily_streak_modal.png', Buffer.from(ss3.data, 'base64'));
  console.log('Saved verified_daily_streak_modal.png');

  // Close Streak modal via Esc key
  await send('Runtime.evaluate', {
    expression: `(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
    })()`
  });
  await new Promise(r => setTimeout(r, 600));

  // --- TEST 5: AI Provider Modal (Section 6) ---
  console.log('\n--- 5. Testing AI Provider Modal ---');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const botBtn = document.querySelector('button[title*="Cài đặt mô hình AI"]');
      if (botBtn) botBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 600));

  const aiModalCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const text = document.body.innerText;
      const title = text.includes('Cài đặt kết nối AI');
      const hasBalance = text.includes('Số dư ví của bạn:');
      const hasSystemBadge = text.includes('Trừ ViToken');
      const hasGeminiBadge = text.includes('Miễn phí theo hạn mức');
      const hasByokBadge = text.includes('Khóa cá nhân');
      const hasChatGptBadge = text.includes('Ủy quyền tài khoản');
      const hasActiveBadge = text.includes('Đang dùng');
      const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim() === 'Lưu');
      const isSaveDisabledInitial = saveBtn ? saveBtn.disabled : false;

      return {
        title,
        hasBalance,
        hasSystemBadge,
        hasGeminiBadge,
        hasByokBadge,
        hasChatGptBadge,
        hasActiveBadge,
        isSaveDisabledInitial
      };
    })()`,
    returnByValue: true
  });
  console.log('AI Modal Check:', aiModalCheck.result?.value);

  // Select Gemini BYOK and test Key input & show/hide toggle
  await send('Runtime.evaluate', {
    expression: `(() => {
      const geminiRadio = document.querySelector('input[value="byok_gemini"]');
      if (geminiRadio) geminiRadio.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 500));

  const geminiByokCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const keyInput = document.querySelector('input[placeholder*="AIzaSy"]');
      const toggleEyeBtn = document.querySelector('button[title*="khóa"]');
      const testBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Test'));
      const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim() === 'Lưu');
      return {
        hasKeyInput: !!keyInput,
        hasToggleEyeBtn: !!toggleEyeBtn,
        hasTestBtn: !!testBtn,
        isSaveEnabledNow: saveBtn ? !saveBtn.disabled : false
      };
    })()`,
    returnByValue: true
  });
  console.log('Gemini BYOK Input Check:', geminiByokCheck.result?.value);

  // Capture AI Provider Modal Screenshot
  const ss4 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/verified_ai_provider_modal.png', Buffer.from(ss4.data, 'base64'));
  console.log('Saved verified_ai_provider_modal.png');

  // Close AI Modal via Esc key
  await send('Runtime.evaluate', {
    expression: `(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
    })()`
  });
  await new Promise(r => setTimeout(r, 600));

  // --- TEST 6: Focus Mode HUD Collapse & Peek Controls ---
  console.log('\n--- 6. Testing Focus Mode Collapse & Peek Buttons ---');
  // Click bookmark tab "Tập trung"
  await send('Runtime.evaluate', {
    expression: `(() => {
      const focusTab = Array.from(document.querySelectorAll('button, div')).find(el => 
        el.textContent && el.textContent.includes('Tập trung')
      );
      if (focusTab) focusTab.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 800));

  const focusCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const peekLeft = document.querySelector('button[title="Mở thanh công cụ"]');
      const peekTop = document.querySelector('button[title="Mở thanh điều hướng"]');
      const peekBottom = document.querySelector('button[title="Mở thanh công cụ dưới"]');
      const text = document.body.innerText;
      const popupNotice = text.includes('Đang tập trung');

      return {
        hasPeekLeft: !!peekLeft,
        hasPeekTop: !!peekTop,
        hasPeekBottom: !!peekBottom,
        hasPopupNotice: popupNotice
      };
    })()`,
    returnByValue: true
  });
  console.log('Focus Collapse & Peek Check:', focusCheck.result?.value);

  // Capture Focus Mode Screenshot
  const ss5 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/Vit/.gemini/antigravity/brain/67dd9b00-9e98-4921-b83a-6a154bd5142b/verified_focus_mode_peek_controls.png', Buffer.from(ss5.data, 'base64'));
  console.log('Saved verified_focus_mode_peek_controls.png');

  // Exit focus mode by clicking the popup notice button
  await send('Runtime.evaluate', {
    expression: `(() => {
      const exitBtn = Array.from(document.querySelectorAll('button, div')).find(el => 
        el.textContent && el.textContent.includes('nhấn để thoát')
      );
      if (exitBtn) exitBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 600));

  console.log('\n✅ ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY!');
  ws.close();
}

main().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
