async function main() {
  const listRes = await fetch('http://127.0.0.1:9222/json/list');
  const pages = await listRes.json();
  const page = pages.find(p => p.url.includes('localhost:3000'));
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 1;
  const send = (method, params = {}) => new Promise(r => {
    const curId = id++;
    const h = (e) => {
      const d = JSON.parse(e.data);
      if (d.id === curId) { ws.removeEventListener('message', h); r(d.result); }
    };
    ws.addEventListener('message', h);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });
  ws.onopen = async () => {
    const res = await send('Runtime.evaluate', {
      expression: `(() => {
        // Find selected note
        const selectedNote = document.querySelector('div[data-desk-item="true"].ring-2') || document.querySelector('div[data-desk-item="true"]');
        if (!selectedNote) return 'no note found';
        const ta = selectedNote.querySelector('textarea');
        const boldBtn = selectedNote.querySelector('button[title*="in đậm"]');
        const midBtn = selectedNote.querySelector('button[title*="Căn lề giữa"]');
        const rightBtn = selectedNote.querySelector('button[title*="Căn lề phải"]');
        
        return {
          hasNote: !!selectedNote,
          text: ta?.value,
          hasBoldBtn: !!boldBtn,
          hasMidBtn: !!midBtn,
          hasRightBtn: !!rightBtn
        };
      })()`,
      returnByValue: true
    });
    console.log(res.result?.value);
    ws.close();
    process.exit(0);
  };
}
main();
