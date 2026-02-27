import type { Metadata, Viewport } from 'next';
import { Source_Sans_3, Source_Serif_4 } from 'next/font/google';
import './globals.css';

const sourceSans = Source_Sans_3({
  variable: '--font-source-sans',
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
});

const sourceSerif = Source_Serif_4({
  variable: '--font-serif',
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'Partner Newsletter | Aggiornamenti interni',
  description: 'Newsletter partner — aggiornamenti settimanali, procedure e risorse in un unico posto.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
      </head>
      <body
        className={`${sourceSans.variable} ${sourceSerif.variable} font-sans antialiased min-h-screen`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
