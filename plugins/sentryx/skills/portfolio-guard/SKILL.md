---
name: portfolio-guard
description: This skill should be used when the user asks to "check my portfolio risk", "scan my holdings", "are my tokens safe", "portfolio guard", "持仓风控", "check if any of my tokens are risky", or "monitor my assets".
---

# Portfolio Guard Skill

A comprehensive holdings risk monitor that scans every token in the user's wallet across chains, classifies risk level, and optionally executes disposal of dangerous positions.

---

## Step 1 — Gather All Holdings

Collect a complete picture of what the user holds before any scanning begins.

1. Call `wallet-status` to identify the currently connected wallet address and active chain.
2. Call `wallet-balance` on the current chain to retrieve all token balances with their USD values.
3. Detect the complementary chain:
   - If active chain is EVM (Ethereum, BNB Chain, Polygon, Arbitrum, Optimism, Base, etc.), also query the user's Solana wallet if one is linked.
   - If active chain is Solana, also query linked EVM wallets.
4. Call `wallet-balance` again on the other chain(s) to pick up cross-chain holdings.
5. Compile a unified holdings list:
   - Token symbol
   - Contract address (for non-native tokens)
   - Chain
   - Balance (raw amount)
   - USD value
   - Percentage of total portfolio value

Do not proceed if `wallet-status` returns no connected wallet. Ask the user to connect a wallet first.

---

## Step 2 — Identify Scan Targets

Not every token needs a deep scan. Apply the following filter:

**Skip (mark 🟢 Safe immediately, no further scanning needed):**
- Native gas tokens: ETH, SOL, BNB, MATIC, AVAX, ARB, OP
- Major stablecoins: USDC, USDT, DAI, BUSD, FDUSD, TUSD, USDP, FRAX, LUSD, crvUSD

**Queue for deep scan — all other tokens**, including:
- Unknown/long-tail ERC-20 or SPL tokens
- LP tokens and yield-bearing wrappers
- Meme coins and newly launched tokens
- Any token with contract address (i.e., not a native asset)

List the scan queue clearly so the user knows which tokens are being analyzed.

---

## Step 3 — Deep Scan Each Token

Run scans in parallel where the underlying APIs allow concurrency. For each queued token, perform all four sub-scans:

### 3a. Contract Risk — `security-token-scan`

Call `security-token-scan` with the token's contract address and chain. Extract and evaluate:

- **Honeypot**: Can holders actually sell? A honeypot means the token contract blocks sells.
- **Mint backdoor**: Can the deployer mint unlimited new tokens, diluting holders indefinitely?
- **Transfer tax**: Hidden fees deducted on every buy/sell (flag if >5%, critical if >15%).
- **Proxy / upgradeable contract**: Owner can silently change contract logic at any time.
- **Ownership not renounced**: Deployer retains admin control — a risk vector for rug pulls.
- **Blacklist functions**: Contract can freeze specific wallet addresses.
- **Anti-whale mechanisms**: Can trigger unexpectedly for large sells.

Record raw findings for each flag.

### 3b. Market Health — Market API

Query current market data for the token (price feed, DEX aggregator, or on-chain liquidity pool):

- Current price and 24h / 7d price change (%)
- Market capitalization
- Total liquidity (USD) across all pools
- 24h trading volume
- Top 10 holder concentration (% of supply controlled by top 10 wallets)

### 3c. Trading Activity — Market API

Query recent on-chain transaction activity:

- Large sells in the past 24h: flag any single sell that removes >5% of pool liquidity
- Developer / deployer wallet activity: has the deployer address sold tokens recently?
- Liquidity removal events: has LP been withdrawn from major pools in the past 24h or 7d?
- Wash trading signals: volume/liquidity ratio anomalies

### 3d. Price Trend — Market API

Analyze the 7-day price history:

- Overall 7d trend direction (uptrend / sideways / downtrend)
- Maximum drawdown from 7d high to current price (%)
- Sudden cliff drops (>20% in a single 1h candle) — potential dump events

---

## Step 4 — Risk Classification

After all scan data is collected, classify each scanned token into one of three tiers:

### 🔴 Immediate Action Required

Assign 🔴 if ANY of the following are true:

- `security-token-scan` flags: **honeypot** detected
- `security-token-scan` flags: **mint backdoor** active (deployer can mint)
- On-chain data: liquidity in the primary pool dropped **>80%** in the past 24 hours
- On-chain data: **developer wallet sold >50%** of their holdings in the past 7 days
- `security-token-scan` or external feed: token explicitly **flagged as scam / rug pull**
- Token is completely illiquid (no sell orders available at any price)

### 🟡 Close Monitoring Required

Assign 🟡 if ANY of the following are true (and no 🔴 criteria met):

- Liquidity dropped **>40%** in the past 7 days
- Top 10 holders control **>75%** of total supply
- Price dropped **>50%** from 7d high (severe drawdown)
- 24h trading volume is **<$5,000** (near-zero liquidity risk)
- `security-token-scan` flags: ownership not renounced AND contract is upgradeable (proxy)
- `security-token-scan` flags: transfer tax **>5%**
- Large coordinated whale sell-offs detected (multiple wallets selling simultaneously)
- Developer wallet sold **10–50%** of holdings

### 🟢 Healthy

Assign 🟢 if:

