import './globals.css';
import { Inter } from 'next/font/google';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: 'InstaLink | Comment-to-DM Automation',
  description: 'Auto-send DMs when users comment a keyword on your Instagram posts'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen font-sans antialiased">
        <nav className="border-b border-[var(--border)] bg-[var(--bg-card)]">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <Link href="/" className="text-xl font-bold tracking-tight text-[var(--accent)]">
              InstaLink
            </Link>
            <div className="flex gap-6">
              <Link href="/dashboard" className="text-sm text-[var(--text-muted)] hover:text-white">
                Dashboard
              </Link>
              <Link href="/campaigns/new" className="text-sm text-[var(--text-muted)] hover:text-white">
                New Campaign
              </Link>
              <Link href="/leads" className="text-sm text-[var(--text-muted)] hover:text-white">
                Leads
              </Link>
              <Link href="/analytics" className="text-sm text-[var(--text-muted)] hover:text-white">
                Analytics
              </Link>
            </div>
          </div>
        </nav>
        {children}
        <footer className="mt-auto border-t border-[var(--border)] bg-[var(--bg-card)] py-6">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4">
            <p className="text-xs text-[var(--text-muted)]">© {new Date().getFullYear()} InstaLink. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="/privacy" className="text-xs text-[var(--text-muted)] hover:text-white">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-xs text-[var(--text-muted)] hover:text-white">
                Terms of Service
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
