---
name: alpha-sell
description: This skill should be used when the user asks to "sell my signals", "start signal service", "monetize my alpha", "sell alpha signals", "开启信号售卖", "卖信号", "x402 signal service", or "start selling signals via x402".
---

# Alpha Sell — x402 Signal Selling Service

You are running the SentryX Alpha Sell skill. This skill enables the user to monetize alpha signals produced by alpha-hunt by running a local x402 payment-gated HTTP server. External Agents pay USDG on X Layer (zero gas) to access real-time trading signals.

---

## Prerequisites

1. Call `wallet-status` to verify the user is logged in.
   - If not logged in: "Please log in to your Agentic Wallet first." Then stop.

2. Check if alpha-hunt has produced any signals:
   ```bash
   cat ~/.sentryx/signals/latest.json 2>/dev/null
   ```
   - If file does not exist or is empty: "No signals available yet. Run `/sentryx:alpha-hunt` first to generate trading signals, then come back to sell them." Then stop.
   - If file exists: proceed.

---

## Step 1 — Configure Signal Service

Present the default service configuration:

> **Alpha Signal Service Configuration**
>
> | Parameter | Default | Description |
> |-----------|---------|-------------|
> | Port | 8402 | Local HTTP server port |
> | Single signal price | 0.1 USDG | Per-request price for /signals/latest |
> | Batch price (10 signals) | 0.5 USDG | Per-request price for /signals/history |
> | Network | X Layer (zero gas) | Payment settlement network |
> | Payment token | USDG | Settlement token |
> | Receiving wallet | <current wallet address> | Your Agentic Wallet address |
>
> Confirm to start the server, or adjust any parameter.

Wait for user confirmation. Record the final parameters.

---

## Step 2 — Start the Signal Server

Get the user's current wallet address from `wallet-status`. Then start the server:

```bash
cd <path-to-sentryx>/server && SHIELDX_SELLER_ADDRESS=<walletAddress> SHIELDX_PORT=<port> node signal-server.js &
```

Wait 2 seconds, then verify the server is running:

```bash
curl -s http://localhost:<port>/health
```

If the health check succeeds, display:

> **Signal Service is LIVE**
>
> | Field | Value |
> |-------|-------|
> | Endpoint (latest) | `http://localhost:<port>/signals/latest` |
> | Endpoint (history) | `http://localhost:<port>/signals/history` |
> | Health check | `http://localhost:<port>/health` |
> | Price (single) | 0.1 USDG |
> | Price (batch) | 0.5 USDG / 10 signals |
> | Network | X Layer (zero gas) |
> | Receiving wallet | `<walletAddress>` |
>
> External Agents can now subscribe to your signals via x402. They will:
> 1. Hit the endpoint → receive HTTP 402
> 2. Sign a payment via their Agentic Wallet
> 3. Replay the request with payment proof → receive your signal
>
> The server reads from `~/.sentryx/signals/latest.json` — as long as alpha-hunt continues producing signals, your service stays fresh.
>
> Say **"stop server"** to shut down, or **"show signal"** to preview what buyers receive.

If the health check fails, report the error and suggest checking if port <port> is already in use.

---

## Step 3 — Handle Follow-up

### "show signal" / "preview" / "预览信号"

Read and display `~/.sentryx/signals/latest.json` in formatted JSON. This is exactly what a paying buyer receives.

### "stop server" / "停止服务" / "shut down"

```bash
pkill -f "node signal-server.js" 2>/dev/null
```

Confirm: "Signal server stopped. Your signals are still saved in `~/.sentryx/signals/` — you can restart anytime with `/sentryx:alpha-sell`."

### "test buy" / "模拟购买"

Simulate what a buyer sees:

1. Show the unpaid request:
   ```bash
   curl -s -w "\nHTTP Status: %{http_code}\n" http://localhost:<port>/signals/latest
   ```
   Display: "This is what an unpaid request sees — HTTP 402 with payment requirements."

2. Show the paid request:
   ```bash
   curl -s -H "PAYMENT-SIGNATURE: dGVzdA==" http://localhost:<port>/signals/latest
   ```
   Display: "This is what a paying buyer receives — the full signal data."

### "status" / "状态"

```bash
curl -s http://localhost:<port>/health
```

Display server status and whether signals are available.

---

## Important Rules

1. **The signal server reads from disk** — it does NOT generate signals. alpha-hunt writes, alpha-sell serves. If signals are stale, tell the user to run alpha-hunt again.

2. **Payment verification is simplified for the hackathon.** The server trusts the presence of the `PAYMENT-SIGNATURE` header. In production, it would verify against the x402 facilitator contract on X Layer.

3. **The server runs locally.** For the hackathon demo, the buyer Agent connects to localhost. In production, this would be deployed with a public URL.

4. **Never expose wallet private keys or credentials** in the server process. The seller address is the public wallet address only.

5. **Zero gas on X Layer.** Always emphasize this when discussing pricing — buyers pay 0.1 USDG with zero gas overhead.
