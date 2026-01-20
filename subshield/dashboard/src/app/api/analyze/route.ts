import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limit';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Contract size limits
const MAX_CONTRACT_LENGTH = 200000; // ~200k characters
const MIN_CONTRACT_LENGTH = 100;

const ANALYSIS_PROMPT = `You are an expert construction contract attorney who specializes in protecting subcontractors. Analyze this subcontract and identify every clause that could harm the subcontractor.

For each risky clause found:
1. Quote the EXACT contract language
2. Explain in plain English what it means and why it's dangerous
3. Rate severity: CRITICAL (red), WARNING (yellow), or CAUTION (blue)
4. Provide specific word-for-word negotiation language to fix it

CRITICAL issues are deal-breakers that could bankrupt a subcontractor.
WARNING issues are significant risks that should be negotiated.
CAUTION issues are minor concerns to be aware of.

Also identify:
- Payment terms and potential cash flow issues
- Insurance requirements and whether they're reasonable
- Indemnification scope (especially if it's "broad form")
- Liquidated damages and whether they're proportionate
- Termination clauses and their fairness
- Warranty periods and response requirements
- Change order processes
- Delay and no-damage-for-delay clauses
- Dispute resolution requirements

At the end, provide:
1. OVERALL RISK SCORE: 1-10 (10 = extremely risky, don't sign)
2. EXECUTIVE SUMMARY: 2-3 sentences on the biggest concerns
3. RECOMMENDATION: SIGN (low risk), NEGOTIATE (medium risk), or WALK AWAY (high risk)

IMPORTANT: Return ONLY valid JSON with no additional text. Use this exact structure:
{
  "riskScore": 8,
  "recommendation": "NEGOTIATE",
  "executiveSummary": "This contract contains several concerning clauses...",
  "criticalIssues": [
    {
      "title": "Pay-If-Paid Clause",
      "clauseText": "exact quote from contract",
      "explanation": "plain English explanation",
      "negotiationScript": "suggested replacement language"
    }
  ],
  "warningIssues": [],
  "cautionIssues": [],
  "contractSummary": {
    "projectName": "",
    "contractValue": "",
    "paymentTerms": "",
    "retainage": "",
    "liquidatedDamages": "",
    "warrantyPeriod": "",
    "insuranceRequirements": ""
  }
}

CONTRACT TO ANALYZE:
`;

const PREVIEW_PROMPT = `You are a construction contract attorney. Quickly analyze this subcontract and identify the top risks.

IMPORTANT: Return ONLY valid JSON with no additional text:
{
  "riskScore": 8,
  "recommendation": "NEGOTIATE",
  "executiveSummary": "2-3 sentences about the biggest concerns",
  "topThreeIssues": [
    {"title": "Issue name", "severity": "CRITICAL", "preview": "One sentence description"}
  ],
  "totalIssuesFound": 5
}

The severity must be one of: CRITICAL, WARNING, or CAUTION.
The recommendation must be one of: SIGN, NEGOTIATE, or WALK AWAY.

CONTRACT:
`;

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Rate limiting
    const clientIP = getClientIP(req);
    const rateLimit = checkRateLimit(`analyze:${clientIP}`, RATE_LIMITS.analyze);

    if (!rateLimit.success) {
      const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment before trying again.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimit.resetTime),
          },
        }
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { contractText, preview } = body;

    // Validate contract text
    if (!contractText || typeof contractText !== 'string') {
      return NextResponse.json({ error: 'No contract text provided' }, { status: 400 });
    }

    if (contractText.length < MIN_CONTRACT_LENGTH) {
      return NextResponse.json({
        error: 'Contract text too short. Please provide a complete contract document.'
      }, { status: 400 });
    }

    if (contractText.length > MAX_CONTRACT_LENGTH) {
      return NextResponse.json({
        error: 'Contract too long. Please ensure the document is under 200,000 characters.'
      }, { status: 400 });
    }

    if (!ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY not configured');
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 });
    }

    // Build prompt based on mode
    const textToAnalyze = preview ? contractText.substring(0, 20000) : contractText;
    const prompt = preview
      ? PREVIEW_PROMPT + textToAnalyze
      : ANALYSIS_PROMPT + textToAnalyze;

    // Call Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: preview ? 1500 : 8000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);

      if (response.status === 429) {
        return NextResponse.json({ error: 'Service busy. Please try again in a moment.' }, { status: 429 });
      }
      if (response.status === 401) {
        console.error('Invalid API key');
        return NextResponse.json({ error: 'Service configuration error' }, { status: 503 });
      }

      return NextResponse.json({ error: 'Analysis failed. Please try again.' }, { status: 500 });
    }

    const result = await response.json();

    if (!result.content || !result.content[0] || !result.content[0].text) {
      console.error('Unexpected API response structure:', result);
      return NextResponse.json({ error: 'Unexpected response format' }, { status: 500 });
    }

    const analysisText = result.content[0].text;

    // Parse the JSON from the response
    let analysis;
    try {
      // Try to find JSON in the response (handle markdown code blocks)
      let jsonStr = analysisText;

      // Remove markdown code blocks if present
      const codeBlockMatch = analysisText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1];
      }

      // Find the JSON object
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }

      // Validate required fields exist
      if (typeof analysis.riskScore !== 'number') {
        analysis.riskScore = 5; // Default to medium risk
      }
      if (!analysis.recommendation) {
        analysis.recommendation = 'NEGOTIATE';
      }
      if (!analysis.executiveSummary) {
        analysis.executiveSummary = 'Analysis completed. Review the identified issues carefully.';
      }

      // Ensure arrays exist for full analysis
      if (!preview) {
        analysis.criticalIssues = analysis.criticalIssues || [];
        analysis.warningIssues = analysis.warningIssues || [];
        analysis.cautionIssues = analysis.cautionIssues || [];
        analysis.contractSummary = analysis.contractSummary || {};
      }

    } catch (parseError) {
      console.error('Failed to parse analysis JSON:', parseError);
      console.error('Raw response:', analysisText.substring(0, 500));
      return NextResponse.json({
        error: 'Failed to process analysis results. Please try again.'
      }, { status: 500 });
    }

    const duration = Date.now() - startTime;
    console.log(`Analysis completed in ${duration}ms (preview: ${!!preview})`);

    return NextResponse.json({
      success: true,
      analysis,
      preview: !!preview,
      processingTime: duration
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ error: 'Analysis failed. Please try again.' }, { status: 500 });
  }
}
