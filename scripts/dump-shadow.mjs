import http from 'http';

function getTarget() {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const targets = JSON.parse(data);
          resolve(targets.find(t => t.type === 'page' && t.url.includes('localhost:3000')));
        } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function dumpShadowRoot() {
  const target = await getTarget();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  ws.send(JSON.stringify({
    id: 1,
    method: 'Runtime.evaluate',
    params: {
      expression: `(() => {
        const portal = document.querySelector('nextjs-portal');
        if (!portal || !portal.shadowRoot) return 'no shadowRoot';
        
        // Find all headings, spans, divs with text
        const allElements = portal.shadowRoot.querySelectorAll('*');
        const items = [];
        for (const el of allElements) {
          if (el.children.length === 0 && el.textContent.trim()) {
            items.push({ tag: el.tagName, text: el.textContent.trim(), class: el.className });
          }
        }
        return items;
      })()`,
      returnByValue: true
    }
  }));

  ws.onmessage = (e) => {
    const res = JSON.parse(e.data);
    console.log('All shadow elements with text:', JSON.stringify(res.result?.result?.value, null, 2));
    ws.close();
  };
}

dumpShadowRoot();
