# SentryX Demo Recording Guide

## Target: 3–5 min | Web Dashboard + Terminal

---

## Pre-Recording Checklist

```bash
# 1. Build & start in demo mode
cd sentryx
npm install && npm run build
DEMO=true npm run start

# 2. Run warmup script (pre-populates signals + positions)
bash demo-warmup.sh

# 3. Open browser
open http://localhost:3000
```

**Recording setup:**
- Browser: Chrome / Arc, zoom 110–125%, 1920×1080
- Hide bookmarks bar, extensions, other tabs
- Dark mode OS (matches dashboard theme)
- Screen recorder: OBS / QuickTime / Loom, >= 1080p
- Optional: mic for voiceover (or add post-recording)

---

## Scene 0 — Opening (10s)

**Show:** Terminal with the SentryX ASCII banner

```
  ╔═══════════════════════════════════════════════╗
  ║  SentryX — Alpha & Security Guardian          ║
  ║  v2.0.0                                       ║
  ╚═══════════════════════════════════════════════╝
  ⚡ DEMO MODE — all data is simulated

  Dashboard: http://localhost:3000
```

**Voiceover:** "SentryX — an autonomous on-chain agent that protects your assets and hunts alpha, integrating all five Onchain OS modules."

Switch to browser.

---

## Scene 1 — Login (20s)

**Onchain OS module: Wallet (login + OTP)**

1. Dashboard shows **login overlay** — clean, minimal
2. Type email: `demo@sentryx.ai`
3. Click **Connect Wallet** → OTP step appears
4. Type code: `000000`
5. Click **Verify** → Dashboard loads

**Voiceover:** "Login through Agentic Wallet — email + OTP, keys stay in TEE secure enclave, never exposed."

**Highlight:** Top-left wallet card shows address + balance across chains.

---

## Scene 2 — Security Scan (40s)

**Onchain OS module: Security (token-scan, tx-scan)**

1. Click **Security** tab at the top
2. Click **Scan Now** button
3. Watch the scan progress — each token gets analyzed
4. Results appear:
   - **Overall Score** (large number, color-coded)
   - **3 risk boxes**: High Risk (red) / Warning (yellow) / Safe (green) counts
   - **Token list**: each token with risk level, score, check details

**Voiceover:** "Security tab runs deep contract analysis — checking for honeypots, mint backdoors, transfer tax, holder concentration. Every token in my wallet gets a risk score."

5. Scroll down to show **individual token checks** (expandable details)
6. Show the **Manual Token Scan** — paste any contract address to scan on-demand

**Pause 3 seconds on the results.**

---

## Scene 3 — Alpha Hunting (60s)

**Onchain OS modules: Market (MCP signals), Security (4-gate safety), Trade (DEX swap), Wallet (sub-wallets)**

1. Click **Alpha** tab
2. Click **Start** button → strategy starts
3. **Pipeline bar** animates: Scan → Score → Safety → Trade
   - Numbers update in real-time: raw signals → qualified → passed safety → traded

**Voiceover:** "SentryX scans three signal sources in parallel — smart money tracking, new token launches, and price anomalies. Each signal passes through a 4-gate security pipeline before any trade executes."

4. **Left column**: Activity feed scrolls with live events
   - "Cycle #1 started"
   - "Found 8 raw signals"
   - "BONK safety 82/100 ✓"
   - "BONK $5 → sm-sol"
5. **Center column**: Signal cards appear with:
   - Token name + chain
   - Source badges (SM / NT / PA)
   - Composite score + safety score
   - Action: BUY (green) / SKIP (gray) / BLACKLIST (red)
6. **Right column**: Positions appear with:
   - Entry price, current price, unrealized PnL (green/red)
   - Status: MONITORING / TRAILING
   - Sub-wallet name (e.g., `sm-sol`, `an-base`)

**Voiceover:** "Every trade goes into an isolated sub-wallet — one per strategy and chain combination. Built-in trailing take-profit at +50% and stop-loss at -20%."

