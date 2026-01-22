'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { TIER_LIMITS, TIER_PRICING, type SubscriptionTier } from '@/lib/database.types';

const tiers = [
  {
    id: 'free' as SubscriptionTier,
    name: 'Free',
    description: 'Try it out with no commitment',
    popular: false,
  },
  {
    id: 'pro' as SubscriptionTier,
    name: 'Pro',
    description: 'For active subcontractors',
    popular: true,
  },
  {
    id: 'team' as SubscriptionTier,
    name: 'Team',
    description: 'For growing companies',
    popular: false,
  },
  {
    id: 'business' as SubscriptionTier,
    name: 'Business',
    description: 'For established firms',
    popular: false,
  },
];

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [currentTier, setCurrentTier] = useState<SubscriptionTier | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function checkAuth() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        setUser(authUser);
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('tier')
          .eq('user_id', authUser.id)
          .single();
        if (sub) {
          setCurrentTier((sub as { tier: SubscriptionTier }).tier);
        }
      }
    }
    checkAuth();
  }, []);

  const handleSelectPlan = async (tier: SubscriptionTier) => {
    if (tier === 'free') {
      if (!user) {
        router.push('/signup');
      } else {
        router.push('/dashboard');
      }
      return;
    }

    if (!user) {
      router.push(`/signup?plan=${tier}`);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier,
          isAnnual,
        }),
      });

      const { url, error } = await response.json();

      if (error) {
        console.error('Checkout error:', error);
        setLoading(false);
        return;
      }

      window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-white">SubShield</span>
            </Link>

            <nav className="flex items-center gap-6">
              <Link href="/analyze" className="text-slate-400 hover:text-white">Analyze</Link>
              <Link href="/services" className="text-slate-400 hover:text-white">Services</Link>
              {user ? (
                <Link href="/dashboard" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/login" className="text-slate-400 hover:text-white">Login</Link>
                  <Link href="/signup" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                    Get Started
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Choose the plan that fits your business. All plans include our AI-powered contract analysis.
            </p>

            {/* Billing Toggle */}
            <div className="mt-8 flex items-center justify-center gap-4">
              <span className={`text-sm ${!isAnnual ? 'text-white' : 'text-slate-500'}`}>Monthly</span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  isAnnual ? 'bg-blue-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    isAnnual ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm ${isAnnual ? 'text-white' : 'text-slate-500'}`}>
                Annual <span className="text-green-400">(Save 20%)</span>
              </span>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tiers.map((tier) => {
              const limits = TIER_LIMITS[tier.id];
              const pricing = TIER_PRICING[tier.id];
              const price = isAnnual ? Math.round(pricing.annual / 12) : pricing.monthly;
              const isCurrentTier = currentTier === tier.id;

              return (
                <div
                  key={tier.id}
                  className={`relative bg-slate-900 rounded-2xl border p-6 flex flex-col ${
                    tier.popular
                      ? 'border-blue-500 shadow-lg shadow-blue-500/20'
                      : 'border-slate-800'
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full">
                      Most Popular
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white">{tier.name}</h3>
                    <p className="text-sm text-slate-400">{tier.description}</p>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-white">${price}</span>
                      {price > 0 && <span className="text-slate-400">/mo</span>}
                    </div>
                    {isAnnual && price > 0 && (
                      <p className="text-sm text-slate-500 mt-1">
                        ${pricing.annual} billed annually
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3 mb-6 flex-1">
                    <li className="flex items-start gap-2 text-sm text-slate-300">
                      <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>
                        {limits.contracts === -1 ? 'Unlimited' : limits.contracts} contract{limits.contracts !== 1 ? 's' : ''}/month
                      </span>
                    </li>
                    {limits.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-slate-300">
                        <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{feature}</span>
                      </li>
                    ))}
                    {limits.teamMembers > 0 && (
                      <li className="flex items-start gap-2 text-sm text-slate-300">
                        <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{limits.teamMembers} team members</span>
                      </li>
                    )}
                  </ul>

                  <button
                    onClick={() => handleSelectPlan(tier.id)}
                    disabled={loading || isCurrentTier}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                      isCurrentTier
                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                        : tier.popular
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                    }`}
                  >
                    {isCurrentTier
                      ? 'Current Plan'
                      : tier.id === 'free'
                      ? 'Get Started Free'
                      : `Upgrade to ${tier.name}`}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Features Comparison */}
          <div className="mt-20">
            <h2 className="text-2xl font-bold text-white text-center mb-8">
              Compare All Features
            </h2>

            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left p-4 text-slate-400 font-medium">Feature</th>
                    {tiers.map((tier) => (
                      <th key={tier.id} className="text-center p-4 text-white font-medium">
                        {tier.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <tr>
                    <td className="p-4 text-slate-300">Contracts per month</td>
                    <td className="p-4 text-center text-slate-300">1</td>
                    <td className="p-4 text-center text-slate-300">10</td>
                    <td className="p-4 text-center text-slate-300">25</td>
                    <td className="p-4 text-center text-slate-300">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="p-4 text-slate-300">Full risk analysis</td>
                    <td className="p-4 text-center"><span className="text-slate-500">-</span></td>
                    <td className="p-4 text-center"><Check /></td>
                    <td className="p-4 text-center"><Check /></td>
                    <td className="p-4 text-center"><Check /></td>
                  </tr>
                  <tr>
                    <td className="p-4 text-slate-300">Negotiation scripts</td>
                    <td className="p-4 text-center"><span className="text-slate-500">-</span></td>
                    <td className="p-4 text-center"><Check /></td>
                    <td className="p-4 text-center"><Check /></td>
                    <td className="p-4 text-center"><Check /></td>
                  </tr>
                  <tr>
                    <td className="p-4 text-slate-300">PDF export</td>
                    <td className="p-4 text-center"><span className="text-slate-500">-</span></td>
                    <td className="p-4 text-center"><Check /></td>
                    <td className="p-4 text-center"><Check /></td>
                    <td className="p-4 text-center"><Check /></td>
                  </tr>
                  <tr>
                    <td className="p-4 text-slate-300">Contract history</td>
                    <td className="p-4 text-center"><span className="text-slate-500">-</span></td>
                    <td className="p-4 text-center text-slate-300">90 days</td>
                    <td className="p-4 text-center text-slate-300">1 year</td>
                    <td className="p-4 text-center text-slate-300">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="p-4 text-slate-300">Team members</td>
                    <td className="p-4 text-center"><span className="text-slate-500">-</span></td>
                    <td className="p-4 text-center"><span className="text-slate-500">-</span></td>
                    <td className="p-4 text-center text-slate-300">5</td>
                    <td className="p-4 text-center text-slate-300">15</td>
                  </tr>
                  <tr>
                    <td className="p-4 text-slate-300">API access</td>
                    <td className="p-4 text-center"><span className="text-slate-500">-</span></td>
                    <td className="p-4 text-center"><span className="text-slate-500">-</span></td>
                    <td className="p-4 text-center"><span className="text-slate-500">-</span></td>
                    <td className="p-4 text-center"><Check /></td>
                  </tr>
                  <tr>
                    <td className="p-4 text-slate-300">Priority support</td>
                    <td className="p-4 text-center"><span className="text-slate-500">-</span></td>
                    <td className="p-4 text-center text-slate-300">Email</td>
                    <td className="p-4 text-center text-slate-300">Chat</td>
                    <td className="p-4 text-center text-slate-300">Phone + Slack</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Services CTA */}
          <div className="mt-16 bg-gradient-to-r from-amber-600 to-orange-500 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">
              Need Expert Human Review?
            </h2>
            <p className="text-amber-100 mb-6 max-w-xl mx-auto">
              Our construction law experts can provide detailed human review, redlining, and negotiation support for your most critical contracts.
            </p>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-amber-700 font-semibold rounded-lg hover:bg-amber-50 transition-colors"
            >
              View Expert Services
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* FAQ */}
          <div className="mt-20">
            <h2 className="text-2xl font-bold text-white text-center mb-8">
              Frequently Asked Questions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                <h3 className="font-semibold text-white mb-2">Can I cancel anytime?</h3>
                <p className="text-slate-400 text-sm">
                  Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
                </p>
              </div>
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                <h3 className="font-semibold text-white mb-2">What happens if I exceed my limit?</h3>
                <p className="text-slate-400 text-sm">
                  You'll be notified when you're approaching your limit. You can upgrade your plan at any time to get more analyses.
                </p>
              </div>
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                <h3 className="font-semibold text-white mb-2">Is my contract data secure?</h3>
                <p className="text-slate-400 text-sm">
                  Yes, we use bank-level encryption (AES-256) and never store your raw contract files after analysis. Your data is never shared with third parties.
                </p>
              </div>
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                <h3 className="font-semibold text-white mb-2">Do you offer refunds?</h3>
                <p className="text-slate-400 text-sm">
                  We offer a 14-day money-back guarantee. If you're not satisfied with SubShield, contact us for a full refund.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm">
              © 2025 SubShield. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="/terms" className="text-slate-500 hover:text-slate-300 text-sm">Terms</Link>
              <Link href="/privacy" className="text-slate-500 hover:text-slate-300 text-sm">Privacy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Check() {
  return (
    <svg className="w-5 h-5 text-green-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
