async function test() {
  const listRes = await fetch('http://127.0.0.1:9222/json/list');
  const pages = await listRes.json();
  const page = pages.find(p => p.url.includes('localhost:3000'));
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  ws.onopen = async () => {
    ws.send(JSON.stringify({
      id: 1,
      method: 'Runtime.evaluate',
      params: {
        expression: 'JSON.stringify((() => { const n = document.querySelector(".sticky-note"); return n ? n.getBoundingClientRect() : null; })())'
      }
    }));
    ws.onmessage = (evt) => {
      console.log('Result:', evt.data);
      ws.close();
    };
  };
}
test();
