/**
 * Error Reporting Utility
 *
 * Integrated with Sentry for production error monitoring.
 * Falls back to console logging in development.
 */

import * as Sentry from "@sentry/nextjs";

type ErrorSeverity = 'info' | 'warning' | 'error' | 'fatal';

interface ErrorContext {
  // User context
  userId?: string;
  email?: string;

  // Request context
  url?: string;
  method?: string;

  // Custom tags
  tags?: Record<string, string>;

  // Extra data
  extra?: Record<string, unknown>;
}

interface ErrorReport {
  message: string;
  severity: ErrorSeverity;
  error?: Error;
  context?: ErrorContext;
  timestamp: string;
}

// In-memory error buffer for debugging
const errorBuffer: ErrorReport[] = [];
const MAX_BUFFER_SIZE = 50;

// Map our severity levels to Sentry's
const severityToSentry: Record<ErrorSeverity, Sentry.SeverityLevel> = {
  info: 'info',
  warning: 'warning',
  error: 'error',
  fatal: 'fatal',
};

/**
 * Report an error to Sentry
 */
export function captureError(
  error: Error | string,
  context?: ErrorContext,
  severity: ErrorSeverity = 'error'
): void {
  const errorReport: ErrorReport = {
    message: error instanceof Error ? error.message : error,
    severity,
    error: error instanceof Error ? error : undefined,
    context,
    timestamp: new Date().toISOString(),
  };

  // Always log in development
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error Report]', errorReport);
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
  }

  // Buffer errors for debugging
  errorBuffer.push(errorReport);
  if (errorBuffer.length > MAX_BUFFER_SIZE) {
    errorBuffer.shift();
  }

  // Send to Sentry in production
  if (process.env.NODE_ENV === 'production') {
    const sentryError = error instanceof Error ? error : new Error(error);

    Sentry.withScope((scope) => {
      scope.setLevel(severityToSentry[severity]);

      if (context?.tags) {
        Object.entries(context.tags).forEach(([key, value]) => {
          scope.setTag(key, value);
        });
      }

      if (context?.extra) {
        Object.entries(context.extra).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }

      if (context?.userId || context?.email) {
        scope.setUser({
          id: context.userId,
          email: context.email,
        });
      }

      Sentry.captureException(sentryError);
    });
  }
}

/**
 * Report an informational message
 */
export function captureMessage(
  message: string,
  context?: ErrorContext,
  severity: ErrorSeverity = 'info'
): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${severity.toUpperCase()}]`, message, context);
  }

  if (process.env.NODE_ENV === 'production') {
    Sentry.withScope((scope) => {
      scope.setLevel(severityToSentry[severity]);

      if (context?.tags) {
        Object.entries(context.tags).forEach(([key, value]) => {
          scope.setTag(key, value);
        });
      }

      if (context?.extra) {
        Object.entries(context.extra).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }

      Sentry.captureMessage(message, severityToSentry[severity]);
    });
  }
}

/**
 * Wrap an async function with error capturing
 */
export function withErrorCapture<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  context?: Omit<ErrorContext, 'extra'>
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      captureError(
        error instanceof Error ? error : new Error(String(error)),
        {
          ...context,
          extra: { args },
        }
      );
      throw error;
    }
  }) as T;
}

/**
 * Create an error boundary context for API routes
 */
export function createApiErrorHandler(routeName: string) {
  return {
    capture: (error: Error | string, extra?: Record<string, unknown>) => {
      captureError(error instanceof Error ? error : new Error(error), {
        tags: { route: routeName },
        extra,
      });
    },

    wrapHandler: <T>(handler: () => Promise<T>): Promise<T> => {
      return handler().catch((error) => {
        captureError(error instanceof Error ? error : new Error(String(error)), {
          tags: { route: routeName },
        });
        throw error;
      });
    },
  };
}

/**
 * Set user context for Sentry
 */
export function setUser(user: { id?: string; email?: string } | null): void {
  if (process.env.NODE_ENV === 'production') {
    Sentry.setUser(user);
  }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>
): void {
  if (process.env.NODE_ENV === 'production') {
    Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: 'info',
    });
  }
}

/**
 * Get buffered errors (for debugging)
 */
export function getErrorBuffer(): readonly ErrorReport[] {
  return [...errorBuffer];
}

/**
 * Clear error buffer
 */
export function clearErrorBuffer(): void {
  errorBuffer.length = 0;
}
