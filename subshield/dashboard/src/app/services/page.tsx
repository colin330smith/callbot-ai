'use client';

import { useState } from 'react';
import Link from 'next/link';

const services = [
  {
    id: 'express_review',
    name: 'Express Review',
    price: 497,
    turnaround: '24-48 hours',
    description: 'Fast human expert review for time-sensitive contracts',
    features: [
      'AI analysis + human expert review',
      'Priority red-flag identification',
      'Written risk summary (1-2 pages)',
      'Top 5 negotiation points prioritized',
      '24-48 hour turnaround',
      'Email delivery of report',
    ],
    ideal: 'Quick turnaround on standard subcontracts',
    cta: 'Request Express Review',
  },
  {
    id: 'monthly_retainer',
    name: 'Monthly Retainer',
    price: 997,
    priceLabel: '/month',
    turnaround: 'Ongoing',
    description: 'Dedicated support for active bidding',
    features: [
      'Up to 5 contract reviews per month',
      'Detailed redlining with proposed language',
      'Negotiation strategy calls (30 min each)',
      'Direct access to your assigned expert',
      '48-72 hour turnaround on reviews',
      'Carry forward unused reviews (max 2)',
    ],
    ideal: 'Subcontractors reviewing 3-5 contracts per month',
    cta: 'Start Retainer',
    popular: true,
  },
  {
    id: 'premium_retainer',
    name: 'Premium Retainer',
    price: 2497,
    priceLabel: '/month',
    turnaround: 'Ongoing',
    description: 'White-glove service for high-volume operations',
    features: [
      'Unlimited contract reviews',
      'Full redlining + replacement language',
      'Weekly strategy calls',
      'Live negotiation support via phone',
      'Custom clause library for your business',
      'Priority 24-hour turnaround',
    ],
    ideal: 'Growing firms reviewing 10+ contracts per month',
    cta: 'Start Premium',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: null,
    priceLabel: 'Custom',
    turnaround: 'Dedicated',
    description: 'Fully customized solution for your organization',
    features: [
      'Everything in Premium',
      'Dedicated legal team assigned',
      'API integration with your systems',
      'Custom training for your team',
      'SLA guarantees',
      'Quarterly business reviews',
    ],
    ideal: 'Large subcontractors with complex needs',
    cta: 'Contact Sales',
  },
];

