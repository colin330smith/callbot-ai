'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-browser';
import { TIER_LIMITS, type SubscriptionTier } from '@/lib/database.types';
import { DashboardMobileNav } from '@/components/MobileNav';
import { DashboardSkeleton } from '@/components/LoadingSkeleton';

interface Contract {
  id: string;
  filename: string;
  risk_score: number;
  recommendation: string;
  gc_name: string | null;
  project_name: string | null;
  created_at: string;
}

interface Subscription {
  tier: SubscriptionTier;
  status: string;
  contracts_used_this_month: number;
  contracts_limit: number;
  current_period_end: string | null;
}

interface UserProfile {
  full_name: string | null;
  email: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        router.push('/login');
        return;
      }

      // Load user profile
      const { data: profile } = await supabase
        .from('users')
        .select('full_name, email')
        .eq('id', authUser.id)
        .single();

      if (profile) {
        setUser(profile);
      }

      // Load subscription
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('tier, status, contracts_used_this_month, contracts_limit, current_period_end')
        .eq('user_id', authUser.id)
        .single();

      if (sub) {
        setSubscription(sub);
      }

      // Load recent contracts
      const { data: recentContracts } = await supabase
        .from('contracts')
        .select('id, filename, risk_score, recommendation, gc_name, project_name, created_at')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentContracts) {
        setContracts(recentContracts);
      }

      setLoading(false);
    }

    loadData();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  const tierLimits = subscription ? TIER_LIMITS[subscription.tier] : TIER_LIMITS.free;
  const usagePercent = subscription
    ? Math.min((subscription.contracts_used_this_month / subscription.contracts_limit) * 100, 100)
    : 0;
  const isUnlimited = subscription?.contracts_limit === -1;

  const getRiskColor = (score: number) => {
    if (score <= 3) return 'text-green-400';
    if (score <= 6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRecommendationBadge = (rec: string) => {
    switch (rec) {
      case 'SIGN':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'NEGOTIATE':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'WALK AWAY':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
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

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/dashboard" className="text-white font-medium">Dashboard</Link>
              <Link href="/vault" className="text-slate-400 hover:text-white">Vault</Link>
              <Link href="/settings" className="text-slate-400 hover:text-white">Settings</Link>
              <button
                onClick={handleSignOut}
                className="text-slate-400 hover:text-white"
              >
                Sign out
              </button>
            </nav>

            {/* Mobile Navigation */}
            <DashboardMobileNav
              user={user ? { email: user.email, name: user.full_name || undefined } : undefined}
              onSignOut={handleSignOut}
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Welcome back{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}
          </h1>
          <p className="mt-1 text-slate-400">Here's an overview of your contract analysis activity.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Usage Card */}
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-400">Monthly Usage</h3>
              <span className={`text-xs px-2 py-1 rounded-full border ${
                subscription?.tier === 'free' ? 'bg-slate-500/20 text-slate-400 border-slate-500/30' :
                subscription?.tier === 'pro' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                subscription?.tier === 'team' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                'bg-amber-500/20 text-amber-400 border-amber-500/30'
              }`}>
                {subscription?.tier?.toUpperCase()}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">
                {subscription?.contracts_used_this_month || 0}
              </span>
              <span className="text-slate-500">
                / {isUnlimited ? '∞' : subscription?.contracts_limit || 1}
              </span>
            </div>
            {!isUnlimited && (
              <div className="mt-4">
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      usagePercent >= 90 ? 'bg-red-500' :
                      usagePercent >= 70 ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {(subscription?.contracts_limit ?? 0) - (subscription?.contracts_used_this_month ?? 0)} analyses remaining this month
                </p>
              </div>
            )}
          </div>

          {/* Contracts Analyzed */}
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
            <h3 className="text-sm font-medium text-slate-400 mb-4">Total Contracts Analyzed</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">{contracts.length}</span>
              <span className="text-slate-500">all time</span>
            </div>
            <Link
              href="/vault"
              className="mt-4 inline-flex items-center text-sm text-blue-400 hover:text-blue-300"
            >
              View all in vault
              <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
            <h3 className="text-sm font-medium text-slate-400 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                href="/analyze"
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Analyze New Contract
              </Link>
              {subscription?.tier === 'free' && (
                <Link
                  href="/pricing"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-700 hover:bg-slate-800 text-white rounded-lg transition-colors"
                >
                  Upgrade Plan
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Recent Contracts */}
        <div className="bg-slate-900 rounded-xl border border-slate-800">
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Recent Contracts</h2>
              <Link href="/vault" className="text-sm text-blue-400 hover:text-blue-300">
                View all
              </Link>
            </div>
          </div>

          {contracts.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No contracts yet</h3>
              <p className="text-slate-400 mb-6">Upload your first contract to get started.</p>
              <Link
                href="/analyze"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Analyze Your First Contract
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {contracts.map((contract) => (
                <Link
                  key={contract.id}
                  href={`/vault/${contract.id}`}
                  className="flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-white">{contract.filename}</p>
                      <p className="text-sm text-slate-400">
                        {contract.gc_name || 'Unknown GC'} • {contract.project_name || 'Untitled Project'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`text-lg font-bold ${getRiskColor(contract.risk_score)}`}>
                        {contract.risk_score}/10
                      </p>
                      <p className="text-xs text-slate-500">Risk Score</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full border ${getRecommendationBadge(contract.recommendation)}`}>
                      {contract.recommendation}
                    </span>
                    <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Upgrade CTA for Free Users */}
        {subscription?.tier === 'free' && (
          <div className="mt-8 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Unlock Full Protection</h3>
                <p className="mt-1 text-blue-100">
                  Get unlimited analysis, negotiation scripts, and team collaboration with Pro.
                </p>
              </div>
              <Link
                href="/pricing"
                className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
              >
                Upgrade to Pro - $49/mo
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