**Let it run for 2-3 scan cycles.** Watch positions update in real-time.

7. Click **Stop** to pause scanning

---

## Scene 4 — x402 Signal Marketplace (50s)

**Onchain OS module: Payment (x402 micropayments)**

**Voiceover:** "Now the killer feature — Agent-to-Agent signal trading via x402 micropayments."

### Sell signals

1. Look at the **bottom bar** (x402 marketplace bar)
2. Click **Start Selling** → indicator turns green, shows "LIVE"
3. Port `:8402` now serving signals — any Agent can buy them

**Voiceover:** "I'm now selling my alpha signals. Other Agents hit my endpoint, get a 402 Payment Required, pay 0.1 USDG on X Layer with zero gas, and receive the signal."

### Buy signals (self-loop)

4. In the **Subscribe** input field, type: `http://localhost:8402/signals/latest`
5. Click **Subscribe**
6. Watch the bottom bar update:
   - Spend counter increases
   - A toast notification appears: "x402 signal received + executed"
   - New position may appear in the right column

**Voiceover:** "I'm subscribing to my own signal server — demonstrating the full loop: one Agent produces intelligence, another Agent pays for it and auto-trades. All on-chain, zero gas, zero human intervention."

---

## Scene 5 — Report + Closing (30s)

1. Click **Report** button in the top bar
2. Show the combined report:
   - Scan cycles run
   - Total signals scanned
   - Trades executed
   - Realized + Unrealized PnL
   - x402 Income + x402 Spend
3. Scroll to show **plugin skills** in the Security tab (8 Claude Code skills grid)

**Voiceover:** "SentryX deeply integrates all five Onchain OS modules — Wallet for sub-wallet isolation, Market for signal discovery, Security for the 4-gate pipeline, Trade for DEX execution, and Payment for the x402 signal marketplace. It also ships as a Claude Code plugin with 8 natural language skills."

**End on the dashboard with positions visible.**

---

## Scene Summary

| Scene | Duration | Onchain OS Modules | Key Visual |
|-------|----------|-------------------|------------|
| 0. Opening | 10s | — | ASCII banner |
| 1. Login | 20s | Wallet | OTP flow |
| 2. Security Scan | 40s | Security | Risk score + token checks |
| 3. Alpha Hunting | 60s | Market + Security + Trade + Wallet | Pipeline + live signals + positions |
| 4. x402 Marketplace | 50s | Payment | Sell → Subscribe → auto-trade loop |
| 5. Report | 30s | All 5 | Combined PnL + plugin skills |
| **Total** | **~3.5 min** | | |

---

## Recording Tips

- **Don't rush.** Pause 2-3 seconds after each click so viewers can see the result.
- **Mouse movements matter.** Move the cursor to highlight what you're about to click.
- **Let animations play.** The pipeline bar, activity feed, and toast notifications are designed to show real-time behavior — don't click away too fast.
- **If a scan cycle produces 0 trades**, that's fine — it shows the safety gates working. Mention: "Not every signal passes safety — that's by design."
- **Keep terminal visible** in the background (split screen or show briefly) to prove it's running locally.
- **x402 self-loop is the money shot.** Spend extra time here — it's the most differentiating feature.

---

## Backup Plan

If the live demo has issues:

1. Use the warmup script data — the dashboard already has pre-populated signals and positions from the warmup
2. Security tab scan works independently of the alpha scanner
3. x402 sell/buy is an isolated feature — can demo even if scanner is stopped

---

## Post-Recording Checklist

- [ ] Video is >= 1080p, no dropped frames
- [ ] No personal info visible (email, real wallet addresses)
- [ ] DEMO badge visible in top-right corner (confirms simulated mode)
- [ ] All 5 Onchain OS modules demonstrated
- [ ] x402 self-loop clearly shown
- [ ] Final report with PnL numbers visible
