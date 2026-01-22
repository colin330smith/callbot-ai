'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useDropzone } from 'react-dropzone';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { trackAnalytics, usePageTracking } from '@/components/Analytics';
import { SAMPLE_CONTRACT, SAMPLE_CONTRACT_FILENAME } from '@/lib/sample-contract';

interface PreviewAnalysis {
  riskScore: number;
  recommendation: string;
  executiveSummary: string;
  topThreeIssues: {
    title: string;
    severity: string;
    preview: string;
  }[];
  totalIssuesFound: number;
}

interface FullAnalysis {
  riskScore: number;
  recommendation: string;
  executiveSummary: string;
  criticalIssues: Issue[];
  warningIssues: Issue[];
  cautionIssues: Issue[];
  contractSummary: {
    projectName: string;
    contractValue: string;
    paymentTerms: string;
    retainage: string;
    liquidatedDamages: string;
    warrantyPeriod: string;
    insuranceRequirements: string;
  };
}

interface Issue {
  title: string;
  clauseText: string;
  explanation: string;
  negotiationScript: string;
}

function AnalyzePageContent() {
  const searchParams = useSearchParams();
  usePageTracking();

  const [file, setFile] = useState<File | null>(null);
  const [contractText, setContractText] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [previewAnalysis, setPreviewAnalysis] = useState<PreviewAnalysis | null>(null);
  const [fullAnalysis, setFullAnalysis] = useState<FullAnalysis | null>(null);
  const [error, setError] = useState('');
  const [showPaywall, setShowPaywall] = useState(false);
  const [email, setEmail] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [isDemo, setIsDemo] = useState(false);
  const [leadCaptured, setLeadCaptured] = useState(false);

  useEffect(() => {
    if (loading && analysisProgress < 95) {
      const interval = setInterval(() => {
        setAnalysisProgress((prev) => {
          const increment = Math.random() * 15;
          return Math.min(prev + increment, 95);
        });
      }, 500);
      return () => clearInterval(interval);
    } else if (!loading) {
      setAnalysisProgress(0);
    }
  }, [loading, analysisProgress]);

  useEffect(() => {
    const paid = searchParams.get('paid');
    const sessionId = searchParams.get('session_id');

    if (paid === 'true' && sessionId) {
      setIsPaid(true);
      trackAnalytics.purchaseCompleted();

      const savedText = localStorage.getItem('pendingContractText');
      const savedPreview = localStorage.getItem('pendingPreviewAnalysis');

      if (savedText) {
        setContractText(savedText);
        if (savedPreview) {
          setPreviewAnalysis(JSON.parse(savedPreview));
        }
        runFullAnalysis(savedText);
        localStorage.removeItem('pendingContractText');
        localStorage.removeItem('pendingPreviewAnalysis');
      }
    }
  }, [searchParams]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    if (!uploadedFile) return;

    const fileExtension = uploadedFile.name.split('.').pop() || 'unknown';
    trackAnalytics.contractUploaded(fileExtension, uploadedFile.size);

    setFile(uploadedFile);
    setError('');
    setPreviewAnalysis(null);
    setFullAnalysis(null);
    setParsing(true);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);

      const parseResponse = await fetch('/api/parse-document', {
        method: 'POST',
        body: formData,
      });

      const parseResult = await parseResponse.json();

      if (!parseResponse.ok) {
        trackAnalytics.errorOccurred('parse_error', parseResult.error || 'Failed to parse document');
        throw new Error(parseResult.error || 'Failed to parse document');
      }

      setContractText(parseResult.text);
      setParsing(false);

      await runPreviewAnalysis(parseResult.text);

    } catch (err) {
      setParsing(false);
      setError(err instanceof Error ? err.message : 'Failed to process file');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const runPreviewAnalysis = async (text: string) => {
    setLoading(true);
    setError('');
    setAnalysisProgress(0);
    trackAnalytics.previewStarted();

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractText: text, preview: true }),
      });

      const result = await response.json();

      if (!response.ok) {
        trackAnalytics.errorOccurred('analysis_error', result.error || 'Analysis failed');
        throw new Error(result.error || 'Analysis failed');
      }

      setAnalysisProgress(100);
      setTimeout(() => {
        setPreviewAnalysis(result.analysis);
        setShowPaywall(true);
        trackAnalytics.previewCompleted(result.analysis.riskScore, result.analysis.recommendation);
      }, 300);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const runFullAnalysis = async (text?: string) => {
    const textToAnalyze = text || contractText;
    setLoading(true);
    setError('');
    setShowPaywall(false);
    setAnalysisProgress(0);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractText: textToAnalyze, preview: false }),
      });

      const result = await response.json();

      if (!response.ok) {
        trackAnalytics.errorOccurred('full_analysis_error', result.error || 'Analysis failed');
        throw new Error(result.error || 'Analysis failed');
      }

      setAnalysisProgress(100);
      setTimeout(() => {
        setFullAnalysis(result.analysis);
        setPreviewAnalysis(null);
        trackAnalytics.fullReportViewed();
      }, 300);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const captureLead = async (captureEmail: string, riskScore?: number, source: string = 'preview') => {
    if (!captureEmail || leadCaptured) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(captureEmail)) return;

    try {
      await fetch('/api/capture-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: captureEmail,
          source,
          riskScore,
        }),
      });
      setLeadCaptured(true);
      trackAnalytics.emailCaptured(source, riskScore);
    } catch (err) {
      console.error('Failed to capture lead:', err);
    }
  };

  const handleEmailBlur = () => {
    if (email && !leadCaptured && previewAnalysis) {
      captureLead(email, previewAnalysis.riskScore, 'email_input');
    }
  };

  const handlePayment = async () => {
    if (!email) {
      setError('Please enter your email to continue');
      return;
    }

    if (!leadCaptured) {
      await captureLead(email, previewAnalysis?.riskScore, 'checkout');
    }

    trackAnalytics.unlockClicked();

    localStorage.setItem('pendingContractText', contractText);
    localStorage.setItem('pendingPreviewAnalysis', JSON.stringify(previewAnalysis));

    try {
      trackAnalytics.checkoutStarted(email);

      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          analysisId: Date.now().toString(),
        }),
      });

      const { url, error } = await response.json();

      if (error) {
        trackAnalytics.errorOccurred('checkout_error', error);
        throw new Error(error);
      }

      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 7) return 'text-red-600';
    if (score >= 4) return 'text-amber-600';
    return 'text-green-600';
  };

  const reset = () => {
    setFile(null);
    setContractText('');
    setPreviewAnalysis(null);
    setFullAnalysis(null);
    setError('');
    setShowPaywall(false);
    setIsDemo(false);
  };

  const loadSampleContract = async () => {
    setIsDemo(true);
    setError('');
    setPreviewAnalysis(null);
    setFullAnalysis(null);
    setContractText(SAMPLE_CONTRACT);
    trackAnalytics.contractUploaded('demo', SAMPLE_CONTRACT.length);
    await runPreviewAnalysis(SAMPLE_CONTRACT);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold text-gray-900 tracking-tight">
            SubShield
          </Link>
          {(previewAnalysis || fullAnalysis) && (
            <button
              onClick={reset}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Start over
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Upload Section */}
        {!previewAnalysis && !fullAnalysis && !loading && !parsing && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-semibold text-gray-900 mb-3">
                Analyze your contract
              </h1>
              <p className="text-gray-600">
                Upload your subcontract to identify risky clauses
              </p>
            </div>

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-gray-900 bg-gray-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <div className="text-gray-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-gray-900 font-medium mb-1">
                Drop your contract here
              </p>
              <p className="text-sm text-gray-500 mb-4">or click to browse</p>
              <p className="text-xs text-gray-400">
                PDF, DOCX, DOC, or TXT • Max 10MB
              </p>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={loadSampleContract}
                className="text-sm text-gray-600 hover:text-gray-900 underline"
              >
                Try with a sample contract
              </button>
            </div>
          </>
        )}

        {/* Loading State */}
        {(loading || parsing) && (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-900 font-medium mb-1">
              {parsing ? 'Reading document...' : 'Analyzing contract...'}
            </p>
            <p className="text-sm text-gray-500">
              {parsing ? 'Extracting text from your file' : 'This usually takes 30-60 seconds'}
            </p>
            {loading && (
              <div className="max-w-xs mx-auto mt-6">
                <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gray-900 transition-all duration-300"
                    style={{ width: `${analysisProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Preview Analysis with Paywall */}
        {previewAnalysis && showPaywall && (
          <div className="space-y-8">
            {isDemo && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm">
                <p className="text-gray-600">
                  <span className="font-medium text-gray-900">Sample contract:</span> This is a demo analysis of a $485,000 electrical subcontract.{' '}
                  <button onClick={reset} className="text-gray-900 underline">
                    Upload your own
                  </button>
                </p>
              </div>
            )}

            {/* Risk Score */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Risk Score</p>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-5xl font-semibold ${getRiskColor(previewAnalysis.riskScore)}`}>
                        {previewAnalysis.riskScore}
                      </span>
                      <span className="text-xl text-gray-400">/10</span>
                    </div>
                  </div>
                  <span className={`text-sm font-medium px-3 py-1 rounded ${
                    previewAnalysis.recommendation === 'WALK AWAY'
                      ? 'bg-red-100 text-red-700'
                      : previewAnalysis.recommendation === 'NEGOTIATE'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {previewAnalysis.recommendation}
                  </span>
                </div>
                <p className="text-gray-600">{previewAnalysis.executiveSummary}</p>
              </div>
            </div>

            {/* Issues Preview */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <span className="font-medium text-gray-900">Issues Found</span>
                <span className="text-sm text-gray-500">{previewAnalysis.totalIssuesFound} total</span>
              </div>
              <div className="divide-y divide-gray-200">
                {previewAnalysis.topThreeIssues.map((issue, index) => (
                  <div key={index} className="p-4">
                    <div className="flex items-start gap-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded mt-0.5 ${
                        issue.severity === 'CRITICAL'
                          ? 'bg-red-100 text-red-700'
                          : issue.severity === 'WARNING'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {issue.severity}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900 mb-1">{issue.title}</p>
                        <p className="text-sm text-gray-600">{issue.preview}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {previewAnalysis.totalIssuesFound > 3 && (
                  <div className="p-4 bg-gray-50 text-center text-sm text-gray-500">
                    +{previewAnalysis.totalIssuesFound - 3} more issues in full report
                  </div>
                )}
              </div>
            </div>

            {/* Unlock CTA */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="max-w-md mx-auto text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Get the full report
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Includes detailed analysis of all {previewAnalysis.totalIssuesFound} issues with negotiation language for each.
                </p>

                <div className="mb-4">
                  <span className="text-3xl font-semibold text-gray-900">$147</span>
                  <span className="text-gray-500 ml-1">one-time</span>
                </div>

                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={handleEmailBlur}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
                <button
                  onClick={handlePayment}
                  disabled={loading || !email}
                  className="w-full bg-gray-900 text-white font-medium py-3 px-6 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Unlock Full Report
                </button>

                <p className="mt-4 text-xs text-gray-500">
                  30-day money-back guarantee
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Full Analysis Report */}
        {fullAnalysis && (
          <div className="space-y-8">
            {/* Risk Score */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Risk Score</p>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-5xl font-semibold ${getRiskColor(fullAnalysis.riskScore)}`}>
                      {fullAnalysis.riskScore}
                    </span>
                    <span className="text-xl text-gray-400">/10</span>
                  </div>
                </div>
                <span className={`text-sm font-medium px-3 py-1 rounded ${
                  fullAnalysis.recommendation === 'WALK AWAY'
                    ? 'bg-red-100 text-red-700'
                    : fullAnalysis.recommendation === 'NEGOTIATE'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {fullAnalysis.recommendation}
                </span>
              </div>
              <p className="text-gray-600">{fullAnalysis.executiveSummary}</p>
            </div>

            {/* Contract Summary */}
            {fullAnalysis.contractSummary && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <span className="font-medium text-gray-900">Contract Details</span>
                </div>
                <div className="p-6 grid grid-cols-2 gap-6">
                  {fullAnalysis.contractSummary.projectName && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Project</p>
                      <p className="font-medium text-gray-900">{fullAnalysis.contractSummary.projectName}</p>
                    </div>
                  )}
                  {fullAnalysis.contractSummary.contractValue && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Value</p>
                      <p className="font-medium text-gray-900">{fullAnalysis.contractSummary.contractValue}</p>
                    </div>
                  )}
                  {fullAnalysis.contractSummary.paymentTerms && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Payment Terms</p>
                      <p className="font-medium text-gray-900">{fullAnalysis.contractSummary.paymentTerms}</p>
                    </div>
                  )}
                  {fullAnalysis.contractSummary.retainage && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Retainage</p>
                      <p className="font-medium text-gray-900">{fullAnalysis.contractSummary.retainage}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Issues */}
            {[
              { issues: fullAnalysis.criticalIssues, label: 'Critical', color: 'red' },
              { issues: fullAnalysis.warningIssues, label: 'Warning', color: 'amber' },
              { issues: fullAnalysis.cautionIssues, label: 'Caution', color: 'blue' },
            ].filter(g => g.issues?.length > 0).map((group) => (
              <div key={group.label} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className={`px-6 py-4 border-b border-gray-200 flex items-center gap-2 ${
                  group.color === 'red' ? 'bg-red-50' :
                  group.color === 'amber' ? 'bg-amber-50' : 'bg-blue-50'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    group.color === 'red' ? 'bg-red-600' :
                    group.color === 'amber' ? 'bg-amber-500' : 'bg-blue-500'
                  }`}></div>
                  <span className="font-medium text-gray-900">
                    {group.label} Issues ({group.issues.length})
                  </span>
                </div>
                <div className="divide-y divide-gray-200">
                  {group.issues.map((issue, index) => (
                    <IssueCard key={index} issue={issue} />
                  ))}
                </div>
              </div>
            ))}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Analysis by SubShield
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Print / Save PDF
                </button>
                <button
                  onClick={reset}
                  className="text-sm bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-800"
                >
                  Analyze Another
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <p className="text-xs text-gray-500 text-center">
            SubShield provides AI-assisted contract analysis for informational purposes only. This is not legal advice.
            Consult a licensed construction attorney before making decisions about your contracts.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <AnalyzePageContent />
    </Suspense>
  );
}

function IssueCard({ issue }: { issue: Issue }) {
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <span className="font-medium text-gray-900">{issue.title}</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && (
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Contract Language</p>
            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded border border-gray-200 italic">
              &ldquo;{issue.clauseText}&rdquo;
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">What This Means</p>
            <p className="text-sm text-gray-700">{issue.explanation}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Suggested Response</p>
            <div className="relative">
              <p className="text-sm text-gray-700 bg-green-50 p-3 pr-10 rounded border border-green-200">
                {issue.negotiationScript}
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(issue.negotiationScript);
                }}
                className="absolute top-2 right-2 p-1.5 text-green-600 hover:bg-green-100 rounded"
                title="Copy"
              >
                {copied ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
