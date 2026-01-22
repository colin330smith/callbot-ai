import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limit';
import { createApiErrorHandler } from '@/lib/error-reporting';

const errorHandler = createApiErrorHandler('create-checkout');

export async function POST(req: NextRequest) {
  let body: { analysisId?: string; email?: string } | undefined;

  try {
    // Rate limiting - stricter for checkout to prevent abuse
    const clientIP = getClientIP(req);
    const rateLimit = checkRateLimit(`checkout:${clientIP}`, RATE_LIMITS.checkout);

    if (!rateLimit.success) {
      const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
      return NextResponse.json(
        { error: 'Too many requests. Please wait before trying again.' },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfter) },
        }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const { analysisId, email } = body || {};

    // Validate email format
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'SubShield Full Contract Analysis',
              description: 'Complete risk analysis with negotiation scripts',
            },
            unit_amount: 14700, // $147.00
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/analyze?paid=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/analyze?canceled=true`,
      customer_email: email,
      metadata: {
        analysisId: analysisId || '',
        type: 'contract_analysis',
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    errorHandler.capture(error instanceof Error ? error : new Error(String(error)), {
      analysisId: body?.analysisId,
    });
    return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 });
  }
}
