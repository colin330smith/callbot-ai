'use client';

import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0c1220] text-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0c1220]/90 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold tracking-tight">
              SubShield
            </Link>
            <div className="hidden md:flex items-center gap-6 text-sm text-zinc-400">
              <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href="mailto:support@trysubshield.com" className="hidden sm:block text-sm text-zinc-400 hover:text-white transition-colors">
              Contact
            </a>
            <Link
              href="/analyze"
              className="bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Analyze contract
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 sm:pt-36 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-emerald-400 text-sm font-medium tracking-wide uppercase mb-4">
            Contract Analysis for Subcontractors
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
            Know what you're signing
            <br />
            <span className="text-zinc-500">before you sign it</span>
          </h1>
          <p className="mt-6 text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Upload any subcontract PDF. Get a plain-English breakdown of pay-if-paid clauses,
            indemnification traps, and every other clause that could cost you money.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/analyze"
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-3.5 rounded-lg text-sm font-semibold transition-colors"
            >
              Analyze your contract free
            </Link>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto border border-zinc-700 hover:border-zinc-600 text-white px-6 py-3.5 rounded-lg text-sm font-medium transition-colors"
            >
              See how it works
            </a>
          </div>
          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-zinc-500">
            <span>Free risk preview</span>
            <span className="w-1 h-1 rounded-full bg-zinc-700" />
            <span>Full report $147</span>
          </div>
        </div>
      </section>

      {/* Trust indicators */}
      <section className="py-8 px-6 border-y border-white/5">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-zinc-500 text-sm">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>2,400+ contracts analyzed</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>89% had critical issues</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Results in 3 minutes</span>
          </div>
        </div>
      </section>

      {/* Product Screenshot */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#141d2e] shadow-2xl shadow-black/50">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-[#0c1220]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-white/10" />
                <div className="w-3 h-3 rounded-full bg-white/10" />
                <div className="w-3 h-3 rounded-full bg-white/10" />
              </div>
              <div className="flex-1 text-center">
                <div className="inline-block px-4 py-1 rounded-md bg-white/5 text-xs text-zinc-500">
                  trysubshield.com/analyze
                </div>
              </div>
            </div>
            {/* App UI */}
            <div className="p-6 sm:p-8">
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Left - Contract Info */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                      <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold">Turner_Subcontract_2024.pdf</p>
                      <p className="text-sm text-zinc-500">42 pages • Uploaded just now</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-5 rounded-xl bg-white/5 border border-white/5">
                      <div>
                        <p className="text-xs text-zinc-500 mb-1">Risk Score</p>
                        <p className="text-3xl font-bold text-amber-400">7.2</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-zinc-500 mb-1">Classification</p>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          High Risk
                        </span>
                      </div>
                    </div>
                    <div className="p-5 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-xs text-zinc-500 mb-3">Issues Found</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">3 Critical</span>
                        <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">5 Warning</span>
                        <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-zinc-400 border border-white/10">2 Info</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Right - Finding Preview */}
                <div className="space-y-3">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-4">Top Issues</p>
                  <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-zinc-500 mb-1">Section 4.2 • Payment Terms</p>
                        <p className="font-medium">Pay-if-paid clause</p>
                      </div>
                      <span className="shrink-0 px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-400">Critical</span>
                    </div>
                    <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                      Payment contingent on owner payment. You bear full non-payment risk.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-zinc-500 mb-1">Section 8.1 • Liability</p>
                        <p className="font-medium">Broad indemnification</p>
                      </div>
                      <span className="shrink-0 px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-400">Critical</span>
                    </div>
                    <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                      You indemnify GC even for their own negligence.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-zinc-500 mb-1">Section 12.4 • Delays</p>
                        <p className="font-medium">No-damage-for-delay</p>
                      </div>
                      <span className="shrink-0 px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-400">Warning</span>
                    </div>
                    <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                      Waives compensation for GC-caused delays.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-emerald-400 text-sm font-medium tracking-wide uppercase mb-3">
              How it works
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold">
              Three minutes to know what you're signing
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8 sm:gap-12">
            <div className="text-center sm:text-left">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 mx-auto sm:mx-0">
                <span className="text-emerald-400 font-bold">1</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Upload your PDF</h3>
              <p className="text-zinc-400 leading-relaxed">
                Drop any subcontract. We support PDFs up to 100 pages.
              </p>
            </div>
            <div className="text-center sm:text-left">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 mx-auto sm:mx-0">
                <span className="text-emerald-400 font-bold">2</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">AI scans every clause</h3>
              <p className="text-zinc-400 leading-relaxed">
                Our model checks for 40+ known risk patterns specific to subcontracts.
              </p>
            </div>
            <div className="text-center sm:text-left">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 mx-auto sm:mx-0">
                <span className="text-emerald-400 font-bold">3</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Get your report</h3>
              <p className="text-zinc-400 leading-relaxed">
                Plain-English findings with redline suggestions you can send to your GC.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-20 px-6 border-t border-white/5 bg-[#0a0f1a]">
        <div className="max-w-3xl mx-auto text-center">
          <svg className="w-10 h-10 text-emerald-500/30 mx-auto mb-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>
          <blockquote className="text-xl sm:text-2xl font-medium leading-relaxed text-zinc-200">
            Found a pay-if-paid clause we completely missed. Saved us from signing
            a contract that would have left us holding $180K in risk.
          </blockquote>
          <div className="mt-8 flex items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold">
              MT
            </div>
            <div className="text-left">
              <p className="font-semibold">Mike Torres</p>
              <p className="text-sm text-zinc-500">CEO, Torres Mechanical</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-emerald-400 text-sm font-medium tracking-wide uppercase mb-3">
            Simple pricing
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            $147 per contract
          </h2>
          <p className="text-zinc-400 text-lg mb-8 max-w-lg mx-auto">
            Upload your contract and get a free risk score preview.
            Pay only if you want the full analysis with redline suggestions.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <Link
              href="/analyze"
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-black px-8 py-4 rounded-lg font-semibold transition-colors"
            >
              Upload your contract
            </Link>
          </div>
          <p className="text-sm text-zinc-500">
            30-day refund if you don't find it useful.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 border-t border-white/5 bg-gradient-to-b from-[#0c1220] to-[#0a0f1a]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Don't sign blind
          </h2>
          <p className="text-zinc-400 text-lg mb-8">
            See what's hiding in the fine print before it costs you.
          </p>
          <Link
            href="/analyze"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-3.5 rounded-lg font-semibold transition-colors"
          >
            Analyze your contract
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-6">
              <span className="font-bold text-lg">SubShield</span>
              <span className="text-sm text-zinc-500">© 2025</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-zinc-400">
              <a href="mailto:support@trysubshield.com" className="hover:text-white transition-colors">support@trysubshield.com</a>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            </div>
          </div>
          <p className="mt-8 text-xs text-zinc-600 text-center">
            SubShield provides informational contract analysis and is not a law firm.
            This is not legal advice. Consult an attorney for legal questions.
          </p>
        </div>
      </footer>
    </div>
  );
}
