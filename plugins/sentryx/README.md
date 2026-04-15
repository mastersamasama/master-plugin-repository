# SentryX

> **AI-Powered Onchain Alpha & Security Guardian**

SentryX is an **autonomous on-chain agent** that protects your assets and hunts alpha — all in one. It deeply integrates **all 5 Onchain OS modules** (Wallet, Trade, Market, Payment, Security) to deliver:

- Automated multi-source signal discovery (smart money + new tokens + price anomaly)
- **4-gate security pipeline** before every trade (contract → market → reputation → simulation)
- Fully automated trading with trailing TP/SL and **sub-wallet isolation**
- **Bidirectional x402 signal marketplace** — sell alpha to other Agents, or subscribe to theirs
- Real-time Web Dashboard (Chinese default, English toggle), SSE-powered, no refresh needed
- 8 Claude Code plugin skills for natural language interaction

---

## Quick Start

```bash
git clone https://github.com/mastersamasama/master-plugin-repository.git
cd master-plugin-repository/sentryx
npm install
npm run start
```

Open **http://localhost:3000** in your browser.

### Demo Mode (recommended for first experience)

```bash
DEMO=true npm run start
```

Demo mode runs the full **signal → score → safety → trade** pipeline with simulated data — no real wallet or on-chain assets needed.

Optional warmup (pre-populates signals and positions):

```bash
bash demo-warmup.sh
```

### Prerequisites

- **Node.js** >= 18
- **onchainos CLI** installed and logged in (production mode only; not needed for Demo):
  ```bash
  npx skills add okx/onchainos-skills
  onchainos wallet login <your-email>
  onchainos wallet verify <code>
  onchainos wallet status
  ```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DEMO` | — | Set to `true` to enable Demo mode (simulated data) |
| `OKX_API_KEY` | — | MCP market data API key (required for production) |
| `SENTRYX_PORT` | `3000` | Dashboard port |
| `SENTRYX_X402_PORT` | `8402` | x402 signal server port |
| `SENTRYX_STORE` | `~/.sentryx` | Data persistence directory |

---

## Web Dashboard

Launch the app and open `http://localhost:3000`:

```
┌─────────────────────────────────────────────────────────────────┐
│  SentryX  ● Scanning  │ Signals:24 Trades:5 Win:60% +$8.95 │[Stop]│
├─────────────────────────────────────────────────────────────────┤
│  📡 Scan 12 → ⚡ Score 5 → 🛡️ Safety 3 → 💰 Trade 2            │
├──────────┬──────────────────────┬───────────────────────────────┤
│ Wallet   │ Live Signals          │ Positions (sub-wallet)       │
│ $1,010   │                      │                               │
│ ◆ SOL    │ BONK SOL             │ POPCAT sm-sol  +15.4% TRAIL  │
│ ◆ ETH    │  SM:85 PA:72         │ WIF    sm-sol  -1.3%  MONITOR│
│ ◆ Base   │  BUY 82/100          │ DEGEN  sm-base -0.1%  MONITOR│
│          │                      │ BRETT  sm-base +2.6%  MONITOR│
│ Activity │ MOG Base             │                               │
│ 09:24 BUY│  SM:55  SKIP         │ Real: +$0.00                 │
│ 09:24 BLK│                      │ Unreal: +$8.95               │
├──────────┴──────────────────────┴───────────────────────────────┤
│ ● LIVE :8402 (0.1 USDG/signal) [Stop Selling] Income:0 Spend:0│
└─────────────────────────────────────────────────────────────────┘
```

### Dashboard Features

| Zone | Description |
|------|-------------|
| **Top Header** | Wallet status, KPI metrics (signals/trades/win rate/PnL), Start/Stop/Report, language toggle |
| **Pipeline Bar** | Real-time: Scan → Score → Safety → Trade with live counters |
| **Left: Wallet** | Balance grouped by chain (Solana / Ethereum / Base) |
| **Left: Activity** | Live event feed (buy / sell / safe / skip / block / scan) |
| **Center: Signals** | Real-time signal cards with source badges (SM/NT/PA), composite score, safety score, action |
| **Center: Details** | Click to expand: smart money addresses + tags + amounts, per-source scores, 4-gate safety breakdown |
| **Right: Positions** | Active positions with live PnL, trailing TP / monitoring status, sub-wallet name |
| **Right: Details** | Click to expand: signal score, safety score, entry/current price, peak gain, TP/SL thresholds |
| **Right: Closed** | Close reason (TP / SL / timeout / manual), realized PnL |
| **Bottom: x402** | Signal selling control (start/stop) + income, signal subscription input + spend |
| **Security Tab** | Wallet holdings security scan (10 checks), manual token scan (detailed report card), 8 plugin skills |

