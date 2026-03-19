'use client';

import { useEffect, useState } from 'react';

import { fetchApi } from '../../lib/api';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi('/api/analytics')
      .then((r) => r.json())
      .then(setAnalytics)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-32 rounded bg-[var(--border)]" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 rounded-xl bg-[var(--border)]" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  const a = analytics || {};
  const totalLeads = parseInt(a.total_leads || 0, 10);
  const followers = parseInt(a.followers || 0, 10);
  const nonFollowers = parseInt(a.non_followers || 0, 10);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-8 text-2xl font-bold">Analytics</h1>
      <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total comments" value={a.total_comments ?? 0} />
        <StatCard label="Leads captured" value={totalLeads} />
        <StatCard label="DMs sent" value={a.dms_sent ?? 0} />
        <StatCard label="Conversion rate" value={totalLeads ? `${Math.round((a.dms_sent / totalLeads) * 100)}%` : '—'} />
      </div>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-8">
        <h2 className="mb-6 text-lg font-semibold">Followers vs non-followers</h2>
        <div className="flex gap-8">
          <div className="flex-1">
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">Followers</span>
              <span className="font-medium text-emerald-400">{followers}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-[var(--border)]">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: totalLeads ? `${(followers / totalLeads) * 100}%` : '0%' }}
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">Non-followers</span>
              <span className="font-medium text-amber-400">{nonFollowers}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-[var(--border)]">
              <div
                className="h-full rounded-full bg-amber-500"
                style={{ width: totalLeads ? `${(nonFollowers / totalLeads) * 100}%` : '0%' }}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
      <p className="text-sm text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}
