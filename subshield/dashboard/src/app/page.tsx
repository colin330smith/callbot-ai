import Link from 'next/link';
import { MobileNav } from '@/components/MobileNav';

const landingNavLinks = [
  { href: '#features', label: 'Features', isExternal: true },
  { href: '#how-it-works', label: 'How it works', isExternal: true },
  { href: '#pricing', label: 'Pricing', isExternal: true },
  { href: '/services', label: 'Expert Services' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Announcement Banner */}
      <div className="bg-slate-900 text-white text-sm py-2.5 px-4 text-center">
        <span className="text-emerald-400 font-medium">New:</span>
        <span className="text-slate-300 ml-2 hidden sm:inline">Now with team collaboration and unlimited contract analysis</span>
        <span className="text-slate-300 ml-2 sm:hidden">Team collaboration available</span>
        <Link href="/signup" className="ml-3 text-amber-400 hover:text-amber-300 font-medium">
          Start free →
        </Link>
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
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
              <Link href="/services" className="hover:text-slate-900 transition-colors">Expert Services</Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden md:block text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors px-3 py-2"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="hidden sm:block bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
            >
              Start free
            </Link>
            <MobileNav links={landingNavLinks} showAuth={true} isDark={false} />
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
              Trusted by 500+ subcontractors — avg risk score found: 6.4
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.08] tracking-tight animate-fade-in">
              Know what you're signing
              <span className="block text-blue-200/70">before you sign it</span>
            </h1>

            <p className="mt-6 text-xl text-white/80 leading-relaxed max-w-xl">
              AI-powered contract analysis for construction subcontractors. Find hidden risks,
              get negotiation scripts, and protect your profits—in under 3 minutes.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
              <Link
                href="/signup"
                className="group bg-white hover:bg-slate-50 text-slate-900 px-6 py-4 rounded-xl text-base font-semibold transition-all shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 hover:-translate-y-0.5 flex items-center gap-2"
              >
                Start your free trial
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
              <Link
                href="/analyze"
                className="text-white/90 hover:text-white px-4 py-4 text-base font-medium transition-colors flex items-center gap-2 border border-white/20 rounded-xl hover:bg-white/10"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Try free preview
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-white/60">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>1 free analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Results in 3 minutes</span>
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
                  trysubshield.com/dashboard
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

      {/* Social Proof */}
      <section className="py-12 px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-sm text-slate-500 mb-8 font-medium">Trusted by subcontractors across the country</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-slate-900">$2.4M+</p>
              <p className="text-sm text-slate-500 mt-1">Risk exposure identified</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900">1,200+</p>
              <p className="text-sm text-slate-500 mt-1">Contracts analyzed</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900">6.4</p>
              <p className="text-sm text-slate-500 mt-1">Average risk score found</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900">3 min</p>
              <p className="text-sm text-slate-500 mt-1">Average analysis time</p>
            </div>
          </div>
        </div>
      </section>

      {/* Security badges */}
      <section className="py-8 px-6 bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto">
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
              <span className="text-sm font-medium">Security-first architecture</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span className="text-sm font-medium">Secure Stripe payments</span>
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
              Every clause that could cost you money, explained in plain English with word-for-word negotiation scripts.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="group p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center mb-5 transition-colors">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Payment Protection</h3>
              <p className="text-slate-600 leading-relaxed">
                Pay-if-paid, pay-when-paid, retainage terms, and lien waivers that affect when (or if) you get paid.
              </p>
            </div>

            <div className="group p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-amber-200 hover:bg-amber-50/50 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-amber-100 group-hover:bg-amber-200 flex items-center justify-center mb-5 transition-colors">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Liability Analysis</h3>
              <p className="text-slate-600 leading-relaxed">
                Indemnification overreach, insurance requirements, liquidated damages, and warranty obligations.
              </p>
            </div>

            <div className="group p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 group-hover:bg-emerald-200 flex items-center justify-center mb-5 transition-colors">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Negotiation Scripts</h3>
              <p className="text-slate-600 leading-relaxed">
                Copy-paste language you can send to your GC to negotiate better terms on problematic clauses.
              </p>
            </div>
          </div>

          {/* Additional feature highlights */}
          <div className="mt-16 grid md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">15 Risk Categories</h4>
                <p className="text-sm text-slate-600">From payment terms to scope creep, we analyze every section of your contract.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">Exposure Estimates</h4>
                <p className="text-sm text-slate-600">See the actual dollar amount at risk based on your contract value.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">Team Collaboration</h4>
                <p className="text-sm text-slate-600">Share analyses with your team. Everyone stays on the same page.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">Contract Vault</h4>
                <p className="text-sm text-slate-600">All your analyzed contracts in one searchable, secure location.</p>
              </div>
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
                Drop any subcontract PDF. We support documents up to 100 pages. Your files are encrypted and analyzed securely.
              </p>
            </div>

            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mb-6 text-2xl font-bold text-white">
                2
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">AI analyzes every clause</h3>
              <p className="text-slate-400 leading-relaxed">
                Our AI scans for 40+ known risk patterns across 15 categories specific to subcontractor agreements.
              </p>
            </div>

            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mb-6 text-2xl font-bold text-white">
                3
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Get actionable results</h3>
              <p className="text-slate-400 leading-relaxed">
                Receive risk scores, plain-English explanations, and word-for-word scripts to negotiate better terms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Common Issues Found */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-blue-600 text-sm font-semibold tracking-wide uppercase mb-3">What we find</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Common risks in subcontracts
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              These clauses are often buried deep in contract documents. Our AI scans for 40+ known risk patterns.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-xl bg-red-50 border border-red-100">
              <p className="font-semibold text-slate-900 mb-2">Pay-if-paid</p>
              <p className="text-sm text-slate-600">You only get paid if the owner pays the GC—putting you at risk for non-payment.</p>
            </div>
            <div className="p-5 rounded-xl bg-amber-50 border border-amber-100">
              <p className="font-semibold text-slate-900 mb-2">Broad indemnification</p>
              <p className="text-sm text-slate-600">Makes you liable even for the GC's own negligence or mistakes.</p>
            </div>
            <div className="p-5 rounded-xl bg-orange-50 border border-orange-100">
              <p className="font-semibold text-slate-900 mb-2">No-damage-for-delay</p>
              <p className="text-sm text-slate-600">Waives your right to compensation when the GC causes delays.</p>
            </div>
            <div className="p-5 rounded-xl bg-yellow-50 border border-yellow-100">
              <p className="font-semibold text-slate-900 mb-2">Excessive retainage</p>
              <p className="text-sm text-slate-600">Holds back more than 5-10% of your earnings until project completion.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-blue-600 text-sm font-semibold tracking-wide uppercase mb-3">Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Plans that scale with your business
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Start free. Upgrade when you're ready. Cancel anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Free */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-1">Free</h3>
                <p className="text-sm text-slate-500">Try before you buy</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">$0</span>
                <span className="text-slate-500">/month</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>1 contract analysis</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Risk score + top 3 issues</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-400">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <span>No history saved</span>
                </li>
              </ul>
              <Link
                href="/signup"
                className="block w-full py-3 px-4 rounded-lg text-center font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Get started
              </Link>
            </div>

            {/* Pro - Popular */}
            <div className="bg-white rounded-2xl shadow-xl border-2 border-blue-500 p-6 flex flex-col relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full">
                Most Popular
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-1">Pro</h3>
                <p className="text-sm text-slate-500">For active subcontractors</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">$49</span>
                <span className="text-slate-500">/month</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span><strong>10 contracts</strong>/month</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Full analysis + all issues</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Negotiation scripts</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>90-day history</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Email support</span>
                </li>
              </ul>
              <Link
                href="/signup?plan=pro"
                className="block w-full py-3 px-4 rounded-lg text-center font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Start free trial
              </Link>
            </div>

            {/* Team */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-1">Team</h3>
                <p className="text-sm text-slate-500">For growing companies</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">$99</span>
                <span className="text-slate-500">/month</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span><strong>25 contracts</strong>/month</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Everything in Pro</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span><strong>5 team members</strong></span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>1-year history</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Priority support</span>
                </li>
              </ul>
              <Link
                href="/signup?plan=team"
                className="block w-full py-3 px-4 rounded-lg text-center font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Start free trial
              </Link>
            </div>

            {/* Business */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-1">Business</h3>
                <p className="text-sm text-slate-500">For high-volume operations</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">$249</span>
                <span className="text-slate-500">/month</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span><strong>Unlimited</strong> contracts</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Everything in Team</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span><strong>15 team members</strong></span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>API access</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Phone + Slack support</span>
                </li>
              </ul>
              <Link
                href="/signup?plan=business"
                className="block w-full py-3 px-4 rounded-lg text-center font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Contact sales
              </Link>
            </div>
          </div>

          {/* Enterprise callout */}
          <div className="mt-12 text-center">
            <p className="text-slate-600">
              Need a custom solution?{' '}
              <Link href="/services" className="text-blue-600 font-medium hover:underline">
                Explore our expert services →
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <svg className="w-12 h-12 text-slate-200 mx-auto mb-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z" />
            </svg>
            <blockquote className="text-2xl sm:text-3xl font-medium text-slate-900 leading-relaxed mb-8">
              "SubShield caught a pay-if-paid clause we completely missed. That single catch saved us from potentially losing $180,000 on a project where the owner went bankrupt."
            </blockquote>
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold">
                MR
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-900">Mike Reynolds</p>
                <p className="text-sm text-slate-500">Owner, Reynolds Electric</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-blue-600 text-sm font-semibold tracking-wide uppercase mb-3">FAQ</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Common questions
            </h2>
          </div>

          <div className="space-y-6">
            <details className="group border border-slate-200 rounded-xl overflow-hidden bg-white">
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

            <details className="group border border-slate-200 rounded-xl overflow-hidden bg-white">
              <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 transition-colors">
                <span className="font-semibold text-slate-900">How accurate is the analysis?</span>
                <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-6 pb-6 text-slate-600">
                Our AI analyzes 15 risk categories and 40+ known risk patterns in construction subcontracts. It catches issues that are often missed in quick reviews. Use it as a first pass to identify areas that need closer attention from you or your attorney.
              </div>
            </details>

            <details className="group border border-slate-200 rounded-xl overflow-hidden bg-white">
              <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 transition-colors">
                <span className="font-semibold text-slate-900">Is my contract data secure?</span>
                <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-6 pb-6 text-slate-600">
                Yes. All uploads are encrypted with 256-bit SSL. Paid users can choose to save contracts securely in their vault. We never share your data with third parties or use it to train our AI.
              </div>
            </details>

            <details className="group border border-slate-200 rounded-xl overflow-hidden bg-white">
              <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 transition-colors">
                <span className="font-semibold text-slate-900">Can I cancel anytime?</span>
                <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-6 pb-6 text-slate-600">
                Yes. Cancel anytime from your account settings. You'll retain access until the end of your billing period. No questions asked, no cancellation fees.
              </div>
            </details>

            <details className="group border border-slate-200 rounded-xl overflow-hidden bg-white">
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
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-900 px-8 py-4 rounded-xl text-lg font-semibold transition-colors shadow-lg shadow-black/20"
            >
              Start your free trial
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
            <Link
              href="/services"
              className="text-white/90 hover:text-white font-medium"
            >
              Or get expert help →
            </Link>
          </div>
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
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><Link href="/services" className="hover:text-white transition-colors">Expert services</Link></li>
                <li><Link href="/analyze" className="hover:text-white transition-colors">Try demo</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <p className="text-sm font-semibold text-white mb-4">Company</p>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><Link href="/login" className="hover:text-white transition-colors">Sign in</Link></li>
                <li><Link href="/signup" className="hover:text-white transition-colors">Create account</Link></li>
                <li><a href="mailto:support@trysubshield.com" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <p className="text-sm font-semibold text-white mb-4">Legal</p>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of service</Link></li>
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
                <span>Cancel anytime</span>
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
