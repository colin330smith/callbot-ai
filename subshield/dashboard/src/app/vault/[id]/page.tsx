'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-browser';
import { DashboardMobileNav } from '@/components/MobileNav';
import { ContractDetailSkeleton } from '@/components/LoadingSkeleton';

interface AnalysisIssue {
  title: string;
  category: string;
  clauseLocation?: string;
  clauseText?: string;
  explanation: string;
  worstCase?: string;
  negotiationScript?: string;
}

interface ContractAnalysis {
  riskScore: number;
  recommendation: string;
  executiveSummary: string;
  estimatedExposure?: string;
  criticalIssues: AnalysisIssue[];
  warningIssues: AnalysisIssue[];
  cautionIssues: AnalysisIssue[];
  negotiationPriority?: Array<{
    issue: string;
    priority: number;
    difficulty: string;
    reason: string;
  }>;
  contractSummary?: {
    projectName?: string;
    gcName?: string;
    contractValue?: string;
    paymentTerms?: string;
    retainage?: string;
    retainageAmount?: string;
    liquidatedDamages?: string;
    maxLDExposure?: string;
    warrantyPeriod?: string;
    insuranceRequirements?: string;
    disputeVenue?: string;
  };
  stateSpecificNotes?: string;
}

interface Contract {
  id: string;
  filename: string;
  gc_name: string | null;
  project_name: string | null;
  contract_value: string | null;
  risk_score: number;
  recommendation: string;
  executive_summary: string;
  estimated_exposure: string | null;
  analysis_json: ContractAnalysis;
  created_at: string;
}

