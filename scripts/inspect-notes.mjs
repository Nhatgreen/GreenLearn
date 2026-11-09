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
        const textareas = Array.from(document.querySelectorAll('textarea'));
        return textareas.map(ta => ({
          text: ta.value,
          className: ta.className,
          computedFontWeight: window.getComputedStyle(ta).fontWeight,
          computedFontFamily: window.getComputedStyle(ta).fontFamily,
          computedTextAlign: window.getComputedStyle(ta).textAlign,
          styleFontWeight: ta.style.fontWeight,
          styleTextAlign: ta.style.textAlign,
        }));
      })()`,
      returnByValue: true
    });
    console.log(JSON.stringify(res.result?.value, null, 2));
    ws.close();
    process.exit(0);
  };
}
main();