export default function ServicesPage() {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/service-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          serviceType: selectedService,
        }),
      });

      if (response.ok) {
        setSubmitted(true);
      }
    } catch (error) {
      console.error('Error submitting request:', error);
    }

    setSubmitting(false);
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
              <Link href="/pricing" className="text-slate-400 hover:text-white">Pricing</Link>
              <Link href="/login" className="text-slate-400 hover:text-white">Login</Link>
              <Link href="/signup" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                Get Started
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full mb-4">
              <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>
              <span className="text-amber-400 text-sm font-medium">Expert Human Review</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              When AI Isn't Enough
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Our construction law experts provide detailed contract review, redlining, and negotiation support for your most important contracts.
            </p>
          </div>

          {/* Value Props */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="font-semibold text-white mb-2">Licensed Experts</h3>
              <p className="text-sm text-slate-400">
                Our reviewers have 10+ years of construction law experience and understand contractor relationships.
              </p>
            </div>
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 text-center">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-white mb-2">10x Cheaper Than Lawyers</h3>
              <p className="text-sm text-slate-400">
                Get expert review at a fraction of the cost of traditional legal fees. Save thousands per contract.
              </p>
            </div>
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 text-center">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-white mb-2">Fast Turnaround</h3>
              <p className="text-sm text-slate-400">
                Get your contracts reviewed in 24-48 hours. We understand bid deadlines don't wait.
              </p>
            </div>
          </div>

          {/* Service Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {services.map((service) => (
              <div
                key={service.id}
                className={`relative bg-slate-900 rounded-2xl border p-6 flex flex-col ${
                  service.popular
                    ? 'border-amber-500 shadow-lg shadow-amber-500/20'
                    : 'border-slate-800'
                }`}
              >
                {service.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-500 text-white text-xs font-semibold rounded-full">
                    Best Value
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white">{service.name}</h3>
                  <p className="text-sm text-slate-400">{service.description}</p>
                </div>

                <div className="mb-6">
                  {service.price ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-white">${service.price.toLocaleString()}</span>
                      {service.priceLabel && <span className="text-slate-400">{service.priceLabel}</span>}
                    </div>
                  ) : (
                    <span className="text-4xl font-bold text-white">{service.priceLabel}</span>
                  )}
                  <p className="text-sm text-slate-500 mt-1">
                    Turnaround: {service.turnaround}
                  </p>
                </div>

                <ul className="space-y-3 mb-6 flex-1">
                  {service.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-slate-300">
                      <svg className="w-5 h-5 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <p className="text-xs text-slate-500 mb-4">
                  <span className="font-medium text-slate-400">Ideal for:</span> {service.ideal}
                </p>

                <button
                  onClick={() => setSelectedService(service.id)}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    service.popular
                      ? 'bg-amber-500 hover:bg-amber-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                  }`}
                >
                  {service.cta}
                </button>
              </div>
            ))}
          </div>

          {/* How It Works */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 mb-16">
            <h2 className="text-2xl font-bold text-white text-center mb-8">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold">
                  1
                </div>
                <h3 className="font-semibold text-white mb-2">Submit Request</h3>
                <p className="text-sm text-slate-400">
                  Fill out the form below with your contact info and contract details.
                </p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold">
                  2
                </div>
                <h3 className="font-semibold text-white mb-2">Quick Call</h3>
                <p className="text-sm text-slate-400">
                  We'll schedule a 15-minute call to understand your needs and timeline.
                </p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold">
                  3
                </div>
                <h3 className="font-semibold text-white mb-2">Expert Review</h3>
                <p className="text-sm text-slate-400">
                  Our construction law expert reviews your contract and prepares your deliverables.
                </p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold">
                  4
                </div>
                <h3 className="font-semibold text-white mb-2">Negotiate with Confidence</h3>
                <p className="text-sm text-slate-400">
                  Use our analysis and scripts to negotiate better terms.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div id="contact-form" className="max-w-2xl mx-auto">
            {submitted ? (
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Request Received</h2>
                <p className="text-slate-400 mb-6">
                  Thank you for your interest. A member of our team will contact you within 1 business day.
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300"
                >
                  Return to home
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            ) : (
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8">
                <h2 className="text-2xl font-bold text-white text-center mb-2">
                  Request a Consultation
                </h2>
                <p className="text-slate-400 text-center mb-8">
                  Tell us about your needs and we'll get back to you within 1 business day.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {selectedService && (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                      <p className="text-sm text-amber-400">
                        <span className="font-medium">Selected Service:</span>{' '}
                        {services.find((s) => s.id === selectedService)?.name}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="John Smith"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
                        Work Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="john@company.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="company" className="block text-sm font-medium text-slate-300 mb-1">
                        Company Name
                      </label>
                      <input
                        type="text"
                        id="company"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="ABC Electrical"
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-slate-300 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="service" className="block text-sm font-medium text-slate-300 mb-1">
                      Service Interested In *
                    </label>
                    <select
                      id="service"
                      required
                      value={selectedService || ''}
                      onChange={(e) => setSelectedService(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a service</option>
                      {services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name} - {service.price ? `$${service.price.toLocaleString()}` : service.priceLabel}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-slate-300 mb-1">
                      Tell us about your situation
                    </label>
                    <textarea
                      id="message"
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe your contract review needs, timeline, or any specific concerns..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Submitting...' : 'Request Consultation'}
                  </button>

                  <p className="text-xs text-slate-500 text-center">
                    By submitting, you agree to our{' '}
                    <Link href="/terms" className="text-blue-400 hover:text-blue-300">Terms</Link>
                    {' '}and{' '}
                    <Link href="/privacy" className="text-blue-400 hover:text-blue-300">Privacy Policy</Link>.
                  </p>
                </form>
              </div>
            )}
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
