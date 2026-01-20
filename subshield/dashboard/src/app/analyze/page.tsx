'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useDropzone } from 'react-dropzone';
import { useSearchParams } from 'next/navigation';
import { trackAnalytics, usePageTracking } from '@/components/Analytics';

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
  usePageTracking(); // Track page views

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

  // Check if user just paid
  useEffect(() => {
    const paid = searchParams.get('paid');
    const sessionId = searchParams.get('session_id');

    if (paid === 'true' && sessionId) {
      setIsPaid(true);
      // Track successful purchase conversion
      trackAnalytics.purchaseCompleted();

      // Restore contract text from localStorage
      const savedText = localStorage.getItem('pendingContractText');
      const savedPreview = localStorage.getItem('pendingPreviewAnalysis');

      if (savedText) {
        setContractText(savedText);
        if (savedPreview) {
          setPreviewAnalysis(JSON.parse(savedPreview));
        }
        // Auto-run full analysis after payment
        runFullAnalysis(savedText);
        // Clean up
        localStorage.removeItem('pendingContractText');
        localStorage.removeItem('pendingPreviewAnalysis');
      }
    }
  }, [searchParams]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    if (!uploadedFile) return;

    // Track contract upload
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

      // Automatically start preview analysis
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
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const runPreviewAnalysis = async (text: string) => {
    setLoading(true);
    setError('');
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

      setPreviewAnalysis(result.analysis);
      setShowPaywall(true);
      trackAnalytics.previewCompleted(result.analysis.riskScore, result.analysis.recommendation);

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

      setFullAnalysis(result.analysis);
      setPreviewAnalysis(null);
      trackAnalytics.fullReportViewed();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!email) {
      setError('Please enter your email to continue');
      return;
    }

    // Track unlock intent (conversion funnel)
    trackAnalytics.unlockClicked();

    // Save state to localStorage before redirect
    localStorage.setItem('pendingContractText', contractText);
    localStorage.setItem('pendingPreviewAnalysis', JSON.stringify(previewAnalysis));

    try {
      // Track checkout started
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

      // Redirect to Stripe
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 8) return 'text-red-600';
    if (score >= 5) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getRiskBg = (score: number) => {
    if (score >= 8) return 'bg-red-100 border-red-300';
    if (score >= 5) return 'bg-yellow-100 border-yellow-300';
    return 'bg-green-100 border-green-300';
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'CAUTION':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const reset = () => {
    setFile(null);
    setContractText('');
    setPreviewAnalysis(null);
    setFullAnalysis(null);
    setError('');
    setShowPaywall(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-bold text-xl">SubShield</span>
          </div>
          {(previewAnalysis || fullAnalysis) && (
            <button
              onClick={reset}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Analyze Another Contract
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Upload Section */}
        {!previewAnalysis && !fullAnalysis && (
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Instant Contract Analysis
            </h1>
            <p className="text-gray-600">
              Upload your subcontract and get a detailed risk analysis in 60 seconds
            </p>
          </div>
        )}

        {!previewAnalysis && !fullAnalysis && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400 bg-white'
            }`}
          >
            <input {...getInputProps()} />
            {parsing ? (
              <div>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Reading your contract...</p>
              </div>
            ) : loading ? (
              <div>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Analyzing contract for risks...</p>
              </div>
            ) : (
              <>
                <svg
                  className="w-12 h-12 text-gray-400 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="text-lg font-medium text-gray-700 mb-1">
                  {isDragActive ? 'Drop your contract here' : 'Drag & drop your contract'}
                </p>
                <p className="text-gray-500 mb-4">or click to browse</p>
                <p className="text-sm text-gray-400">
                  Supports PDF, DOCX, DOC, TXT (max 10MB)
                </p>
              </>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Preview Analysis with Paywall */}
        {previewAnalysis && showPaywall && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Risk Score Header */}
            <div className={`p-6 ${getRiskBg(previewAnalysis.riskScore)} border-b`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                    Risk Score
                  </p>
                  <p className={`text-5xl font-bold ${getRiskColor(previewAnalysis.riskScore)}`}>
                    {previewAnalysis.riskScore}/10
                  </p>
                </div>
                <div
                  className={`px-4 py-2 rounded-full font-bold ${
                    previewAnalysis.recommendation === 'WALK AWAY'
                      ? 'bg-red-600 text-white'
                      : previewAnalysis.recommendation === 'NEGOTIATE'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-green-600 text-white'
                  }`}
                >
                  {previewAnalysis.recommendation}
                </div>
              </div>
              <p className="mt-3 text-gray-700">{previewAnalysis.executiveSummary}</p>
            </div>

            {/* Preview Issues */}
            <div className="p-6">
              <h3 className="font-bold text-lg mb-4">
                Top Issues Found ({previewAnalysis.totalIssuesFound} total)
              </h3>
              <div className="space-y-3">
                {previewAnalysis.topThreeIssues.map((issue, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${getSeverityStyles(issue.severity)}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold">{issue.title}</span>
                      <span className="text-xs font-bold uppercase">{issue.severity}</span>
                    </div>
                    <p className="text-sm opacity-80">{issue.preview}</p>
                  </div>
                ))}
              </div>

              {/* Paywall */}
              <div className="mt-8 p-6 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl text-white">
                <h3 className="text-xl font-bold mb-2">
                  Get Your Full Analysis Report
                </h3>
                <p className="text-blue-100 mb-4">
                  Unlock the complete analysis with exact clause quotes, plain-English explanations,
                  and word-for-word negotiation scripts for all {previewAnalysis.totalIssuesFound} issues found.
                </p>
                <ul className="text-sm text-blue-100 mb-6 space-y-1">
                  <li>Exact contract language for every risky clause</li>
                  <li>Plain-English explanations of what each clause means</li>
                  <li>Copy-paste negotiation scripts to protect yourself</li>
                  <li>State-specific legal considerations</li>
                  <li>Email copy for your records</li>
                </ul>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg mb-3 text-gray-900 placeholder-gray-500"
                />
                <button
                  onClick={handlePayment}
                  disabled={loading || !email}
                  className="w-full bg-white text-blue-600 font-bold py-3 px-6 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
                >
                  Get Full Report - $47
                </button>
                <p className="text-xs text-blue-200 mt-3 text-center">
                  One-time payment. Instant delivery. 100% money-back guarantee.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Full Analysis Report */}
        {fullAnalysis && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className={`p-6 ${getRiskBg(fullAnalysis.riskScore)} border-b`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                    Risk Score
                  </p>
                  <p className={`text-5xl font-bold ${getRiskColor(fullAnalysis.riskScore)}`}>
                    {fullAnalysis.riskScore}/10
                  </p>
                </div>
                <div
                  className={`px-4 py-2 rounded-full font-bold ${
                    fullAnalysis.recommendation === 'WALK AWAY'
                      ? 'bg-red-600 text-white'
                      : fullAnalysis.recommendation === 'NEGOTIATE'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-green-600 text-white'
                  }`}
                >
                  {fullAnalysis.recommendation}
                </div>
              </div>
              <p className="text-gray-700 text-lg">{fullAnalysis.executiveSummary}</p>
            </div>

            {/* Contract Summary */}
            {fullAnalysis.contractSummary && (
              <div className="p-6 bg-gray-50 border-b">
                <h3 className="font-bold text-lg mb-3">Contract Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {fullAnalysis.contractSummary.projectName && (
                    <div>
                      <p className="text-gray-500">Project</p>
                      <p className="font-medium">{fullAnalysis.contractSummary.projectName}</p>
                    </div>
                  )}
                  {fullAnalysis.contractSummary.contractValue && (
                    <div>
                      <p className="text-gray-500">Contract Value</p>
                      <p className="font-medium">{fullAnalysis.contractSummary.contractValue}</p>
                    </div>
                  )}
                  {fullAnalysis.contractSummary.paymentTerms && (
                    <div>
                      <p className="text-gray-500">Payment Terms</p>
                      <p className="font-medium">{fullAnalysis.contractSummary.paymentTerms}</p>
                    </div>
                  )}
                  {fullAnalysis.contractSummary.retainage && (
                    <div>
                      <p className="text-gray-500">Retainage</p>
                      <p className="font-medium">{fullAnalysis.contractSummary.retainage}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Issues */}
            <div className="p-6">
              {/* Critical Issues */}
              {fullAnalysis.criticalIssues?.length > 0 && (
                <div className="mb-8">
                  <h3 className="font-bold text-lg mb-4 text-red-700 flex items-center">
                    <span className="w-3 h-3 bg-red-600 rounded-full mr-2"></span>
                    Critical Issues ({fullAnalysis.criticalIssues.length})
                  </h3>
                  <div className="space-y-4">
                    {fullAnalysis.criticalIssues.map((issue, index) => (
                      <IssueCard key={index} issue={issue} severity="CRITICAL" />
                    ))}
                  </div>
                </div>
              )}

              {/* Warning Issues */}
              {fullAnalysis.warningIssues?.length > 0 && (
                <div className="mb-8">
                  <h3 className="font-bold text-lg mb-4 text-yellow-700 flex items-center">
                    <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                    Warning Issues ({fullAnalysis.warningIssues.length})
                  </h3>
                  <div className="space-y-4">
                    {fullAnalysis.warningIssues.map((issue, index) => (
                      <IssueCard key={index} issue={issue} severity="WARNING" />
                    ))}
                  </div>
                </div>
              )}

              {/* Caution Issues */}
              {fullAnalysis.cautionIssues?.length > 0 && (
                <div className="mb-8">
                  <h3 className="font-bold text-lg mb-4 text-blue-700 flex items-center">
                    <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                    Caution Issues ({fullAnalysis.cautionIssues.length})
                  </h3>
                  <div className="space-y-4">
                    {fullAnalysis.cautionIssues.map((issue, index) => (
                      <IssueCard key={index} issue={issue} severity="CAUTION" />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-gray-50 border-t">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Analysis generated by SubShield
                </p>
                <button
                  onClick={() => window.print()}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  Print / Save PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <AnalyzePageContent />
    </Suspense>
  );
}

function IssueCard({ issue, severity }: { issue: Issue; severity: string }) {
  const [expanded, setExpanded] = useState(true);

  const borderColor =
    severity === 'CRITICAL'
      ? 'border-l-red-600'
      : severity === 'WARNING'
      ? 'border-l-yellow-500'
      : 'border-l-blue-500';

  return (
    <div className={`border rounded-lg overflow-hidden border-l-4 ${borderColor}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 text-left bg-white hover:bg-gray-50 flex items-center justify-between"
      >
        <span className="font-semibold">{issue.title}</span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && (
        <div className="p-4 bg-gray-50 border-t space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Contract Language</p>
            <p className="text-sm bg-white p-3 rounded border italic">"{issue.clauseText}"</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">What This Means</p>
            <p className="text-sm">{issue.explanation}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
              Suggested Negotiation Language
            </p>
            <p className="text-sm bg-green-50 p-3 rounded border border-green-200 text-green-800">
              {issue.negotiationScript}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
