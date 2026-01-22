'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-browser';
import { TIER_LIMITS, type SubscriptionTier } from '@/lib/database.types';
import { DashboardMobileNav } from '@/components/MobileNav';
import { SettingsSkeleton } from '@/components/LoadingSkeleton';

interface UserProfile {
  full_name: string | null;
  email: string;
  company_name: string | null;
  phone: string | null;
}

interface Subscription {
  tier: SubscriptionTier;
  status: string;
  contracts_used_this_month: number;
  contracts_limit: number;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Form states
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    // Load profile
    const { data: profileData } = await supabase
      .from('users')
      .select('full_name, email, company_name, phone')
      .eq('id', user.id)
      .single();

    if (profileData) {
      const profile = profileData as UserProfile;
      setProfile(profile);
      setFullName(profile.full_name || '');
      setCompanyName(profile.company_name || '');
      setPhone(profile.phone || '');
    }

    // Load subscription
    const { data: subData } = await supabase
      .from('subscriptions')
      .select('tier, status, contracts_used_this_month, contracts_limit, current_period_end, cancel_at_period_end')
      .eq('user_id', user.id)
      .single();

    if (subData) {
      setSubscription(subData as Subscription);
    }

    setLoading(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: updateError } = await supabase
      .from('users')
      .update({
        full_name: fullName || null,
        company_name: companyName || null,
        phone: phone || null,
      } as never)
      .eq('id', user.id);

    if (updateError) {
      setError('Failed to update profile');
    } else {
      setSuccess('Profile updated successfully');
      loadData();
    }

    setSaving(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return <SettingsSkeleton />;
  }

  const tierLimits = subscription ? TIER_LIMITS[subscription.tier] : null;
  const hasTeamFeatures = subscription?.tier === 'team' || subscription?.tier === 'business';

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
              <Link href="/dashboard" className="text-slate-400 hover:text-white">Dashboard</Link>
              <Link href="/vault" className="text-slate-400 hover:text-white">Vault</Link>
              <Link href="/settings" className="text-white font-medium">Settings</Link>
              <button
                onClick={handleSignOut}
                className="text-slate-400 hover:text-white"
              >
                Sign out
              </button>
            </nav>

            {/* Mobile Navigation */}
            <DashboardMobileNav
              user={profile ? { email: profile.email, name: profile.full_name || undefined } : undefined}
              onSignOut={handleSignOut}
            />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

        <div className="space-y-8">
          {/* Profile Section */}
          <div className="bg-slate-900 rounded-xl border border-slate-800">
            <div className="p-6 border-b border-slate-800">
              <h2 className="text-lg font-semibold text-white">Profile</h2>
              <p className="text-sm text-slate-400">Update your personal information</p>
            </div>
            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                  {success}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-800/50 text-slate-400 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-slate-500">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Your company"
                  className="w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* Subscription Section */}
          <div className="bg-slate-900 rounded-xl border border-slate-800">
            <div className="p-6 border-b border-slate-800">
              <h2 className="text-lg font-semibold text-white">Subscription</h2>
              <p className="text-sm text-slate-400">Manage your subscription and billing</p>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full border ${
                      subscription?.tier === 'free' ? 'bg-slate-500/20 text-slate-400 border-slate-500/30' :
                      subscription?.tier === 'pro' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                      subscription?.tier === 'team' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                      'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    }`}>
                      {subscription?.tier?.toUpperCase()}
                    </span>
                    {subscription?.status === 'active' && (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-slate-400">
                    {subscription?.contracts_limit === -1
                      ? 'Unlimited contracts'
                      : `${subscription?.contracts_used_this_month || 0} of ${subscription?.contracts_limit || 0} contracts used this month`}
                  </p>
                  {subscription?.current_period_end && (
                    <p className="text-xs text-slate-500 mt-1">
                      {subscription.cancel_at_period_end
                        ? `Cancels on ${new Date(subscription.current_period_end).toLocaleDateString()}`
                        : `Renews on ${new Date(subscription.current_period_end).toLocaleDateString()}`}
                    </p>
                  )}
                </div>
                {subscription?.tier === 'free' ? (
                  <Link
                    href="/pricing"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Upgrade
                  </Link>
                ) : (
                  <button
                    onClick={() => {/* TODO: Open Stripe portal */}}
                    className="px-4 py-2 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    Manage Billing
                  </button>
                )}
              </div>

              {/* Features list */}
              {tierLimits && (
                <div className="pt-4 border-t border-slate-800">
                  <h3 className="text-sm font-medium text-slate-300 mb-3">Your plan includes:</h3>
                  <ul className="space-y-2">
                    {tierLimits.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-slate-400">
                        <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Team Section */}
          <div className="bg-slate-900 rounded-xl border border-slate-800">
            <div className="p-6 border-b border-slate-800">
              <h2 className="text-lg font-semibold text-white">Team</h2>
              <p className="text-sm text-slate-400">Manage your team members</p>
            </div>
            <div className="p-6">
              {hasTeamFeatures ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-300">
                      You can invite up to {tierLimits?.teamMembers} team members.
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      Team members share your contract analysis quota.
                    </p>
                  </div>
                  <Link
                    href="/settings/team"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Manage Team
                  </Link>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400">
                      Team features are available on Team and Business plans.
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      Upgrade to collaborate with your team.
                    </p>
                  </div>
                  <Link
                    href="/pricing"
                    className="px-4 py-2 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    View Plans
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-slate-900 rounded-xl border border-red-500/30">
            <div className="p-6 border-b border-slate-800">
              <h2 className="text-lg font-semibold text-red-400">Danger Zone</h2>
              <p className="text-sm text-slate-400">Irreversible actions</p>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300">Delete Account</p>
                  <p className="text-sm text-slate-500">
                    Permanently delete your account and all data.
                  </p>
                </div>
                <button
                  onClick={() => {/* TODO: Implement account deletion */}}
                  className="px-4 py-2 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
