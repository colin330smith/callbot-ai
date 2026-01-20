'use client';

import Script from 'next/script';
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

declare global {
  interface Window {
    gtag: (command: string, ...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

// Track page views
export function usePageTracking() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!GA_MEASUREMENT_ID || typeof window.gtag !== 'function') return;

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }, [pathname, searchParams]);
}

// Custom event tracking functions
export const trackEvent = (eventName: string, parameters?: Record<string, unknown>) => {
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', eventName, parameters);
};

// Specific conversion events for SubShield
export const trackAnalytics = {
  // Track when user uploads a contract
  contractUploaded: (fileType: string, fileSize: number) => {
    trackEvent('contract_uploaded', {
      event_category: 'engagement',
      file_type: fileType,
      file_size_kb: Math.round(fileSize / 1024),
    });
  },

  // Track when preview analysis starts
  previewStarted: () => {
    trackEvent('preview_started', {
      event_category: 'engagement',
    });
  },

  // Track when preview analysis completes
  previewCompleted: (riskScore: number, recommendation: string) => {
    trackEvent('preview_completed', {
      event_category: 'engagement',
      risk_score: riskScore,
      recommendation: recommendation,
    });
  },

  // Track when user clicks to unlock full report (conversion intent)
  unlockClicked: () => {
    trackEvent('unlock_clicked', {
      event_category: 'conversion',
    });
  },

  // Track checkout initiated
  checkoutStarted: (email: string) => {
    trackEvent('begin_checkout', {
      event_category: 'conversion',
      currency: 'USD',
      value: 47.00,
      items: [{
        item_id: 'contract_analysis',
        item_name: 'SubShield Full Contract Analysis',
        price: 47.00,
        quantity: 1,
      }],
    });
  },

  // Track successful purchase - MAIN CONVERSION EVENT
  purchaseCompleted: () => {
    trackEvent('purchase', {
      event_category: 'conversion',
      currency: 'USD',
      value: 47.00,
      transaction_id: `ss_${Date.now()}`,
      items: [{
        item_id: 'contract_analysis',
        item_name: 'SubShield Full Contract Analysis',
        price: 47.00,
        quantity: 1,
      }],
    });
  },

  // Track full report viewed after payment
  fullReportViewed: () => {
    trackEvent('full_report_viewed', {
      event_category: 'engagement',
    });
  },

  // Track errors
  errorOccurred: (errorType: string, errorMessage: string) => {
    trackEvent('error', {
      event_category: 'error',
      error_type: errorType,
      error_message: errorMessage,
    });
  },
};

// Analytics Script Component
export function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) {
    return null;
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
}
