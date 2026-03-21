'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { API_URL } from '../../lib/api';

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const [loading, setLoading] = useState(false);
  const [pollInterval, setPollInterval] = useState(null);
  const [statusId, setStatusId] = useState(null);
  const [manualLink, setManualLink] = useState('');
  const [showInAppWarning, setShowInAppWarning] = useState(false);
  const [authTimeout, setAuthTimeout] = useState(false);

  useEffect(() => {
    // Detect Instagram in-app browser
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    if (ua && (ua.includes('Instagram') || ua.includes('InstagramApp'))) {
      setShowInAppWarning(true);
    }
    
    // Cleanup polling on unmount
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [pollInterval]);

  const handleConnect = async () => {
    setLoading(true);
    setAuthTimeout(false);

    try {
      // 1. Get statusId and redirectUrl
      const res = await fetch(`${API_URL}/auth/instagram/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: 'anonymous' })
      });
      const data = await res.json();
      
      if (!data.statusId || !data.redirectUrl) throw new Error('Failed to start session');
      
      setStatusId(data.statusId);
      setManualLink(data.redirectUrl);
      
      // 2. Open auth flow
      // We use a new tab/window by default. If blocked, or specifically required, we could use location.href
      // but new tab is better for maintaining the polling context natively.
      const popup = window.open(data.redirectUrl, 'InstagramAuth', 'width=600,height=700');
      if (!popup) {
         // Popup blocked fallback
         window.location.href = data.redirectUrl;
         return; // We lose context here, but /callback will handle them.
      }

      // 3. Start polling
      let elapsed = 0;
      const interval = setInterval(async () => {
        elapsed += 2000;
        if (elapsed > 60000) {
          clearInterval(interval);
          setLoading(false);
          setAuthTimeout(true);
          return;
        }

        try {
          const statusRes = await fetch(`${API_URL}/auth/instagram/status/${data.statusId}`);
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            if (statusData.state === 'ok') {
              clearInterval(interval);
              window.location.href = '/dashboard';
            } else if (statusData.state === 'failed') {
              clearInterval(interval);
              setLoading(false);
              alert('Authentication failed: ' + statusData.message);
            }
          }
        } catch (e) {
          console.error('Polling error', e);
        }
      }, 2000);
      
      setPollInterval(interval);

    } catch (err) {
      console.error(err);
      setLoading(false);
      alert('Failed to start authentication flow.');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(manualLink).then(() => {
      alert('Link copied! Open Chrome or Safari and paste it there.');
    });
  };

  if (showInAppWarning) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4">
        <div className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/20">
            <svg className="h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="mb-2 text-xl font-bold">Instagram App Detected</h1>
          <p className="mb-6 text-sm text-[var(--text-muted)]">
            For security reasons, Instagram's login flow works best in a standard web browser.
          </p>
          <div className="mb-6 text-left rounded-lg bg-neutral-900 p-4 font-mono text-xs">
            <ol className="list-decimal pl-4 space-y-2 text-gray-300">
              <li>Tap the <strong>⋮</strong> (three dots) menu in the top right.</li>
              <li>Select <strong>Open in Browser</strong> or <strong>Open in Chrome / Safari</strong>.</li>
            </ol>
          </div>
          <button
            onClick={() => setShowInAppWarning(false)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 py-3 font-medium text-white transition hover:bg-neutral-700"
          >
            I understand, proceed anyway
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4">
      <div className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-8">
        <h1 className="mb-2 text-2xl font-bold">Connect Instagram</h1>
        <p className="mb-6 text-sm text-[var(--text-muted)]">
          Use your Instagram Business or Creator account to get started.
        </p>

        {authTimeout && (
          <div className="mb-6 rounded-lg bg-orange-500/10 px-4 py-4 text-sm border border-orange-500/20">
            <strong className="text-orange-400 block mb-2">Did your app get stuck?</strong>
            <p className="text-gray-300 text-xs mb-3">
              Sometimes the Instagram native app crashes the flow. Copy the secure link below and paste it into a fresh Chrome/Safari tab:
            </p>
            <div className="flex items-center gap-2">
              <input type="text" readOnly value={manualLink} className="flex-1 bg-black/50 border border-neutral-700 rounded px-2 py-2 text-xs text-gray-400" />
              <button onClick={copyToClipboard} className="bg-neutral-800 hover:bg-neutral-700 px-3 py-2 rounded text-xs">Copy</button>
            </div>
            <button onClick={handleConnect} className="mt-4 w-full text-xs underline text-blue-400 text-center">Try opening popup again</button>
          </div>
        )}
        
        {error && !loading && !authTimeout && (
          <div className="mb-6 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error === 'no_code' && 'Authorization was cancelled.'}
            {error === 'auth_failed' && 'Connection failed. Please try again.'}
            {error === 'auth_processing_failed' && 'Something went wrong. Please try again.'}
            {error === 'no_token_extracted' && 'Could not get token. Please try again.'}
          </div>
        )}

        <button
          onClick={handleConnect}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] py-3 font-medium text-white transition hover:bg-[var(--accent-hover)] disabled:opacity-75 disabled:cursor-not-allowed"
        >
          {loading ? 'Authenticating... Please wait' : 'Connect with Instagram'}
        </button>
        <p className="mt-6 text-center text-xs text-[var(--text-muted)]">
          <Link href="/" className="underline hover:text-white">Back to home</Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[70vh] items-center justify-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
