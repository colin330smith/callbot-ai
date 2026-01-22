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
  const [showEmailCapture, setShowEmailCapture] = useState(false);

  // Progress animation during analysis
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

  // Check if user just paid
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

    // Basic email validation
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

  // Capture lead when user enters email but doesn't proceed to payment
  const handleEmailBlur = () => {
    if (email && !leadCaptured && previewAnalysis) {
      captureLead(email, previewAnalysis.riskScore, 'email_input');
    }
  };

  const handleEmailCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      await captureLead(email, previewAnalysis?.riskScore);
      setShowEmailCapture(false);
    }
  };

  const handlePayment = async () => {
    if (!email) {
      setError('Please enter your email to continue');
      return;
    }

    // Capture lead if not already captured
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
    if (score >= 8) return 'text-red-600';
    if (score >= 5) return 'text-amber-600';
    return 'text-green-600';
  };

  const getRiskBg = (score: number) => {
    if (score >= 8) return 'bg-gradient-to-br from-red-50 to-red-100 border-red-200';
    if (score >= 5) return 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200';
    return 'bg-gradient-to-br from-green-50 to-green-100 border-green-200';
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'WARNING':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'CAUTION':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200';
    }
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="font-bold text-xl text-gray-900">SubShield</span>
          </Link>

          {(previewAnalysis || fullAnalysis) && (
            <button
              onClick={reset}
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              New Analysis
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Upload Section */}
        {!previewAnalysis && !fullAnalysis && !loading && !parsing && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Analyze Your Contract
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
                Upload your subcontract and discover potential risks before you sign.
                Get detailed analysis with specific negotiation recommendations.
              </p>
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium border border-green-200">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Saves $350+ vs. lawyer review
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 mb-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>256-bit Encryption</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Files Deleted After Analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Results in 60 Seconds</span>
              </div>
            </div>
          </>
        )}

        {/* Loading/Progress State */}
        {(loading || parsing) && (
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="relative mb-6">
                <div className="w-20 h-20 mx-auto">
                  <svg className="animate-spin w-full h-full text-blue-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {parsing ? 'Reading Your Contract...' : 'Analyzing Contract...'}
              </h2>
              <p className="text-gray-600 mb-6">
                {parsing
                  ? 'Extracting text from your document'
                  : 'Reviewing clauses and identifying potential risks'
                }
              </p>

              {/* Progress Bar */}
              {loading && (
                <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${analysisProgress}%` }}
                  ></div>
                </div>
              )}

              {/* Analysis Steps */}
              {loading && (
                <div className="text-left space-y-2">
                  {[
                    { label: 'Scanning payment terms', done: analysisProgress > 20 },
                    { label: 'Reviewing indemnification clauses', done: analysisProgress > 40 },
                    { label: 'Analyzing liability provisions', done: analysisProgress > 60 },
                    { label: 'Checking termination rights', done: analysisProgress > 80 },
                    { label: 'Preparing recommendations', done: analysisProgress >= 95 },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      {step.done ? (
                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                      )}
                      <span className={step.done ? 'text-green-700' : 'text-gray-500'}>{step.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upload Zone */}
        {!previewAnalysis && !fullAnalysis && !loading && !parsing && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-8 md:p-16 text-center cursor-pointer transition-all duration-200 ${
              isDragActive
                ? 'border-blue-500 bg-blue-50 scale-[1.02]'
                : 'border-gray-300 hover:border-blue-400 bg-white hover:bg-gray-50'
            } shadow-lg`}
          >
            <input {...getInputProps()} />
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-xl font-semibold text-gray-900 mb-2">
              {isDragActive ? 'Drop your contract here' : 'Drag & drop your contract'}
            </p>
            <p className="text-gray-500 mb-6">or click to browse your files</p>
            <div className="inline-flex items-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
                PDF
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
                DOCX
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
                DOC
              </span>
              <span className="text-gray-300">|</span>
              <span>Max 10MB</span>
            </div>
          </div>
        )}

        {/* Try Sample Contract */}
        {!previewAnalysis && !fullAnalysis && !loading && !parsing && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 text-gray-500 mb-3">
              <div className="h-px w-12 bg-gray-300"></div>
              <span className="text-sm">or</span>
              <div className="h-px w-12 bg-gray-300"></div>
            </div>
            <div>
              <button
                onClick={loadSampleContract}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors border border-gray-200"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Try Sample Contract
              </button>
              <p className="mt-2 text-xs text-gray-400">
                See how it works with a real construction subcontract
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Preview Analysis with Paywall */}
        {previewAnalysis && showPaywall && (
          <div className="space-y-6">
            {/* Demo Indicator */}
            {isDemo && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-medium text-blue-800">Demo Contract Analysis</p>
                  <p className="text-sm text-blue-700">
                    This is a sample $485,000 electrical subcontract with typical risky clauses.
                    <button onClick={reset} className="underline hover:no-underline ml-1">
                      Upload your own contract
                    </button> for a personalized analysis.
                  </p>
                </div>
              </div>
            )}

            {/* Risk Score Card */}
            <div className={`rounded-2xl border-2 overflow-hidden ${getRiskBg(previewAnalysis.riskScore)}`}>
              <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-1">
                      Contract Risk Score
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-6xl font-bold ${getRiskColor(previewAnalysis.riskScore)}`}>
                        {previewAnalysis.riskScore}
                      </span>
                      <span className="text-2xl text-gray-400">/10</span>
                    </div>
                  </div>
                  <div
                    className={`inline-flex items-center px-5 py-2.5 rounded-full text-lg font-bold ${
                      previewAnalysis.recommendation === 'WALK AWAY'
                        ? 'bg-red-600 text-white'
                        : previewAnalysis.recommendation === 'NEGOTIATE'
                        ? 'bg-amber-500 text-white'
                        : 'bg-green-600 text-white'
                    }`}
                  >
                    {previewAnalysis.recommendation === 'WALK AWAY' && (
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                    {previewAnalysis.recommendation === 'NEGOTIATE' && (
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                    {previewAnalysis.recommendation === 'SIGN' && (
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                    {previewAnalysis.recommendation}
                  </div>
                </div>
                <p className="text-lg text-gray-700">{previewAnalysis.executiveSummary}</p>
              </div>
            </div>

            {/* Preview Issues */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xl text-gray-900">
                    Issues Found
                  </h3>
                  <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">
                    {previewAnalysis.totalIssuesFound} Total
                  </span>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {previewAnalysis.topThreeIssues.map((issue, index) => (
                  <div
                    key={index}
                    className={`p-5 rounded-xl border-2 ${getSeverityStyles(issue.severity)}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                            issue.severity === 'CRITICAL' ? 'bg-red-200 text-red-800' :
                            issue.severity === 'WARNING' ? 'bg-amber-200 text-amber-800' :
                            'bg-blue-200 text-blue-800'
                          }`}>
                            {issue.severity}
                          </span>
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-1">{issue.title}</h4>
                        <p className="text-sm text-gray-600">{issue.preview}</p>
                      </div>
                      <svg className="w-5 h-5 text-gray-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                ))}

                {/* Additional Issues Indicator */}
                {previewAnalysis.totalIssuesFound > 3 && (
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white z-10"></div>
                    <div className="blur-sm opacity-50 space-y-4">
                      <div className="p-5 rounded-xl border-2 bg-gray-50 border-gray-200">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                      </div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center z-20">
                      <div className="bg-gray-900/80 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        +{previewAnalysis.totalIssuesFound - 3} additional issues
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sample Report Preview - What You'll Get */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xl text-gray-900">
                    What Your Full Report Includes
                  </h3>
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    Sample Preview
                  </span>
                </div>
              </div>
              <div className="p-6">
                {/* Sample Issue Card (Partially Revealed) */}
                <div className="border rounded-xl overflow-hidden border-l-4 border-l-red-600 bg-white shadow-sm mb-4">
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-red-200 text-red-800">
                        CRITICAL
                      </span>
                      <span className="font-semibold text-gray-900">Pay-If-Paid Clause</span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                          Contract Language
                        </p>
                        <p className="text-sm bg-gray-50 p-4 rounded-lg border border-gray-200 italic text-gray-700">
                          &ldquo;Payment to Subcontractor is expressly conditioned upon receipt of payment by Contractor from Owner...&rdquo;
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                          What This Means
                        </p>
                        <p className="text-sm text-gray-700">
                          This shifts the risk of owner non-payment entirely to you. If the owner goes bankrupt or disputes payment, you may never get paid for your completed work.
                        </p>
                      </div>

                      <div className="relative">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                          Negotiation Script
                        </p>
                        <div className="relative">
                          <div className="text-sm bg-green-50 p-4 rounded-lg border border-green-200 text-green-800 blur-sm select-none">
                            Replace pay-if-paid with pay-when-paid language: &quot;Payment shall be due within 30 days of invoice submission, regardless of Owner payment status. Contractor may not condition payment...
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-lg">
                            <div className="bg-gray-900/80 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                              </svg>
                              Unlock Full Report
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* More Issues Teaser */}
                <div className="flex items-center justify-center gap-6 py-4 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                    <span>{previewAnalysis.topThreeIssues.filter(i => i.severity === 'CRITICAL').length || 1}+ Critical Issues</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <span>Warning Issues</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Caution Items</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Unlock Full Report CTA */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-white overflow-hidden relative">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
                  </pattern>
                  <rect width="100" height="100" fill="url(#grid)" />
                </svg>
              </div>

              <div className="relative">
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex-1">
                    <h3 className="text-2xl md:text-3xl font-bold mb-3">
                      Know Exactly What You&apos;re<br />Signing Before It&apos;s Too Late
                    </h3>
                    <p className="text-slate-300 mb-6">
                      Your contract has {previewAnalysis.totalIssuesFound} clauses that could cost you thousands. Get word-for-word scripts to negotiate better terms—or know when to walk away.
                    </p>

                    <ul className="space-y-3 mb-6">
                      {[
                        'Exact contract language for every risky clause',
                        'Plain-English explanations of each risk',
                        'Copy-paste negotiation scripts',
                        'PDF export for your records',
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm">
                          <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-slate-200">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="md:w-96">
                    <div className="bg-white rounded-xl p-6 text-gray-900">
                      {/* Price comparison */}
                      <div className="text-center mb-4">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <span className="text-lg text-gray-400 line-through">$350+</span>
                          <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded">Save 58%</span>
                        </div>
                        <span className="text-4xl font-bold">$147</span>
                        <p className="text-sm text-gray-500 mt-1">One-time payment &bull; Instant access</p>
                      </div>

                      <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={handleEmailBlur}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={handlePayment}
                        disabled={loading || !email}
                        className="w-full bg-blue-600 text-white font-bold py-4 px-6 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 group"
                      >
                        <span>Protect My Business</span>
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </button>

                      {/* Money-back guarantee badge */}
                      <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-green-800">30-Day Money-Back Guarantee</p>
                            <p className="text-xs text-green-700">Not satisfied? Full refund, no questions asked.</p>
                          </div>
                        </div>
                      </div>

                      {/* Trust badges */}
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                            256-bit SSL
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-purple-500" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
                            </svg>
                            Stripe Secure
                          </span>
                        </div>
                      </div>

                      {/* Comparison note */}
                      <p className="text-center text-xs text-gray-500 mt-3">
                        Construction attorneys charge $300-500+ for the same review
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Founder Note / Credibility Section */}
            <div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-2xl p-6 md:p-8 border border-blue-100">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    CS
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-bold text-gray-900">Colin Smith</h4>
                    <span className="text-sm text-gray-500">Founder, SubShield</span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed mb-4">
                    &ldquo;I built SubShield because I&apos;ve seen too many subcontractors sign contracts that put their entire business at risk. Most don&apos;t have $500/hour to pay a construction attorney to review every contract. This tool uses the same analysis framework that attorneys use, but delivers it in seconds at a fraction of the cost.&rdquo;
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                        <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                      </svg>
                      Built for construction professionals
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      30-day money-back guarantee
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                      Personal support: colin@trysubshield.com
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full Analysis Report */}
        {fullAnalysis && (
          <div className="space-y-6">
            {/* Success Banner */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-semibold text-green-800">Full Analysis Complete</p>
                <p className="text-sm text-green-700">Your complete contract risk report is ready below.</p>
              </div>
            </div>

            {/* Risk Score */}
            <div className={`rounded-2xl border-2 overflow-hidden ${getRiskBg(fullAnalysis.riskScore)}`}>
              <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-1">
                      Contract Risk Score
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-6xl font-bold ${getRiskColor(fullAnalysis.riskScore)}`}>
                        {fullAnalysis.riskScore}
                      </span>
                      <span className="text-2xl text-gray-400">/10</span>
                    </div>
                  </div>
                  <div
                    className={`inline-flex items-center px-5 py-2.5 rounded-full text-lg font-bold ${
                      fullAnalysis.recommendation === 'WALK AWAY'
                        ? 'bg-red-600 text-white'
                        : fullAnalysis.recommendation === 'NEGOTIATE'
                        ? 'bg-amber-500 text-white'
                        : 'bg-green-600 text-white'
                    }`}
                  >
                    {fullAnalysis.recommendation}
                  </div>
                </div>
                <p className="text-lg text-gray-700">{fullAnalysis.executiveSummary}</p>
              </div>
            </div>

            {/* Contract Summary */}
            {fullAnalysis.contractSummary && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="font-bold text-xl text-gray-900">Contract Summary</h3>
                </div>
                <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                  {fullAnalysis.contractSummary.projectName && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Project</p>
                      <p className="font-semibold text-gray-900">{fullAnalysis.contractSummary.projectName}</p>
                    </div>
                  )}
                  {fullAnalysis.contractSummary.contractValue && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Contract Value</p>
                      <p className="font-semibold text-gray-900">{fullAnalysis.contractSummary.contractValue}</p>
                    </div>
                  )}
                  {fullAnalysis.contractSummary.paymentTerms && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Payment Terms</p>
                      <p className="font-semibold text-gray-900">{fullAnalysis.contractSummary.paymentTerms}</p>
                    </div>
                  )}
                  {fullAnalysis.contractSummary.retainage && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Retainage</p>
                      <p className="font-semibold text-gray-900">{fullAnalysis.contractSummary.retainage}</p>
                    </div>
                  )}
                  {fullAnalysis.contractSummary.warrantyPeriod && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Warranty Period</p>
                      <p className="font-semibold text-gray-900">{fullAnalysis.contractSummary.warrantyPeriod}</p>
                    </div>
                  )}
                  {fullAnalysis.contractSummary.liquidatedDamages && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Liquidated Damages</p>
                      <p className="font-semibold text-gray-900">{fullAnalysis.contractSummary.liquidatedDamages}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Issues */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="font-bold text-xl text-gray-900">All Issues Found</h3>
              </div>
              <div className="p-6 space-y-6">
                {/* Critical Issues */}
                {fullAnalysis.criticalIssues?.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                      <h4 className="font-bold text-lg text-red-700">
                        Critical Issues ({fullAnalysis.criticalIssues.length})
                      </h4>
                    </div>
                    <div className="space-y-4">
                      {fullAnalysis.criticalIssues.map((issue, index) => (
                        <IssueCard key={index} issue={issue} severity="CRITICAL" />
                      ))}
                    </div>
                  </div>
                )}

                {/* Warning Issues */}
                {fullAnalysis.warningIssues?.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                      <h4 className="font-bold text-lg text-amber-700">
                        Warning Issues ({fullAnalysis.warningIssues.length})
                      </h4>
                    </div>
                    <div className="space-y-4">
                      {fullAnalysis.warningIssues.map((issue, index) => (
                        <IssueCard key={index} issue={issue} severity="WARNING" />
                      ))}
                    </div>
                  </div>
                )}

                {/* Caution Issues */}
                {fullAnalysis.cautionIssues?.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <h4 className="font-bold text-lg text-blue-700">
                        Caution Issues ({fullAnalysis.cautionIssues.length})
                      </h4>
                    </div>
                    <div className="space-y-4">
                      {fullAnalysis.cautionIssues.map((issue, index) => (
                        <IssueCard key={index} issue={issue} severity="CAUTION" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Analysis by SubShield</p>
                    <p className="text-sm text-gray-500">AI-Powered Contract Risk Detection</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print / PDF
                  </button>
                  <button
                    onClick={reset}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Analyze Another
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Legal Disclaimer Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-16">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="text-center space-y-4">
            <p className="text-sm text-gray-500 max-w-3xl mx-auto">
              <strong className="text-gray-700">Important Disclaimer:</strong> SubShield provides AI-assisted contract analysis for informational purposes only.
              This tool does not constitute legal advice and should not be used as a substitute for consultation with a qualified construction attorney.
              The analysis provided may not identify all risks, and contract terms should be reviewed by a licensed attorney before signing.
              SubShield is not responsible for any decisions made based on the analysis provided.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-400">
              <span>© {new Date().getFullYear()} SubShield</span>
              <a href="mailto:support@trysubshield.com" className="hover:text-gray-600">Contact</a>
              <Link href="/privacy" className="hover:text-gray-600">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-gray-600">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4">
            <svg className="animate-spin w-full h-full text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    }>
      <AnalyzePageContent />
    </Suspense>
  );
}

function IssueCard({ issue, severity }: { issue: Issue; severity: string }) {
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const borderColor =
    severity === 'CRITICAL'
      ? 'border-l-red-600'
      : severity === 'WARNING'
      ? 'border-l-amber-500'
      : 'border-l-blue-500';

  const bgColor =
    severity === 'CRITICAL'
      ? 'hover:bg-red-50/50'
      : severity === 'WARNING'
      ? 'hover:bg-amber-50/50'
      : 'hover:bg-blue-50/50';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`border rounded-xl overflow-hidden border-l-4 ${borderColor} bg-white shadow-sm`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full p-5 text-left flex items-center justify-between transition-colors ${bgColor}`}
      >
        <span className="font-semibold text-gray-900">{issue.title}</span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Contract Language
            </p>
            <p className="text-sm bg-gray-50 p-4 rounded-lg border border-gray-200 italic text-gray-700">
              &ldquo;{issue.clauseText}&rdquo;
            </p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              What This Means
            </p>
            <p className="text-sm text-gray-700">{issue.explanation}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              Negotiation Script
            </p>
            <div className="relative">
              <p className="text-sm bg-green-50 p-4 pr-12 rounded-lg border border-green-200 text-green-800">
                {issue.negotiationScript}
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(issue.negotiationScript);
                }}
                className="absolute top-2 right-2 p-2 bg-white rounded-md border border-green-200 text-green-600 hover:bg-green-100 transition-colors"
                title="Copy to clipboard"
              >
                {copied ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
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
