'use client';

import { useEffect, useState } from 'react';

import { fetchApi } from '../../lib/api';

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi('/api/leads')
      .then((r) => r.json())
      .then(setLeads)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-32 rounded bg-[var(--border)]" />
          <div className="h-64 rounded-xl bg-[var(--border)]" />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-8 text-2xl font-bold">Leads</h1>
      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
        {leads.length === 0 ? (
          <div className="p-12 text-center text-[var(--text-muted)]">
            No leads yet. Create a campaign and get comments with your keyword.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-sm text-[var(--text-muted)]">
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Campaign</th>
                <th className="px-4 py-3">Follower</th>
                <th className="px-4 py-3">DM sent</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} className="border-b border-[var(--border)]">
                  <td className="px-4 py-3">@{l.username || l.ig_user_id}</td>
                  <td className="px-4 py-3 font-mono text-sm">{l.keyword}</td>
                  <td className="px-4 py-3">
                    {l.is_follower === true ? (
                      <span className="text-emerald-400">Yes</span>
                    ) : l.is_follower === false ? (
                      <span className="text-amber-400">No</span>
                    ) : (
                      <span className="text-zinc-500">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {l.dm_sent_at ? (
                      <span className="text-emerald-400">Yes</span>
                    ) : (
                      <span className="text-amber-400">Queued</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--text-muted)]">
                    {new Date(l.created_at).toLocaleDateString()}
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
