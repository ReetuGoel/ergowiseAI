# Ergowise — Developer & Deployment Guide

## Current Structure
The application now runs as a single Create React App project at the repository root (historical references to a nested `ergowise-app` folder have been removed). All build and deploy commands execute from the repository root.

Key directories:
- `src/` – React source
- `public/` – Static assets
- `.github/workflows/` – CI/CD (Azure Static Web Apps)

## Prerequisites
- Node.js 18 LTS (`v18.x`)
- npm 9+
- A provisioned Azure Static Web App (free tier is fine)
- Azure portal deployment token (stored as a GitHub secret)

## Initial Clone (Windows PowerShell)
```powershell
git clone https://github.com/ritugoel_microsoft/ergowise-1.git
cd ergowise-1
git checkout main
npm ci
npm start
```

## Common Scripts
```powershell
npm start       # Run dev server
npm run build   # Production build -> ./build
npm test        # Jest test runner
```

## Type & Lint Checks
```powershell
npx tsc --noEmit
npx eslint . --ext .ts,.tsx
```

## Azure Static Web Apps Deployment
The unified workflow file: `.github/workflows/azure-static-web-apps.yml`

Important configuration inside workflow:
- `app_location: /`
- `output_location: build`
- Uses `Azure/static-web-apps-deploy@v1`

### Required Secret
Add a repository secret named `AZURE_STATIC_WEB_APPS_API_TOKEN`:
1. Azure Portal → Your Static Web App → `Manage deployment token` → Copy
2. GitHub → Repo → Settings → Secrets and variables → Actions → New repository secret
3. Name: `AZURE_STATIC_WEB_APPS_API_TOKEN`, Value: (paste token)

After pushing to `main`, the workflow will:
1. Checkout code
2. Install deps with `npm ci`
3. Type & lint check
4. Build CRA
5. Deploy build output

### PR Environments
Pull requests targeting `main` create a temporary preview environment; closing the PR triggers an `action: close` cleanup job.

## Troubleshooting Deployment
| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| Workflow fails in <10s | Old path `ergowise-app` referenced | Confirm workflow uses `app_location: /` |
| 401 Unauthorized | Missing token secret | Add `AZURE_STATIC_WEB_APPS_API_TOKEN` secret |
| Build succeeds locally but fails CI | Node version mismatch | Ensure Node 18 in workflow |
| Blank page after deploy | Wrong output path | Ensure `output_location: build` |

## Pruning Unused UI Libraries (Optional)
Some Radix or other UI packages may be removable. Run a grep over imports:
```powershell
findstr /s /i /c:"@radix-ui/react-" src\*.ts src\*.tsx > radix-usage.txt
```
Then uninstall unused dependencies:
```powershell
npm uninstall <package>
```

## Contributing
1. Branch from `main`
2. Keep commits scoped (lint, typing, feature)
3. Open PR; verify preview deployment

## License
Internal / TBD
# Ergowise — Developer setup

This repository contains two frontends:

- Root Vite app (in repository root)
- A Create React App located in `ergowise-app`

Quick setup for collaborators (Windows PowerShell):

1. Clone the repo and switch to main branch:

```powershell
git clone https://github.com/ritugoel_microsoft/ergowise-1.git
cd ergowise-1
git checkout main