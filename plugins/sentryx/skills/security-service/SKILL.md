---
name: security-service
description: This skill should be used when the user asks to "start security service", "offer security scanning as a service", "enable x402 security", "charge for security scans", "use a paid security service", or "安全即服务".
---

# Security-as-a-Service (x402)

You are running the SentryX Security-as-a-Service skill. This skill enables users to either **offer** security scans as a paid service (Seller Mode) or **consume** paid security scan services (Buyer Mode) using the x402 micropayment protocol on X Layer.

**Important context**: x402 Payment on Onchain OS is in early rollout. If the Payment API is not yet available, activate Demo Mode automatically and walk through the complete UX with simulated payment interactions while keeping all security analysis real.

---

## Step 0 — Mode Selection

First, determine which mode the user needs.

**Auto-detect from message**:
- Keywords like "offer", "sell", "host", "provide", "earn", "register endpoint", "start my service", "charge clients", "我要提供" → Seller Mode
- Keywords like "use", "buy", "scan my token", "scan my address", "pay for", "find a service", "我要使用" → Buyer Mode

**If mode is ambiguous**, ask:

> I can help you with Security-as-a-Service in two ways:
>
> **A) Seller Mode** — Register your own security scanning service and earn USDT for each scan request you fulfill.
>
> **B) Buyer Mode** — Pay for a security scan using your Agentic Wallet and get an instant report.
>
> Which would you like to do?

Once mode is determined, proceed to the corresponding section below.

---

## SELLER MODE — Offer Security Scanning Services

### Step S1 — Configure Your Service Catalog

Present the following default service catalog and let the user customize it:

> Here is your default Security Service Catalog. You can adjust the prices or disable any service:
>
> | # | Service | What It Covers | Price |
> |---|---------|----------------|-------|
> | 1 | Token Security Scan | Contract risk score, holder concentration, liquidity depth | **0.1 USDT / request** |
> | 2 | Address Security Audit | Approval risk, portfolio exposure, transaction anomalies | **0.5 USDT / request** |
> | 3 | DApp Security Check | Phishing detection, contract verification, interaction risk | **0.1 USDT / request** |
>
> Would you like to:
> - Keep these defaults and continue?
> - Adjust any price? (e.g., "Set Token Scan to 0.2 USDT")
> - Disable any service?

Wait for user confirmation or customization before proceeding. Once confirmed, record the final catalog.

---

### Step S2 — Register x402 Endpoints

Attempt to register the services via the Onchain OS Payment API.

**Check Payment API availability**:

```
POST /payment/x402/register
{
  "network": "xlayer",
  "currency": "USDT",
  "services": [
    {
      "id": "token-scan",
      "name": "Token Security Scan",
      "price": "<user_confirmed_price>",
      "endpoint": "/security/token-scan"
    },
    {
      "id": "address-audit",
      "name": "Address Security Audit",
      "price": "<user_confirmed_price>",
      "endpoint": "/security/address-audit"
    },
    {
      "id": "dapp-check",
      "name": "DApp Security Check",
      "price": "<user_confirmed_price>",
      "endpoint": "/security/dapp-check"
    }
  ]
}
```

**If Payment API is available** — show the registration result:

> Your services have been registered on the x402 network.
>
> **Registration Summary**
> - Network: X Layer (zero gas for USDT/USDG)
> - Currency: USDT
> - Receiving Wallet: `<agentic_wallet_address>`
> - Services Registered: 3
> - Status: LIVE

**If Payment API is unavailable** — activate Demo Mode automatically:

> [DEMO MODE] The Onchain OS Payment API is not yet available in your environment. I will walk through the complete flow with simulated registration so you can preview the full experience. All security scans remain real.
>
> **[DEMO] Simulated Registration**
> - Network: X Layer
> - Currency: USDT
> - Receiving Wallet: `0xDEMO...abcd` *(simulated)*
> - Services Registered: 3 *(simulated)*
> - Status: DEMO — Live registration will activate when Payment API reaches GA
>
> Continuing with the full demo flow... Your SentryX services are being registered.

---

### Step S3 — Display Live Service Status

Show the service dashboard:

> **Your Security Service Dashboard**
>
> | Service | Price | Network | Receiving Wallet | Status |
> |---------|-------|---------|-----------------|--------|
> | Token Security Scan | 0.1 USDT | X Layer | `<wallet_short>` | LIVE / [DEMO] |
> | Address Security Audit | 0.5 USDT | X Layer | `<wallet_short>` | LIVE / [DEMO] |
> | DApp Security Check | 0.1 USDT | X Layer | `<wallet_short>` | LIVE / [DEMO] |
>
> Your endpoints are discoverable via the x402 service directory. Clients can find and pay for your services automatically.
>
> **Next steps**: Your service will now accept incoming payment-gated requests. Say "show earnings" at any time to view revenue stats.

---

### Step S4 — Handle Incoming Requests

When an incoming x402 request arrives (or when simulating one in demo mode):

**4a. Verify Payment**

In live mode:
- Validate the x402 payment header from the client request
- Confirm payment amount matches the registered service price
- Confirm payment is on X Layer in USDT/USDG

In demo mode:
> [DEMO] Simulating x402 payment verification...
> - Payment header: `X-Payment: x402;amount=0.1;currency=USDT;network=xlayer;tx=0xDEMO...` *(simulated)*
> - Verification: PASSED *(simulated)*
> - Proceeding to execute real security scan...

**4b. Execute Real Security Analysis**

Regardless of whether payment is live or simulated, the security scan MUST be real. Route to the appropriate SentryX analysis based on the service requested:

- **Token Security Scan** → invoke `security-token-scan` skill + Market API for liquidity data
  - Run contract risk scoring
  - Analyze holder concentration
  - Check liquidity depth
- **Address Security Audit** → invoke `security-approvals` skill
  - Scan for high-risk approvals
  - Assess portfolio exposure
  - Detect transaction anomalies
- **DApp Security Check** → invoke `security-dapp-scan` skill
  - Phishing domain detection
  - Contract verification check
  - Interaction risk assessment

**4c. Return Report**

Format and return the completed security report to the client. In demo mode, label the payment-related output clearly:

> **[DEMO] x402 Response Simulation**
> ```
> HTTP/1.1 200 OK
> X-Payment-Received: x402;confirmed;tx=0xDEMO...  [DEMO]
> Content-Type: application/json
>
> {
>   "service": "token-scan",
>   "payment": "confirmed [DEMO]",
>   "report": { ... real scan results ... }
> }
> ```
>
> *(Security analysis above is REAL. Only the payment header is simulated.)*

**4d. Never fabricate security scan results.** If a real scan cannot be completed (e.g., invalid address, API error), return the real error — do not invent a report to satisfy a payment.

---

### Step S5 — Earnings Dashboard

When the user asks for earnings or after handling a batch of requests, show:

> **Earnings Dashboard**
>
> **Today**
> | Service | Requests | Revenue |
> |---------|----------|---------|
> | Token Security Scan | — | — USDT |
> | Address Security Audit | — | — USDT |
> | DApp Security Check | — | — USDT |
> | **Total** | **—** | **— USDT** |
>
> **All Time**
> | Service | Requests | Revenue |
> |---------|----------|---------|
> | Token Security Scan | — | — USDT |
> | Address Security Audit | — | — USDT |
> | DApp Security Check | — | — USDT |
> | **Total** | **—** | **— USDT** |
>
> *(In demo mode, revenue figures are simulated based on the requests processed during this session.)*

---

## BUYER MODE — Use a Paid Security Service

### Step B1 — Discover Available Services

Query the x402 service directory, or present known default services if the directory is unavailable:

> I am looking up available security services on the x402 network...
>
> **Available Security Services**
>
> | # | Provider | Service | Price | Network |
> |---|----------|---------|-------|---------|
> | 1 | SentryX Default | Token Security Scan | 0.1 USDT | X Layer |
> | 2 | SentryX Default | Address Security Audit | 0.5 USDT | X Layer |
> | 3 | SentryX Default | DApp Security Check | 0.1 USDT | X Layer |
>
> Which service would you like to use, and for which token/address/dapp?

Wait for the user to specify the service and the target (token contract, wallet address, or dapp URL).

---

### Step B2 — Confirm Payment

Before executing any payment, always confirm with the user:

> **Payment Confirmation**
>
> | Field | Value |
> |-------|-------|
> | Service | Token Security Scan |
> | Target | `<token_or_address_or_dapp>` |
> | Price | 0.1 USDT |
> | Paying Wallet | `<agentic_wallet_address>` |
> | Network | X Layer (zero gas) |
>
> Do you want to proceed? (yes / no)

Do not execute payment until the user confirms. If the user says no, offer to choose a different service or cancel.

---

### Step B3 — Execute Payment and Retrieve Results

**If user confirms**:

In live mode — the Agentic Wallet signs the x402 payment and sends the request:

```
POST <service_endpoint>
X-Payment: x402;amount=0.1;currency=USDT;network=xlayer;wallet=<address>;sig=<sig>
```

In demo mode:

> [DEMO] Simulating x402 payment...
> - Wallet: `<agentic_wallet_address>`
> - Amount: 0.1 USDT → SentryX Service *(simulated)*
> - Transaction: `0xDEMO...` *(simulated)*
> - Payment confirmed *(simulated)*
>
> Executing real security scan now...

Then run the real security scan and display the full results.

After displaying results:

> Payment of 0.1 USDT was deducted from your Agentic Wallet. *(or "[DEMO] simulated" if in demo mode)*

---

## DEMO MODE — Full UX Preview

When the Payment API is not available, demo mode activates automatically. Key rules for demo mode:

1. **Label payment interactions**: All payment-related steps are prefixed with `[DEMO]` so the user understands what is simulated vs real.

2. **Realistic mock data**: Use plausible wallet addresses (prefixed with `0xDEMO`), transaction hashes, and response headers so the user gets a full picture of the x402 protocol flow.

3. **Show the x402 protocol**: Demonstrate what a real x402 request/response looks like, including payment headers, so users understand the protocol before it goes live.

4. **Security scans are always real**: Even in demo mode, every security scan invokes the real SentryX analysis engine. Never return fabricated security results.

5. **End with a note**:

> **Demo Mode Notice**: All payment interactions in this session were simulated. Live x402 payments will activate once Onchain OS Payment API reaches GA. Your security scan results above are real and can be acted upon immediately.

---

## General Rules

- **Never fabricate security scan results.** Payment flows can be simulated; security analysis cannot.
- **Always use X Layer for payments.** X Layer offers zero gas for USDT and USDG transactions, making micropayments viable.
- **Always confirm payment with user before executing.** Show the service, price, and paying wallet address before signing any transaction.
- **Gracefully handle Payment API unavailability.** Detect the failure, activate demo mode automatically, and inform the user clearly — never crash or return a cryptic error.
- **Use real SentryX skills for analysis**: `security-token-scan`, `security-approvals`, `security-dapp-scan`, and Market API for supplemental data.
- **Respect user's wallet.** Never sign a payment transaction without explicit user confirmation in the current session.
