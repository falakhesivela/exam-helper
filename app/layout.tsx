import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { InstallPrompt } from '@/components/pwa/install-prompt'
import { SerwistProvider } from '@/components/providers/serwist-provider'
import { StoreHydrator } from '@/components/providers/store-hydrator'
import { Toaster } from '@/components/ui/sonner'
import {
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_TITLE,
  getSiteUrl,
} from '@/lib/config/site'
import './globals.css'

const APP_NAME = SITE_NAME
const APP_DEFAULT_TITLE = SITE_TITLE
const APP_TITLE_TEMPLATE = '%s — Prepa'
const APP_DESCRIPTION = SITE_DESCRIPTION

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  category: 'education',
  alternates: {
    canonical: '/',
    types: {
      'application/rss+xml': [{ url: '/blog/rss.xml', title: `${APP_NAME} blog` }],
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: APP_NAME,
    locale: 'en_US',
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0e1116',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-background font-sans antialiased">
        <SerwistProvider swUrl="/serwist/sw.js">
          <StoreHydrator>{children}</StoreHydrator>
          <InstallPrompt />
          <Toaster position="top-center" />
        </SerwistProvider>
      </body>
    </html>
  )
}
