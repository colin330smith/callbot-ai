# SubShield Operations Workflow

## When a Customer Pays

### 1. You Get Notified
- Stripe emails you immediately
- Customer info: name, email, address

### 2. Send Intake Email (within 1 hour)

**Subject:** SubShield - Ready to Analyze Your Contract

```
Hi [First Name],

Thanks for your order! I'm ready to analyze your contract.

Please reply to this email with:
1. Your contract (PDF, Word, or photos of pages)
2. Your trade (electrical, plumbing, HVAC, concrete, etc.)
3. The state where the project is located
4. Contract value (if you're comfortable sharing - helps with context)

I'll have your risk analysis report back within 24 hours.

Questions? Just reply to this email.

- Colin
SubShield
```

### 3. Receive Contract

When they reply:
- Save contract to secure folder: `Contracts/[Date]-[CustomerLastName]/`
- Note the trade, state, and value

### 4. Run Analysis

1. Open Claude (claude.ai or Claude app)
2. Open `CONTRACT_ANALYSIS_PROMPT.md`
3. Copy everything below the `---` line
4. Fill in customer info at the top
5. Paste the contract text (copy from PDF or use PDF-to-text)
6. Send to Claude
7. Review Claude's output for accuracy
8. Copy into `REPORT_TEMPLATE.md` format

### 5. Quality Check

Before sending, verify:
- [ ] Customer name spelled correctly
- [ ] State is correct
- [ ] All sections are filled in
- [ ] Risk scores make sense
- [ ] Negotiation scripts are specific (not generic)
- [ ] Disclaimer is included
- [ ] No obvious errors

### 6. Deliver Report

**Subject:** Your SubShield Contract Analysis Report

```
Hi [First Name],

Your contract risk analysis is attached.

**Quick Summary:**
- Risk Score: [X]/10
- Top Issue: [One sentence]
- Recommendation: [Sign as-is / Negotiate first / etc.]

The full report includes clause-by-clause analysis and word-for-word negotiation scripts you can use with the GC.

Questions about anything in the report? Just reply - clarifications are included at no extra charge.

Good luck with the project.

- Colin
SubShield
```

Attach: Report as PDF (export from Markdown or Google Docs)

### 7. File Management

- Move contract to `Contracts/Completed/[Date]-[CustomerLastName]/`
- Save final report in same folder
- Delete after 30 days (per privacy policy)

---

## Time Estimates

| Task | Time |
|------|------|
| Send intake email | 2 min |
| Run Claude analysis | 5-10 min |
| Review and format report | 15-20 min |
| Quality check | 5 min |
| Send delivery email | 2 min |
| **Total per contract** | **30-40 min** |

At $147/contract, that's ~$220-295/hour of your time.

---

## Edge Cases

### Contract is an image/photo
- Use Google Lens or online OCR to extract text
- Or manually transcribe key sections
- May take longer - still deliver within 24 hours

### Contract is 50+ pages
- Focus on: Payment, Indemnification, Change Orders, Disputes
- Note in report that you analyzed key risk sections
- Still deliver within 24 hours

### Customer asks follow-up questions
- Answer via email at no charge (builds goodwill + referrals)
- If they want a full re-analysis of a revised contract, that's a new order

### Customer complains about report quality
- Offer to clarify any sections
- If legitimately wrong, fix it immediately
- Refund if they're still unhappy (rare, protects reputation)

---

## Tools Needed

1. **Claude** - claude.ai or Claude app (you're already using this)
2. **Email** - Gmail or whatever you use
3. **PDF viewer** - to read contracts
4. **Google Docs or Markdown editor** - to format reports
5. **Secure storage** - Google Drive with 2FA, or similar

---

## Daily Routine (Once You Have Volume)

**Morning:**
- Check Stripe for overnight orders
- Send intake emails
- Start analyses for contracts received yesterday

**Afternoon:**
- Finish and deliver reports
- Answer customer questions

**Target:** Process 3-5 contracts per day = $440-735/day = $10-15K/month

---
