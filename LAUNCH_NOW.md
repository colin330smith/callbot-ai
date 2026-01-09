# CallBotAI - LAUNCH NOW CHECKLIST

## What We Built
- AI Phone Agent system using Vapi
- Landing page at $497/month pricing
- Backend with Stripe, Twilio, email notifications
- 50 real prospects in Austin (HVAC, Plumbers, Lawyers, Dentists, Med Spas, Auto Repair, Contractors)
- Cold outreach scripts (email, cold call, LinkedIn)

---

## STEP 1: Get Your API Keys (30 min)

### Vapi AI (Voice Agent)
1. Go to https://vapi.ai
2. Sign up for account
3. Get API key from Dashboard → API Keys
4. Cost: ~$0.07-0.15/minute of calls

### Stripe (Payments)
1. Go to https://stripe.com
2. Create account or login
3. Get API keys from Developers → API Keys
4. Get webhook secret after creating webhook endpoint

### Twilio (Optional - SMS notifications)
1. Go to https://twilio.com
2. Create account
3. Get Account SID and Auth Token
4. Buy a phone number (~$1/month)

### Gmail App Password (Email notifications)
1. Go to Google Account → Security
2. Enable 2-Factor Authentication
3. Go to App Passwords → Create new
4. Use this as SMTP_PASS

---

## STEP 2: Deploy Backend (15 min)

### Option A: Railway (Recommended - Free tier)
```bash
cd /Users/colinsmith/leadgen-agency/ai-phone-agency
railway login
railway init
railway up
```
Then set environment variables in Railway dashboard.

### Option B: Local Testing
```bash
cd /Users/colinsmith/leadgen-agency/ai-phone-agency
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API keys
uvicorn backend.main:app --reload --port 8000
```

Open http://localhost:8000 to see landing page.

---

## STEP 3: Test the Voice Agent (15 min)

1. Go to Vapi dashboard
2. Create a test assistant manually using our template:
   - Open `agents/verticals/hvac.json`
   - Copy the systemPrompt
   - Create assistant in Vapi with GPT-4o + 11Labs voice
3. Use Vapi's phone widget to test call the agent
4. Verify it sounds good and handles calls correctly

---

## STEP 4: START OUTREACH NOW (The rest of today)

### Your 50 Prospects Are Ready
File: `outreach/prospects.csv`

### Priority Order (Highest pain = fastest sale):
1. **Personal Injury Lawyers** (9 prospects) - Need 24/7 intake, highest ticket
2. **HVAC Companies** (7 prospects) - Emergency calls, seasonal urgency
3. **Plumbers** (7 prospects) - Same as HVAC
4. **Dentists** (8 prospects) - High volume appointments
5. **Med Spas** (9 prospects) - Consultation bookings
6. **Auto Repair** (7 prospects) - Appointments + emergencies
7. **Contractors** (3 prospects) - Quote requests

### Cold Call Script
Open: `outreach/email_templates.md` (scroll to Cold Call Script section)

Key opener:
> "Hi, is this [Name]? Great, this is [Your name]. I'll be quick because I know you're busy. I help [industry] businesses stop losing customers to voicemail. Can I ask you a quick question?"

### Email Templates
Also in `outreach/email_templates.md`

Subject line that works:
> "Quick question about [Business Name]'s phones"

---

## STEP 5: Book Demo Calls

When they say "interested":
1. Send Calendly link (or set up call manually)
2. Prepare 15-min demo:
   - Show them calling the AI agent live
   - Explain how notifications work
   - Walk through pricing ($497/mo, first month free trial)

### Demo Script:
1. "Let me show you how this works - I'll call the agent right now"
2. [Make test call, let them hear it]
3. "When someone calls, you get a text + email within 30 seconds with the caller's info and what they need"
4. "It's $497/month - less than $17/day. If it catches just one call you would've missed, it's paid for itself"
5. "Want to try it free for 7 days?"

---

## STEP 6: Close the Sale

### Handling "How much?"
> "$497/month - less than $17/day. But here's how to think about it: if it catches just ONE extra lead per month that you would have missed, it's paid for itself 3-4x over."

### Handling "I need to think about it"
> "Totally understand. How about this - let me set up a free 7-day trial so you can see the results before you decide. No credit card, no commitment."

### Handling "I'm not interested"
> "No problem at all. Mind if I ask - is it because you're not missing calls, or something else?"

---

## Revenue Math

| Clients | MRR | Annual |
|---------|-----|--------|
| 2 | $994 | $11,928 |
| 10 | $4,970 | $59,640 |
| 50 | $24,850 | $298,200 |
| 100 | $49,700 | $596,400 |
| 200 | $99,400 | $1,192,800 |

**Target: 200 clients = ~$100k MRR**

---

## TODAY'S TARGETS

- [ ] Deploy backend (test locally at minimum)
- [ ] Make 20+ cold calls
- [ ] Send 20+ cold emails
- [ ] Book at least 1 demo call
- [ ] Update prospects.csv with results

---

## File Locations

```
/Users/colinsmith/leadgen-agency/ai-phone-agency/
├── agents/
│   ├── base_agent.json          # Universal AI agent template
│   └── verticals/
│       ├── lawyer_pi.json       # Personal injury lawyer agent
│       ├── hvac.json            # HVAC company agent
│       └── medspa.json          # Med spa agent
├── backend/
│   └── main.py                  # FastAPI server
├── website/
│   └── index.html               # Landing page
├── outreach/
│   ├── email_templates.md       # All outreach scripts
│   ├── prospects.csv            # 50 prospects ready to contact
│   └── prospect_scraper.py      # Tool to add more prospects
├── requirements.txt
├── .env.example
├── Dockerfile
└── railway.json
```

---

## EXECUTE NOW

Stop reading. Start calling.

First call: **Loewy Law Firm** - (512) 280-0800
- Personal injury lawyer
- High ticket, needs 24/7 intake
- Pain point: missing calls = missing cases

GO.
