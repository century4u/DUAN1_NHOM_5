# DUAN1_NHOM_5 — Local development

This repository contains a React frontend (`/client`) and a Node.js/Express backend (`/server`).

## Quick start (Windows PowerShell)

Prerequisites: Node.js (v16+ recommended), npm, (optionally) MongoDB if you use the `MONGODB_URI`.

1) Start both servers automatically (recommended)

Open PowerShell in the repository root and run:

```powershell
# Run the helper script which will open 2 PowerShell windows:
./start-all.ps1
```

This will:
- Run `npm install` in `server` and `client` if needed.
- Copy `server/.env.example` to `server/.env` if `.env` doesn't exist.
- Start the backend with `npm run dev` (uses `nodemon` if available).
- Start the frontend with `npm start` (React dev server on port 3000).

2) Manual steps

Backend:
```powershell
cd D:\path\to\repo\server
npm install
copy .env.example .env # one-time
# Edit .env to set JWT secrets or PORT if desired
npm run dev
```
Default backend port: 5000 (see `server/.env.example`). Health endpoint: `GET http://localhost:5000/api/health`.

Frontend:
```powershell
cd D:\path\to\repo\client
npm install
npm start
```
Default frontend port: 3000. The React app is configured to call the backend at `http://localhost:5000/api` in the service files.

3) Quick checks

Check backend health (PowerShell):
```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/health | ConvertTo-Json
```
Check frontend HTTP status:
```powershell
(Invoke-WebRequest -Uri http://localhost:3000/).StatusCode
```

## Troubleshooting
- If a port is in use, change the `PORT` in `server/.env` or stop the conflicting process.
- If `npm install` fails due to network, retry or use a registry mirror.
- If backend uses MongoDB and you don't have it, either install/run MongoDB or adapt the server to not connect until configured.

## Optional improvements I can add
- A `start-all` cross-platform npm script or a `docker-compose.yml` to run everything in containers.
- A `proxy` entry in `client/package.json` (if not present) so you can use relative `/api/*` paths in development.
- A simple `start-dev` script that runs both processes using concurrently.

Tell me which of the optional improvements you want and I will add them and commit.
