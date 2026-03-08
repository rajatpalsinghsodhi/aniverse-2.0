import React from 'react';
import ReactDOM from 'react-dom/client';

function showError(title: string, err: unknown) {
  const root = document.getElementById('root');
  if (!root) return;
  const msg = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error && err.stack ? err.stack : '';
  root.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#181114;color:#f4258c;font-family:system-ui,sans-serif;padding:24px;box-sizing:border-box;">
      <div style="max-width:480px;">
        <h2 style="margin:0 0 12px;">${title}</h2>
        <pre style="background:rgba(0,0,0,0.3);padding:12px;border-radius:8px;overflow:auto;font-size:12px;white-space:pre-wrap;word-break:break-word;">${msg.replace(/</g, '&lt;')}</pre>
        ${stack ? `<pre style="color:#94a3b8;font-size:11px;white-space:pre-wrap;">${stack.replace(/</g, '&lt;').slice(0, 800)}</pre>` : ''}
      </div>
    </div>
  `;
}

class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  state = { hasError: false, error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('App error:', error);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#181114', color: '#f4258c', fontFamily: 'system-ui', padding: 24 }}>
          <div>
            <h2 style={{ margin: '0 0 12px' }}>Something went wrong</h2>
            <pre style={{ background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 8, fontSize: 12, whiteSpace: 'pre-wrap' }}>{this.state.error.message}</pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

async function main() {
  // #region agent log
  const _pl = (loc: string, msg: string, hypothesisId: string, data: object) => {
    const p = { sessionId: '8dc726', runId: 'run1', hypothesisId, location: loc, message: msg, data, timestamp: Date.now() };
    try { (window as any).__debugLog = (window as any).__debugLog || []; (window as any).__debugLog.push(p); } catch (_) {}
    fetch('http://127.0.0.1:7935/ingest/ff862867-c442-47e6-9d37-320e513565f8', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '8dc726' }, body: JSON.stringify(p) }).catch(() => {});
  };
  _pl('index.tsx:main', 'main started', 'B', { hasRoot: !!document.getElementById('root') });
  // #endregion
  const rootEl = document.getElementById('root');
  if (!rootEl) {
    showError('Startup error', new Error('Root element #root not found'));
    return;
  }

  try {
    const { default: App } = await import('./App');
    // #region agent log
    _pl('index.tsx:after-import', 'App module loaded', 'C', {});
    // #endregion
    const root = ReactDOM.createRoot(rootEl);
    root.render(
      <React.StrictMode>
        <AppErrorBoundary>
          <App />
        </AppErrorBoundary>
      </React.StrictMode>
    );
    // #region agent log
    _pl('index.tsx:render-done', 'React render called', 'E', {});
    // #endregion
  } catch (err) {
    // #region agent log
    _pl('index.tsx:catch', 'load or render error', 'C', { err: err instanceof Error ? err.message : String(err) });
    // #endregion
    showError('App failed to load', err);
  }
}

main();
