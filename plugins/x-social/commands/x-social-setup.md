---
name: x-social-setup
description: One-command setup for the X-Social local development environment
---

# X-Social Local Dev Setup

Set up the complete X-Social local development environment. This command checks prerequisites, installs dependencies, and starts all services.

## Steps

### 1. Check prerequisites

Run these checks and report any missing tools:

```bash
node --version    # Need Node.js 18+
forge --version   # Need Foundry for contracts
```

### 2. Install dependencies

```bash
# Root workspace (installs agent + sdk)
cd <repo-root>
npm install

# Web frontend
cd web
npm install

# Railgun privacy payment server
cd ../server
npm install
```

### 3. Build contracts

```bash
cd contracts
forge build
```

Report any compilation errors from the three core contracts:
- `ZKVerifyRegistry.sol`
- `PrivacyEscrow.sol`
- `AgentRegistry8004.sol`

### 4. Start services

Start each service and verify it's running:

**Web frontend** (port 5173):
```bash
cd web && npm run dev
```

**Railgun proxy server** (port 3001, optional — only if privacy payments are needed):
```bash
cd server && node index.js
```

**Agent service** (optional — only if matchmaking/arbitration is needed):
```bash
cd agent && npm run dev
```

### 5. Verify

- Web UI: `http://localhost:5173`
- Privacy pay demo: `http://localhost:5173/privacy-pay?to=Alice&amount=50&service=consulting`
- Railgun health: `curl http://localhost:3001/api/health`

## Quick reference

| Service | Directory | Command | Port |
|---------|-----------|---------|------|
| Web UI | `web/` | `npm run dev` | 5173 |
| Railgun Server | `server/` | `node index.js` | 3001 |
| Agent | `agent/` | `npm run dev` | — |
| Contracts | `contracts/` | `forge build` / `forge test` | — |
