import { NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

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

Format your response as JSON with this structure:
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
  "warningIssues": [...],
  "cautionIssues": [...],
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

export async function POST(req: NextRequest) {
  try {
    const { contractText, preview } = await req.json();

    if (!contractText) {
      return NextResponse.json({ error: 'No contract text provided' }, { status: 400 });
    }

    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'API not configured' }, { status: 500 });
    }

    // For preview mode, we use a shorter prompt to just get the risk score and top 3 issues
    const prompt = preview
      ? `Analyze this subcontract quickly. Return JSON with:
{
  "riskScore": 1-10,
  "recommendation": "SIGN" or "NEGOTIATE" or "WALK AWAY",
  "executiveSummary": "2-3 sentences",
  "topThreeIssues": [
    {"title": "Issue name", "severity": "CRITICAL/WARNING/CAUTION", "preview": "One sentence description"}
  ],
  "totalIssuesFound": number
}

CONTRACT:
${contractText.substring(0, 15000)}`
      : ANALYSIS_PROMPT + contractText;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: preview ? 1000 : 8000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Anthropic API error:', error);
      return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
    }

    const result = await response.json();
    const analysisText = result.content[0].text;

    // Parse the JSON from the response
    let analysis;
    try {
      // Find JSON in the response (it might have markdown code blocks)
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse analysis:', parseError);
      return NextResponse.json({
        error: 'Failed to parse analysis',
        raw: analysisText
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      analysis,
      preview: !!preview
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
