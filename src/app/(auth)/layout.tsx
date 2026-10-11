import * as React from 'react';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { AuthThemeToggle } from '@/components/auth/AuthThemeToggle';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col justify-between p-4 sm:p-6 transition-colors duration-150">
      {/* Top bar with brand and theme toggle */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between py-2">
        <Link
          href="/login"
          className="flex items-center gap-2 group outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-sm p-1"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-brand text-white shadow-sm transition-transform duration-[140ms] group-hover:scale-105">
            <BookOpen className="h-4 w-4" strokeWidth={2} />
          </div>
          <span className="font-sans text-base font-bold tracking-tight text-ink">
            Weave<span className="text-brand">It</span>
          </span>
        </Link>
        <AuthThemeToggle />
      </header>

      {/* Main centered card */}
      <main className="flex-1 flex items-center justify-center py-8">
        <div className="w-full max-w-[420px] bg-surface border border-line rounded-md p-6 sm:p-8 shadow-sm">
          {children}
        </div>
      </main>

      {/* Subtle editorial footer */}
      <footer className="w-full max-w-5xl mx-auto py-4 text-center text-xs text-ink-soft">
        <p>&copy; 2026 WeaveIt &bull; Scene-Driven Story Planning</p>
      </footer>
    </div>
  );
}
