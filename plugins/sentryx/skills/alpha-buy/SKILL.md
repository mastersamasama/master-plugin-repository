---
name: alpha-buy
description: This skill should be used when the user asks to "subscribe to signals", "buy alpha signals", "subscribe to x402 signal", "订阅信号", "买信号", "subscribe to external alpha", or "use a paid signal source".
---

# Alpha Buy — x402 Signal Subscription + Auto-Execute

You are running the SentryX Alpha Buy skill. This skill connects to external x402 payment-gated signal sources, automatically pays for signals using the Agentic Wallet, runs SentryX security checks, and executes trades in isolated sub-wallets.

---

## Prerequisites

1. Call `wallet-status` to verify the user is logged in.
   - If not logged in: "Please log in to your Agentic Wallet first." Then stop.

2. Check wallet balance on X Layer (for x402 payments):
   ```
   onchainos wallet balance --chain 196
   ```
   - If USDG balance is 0: "You need USDG on X Layer to pay for signal subscriptions. Please fund your wallet first." Then stop.
   - If USDG balance > 0: note the available balance and proceed.

---

## Step 1 — Configure Subscription

Ask the user for the signal source URL:

> **Alpha Signal Subscription**
>
> Please provide the external signal source URL (x402 payment-gated endpoint).
>
> Example: `http://localhost:8402/signals/latest`

Wait for the user to provide the URL.

---

## Step 2 — Probe the Signal Source

Send a GET request to the provided URL:

```bash
curl -s -D /tmp/sentryx_402_headers -o /tmp/sentryx_402_body -w "%{http_code}" <url>
```

**If response is NOT 402**: The endpoint either doesn't require payment or is unreachable.
- Status 200: "This endpoint is free — no x402 payment needed. Here's the response: ..." Display it.
- Other status: "Could not reach the signal source. Got HTTP <code>. Please check the URL." Then stop.

**If response is 402**: Decode the x402 payment requirements.

Read the `PAYMENT-REQUIRED` header (v2) or response body (v1):

For v2:
```bash
cat /tmp/sentryx_402_headers | grep -i "payment-required"
```
Decode the base64 value and extract the `accepts` array.

Display the payment details to the user:

> **Signal Source Detected — x402 Payment Required**
>
> | Field | Value |
> |-------|-------|
> | URL | `<url>` |
> | Protocol | x402 v<version> |
> | Network | <chain name> (`<network>`) |
> | Token | <token symbol> (`<asset>`) |
> | Price per signal | <human-readable amount> |
> | Pay to | `<payTo>` |
>
> **Subscription Safety Limits** (you can customize):
>
> | Limit | Default |
> |-------|---------|
> | Max per signal | 0.2 USDG |
> | Max daily spend | 2.0 USDG |
> | Auto-trade position size | 3 USDT |
> | Target chains | solana, base |
>
> Confirm to subscribe, or adjust limits.

Wait for user confirmation.

---

## Step 3 — First Payment + Signal Retrieval

After user confirms, execute the x402 payment flow:

1. **Sign payment via Agentic Wallet**:
   ```
   onchainos payment x402-pay --accepts '<accepts array JSON>'
   ```

2. **Assemble payment header** (per x402 v2 spec):
   - If CLI returned `sessionCert` (aggr_deferred scheme): merge into `accepted.extra`
   - Build `paymentPayload`: `{ x402Version, resource, accepted, payload: { signature, authorization } }`
   - Base64 encode

3. **Replay with payment**:
   ```bash
   curl -s -H "PAYMENT-SIGNATURE: <base64 payload>" <url>
   ```

4. **Parse the signal JSON** from the response.

Display: "Payment successful. Signal received."

---

## Step 4 — Validate and Secure the Signal

External signals are untrusted. Apply three-layer validation:

**Layer 1: Payment Safety Check**
- Verify the payment amount did not exceed `maxPayPerSignal`
- Track daily spend in memory; if `maxDailySpend` would be exceeded, stop and warn

