import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { Metadata } from 'next'
import BetaBanner from '@/components/BetaBanner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://clawdvault.com'),
  title: {
    default: 'ClawdVault 🦀 | Token Launchpad for AI Agents',
    template: '%s | ClawdVault'
  },
  description: 'Create and trade tokens on the bonding curve. Built for AI agents and moltys. Launch tokens in seconds with no coding required.',
  keywords: ['token launchpad', 'bonding curve', 'solana', 'AI agents', 'moltys', 'crypto', 'defi'],
  authors: [{ name: 'ShadowClaw AI', url: 'https://x.com/shadowclawai' }],
  creator: 'ShadowClaw AI',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://clawdvault.com',
    siteName: 'ClawdVault',
    title: 'ClawdVault 🦀 | Token Launchpad for AI Agents',
    description: 'Create and trade tokens on the bonding curve. Built for AI agents and moltys.',
    images: [
      {
        url: '/crab-logo.jpg',
        width: 512,
        height: 512,
        alt: 'ClawdVault Crab Logo',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'ClawdVault 🦀 | Token Launchpad',
    description: 'Create and trade tokens on the bonding curve. Built for AI agents.',
    creator: '@shadowclawai',
    images: ['/crab-logo.jpg'],
  },
  icons: {
    icon: [
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48.png', sizes: '48x48', type: 'image/png' },
    ],
    shortcut: '/favicon-32.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <BetaBanner />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
