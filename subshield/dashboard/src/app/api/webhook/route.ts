import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createApiErrorHandler } from '@/lib/error-reporting';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const errorHandler = createApiErrorHandler('webhook');

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    // Require webhook secret in production
    if (!STRIPE_WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET is not configured');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    if (!signature) {
      console.error('Missing stripe-signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event: Stripe.Event;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    try {
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      const customerEmail = session.customer_details?.email || session.customer_email;
      const customerName = session.customer_details?.name || 'there';
      const paymentId = session.payment_intent;
      const amountPaid = (session.amount_total || 0) / 100;

      if (!customerEmail) {
        console.error('No customer email found in session');
        return NextResponse.json({ error: 'No email' }, { status: 400 });
      }

      // Send confirmation email via Resend
      if (RESEND_API_KEY) {
        console.log('Sending confirmation email to:', customerEmail);
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'SubShield <colin@trysubshield.com>',
            to: customerEmail,
            subject: 'Your SubShield Contract Analysis is Ready',
            html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .button { display: inline-block; background: #1e40af; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
    .footer { background: #f9fafb; padding: 20px 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; text-align: center; color: #666; font-size: 14px; }
    .highlight { background: #dbeafe; padding: 15px; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0; font-size: 28px;">SubShield</h1>
      <p style="margin:10px 0 0 0; opacity: 0.9;">Contract Risk Analysis</p>
    </div>
    <div class="content">
      <p>Hi ${customerName.split(' ')[0]},</p>

      <p>Thank you for your purchase! Your full contract analysis report is now available.</p>

      <div class="highlight">
        <p style="margin: 0;"><strong>What happens next:</strong></p>
        <p style="margin: 10px 0 0 0;">Your full analysis should be loading automatically in your browser. If it's not showing, you can return to the analysis page and upload your contract again - as a paid customer, you'll see the complete report immediately.</p>
      </div>

      <p>Your detailed report includes:</p>
      <ul>
        <li><strong>Complete risk assessment</strong> with severity ratings</li>
        <li><strong>Every risky clause</strong> quoted verbatim from your contract</li>
        <li><strong>Plain-English explanations</strong> of what each clause means</li>
        <li><strong>Word-for-word negotiation scripts</strong> you can use today</li>
        <li><strong>Contract summary</strong> with key terms at a glance</li>
      </ul>

      <p><strong>Pro tip:</strong> Use the "Print / Save PDF" button at the bottom of your report to keep a copy for your records or share with your attorney.</p>

      <p>If you have any questions about your report or need clarification on any clause, just reply to this email.</p>

      <p>Protecting your business,</p>
      <p><strong>Colin Smith</strong><br>Founder, SubShield</p>
    </div>
    <div class="footer">
      <p>SubShield | Protecting Subcontractors from Bad Contracts</p>
      <p style="margin: 5px 0;">Questions? Reply to this email.</p>
      <p style="margin: 5px 0; font-size: 12px; color: #999;">Order ID: ${paymentId}</p>
    </div>
  </div>
</body>
</html>
            `,
          }),
        });

        const emailResult = await emailResponse.json();
        if (!emailResponse.ok) {
          console.error('Resend error:', emailResult);
        } else {
          console.log('Confirmation email sent to:', customerEmail);
        }
      }

      console.log('SubShield purchase completed:', {
        email: customerEmail,
        name: customerName,
        paymentId,
        amountPaid,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({
        received: true,
        email: customerEmail,
        emailSent: !!RESEND_API_KEY,
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    errorHandler.capture(error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
