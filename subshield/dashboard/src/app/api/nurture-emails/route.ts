import { NextRequest, NextResponse } from 'next/server';
import { createApiErrorHandler } from '@/lib/error-reporting';
import { supabase } from '@/lib/supabase';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const CRON_SECRET = process.env.CRON_SECRET;
const errorHandler = createApiErrorHandler('nurture-emails');

// Email templates for the nurture sequence
const EMAIL_TEMPLATES = {
  // Email 2: Sent 24 hours after preview (educational value)
  day1: {
    subject: (riskScore?: number) =>
      riskScore && riskScore >= 7
        ? 'The 3 Contract Clauses That Bankrupt Subcontractors'
        : '3 Contract Red Flags Every Subcontractor Should Know',
    html: (riskScore?: number) => `
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
    .tip-box { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 20px 0; }
    .red-flag { background: #fee2e2; border-left: 4px solid #dc2626; padding: 12px 16px; margin: 16px 0; border-radius: 0 8px 8px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0; font-size: 28px;">SubShield</h1>
      <p style="margin:10px 0 0 0; opacity: 0.9;">Contract Protection Tips</p>
    </div>
    <div class="content">
      <p>Hi again,</p>

      <p>Yesterday you ran your contract through SubShield. Before you sign, here are the <strong>3 clauses that cause the most financial damage</strong> to subcontractors:</p>

      <div class="red-flag">
        <strong>1. Pay-If-Paid Clauses</strong><br>
        <em>"Payment to Subcontractor is conditioned upon receipt of payment from Owner..."</em><br>
        <small>This shifts owner non-payment risk entirely to you. If the owner goes bankrupt, you may never get paid.</small>
      </div>

      <div class="red-flag">
        <strong>2. Broad Form Indemnification</strong><br>
        <em>"Subcontractor shall indemnify, defend, and hold harmless..."</em><br>
        <small>This can make you liable for the GC's own negligence. Some states have banned these clauses.</small>
      </div>

      <div class="red-flag">
        <strong>3. No-Damage-For-Delay Clauses</strong><br>
        <em>"Subcontractor waives all claims for delay damages..."</em><br>
        <small>If the GC causes delays, you can't recover costs for extended overhead, equipment rental, etc.</small>
      </div>

      <div class="tip-box">
        <strong>💡 Pro Tip:</strong> Most GCs expect you to negotiate. Silence = acceptance. The subcontractors who push back get better terms.
      </div>

      ${riskScore && riskScore >= 7 ? `
      <p><strong>Your contract scored ${riskScore}/10</strong> - there's a good chance one or more of these clauses is in there. Your full SubShield report shows exactly which clauses to negotiate.</p>
      ` : ''}

      <p style="text-align: center;">
        <a href="https://trysubshield.com/analyze" class="button" style="color: white;">
          Get Your Full Analysis
        </a>
      </p>

      <p>Questions? Just reply.</p>

      <p>- Colin</p>
    </div>
    <div class="footer">
      <p>SubShield | Protecting Subcontractors from Bad Contracts</p>
      <p style="margin: 5px 0; font-size: 11px; color: #bbb;">
        You're receiving this because you analyzed a contract on SubShield.<br>
        <a href="https://trysubshield.com" style="color: #999;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>
    `,
  },

  // Email 3: Sent 72 hours after preview (urgency + final offer)
  day3: {
    subject: () => 'Before You Sign That Contract...',
    html: (riskScore?: number) => `
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
    .guarantee { background: #dcfce7; border: 1px solid #22c55e; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0; font-size: 28px;">SubShield</h1>
    </div>
    <div class="content">
      <p>Hey,</p>

      <p>Quick question: Have you signed that contract yet?</p>

      <p>If not, here's what I know from analyzing thousands of subcontracts:</p>

      <ul>
        <li><strong>80%+ contain at least one clause</strong> that unfairly shifts risk to the sub</li>
        <li><strong>Most of these are negotiable</strong> - but only if you know they're there</li>
        <li><strong>The cost of one bad clause</strong> can be 10x, 100x, or even bankruptcy-level</li>
      </ul>

      ${riskScore ? `<p>Your contract scored <strong>${riskScore}/10</strong> on our risk assessment. That means there are specific clauses that need attention before you sign.</p>` : ''}

      <p>A construction attorney would charge $300-500+ to review your contract and might take a week. SubShield does it in 60 seconds for $147.</p>

      <div class="guarantee">
        <strong>🛡️ 30-Day Money-Back Guarantee</strong><br>
        <small>If you're not satisfied with your analysis, I'll refund you personally. No questions asked.</small>
      </div>

      <p style="text-align: center;">
        <a href="https://trysubshield.com/analyze" class="button" style="color: white;">
          Protect Your Business - $147
        </a>
      </p>

      <p>Don't let one bad clause cost you your business.</p>

      <p>- Colin<br>
      <small>Founder, SubShield</small></p>
    </div>
    <div class="footer">
      <p>SubShield | Protecting Subcontractors from Bad Contracts</p>
      <p style="margin: 5px 0; font-size: 11px; color: #bbb;">
        You're receiving this because you analyzed a contract on SubShield.<br>
        <a href="https://trysubshield.com" style="color: #999;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>
    `,
  },
};

