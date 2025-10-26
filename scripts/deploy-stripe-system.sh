#!/bin/bash

# Stripe Payment System Deployment Script
# This script deploys the Supabase Edge Function and runs the database migration

set -e  # Exit on error

echo "🚀 Deploying Stripe Payment System..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found. Please install it first:${NC}"
    echo "   npm install -g supabase"
    exit 1
fi

echo -e "${GREEN}✅ Supabase CLI found${NC}"
echo ""

# Check if logged in
echo -e "${YELLOW}Checking Supabase login...${NC}"
if ! supabase projects list &> /dev/null; then
    echo -e "${RED}❌ Not logged in to Supabase. Please run:${NC}"
    echo "   supabase login"
    exit 1
fi

echo -e "${GREEN}✅ Logged in to Supabase${NC}"
echo ""

# Get project ID
echo -e "${YELLOW}Please enter your Supabase Project ID:${NC}"
read -p "Project ID: " PROJECT_ID

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ Project ID is required${NC}"
    exit 1
fi

# Link project
echo ""
echo -e "${YELLOW}Linking to project $PROJECT_ID...${NC}"
supabase link --project-ref $PROJECT_ID

echo -e "${GREEN}✅ Project linked${NC}"
echo ""

# Deploy Edge Function
echo -e "${YELLOW}Deploying Edge Function: create-payment-intent...${NC}"
supabase functions deploy create-payment-intent

echo -e "${GREEN}✅ Edge Function deployed${NC}"
echo ""

# Set Stripe Secret Key
echo -e "${YELLOW}Setting up Stripe Secret Key...${NC}"
echo -e "${YELLOW}Please enter your Stripe SECRET KEY (starts with sk_test_ or sk_live_):${NC}"
read -sp "Stripe Secret Key: " STRIPE_SECRET_KEY
echo ""

if [ -z "$STRIPE_SECRET_KEY" ]; then
    echo -e "${RED}❌ Stripe Secret Key is required${NC}"
    exit 1
fi

if [[ ! "$STRIPE_SECRET_KEY" =~ ^sk_(test|live)_ ]]; then
    echo -e "${RED}❌ Invalid Stripe Secret Key format. Must start with sk_test_ or sk_live_${NC}"
    exit 1
fi

supabase secrets set STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY --project-ref $PROJECT_ID

echo -e "${GREEN}✅ Stripe Secret Key set${NC}"
echo ""

# Run database migration
echo -e "${YELLOW}Running database migration...${NC}"
supabase db push --project-ref $PROJECT_ID

echo -e "${GREEN}✅ Database migration applied${NC}"
echo ""

# Verify deployment
echo -e "${YELLOW}Verifying deployment...${NC}"
echo ""

echo -e "${YELLOW}Edge Functions:${NC}"
supabase functions list

echo ""
echo -e "${YELLOW}Secrets:${NC}"
supabase secrets list --project-ref $PROJECT_ID

echo ""
echo -e "${GREEN}✅ ====================================${NC}"
echo -e "${GREEN}✅  STRIPE SYSTEM DEPLOYED!${NC}"
echo -e "${GREEN}✅ ====================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Update your .env file with VITE_STRIPE_PUBLISHABLE_KEY"
echo "2. Restart your dev server: npm run dev"
echo "3. Test payment with card: 4242 4242 4242 4242"
echo ""
echo -e "${GREEN}Edge Function URL:${NC}"
echo "https://$PROJECT_ID.supabase.co/functions/v1/create-payment-intent"
echo ""
echo -e "${GREEN}Happy selling! 🎉${NC}"

