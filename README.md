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
```

2. Install dependencies for both projects:

```powershell
npm run install:all
```

3. Build both projects for production:

```powershell
npm run build:all
```

4. Run the CRA dev server (ergowise-app):

```powershell
npm run start:ergowise-app
```

5. Or run the root Vite dev server:

```powershell
npm run start:root
```

Notes:

- If you only want to work on the CRA app, `cd ergowise-app && npm ci` is sufficient.
- If builds fail, paste the logs here and I'll debug them.

Contact: maintainers in the repo for secrets (Azure deploy token).