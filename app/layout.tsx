import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import { Archivo, Newsreader, IBM_Plex_Mono } from 'next/font/google';
import config from '@/dashboard.config';
import './globals.css';

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const newsreader = Newsreader({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-body',
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: `${config.brand.name} — ${config.brand.eyebrow}`,
  description:
    'A live operations view built from three sources. Illustrative sample data.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Palette comes from the config file, so a reskin never touches the CSS.
  const theme = config.theme as unknown as CSSProperties;

  return (
    <html lang="en">
      <body
        className={`${archivo.variable} ${newsreader.variable} ${plexMono.variable}`}
        style={theme}
      >
        {children}
      </body>
    </html>
  );
}
