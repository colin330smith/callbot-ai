# SubShield: The Complete Battle Plan

## From Server to $60K/Month in 12 Months

**Your Starting Point:**
- No technical skills
- No sales skills
- No capital
- No domain expertise
- Hunger that won't quit

**Your Targets:**
- Floor (Quit Hillstone): $16K/month
- Target: $60K/month
- Timeline: 12 months

---

# PART 1: WHAT YOU'RE BUILDING

## The Problem You're Solving

Construction subcontractors sign contracts they don't understand. These contracts contain:
- **Pay-if-paid clauses** - They don't get paid until the GC gets paid (could be never)
- **Lien waiver traps** - They sign away rights to file liens before getting paid
- **Indemnification landmines** - They become liable for things outside their control
- **Retainage abuse** - 10% held back, often never released
- **Change order restrictions** - Extra work they can't bill for

**The pain:** 56 days average to get paid. 49% wait 30+ days. Many never get paid at all.

**The current solutions suck:**
- Construction attorneys: $300-500/hour (too expensive)
- Generic contract software: Doesn't understand construction (too generic)
- Reading it themselves: They're electricians, not lawyers (too complex)

## Your Solution: SubShield

An AI-powered contract analysis tool that:
1. Reads their contract (PDF upload)
2. Identifies dangerous clauses in plain English
3. Gives them a risk score (1-100)
4. Suggests specific language changes
5. Generates a negotiation script they can use with the GC

**Why AI makes this possible now:**
- Claude/GPT-4 can understand legal language
- Can be trained on construction-specific contract patterns
- Delivers in seconds what took attorneys hours
- Cost per analysis: ~$0.50 (you charge $39/month)

---

# PART 2: THE PRODUCT TIERS

## Free Tier (Lead Magnet)
- 1 contract review per month
- Basic risk score only
- No negotiation scripts
- Email capture required

**Purpose:** Build email list, prove value, convert to paid

## Pro Tier - $39/month (or $349/year - 25% discount)
- 5 contract reviews per month
- Full risk analysis with plain-English explanations
- Negotiation scripts for each dangerous clause
- Email alerts for common scam patterns
- "Contract Red Flags" weekly newsletter

**Purpose:** Your bread and butter. Target: 400 users = $16K MRR (Hillstone freedom)

## Team Tier - $79/month (or $699/year)
- Unlimited contract reviews
- Everything in Pro
- Team sharing (up to 5 users)
- Priority support
- Quarterly "state of construction contracts" report

**Purpose:** Larger subcontractors with multiple estimators

## Service Layer (Your Accelerant)

### One-Time Contract Review - $297
- Human-reviewed by you (with AI assistance)
- 24-hour turnaround
- Written report they can show their attorney
- Negotiation call prep document

### Monthly Retainer - $497/month
- Unlimited contract reviews with human oversight
- Direct text/email access to you
- Monthly 30-min strategy call
- Priority turnaround (same day)

### Premium Retainer - $1,497/month
- Everything above
- You join their negotiation calls (virtual)
- Quarterly contract template library updates
- "Done with you" contract negotiation

**Purpose:** High-margin revenue while SaaS scales. This is how you hit $16K fast.

---

# PART 3: REVENUE MATH

## Path to $16K/month (Quit Hillstone) - Month 6 Target

| Revenue Stream | Units | Price | Monthly |
|----------------|-------|-------|---------|
| Pro subscriptions | 150 | $39 | $5,850 |
| Team subscriptions | 25 | $79 | $1,975 |
| One-time reviews | 15 | $297 | $4,455 |
| Monthly retainers | 5 | $497 | $2,485 |
| **Total** | | | **$14,765** |

Add 2 more retainers or 30 more Pro users = $16K+

## Path to $60K/month - Month 12 Target

| Revenue Stream | Units | Price | Monthly |
|----------------|-------|-------|---------|
| Pro subscriptions | 600 | $39 | $23,400 |
| Team subscriptions | 100 | $79 | $7,900 |
| One-time reviews | 30 | $297 | $8,910 |
| Monthly retainers | 20 | $497 | $9,940 |
| Premium retainers | 5 | $1,497 | $7,485 |
| **Total** | | | **$57,635** |

