'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { API_URL } from '../../lib/api';

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  // Use a direct link to the server-side redirect endpoint
  // This is a regular navigation (not JavaScript redirect) which prevents
  // mobile phones from deep-linking to the Instagram app
  const connectUrl = `${API_URL}/auth/instagram/redirect?user_id=anonymous`;

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4">
      <div className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-8">
        <h1 className="mb-2 text-2xl font-bold">Connect Instagram</h1>
        <p className="mb-8 text-sm text-[var(--text-muted)]">
          Use your Instagram Business or Creator account to get started.
        </p>
        {error && (
          <div className="mb-6 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error === 'no_code' && 'Authorization was cancelled.'}
            {error === 'auth_failed' && 'Connection failed. Please try again.'}
            {error === 'auth_processing_failed' && 'Something went wrong. Please try again.'}
            {error === 'no_token_extracted' && 'Could not get token. Please try again.'}
          </div>
        )}
        <a
          href={connectUrl}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] py-3 font-medium text-white transition hover:bg-[var(--accent-hover)]"
        >
          Connect with Instagram
        </a>
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
