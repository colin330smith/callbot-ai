import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Suspense } from 'react'
import './globals.css'
import { Analytics } from '@/components/Analytics'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://trysubshield.com'),
  title: {
    default: 'SubShield - AI Contract Analysis for Subcontractors | Find Risky Clauses Instantly',
    template: '%s | SubShield',
  },
  description: 'Upload your construction subcontract and get instant AI analysis of pay-if-paid clauses, broad indemnification, and 50+ risky terms. Get word-for-word negotiation scripts. Saves $350+ vs lawyer review.',
  keywords: [
    'subcontractor contract analysis',
    'construction contract review',
    'pay-if-paid clause',
    'broad indemnification',
    'subcontract risk analysis',
    'contract negotiation scripts',
    'construction attorney alternative',
    'subcontractor protection',
    'lien waiver analysis',
    'liquidated damages clause',
    'retainage terms',
    'change order requirements',
    'AI contract review',
    'construction law',
    'subcontractor rights',
  ],
  authors: [{ name: 'SubShield' }],
  creator: 'SubShield',
  publisher: 'SubShield',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://trysubshield.com',
    siteName: 'SubShield',
    title: 'SubShield - AI Contract Analysis for Subcontractors',
    description: 'Instant AI-powered risk analysis for construction subcontracts. Find pay-if-paid clauses, broad indemnification, and risky terms in 60 seconds. Get negotiation scripts.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SubShield - AI Contract Analysis for Subcontractors',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SubShield - AI Contract Analysis for Subcontractors',
    description: 'Find risky clauses in your subcontract in 60 seconds. Get word-for-word negotiation scripts.',
    images: ['/og-image.png'],
    creator: '@trysubshield',
  },
  alternates: {
    canonical: 'https://trysubshield.com',
  },
  category: 'technology',
}

// JSON-LD Structured Data for GEO (Generative Engine Optimization)
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': 'https://trysubshield.com/#application',
      name: 'SubShield',
      description: 'AI-powered contract analysis tool for construction subcontractors. Analyzes subcontracts for risky clauses like pay-if-paid, broad indemnification, and provides negotiation scripts.',
      url: 'https://trysubshield.com',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web Browser',
      offers: {
        '@type': 'Offer',
        price: '147.00',
        priceCurrency: 'USD',
        description: 'Full contract analysis with negotiation scripts',
      },
      featureList: [
        'AI-powered contract risk analysis',
        'Pay-if-paid clause detection',
        'Broad indemnification identification',
        'Lien waiver analysis',
        'Word-for-word negotiation scripts',
        'Risk scoring 1-10',
        'PDF export',
        '60-second analysis',
      ],
    },
    {
      '@type': 'Organization',
      '@id': 'https://trysubshield.com/#organization',
      name: 'SubShield',
      url: 'https://trysubshield.com',
      description: 'SubShield helps subcontractors analyze construction contracts for risky clauses and provides negotiation scripts to protect their business.',
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'support@trysubshield.com',
        contactType: 'customer service',
      },
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://trysubshield.com/#faq',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is a pay-if-paid clause?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'A pay-if-paid clause means the general contractor only has to pay the subcontractor if and when the owner pays the GC. This shifts the collection risk entirely to the subcontractor.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is broad indemnification in construction contracts?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Broad indemnification requires the subcontractor to defend and indemnify the general contractor even for the GC\'s own negligence. This creates unlimited liability exposure for subcontractors.',
          },
        },
        {
          '@type': 'Question',
          name: 'How long does SubShield contract analysis take?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'SubShield analyzes most construction subcontracts in under 60 seconds. Longer contracts (50+ pages) may take up to 2 minutes.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is SubShield a substitute for a construction attorney?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No. SubShield is an AI-powered analysis tool that helps identify potential risks in subcontracts. It provides informational analysis and negotiation suggestions, but users should consult with a licensed construction attorney for legal advice.',
          },
        },
        {
          '@type': 'Question',
          name: 'What types of risky clauses does SubShield detect?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'SubShield detects 50+ types of risky clauses including pay-if-paid, pay-when-paid, broad indemnification, unconditional lien waivers, no-damage-for-delay, excessive retainage, unreasonable change order terms, one-sided termination, and excessive liquidated damages.',
          },
        },
      ],
    },
    {
      '@type': 'Service',
      '@id': 'https://trysubshield.com/#service',
      name: 'SubShield Contract Analysis',
      serviceType: 'Contract Analysis',
      provider: {
        '@id': 'https://trysubshield.com/#organization',
      },
      description: 'AI-powered analysis of construction subcontracts to identify risky clauses and provide negotiation scripts.',
      areaServed: {
        '@type': 'Country',
        name: 'United States',
      },
      audience: {
        '@type': 'Audience',
        audienceType: 'Construction Subcontractors',
      },
    },
  ],
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
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1e40af" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={inter.className}>
        <Suspense fallback={null}>
          <Analytics />
        </Suspense>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
}