This is conservative. Reality will vary but the structure works.

---

# PART 4: TECHNICAL BUILD (No-Code First, Code Later)

## Phase 1: Validate Before You Build (Week 1-2)

You're not building anything yet. You're validating demand.

### The Validation Test
1. Create a simple Carrd landing page ($19/year)
2. Headline: "Stop Signing Contracts That Screw You"
3. Subhead: "AI-powered contract analysis for subcontractors. Know what you're signing in 5 minutes."
4. Email capture: "Get early access + free contract review"
5. Price anchor: "Launching at $39/month - early subscribers get 50% off for life"

### Where to Post It
- r/electricians (310K members)
- r/Construction (180K members)
- r/HVAC (120K members)
- r/Plumbing (95K members)
- Facebook groups: "Subcontractor Support Network", "Construction Business Owners"
- LinkedIn: Subcontractor-focused hashtags

### What You're Looking For
- 100 email signups in 2 weeks = strong signal
- 50 email signups = moderate signal, proceed with caution
- <50 signups = pivot the messaging, try again

## Phase 2: Manual MVP (Week 3-4)

Don't build software. BE the software.

### The Concierge MVP
1. Email your waitlist: "Free contract review for first 10 people"
2. They email you a contract PDF
3. You use Claude (the AI) to analyze it
4. You format the output into a nice Google Doc
5. You email it back with a Loom video walking through it
6. You ask: "Would you pay $39/month for this?"

### What You Learn
- What clauses scare them most?
- What language do they use to describe problems?
- What would make them pay?
- What objections do they have?

### Tools for Manual MVP
- Claude.ai (free tier or $20/month Pro)
- Google Docs (free)
- Loom (free tier)
- Gmail (free)
- Calendly (free tier) for booking calls

## Phase 3: No-Code Build (Week 5-8)

Now you build the actual product. No-code first.

### Tech Stack (Total Cost: ~$100/month)
1. **Bubble.io** ($32/month) - Main application
2. **Claude API** (~$50/month at scale) - AI analysis
3. **Stripe** (2.9% + $0.30 per transaction) - Payments
4. **Make.com** ($9/month) - Automations
5. **Carrd** ($19/year) - Landing page

### Core Features to Build
1. User signup/login
2. PDF upload
3. Send PDF text to Claude API with analysis prompt
4. Display results in dashboard
5. Stripe payment integration
6. Usage tracking (contracts reviewed this month)

### The AI Prompt (Your Secret Sauce)

```
You are a construction contract analyst specializing in protecting subcontractors.

Analyze this contract and identify:

1. PAYMENT TERMS
- Pay-if-paid or pay-when-paid clauses
- Retainage percentage and release conditions
- Payment timeline and any delays built in
- Risk score for payment (1-10)

2. LIEN RIGHTS
- Lien waiver requirements
- Conditional vs unconditional waivers
- When waivers must be signed
- Risk score for lien rights (1-10)

3. INDEMNIFICATION
- Scope of indemnification
- Whether it's mutual or one-sided
- Insurance requirements
- Risk score (1-10)

4. CHANGE ORDERS
- Process for requesting changes
- Time limits for notification
- Approval requirements
- Risk score (1-10)

5. DISPUTE RESOLUTION
- Arbitration vs litigation
- Venue/location requirements
- Who pays legal fees
- Risk score (1-10)

6. TERMINATION
- Termination for convenience clauses
- Cure periods
- Payment upon termination
- Risk score (1-10)

For each issue found:
- Explain in plain English what it means
- Rate severity (Low/Medium/High/Critical)
- Provide specific alternative language to negotiate
- Give a script for how to bring this up with the GC

Overall contract risk score: X/100
Recommendation: [Sign as-is / Negotiate these points / Walk away]
```

## Phase 4: Code Version (Month 3-4)

Once you have paying customers and validated the product, rebuild in code for:
- Better performance
- Lower costs
- More customization
- Professional appearance

