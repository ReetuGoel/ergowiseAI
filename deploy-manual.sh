#!/bin/bash

# Manual GitHub Pages Deployment Script for ReetuGoel/ergowiseAI
# Run this script if automated deployment fails

echo "🚀 Manual ErgoWise GitHub Pages Deployment"
echo "=========================================="

# Check if we're in the right repository
if [[ ! -f "package.json" ]] || [[ ! -f "src/App.tsx" ]]; then
    echo "❌ Error: This script must be run from the ErgoWise project root directory"
    exit 1
fi

# Set the correct homepage
echo "📦 Setting homepage URL..."
npm pkg set homepage="https://ReetuGoel.github.io/ergowiseAI"

# Install dependencies
echo "📥 Installing dependencies..."
npm ci

# Build the project
echo "🔨 Building the project..."
npm run build

# Check if build was successful
if [[ ! -d "build" ]]; then
    echo "❌ Build failed - build directory not found"
    exit 1
fi

# Configure git
echo "⚙️ Configuring git..."
git config user.name "$(git config user.name || echo 'GitHub Pages Deploy')"
git config user.email "$(git config user.email || echo 'noreply@github.com')"

# Create and switch to gh-pages branch
echo "🌿 Creating/switching to gh-pages branch..."
git fetch origin
if git rev-parse --verify origin/gh-pages >/dev/null 2>&1; then
    git checkout gh-pages
    git pull origin gh-pages
else
    git checkout --orphan gh-pages
fi

# Clear the branch and copy build files
echo "🧹 Clearing branch and copying build files..."
git rm -rf . 2>/dev/null || true
cp -r build/* .
cp build/.* . 2>/dev/null || true

# Create .nojekyll file to disable Jekyll
echo "" > .nojekyll

# Add all files
git add .

# Commit and push
echo "📤 Committing and pushing to GitHub Pages..."
git commit -m "Deploy ErgoWise to GitHub Pages - $(date)"
git push origin gh-pages

echo "✅ Deployment complete!"
echo "🌐 Your site should be available at: https://ReetuGoel.github.io/ergowiseAI"
echo ""
echo "📋 Next steps:"
echo "1. Go to https://github.com/ReetuGoel/ergowiseAI/settings/pages"
echo "2. Set Source to 'Deploy from a branch'"
echo "3. Select 'gh-pages' branch"
echo "4. Wait 5-10 minutes for deployment"

# Switch back to main branch
git checkout main