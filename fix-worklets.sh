#!/bin/bash
echo "Clearing Metro bundler cache..."
npx expo start --clear

echo ""
echo "If the issue persists, try:"
echo "1. Stop the Metro bundler (Ctrl+C)"
echo "2. Run: rm -rf node_modules && npm install"
echo "3. Run: npx expo start --clear"
