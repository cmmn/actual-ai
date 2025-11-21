import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { TamaguiRootProvider } from '../lib/tamagui-provider'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'AI Combinator',
  description: 'Compare Cost, Speed, and Quality of AI Models',
    icons: {
    icon: [
      { url: '/favicon.png', sizes: 'any' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180' },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <TamaguiRootProvider>
          {children}
        </TamaguiRootProvider>
      </body>
    </html>
  );
}
