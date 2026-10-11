import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Source_Serif_4, Courier_Prime } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/lib/theme';
import { SessionProvider } from '@/lib/auth-client';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const sourceSerif4 = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const courierPrime = Courier_Prime({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '700'],
});

export const metadata: Metadata = {
  title: 'WeaveIt — Visual Story Planning for Novelists',
  description:
    'A scene-driven story-planning workspace for novelists who discover stories through scenes, fragments, and vibes.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} ${sourceSerif4.variable} ${courierPrime.variable}`}
    >
      <body className="min-h-screen bg-bg text-ink antialiased selection:bg-brand-soft selection:text-brand-strong">
        <SessionProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
