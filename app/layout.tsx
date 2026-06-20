import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { InstallPrompt } from '@/components/pwa/install-prompt'
import { SerwistProvider } from '@/components/providers/serwist-provider'
import { StoreHydrator } from '@/components/providers/store-hydrator'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const APP_NAME = 'CertForge'
const APP_DEFAULT_TITLE = 'CertForge — AI Exam Prep'
const APP_TITLE_TEMPLATE = '%s — CertForge'
const APP_DESCRIPTION =
  'CertForge generates fresh, tailored multiple-choice questions for high-stakes certification exams, with instant feedback and progress tracking.'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  generator: 'v0.app',
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
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: 'summary',
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
  maximumScale: 1,
  userScalable: false,
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
    >
      <body className="bg-background font-sans antialiased">
        <SerwistProvider swUrl="/serwist/sw.js">
          <StoreHydrator>{children}</StoreHydrator>
          <InstallPrompt />
          <Toaster position="top-center" />
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </SerwistProvider>
      </body>
    </html>
  )
}
