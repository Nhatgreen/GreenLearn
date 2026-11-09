async function main() {
  const listRes = await fetch('http://127.0.0.1:9222/json/list');
  const pages = await listRes.json();
  const page = pages.find(p => p.type === 'page' && p.url.includes('localhost:3000'));
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  ws.onopen = async () => {
    ws.send(JSON.stringify({
      id: 1,
      method: 'Runtime.evaluate',
      params: {
        expression: `(() => {
          const el = document.querySelector('nextjs-portal, [data-nextjs-dev-indicator], [data-nextjs-toast]');
          if (!el) return { found: false };
          return {
            tag: el.tagName,
            outerHTML: el.outerHTML.slice(0, 300),
            displayed: window.getComputedStyle(el).display,
            visibility: window.getComputedStyle(el).visibility,
            rect: el.getBoundingClientRect()
          };
        })()`,
        returnByValue: true
      }
    }));
    ws.onmessage = (evt) => {
      console.log(JSON.parse(evt.data).result?.result?.value);
      ws.close();
      process.exit(0);
    };
  };
}
main();
