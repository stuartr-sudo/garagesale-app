#!/bin/bash

# Deploy Voice-Enhanced AI Analysis Edge Function
# This script deploys the analyze-image-with-voice function to Supabase

set -e

echo "🚀 Deploying Voice-Enhanced AI Analysis to Supabase..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Link to Supabase project (mobile database)
echo "🔗 Linking to Supabase project..."
supabase link --project-ref biwuxtvgvkkltrdpuptl

# Deploy the Edge Function
echo "📦 Deploying analyze-image-with-voice function..."
supabase functions deploy analyze-image-with-voice

# Set the OpenAI API key secret
echo "🔑 Setting OPENAI_API_KEY secret..."
echo "Please enter your OpenAI API key:"
read -s OPENAI_KEY
supabase secrets set OPENAI_API_KEY="$OPENAI_KEY"

# Set the Serper API key secret (optional but recommended for market research)
echo ""
echo "🔍 Setting SERPER_API_KEY secret (for real-time market pricing)..."
echo "Please enter your Serper API key (or press Enter to skip):"
read -s SERPER_KEY
if [ -n "$SERPER_KEY" ]; then
    supabase secrets set SERPER_API_KEY="$SERPER_KEY"
    echo "✅ Serper API key set - market research enabled!"
else
    echo "⚠️  Skipped - AI will use estimated pricing (less accurate)"
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Edge Function URL:"
echo "   https://biwuxtvgvkkltrdpuptl.supabase.co/functions/v1/analyze-image-with-voice"
echo ""
echo "🧪 Test the function:"
echo '   curl -X POST https://biwuxtvgvkkltrdpuptl.supabase.co/functions/v1/analyze-image-with-voice \'
echo '     -H "Authorization: Bearer YOUR_ANON_KEY" \'
echo '     -H "Content-Type: application/json" \'
echo '     -d '\''{"imageUrl": "https://...", "voiceTranscript": "..."}'\'
echo ""
echo "✨ Done! The web app will now use the secure Supabase Edge Function."