All updates pushed in real-time via **SSE** — no page refresh needed.

---

## How It Works

### 1. Signal Discovery (3 sources, parallel scan)

| Source | What It Detects | Weight |
|--------|----------------|--------|
| **Smart Money** | >= 2 whale/KOL addresses buying the same token within 1h | 40% |
| **New Token** | New launches with no dev rug history, bundler ratio < 30% | 35% |
| **Price Anomaly** | Volume spike >= 3x with price breaking 24h high | 25% |

Signals are combined into a **composite score** (0-100). Thresholds: SM >= 70, NT >= 75, PA >= 80, multi-source >= 60.

### 2. Safety Gate (4 gates, rejects unsafe tokens)

| Gate | Check | Points |
|------|-------|--------|
| Contract Security | Honeypot, mint backdoor, transfer tax, hidden owner via `security-token-scan` | /35 |
| Market Health | Top-10 holder concentration, liquidity, 24h volume, market cap via MCP | /30 |
| Token Reputation | Bundler ratio, sniper ratio, top-10 holder concentration via MCP | /15 |
| Tx Simulation | Pre-execution simulation, anomaly detection via `security-tx-scan` | /20 |

Score >= 70: **auto-execute**. 40-69: skip. < 40: blacklist (auto-skip in future scans).

### 3. Automated Trading

- Trades execute via Onchain OS DEX aggregator (500+ DEXs, 20+ chains)
- Each signal source x chain combo gets an **isolated sub-wallet** (e.g., `sm-sol`, `an-base`)
- **Trailing Take-Profit**: activates at +50%, sells on 10% pullback from peak
- **Fixed Stop-Loss**: sells at -20%
- **Timeout**: auto-close after 24h
- **Hard limits**: single trade <= 50 USDT, single wallet <= 200 USDT, total exposure <= 1000 USDT

### 4. x402 Signal Marketplace (Agent-to-Agent)

**Sell signals**: Start a local x402 payment-gated server on `:8402`. Other Agents send a request, receive `402 Payment Required`, pay 0.1 USDG on X Layer (zero gas), and get the signal data. Server validates signature structure and payTo address match before returning data.

**Buy signals**: Subscribe to any x402 signal source URL. SentryX auto-probes → checks payment limits → signs payment → retrieves signal → runs 4-gate safety → executes in isolated wallet.

**Self-loop demo**: Start selling, then enter `http://localhost:8402/signals/latest` in the subscribe box — one machine demonstrates the full Agent-to-Agent signal trading loop.

---

## Onchain OS Integration

SentryX uses **all 5 Onchain OS modules**:

### Wallet
| API | Usage |
|-----|-------|
| `wallet-login` / `wallet-verify` | Email + OTP login (TEE-custodied) |
| `wallet-status` | Verify login state |
| `wallet-balance` | Query holdings per chain |
| `wallet-create` | Create isolated sub-wallets (strategy x chain) |
| `wallet-switch` | Switch between main and sub-wallets |
| `wallet-send` | Transfers, fund sub-wallets, aggregate funds |
| `wallet-addresses` | Get addresses per chain |

### Security
| API | Usage |
|-----|-------|
| `security-token-scan` | Contract risk analysis (honeypot, mint backdoor, transfer tax, proxy, hidden owner — 10 checks) |
| `security-tx-scan` | Pre-execution transaction simulation, drainer detection |
| `security-approvals` | Token approval risk audit |

