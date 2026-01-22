import { NextRequest, NextResponse } from 'next/server';
import { createApiErrorHandler } from '@/lib/error-reporting';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const errorHandler = createApiErrorHandler('capture-lead');

const RATE_LIMIT_MAX = 5; // 5 leads per IP per hour
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// Hash IP for privacy
function hashIP(ip: string): string {
  return crypto.createHash('sha256').update(ip + process.env.RATE_LIMIT_SALT || 'subshield').digest('hex').substring(0, 16);
}

async function checkRateLimit(ipHash: string): Promise<boolean> {
  const now = new Date();

  // Try to get existing rate limit record
  const { data: existing } = await supabase
    .from('rate_limits')
    .select('*')
    .eq('ip_hash', ipHash)
    .single();

  if (!existing || new Date(existing.reset_at) < now) {
    // No record or expired - create/update with count 1
    const resetAt = new Date(now.getTime() + RATE_LIMIT_WINDOW_MS).toISOString();

    await supabase
      .from('rate_limits')
      .upsert({
        ip_hash: ipHash,
        count: 1,
        reset_at: resetAt,
      }, {
        onConflict: 'ip_hash',
      });

    return true;
  }

  if (existing.count >= RATE_LIMIT_MAX) {
    return false;
  }

  // Increment count
  await supabase
    .from('rate_limits')
    .update({ count: existing.count + 1 })
    .eq('ip_hash', ipHash);

  return true;
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
               req.headers.get('x-real-ip') ||
               'unknown';
    const ipHash = hashIP(ip);

    if (!await checkRateLimit(ipHash)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const { email, source, riskScore } = await req.json();

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if lead already exists
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .eq('email', normalizedEmail)
      .single();

    if (existingLead) {
      // Update existing lead with new risk score if provided
      if (riskScore !== undefined) {
        await supabase
          .from('leads')
          .update({ risk_score: riskScore })
          .eq('email', normalizedEmail);
      }
    } else {
      // Insert new lead
      const { error: insertError } = await supabase
        .from('leads')
        .insert({
          email: normalizedEmail,
          risk_score: riskScore || null,
          source: source || 'preview',
          ip_hash: ipHash,
          emails_sent: [0], // 0 = initial email
        });

      if (insertError) {
        console.error('Failed to insert lead:', insertError);
        // Continue anyway - don't fail the request for db issues
      }
    }

    console.log('Lead captured:', {
      email: normalizedEmail,
      source: source || 'preview',
      riskScore: riskScore || null,
      timestamp: new Date().toISOString(),
    });

    // Send welcome/nurture email via Resend
    if (RESEND_API_KEY) {
      const riskText = riskScore
        ? `Your contract scored ${riskScore}/10 on our risk assessment.`
        : '';

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'SubShield <colin@trysubshield.com>',
          to: normalizedEmail,
          subject: riskScore && riskScore >= 7
            ? '⚠️ Your Contract Has High-Risk Clauses'
            : 'Your SubShield Contract Preview is Ready',
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
    .risk-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
    .risk-high { background: #fee2e2; color: #b91c1c; }
    .risk-medium { background: #fef3c7; color: #92400e; }
    .risk-low { background: #dcfce7; color: #166534; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0; font-size: 28px;">SubShield</h1>
      <p style="margin:10px 0 0 0; opacity: 0.9;">Contract Risk Analysis</p>
    </div>
    <div class="content">
      <p>Hi there,</p>

      <p>Thanks for using SubShield to analyze your construction subcontract!</p>

      ${riskScore ? `
      <div style="text-align: center; margin: 20px 0;">
        <span class="risk-badge ${riskScore >= 7 ? 'risk-high' : riskScore >= 4 ? 'risk-medium' : 'risk-low'}">
          Risk Score: ${riskScore}/10
        </span>
      </div>
      ` : ''}

      ${riskScore && riskScore >= 7 ? `
      <p><strong>Your contract shows significant risk factors.</strong> Our AI found clauses that could expose you to financial liability, delayed payments, or limited legal recourse.</p>

      <p>The good news? Most of these clauses are negotiable. Your full report includes:</p>
      ` : `
      <p>Your preview is ready! Here's what the full analysis includes:</p>
      `}

      <ul>
        <li><strong>Every risky clause</strong> quoted verbatim from your contract</li>
        <li><strong>Plain-English explanations</strong> of what each clause actually means</li>
        <li><strong>Word-for-word negotiation scripts</strong> you can send to your GC</li>
        <li><strong>Risk severity ratings</strong> to prioritize what to negotiate first</li>
      </ul>

      <p style="text-align: center;">
        <a href="https://trysubshield.com/analyze" class="button" style="color: white;">
          Unlock Your Full Report - $147
        </a>
      </p>

      <p><strong>Why $147?</strong> A construction attorney would charge $300-500+ for the same review, and take days instead of seconds.</p>

      <p>Have questions? Just reply to this email.</p>

      <p>Protecting your business,</p>
      <p><strong>Colin Smith</strong><br>Founder, SubShield</p>
    </div>
    <div class="footer">
      <p>SubShield | Protecting Subcontractors from Bad Contracts</p>
      <p style="margin: 5px 0; font-size: 12px; color: #999;">
        <a href="https://trysubshield.com/privacy" style="color: #999;">Privacy Policy</a> |
        <a href="https://trysubshield.com/terms" style="color: #999;">Terms of Service</a>
      </p>
      <p style="margin: 5px 0; font-size: 11px; color: #bbb;">
        You're receiving this because you analyzed a contract on SubShield.
      </p>
    </div>
  </div>
</body>
</html>
          `,
        }),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Lead capture error:', error);
    errorHandler.capture(error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to capture lead' },
      { status: 500 }
    );
  }
}
