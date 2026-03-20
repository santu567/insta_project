'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { API_URL } from '../../lib/api';

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const [loading, setLoading] = useState(false);

  const handleConnect = () => {
    setLoading(true);

    // Open OAuth in a popup window
    const popup = window.open(
      `${API_URL}/auth/instagram/redirect?user_id=anonymous`,
      'InstagramAuth',
      'width=600,height=700'
    );

    // Listen for messages from the popup
    const handleMessage = (event) => {
      // Allow messages from any origin for this specific OAuth handshake
      if (event.data === 'oauth_success') {
        window.removeEventListener('message', handleMessage);
        popup?.close();
        // Redirect to dashboard on success
        window.location.href = '/dashboard';
      } else if (event.data === 'oauth_error') {
        window.removeEventListener('message', handleMessage);
        popup?.close();
        setLoading(false);
        // Force reload with error
        window.location.href = '/login?error=auth_processing_failed';
      }
    };

    window.addEventListener('message', handleMessage);

    // Check if user manually closed the popup
    const checkClosed = setInterval(() => {
      if (popup && popup.closed) {
        clearInterval(checkClosed);
        if (loading) setLoading(false);
        window.removeEventListener('message', handleMessage);
      }
    }, 1000);
  };

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4">
      <div className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-8">
        <h1 className="mb-2 text-2xl font-bold">Connect Instagram</h1>
        <p className="mb-8 text-sm text-[var(--text-muted)]">
          Use your Instagram Business or Creator account to get started.
        </p>
        
        {error && !loading && (
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
          {loading ? 'Waiting for authentication...' : 'Connect with Instagram'}
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
