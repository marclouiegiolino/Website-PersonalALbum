import type { Metadata, Viewport } from 'next';
import { Bodoni_Moda, Caveat, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const display = Bodoni_Moda({ subsets: ['latin'], style: ['italic'], weight: ['500'], variable: '--nf-display', display: 'swap' });
const hand = Caveat({ subsets: ['latin'], weight: ['500', '700'], variable: '--nf-hand', display: 'swap' });
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--nf-mono', display: 'swap' });

export const metadata: Metadata = { title: 'Our Love Story' };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${hand.variable} ${mono.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