### Market (via MCP Server)
| API | Usage |
|-----|-------|
| `getSmartMoneyActivity` | Smart money / KOL buy signals (address + tag + amount) |
| `getNewPairs` | New token launches, bonding curve progress |
| `getTrendingTokens` | Trending token discovery (volume spike + price anomaly) |
| `getTokenDetail` | Token detail (holder concentration, liquidity, market cap, volume) |
| `getTokenPrice` | Real-time cross-chain pricing (position monitoring) |
| `getHolderDistribution` | Holder distribution (bundler / sniper / whale %) |
| `getDevInfo` | Developer reputation (rug history, prior launches) |

### Trade
| API | Usage |
|-----|-------|
| `dex-quote` | Best swap route across 500+ DEXs |
| `dex-swap` | Execute trade via aggregator (slippage control) |

### Payment
| API | Usage |
|-----|-------|
| `x402-pay` | TEE-signed x402 micropayment (signal buying) |
| Signal server | x402 payment-gated endpoint (`402 → verify signature → return data`) |

---

## Architecture

```
sentryx/
├── package.json                     # npm install && npm run start
├── tsconfig.json                    # TypeScript strict mode
├── demo-warmup.sh                   # Demo warmup script (pre-populate data)
│
├── src/                             # TypeScript application
│   ├── index.ts                     # Entry: Express server + Demo mode toggle
│   ├── config.ts                    # Types, defaults, chain config, hard limits
│   ├── store.ts                     # JSON file persistence (~/.sentryx/)
│   │
│   ├── api/
│   │   ├── routes.ts                # REST API + SSE + scanner loop + auth
│   │   ├── mcp-client.ts            # Onchain OS MCP Server HTTP client
│   │   └── cli.ts                   # onchainos CLI wrapper
│   │
│   ├── core/
│   │   ├── scanner.ts               # 3-source signal scanning engine (parallel)
│   │   ├── scorer.ts                # Composite scoring (pure functions)
│   │   ├── safety.ts                # 4-gate security pipeline
│   │   ├── trader.ts                # Auto trade execution + hard limit checks
│   │   ├── position.ts              # Trailing TP / SL / timeout management
│   │   └── wallet-matrix.ts         # Sub-wallet matrix (lazy creation)
│   │
│   ├── mock/                        # Demo mode simulation layer
│   │   ├── mock-mcp.ts              # Simulated market data + random-walk prices
│   │   └── mock-cli.ts              # Simulated wallet / security / trade / payment
│   │
│   └── x402/
│       ├── signal-server.ts         # x402 payment gate (signature validation + signal selling)
│       └── signal-buyer.ts          # x402 signal subscription (probe + pay + safety + execute)
│
├── public/                          # Web Dashboard (no build step)
│   ├── index.html                   # Dark-themed Tailwind SPA (Chinese default)
│   └── app.js                       # SSE + state management + i18n (zh/en)
│
├── skills/                          # Claude Code plugin skills (8 total)
│   ├── alpha-hunt/SKILL.md          # Signal discovery + auto trading
│   ├── alpha-sell/SKILL.md          # x402 signal selling
│   ├── alpha-buy/SKILL.md           # x402 signal subscription
│   ├── security-scan/SKILL.md       # Wallet security scan
│   ├── safe-trade/SKILL.md          # Safe trade guard
│   ├── portfolio-guard/SKILL.md     # Holdings risk monitor
│   ├── multi-wallet-audit/SKILL.md  # Multi-wallet audit
│   └── security-service/SKILL.md    # Security-as-a-Service
│
├── .claude-plugin/
│   └── plugin.json                  # Plugin metadata
│
└── docs/                            # Documentation
    ├── risk-scoring.md              # Risk scoring model
    ├── demo-script.md               # Demo recording guide
    ├── wallet-matrix.md             # Sub-wallet matrix design
    └── alpha-signal-format.md       # Signal data format
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript (strict mode) |
| Backend | Express v4 |
| Frontend | HTML + Vanilla JS + Tailwind CSS (CDN) |
| Real-time | Server-Sent Events (SSE) |
| Market Data | Onchain OS MCP Server (JSON-RPC) |
| Wallet/Trade/Security | onchainos CLI (TEE signing) |
| Persistence | JSON files (`~/.sentryx/`) |
| x402 Payments | X Layer, USDG, zero gas |

**Minimal dependencies:** Only `express` as runtime dependency + TypeScript tooling.

---

## API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Email login (sends OTP) |
| POST | `/api/auth/verify` | OTP verification |

### Status & Data

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/status` | Wallet + strategy + scanner state + demo flag |
| GET | `/api/portfolio` | Wallet balance grouped by chain |
| GET | `/api/signals` | Recent signals (with scores and safety results) |
| GET | `/api/positions` | Active + closed positions |
| GET | `/api/report` | Combined report (PnL + x402 income/spend) |

