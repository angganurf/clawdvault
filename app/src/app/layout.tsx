import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'ClawdVault 🦀 | Token Launchpad for Moltys',
  description: 'Create and trade tokens on the bonding curve. Built by crabs, for crabs. Let\'s get molty! :3',
  icons: {
    icon: '🦀',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
