async function main() {
  const listRes = await fetch('http://127.0.0.1:9222/json/list');
  const pages = await listRes.json();
  const page = pages.find(p => p.url.includes('localhost:3000'));
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
    // Enable console and page events
    await send('Console.enable');
    await send('Page.enable');
    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.method === 'Console.messageAdded') {
        console.log('Console:', msg.params.message.text);
      }
    };

    console.log('Navigating to http://localhost:3000...');
    await send('Page.navigate', { url: 'http://localhost:3000' });
    await new Promise(r => setTimeout(r, 4000));

    const check = await send('Runtime.evaluate', {
      expression: `(() => {
        return {
          title: document.title,
          text: document.body.innerText.slice(0, 300),
          deskItems: document.querySelectorAll('[data-desk-item]').length
        };
      })()`,
      returnByValue: true
    });

    console.log('Page check:', check.result.value);
    ws.close();
  };
}

main();