- No 🔴 or 🟡 criteria triggered
- `security-token-scan` returns clean (no honeypot, no mint backdoor, no high tax)
- Liquidity is stable or growing
- Top 10 concentration is reasonable (<60%)

---

## Step 5 — Generate Report

Present a structured risk report. Always sort sections by severity (🔴 first, then 🟡, then 🟢).

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        SentryX PORTFOLIO GUARD — RISK REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PORTFOLIO OVERVIEW
  Total Value:    $XX,XXX
  Tokens Scanned: X of Y holdings
  Chains:         Ethereum, Solana (example)

  Risk Summary:
    🔴 Immediate Action:    X token(s)
    🟡 Close Monitoring:    X token(s)
    🟢 Healthy / Safe:      X token(s)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 IMMEDIATE ACTION REQUIRED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[TOKEN SYMBOL] — [Chain]
  Value:          $X,XXX (X.X% of portfolio)
  Contract:       0x...
  Findings:
    • HONEYPOT DETECTED — sells are blocked by contract
    • Deployer wallet sold 80% of holdings in past 3 days
  Recommendation: EXIT IMMEDIATELY if possible. Note: honeypot
                  means selling may not be possible. See Step 6.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟡 CLOSE MONITORING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[TOKEN SYMBOL] — [Chain]
  Value:          $XXX (X.X% of portfolio)
  Contract:       0x...
  Findings:
    • Liquidity dropped 55% in past 7 days
    • Top 10 holders control 81% of supply
    • Transfer tax: 8% (high)
  Recommendation: Monitor closely. Consider reducing position.
                  Set a stop-loss at current liquidity levels.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟢 HEALTHY / SAFE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ETH   — Ethereum    $X,XXX  (XX.X%)   Native token
  SOL   — Solana      $X,XXX  (XX.X%)   Native token
  USDC  — Ethereum    $X,XXX  (XX.X%)   Stablecoin
  [TOKEN] — [Chain]   $XXX    (X.X%)    No risk signals detected

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ACTIONS AVAILABLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  • "sell all risky" / "卖出高危"  — Attempt to sell all 🔴 tokens
  • "sell [TOKEN]"                  — Sell a specific token
  • "ignore all" / "忽略"          — Acknowledge and dismiss

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Step 6 — Handle Disposal

After presenting the report, wait for the user's response. Handle the following commands:

### "sell all risky" / "卖出高危"

For each 🔴 token in order of severity:

1. **Simulate first** — Call `security-tx-scan` to simulate the sell transaction before execution. This is mandatory. Do not skip.
2. **Honeypot check** — If `security-tx-scan` or `security-token-scan` indicates the token is a honeypot (sell transaction will revert / no sell path exists):
   - Report explicitly: "TOKEN is a honeypot. Sells are blocked by the contract. Your funds in this token cannot be recovered via normal selling."
   - Do not attempt to execute the sell.
   - Move to the next token.
3. **If simulation passes** — Get a sell quote from the DEX router (best available route, slippage-adjusted).
4. **Confirm with user** — Show: token, amount, expected output (in USD and target asset), estimated gas, slippage tolerance.
5. **Execute** — After user confirms, execute the sell transaction.
6. **Report result** — Transaction hash, final received amount, any execution warnings.

Repeat for all 🔴 tokens. After all are processed, summarize: how many sold successfully, how many were honeypots or failed, total USD value recovered.

### "sell [TOKEN]"

Same flow as above but for a single named token. The token may be 🔴, 🟡, or even 🟢 — respect the user's explicit instruction. Run simulation, check honeypot, confirm, execute.

### "ignore all" / "忽略"

Acknowledge the user's decision without judgment. Summarize the findings briefly and end the skill run. Remind the user they can run `portfolio-guard` again at any time.

---

## Important Rules

1. **Never fabricate data.** If a market data API returns no result for a token, report it as "data unavailable" and note the uncertainty. Do not invent prices, liquidity figures, or holder concentrations.

2. **Honeypot = explicit disclosure.** If a token is flagged as a honeypot, always tell the user clearly and explicitly. Never silently skip it or imply that selling might work when it won't.

3. **Always simulate before selling.** `security-tx-scan` simulation is mandatory before any sell execution. This protects the user from unexpected reverts, sandwich attacks, and extreme slippage.

4. **Sort by severity.** Always present 🔴 tokens before 🟡 before 🟢 in the report. Urgency must be visually clear.

5. **Never execute without confirmation.** Always show the user a preview of the transaction (amount, expected output, gas, slippage) and require explicit confirmation before submitting on-chain.

6. **Cross-chain awareness.** If the user's 🔴 token is on a different chain than the currently active chain, note that a chain switch may be required before selling and guide the user through it.

7. **LP tokens.** If the user holds LP (liquidity provider) tokens, treat them as a special case. Flag that removing LP requires calling the liquidity removal function, not a standard token swap. Warn if the underlying pool has low liquidity (risk of impermanent loss on exit).

---

## Cross-Skill Reference

When executing sells in Step 6, apply the full safe-trade logic from the `safe-trade` skill:

- Simulate via `security-tx-scan`
- Check for MEV exposure / sandwich risk
- Use slippage protection (default max 1% for stablecoins, 3% for mid-caps, 5% for small-caps)
- Confirm gas price is reasonable before submitting

Delegate to `safe-trade` patterns for execution rather than reimplementing sell logic here.
