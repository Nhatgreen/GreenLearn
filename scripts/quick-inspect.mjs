async function main() {
  const pages = await (await fetch('http://127.0.0.1:9222/json')).json();
  const p = pages.find(x => x.type === 'page' && (x.url.includes('3000') || x.url.includes('ViTudy')));
  console.log('Target:', p.url, p.title);
  const ws = new WebSocket(p.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  const send = (method, params = {}) => new Promise((resolve) => {
    const id = Math.floor(Math.random() * 100000);
    const handler = (evt) => {
      const data = JSON.parse(evt.data);
      if (data.id === id) {
        ws.removeEventListener('message', handler);
        resolve(data.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });

  await send('Runtime.enable');
  const res = await send('Runtime.evaluate', {
    expression: `(() => ({
      url: window.location.href,
      title: document.title,
      readyState: document.readyState,
      buttonsCount: document.querySelectorAll('button').length,
      buttons: Array.from(document.querySelectorAll('button')).map(b => ({
        title: b.title || '',
        text: b.textContent.trim().slice(0, 30),
        className: b.className.slice(0, 40)
      }))
    }))()`,
    returnByValue: true
  });
  console.log(JSON.stringify(res?.result?.value, null, 2));
  ws.close();
}
main().catch(console.error);
