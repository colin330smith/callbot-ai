import { NextRequest, NextResponse } from 'next/server';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    // For now, we'll skip signature verification in development
    // In production, you should verify the webhook signature

    const event = JSON.parse(body);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      const customerEmail = session.customer_details?.email;
      const customerName = session.customer_details?.name || 'there';
      const paymentId = session.payment_intent;
      const amountPaid = (session.amount_total || 0) / 100;

      if (!customerEmail) {
        console.error('No customer email found');
        return NextResponse.json({ error: 'No email' }, { status: 400 });
      }

      // Send intake email via Resend
      if (RESEND_API_KEY) {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'SubShield <hello@trysubshield.com>',
            to: customerEmail,
            subject: "You're In - Let's Review Your Contract",
            html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1e40af; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .step { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #1e40af; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0;">SubShield</h1>
      <p style="margin:10px 0 0 0; opacity: 0.9;">Contract Analysis for Subcontractors</p>
    </div>
    <div class="content">
      <p>Hi ${customerName.split(' ')[0]},</p>

      <p>Thank you for trusting SubShield with your contract review. I'm ready to analyze your subcontract and identify any risky clauses that could cost you money.</p>

      <p><strong>To get started, I need your contract.</strong></p>

      <div class="step">
        <strong>Step 1:</strong> Reply to this email with your subcontract attached (PDF, Word, or scanned images all work)
      </div>

      <div class="step">
        <strong>Step 2:</strong> Include the following info:
        <ul style="margin: 10px 0;">
          <li>General Contractor name</li>
          <li>Project name/location</li>
          <li>Your trade</li>
          <li>Contract value (approximate is fine)</li>
          <li>Any specific concerns you have</li>
        </ul>
      </div>

      <div class="step">
        <strong>Step 3:</strong> I'll deliver your comprehensive risk analysis within 24 hours
      </div>

      <p>Your report will include:</p>
      <ul>
        <li>Risk score (1-10) with explanation</li>
        <li>Every problematic clause identified</li>
        <li>Plain-English explanation of what each clause means</li>
        <li>Word-for-word negotiation scripts</li>
        <li>State-specific legal considerations</li>
        <li>Final recommendation (sign, negotiate, or walk)</li>
      </ul>

      <p><strong>Just reply to this email with your contract to get started.</strong></p>

      <p>Looking forward to protecting your business,</p>
      <p><strong>Colin Smith</strong><br>Founder, SubShield</p>
    </div>
    <div class="footer">
      <p>SubShield | Contract Analysis for Subcontractors</p>
      <p>Questions? Just reply to this email.</p>
    </div>
  </div>
</body>
</html>
            `,
          }),
        });

        if (!emailResponse.ok) {
          const error = await emailResponse.text();
          console.error('Resend error:', error);
        }
      }

      // Store the contract in our database (via API call to dashboard)
      // For now, we'll log it - you can view in Vercel logs
      console.log('New SubShield order:', {
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
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