### Strategy Control

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/strategy/start` | Start scanner loop (body: strategy config) |
| POST | `/api/strategy/stop` | Stop scanner |
| POST | `/api/sell/:id` | Manual sell a specific position |
| POST | `/api/aggregate` | Collect all sub-wallet funds to main wallet |

### Security

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/security/scan` | Wallet holdings security scan (10 checks) |
| POST | `/api/security/token-scan` | Manual single token scan (detailed report) |
| GET | `/api/security/approvals` | Approval risk query |

### x402 Signal Marketplace

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/x402/status` | Signal selling / subscription status |
| POST | `/api/x402/sell/start` | Start x402 signal server (:8402) |
| POST | `/api/x402/sell/stop` | Stop x402 signal server |
| POST | `/api/x402/buy` | Subscribe to external signal source + auto-execute |

### Real-time

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | SSE stream (signal:new, trade:executed, position:update, position:closed, x402:payment, pipeline:update, activity) |

---

## Safety Limits

| Limit | Value | Configurable? |
|-------|-------|--------------|
| Single trade cap | 50 USDT | No (hardcoded) |
| Single sub-wallet cap | 200 USDT | No (hardcoded) |
| Total alpha exposure | 1,000 USDT | No (hardcoded) |
| x402 per signal | 0.5 USDT | No (hardcoded) |
| x402 daily spend | 5.0 USDT | No (hardcoded) |
| Default position size | 5 USDT | Yes |
| Take profit trigger | +50% | Yes |
| Trailing pullback | 10% | Yes |
| Stop loss | -20% | Yes |
| Timeout | 24h | Yes |
| Scan interval | 30s (min 10s) | Yes |

---

## Supported Chains

| Chain | Signal Sources | Trading | x402 Payment |
|-------|---------------|---------|-------------|
| **Solana** | Smart money + New tokens + Price anomaly | DEX Swap | — |
| **Base** | Smart money + Price anomaly | DEX Swap | — |
| **Ethereum** | Smart money + Price anomaly | DEX Swap | — |
| **X Layer** | — | — | Zero gas settlement |

---

## Two Ways to Use

### 1. Web Dashboard (primary)

```bash
npm install && npm run start
# Open http://localhost:3000
```

Full real-time Dashboard: signal discovery, security scanning, automated trading, position monitoring, x402 signal marketplace.

### 2. Claude Code Plugin (bonus)

8 natural language skills:

| Skill | Description |
|-------|-------------|
| `/sentryx:alpha-hunt` | Multi-source signal discovery + 4-gate auto trading |
| `/sentryx:alpha-sell` | x402 signal selling |
| `/sentryx:alpha-buy` | x402 signal subscription + auto-execute |
| `/sentryx:security-scan` | Wallet security scan (10 checks) |
| `/sentryx:safe-trade` | Single trade 4-gate safety evaluation |
| `/sentryx:portfolio-guard` | Holdings risk monitor + auto-disposal |
| `/sentryx:multi-wallet-audit` | Multi-wallet security audit |
| `/sentryx:security-service` | Security-as-a-Service (x402 micropayments) |

Natural language: "find alpha opportunities", "scan my wallet security", "start selling signals".

---

## Notes

- **No secrets in code**: Authentication is handled by Agentic Wallet email login. Set `OKX_API_KEY` env var for MCP market data, or use `DEMO=true` mode.
- **TEE signing**: All transaction signing happens inside Trusted Execution Environment via onchainos CLI — private keys never leave the secure enclave.
- **x402 signature validation**: Signal server performs full proof validation (base64 decode → field check → payTo address match), not just header presence check.
- **Demo mode**: `DEMO=true` uses simulated data (8-token pool + random-walk prices) to run the full signal → score → safety → trade pipeline. Mock layer (`mock-mcp.ts` + `mock-cli.ts`) shares the same interface as production — seamless switching.

---

## License

Internal use only.
