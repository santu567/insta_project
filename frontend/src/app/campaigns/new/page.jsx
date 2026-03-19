'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { fetchApi } from '../../../lib/api';

export default function NewCampaignPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    instagram_account_id: '',
    keyword: 'LINK',
    media_id: '',
    media_type: 'all',
    followers_only: false,
    message: "Hey {username}! Thanks for commenting. Here's your link: [paste your link here]",
    comment_reply: '',
    story_reply_message: ''
  });

  useEffect(() => {
    fetchApi('/api/accounts')
      .then((r) => r.json())
      .then(setAccounts)
      .catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.instagram_account_id) {
      alert('Select an Instagram account');
      return;
    }
    setLoading(true);
    try {
      const res = await fetchApi('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          media_id: form.media_id || null,
          media_type: form.media_type
        })
      });
      if (!res.ok) throw new Error(await res.text());
      router.push('/dashboard');
    } catch (err) {
      alert('Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-8 text-2xl font-bold">Create Campaign</h1>
      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-8">
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-muted)]">Instagram account</label>
          <select
            required
            value={form.instagram_account_id}
            onChange={(e) => setForm({ ...form, instagram_account_id: e.target.value })}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          >
            <option value="">Select account</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>@{a.username || a.ig_user_id}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-muted)]">Keyword</label>
          <input
            type="text"
            required
            value={form.keyword}
            onChange={(e) => setForm({ ...form, keyword: e.target.value })}
            placeholder="LINK"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-3 font-mono text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
          <p className="mt-1 text-xs text-[var(--text-muted)]">Comments containing this word will trigger the DM</p>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-muted)]">Target</label>
          <select
            value={form.media_type}
            onChange={(e) => setForm({ ...form, media_type: e.target.value })}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          >
            <option value="all">All posts and reels</option>
            <option value="post">Specific post (enter media ID)</option>
            <option value="reel">Specific reel (enter media ID)</option>
          </select>
          {(form.media_type === 'post' || form.media_type === 'reel') && (
            <input
              type="text"
              value={form.media_id}
              onChange={(e) => setForm({ ...form, media_id: e.target.value })}
              placeholder="Media ID from Meta Business Suite"
              className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          )}
        </div>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="followers"
            checked={form.followers_only}
            onChange={(e) => setForm({ ...form, followers_only: e.target.checked })}
            className="h-4 w-4 rounded border-[var(--border)] bg-[var(--bg)] text-[var(--accent)] focus:ring-[var(--accent)]"
          />
          <label htmlFor="followers" className="text-sm">DM only followers</label>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-muted)]">DM message template</label>
          <textarea
            required
            rows={4}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="Hey {username}! Thanks for commenting..."
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
          <p className="mt-1 text-xs text-[var(--text-muted)]">Use {'{username}'} for their handle</p>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-muted)]">Comment Auto-Reply <span className="text-zinc-500">(optional)</span></label>
          <input
            type="text"
            value={form.comment_reply}
            onChange={(e) => setForm({ ...form, comment_reply: e.target.value })}
            placeholder="Check your DMs! 🔥"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
          <p className="mt-1 text-xs text-[var(--text-muted)]">Publicly reply to the comment after sending the DM. Leave blank to skip.</p>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-muted)]">Story Mention Auto-DM <span className="text-zinc-500">(optional)</span></label>
          <textarea
            rows={2}
            value={form.story_reply_message}
            onChange={(e) => setForm({ ...form, story_reply_message: e.target.value })}
            placeholder="Thanks for the shoutout {username}! Here's a special link just for you 🎁"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
          <p className="mt-1 text-xs text-[var(--text-muted)]">Auto-send this DM when someone mentions you in their story. Leave blank to skip.</p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[var(--accent)] py-3 font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Campaign'}
        </button>
      </form>
    </main>
  );
}
