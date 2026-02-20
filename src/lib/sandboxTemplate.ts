/**
 * sandboxTemplate.ts
 *
 * Builds the srcdoc HTML string for the AI-generated component sandbox.
 *
 * Security model:
 *   sandbox="allow-scripts" — JS runs, but no cookies, no localStorage,
 *   no same-origin access, no navigation.
 *
 * Runtime stack inside the iframe:
 *   - React 18 (UMD from CDN)
 *   - ReactDOM 18 (UMD from CDN)
 *   - Babel standalone (JSX transpiler, loaded from CDN)
 *   - Our design system CSS variables + fonts injected directly
 *   - A global `ds` object with design tokens accessible in component code
 *   - A global `render(element)` function the AI code calls to mount
 *   - Auto-resize via postMessage + ResizeObserver
 */
export function buildSandboxHTML(componentCode: string): string {
  // Safely escape the component code to embed inside a JS string literal
  const escaped = JSON.stringify(componentCode)

  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Bebas+Neue&display=swap" rel="stylesheet" />
<style>
  /* ── Design system CSS variables ── */
  :root {
    --color-bg:        #FFFCF0;
    --color-surface:   #FFFFFF;
    --color-surface-2: #F5EFE0;
    --color-border:    #000000;
    --color-yellow:    #FFE500;
    --color-red:       #FF3B3B;
    --color-blue:      #0055FF;
    --color-green:     #00CC44;
    --color-pink:      #FF2D78;
    --color-text:      #0A0A0A;
    --color-muted:     #555555;
    --color-faint:     #999999;
    --shadow-sm:  2px 2px 0px #000;
    --shadow-md:  3px 3px 0px #000;
    --shadow-lg:  5px 5px 0px #000;
    --font-display: 'Bebas Neue', sans-serif;
    --font-mono:    'DM Mono', monospace;
  }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    background: var(--color-bg);
    color: var(--color-text);
    font-family: var(--font-mono);
    font-size: 14px;
    line-height: 1.6;
  }
  #root { padding: 0; }
  /* Scrollbar */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: #000; }
  /* Selection */
  ::selection { background: var(--color-yellow); color: #000; }
  /* Error display — subtle, not alarming */
  #sandbox-error {
    display: none;
    padding: 8px 10px;
    background: #FAFAF5;
    border-top: 1px solid #e0e0e0;
    font-family: var(--font-mono);
    font-size: 10px;
    color: #999;
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 60px;
    overflow-y: auto;
  }
  #sandbox-error .error-label {
    font-size: 9px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-bottom: 2px;
    font-weight: 500;
    color: #bbb;
  }
</style>
</head>
<body>
<div id="root"></div>
<div id="sandbox-error"><div class="error-label">Error</div><div id="sandbox-error-msg"></div></div>

<!-- React + ReactDOM UMD -->
<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<!-- Babel standalone for JSX transpilation -->
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

<script>
(function() {
  // ── Globals injected for AI component code ──────────────────
  const { useState, useEffect, useRef, useCallback, useMemo, useReducer } = React;

  // Design system helper object available as 'ds' in component code
  const ds = {
    colors: {
      bg: '#FFFCF0', surface: '#FFFFFF', surface2: '#F5EFE0',
      border: '#000', yellow: '#FFE500', red: '#FF3B3B',
      blue: '#0055FF', green: '#00CC44', pink: '#FF2D78',
      text: '#0A0A0A', muted: '#555', faint: '#999',
    },
    shadows: {
      sm: '2px 2px 0px #000',
      md: '3px 3px 0px #000',
      lg: '5px 5px 0px #000',
    },
    fonts: {
      display: "'Bebas Neue', sans-serif",
      mono: "'DM Mono', monospace",
    },
    // Helper: brutalist card style
    card: (accent) => ({
      background: '#fff',
      border: '2px solid #000',
      boxShadow: '3px 3px 0px #000',
      padding: '16px',
    }),
    // Helper: press-down button style
    btn: (bg = '#000', color = '#FFE500') => ({
      background: bg,
      border: '2px solid #000',
      boxShadow: '2px 2px 0px #000',
      color,
      fontFamily: "'DM Mono', monospace",
      fontSize: 13,
      cursor: 'pointer',
      padding: '8px 16px',
      transition: 'transform 0.07s, box-shadow 0.07s',
    }),
    // Helper: stamp / label text
    stamp: {
      fontFamily: "'DM Mono', monospace",
      fontSize: 10,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: '#555',
    },
    // Helper: display heading
    heading: (size = 24) => ({
      fontFamily: "'Bebas Neue', sans-serif",
      fontSize: size,
      letterSpacing: '0.04em',
      color: '#000',
    }),
  };

  // ── Auto-resize via postMessage ─────────────────────────────
  function postHeight() {
    const h = document.body.scrollHeight;
    window.parent.postMessage({ type: 'sandbox-resize', height: h }, '*');
  }
  const ro = new ResizeObserver(postHeight);
  ro.observe(document.body);

  // ── Error handler ───────────────────────────────────────────
  window.onerror = function(msg, src, line, col, err) {
    // Only show errors for complete code (contains render call)
    // Skip transient errors from partial/streaming code
    var componentCode = ${escaped};
    if (componentCode.indexOf('render(') === -1) return true;
    var el = document.getElementById('sandbox-error');
    var msgEl = document.getElementById('sandbox-error-msg');
    if (el && msgEl) {
      msgEl.textContent = err ? (err.stack || msg) : msg;
      el.style.display = 'block';
    }
    document.getElementById('root').innerHTML = '';
    postHeight();
    return true;
  };

  // ── render() — the AI code calls this to mount its component ─
  let _root = null;
  window.render = function(element) {
    const container = document.getElementById('root');
    if (!_root) _root = ReactDOM.createRoot(container);
    _root.render(element);
    // Give React a tick to paint, then measure
    setTimeout(postHeight, 50);
  };

  // ── Transpile + execute the AI component code ────────────────
  const componentCode = ${escaped};

  try {
    const transpiled = Babel.transform(componentCode, {
      presets: [['react', { runtime: 'classic' }]],
      filename: 'component.jsx',
    }).code;

    // Build a scoped function with all helpers in scope
    const fn = new Function(
      'React', 'ReactDOM',
      'useState', 'useEffect', 'useRef', 'useCallback', 'useMemo', 'useReducer',
      'render', 'ds',
      transpiled
    );

    fn(
      React, ReactDOM,
      useState, useEffect, useRef, useCallback, useMemo, useReducer,
      window.render, ds
    );
  } catch(err) {
    // Only show errors for complete code (contains render call)
    if (componentCode.indexOf('render(') !== -1) {
      const el = document.getElementById('sandbox-error');
      const msgEl = document.getElementById('sandbox-error-msg');
      if (el && msgEl) {
        msgEl.textContent = err.stack || err.message;
        el.style.display = 'block';
      }
      postHeight();
    }
  }
})();
</script>
</body>
</html>`
}
