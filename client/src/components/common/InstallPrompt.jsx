import React, { useEffect, useState } from 'react';

// ============================================================================
// InstallPrompt — lightweight "Install app" banner for the PWA.
// ----------------------------------------------------------------------------
// Captures the browser's `beforeinstallprompt` event and offers a branded
// button to install the app. Self-contained (no props), hides itself once the
// app is installed or already running standalone, and remembers a dismissal
// for the current browser session so it doesn't nag.
// ============================================================================

const DISMISS_KEY = 'pwa-install-dismissed';

function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === '1') return;
    } catch { /* sessionStorage may be unavailable */ }

    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };
    const onInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
  };

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    try { await deferredPrompt.userChoice; } catch { /* ignore */ }
    setDeferredPrompt(null);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Install SSV School app"
      style={{
        position: 'fixed',
        left: '50%',
        transform: 'translateX(-50%)',
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
        zIndex: 2000,
        width: 'calc(100% - 32px)',
        maxWidth: 420,
        background: '#ffffff',
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: 14,
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
        padding: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          flex: '0 0 auto',
          borderRadius: 10,
          background: 'var(--primary, #1F3C88)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: 22,
        }}
      >
        S
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text, #333)' }}>
          Install SSV School
        </div>
        <div style={{ fontSize: 12, color: '#6b7280' }}>
          Add it to your home screen for quick, full-screen access.
        </div>
      </div>
      <button
        onClick={install}
        style={{
          flex: '0 0 auto',
          minHeight: 44,
          padding: '0 16px',
          borderRadius: 10,
          border: 'none',
          background: 'var(--primary, #1F3C88)',
          color: '#fff',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Install
      </button>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        style={{
          flex: '0 0 auto',
          width: 36,
          height: 36,
          borderRadius: 8,
          border: 'none',
          background: 'transparent',
          color: '#9ca3af',
          fontSize: 20,
          lineHeight: 1,
          cursor: 'pointer',
        }}
      >
        ×
      </button>
    </div>
  );
}
