import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Suspense } from 'react'
import './globals.css'
import { GoogleAnalytics } from '@/components/Analytics'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SubShield - AI Contract Risk Analysis for Subcontractors',
  description: 'Upload your construction subcontract and get instant AI-powered risk analysis with specific negotiation scripts. Protect your business from bad contracts.',
  keywords: 'subcontractor, contract analysis, construction contracts, risk analysis, pay-if-paid, indemnification, contract negotiation',
  openGraph: {
    title: 'SubShield - AI Contract Risk Analysis',
    description: 'Instant AI-powered risk analysis for construction subcontracts. Get specific negotiation scripts to protect your business.',
    type: 'website',
    url: 'https://app.trysubshield.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SubShield - AI Contract Risk Analysis',
    description: 'Instant AI-powered risk analysis for construction subcontracts.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={inter.className}>
        <Suspense fallback={null}>
          <GoogleAnalytics />
        </Suspense>
        {children}
      </body>
    </html>
  )
}
