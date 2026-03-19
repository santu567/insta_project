'use client';

export default function TermsOfServicePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-8 md:p-12">
        <h1 className="mb-2 text-3xl font-bold">Terms of Service</h1>
        <p className="mb-8 text-sm text-[var(--text-muted)]">Last updated: March 2026</p>

        <p className="mb-6 leading-relaxed text-zinc-300">
          Welcome to InstaLink. By using our service, you agree to these Terms of Service. 
          Please read them carefully before using the platform.
        </p>

        <h2 className="mb-3 mt-8 text-xl font-semibold">1. Service Description</h2>
        <p className="mb-6 leading-relaxed text-zinc-300">
          InstaLink is an Instagram automation platform that allows Instagram Business and Creator 
          account holders to set up automated Direct Message (DM) responses triggered by specific 
          keywords in comments on their posts and reels, as well as story mentions and replies.
        </p>

        <h2 className="mb-3 mt-8 text-xl font-semibold">2. Eligibility</h2>
        <ul className="mb-6 list-disc space-y-2 pl-6 text-zinc-300">
          <li>You must be at least 18 years old to use InstaLink.</li>
          <li>You must have a valid Instagram Business or Creator account.</li>
          <li>You must have the authority to authorize InstaLink to act on behalf of your Instagram account.</li>
        </ul>

        <h2 className="mb-3 mt-8 text-xl font-semibold">3. Acceptable Use</h2>
        <p className="mb-3 leading-relaxed text-zinc-300">You agree to use InstaLink only for lawful purposes. You must NOT use InstaLink to:</p>
        <ul className="mb-6 list-disc space-y-2 pl-6 text-zinc-300">
          <li>Send spam, unsolicited messages, or misleading content.</li>
          <li>Violate Instagram&apos;s Terms of Use, Community Guidelines, or Meta&apos;s Platform Policies.</li>
          <li>Harass, abuse, or send harmful content to any user.</li>
          <li>Impersonate another person or entity.</li>
          <li>Attempt to bypass rate limits or abuse the Meta API through our service.</li>
        </ul>

        <h2 className="mb-3 mt-8 text-xl font-semibold">4. Account Responsibility</h2>
        <p className="mb-6 leading-relaxed text-zinc-300">
          You are solely responsible for the content of your automated DMs, comment replies, and 
          campaign configurations. InstaLink acts as a tool and is not responsible for the messages 
          you choose to send. You must ensure your automated messages comply with all applicable laws 
          and platform policies.
        </p>

        <h2 className="mb-3 mt-8 text-xl font-semibold">5. Service Availability</h2>
        <p className="mb-6 leading-relaxed text-zinc-300">
          We strive to maintain 99.9% uptime, but we do not guarantee uninterrupted service. 
          InstaLink relies on Meta&apos;s Instagram API, which may experience outages, rate limits, 
          or policy changes beyond our control. We are not liable for any loss resulting from 
          temporary service interruptions.
        </p>

        <h2 className="mb-3 mt-8 text-xl font-semibold">6. Rate Limits</h2>
        <p className="mb-6 leading-relaxed text-zinc-300">
          InstaLink enforces rate limits on automated DMs to comply with Meta&apos;s API policies and 
          protect your Instagram account from restrictions. These limits may vary based on your 
          subscription plan. Attempting to circumvent these limits may result in account suspension.
        </p>

        <h2 className="mb-3 mt-8 text-xl font-semibold">7. Intellectual Property</h2>
        <p className="mb-6 leading-relaxed text-zinc-300">
          All InstaLink branding, code, design, and content are the property of InstaLink. 
          You retain ownership of all content you create within the platform (campaign messages, 
          templates, etc.).
        </p>

        <h2 className="mb-3 mt-8 text-xl font-semibold">8. Termination</h2>
        <p className="mb-6 leading-relaxed text-zinc-300">
          We reserve the right to suspend or terminate your account if you violate these Terms 
          of Service, abuse the platform, or engage in activities that could harm other users or 
          our service. You may also delete your account at any time.
        </p>

        <h2 className="mb-3 mt-8 text-xl font-semibold">9. Limitation of Liability</h2>
        <p className="mb-6 leading-relaxed text-zinc-300">
          InstaLink is provided &quot;as is&quot; without warranties of any kind. We are not liable for any 
          indirect, incidental, or consequential damages arising from your use of the service, 
          including but not limited to lost revenue, Instagram account restrictions, or data loss.
        </p>

        <h2 className="mb-3 mt-8 text-xl font-semibold">10. Changes to Terms</h2>
        <p className="mb-6 leading-relaxed text-zinc-300">
          We may update these Terms of Service from time to time. Continued use of InstaLink after 
          changes are posted constitutes acceptance of the updated terms.
        </p>

        <h2 className="mb-3 mt-8 text-xl font-semibold">11. Contact</h2>
        <p className="leading-relaxed text-zinc-300">
          For questions about these Terms, please contact us at:{' '}
          <a href="mailto:mrsantumanna123@gmail.com" className="text-[var(--accent)] underline">mrsantumanna123@gmail.com</a>
        </p>
      </div>
    </main>
  );
}