// Endpoint to add a lead to the nurture sequence (deprecated - now handled by capture-lead)
export async function POST(req: NextRequest) {
  try {
    const { email, riskScore, action } = await req.json();

    if (action === 'add') {
      // Add lead to nurture sequence - now stored in database via capture-lead
      if (!email || typeof email !== 'string') {
        return NextResponse.json({ error: 'Email required' }, { status: 400 });
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Check if lead exists, if not create it
      const { data: existingLead } = await supabase
        .from('leads')
        .select('id')
        .eq('email', normalizedEmail)
        .single();

      if (!existingLead) {
        await supabase
          .from('leads')
          .insert({
            email: normalizedEmail,
            risk_score: riskScore || null,
            emails_sent: [0],
          });
      }

      return NextResponse.json({ success: true, message: 'Added to nurture sequence' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Nurture email error:', error);
    errorHandler.capture(error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 });
  }
}

// Cron endpoint to send scheduled emails
// Configure in vercel.json: { "crons": [{ "path": "/api/nurture-emails", "schedule": "0 */4 * * *" }] }
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = req.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!RESEND_API_KEY) {
      return NextResponse.json({ error: 'Email not configured' }, { status: 503 });
    }

    const now = new Date();
    const emailsSent: string[] = [];

    // Fetch leads that haven't converted and are within nurture window (7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: leads, error: fetchError } = await supabase
      .from('leads')
      .select('*')
      .eq('converted', false)
      .gte('captured_at', sevenDaysAgo);

    if (fetchError) {
      console.error('Failed to fetch leads:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
    }

    if (!leads || leads.length === 0) {
      return NextResponse.json({
        success: true,
        emailsSent: 0,
        message: 'No leads to process',
      });
    }

    for (const lead of leads) {
      const capturedAt = new Date(lead.captured_at);
      const hoursSinceCaptured = (now.getTime() - capturedAt.getTime()) / (1000 * 60 * 60);
      const emailsSentArray = lead.emails_sent || [0];

      // Email 2: Send after 24 hours
      if (hoursSinceCaptured >= 24 && !emailsSentArray.includes(1)) {
        const template = EMAIL_TEMPLATES.day1;
        const success = await sendEmail(
          lead.email,
          template.subject(lead.risk_score),
          template.html(lead.risk_score)
        );

        if (success) {
          const updatedEmailsSent = [...emailsSentArray, 1];
          await supabase
            .from('leads')
            .update({ emails_sent: updatedEmailsSent })
            .eq('id', lead.id);

          emailsSent.push(`${lead.email} (day1)`);
        }
      }

      // Email 3: Send after 72 hours
      if (hoursSinceCaptured >= 72 && !emailsSentArray.includes(2)) {
        const template = EMAIL_TEMPLATES.day3;
        const success = await sendEmail(
          lead.email,
          template.subject(),
          template.html(lead.risk_score)
        );

        if (success) {
          const updatedEmailsSent = [...emailsSentArray, 2];
          await supabase
            .from('leads')
            .update({ emails_sent: updatedEmailsSent })
            .eq('id', lead.id);

          emailsSent.push(`${lead.email} (day3)`);
        }
      }
    }

    // Clean up expired rate limits
    await supabase
      .from('rate_limits')
      .delete()
      .lt('reset_at', now.toISOString());

    return NextResponse.json({
      success: true,
      emailsSent: emailsSent.length,
      details: emailsSent,
      leadsProcessed: leads.length,
    });
  } catch (error) {
    console.error('Nurture cron error:', error);
    errorHandler.capture(error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 });
  }
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'SubShield <colin@trysubshield.com>',
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`Failed to send email to ${to}:`, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
    return false;
  }
}
