import type { Metadata } from 'next';
import { Open_Sans, Patrick_Hand, Lora } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { StudySpaceProvider } from '@/context/StudySpaceContext';
import { SocialPresenceProvider } from '@/context/SocialPresenceContext';

const openSans = Open_Sans({
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  variable: '--font-ui',
  display: 'swap',
});

const patrickHand = Patrick_Hand({
  weight: '400',
  subsets: ['latin', 'vietnamese'],
  variable: '--font-note',
  display: 'swap',
});

const lora = Lora({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-serif',
  display: 'swap',
});

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export const metadata: Metadata = {
  title: 'GreenLearn — Bàn Học Tri Thức 2.5D',
  description: 'Không gian học tập trực quan 2.5D miễn phí, tích hợp trợ lý AI thông minh.',
  icons: {
    icon: [
      { url: `${basePath}/icons/greenlearn-icon.png`, type: 'image/png' },
      { url: `${basePath}/favicon.ico` },
    ],
    apple: `${basePath}/apple-touch-icon.png`,
  },
  manifest: `${basePath}/manifest.json`,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${openSans.variable} ${patrickHand.variable} ${lora.variable}`} suppressHydrationWarning spellCheck={false}>
      <head>
        <link rel="manifest" href={`${basePath}/manifest.json`} />
        <link rel="icon" href={`${basePath}/icons/greenlearn-icon.png`} type="image/png" />
        <link rel="shortcut icon" href={`${basePath}/favicon.ico`} />
        <link rel="apple-touch-icon" href={`${basePath}/apple-touch-icon.png`} />
        <meta name="theme-color" content="#16A34A" />
      </head>
      <body 
        suppressHydrationWarning
        spellCheck={false}
        className="font-sans bg-white text-slate-800 antialiased selection:bg-slate-200 selection:text-slate-900"
      >
        <AuthProvider>
          <StudySpaceProvider>
            <SocialPresenceProvider>
              {children}
            </SocialPresenceProvider>
          </StudySpaceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
