'use client';

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-8 md:p-12">
        <h1 className="mb-2 text-3xl font-bold">Privacy Policy</h1>
        <p className="mb-8 text-sm text-[var(--text-muted)]">Last updated: March 2026</p>

        <p className="mb-6 leading-relaxed text-zinc-300">
          InstaLink (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) operates an Instagram comment-to-DM automation platform. 
          This Privacy Policy explains how we collect, use, store, and protect your information when you use our service.
        </p>

        <h2 className="mb-3 mt-8 text-xl font-semibold">1. Data We Collect</h2>
        <ul className="mb-6 list-disc space-y-2 pl-6 text-zinc-300">
          <li><strong>Account Information:</strong> Your Instagram Business/Creator account ID, username, and profile information obtained via Meta&apos;s OAuth login.</li>
          <li><strong>Access Tokens:</strong> Instagram and Facebook Page access tokens required to send messages and read comments on your behalf.</li>
          <li><strong>Comment Data:</strong> Text content, commenter usernames, and comment IDs from comments on your Instagram posts/reels that match your configured campaign keywords.</li>
          <li><strong>Lead Data:</strong> Usernames and Instagram user IDs of people who interact with your content and trigger automated responses.</li>
          <li><strong>Campaign Configuration:</strong> Keywords, DM templates, comment reply templates, and story reply messages you configure.</li>
          <li><strong>Usage Analytics:</strong> DM send counts, comment event counts, and campaign performance metrics.</li>
        </ul>

        <h2 className="mb-3 mt-8 text-xl font-semibold">2. How We Use Your Data</h2>
        <ul className="mb-6 list-disc space-y-2 pl-6 text-zinc-300">
          <li>To authenticate your Instagram account and maintain your session securely via encrypted JWT tokens.</li>
          <li>To monitor comments on your posts/reels and send automated DMs when configured keywords are detected.</li>
          <li>To automatically reply to comments and respond to story mentions as configured in your campaigns.</li>
          <li>To display analytics, lead data, and campaign performance within the InstaLink dashboard.</li>
          <li>To refresh your access tokens automatically so your automations continue working without interruption.</li>
        </ul>

        <h2 className="mb-3 mt-8 text-xl font-semibold">3. Data Sharing</h2>
        <p className="mb-6 leading-relaxed text-zinc-300">
          We do <strong>NOT</strong> sell, rent, or share your personal data with any third parties. 
          Your data is only transmitted to Meta&apos;s Instagram/Facebook APIs as required to perform 
          the automation services you configure. No other external services receive your data.
        </p>

        <h2 className="mb-3 mt-8 text-xl font-semibold">4. Data Storage &amp; Security</h2>
        <ul className="mb-6 list-disc space-y-2 pl-6 text-zinc-300">
          <li>All data is stored in a secure PostgreSQL database with encrypted connections.</li>
          <li>Access tokens are stored securely and are never exposed to the frontend.</li>
          <li>Authentication uses HttpOnly, Secure cookies with JWT tokens to prevent unauthorized access.</li>
          <li>Each user&apos;s data is fully isolated — you can only access your own campaigns, leads, and analytics.</li>
        </ul>

        <h2 className="mb-3 mt-8 text-xl font-semibold">5. Data Retention &amp; Deletion</h2>
        <p className="mb-6 leading-relaxed text-zinc-300">
          We retain your data for as long as your account is active. You may request complete deletion 
          of your account and all associated data at any time by:
        </p>
        <ul className="mb-6 list-disc space-y-2 pl-6 text-zinc-300">
          <li>Disconnecting your Instagram account from the InstaLink dashboard.</li>
          <li>Emailing us at <a href="mailto:mrsantumanna123@gmail.com" className="text-[var(--accent)] underline">mrsantumanna123@gmail.com</a> with a data deletion request.</li>
        </ul>
        <p className="mb-6 leading-relaxed text-zinc-300">
          Upon receiving a deletion request, we will permanently remove all your data within 30 days.
        </p>

        <h2 className="mb-3 mt-8 text-xl font-semibold">6. Your Rights</h2>
        <ul className="mb-6 list-disc space-y-2 pl-6 text-zinc-300">
          <li>You have the right to access, correct, or delete your personal data at any time.</li>
          <li>You can revoke InstaLink&apos;s access to your Instagram account via your Meta account settings.</li>
          <li>You can deactivate any campaign to immediately stop all automated actions.</li>
        </ul>

        <h2 className="mb-3 mt-8 text-xl font-semibold">7. Changes to This Policy</h2>
        <p className="mb-6 leading-relaxed text-zinc-300">
          We may update this Privacy Policy from time to time. Any changes will be posted on this page 
          with an updated &quot;Last updated&quot; date.
        </p>

        <h2 className="mb-3 mt-8 text-xl font-semibold">8. Contact Us</h2>
        <p className="leading-relaxed text-zinc-300">
          If you have any questions about this Privacy Policy, please contact us at:{' '}
          <a href="mailto:mrsantumanna123@gmail.com" className="text-[var(--accent)] underline">mrsantumanna123@gmail.com</a>
        </p>
      </div>
    </main>
  );
}
