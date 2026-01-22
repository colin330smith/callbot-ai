'use client';

import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm z-50 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="font-semibold text-gray-900">
            SubShield
          </Link>
          <Link
            href="/analyze"
            className="text-sm text-gray-900 hover:text-gray-600"
          >
            Analyze a contract →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-medium text-gray-900 leading-snug tracking-tight">
            Know what you're signing before you sign it.
          </h1>
          <p className="mt-4 text-lg text-gray-500 leading-relaxed">
            Upload a subcontract. Get a plain-English breakdown of payment terms,
            liability clauses, and the stuff that actually matters.
          </p>
          <div className="mt-8">
            <Link
              href="/analyze"
              className="inline-flex items-center gap-2 bg-gray-900 text-white pl-5 pr-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Upload a contract
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-400">
            $147 per report. Preview free.
          </p>
        </div>
      </section>

      {/* What you get */}
      <section className="py-16 px-6 border-t border-gray-100">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-8">
            What you get
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-gray-900">Risk assessment</h3>
              <p className="mt-1 text-gray-500">
                A score from 1-10 based on how one-sided the contract is. Higher means more risk for you.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Clause-by-clause breakdown</h3>
              <p className="mt-1 text-gray-500">
                Every problematic section flagged and explained. Pay-if-paid, indemnification,
                lien waivers, no-damage-for-delay — we check for all of it.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Redline suggestions</h3>
              <p className="mt-1 text-gray-500">
                Specific language you can send back to your GC. Not generic templates —
                actual markup based on what's in your contract.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Example */}
      <section className="py-16 px-6 bg-gray-50 border-t border-gray-100">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-8">
            Example finding
          </h2>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Section 4.2 — Payment Terms</p>
                <p className="font-medium text-gray-900">Pay-if-paid clause detected</p>
              </div>
              <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">
                High risk
              </span>
            </div>
            <p className="mt-3 text-sm text-gray-500 leading-relaxed">
              This clause makes your payment contingent on the GC getting paid by the owner.
              If the owner doesn't pay (for any reason), you don't get paid — even if you
              completed the work perfectly.
            </p>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-2">Suggested revision:</p>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded font-mono">
                "Payment shall be due within 30 days of Subcontractor's invoice,
                regardless of Owner's payment to Contractor."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why this exists */}
      <section className="py-16 px-6 border-t border-gray-100">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-8">
            Why this exists
          </h2>
          <div className="prose prose-gray">
            <p className="text-gray-500 leading-relaxed">
              Most subcontractors sign whatever the GC sends over because reviewing
              a 40-page contract with a lawyer costs $500-1,000. So they sign blind
              and hope for the best.
            </p>
            <p className="mt-4 text-gray-500 leading-relaxed">
              That works until it doesn't. A bad indemnification clause can bankrupt
              a company. A pay-if-paid provision can leave you holding the bag for
              months of work.
            </p>
            <p className="mt-4 text-gray-500 leading-relaxed">
              SubShield doesn't replace your lawyer. But it tells you what questions
              to ask before you sign.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 px-6 border-t border-gray-100">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-8">
            Pricing
          </h2>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-medium text-gray-900">$147</span>
            <span className="text-gray-500">per contract</span>
          </div>
          <p className="mt-2 text-gray-500">
            Upload your contract and get a free risk score preview.
            Pay only if you want the full analysis with redline suggestions.
          </p>
          <p className="mt-4 text-sm text-gray-400">
            30-day refund if it's not useful.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 border-t border-gray-100 bg-gray-50">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-gray-900 font-medium">Ready to review a contract?</p>
          <div className="mt-4">
            <Link
              href="/analyze"
              className="inline-flex items-center gap-2 bg-gray-900 text-white pl-5 pr-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Upload a contract
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-100">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-400">
          <span>© 2025 SubShield</span>
          <div className="flex gap-6">
            <a href="mailto:support@trysubshield.com" className="hover:text-gray-600">Contact</a>
            <Link href="/privacy" className="hover:text-gray-600">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-600">Terms</Link>
          </div>
        </div>
        <p className="mt-6 max-w-2xl mx-auto text-xs text-gray-400 text-center">
          Not legal advice. For informational purposes only.
        </p>
      </footer>
    </div>
  );
}
