# Manual GitHub Pages Deployment Script for ReetuGoel/ergowiseAI
# Run this script if automated deployment fails

Write-Host "🚀 Manual ErgoWise GitHub Pages Deployment" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

# Check if we're in the right repository
if (!(Test-Path "package.json") -or !(Test-Path "src/App.tsx")) {
    Write-Host "❌ Error: This script must be run from the ErgoWise project root directory" -ForegroundColor Red
    exit 1
}

# Set the correct homepage
Write-Host "📦 Setting homepage URL..." -ForegroundColor Yellow
npm pkg set homepage="https://ReetuGoel.github.io/ergowiseAI"

# Install dependencies
Write-Host "📥 Installing dependencies..." -ForegroundColor Yellow
npm ci

# Build the project
Write-Host "🔨 Building the project..." -ForegroundColor Yellow
npm run build

# Check if build was successful
if (!(Test-Path "build")) {
    Write-Host "❌ Build failed - build directory not found" -ForegroundColor Red
    exit 1
}

# Configure git
Write-Host "⚙️ Configuring git..." -ForegroundColor Yellow
$userName = git config user.name
$userEmail = git config user.email
if (!$userName) { git config user.name "GitHub Pages Deploy" }
if (!$userEmail) { git config user.email "noreply@github.com" }

# Create and switch to gh-pages branch
Write-Host "🌿 Creating/switching to gh-pages branch..." -ForegroundColor Yellow
git fetch origin
$ghPageExists = git rev-parse --verify origin/gh-pages 2>$null
if ($ghPageExists) {
    git checkout gh-pages
    git pull origin gh-pages
} else {
    git checkout --orphan gh-pages
}

# Clear the branch and copy build files
Write-Host "🧹 Clearing branch and copying build files..." -ForegroundColor Yellow
git rm -rf . 2>$null
Copy-Item "build\*" "." -Recurse -Force

# Create .nojekyll file to disable Jekyll
"" | Out-File -FilePath ".nojekyll" -Encoding utf8

# Add all files
git add .

# Commit and push
Write-Host "📤 Committing and pushing to GitHub Pages..." -ForegroundColor Yellow
$commitMessage = "Deploy ErgoWise to GitHub Pages - $(Get-Date)"
git commit -m $commitMessage
git push origin gh-pages

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "🌐 Your site should be available at: https://ReetuGoel.github.io/ergowiseAI" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. Go to https://github.com/ReetuGoel/ergowiseAI/settings/pages"
Write-Host "2. Set Source to Deploy from a branch"
Write-Host "3. Select gh-pages branch"
Write-Host "4. Wait 5-10 minutes for deployment"

# Switch back to main branch
git checkout main