export default function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'issues' | 'negotiation'>('overview');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadContract();
  }, [id]);

  const loadContract = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      router.push('/vault');
      return;
    }

    setContract(data as Contract);
    setLoading(false);
  };

  if (loading) {
    return <ContractDetailSkeleton />;
  }

  if (!contract) {
    return null;
  }

  const analysis = contract.analysis_json;

  const getRiskColor = (score: number) => {
    if (score <= 3) return 'text-green-400';
    if (score <= 6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRiskBg = (score: number) => {
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

  const totalIssues =
    (analysis.criticalIssues?.length || 0) +
    (analysis.warningIssues?.length || 0) +
    (analysis.cautionIssues?.length || 0);

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
            </nav>

            {/* Mobile Navigation */}
            <DashboardMobileNav />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link */}
        <Link href="/vault" className="inline-flex items-center text-sm text-slate-400 hover:text-white mb-6">
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Vault
        </Link>

        {/* Contract Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">{contract.filename}</h1>
            <p className="mt-2 text-slate-400">
              {contract.gc_name || 'Unknown GC'} • {contract.project_name || 'Untitled Project'}
            </p>
            <p className="text-sm text-slate-500">
              Analyzed {new Date(contract.created_at).toLocaleDateString()}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className={`px-6 py-4 rounded-xl border ${getRiskBg(contract.risk_score)}`}>
              <p className="text-sm text-slate-400">Risk Score</p>
              <p className={`text-4xl font-bold ${getRiskColor(contract.risk_score)}`}>
                {contract.risk_score}/10
              </p>
            </div>
            <div>
              <span className={`text-lg px-4 py-2 rounded-full border ${getRecommendationBadge(contract.recommendation)}`}>
                {contract.recommendation}
              </span>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 mb-8">
          <h2 className="text-lg font-semibold text-white mb-3">Executive Summary</h2>
          <p className="text-slate-300">{contract.executive_summary}</p>
          {contract.estimated_exposure && (
            <div className="mt-4 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
              <p className="text-sm text-slate-400">Estimated Financial Exposure</p>
              <p className="text-xl font-bold text-red-400">{contract.estimated_exposure}</p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-800 mb-6">
          <nav className="flex gap-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'issues', label: `Issues (${totalIssues})` },
              { id: 'negotiation', label: 'Negotiation' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'overview' | 'issues' | 'negotiation')}
                className={`pb-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && analysis.contractSummary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Project Name', value: analysis.contractSummary.projectName },
              { label: 'General Contractor', value: analysis.contractSummary.gcName },
              { label: 'Contract Value', value: analysis.contractSummary.contractValue },
              { label: 'Payment Terms', value: analysis.contractSummary.paymentTerms },
              { label: 'Retainage', value: analysis.contractSummary.retainage },
              { label: 'Retainage Amount', value: analysis.contractSummary.retainageAmount },
              { label: 'Liquidated Damages', value: analysis.contractSummary.liquidatedDamages },
              { label: 'Max LD Exposure', value: analysis.contractSummary.maxLDExposure },
              { label: 'Warranty Period', value: analysis.contractSummary.warrantyPeriod },
              { label: 'Insurance Requirements', value: analysis.contractSummary.insuranceRequirements },
              { label: 'Dispute Venue', value: analysis.contractSummary.disputeVenue },
            ].filter(item => item.value).map((item, index) => (
              <div key={index} className="bg-slate-900 rounded-lg p-4 border border-slate-800">
                <p className="text-sm text-slate-400 mb-1">{item.label}</p>
                <p className="text-white font-medium">{item.value}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'overview' && analysis.stateSpecificNotes && (
          <div className="mt-6 bg-blue-500/10 rounded-xl p-6 border border-blue-500/20">
            <h3 className="text-lg font-semibold text-blue-400 mb-2">State-Specific Notes</h3>
            <p className="text-slate-300">{analysis.stateSpecificNotes}</p>
          </div>
        )}

        {activeTab === 'issues' && (
          <div className="space-y-6">
            {/* Critical Issues */}
            {analysis.criticalIssues?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Critical Issues ({analysis.criticalIssues.length})
                </h3>
                <div className="space-y-4">
                  {analysis.criticalIssues.map((issue, index) => (
                    <IssueCard key={index} issue={issue} severity="critical" />
                  ))}
                </div>
              </div>
            )}

            {/* Warning Issues */}
            {analysis.warningIssues?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Warning Issues ({analysis.warningIssues.length})
                </h3>
                <div className="space-y-4">
                  {analysis.warningIssues.map((issue, index) => (
                    <IssueCard key={index} issue={issue} severity="warning" />
                  ))}
                </div>
              </div>
            )}

            {/* Caution Issues */}
            {analysis.cautionIssues?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-blue-400 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Caution ({analysis.cautionIssues.length})
                </h3>
                <div className="space-y-4">
                  {analysis.cautionIssues.map((issue, index) => (
                    <IssueCard key={index} issue={issue} severity="caution" />
                  ))}
                </div>
              </div>
            )}

            {totalIssues === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-white">No issues found</h3>
                <p className="text-slate-400">This contract appears to be relatively safe.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'negotiation' && (
          <div className="space-y-6">
            {(analysis.negotiationPriority?.length ?? 0) > 0 && (
              <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                <h3 className="text-lg font-semibold text-white mb-4">Negotiation Priority</h3>
                <div className="space-y-3">
                  {analysis.negotiationPriority?.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        {item.priority}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-white">{item.issue}</p>
                        <p className="text-sm text-slate-400">{item.reason}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        item.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                        item.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {item.difficulty}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Negotiation Scripts from Issues */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Negotiation Scripts</h3>
              <div className="space-y-4">
                {[...(analysis.criticalIssues || []), ...(analysis.warningIssues || [])]
                  .filter(issue => issue.negotiationScript)
                  .map((issue, index) => (
                    <div key={index} className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                      <h4 className="font-semibold text-white mb-2">{issue.title}</h4>
                      <p className="text-xs text-slate-500 mb-3">{issue.category}</p>
                      <div className="bg-slate-800 rounded-lg p-4">
                        <p className="text-sm text-slate-300 whitespace-pre-wrap">{issue.negotiationScript}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function IssueCard({ issue, severity }: { issue: AnalysisIssue; severity: 'critical' | 'warning' | 'caution' }) {
  const [expanded, setExpanded] = useState(false);

  const borderColor = {
    critical: 'border-red-500/30',
    warning: 'border-yellow-500/30',
    caution: 'border-blue-500/30',
  }[severity];

  return (
    <div className={`bg-slate-900 rounded-xl border ${borderColor} overflow-hidden`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between text-left"
      >
        <div>
          <h4 className="font-semibold text-white">{issue.title}</h4>
          <p className="text-sm text-slate-500">{issue.category} {issue.clauseLocation && `• ${issue.clauseLocation}`}</p>
        </div>
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-slate-800 pt-4">
          {issue.clauseText && (
            <div>
              <p className="text-xs text-slate-500 uppercase mb-1">Contract Text</p>
              <p className="text-sm text-slate-400 bg-slate-800/50 p-3 rounded-lg italic">"{issue.clauseText}"</p>
            </div>
          )}

          <div>
            <p className="text-xs text-slate-500 uppercase mb-1">Explanation</p>
            <p className="text-sm text-slate-300">{issue.explanation}</p>
          </div>

          {issue.worstCase && (
            <div>
              <p className="text-xs text-slate-500 uppercase mb-1">Worst Case Scenario</p>
              <p className="text-sm text-red-400">{issue.worstCase}</p>
            </div>
          )}

          {issue.negotiationScript && (
            <div>
              <p className="text-xs text-slate-500 uppercase mb-1">Negotiation Script</p>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-sm text-slate-300 whitespace-pre-wrap">{issue.negotiationScript}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
