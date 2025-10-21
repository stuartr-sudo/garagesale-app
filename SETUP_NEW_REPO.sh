#!/bin/bash
# Script to switch from base44dev to your personal GitHub account

echo "🔄 Removing old base44dev remote..."
git remote remove origin

echo "✅ Adding new remote for stuartr-sudo/garagesale-app..."
git remote add origin https://github.com/stuartr-sudo/garagesale-app.git

echo "📤 Pushing all code to your new repository..."
git push -u origin main

echo ""
echo "✅ Done! Your code is now at: https://github.com/stuartr-sudo/garagesale-app"
echo ""
echo "Next steps:"
echo "1. Go to Vercel: https://vercel.com/doubleclicks/garage-sale-40afc1f5/settings/git"
echo "2. Select 'stuartr-sudo' in the account dropdown"
echo "3. Search for 'garagesale-app'"
echo "4. Click 'Connect'"
echo ""

