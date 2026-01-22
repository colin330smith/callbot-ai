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
      {/* Nav */}
      <nav className="border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="font-semibold text-gray-900">
            SubShield
          </Link>
          {(previewAnalysis || fullAnalysis) && (
            <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-900">
              Start over
            </button>
          )}
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Upload */}
        {!previewAnalysis && !fullAnalysis && !loading && !parsing && (
          <>
            <h1 className="text-2xl font-medium text-gray-900 mb-2">
              Upload a contract
            </h1>
            <p className="text-gray-500 mb-8">
              We'll analyze it and show you what to watch out for.
            </p>

            <div
              {...getRootProps()}
              className={`border border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-gray-400 bg-gray-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <p className="text-gray-900 mb-1">Drop your file here</p>
              <p className="text-sm text-gray-500">PDF, DOCX, or TXT</p>
            </div>

            <p className="mt-6 text-sm text-gray-400 text-center">
              or{' '}
              <button onClick={loadSampleContract} className="text-gray-600 hover:text-gray-900 underline">
                try a sample contract
              </button>
            </p>
          </>
        )}

        {/* Loading */}
        {(loading || parsing) && (
          <div className="py-16 text-center">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-900 mb-1">
              {parsing ? 'Reading document...' : 'Analyzing...'}
            </p>
            <p className="text-sm text-gray-500">
              {parsing ? 'Extracting text' : 'Usually takes 30-60 seconds'}
            </p>
            {loading && (
              <div className="max-w-xs mx-auto mt-6">
                <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gray-900 transition-all duration-300"
                    style={{ width: `${analysisProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Preview Results */}
        {previewAnalysis && showPaywall && (
          <div className="space-y-8">
            {isDemo && (
              <p className="text-sm text-gray-500">
                Demo: $485,000 electrical subcontract.{' '}
                <button onClick={reset} className="underline hover:text-gray-900">
                  Upload yours
                </button>
              </p>
            )}

            {/* Score */}
            <div>
              <p className="text-sm text-gray-400 mb-1">Risk score</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-medium ${getRiskColor(previewAnalysis.riskScore)}`}>
                  {previewAnalysis.riskScore}
                </span>
                <span className="text-gray-400">/10</span>
                <span className={`ml-2 text-sm font-medium px-2 py-0.5 rounded ${
                  previewAnalysis.recommendation === 'WALK AWAY'
                    ? 'bg-red-50 text-red-600'
                    : previewAnalysis.recommendation === 'NEGOTIATE'
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-green-50 text-green-600'
                }`}>
                  {previewAnalysis.recommendation}
                </span>
              </div>
              <p className="mt-3 text-gray-600">{previewAnalysis.executiveSummary}</p>
            </div>

            {/* Issues */}
            <div>
              <p className="text-sm text-gray-400 mb-3">
                {previewAnalysis.totalIssuesFound} issues found
              </p>
              <div className="space-y-3">
                {previewAnalysis.topThreeIssues.map((issue, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-900">{issue.title}</p>
                        <p className="text-sm text-gray-500 mt-1">{issue.preview}</p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded flex-shrink-0 ${
                        issue.severity === 'CRITICAL'
                          ? 'bg-red-50 text-red-600'
                          : issue.severity === 'WARNING'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-blue-50 text-blue-600'
                      }`}>
                        {issue.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {previewAnalysis.totalIssuesFound > 3 && (
                <p className="mt-3 text-sm text-gray-400">
                  +{previewAnalysis.totalIssuesFound - 3} more in full report
                </p>
              )}
            </div>

            {/* Paywall */}
            <div className="border-t border-gray-100 pt-8">
              <p className="font-medium text-gray-900 mb-1">Get the full report</p>
              <p className="text-sm text-gray-500 mb-4">
                Detailed analysis of all {previewAnalysis.totalIssuesFound} issues with suggested redlines.
              </p>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-2xl font-medium text-gray-900">$147</span>
              </div>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={handleEmailBlur}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-3 focus:outline-none focus:border-gray-400"
              />
              <button
                onClick={handlePayment}
                disabled={loading || !email}
                className="w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
              >
                Unlock report
              </button>
              <p className="mt-3 text-xs text-gray-400 text-center">
                30-day refund if not useful
              </p>
            </div>
          </div>
        )}

        {/* Full Report */}
        {fullAnalysis && (
          <div className="space-y-8">
            {/* Score */}
            <div>
              <p className="text-sm text-gray-400 mb-1">Risk score</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-medium ${getRiskColor(fullAnalysis.riskScore)}`}>
                  {fullAnalysis.riskScore}
                </span>
                <span className="text-gray-400">/10</span>
                <span className={`ml-2 text-sm font-medium px-2 py-0.5 rounded ${
                  fullAnalysis.recommendation === 'WALK AWAY'
                    ? 'bg-red-50 text-red-600'
                    : fullAnalysis.recommendation === 'NEGOTIATE'
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-green-50 text-green-600'
                }`}>
                  {fullAnalysis.recommendation}
                </span>
              </div>
              <p className="mt-3 text-gray-600">{fullAnalysis.executiveSummary}</p>
            </div>

            {/* Contract Details */}
            {fullAnalysis.contractSummary && (
              <div>
                <p className="text-sm text-gray-400 mb-3">Contract details</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {fullAnalysis.contractSummary.projectName && (
                    <div>
                      <p className="text-gray-400">Project</p>
                      <p className="text-gray-900">{fullAnalysis.contractSummary.projectName}</p>
                    </div>
                  )}
                  {fullAnalysis.contractSummary.contractValue && (
                    <div>
                      <p className="text-gray-400">Value</p>
                      <p className="text-gray-900">{fullAnalysis.contractSummary.contractValue}</p>
                    </div>
                  )}
                  {fullAnalysis.contractSummary.paymentTerms && (
                    <div>
                      <p className="text-gray-400">Payment</p>
                      <p className="text-gray-900">{fullAnalysis.contractSummary.paymentTerms}</p>
                    </div>
                  )}
                  {fullAnalysis.contractSummary.retainage && (
                    <div>
                      <p className="text-gray-400">Retainage</p>
                      <p className="text-gray-900">{fullAnalysis.contractSummary.retainage}</p>
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
              <div key={group.label}>
                <p className={`text-sm font-medium mb-3 ${
                  group.color === 'red' ? 'text-red-600' :
                  group.color === 'amber' ? 'text-amber-600' : 'text-blue-600'
                }`}>
                  {group.label} ({group.issues.length})
                </p>
                <div className="space-y-4">
                  {group.issues.map((issue, index) => (
                    <IssueCard key={index} issue={issue} />
                  ))}
                </div>
              </div>
            ))}

            {/* Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-100">
              <button
                onClick={() => window.print()}
                className="text-sm text-gray-500 hover:text-gray-900"
              >
                Print / Save PDF
              </button>
              <button
                onClick={reset}
                className="text-sm text-gray-900 hover:text-gray-600"
              >
                Analyze another →
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 mt-16">
        <div className="max-w-2xl mx-auto px-6 py-6">
          <p className="text-xs text-gray-400 text-center">
            Not legal advice. For informational purposes only.
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
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
      </div>
    }>
      <AnalyzePageContent />
    </Suspense>
  );
}

function IssueCard({ issue }: { issue: Issue }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <p className="font-medium text-gray-900 mb-3">{issue.title}</p>

      <div className="space-y-3 text-sm">
        <div>
          <p className="text-gray-400 mb-1">Contract says</p>
          <p className="text-gray-600 italic">"{issue.clauseText}"</p>
        </div>

        <div>
          <p className="text-gray-400 mb-1">What it means</p>
          <p className="text-gray-600">{issue.explanation}</p>
        </div>

        <div>
          <p className="text-gray-400 mb-1">Suggested revision</p>
          <div className="relative bg-gray-50 p-3 rounded border border-gray-100">
            <p className="text-gray-700 pr-8 font-mono text-xs leading-relaxed">
              {issue.negotiationScript}
            </p>
            <button
              onClick={() => copyToClipboard(issue.negotiationScript)}
              className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600"
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
    </div>
  );
}
