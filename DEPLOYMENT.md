# 🌐 ErgoWise AI - Live Websites

Your ErgoWise AI posture analysis application is deployed on multiple platforms with repository-specific workflows:

## **🚀 Live Websites:**
- **Personal Repository**: https://ReetuGoel.github.io/ergowiseAI (GitHub Pages)
- **Microsoft Repository**: https://ritugoel_microsoft.github.io/ergowise-1 (GitHub Pages)
- **Original Repository**: https://sharmabh_microsoft.github.io/ergowise (GitHub Pages or Azure)

---

## 📋 Deployment Workflows by Repository

### **ReetuGoel/ergowiseAI** → GitHub Pages
- **Workflow**: `deploy-reetugoel-pages.yml`
- **Homepage**: `https://ReetuGoel.github.io/ergowiseAI`
- **Action**: Uses `peaceiris/actions-gh-pages` to deploy to `gh-pages` branch

### **ritugoel_microsoft/ergowise-1** → GitHub Pages  
- **Workflow**: `deploy-microsoft-pages.yml`
- **Homepage**: `https://ritugoel_microsoft.github.io/ergowise-1`
- **Action**: Uses `peaceiris/actions-gh-pages` to deploy to `gh-pages` branch

### **sharmabh_microsoft/ergowise** → GitHub Pages or Azure
- **Workflow**: `deploy-github-pages.yml` or `azure-static-web-apps.yml`
- **Homepage**: `https://sharmabh_microsoft.github.io/ergowise`
- **Action**: GitHub Pages or Azure Static Web Apps (if secrets configured)

---

## ⚙️ Setup Instructions

### For GitHub Pages (ReetuGoel & Microsoft Repos)

1. **Enable GitHub Pages**:
   - Go to repository **Settings** → **Pages**
   - Source: **Deploy from a branch**
   - Branch: **gh-pages** (auto-created by workflow)

2. **Enable GitHub Actions**:
   - **Settings** → **Actions** → **General**
   - Actions permissions: **Allow all actions**
   - Workflow permissions: **Read and write permissions**
   - ✅ **Allow GitHub Actions to create and approve pull requests**

3. **Repository Visibility**: Must be **Public** (or Pages enabled for private)

### Troubleshooting

❌ **Azure Error**: "No matching Static Web App was found"
- **Solution**: Azure workflow is now disabled for ReetuGoel/Microsoft repos
- Only runs for repositories with proper Azure secrets configured

❌ **Permission Error**: "Resource not accessible by integration"  
- **Solution**: Check GitHub Actions permissions (Step 2 above)
- Ensure repository has write access enabled

❌ **Build Error**: Homepage URL mismatch
- **Solution**: Each workflow automatically sets correct homepage URL
- No manual configuration needed

---

## 📋 Deployment Status

✅ **GitHub Pages**: Active and working  
🗑️ **Azure Static Web Apps**: Removed (all Azure workflows deleted)

## 🎯 Features Available

- ✅ Real-time AI posture analysis using TensorFlow.js
- ✅ Professional ergonomic assessment 
- ✅ Comprehensive recommendations
- ✅ Modern, accessible UI design
- ✅ Complete privacy (client-side processing)
- ✅ Mobile-responsive design

## 🔧 How to Enable GitHub Pages (if needed)

If the site isn't live yet:

1. Go to repository settings: `https://github.com/ReetuGoel/ergowiseAI/settings/pages`
2. Under **Source**, select **"GitHub Actions"**
3. Save and wait 2-3 minutes for deployment

## 🛠️ Local Development

To run locally:
```bash
npm install
npm start
```

## 📊 Build for Production

```bash
npm run build
```

The build folder is ready to be deployed to any static hosting service.

---

**Powered by React + TypeScript + TensorFlow.js**

**No more Azure deployment errors! 🎉**