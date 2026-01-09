# CallBot AI - Launch Checklist

## Pre-Launch Checklist

### Environment Configuration
- [ ] Set production environment variables in `.env`:
  - [ ] `ENVIRONMENT=production`
  - [ ] `SECRET_KEY` - Generate with `openssl rand -hex 32`
  - [ ] `BASE_URL` - Your production URL
  - [ ] `DATABASE_URL` - Production PostgreSQL connection
  - [ ] `REDIS_URL` - Production Redis connection

### Stripe Setup
- [ ] Create Stripe products and prices in dashboard:
  - [ ] Starter Plan - $297/month (set `STRIPE_STARTER_PRICE_ID`)
  - [ ] Growth Plan - $497/month (set `STRIPE_GROWTH_PRICE_ID`)
  - [ ] Agency Plan - $997/month (set `STRIPE_AGENCY_PRICE_ID`)
- [ ] Configure Stripe webhook endpoint: `https://yourapp.com/api/webhooks/stripe`
- [ ] Set `STRIPE_WEBHOOK_SECRET`
- [ ] Test checkout flow in test mode

### Vapi Setup
- [ ] Create Vapi account at https://vapi.ai
- [ ] Set `VAPI_API_KEY`
- [ ] Create and configure assistant
- [ ] Set `VAPI_ASSISTANT_ID`
- [ ] Purchase phone number and set `VAPI_PHONE_NUMBER_ID`
- [ ] Configure Vapi webhook: `https://yourapp.com/api/webhooks/vapi`

### Email Configuration
- [ ] Configure email provider (Resend, SendGrid, or SMTP)
- [ ] Set FROM_EMAIL to verified sender
- [ ] Test magic link authentication flow

### SMS Configuration (Growth/Agency Plans)
- [ ] Create Twilio account
- [ ] Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- [ ] Test SMS sending

### Database
- [ ] Run migrations: `psql -f init.sql && psql -f migrations_v2.sql`
- [ ] Verify all tables created
- [ ] Set up database backups

### Security
- [ ] Enable HTTPS (use reverse proxy like nginx or Cloudflare)
- [ ] Set `ALLOWED_HOSTS` for production domains
- [ ] Enable rate limiting: `RATE_LIMIT_ENABLED=true`
- [ ] Enable CSRF: `CSRF_ENABLED=true`

### Testing
- [ ] Run test suite: `pytest tests/ -v`
- [ ] Test signup flow end-to-end
- [ ] Test AI call answering
- [ ] Test appointment booking
- [ ] Test dashboard functionality
- [ ] Test billing/subscription flow

## Launch Day

### Deployment
- [ ] Deploy backend to production server
- [ ] Deploy frontend/website files
- [ ] Verify health check: `curl https://yourapp.com/health`
- [ ] Test all critical flows

### Monitoring
- [ ] Set up error monitoring (Sentry, LogTail, etc.)
- [ ] Configure uptime monitoring
- [ ] Set up Slack/email alerts for errors

### Marketing
- [ ] Announce launch on social media
- [ ] Send email to waitlist
- [ ] Enable Google Analytics (optional)

## Post-Launch

### Week 1
- [ ] Monitor error logs daily
- [ ] Respond to customer support
- [ ] Track conversion rates
- [ ] Gather user feedback

### Month 1
- [ ] Analyze usage metrics
- [ ] Identify top feature requests
- [ ] Plan next development sprint

---

## Quick Start Commands

```bash
# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn main_production:app --reload --host 0.0.0.0 --port 8000

# Run production server
uvicorn main_production:app --host 0.0.0.0 --port 8000 --workers 4

# Run tests
pytest tests/ -v

# Check syntax of all files
python -m py_compile *.py
```

## Support

- Documentation: /docs
- Support Email: support@callbotai.com
- GitHub Issues: [Your repo URL]

---

**Version:** 2.0.0
**Last Updated:** January 2025