### Tech Stack for Code Version
- **Frontend:** Next.js + Tailwind CSS
- **Backend:** Next.js API routes
- **Database:** Supabase (free tier)
- **Auth:** Supabase Auth
- **AI:** Claude API (Anthropic)
- **Payments:** Stripe
- **Hosting:** Vercel (free tier)
- **PDF Processing:** pdf-parse library

I can build this entire stack with you using Claude Code.

---

# PART 5: GO-TO-MARKET STRATEGY

## Your ICP (Ideal Customer Profile)

**Primary ICP: The Growing Subcontractor**
- Trade: Electrical, HVAC, Plumbing, Concrete, Framing
- Revenue: $500K - $5M/year
- Employees: 5-25
- Location: US (start with Texas, Florida, California - biggest construction markets)
- Pain: Signs 5-20 contracts/month, got burned before, can't afford attorney for every contract
- Online: Facebook groups, Reddit, LinkedIn, trade association forums

**Secondary ICP: The Solo Operator**
- One-person subcontracting operation
- Revenue: $100K - $500K
- Pain: Does everything themselves, no time to read contracts carefully
- Price sensitive but desperate for help

## Channel Strategy

### Channel 1: Reddit (Free, High Intent)

**Subreddits to target:**
- r/electricians (310K) - Very active, lots of business questions
- r/Construction (180K) - General but good reach
- r/HVAC (120K) - Engaged community
- r/Plumbing (95K) - Active
- r/bluecollar (50K) - Broad but relevant
- r/smallbusiness (1.5M) - General but subcontractors there

**Strategy:**
1. Spend Week 1 just reading and understanding the community
2. Answer questions helpfully WITHOUT promoting yourself
3. Build karma and credibility
4. Share valuable content about contract pitfalls
5. After 2+ weeks of value, soft-mention your tool when relevant

**Example Post (after building credibility):**
```
Title: I analyzed 100 subcontractor contracts - here are the 5 clauses that screw you every time

Body: Been in construction for [X years/been helping subcontractors with contracts].
After reviewing hundreds of contracts, these are the patterns that keep showing up:

1. Pay-if-paid (what it means, why it's bad)
2. Unconditional lien waivers (explanation)
3. Broad indemnification (explanation)
4. 10%+ retainage with vague release terms
5. Change order notice periods under 7 days

What to do: (helpful advice)

I actually built a tool that flags these automatically if anyone's interested.
Happy to do free reviews for anyone who wants to test it.
```

### Channel 2: Facebook Groups (Free, High Trust)

**Groups to join:**
- "Subcontractors Network"
- "Construction Business Owners"
- "Electrical Contractors"
- Trade-specific groups in your target states

**Strategy:**
- Same as Reddit: value first, promote later
- Share horror stories (anonymized) about contract traps
- Offer free contract reviews to build testimonials
- Post wins: "Just helped a member avoid a $50K liability trap"

### Channel 3: LinkedIn (Free, Professional)

**Content Strategy:**
- Post 3-5x per week about subcontractor contract issues
- Share anonymized case studies
- Connect with subcontractors, construction lawyers, GCs
- Comment on construction industry posts

**Post Types:**
1. Educational: "What pay-if-paid really means for your cash flow"
2. Story: "A subcontractor called me crying yesterday..."
3. Tactical: "3 sentences to add to every contract you sign"
4. Social proof: "Just reviewed 50 contracts this month, here's what I found"

### Channel 4: Cold Outreach (Free, Direct)

**Find Subcontractors:**
1. Google "[trade] contractor [city]"
2. Check their reviews - busy contractors sign lots of contracts
3. Find owner on LinkedIn
4. Send personalized connection request

**Cold Message Template:**
```
Hey [Name],

Saw you're running [Company] in [City] - looks like you're doing great work based on your reviews.

Quick question: how do you currently review the contracts GCs send you?

I ask because I built a tool that analyzes subcontractor contracts for dangerous clauses (pay-if-paid, lien waivers, etc). Takes 5 minutes instead of paying an attorney $500.

Happy to run your next contract through it for free if you want to test it.

Either way, keep killing it.

[Your name]
```

### Channel 5: Partnerships (Leveraged)

