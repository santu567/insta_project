import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-24 text-center">
      <h1 className="mb-4 text-5xl font-bold tracking-tight">
        Turn comments into <span className="text-[var(--accent)]">conversations</span>
      </h1>
      <p className="mb-12 text-lg text-[var(--text-muted)]">
        InstaLink automatically sends DMs when users comment your keyword on Instagram. Meta-compliant, easy to use.
      </p>
      <Link
        href="/login"
        className="inline-flex items-center rounded-lg bg-[var(--accent)] px-8 py-3 font-medium text-white transition hover:bg-[var(--accent-hover)]"
      >
        Connect Instagram
      </Link>
      <div className="mt-24 grid gap-8 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
          <div className="mb-3 text-3xl">🔑</div>
          <h3 className="mb-2 font-semibold">Keyword triggers</h3>
          <p className="text-sm text-[var(--text-muted)]">
            Set a keyword like &quot;LINK&quot; and auto-DM anyone who comments it.
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
          <div className="mb-3 text-3xl">👥</div>
          <h3 className="mb-2 font-semibold">Followers only</h3>
          <p className="text-sm text-[var(--text-muted)]">
            Optional filter to DM only your followers.
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
          <div className="mb-3 text-3xl">📊</div>
          <h3 className="mb-2 font-semibold">Lead tracking</h3>
          <p className="text-sm text-[var(--text-muted)]">
            Capture leads and view analytics in your dashboard.
          </p>
        </div>
      </div>
    </main>
  );
}
