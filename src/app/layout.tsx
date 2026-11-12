import type { Metadata, Viewport } from 'next';
import { Open_Sans, Patrick_Hand, Lora } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { StudySpaceProvider } from '@/context/StudySpaceContext';
import { SocialPresenceProvider } from '@/context/SocialPresenceContext';
import { DebugOverlay } from '@/components/common/DebugOverlay';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#16A34A',
};

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
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        <link rel="manifest" href={`${basePath}/manifest.json`} />
        <link rel="icon" href={`${basePath}/icons/greenlearn-icon.png`} type="image/png" />
        <link rel="shortcut icon" href={`${basePath}/favicon.ico`} />
        <link rel="apple-touch-icon" href={`${basePath}/apple-touch-icon.png`} />
        <meta name="theme-color" content="#16A34A" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=false;var s=localStorage.getItem('greenlearn_is_mobile')||sessionStorage.getItem('greenlearn_is_mobile');if(s==='1'){m=true;}else{var ua=navigator.userAgent||'';var isUAMobile=/Android.*Mobile|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|webOS|Windows Phone/i.test(ua);var w=window.innerWidth||0;var h=window.innerHeight||0;var minDim=Math.min(w||9999,h||9999);var isCoarse=window.matchMedia&&window.matchMedia('(pointer: coarse)').matches;if(isUAMobile||(minDim<600&&(isCoarse||'ontouchstart' in window))||(w>0&&w<640)){m=true;}}if(m){document.documentElement.setAttribute('data-device','mobile');localStorage.setItem('greenlearn_is_mobile','1');sessionStorage.setItem('greenlearn_is_mobile','1');}}catch(e){}})();`,
          }}
        />
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
              <DebugOverlay />
            </SocialPresenceProvider>
          </StudySpaceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
