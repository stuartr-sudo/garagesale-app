#!/bin/bash

# Database Schema Clone Script
# Clones schema from mobile Supabase project to web Supabase project

set -e  # Exit on error

echo "🔄 Supabase Database Schema Clone Tool"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found. Please install it first:${NC}"
    echo "   npm install -g supabase"
    exit 1
fi

echo -e "${GREEN}✅ Supabase CLI found${NC}"
echo ""

# Get source (mobile) project ID
echo -e "${CYAN}📱 MOBILE APP (Source Database)${NC}"
echo -e "${YELLOW}Enter your MOBILE Supabase Project ID:${NC}"
read -p "Mobile Project ID: " MOBILE_PROJECT_ID

if [ -z "$MOBILE_PROJECT_ID" ]; then
    echo -e "${RED}❌ Mobile Project ID is required${NC}"
    exit 1
fi

echo ""

# Get target (web) project ID
echo -e "${CYAN}🌐 WEB APP (Target Database)${NC}"
echo -e "${YELLOW}Enter your NEW WEB Supabase Project ID:${NC}"
read -p "Web Project ID: " WEB_PROJECT_ID

if [ -z "$WEB_PROJECT_ID" ]; then
    echo -e "${RED}❌ Web Project ID is required${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}⚠️  WARNING: This will copy the database schema from:${NC}"
echo -e "   FROM: ${CYAN}$MOBILE_PROJECT_ID${NC} (mobile)"
echo -e "   TO:   ${CYAN}$WEB_PROJECT_ID${NC} (web)"
echo ""
read -p "Continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${RED}❌ Aborted${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 1: Linking to MOBILE project...${NC}"
supabase link --project-ref $MOBILE_PROJECT_ID

echo ""
echo -e "${YELLOW}Step 2: Pulling schema from MOBILE database...${NC}"
supabase db pull --schema public

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to pull schema from mobile project${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Schema pulled successfully${NC}"
echo ""

# Create backup of pulled schema
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="supabase/migrations/mobile_schema_backup_${TIMESTAMP}.sql"

echo -e "${YELLOW}Step 3: Creating backup of pulled schema...${NC}"
# Find the most recent migration file
LATEST_MIGRATION=$(ls -t supabase/migrations/*.sql 2>/dev/null | head -n 1)

if [ -n "$LATEST_MIGRATION" ]; then
    cp "$LATEST_MIGRATION" "$BACKUP_FILE"
    echo -e "${GREEN}✅ Backup created: $BACKUP_FILE${NC}"
else
    echo -e "${YELLOW}⚠️  No migration file found (this might be okay)${NC}"
fi

echo ""
echo -e "${YELLOW}Step 4: Linking to WEB project...${NC}"
supabase link --project-ref $WEB_PROJECT_ID

echo ""
echo -e "${YELLOW}Step 5: Pushing schema to WEB database...${NC}"
supabase db push

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to push schema to web project${NC}"
    echo -e "${YELLOW}You may need to manually run the migrations${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ ====================================${NC}"
echo -e "${GREEN}✅  SCHEMA CLONED SUCCESSFULLY!${NC}"
echo -e "${GREEN}✅ ====================================${NC}"
echo ""
echo -e "${YELLOW}What was cloned:${NC}"
echo "  ✅ All tables structure"
echo "  ✅ All columns and constraints"
echo "  ✅ All indexes"
echo "  ✅ All RLS policies"
echo "  ✅ All functions (RPC)"
echo "  ✅ All triggers"
echo ""
echo -e "${YELLOW}What was NOT cloned:${NC}"
echo "  ❌ Data (rows) - tables are empty"
echo "  ❌ Storage buckets"
echo "  ❌ Edge Functions"
echo "  ❌ Secrets"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Update your .env file with NEW web project credentials:"
echo "   VITE_SUPABASE_URL=https://$WEB_PROJECT_ID.supabase.co"
echo "   VITE_SUPABASE_ANON_KEY=<your-new-anon-key>"
echo ""
echo "2. Deploy Stripe Edge Function to WEB project:"
echo "   ./scripts/deploy-stripe-system.sh"
echo ""
echo "3. Test the web app with the new database"
echo ""
echo -e "${GREEN}Done! 🎉${NC}"

