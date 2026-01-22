'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  Zap,
  Lock,
  ChevronDown,
  ChevronUp,
  Check,
} from 'lucide-react';

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 rounded-xl p-2">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">SubShield</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#how-it-works" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">How It Works</a>
              <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
              <a href="#faq" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">FAQ</a>
            </div>
            <Link
              href="/analyze"
              className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Problem Statement */}
            <div className="inline-flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-red-100">
              <AlertTriangle className="w-4 h-4" />
              67% of subcontract disputes stem from unfair contract terms
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 tracking-tight mb-6">
              Stop Signing
              <span className="block text-blue-600">
                Bad Contracts
              </span>
            </h1>

            <p className="text-xl sm:text-2xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Upload your subcontract. Get instant AI analysis of every risky clause.
              Receive exact negotiation scripts to protect your business.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Link
                href="/analyze"
                className="group inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
              >
                Analyze My Contract
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/analyze"
                className="group inline-flex items-center justify-center gap-2 bg-white text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all border border-gray-200"
              >
                <FileText className="w-5 h-5" />
                Try Sample Contract
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-green-500" />
                Free preview included
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-500" />
                Results in 60 seconds
              </span>
              <span className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-gray-400" />
                Files deleted after analysis
              </span>
            </div>
          </div>

          {/* Demo Preview */}
          <div className="mt-16 max-w-5xl mx-auto">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
              <div className="bg-gray-900 p-4 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <span className="text-gray-400 text-sm ml-2">Contract Analysis</span>
              </div>
              <div className="bg-white p-8">
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Left: Risk Score */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="text-6xl font-bold text-red-600">8.2</div>
                      <div>
                        <div className="text-lg font-semibold text-gray-900">High Risk</div>
                        <div className="text-sm text-gray-500">Contract Risk Score</div>
                      </div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-red-700 font-semibold mb-2">
                        <AlertTriangle className="w-5 h-5" />
                        Recommendation: NEGOTIATE
                      </div>
                      <p className="text-sm text-red-600">
                        This contract contains 3 critical clauses that could expose you to unlimited liability.
                      </p>
                    </div>
                  </div>
                  {/* Right: Issues Preview */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900">Issues Found:</h3>
                    {[
                      { title: 'Pay-If-Paid Clause', severity: 'CRITICAL' },
                      { title: 'Broad Indemnification', severity: 'CRITICAL' },
                      { title: 'Unconditional Lien Waiver', severity: 'WARNING' },
                    ].map((issue, i) => (
                      <div key={i} className={`flex items-center justify-between p-3 rounded-lg border ${
                        issue.severity === 'CRITICAL'
                          ? 'bg-red-50 border-red-200'
                          : 'bg-yellow-50 border-yellow-200'
                      }`}>
                        <span className="font-medium text-gray-900">{issue.title}</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                          issue.severity === 'CRITICAL'
                            ? 'bg-red-600 text-white'
                            : 'bg-yellow-500 text-white'
                        }`}>
                          {issue.severity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From upload to actionable insights in under 60 seconds
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Upload Your Contract',
                description: 'Drag and drop your subcontract PDF, Word doc, or paste the text directly.',
                icon: FileText,
                color: 'blue',
              },
              {
                step: '02',
                title: 'AI Analyzes Every Clause',
                description: 'Our AI scans for 50+ types of risky clauses specific to construction contracts.',
                icon: Zap,
                color: 'purple',
              },
              {
                step: '03',
                title: 'Get Negotiation Scripts',
                description: 'Receive exact word-for-word language to send to your GC. Copy, paste, and protect yourself.',
                icon: Shield,
                color: 'green',
              },
            ].map((item, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-shadow">
                <div className="text-5xl font-bold text-gray-100 mb-4">{item.step}</div>
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl mb-6 ${
                  item.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                  item.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                  'bg-green-100 text-green-600'
                }`}>
                  <item.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Find Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Clauses That Bankrupt Subcontractors
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We find the hidden traps GCs don't want you to notice
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Pay-If-Paid Clauses', desc: 'No payment until owner pays GC — you bear the collection risk', danger: true },
              { title: 'Broad Indemnification', desc: "You're liable even for GC negligence — unlimited exposure", danger: true },
              { title: 'Unconditional Lien Waivers', desc: "Give up lien rights before you're paid — lose all leverage", danger: true },
              { title: 'No-Damage-for-Delay', desc: "Delays cost you money but you can't recover damages", danger: false },
              { title: 'Excessive Retainage', desc: '10%+ held back indefinitely — cash flow killer', danger: false },
              { title: 'Unreasonable Change Order Terms', desc: "24-48 hour notice requirements you'll miss", danger: false },
              { title: 'One-Sided Termination', desc: "GC can terminate at will, you can't", danger: false },
              { title: 'Distant Venue Requirements', desc: 'Disputes in another state — expensive to fight', danger: false },
              { title: 'Excessive Liquidated Damages', desc: 'Daily penalties that exceed your profit margin', danger: true },
            ].map((item, i) => (
              <div key={i} className={`p-6 rounded-xl border ${
                item.danger
                  ? 'bg-red-50 border-red-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                    item.danger ? 'text-red-600' : 'text-yellow-600'
                  }`} />
                  <div>
                    <h3 className={`font-semibold ${item.danger ? 'text-red-900' : 'text-yellow-900'}`}>
                      {item.title}
                    </h3>
                    <p className={`text-sm mt-1 ${item.danger ? 'text-red-700' : 'text-yellow-700'}`}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              One Price. Complete Protection.
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              What a lawyer charges for 15 minutes, we deliver in 60 seconds
            </p>
          </div>

          {/* Comparison */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Lawyer Option */}
              <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
                <div className="text-center mb-6">
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Traditional Option</p>
                  <h3 className="text-2xl font-bold text-gray-900">Construction Attorney</h3>
                </div>
                <div className="space-y-4 mb-6">
                  {[
                    { text: '$300-500 per hour', cross: true },
                    { text: '2-5 business days turnaround', cross: true },
                    { text: 'Schedule appointment, wait for availability', cross: true },
                    { text: 'Pay for entire review, even minor contracts', cross: true },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="text-gray-600">{item.text}</span>
                    </div>
                  ))}
                </div>
                <div className="text-center">
                  <span className="text-3xl font-bold text-gray-400">$500+</span>
                  <p className="text-sm text-gray-500">Average contract review</p>
                </div>
              </div>

              {/* SubShield Option */}
              <div className="bg-white rounded-2xl border-2 border-blue-600 overflow-hidden shadow-xl relative">
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  RECOMMENDED
                </div>
                <div className="p-8">
                  <div className="text-center mb-6">
                    <p className="text-sm font-medium text-blue-600 uppercase tracking-wider mb-2">AI-Powered</p>
                    <h3 className="text-2xl font-bold text-gray-900">SubShield Analysis</h3>
                  </div>
                  <div className="space-y-4 mb-6">
                    {[
                      'Instant analysis in under 60 seconds',
                      'Free preview before you pay anything',
                      'Word-for-word negotiation scripts',
                      'Downloadable PDF report',
                      '30-day money-back guarantee',
                    ].map((feature, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                          <Check className="w-3 h-3 text-green-600" />
                        </div>
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-center mb-6">
                    <span className="text-5xl font-bold text-gray-900">$147</span>
                    <p className="text-sm text-gray-500">Per contract • One-time</p>
                  </div>
                  <Link
                    href="/analyze"
                    className="block w-full bg-blue-600 text-white text-center py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-all"
                  >
                    Start Free Preview
                  </Link>
                  <p className="text-center text-xs text-gray-500 mt-3">
                    No credit card required
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Save Calculation */}
          <div className="max-w-2xl mx-auto text-center bg-green-50 rounded-2xl p-8 border border-green-200">
            <p className="text-green-800 font-medium mb-2">Average Savings Per Contract</p>
            <p className="text-4xl font-bold text-green-700 mb-2">$353+</p>
            <p className="text-green-600 text-sm">Based on average attorney hourly rate of $400 × 1.25 hours for basic contract review</p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Is my contract data secure?",
                a: "Yes. Your contracts are encrypted in transit and at rest. We never share your data with third parties. Files are automatically deleted from our servers after analysis.",
              },
              {
                q: "What types of contracts do you analyze?",
                a: "We specialize in construction subcontracts — the agreements between general contractors and subcontractors. We support PDF, Word documents, and plain text.",
              },
              {
                q: "What's included in the free preview?",
                a: "The free preview includes your overall risk score (1-10), recommendation (Sign, Negotiate, or Walk Away), and a preview of the top 3 issues found. Unlock the full report for complete analysis and negotiation scripts.",
              },
              {
                q: "What if I'm not satisfied?",
                a: "We offer a 30-day money-back guarantee. If SubShield doesn't provide value, email us and we'll refund your purchase.",
              },
              {
                q: "How long does analysis take?",
                a: "Most contracts are analyzed in under 60 seconds. Longer contracts (50+ pages) may take up to 2 minutes.",
              },
              {
                q: "Is this legal advice?",
                a: "No. SubShield is an AI-powered analysis tool, not a law firm. We help you identify potential issues, but always recommend consulting with a licensed attorney for final decisions.",
              },
            ].map((faq, i) => (
              <div key={i} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900">{faq.q}</span>
                  {openFaq === i ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-600 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Know What You're Signing
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            One bad clause can cost you everything. Get your contract analyzed before you sign.
          </p>
          <Link
            href="/analyze"
            className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 px-10 py-5 rounded-xl font-bold text-xl hover:bg-gray-100 transition-all"
          >
            Analyze My Contract
            <ArrowRight className="w-6 h-6" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 rounded-lg p-2">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">SubShield</span>
            </div>
            <div className="flex items-center gap-6 text-gray-400 text-sm">
              <a href="mailto:support@trysubshield.com" className="hover:text-white transition-colors">Contact</a>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm max-w-3xl mx-auto">
            <p className="mb-4">
              <strong className="text-gray-400">Important Disclaimer:</strong> SubShield provides AI-assisted contract analysis for informational purposes only.
              This tool does not constitute legal advice and should not be used as a substitute for consultation with a qualified construction attorney.
            </p>
            <p className="text-gray-600">
              © {new Date().getFullYear()} SubShield. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
