'use client';

import Script from 'next/script';
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

declare global {
  interface Window {
    gtag: (command: string, ...args: unknown[]) => void;
    dataLayer: unknown[];
    fbq: (command: string, event: string, params?: Record<string, unknown>) => void;
    _fbq: unknown;
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

// Meta Pixel event tracking
export const trackMetaEvent = (eventName: string, params?: Record<string, unknown>) => {
  if (typeof window.fbq !== 'function') return;
  window.fbq('track', eventName, params);
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
    // Meta Pixel: Custom event for contract upload
    trackMetaEvent('ViewContent', {
      content_name: 'Contract Upload',
      content_category: 'Engagement',
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
    // Meta Pixel: View content complete
    trackMetaEvent('ViewContent', {
      content_name: 'Contract Preview',
      content_category: 'Analysis',
      value: riskScore,
    });
  },

  // Track when user clicks to unlock full report (conversion intent)
  unlockClicked: () => {
    trackEvent('unlock_clicked', {
      event_category: 'conversion',
    });
    // Meta Pixel: Add to cart intent
    trackMetaEvent('AddToCart', {
      content_name: 'Full Contract Analysis',
      content_type: 'product',
      value: 147.00,
      currency: 'USD',
    });
  },

  // Track checkout initiated
  checkoutStarted: (email: string) => {
    trackEvent('begin_checkout', {
      event_category: 'conversion',
      currency: 'USD',
      value: 147.00,
      items: [{
        item_id: 'contract_analysis',
        item_name: 'SubShield Full Contract Analysis',
        price: 147.00,
        quantity: 1,
      }],
    });
    // Meta Pixel: Initiate checkout
    trackMetaEvent('InitiateCheckout', {
      content_name: 'Full Contract Analysis',
      content_type: 'product',
      value: 147.00,
      currency: 'USD',
      num_items: 1,
    });
  },

  // Track successful purchase - MAIN CONVERSION EVENT
  purchaseCompleted: () => {
    trackEvent('purchase', {
      event_category: 'conversion',
      currency: 'USD',
      value: 147.00,
      transaction_id: `ss_${Date.now()}`,
      items: [{
        item_id: 'contract_analysis',
        item_name: 'SubShield Full Contract Analysis',
        price: 147.00,
        quantity: 1,
      }],
    });
    // Meta Pixel: Purchase event (main conversion)
    trackMetaEvent('Purchase', {
      content_name: 'Full Contract Analysis',
      content_type: 'product',
      value: 147.00,
      currency: 'USD',
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

  // Track email lead capture
  emailCaptured: (source: string, riskScore?: number) => {
    trackEvent('generate_lead', {
      event_category: 'conversion',
      lead_source: source,
      risk_score: riskScore,
      currency: 'USD',
      value: 10.00, // Estimated lead value
    });
    // Meta Pixel: Lead event
    trackMetaEvent('Lead', {
      content_name: 'Email Capture',
      value: 10.00,
      currency: 'USD',
    });
  },
};

// Google Analytics Script Component
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

// Meta Pixel Script Component
export function MetaPixel() {
  if (!META_PIXEL_ID) {
    return null;
  }

  return (
    <>
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}

// Combined Analytics Component
export function Analytics() {
  return (
    <>
      <GoogleAnalytics />
      <MetaPixel />
    </>
  );
}