**Partner Types:**
1. **Construction Accountants/Bookkeepers** - They see the payment problems
2. **Surety Bond Agents** - They care about contractor financial health
3. **Trade Associations** - NECA (electrical), PHCC (plumbing), ACCA (HVAC)
4. **Construction Lawyers** - Referral for clients who can't afford full representation
5. **Lien Service Companies** - Complementary service

**Partnership Pitch:**
```
"I help your subcontractor clients avoid contract disasters before they happen.
You help them after. We should talk about referrals."
```

### Channel 6: Content Marketing (Long-term)

**Blog Posts to Write:**
1. "The Subcontractor's Guide to Pay-if-Paid Clauses"
2. "5 Lien Waiver Mistakes That Cost Subcontractors Millions"
3. "How to Negotiate Retainage Terms (Scripts Included)"
4. "Red Flags in GC Contracts: A Checklist"
5. "[State] Subcontractor Rights: What You Need to Know"

**SEO Keywords to Target:**
- "subcontractor contract review"
- "pay if paid clause"
- "construction contract red flags"
- "subcontractor lien rights"
- "GC contract negotiation"

---

# PART 6: THE 90-DAY SPRINT

## Week 1-2: Validation

### Week 1 Tasks
- [ ] Create Carrd landing page
- [ ] Write compelling headline and copy
- [ ] Set up email capture (ConvertKit free tier)
- [ ] Join 5 Reddit communities (lurk, don't post)
- [ ] Join 5 Facebook groups (lurk, don't post)
- [ ] Create LinkedIn profile optimized for construction/contracts
- [ ] Research 20 subcontractor contracts online to understand patterns

### Week 2 Tasks
- [ ] Start engaging on Reddit (helpful comments only)
- [ ] Start engaging in Facebook groups (value only)
- [ ] Post landing page link in your profiles (not spamming)
- [ ] Reach out to 10 subcontractors for informal conversations
- [ ] Ask: "How do you currently review contracts?"
- [ ] Track email signups daily

**Week 2 Checkpoint:** 50+ email signups? Proceed. Under 50? Revise messaging and try again.

## Week 3-4: Concierge MVP

### Week 3 Tasks
- [ ] Email waitlist: "Free contract review for first 10 people"
- [ ] Set up Claude.ai Pro ($20/month) for analysis
- [ ] Create Google Doc template for results
- [ ] Record first Loom walkthrough video
- [ ] Complete 5 free contract reviews
- [ ] Collect feedback after each one
- [ ] Ask: "Would you pay $39/month for this?"

### Week 4 Tasks
- [ ] Complete 5 more free reviews (10 total)
- [ ] Refine your analysis process based on feedback
- [ ] Identify the 3 most common contract issues
- [ ] Create FAQ document from questions asked
- [ ] Start conversations about paid service
- [ ] Offer $297 one-time review to waitlist

**Week 4 Checkpoint:** At least 2 people willing to pay? Proceed. Nobody? Dig into objections.

## Week 5-8: Build the Product

### Week 5 Tasks
- [ ] Sign up for Bubble.io
- [ ] Complete Bubble basics tutorial (YouTube)
- [ ] Set up Stripe account
- [ ] Set up Anthropic API account (for Claude)
- [ ] Map out basic user flow on paper
- [ ] Start building signup/login

### Week 6 Tasks
- [ ] Build PDF upload functionality
- [ ] Connect to Claude API
- [ ] Build basic results display
- [ ] Test with 3 contracts from your concierge phase
- [ ] Fix obvious bugs

### Week 7 Tasks
- [ ] Add Stripe payment integration
- [ ] Create pricing page
- [ ] Add usage tracking
- [ ] Build basic dashboard
- [ ] Test full flow 10 times

### Week 8 Tasks
- [ ] Beta launch to email list
- [ ] Offer founding member pricing (50% off for life)
- [ ] Goal: 20 paying customers at $19.50/month
- [ ] Collect feedback aggressively
- [ ] Fix critical bugs within 24 hours

**Week 8 Checkpoint:** 20 paying customers? Proceed. Under 10? Something's wrong with product/market fit.

## Week 9-12: Scale to $5K MRR

### Week 9 Tasks
- [ ] Implement top 3 feature requests
- [ ] Create onboarding email sequence
- [ ] Write 2 blog posts for SEO
- [ ] Increase Reddit/Facebook posting frequency
- [ ] Start LinkedIn content (3x/week)
- [ ] Launch one-time review service ($297)

### Week 10 Tasks
- [ ] Reach out to 5 potential partners
- [ ] Guest on 1 construction podcast (research and pitch)
- [ ] Create first case study from successful customer
- [ ] Add testimonials to landing page
- [ ] Optimize pricing page based on data
- [ ] Target: 50 total paying users

### Week 11 Tasks
- [ ] Launch monthly retainer service ($497)
- [ ] Hire first VA for customer support ($5/hour, 10 hours/week)
- [ ] Automate onboarding with email sequences
- [ ] Create help documentation
- [ ] Write 2 more blog posts
- [ ] Target: 75 total paying users

### Week 12 Tasks
- [ ] Full public launch (remove "beta" label)
- [ ] Launch Team tier ($79)
- [ ] Press outreach to construction publications
- [ ] Trade association partnership pitches
- [ ] Monthly review: what's working, what's not
- [ ] Target: 100 total paying users

**Week 12 Checkpoint:**
- 100 Pro users × $39 = $3,900 MRR
- 10 Team users × $79 = $790 MRR
- 5 one-time reviews × $297 = $1,485
- 2 retainers × $497 = $994
- **Total: ~$7,169 MRR + one-time revenue**

You're not at $16K yet, but you have a real business with real customers and real momentum.

---

# PART 7: MONTH 4-6 (PATH TO $16K)

## Key Activities

### Double Down on What Works
By month 3, you'll know which channels drive customers. Could be:
- Reddit (likely highest quality)
- Facebook groups (likely highest volume)
- LinkedIn (likely highest ticket)
- Partnerships (likely highest leverage)

Put 80% of effort into top 2 channels.

### Scale Service Revenue
Service revenue is faster than SaaS revenue. To hit $16K:

**Conservative Mix:**
- 150 Pro × $39 = $5,850
- 25 Team × $79 = $1,975
- 10 one-time × $297 = $2,970
- 10 retainers × $497 = $4,970
- **Total: $15,765**

**How to Get 10 Retainers:**
1. Every one-time review customer gets an upsell pitch
2. Every Pro user with 5+ reviews/month gets a retainer pitch
3. Direct outreach to larger subcontractors (>$1M revenue)
4. Partner referrals (accountants, lawyers)

### Build Systems
- Hire 2nd VA for concierge reviews
- Create templates for everything
- Automate customer onboarding
- Set up proper bookkeeping
- Document all processes

### Raise Prices
After 200 customers and solid testimonials:
- Pro: $39 → $49 (grandfather existing)
- Team: $79 → $99 (grandfather existing)
- One-time: $297 → $397
- Retainer: $497 → $697

---

# PART 8: MONTH 7-12 (PATH TO $60K)

## The Scaling Playbook

### Hire Your First Real Employee
At $20K MRR, hire a part-time contractor for:
- Customer support
- Concierge reviews
- Content creation

Cost: $2-3K/month
Frees you for: Sales, partnerships, product

### Launch Premium Retainer ($1,497)
For subcontractors doing $2M+/year:
- Everything in regular retainer
- You attend their GC negotiations (virtually)
- Quarterly contract template library
- On-call support

**Target: 5-10 premium retainers = $7,500-15,000/month**

### Geographic Expansion
Start with your best-performing state, then expand:
1. Texas (huge construction market)
2. Florida (growing fast)
3. California (complex regulations = more need)
4. Arizona, Georgia, North Carolina (growth markets)

Customize marketing for state-specific lien laws and requirements.

### Trade Association Partnerships
Big unlock potential:
- NECA (National Electrical Contractors Association)
- PHCC (Plumbing-Heating-Cooling Contractors Association)
- ACCA (Air Conditioning Contractors of America)
- ABC (Associated Builders and Contractors)

**Partnership structure:**
- They promote to members
- Members get 20% discount
- You pay 10-20% referral fee

One trade association partnership could add 100+ customers overnight.

### Product Expansion
Based on customer feedback, add:
- Contract template library ($19/month add-on)
- Lien deadline tracker ($9/month add-on)
- Payment tracking integration
- GC reputation database

### Content Moat
By month 12, you should have:
- 50+ blog posts ranking for subcontractor keywords
- Email list of 5,000+ subcontractors
- YouTube channel with contract breakdown videos
- Podcast appearances on construction shows

This becomes your moat - competitors can't easily replicate.

---

# PART 9: MINDSET & EXECUTION

## The Mental Game

### You Will Want to Quit
There will be a moment - probably around week 6-8 - when:
- Nobody's responding to your posts
- Your first customers find bugs
- You're exhausted and still working at Hillstone
- A competitor launches something similar
- Someone tells you this will never work

**This is the filter.** Everyone faces this. Winners push through.

### Imposter Syndrome is Coming
"Who am I to charge for contract advice? I'm not a lawyer."

Answer: You're not giving legal advice. You're using AI to flag potential issues and help them ask better questions. You're a guide, not an attorney.

Doctors have WebMD. Lawyers have LegalZoom. Subcontractors will have SubShield.

### Speed Beats Perfection
Your Bubble.io product will be ugly. Your first blog posts will be mediocre. Your cold outreach will get rejected.

**Ship anyway.**

A working product in customers' hands beats a perfect product in your head.

### The Numbers Don't Lie
Track weekly:
- Email signups
- Conversion rate (signup → trial → paid)
- MRR
- Churn rate
- Customer feedback themes

Make decisions based on data, not feelings.

## Daily Habits

### While Still at Hillstone
- **Morning (before work):** 1 hour of focused building/marketing
- **Commute:** Listen to construction industry podcasts, indie hacker podcasts
- **Breaks:** Answer customer questions, check metrics
- **Evening (after work):** 2-3 hours of focused work
- **Weekend:** 8-10 hours of focused work

**Total: 25-30 hours/week on SubShield**

### After Quitting Hillstone
- **Morning:** Customer calls, concierge reviews (high-value work)
- **Midday:** Product improvements, content creation
- **Afternoon:** Marketing, outreach, partnerships
- **Evening:** Learning, planning, admin

---

# PART 10: RESOURCE LIBRARY

## Tools You'll Use

### Free Tier
- Carrd ($19/year) - Landing page
- ConvertKit (free) - Email capture
- Calendly (free) - Scheduling
- Loom (free) - Video walkthroughs
- Google Docs (free) - Templates
- Notion (free) - Documentation
- Claude.ai (free tier) - Initial analysis testing

### Paid (After Validation)
- Bubble.io ($32/month) - App building
- Claude API (~$50-100/month) - AI analysis
- ConvertKit paid ($29/month) - Email marketing
- Stripe (2.9% + $0.30) - Payments

### Growth Phase
- Make.com ($9/month) - Automations
- Supabase (free to $25/month) - Database
- Vercel (free) - Hosting
- Crisp (free to $25/month) - Customer chat

## Learning Resources

### Construction Contracts
- "Quit Getting Screwed" by Karalynn Cromeens (read this ASAP)
- "Construction Law for Design Professionals, Construction Managers and Contractors" - Reference
- State-specific lien law guides (Google "[state] mechanic's lien law")

### No-Code Development
- Bubble.io official tutorials
- YouTube: "Bubble.io crash course"
- BuildCamp Bubble course (if needed)

### Sales & Marketing
- "The Mom Test" by Rob Fitzpatrick (customer conversations)
- "$100M Offers" by Alex Hormozi (offer creation)
- "Traction" by Gabriel Weinberg (marketing channels)

### Indie Hacking
- IndieHackers.com (community, case studies)
- "The Minimalist Entrepreneur" by Sahil Lavingia
- My First Million podcast (inspiration, tactics)

## Templates & Scripts

### Cold Outreach Template (LinkedIn)
```
Hey [Name],

Noticed you're running [Company] in [City] - your work on [specific project or review mention] looks solid.

Quick question: how do you currently handle contract review when a GC sends over paperwork?

I built a tool that scans subcontractor contracts for dangerous clauses (pay-if-paid, lien waivers, indemnification traps) in about 5 minutes.

Happy to run your next contract through it free - no strings attached.

[Your name]
```

### Follow-up Template (After Free Review)
```
Hey [Name],

Hope the contract review was helpful. Did you end up negotiating any of those clauses with [GC name]?

Quick thing - I'm launching the full product next month. Early supporters get 50% off for life ($19.50/month instead of $39).

Want me to put you on the list?

[Your name]
```

### Service Upsell Template
```
Hey [Name],

Noticed you've been using SubShield pretty heavily - looks like you've reviewed [X] contracts this month.

For subcontractors doing your volume, we have a monthly retainer option that might make sense:

- Unlimited reviews with my personal oversight
- Direct text/email access when something urgent comes up
- Monthly 30-min strategy call
- Same-day turnaround

It's $497/month, and most retainer clients tell me it's paid for itself after one avoided disaster.

Want to hop on a quick call to see if it makes sense?

[Your name]
```

### Testimonial Request Template
```
Hey [Name],

Really glad SubShield has been helpful for [specific thing they mentioned].

Quick favor - would you be willing to write a 2-3 sentence testimonial about your experience? It really helps other subcontractors trust that this is legit.

Even something simple like:

"Before SubShield, I [problem]. Now I [solution]. It's [benefit]."

Totally understand if you're too busy - either way, thanks for being an early customer.

[Your name]
```

---

# PART 11: WHAT SUCCESS LOOKS LIKE

## Month 3 Checkpoint
- 50+ paying customers
- $2-3K MRR
- Product works reliably
- 2-3 strong testimonials
- 1 marketing channel clearly working
- First service revenue ($500-1000)

## Month 6 Checkpoint (Hillstone Freedom)
- 200+ paying customers
- $10-16K MRR (combination of SaaS + services)
- Hired first VA
- Multiple marketing channels working
- Partnership conversations happening
- **PUT IN YOUR NOTICE**

## Month 9 Checkpoint
- 400+ paying customers
- $25-35K MRR
- Premium retainer clients
- Part-time employee hired
- Trade association partnership signed
- Recognized name in subcontractor communities

## Month 12 Checkpoint
- 700+ paying customers
- $50-60K MRR
- Multiple revenue streams
- Team of 2-3 people
- Strong SEO presence
- Path to $100K MRR visible

---

# PART 12: YOUR FIRST 24 HOURS

## Right Now (Hour 0)
1. Create a Google Doc titled "SubShield Customer Research"
2. Write down everything you think you know about subcontractor pain points
3. Set up a free ConvertKit account
4. Buy the domain subshield.io or subshield.app ($12)

## Tomorrow Morning (Hours 1-4)
1. Create Carrd landing page
   - Headline: "Stop Signing Contracts That Screw You"
   - Subhead: "AI-powered contract analysis for subcontractors. Know what you're signing in 5 minutes."
   - Email capture with: "Get early access + free contract review"
   - Connect to ConvertKit

2. Create accounts:
   - Reddit account (don't post yet)
   - Join r/electricians, r/Construction, r/HVAC, r/Plumbing
   - Facebook (if needed)
   - Join 3-5 subcontractor groups

## Tomorrow Afternoon (Hours 5-8)
1. Read 20 posts on r/electricians about business/contracts/GCs
2. Note the language they use
3. Note the problems they describe
4. Find 5 subcontractors on LinkedIn in your city
5. Read "Quit Getting Screwed" introduction on Amazon preview

## End of Day 1
- Landing page live
- Email capture working
- Understand the community tone
- Have 5 potential people to reach out to
- Clear on Week 1 tasks

---

# THE FINAL WORD

You're not building a software company.

You're building a vehicle to freedom.

The software is a tool. The services are a tool. The marketing is a tool.

The goal is:
1. Quit Hillstone ($16K/month)
2. Retire your parents ($60K/month)
3. Build generational wealth ($100K+/month)

SubShield is how you get there. But YOU are the engine.

No one is coming to save you. No one is going to build this for you. The path is laid out. The market is waiting. The tools exist.

The only variable is you.

Let's go.

---

*Document created: January 2025*
*Author: Your AI co-founder*
*Purpose: The only business plan you'll ever need*
