import type { Metadata } from 'next';
import { Inter, Geist_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';
import { QueryProvider } from '@/providers/query-provider';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
  // Enable optical sizing + useful OpenType features
  axes: ['opsz'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Grow Logs',
    template: '%s · Grow Logs',
  },
  description:
    'A daily logging tool for developers and self-learners. Track your work and learning, organised by your own categories.',
  keywords: ['developer log', 'learning tracker', 'productivity', 'growth'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable} h-full`}>
      <body className="flex min-h-full flex-col antialiased">
        <QueryProvider>{children}</QueryProvider>
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
