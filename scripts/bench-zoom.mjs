async function bench() {
  const ws = new WebSocket('ws://127.0.0.1:9222/devtools/page/2BF8FEB7011DC9786B90A2ACCE409FD3');
  await new Promise(r => ws.onopen = r);
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 1000000);
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

  const res = await send('Runtime.evaluate', {
    expression: `(async () => {
      const desk = document.querySelector('.cursor-default') || document.body;
      const frameTimes = [];
      let running = true;
      let last = performance.now();
      function loop() {
        const now = performance.now();
        frameTimes.push(now - last);
        last = now;
        if (running) requestAnimationFrame(loop);
      }
      requestAnimationFrame(loop);

      // Dispatch 30 wheel events spaced over 450ms
      for (let i = 0; i < 30; i++) {
        const evt = new WheelEvent('wheel', { deltaY: (i % 2 === 0 ? -120 : -80), clientX: 600, clientY: 400, bubbles: true, cancelable: true });
        desk.dispatchEvent(evt);
        await new Promise(r => setTimeout(r, 15));
      }
      await new Promise(r => setTimeout(r, 100));
      running = false;

      const longFrames = frameTimes.filter(t => t > 25);
      const avg = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      return { 
        totalFrames: frameTimes.length, 
        avgFrameTime: Number(avg.toFixed(2)), 
        longFramesCount: longFrames.length, 
        worstFrame: Number(Math.max(...frameTimes).toFixed(2)) 
      };
    })()`,
    awaitPromise: true,
    returnByValue: true
  });
  console.log('Wheel zoom performance:', res.result?.value);
  ws.close();
  process.exit(0);
}
bench();
