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
<!-- chore: trigger azure workflow test run -->

## Accessibility & Inclusive Design Enhancements

This project implements a Fluent-inspired design token system and a baseline accessibility testing setup.

### Reduced Motion
Users with `prefers-reduced-motion: reduce` will have animations and transitions effectively disabled. When adding animations:
1. Use CSS transitions/animations only where they add clarity.
2. Wrap complex motion in `@media (prefers-reduced-motion: no-preference)`.
3. Provide instant state changes when reduced motion is requested.

### Live Announcements
The Break Timer component includes an `aria-live` polite region to announce start, cancellation, and completion events for screen reader users.

### Color Tokens & Contrast
All colors derive from CSS variables in `src/index.css`. Avoid hard-coded hex values. See `ACCESSIBILITY.md` for contrast guidelines and token roles.

### Running Accessibility Tests
We use `jest-axe` for a minimal automated accessibility regression check.

Run all tests (includes a11y):
```bash
npm test
```

Run only the a11y test file:
```bash
npm test -- a11y.test.tsx
```

If you add new components, consider adding a test:
```tsx
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import MyComponent from './MyComponent';

test('MyComponent is a11y clean', async () => {
	const { container } = render(<MyComponent />);
	const results = await axe(container);
	expect(results).toHaveNoViolations();
});
```

### Manual Checklist (Before Shipping UI)
- Keyboard: All interactive elements reachable & operable (Enter/Space)
- Focus: Visible, non-obstructed outline
- Contrast: Meets WCAG AA (use a contrast checker for custom pairs)
- Zoom: Page layout usable at 200%
- Color: Not sole means of conveying meaning (add icon/text)
- Motion: Respects reduced motion preference

For deeper details, open `ACCESSIBILITY.md`.