'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function LandingPage() {
  const [contractsAnalyzed, setContractsAnalyzed] = useState(847);

  // Simulate live counter (in production, this would fetch from API)
  useEffect(() => {
    const interval = setInterval(() => {
      setContractsAnalyzed(prev => prev + Math.floor(Math.random() * 2));
    }, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Announcement Banner */}
      <div className="bg-slate-900 text-white text-sm py-2.5 px-4 text-center">
        <span className="text-emerald-400 font-medium">{contractsAnalyzed.toLocaleString()} contracts analyzed</span>
        <span className="text-slate-400 mx-2">•</span>
        <span className="text-slate-300">$2.4M+ in risks identified this month</span>
        <Link href="/analyze" className="ml-3 text-amber-400 hover:text-amber-300 font-medium">
          Try it free →
        </Link>
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-slate-900">SubShield</span>
            </Link>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
              <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How it works</a>
              <a href="#pricing" className="hover:text-slate-900 transition-colors">Pricing</a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href="mailto:support@trysubshield.com" className="hidden sm:block text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors px-3 py-2">
              Contact
            </a>
            <Link
              href="/analyze"
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
            >
              Analyze contract
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-60" />

        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-white/90 text-sm font-medium mb-8 border border-white/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Avg risk score: 6.4 — Most contracts have hidden issues
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.08] tracking-tight animate-fade-in">
              Know what you're signing
              <span className="block text-blue-200/70">before you sign it</span>
            </h1>

            <p className="mt-6 text-xl text-white/80 leading-relaxed max-w-xl">
              Upload any subcontract. Get a plain-English breakdown of risky clauses
              that could cost you money—in under 3 minutes.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
              <Link
                href="/analyze"
                className="group bg-white hover:bg-slate-50 text-slate-900 px-6 py-4 rounded-xl text-base font-semibold transition-all shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 hover:-translate-y-0.5 flex items-center gap-2"
              >
                Analyze your contract free
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
              <a
                href="#how-it-works"
                className="text-white/90 hover:text-white px-4 py-4 text-base font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                See how it works
              </a>
            </div>

            <div className="mt-8 flex items-center gap-6 text-sm text-white/60">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Free risk preview</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Results in 3 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>$147 full report</span>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Image/Product Shot */}
        <div className="relative max-w-6xl mx-auto px-6 -mt-16 pb-16">
          <div className="relative rounded-2xl overflow-hidden border border-white/20 bg-slate-900 shadow-2xl shadow-black/40">
            {/* Browser Chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-slate-800/50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="flex-1 text-center">
                <div className="inline-block px-4 py-1 rounded-md bg-slate-700/50 text-xs text-slate-400">
                  trysubshield.com/analyze
                </div>
              </div>
            </div>
            {/* App UI Preview */}
            <div className="p-6 sm:p-8 bg-gradient-to-b from-slate-800 to-slate-900">
              <div className="grid lg:grid-cols-5 gap-6">
                {/* Left - Risk Score */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="p-6 rounded-xl bg-slate-800/80 border border-slate-700">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-white text-sm">Turner_Subcontract.pdf</p>
                        <p className="text-xs text-slate-500">42 pages</p>
                      </div>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Risk Score</p>
                        <p className="text-5xl font-bold text-amber-400">7.2</p>
                      </div>
                      <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        High Risk
                      </span>
                    </div>
                  </div>
                  <div className="p-5 rounded-xl bg-slate-800/80 border border-slate-700">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Issues Found</p>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                        <p className="text-2xl font-bold text-red-400">3</p>
                        <p className="text-xs text-red-400/70">Critical</p>
                      </div>
                      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <p className="text-2xl font-bold text-amber-400">5</p>
                        <p className="text-xs text-amber-400/70">Warning</p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-700/50 border border-slate-600">
                        <p className="text-2xl font-bold text-slate-400">2</p>
                        <p className="text-xs text-slate-500">Info</p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Right - Issues List */}
                <div className="lg:col-span-3 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Critical Issues</p>
                    <span className="text-xs text-slate-600">Showing 3 of 10</span>
                  </div>
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 hover:border-red-500/40 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500/20 text-red-400 uppercase">Critical</span>
                          <span className="text-xs text-slate-500">Section 4.2</span>
                        </div>
                        <p className="font-semibold text-white">Pay-if-paid clause</p>
                        <p className="mt-1 text-sm text-slate-400">Payment contingent on owner payment. You bear full non-payment risk.</p>
                      </div>
                      <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 hover:border-red-500/40 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500/20 text-red-400 uppercase">Critical</span>
                          <span className="text-xs text-slate-500">Section 8.1</span>
                        </div>
                        <p className="font-semibold text-white">Broad indemnification</p>
                        <p className="mt-1 text-sm text-slate-400">You indemnify GC even for their own negligence.</p>
                      </div>
                      <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/40 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-400 uppercase">Warning</span>
                          <span className="text-xs text-slate-500">Section 12.4</span>
                        </div>
                        <p className="font-semibold text-white">No-damage-for-delay</p>
                        <p className="mt-1 text-sm text-slate-400">Waives compensation for GC-caused delays.</p>
                      </div>
                      <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-slate-900">{contractsAnalyzed.toLocaleString()}+</p>
              <p className="text-sm text-slate-500 mt-1">Contracts analyzed</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-slate-900">$4.2M</p>
              <p className="text-sm text-slate-500 mt-1">Risks identified</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-slate-900">8.4</p>
              <p className="text-sm text-slate-500 mt-1">Avg issues per contract</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-slate-900">&lt;3 min</p>
              <p className="text-sm text-slate-500 mt-1">Analysis time</p>
            </div>
          </div>

          {/* Security badges */}
          <div className="mt-10 pt-8 border-t border-slate-200">
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
              <div className="flex items-center gap-2 text-slate-500">
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-sm font-medium">256-bit encryption</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-sm font-medium">Files deleted after analysis</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span className="text-sm font-medium">Secure Stripe payments</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-blue-600 text-sm font-semibold tracking-wide uppercase mb-3">Why SubShield</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Stop signing contracts you don't fully understand
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Every clause that could cost you money, explained in plain English.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="group p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center mb-5 transition-colors">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Payment risks</h3>
              <p className="text-slate-600 leading-relaxed">
                Pay-if-paid, pay-when-paid, retainage terms, and other clauses that affect when you get paid.
              </p>
              <p className="mt-4 text-sm text-blue-600 font-medium">Found in 73% of contracts →</p>
            </div>

            <div className="group p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-amber-200 hover:bg-amber-50/50 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-amber-100 group-hover:bg-amber-200 flex items-center justify-center mb-5 transition-colors">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Liability traps</h3>
              <p className="text-slate-600 leading-relaxed">
                Indemnification overreach, insurance requirements, and damage limitations that put you at risk.
              </p>
              <p className="mt-4 text-sm text-amber-600 font-medium">Found in 89% of contracts →</p>
            </div>

            <div className="group p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 group-hover:bg-emerald-200 flex items-center justify-center mb-5 transition-colors">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Redline suggestions</h3>
              <p className="text-slate-600 leading-relaxed">
                Get specific language changes you can send to your GC to negotiate better terms.
              </p>
              <p className="mt-4 text-sm text-emerald-600 font-medium">Copy-paste ready →</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-6 bg-slate-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-blue-400 text-sm font-semibold tracking-wide uppercase mb-3">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Three minutes from upload to insight
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mb-6 text-2xl font-bold text-white">
                1
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Upload your PDF</h3>
              <p className="text-slate-400 leading-relaxed">
                Drop any subcontract PDF. We support documents up to 100 pages. Your files are encrypted and deleted after analysis.
              </p>
            </div>

            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mb-6 text-2xl font-bold text-white">
                2
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">AI analyzes every clause</h3>
              <p className="text-slate-400 leading-relaxed">
                Our model is trained on 40+ known risk patterns specific to subcontractor agreements. It reads what humans miss.
              </p>
            </div>

            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mb-6 text-2xl font-bold text-white">
                3
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Get actionable results</h3>
              <p className="text-slate-400 leading-relaxed">
                Receive a clear report with risk scores, explanations in plain English, and redline suggestions for negotiation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-blue-600 text-sm font-semibold tracking-wide uppercase mb-3">What users say</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Real results from real subcontractors
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <blockquote className="text-lg text-slate-700 leading-relaxed mb-6">
                "Found a pay-if-paid clause buried in section 12 that we completely missed. The GC agreed to change it to pay-when-paid. That one clause was worth 10x what we paid."
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold">
                  JR
                </div>
                <div>
                  <p className="font-semibold text-slate-900">HVAC Contractor</p>
                  <p className="text-sm text-slate-500">$485K project</p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <blockquote className="text-lg text-slate-700 leading-relaxed mb-6">
                "The indemnification clause would have made me liable for the GC's own negligence. Used the suggested redline language and they accepted it. I sleep better now."
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white font-bold">
                  KM
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Electrical Contractor</p>
                  <p className="text-sm text-slate-500">$1.2M project</p>
                </div>
              </div>
            </div>
          </div>

          {/* Results summary */}
          <div className="mt-12 text-center">
            <p className="text-slate-500 text-sm">
              Based on analysis of 847+ contracts. Individual results may vary. These are representative examples.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-blue-600 text-sm font-semibold tracking-wide uppercase mb-3">Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Simple, transparent pricing
            </h2>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
            <div className="p-8 sm:p-10">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-5xl font-bold text-slate-900">$147</span>
                <span className="text-slate-500">per contract</span>
              </div>
              <p className="text-slate-600 mb-8">
                One-time payment. No subscription. No hidden fees.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-emerald-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-slate-700">Full risk analysis with explanations</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-emerald-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-slate-700">Redline suggestions you can send to your GC</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-emerald-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-slate-700">PDF export for your records</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-emerald-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-slate-700">30-day refund guarantee</span>
                </div>
              </div>

              <Link
                href="/analyze"
                className="block w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl text-center font-semibold transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                Start free analysis
              </Link>
              <p className="text-center text-sm text-slate-500 mt-4">
                Upload your contract and see your risk score free. Pay only for the full report.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-blue-600 text-sm font-semibold tracking-wide uppercase mb-3">FAQ</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Common questions
            </h2>
          </div>

          <div className="space-y-6">
            <details className="group border border-slate-200 rounded-xl overflow-hidden">
              <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 transition-colors">
                <span className="font-semibold text-slate-900">Is this legal advice?</span>
                <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-6 pb-6 text-slate-600">
                No. SubShield is an AI-powered educational tool that helps you understand your contracts better. It identifies potentially risky clauses and suggests questions to discuss with your attorney. We always recommend having a licensed attorney review contracts before signing.
              </div>
            </details>

            <details className="group border border-slate-200 rounded-xl overflow-hidden">
              <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 transition-colors">
                <span className="font-semibold text-slate-900">How accurate is the analysis?</span>
                <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-6 pb-6 text-slate-600">
                Our AI is trained on 40+ common risk patterns in construction subcontracts. It catches issues that are often missed in quick reviews, but it's not perfect. Use it as a first pass to identify areas that need closer attention from you or your attorney.
              </div>
            </details>

            <details className="group border border-slate-200 rounded-xl overflow-hidden">
              <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 transition-colors">
                <span className="font-semibold text-slate-900">Is my contract data secure?</span>
                <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-6 pb-6 text-slate-600">
                Yes. All uploads are encrypted with 256-bit SSL. Your contract files are processed and then permanently deleted from our servers. We don't store your contracts or use them to train our AI. We never share your data with third parties.
              </div>
            </details>

            <details className="group border border-slate-200 rounded-xl overflow-hidden">
              <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 transition-colors">
                <span className="font-semibold text-slate-900">What if I'm not satisfied?</span>
                <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-6 pb-6 text-slate-600">
                We offer a 30-day money-back guarantee. If the analysis doesn't provide value, email us and we'll refund your purchase. No questions asked.
              </div>
            </details>

            <details className="group border border-slate-200 rounded-xl overflow-hidden">
              <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 transition-colors">
                <span className="font-semibold text-slate-900">What file types do you accept?</span>
                <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-6 pb-6 text-slate-600">
                We support PDF, DOCX, DOC, and TXT files up to 10MB (approximately 100 pages). Most subcontracts work perfectly. If you have a scanned PDF with images, the text quality may affect results.
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Don't sign another contract blind
          </h2>
          <p className="text-xl text-white/80 mb-10">
            See what's hiding in the fine print before it costs you.
          </p>
          <Link
            href="/analyze"
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-900 px-8 py-4 rounded-xl text-lg font-semibold transition-colors shadow-lg shadow-black/20"
          >
            Analyze your contract
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 bg-slate-900">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="text-lg font-bold text-white">SubShield</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                AI-powered contract analysis built for construction subcontractors.
              </p>
            </div>

            {/* Product */}
            <div>
              <p className="text-sm font-semibold text-white mb-4">Product</p>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How it works</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><Link href="/analyze" className="hover:text-white transition-colors">Try demo</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <p className="text-sm font-semibold text-white mb-4">Resources</p>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><a href="mailto:support@trysubshield.com" className="hover:text-white transition-colors">Contact support</a></li>
                <li><span className="text-slate-600">Blog (coming soon)</span></li>
                <li><span className="text-slate-600">Contract templates</span></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <p className="text-sm font-semibold text-white mb-4">Legal</p>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of service</Link></li>
                <li><span className="text-slate-600">Refund policy</span></li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-slate-800">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-slate-500">
                © 2025 SubShield. All rights reserved.
              </p>
              <div className="flex items-center gap-6 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  SSL Secured
                </span>
                <span>•</span>
                <span>30-day money-back guarantee</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 text-center mt-6 max-w-2xl mx-auto">
              SubShield provides informational contract analysis and is not a law firm. This is not legal advice and should not be relied upon as such. Always consult a licensed attorney for legal questions about your specific situation.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
