'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white antialiased">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-xl font-semibold text-gray-900 tracking-tight">
              SubShield
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <a href="#how-it-works" className="text-sm text-gray-600 hover:text-gray-900">How It Works</a>
              <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900">Pricing</a>
              <a href="#faq" className="text-sm text-gray-600 hover:text-gray-900">FAQ</a>
            </div>
            <Link
              href="/analyze"
              className="bg-gray-900 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800"
            >
              Analyze Contract
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-semibold text-gray-900 tracking-tight leading-tight">
            Review subcontracts before you sign
          </h1>
          <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Upload your construction subcontract. Our AI identifies problematic clauses and shows you exactly what to negotiate.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/analyze"
              className="bg-gray-900 text-white px-6 py-3 rounded text-sm font-medium hover:bg-gray-800"
            >
              Upload Contract
            </Link>
            <Link
              href="/analyze?demo=true"
              className="bg-white text-gray-700 px-6 py-3 rounded text-sm font-medium border border-gray-300 hover:border-gray-400"
            >
              View Sample Report
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Free risk score preview • Full report $147
          </p>
        </div>
      </section>

      {/* Example Output */}
      <section className="py-16 px-6 bg-gray-50 border-y border-gray-200">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Sample_Subcontract_2024.pdf</span>
                <span className="text-sm text-gray-500">Analyzed Jan 15, 2024</span>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-baseline gap-4 mb-6">
                <span className="text-5xl font-semibold text-gray-900">7.8</span>
                <div>
                  <span className="text-sm font-medium text-red-600">High Risk</span>
                  <p className="text-sm text-gray-500">Recommend negotiating before signing</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-red-50 rounded border border-red-100">
                  <span className="text-xs font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded mt-0.5">Critical</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Pay-if-paid clause (Section 4.2)</p>
                    <p className="text-sm text-gray-600">Payment contingent on GC receiving payment from owner</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-red-50 rounded border border-red-100">
                  <span className="text-xs font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded mt-0.5">Critical</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Broad indemnification (Section 8.1)</p>
                    <p className="text-sm text-gray-600">You indemnify GC for their own negligence</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-amber-50 rounded border border-amber-100">
                  <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded mt-0.5">Warning</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Lien waiver requirement (Section 5.4)</p>
                    <p className="text-sm text-gray-600">Unconditional waiver required before payment</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">Full report includes negotiation language for each issue</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-900 mb-12 text-center">
            How it works
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div>
              <div className="text-sm font-medium text-gray-400 mb-2">1</div>
              <h3 className="font-medium text-gray-900 mb-2">Upload your contract</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Drop in your PDF or Word document. We accept subcontracts of any length.
              </p>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-400 mb-2">2</div>
              <h3 className="font-medium text-gray-900 mb-2">Get your risk score</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Our AI analyzes clauses for payment terms, liability, and other common issues.
              </p>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-400 mb-2">3</div>
              <h3 className="font-medium text-gray-900 mb-2">Negotiate with confidence</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Get specific language to send to your GC to fix problematic terms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What We Check */}
      <section className="py-20 px-6 bg-gray-50 border-y border-gray-200">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-center">
            What we check
          </h2>
          <p className="text-gray-600 text-center mb-12 max-w-xl mx-auto">
            We scan for the clauses that commonly cause subcontractors to lose money or take on excessive risk.
          </p>
          <div className="grid sm:grid-cols-2 gap-x-12 gap-y-6">
            {[
              'Pay-if-paid and pay-when-paid clauses',
              'Indemnification and hold harmless provisions',
              'Lien waiver requirements',
              'No-damage-for-delay clauses',
              'Retainage terms and release conditions',
              'Change order notice requirements',
              'Termination provisions',
              'Dispute resolution and venue clauses',
              'Insurance and bonding requirements',
              'Liquidated damages provisions',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Simple pricing
          </h2>
          <p className="text-gray-600 mb-8">
            One price per contract. No subscriptions.
          </p>

          <div className="bg-white rounded-lg border border-gray-200 p-8 text-left">
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-semibold text-gray-900">$147</span>
              <span className="text-gray-500">per contract</span>
            </div>

            <div className="space-y-3 mb-8">
              {[
                'Complete clause-by-clause analysis',
                'Risk score with explanation',
                'Suggested negotiation language',
                'Downloadable PDF report',
                '30-day money-back guarantee',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <svg className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-gray-700">{item}</span>
                </div>
              ))}
            </div>

            <Link
              href="/analyze"
              className="block w-full bg-gray-900 text-white py-3 rounded text-sm font-medium hover:bg-gray-800 text-center"
            >
              Get Started
            </Link>
            <p className="mt-3 text-xs text-gray-500 text-center">
              Free preview available before purchase
            </p>
          </div>

          <p className="mt-8 text-sm text-gray-500">
            Compare: A construction attorney typically charges $300-500/hour for contract review.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-6 bg-gray-50 border-y border-gray-200">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-900 mb-12 text-center">
            Questions
          </h2>

          <div className="space-y-0 divide-y divide-gray-200">
            {[
              {
                q: "What types of contracts can I upload?",
                a: "We analyze construction subcontracts — agreements between general contractors and subcontractors or suppliers. We accept PDF and Word documents.",
              },
              {
                q: "How long does analysis take?",
                a: "Most contracts are analyzed in under a minute. Longer documents may take up to two minutes.",
              },
              {
                q: "Is my contract data secure?",
                a: "Yes. Contracts are encrypted during upload and processing. Files are deleted from our servers after analysis is complete.",
              },
              {
                q: "What's included in the free preview?",
                a: "You get your overall risk score and a summary of the top issues found. The full report includes detailed analysis of every clause and suggested negotiation language.",
              },
              {
                q: "Is this legal advice?",
                a: "No. SubShield is an AI analysis tool that helps identify potential issues in contracts. We recommend consulting with a licensed construction attorney before making final decisions.",
              },
              {
                q: "What if I'm not satisfied?",
                a: "We offer a 30-day money-back guarantee. If the report doesn't provide value, contact us for a full refund.",
              },
            ].map((faq, i) => (
              <div key={i}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between py-4 text-left"
                >
                  <span className="text-sm font-medium text-gray-900 pr-4">{faq.q}</span>
                  <svg
                    className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <p className="pb-4 text-sm text-gray-600 leading-relaxed pr-8">{faq.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Review your contract before signing
          </h2>
          <p className="text-gray-600 mb-8">
            Upload your subcontract and see what's in it.
          </p>
          <Link
            href="/analyze"
            className="inline-block bg-gray-900 text-white px-6 py-3 rounded text-sm font-medium hover:bg-gray-800"
          >
            Upload Contract
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="text-sm text-gray-500">
              © {new Date().getFullYear()} SubShield
            </span>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href="mailto:support@trysubshield.com" className="hover:text-gray-700">Contact</a>
              <Link href="/privacy" className="hover:text-gray-700">Privacy</Link>
              <Link href="/terms" className="hover:text-gray-700">Terms</Link>
            </div>
          </div>
          <p className="mt-6 text-xs text-gray-400 text-center max-w-2xl mx-auto">
            SubShield provides AI-assisted contract analysis for informational purposes only. This is not legal advice. Consult a licensed construction attorney before making decisions about your contracts.
          </p>
        </div>
      </footer>
    </div>
  );
}
