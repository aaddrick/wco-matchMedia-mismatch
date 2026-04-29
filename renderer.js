// Probe the four WCO entry points and render a comparison table.
// Run after the next paint so titleBarOverlay has been applied.

function probe() {
  const wco = navigator.windowControlsOverlay;
  const rect = wco && wco.getTitlebarAreaRect ? wco.getTitlebarAreaRect() : null;

  // env(titlebar-area-width) is only readable via custom-property indirection.
  const probeStyle = document.createElement('style');
  probeStyle.textContent = ':root { --probe-w: env(titlebar-area-width); --probe-h: env(titlebar-area-height) }';
  document.head.appendChild(probeStyle);
  const cs = getComputedStyle(document.documentElement);

  const mq = window.matchMedia('(display-mode: window-controls-overlay)');

  return [
    ['navigator.windowControlsOverlay.visible', String(wco && wco.visible), 'true'],
    ['getTitlebarAreaRect() width × height',
      rect ? `${rect.width} × ${rect.height}` : '(unavailable)',
      'non-zero'],
    ['env(titlebar-area-width)',
      cs.getPropertyValue('--probe-w').trim() || '(empty)',
      'non-empty'],
    ['env(titlebar-area-height)',
      cs.getPropertyValue('--probe-h').trim() || '(empty)',
      'non-empty'],
    ["matchMedia('(display-mode: window-controls-overlay)').matches",
      String(mq.matches),
      'true'],
  ];
}

function render(rows) {
  const tbody = document.querySelector('#results tbody');
  for (const [signal, value, expected] of rows) {
    const tr = document.createElement('tr');
    const ok = value === expected
      || (expected === 'non-zero' && /^[1-9]/.test(value))
      || (expected === 'non-empty' && value !== '(empty)' && value !== '');
    tr.className = ok ? 'ok' : 'bad';
    tr.innerHTML = `<td>${signal}</td><td>${value}</td><td>${expected}</td>`;
    tbody.appendChild(tr);
  }
  console.log('WCO probe: ' + JSON.stringify(Object.fromEntries(rows.map(([k, v]) => [k, v])), null, 2));
}

window.addEventListener('DOMContentLoaded', () => {
  // One paint frame after load lets titleBarOverlay settle before we probe.
  requestAnimationFrame(() => requestAnimationFrame(() => render(probe())));
});
