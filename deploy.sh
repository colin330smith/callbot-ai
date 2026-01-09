#!/bin/bash
# CallBot AI - Automated Deployment Script
# This script handles complete production deployment

set -e

echo "=========================================="
echo "  CallBot AI - Production Deployment"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Generate secure secrets
generate_secret() {
    openssl rand -hex 32
}

# Check required tools
echo -e "\n${YELLOW}Checking required tools...${NC}"
command -v railway >/dev/null 2>&1 || { echo -e "${RED}Railway CLI not found. Install with: npm install -g @railway/cli${NC}"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo -e "${RED}Docker not found${NC}"; exit 1; }

echo -e "${GREEN}✓ All required tools found${NC}"

# Generate production secrets
echo -e "\n${YELLOW}Generating production secrets...${NC}"
SECRET_KEY=$(generate_secret)
DB_PASSWORD=$(generate_secret)
WEBHOOK_SECRET="whsec_$(generate_secret)"

echo -e "${GREEN}✓ Secrets generated${NC}"

# Create production .env file
echo -e "\n${YELLOW}Creating production environment file...${NC}"
cat > .env.production << EOF
# CallBot AI Production Environment
# Generated: $(date)

# Application
ENVIRONMENT=production
SECRET_KEY=${SECRET_KEY}
BASE_URL=\${RAILWAY_STATIC_URL:-https://callbotai.com}

# Database (Railway provides this)
DATABASE_URL=\${DATABASE_URL}

# Redis (Railway provides this)
REDIS_URL=\${REDIS_URL}

# Vapi Voice AI - SET THESE
VAPI_API_KEY=your-vapi-api-key
VAPI_ASSISTANT_ID=your-vapi-assistant-id
VAPI_PHONE_NUMBER_ID=your-vapi-phone-number-id

# Stripe Payments - SET THESE
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_key
STRIPE_WEBHOOK_SECRET=${WEBHOOK_SECRET}
STRIPE_STARTER_PRICE_ID=price_starter
STRIPE_GROWTH_PRICE_ID=price_growth
STRIPE_AGENCY_PRICE_ID=price_agency

# Email (Resend recommended)
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_your_key
FROM_EMAIL=noreply@callbotai.com
FROM_NAME=CallBot AI

# SMS (Twilio)
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+15551234567

# Security
RATE_LIMIT_ENABLED=true
CSRF_ENABLED=true
ALLOWED_HOSTS=callbotai.com,www.callbotai.com

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json
SERVICE_NAME=callbotai
EOF

echo -e "${GREEN}✓ Production environment file created: .env.production${NC}"

# Deploy to Railway
echo -e "\n${YELLOW}Deploying to Railway...${NC}"
echo "This will create a new Railway project with PostgreSQL and Redis"

cd "$(dirname "$0")"

# Check if logged into Railway
if ! railway whoami >/dev/null 2>&1; then
    echo -e "${YELLOW}Please login to Railway:${NC}"
    railway login
fi

# Initialize or link project
if [ ! -f ".railway" ] && [ ! -d ".railway" ]; then
    echo -e "${YELLOW}Creating new Railway project...${NC}"
    railway init --name callbot-ai
fi

# Add PostgreSQL
echo -e "${YELLOW}Adding PostgreSQL database...${NC}"
railway add --plugin postgresql || true

# Add Redis
echo -e "${YELLOW}Adding Redis...${NC}"
railway add --plugin redis || true

# Set environment variables
echo -e "${YELLOW}Setting environment variables...${NC}"
railway variables set SECRET_KEY="${SECRET_KEY}"
railway variables set ENVIRONMENT=production
railway variables set LOG_LEVEL=INFO
railway variables set RATE_LIMIT_ENABLED=true

# Deploy
echo -e "${YELLOW}Deploying application...${NC}"
railway up --detach

# Get deployment URL
echo -e "\n${GREEN}=========================================="
echo "  Deployment Complete!"
echo "==========================================${NC}"
echo ""
railway status
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Set your API keys in Railway dashboard:"
echo "   - VAPI_API_KEY"
echo "   - STRIPE_SECRET_KEY"
echo "   - RESEND_API_KEY (or SMTP settings)"
echo ""
echo "2. Configure webhooks:"
echo "   - Vapi webhook: https://YOUR_URL/api/webhooks/vapi"
echo "   - Stripe webhook: https://YOUR_URL/api/webhooks/stripe"
echo ""
echo "3. Run database migrations:"
echo "   railway run python -c \"from database_postgres import init_db; import asyncio; asyncio.run(init_db())\""
echo ""
echo -e "${GREEN}Your app is deploying! Check status with: railway status${NC}"
