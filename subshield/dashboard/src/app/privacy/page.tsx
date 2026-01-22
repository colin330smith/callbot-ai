'use client';

import Link from 'next/link';
import { Shield } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-blue-600 rounded-xl p-2">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">SubShield</span>
            </Link>
            <Link
              href="/analyze"
              className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-all"
            >
              Analyze Contract
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Overview</h2>
              <p className="text-gray-600 mb-4">
                SubShield (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our contract analysis service at trysubshield.com.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Information We Collect</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Contract Documents</h3>
              <p className="text-gray-600 mb-4">
                When you upload a contract for analysis, we temporarily process the document content to provide our analysis service. <strong>Contract documents are automatically deleted from our servers after analysis is complete.</strong> We do not store, retain, or use your contract content for any purpose other than providing the analysis you requested.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Account Information</h3>
              <p className="text-gray-600 mb-4">
                When you make a purchase, we collect your email address to send your analysis confirmation and receipt. Payment information is processed securely by Stripe and is never stored on our servers.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Usage Data</h3>
              <p className="text-gray-600 mb-4">
                We automatically collect certain information when you visit our website, including your IP address (for rate limiting purposes), browser type, and pages visited. This helps us improve our service and prevent abuse.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">How We Use Your Information</h2>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>To provide contract analysis services you request</li>
                <li>To process payments and send receipts</li>
                <li>To send you important updates about your analysis</li>
                <li>To improve our service and user experience</li>
                <li>To prevent fraud and abuse of our platform</li>
                <li>To comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Security</h2>
              <p className="text-gray-600 mb-4">
                We implement industry-standard security measures to protect your information:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Encryption in Transit:</strong> All data is transmitted using TLS/SSL encryption (HTTPS)</li>
                <li><strong>Secure Payment Processing:</strong> Payments are handled by Stripe, a PCI-DSS compliant payment processor</li>
                <li><strong>Automatic Deletion:</strong> Contract documents are deleted immediately after analysis</li>
                <li><strong>Access Controls:</strong> We limit access to personal information to authorized personnel only</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Third-Party Services</h2>
              <p className="text-gray-600 mb-4">We use the following third-party services:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Stripe:</strong> Payment processing</li>
                <li><strong>Anthropic (Claude AI):</strong> Contract analysis (document content is processed but not stored by Anthropic per their API terms)</li>
                <li><strong>Vercel:</strong> Website hosting</li>
                <li><strong>Resend:</strong> Email delivery</li>
                <li><strong>Google Analytics:</strong> Website analytics (anonymized)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Retention</h2>
              <p className="text-gray-600 mb-4">
                <strong>Contract Documents:</strong> Deleted immediately after analysis is complete. We do not retain copies.
              </p>
              <p className="text-gray-600 mb-4">
                <strong>Transaction Records:</strong> We retain payment records and email addresses for accounting and customer service purposes as required by law, typically for 7 years.
              </p>
              <p className="text-gray-600 mb-4">
                <strong>Analytics Data:</strong> Aggregated, anonymized usage data may be retained indefinitely to improve our service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Rights</h2>
              <p className="text-gray-600 mb-4">Depending on your location, you may have the right to:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Access the personal information we hold about you</li>
                <li>Request correction of inaccurate information</li>
                <li>Request deletion of your personal information</li>
                <li>Object to processing of your information</li>
                <li>Request data portability</li>
              </ul>
              <p className="text-gray-600 mt-4">
                To exercise any of these rights, please contact us at <a href="mailto:support@trysubshield.com" className="text-blue-600 hover:underline">support@trysubshield.com</a>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Cookies</h2>
              <p className="text-gray-600 mb-4">
                We use essential cookies to enable basic website functionality and analytics cookies to understand how visitors use our site. You can disable cookies in your browser settings, though this may affect site functionality.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Children&apos;s Privacy</h2>
              <p className="text-gray-600 mb-4">
                SubShield is not intended for use by children under 18 years of age. We do not knowingly collect personal information from children.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to This Policy</h2>
              <p className="text-gray-600 mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-600 mb-4">
                If you have questions about this Privacy Policy or our data practices, please contact us at:
              </p>
              <p className="text-gray-600">
                <strong>Email:</strong> <a href="mailto:support@trysubshield.com" className="text-blue-600 hover:underline">support@trysubshield.com</a>
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} SubShield. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-4">
            <Link href="/privacy" className="hover:text-gray-900">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-gray-900">Terms of Service</Link>
            <a href="mailto:support@trysubshield.com" className="hover:text-gray-900">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
