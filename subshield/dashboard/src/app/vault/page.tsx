'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-browser';
import { DashboardMobileNav } from '@/components/MobileNav';
import { VaultSkeleton } from '@/components/LoadingSkeleton';

interface Contract {
  id: string;
  filename: string;
  file_size: number;
  page_count: number | null;
  risk_score: number;
  recommendation: string;
  executive_summary: string;
  gc_name: string | null;
  project_name: string | null;
  contract_value: string | null;
  created_at: string;
}

export default function VaultPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'risk' | 'name'>('date');
  const [filterRisk, setFilterRisk] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadContracts() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login?redirect=/vault');
        return;
      }

      const { data } = await supabase
        .from('contracts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) {
        setContracts(data);
      }

      setLoading(false);
    }

    loadContracts();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const filteredContracts = contracts
    .filter((contract) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          contract.filename.toLowerCase().includes(query) ||
          contract.gc_name?.toLowerCase().includes(query) ||
          contract.project_name?.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .filter((contract) => {
      // Risk filter
      if (filterRisk === 'high') return contract.risk_score >= 7;
      if (filterRisk === 'medium') return contract.risk_score >= 4 && contract.risk_score < 7;
      if (filterRisk === 'low') return contract.risk_score < 4;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'risk') {
        return b.risk_score - a.risk_score;
      }
      if (sortBy === 'name') {
        return a.filename.localeCompare(b.filename);
      }
      return 0;
    });

  const getRiskColor = (score: number) => {
    if (score <= 3) return 'text-green-400';
    if (score <= 6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRiskBgColor = (score: number) => {
    if (score <= 3) return 'bg-green-500/20 border-green-500/30';
    if (score <= 6) return 'bg-yellow-500/20 border-yellow-500/30';
    return 'bg-red-500/20 border-red-500/30';
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return <VaultSkeleton />;
  }

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
              <Link href="/vault" className="text-white font-medium">Vault</Link>
              <Link href="/settings" className="text-slate-400 hover:text-white">Settings</Link>
              <button
                onClick={handleSignOut}
                className="text-slate-400 hover:text-white"
              >
                Sign out
              </button>
            </nav>

            {/* Mobile Navigation */}
            <DashboardMobileNav onSignOut={handleSignOut} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Contract Vault</h1>
            <p className="mt-1 text-slate-400">
              {contracts.length} contract{contracts.length !== 1 ? 's' : ''} analyzed
            </p>
          </div>
          <Link
            href="/analyze"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Analyze New Contract
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1 relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search contracts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'risk' | 'name')}
            className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="date">Sort by Date</option>
            <option value="risk">Sort by Risk</option>
            <option value="name">Sort by Name</option>
          </select>

          {/* Risk Filter */}
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value as 'all' | 'high' | 'medium' | 'low')}
            className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Risk Levels</option>
            <option value="high">High Risk (7-10)</option>
            <option value="medium">Medium Risk (4-6)</option>
            <option value="low">Low Risk (1-3)</option>
          </select>
        </div>

        {/* Contracts Grid */}
        {filteredContracts.length === 0 ? (
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-12 text-center">
            {contracts.length === 0 ? (
              <>
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Your vault is empty</h3>
                <p className="text-slate-400 mb-6">Analyzed contracts will appear here.</p>
                <Link
                  href="/analyze"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Analyze Your First Contract
                </Link>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No contracts found</h3>
                <p className="text-slate-400">Try adjusting your search or filters.</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContracts.map((contract) => (
              <Link
                key={contract.id}
                href={`/vault/${contract.id}`}
                className="bg-slate-900 rounded-xl border border-slate-800 p-6 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center border ${getRiskBgColor(contract.risk_score)}`}>
                    <span className={`text-lg font-bold ${getRiskColor(contract.risk_score)}`}>
                      {contract.risk_score}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full border ${getRecommendationBadge(contract.recommendation)}`}>
                    {contract.recommendation}
                  </span>
                </div>

                <h3 className="font-semibold text-white mb-1 truncate">{contract.filename}</h3>
                <p className="text-sm text-slate-400 mb-3">
                  {contract.gc_name || 'Unknown GC'} {contract.project_name && `• ${contract.project_name}`}
                </p>

                <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                  {contract.executive_summary}
                </p>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{formatDate(contract.created_at)}</span>
                  <span>{formatFileSize(contract.file_size)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