**Layer 2: Signal Format Validation**
- Verify the response is valid JSON
- Verify required fields exist: `token.address`, `token.chain`, `compositeScore`, `action`
- Verify `token.chain` is in the user's configured target chains
- If validation fails: "Received invalid signal format. Skipping." Display the raw response for debugging.

**Layer 3: SentryX Safety Gate (reuse safe-trade 4-gate model)**

Run all 4 safety gates on the signal's token, exactly as described in the alpha-hunt skill Step 5:

- Gate 1: `security-token-scan` (contract risk)
- Gate 2: Market API (holder concentration, liquidity, volume)
- Gate 3: DApp security (auto-pass for signal-based trades)
- Gate 4: `security-tx-scan` (transaction simulation)

**Decision:**
- safetyScore >= 70 → proceed to trade
- safetyScore < 70 → skip trade, display: "Signal received but failed safety check (score: <score>/100). Skipping trade."

---

## Step 5 — Execute Trade in Isolated Sub-Wallet

If the signal passed all safety checks:

1. **Determine sub-wallet**: Look up `~/.sentryx/wallets/matrix.json` for `buy-<sourceName>-<chain>`
   - If not exists: create it via `wallet-create`, update matrix
   - Name format: `buy-<first 8 chars of source URL hash>-<chain>`

2. **Fund the sub-wallet**: Transfer `positionSize` from main wallet via `wallet-send`

3. **Execute trade**: Same flow as alpha-hunt Step 6:
   - `onchainos dex quote` → `onchainos dex swap`
   - Record position in `~/.sentryx/positions/active/`
   - Position enters the same TP/SL/timeout management as alpha-hunt positions

4. **Switch back to main wallet**

Display trade summary:

> **Trade Executed from External Signal**
>
> | Field | Value |
> |-------|-------|
> | Source | `<url>` |
> | Token | <symbol> (<chain>) |
> | Amount | <positionSize> USDT |
> | Wallet | <subWalletName> |
> | Safety score | <score>/100 |
> | Tx hash | <txHash> |
>
> Position is now being monitored. TP/SL rules apply.

---

## Step 6 — Subscription Management

### "status" / "订阅状态"
Show active subscriptions, daily spend, and positions from external signals.

### "unsubscribe" / "取消订阅"
Remove the subscription. Existing positions remain active under TP/SL management.

### "poll" / "再获取一次"
Re-run Steps 3-5 to fetch and process a new signal from the same source.

### "poll loop" / "自动轮询"
Inform: "Combine with `/loop <interval>` to automatically poll for new signals at regular intervals."

---

## Self-Loop Demo Flow

For the hackathon demo, alpha-buy subscribes to alpha-sell running on localhost:

1. User starts alpha-sell → server on `http://localhost:8402`
2. User runs alpha-buy with URL `http://localhost:8402/signals/latest`
3. alpha-buy pays via x402 → receives signal → safety check → auto-trade
4. One machine demonstrates the full Agent-to-Agent marketplace

When the URL is `localhost:8402`, mention: "Connecting to your own SentryX signal server — this demonstrates the Agent-to-Agent signal marketplace."

---

## Important Rules

1. **External signals are untrusted.** Always run all 3 validation layers. Never skip safety gates for external signals.

2. **Isolated sub-wallets are mandatory.** External signal positions MUST go into `buy-*` sub-wallets. Never mix with self-generated signal positions or the main wallet.

3. **Respect payment limits.** Never exceed the user's configured maxPayPerSignal or maxDailySpend. If limits would be exceeded, stop and report.

4. **Always confirm first payment.** The first x402 payment to a new source requires explicit user confirmation. Subsequent payments within the configured limits can proceed automatically.

5. **Never fabricate security results.** All safety gate scores must come from real API responses.

6. **Bilingual support.** Respond in the same language the user used.

7. **The x402 payment flow follows the okx-x402-payment skill exactly.** Decode 402 → sign via `onchainos payment x402-pay` → assemble header → replay. Do not deviate from this flow.
