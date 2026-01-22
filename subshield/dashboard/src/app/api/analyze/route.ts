import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limit';
import { createApiErrorHandler } from '@/lib/error-reporting';
import { createClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/database.types';

type Subscription = Database['public']['Tables']['subscriptions']['Row'];
type ContractInsert = Database['public']['Tables']['contracts']['Insert'];

const errorHandler = createApiErrorHandler('analyze');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Contract size limits
const MAX_CONTRACT_LENGTH = 200000; // ~200k characters
const MIN_CONTRACT_LENGTH = 100;

const ANALYSIS_PROMPT = `You are an expert construction contract analyst specializing in protecting subcontractors from predatory contract terms. Your analysis has saved subcontractors millions of dollars.

## YOUR TASK
Analyze this subcontractor contract and identify every clause that could harm the subcontractor across all 15 risk categories.

## ANALYSIS CATEGORIES

### 1. PAYMENT TERMS
- Pay-if-paid clauses (contractor only pays if they get paid) - CRITICAL
- Pay-when-paid clauses (timing tied to upstream payment)
- Payment timeline (net 30, 45, 60, 90?)
- Conditions that could delay or prevent payment
- Invoice requirements that could be used to reject payment
- Early payment discounts that pressure cash flow

### 2. RETAINAGE
- Retainage percentage (5% is standard, anything above is aggressive)
- Release conditions (substantial completion? final completion?)
- Timeline for release after conditions met
- Provisions that could extend retainage hold
Calculate: On a $100K contract, show the actual dollar amount held

### 3. LIEN RIGHTS
- Lien waiver requirements (conditional vs unconditional)
- Timing of waiver requirements (before payment received?)
- Waiver scope (just this payment or all prior work?)
- Provisions limiting statutory lien rights
- Notice requirements that could void lien rights

### 4. INDEMNIFICATION
- Scope (whose negligence is covered?)
- Whether mutual or one-sided
- "Broad form" indemnification (including GC's own negligence) - CRITICAL
- Insurance implications
- Survival clauses (how long does it last?)

### 5. INSURANCE REQUIREMENTS
- Coverage amounts (reasonable vs excessive)
- Additional insured requirements
- Waiver of subrogation
- Primary/non-contributory language
- Hard-to-obtain coverage types
Estimate additional insurance cost if requirements exceed standard

### 6. CHANGE ORDERS
- Written approval requirements before work
- Time limits for submitting change requests (7 days? 3 days?)
- Who can authorize changes
- Pricing methodology for changes
- Provisions resulting in uncompensated extra work

### 7. SCOPE CREEP PROTECTION
- Scope definition clarity
- "Including but not limited to" expansive language
- Implied work provisions
- Coordination requirements expanding scope
- Clean-up and protection responsibilities

### 8. SCHEDULE & DELAYS
- Liquidated damages amounts - CRITICAL if excessive
- No-damage-for-delay clauses - CRITICAL
- Acceleration requirements
- Float ownership
- Notice requirements for delays
Calculate maximum exposure under liquidated damages

### 9. TERMINATION
- Termination for convenience (can they cancel anytime?)
- Cure periods for alleged default
- Payment upon termination
- Return of materials/equipment
- Survival of obligations

### 10. DISPUTE RESOLUTION
- Mandatory arbitration vs litigation
- Arbitration rules and costs
- Venue/location requirements
- Attorney fee provisions
- Mediation requirements
- Limitation of actions periods

### 11. WARRANTY
- Warranty period length (compare to 1-year standard)
- Scope of warranty obligations
- Call-back and repair requirements
- Extended warranties beyond statutory
- Warranty tied to upstream obligations

### 12. SAFETY & COMPLIANCE
- Safety program requirements
- Drug testing requirements
- OSHA compliance obligations
- Documentation requirements
- Penalties for non-compliance

### 13. ASSIGNMENT & SUBCONTRACTING
- Restrictions on assigning contract
- Restrictions on sub-subcontractors
- Approval requirements
- Flow-down provisions

### 14. DOCUMENT PRECEDENCE
- Order of precedence for contract documents
- Which document controls in conflicts
- Incorporation by reference of unseen documents

### 15. HIDDEN TRAPS
- Any other provisions creating unexpected liability
- Provisions limiting legitimate claims
- Clauses that may be unenforceable but create chilling effects
- Conflicts with state law

## SEVERITY RATINGS
- CRITICAL: Deal-breakers that could bankrupt the subcontractor. Stop and negotiate or walk away.
- WARNING: Significant financial/legal risk. Should negotiate before signing.
- CAUTION: Minor concerns to be aware of. Acceptable if other terms are good.

## OUTPUT FORMAT
Return ONLY valid JSON:
{
  "riskScore": 8,
  "recommendation": "NEGOTIATE",
  "executiveSummary": "2-3 sentences on the biggest concerns with estimated financial exposure",
  "estimatedExposure": "$50,000 - $150,000",
  "criticalIssues": [
    {
      "title": "Pay-If-Paid Clause",
      "category": "Payment Terms",
      "clauseLocation": "Section 4.2, Page 8",
      "clauseText": "EXACT quote from the contract",
      "explanation": "Plain English: what this means and why it's dangerous",
      "worstCase": "What could happen if you sign this",
      "negotiationScript": "Word-for-word script to discuss with GC: 'Hey [GC], I noticed section 4.2 has a pay-if-paid clause. In my experience, this puts all the payment risk on me even though I have no relationship with the owner. Could we change this to pay-when-paid with a 60-day maximum delay? Here's the language I'd suggest: [replacement text]'"
    }
  ],
  "warningIssues": [],
  "cautionIssues": [],
  "negotiationPriority": [
    {"issue": "Pay-if-paid", "priority": 1, "difficulty": "Medium", "reason": "High risk, commonly negotiable"},
    {"issue": "Broad indemnification", "priority": 2, "difficulty": "Hard", "reason": "Critical risk, GCs often resist"}
  ],
  "contractSummary": {
    "projectName": "",
    "gcName": "",
    "contractValue": "",
    "paymentTerms": "",
    "retainage": "",
    "retainageAmount": "",
    "liquidatedDamages": "",
    "maxLDExposure": "",
    "warrantyPeriod": "",
    "insuranceRequirements": "",
    "disputeVenue": ""
  },
  "stateSpecificNotes": "If state is identifiable, note relevant lien deadlines, anti-indemnity statutes, pay-if-paid enforceability"
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
  let body: { contractText?: string; preview?: boolean; filename?: string; gcName?: string; projectName?: string } | undefined;

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
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { contractText, preview, filename, gcName, projectName } = body || {};

    // Check authentication and subscription
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let subscription: Subscription | null = null;
    let isAuthenticated = false;

    if (user) {
      isAuthenticated = true;

      // Get user's subscription
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      subscription = sub as Subscription | null;

      // Check usage limits for full analysis (not preview)
      if (!preview && subscription) {
        const currentSub = subscription; // For TypeScript narrowing
        const isUnlimited = currentSub.contracts_limit === -1;

        if (!isUnlimited && currentSub.contracts_used_this_month >= currentSub.contracts_limit) {
          return NextResponse.json({
            error: 'Monthly contract limit reached. Please upgrade your plan for more analyses.',
            limitReached: true,
            currentUsage: currentSub.contracts_used_this_month,
            limit: currentSub.contracts_limit,
            tier: currentSub.tier,
          }, { status: 403 });
        }
      }
    }

    // For non-preview analysis, require authentication
    if (!preview && !isAuthenticated) {
      return NextResponse.json({
        error: 'Please sign in to perform a full contract analysis.',
        requiresAuth: true,
      }, { status: 401 });
    }

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
        model: 'claude-opus-4-5-20251101',
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

    // For full analysis with authenticated user, save contract and increment usage
    let contractId = null;
    if (!preview && user && subscription) {
      try {
        // Save contract to database
        const contractData: ContractInsert = {
          user_id: user.id,
          filename: filename || 'Untitled Contract',
          contract_text: contractText,
          gc_name: analysis.contractSummary?.gcName || gcName || null,
          project_name: analysis.contractSummary?.projectName || projectName || null,
          risk_score: analysis.riskScore,
          recommendation: analysis.recommendation,
          executive_summary: analysis.executiveSummary,
          estimated_exposure: analysis.estimatedExposure || null,
          analysis_json: analysis,
        };
        const { data: savedContract, error: saveError } = await supabase
          .from('contracts')
          .insert(contractData as never)
          .select('id')
          .single();

        if (saveError) {
          console.error('Error saving contract:', saveError);
        } else if (savedContract) {
          contractId = (savedContract as { id: string }).id;

          // Increment usage counter
          const { error: updateError } = await supabase
            .from('subscriptions')
            .update({
              contracts_used_this_month: subscription.contracts_used_this_month + 1,
            } as never)
            .eq('user_id', user.id);

          if (updateError) {
            console.error('Error updating usage:', updateError);
          }
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
        // Continue - analysis was successful, just couldn't save
      }
    }

    return NextResponse.json({
      success: true,
      analysis,
      preview: !!preview,
      processingTime: duration,
      contractId,
      usage: subscription ? {
        used: subscription.contracts_used_this_month + (preview ? 0 : 1),
        limit: subscription.contracts_limit,
        tier: subscription.tier,
      } : null,
    });

  } catch (error) {
    console.error('Analysis error:', error);
    errorHandler.capture(error instanceof Error ? error : new Error(String(error)), {
      preview: body?.preview,
      contractLength: body?.contractText?.length,
    });
    return NextResponse.json({ error: 'Analysis failed. Please try again.' }, { status: 500 });
  }
}
