'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '../../lib/api';

function DashboardContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('user_id');
  const [accounts, setAccounts] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchApi('/api/accounts').then((r) => r.json()),
      fetchApi('/api/campaigns').then((r) => r.json()),
      fetchApi('/api/analytics').then((r) => r.json())
    ]).then(([acc, camp, anal]) => {
      if (acc.error) {
        window.location.href = '/login';
        return;
      }
      setAccounts(acc);
      setCampaigns(camp);
      setAnalytics(anal);
    }).catch((err) => {
      console.error(err);
      window.location.href = '/login';
    }).finally(() => setLoading(false));
  }, [userId]);

  const handleDelete = async (campaignId) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    try {
      const res = await fetchApi(`/api/campaigns/${campaignId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete campaign');
      setCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
    } catch (error) {
      console.error(error);
      alert('Error deleting campaign');
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-[var(--border)]" />
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-xl bg-[var(--border)]" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-8 text-2xl font-bold">Dashboard</h1>
      {accounts.length > 0 && (
        <p className="mb-6 text-[var(--text-muted)]">
          Connected: {accounts.map((a) => `@${a.username || a.ig_user_id}`).join(', ')}
        </p>
      )}
      <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Comments" value={analytics?.total_comments ?? 0} />
        <StatCard label="Leads" value={analytics?.total_leads ?? 0} />
        <StatCard label="DMs Sent" value={analytics?.dms_sent ?? 0} />
        <StatCard label="Campaigns" value={campaigns.length} />
      </div>
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Campaigns</h2>
        <Link
          href="/campaigns/new"
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
        >
          New Campaign
        </Link>
      </div>
      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
        {campaigns.length === 0 ? (
          <div className="p-12 text-center text-[var(--text-muted)]">
            No campaigns yet. Create one to start auto-DMing commenters.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-sm text-[var(--text-muted)]">
                <th className="px-4 py-3">Keyword</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Followers only</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-b border-[var(--border)]">
                  <td className="px-4 py-3 font-mono">{c.keyword}</td>
                  <td className="px-4 py-3">{c.media_type || 'all'}</td>
                  <td className="px-4 py-3">{c.followers_only ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3">
                    <span className={c.is_active ? 'text-emerald-400' : 'text-amber-400'}>
                      {c.is_active ? 'Active' : 'Paused'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-red-400 hover:text-red-300 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[70vh] items-center justify-center">Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
