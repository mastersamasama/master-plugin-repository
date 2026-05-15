---
name: privacy-pay
description: This skill should be used when the user asks to "set up Railgun privacy payments", "run privacy pay demo", "configure the Railgun proxy server", "test ZK-SNARK private transfers", or wants to understand the x-social three-tier payment system (MPP / x402 / ZK).
---

# privacy-pay

Set up and run the X-Social Railgun privacy payment system, which provides ZK-SNARK-based private transfers on X Layer.

## X-Social three-tier payment architecture

X-Social uses three payment tiers based on transaction amount:

| Tier | Range | Mechanism | Privacy |
|------|-------|-----------|---------|
| MPP | < $1 | Micro-payment per message | Low (direct transfer) |
| x402 | $1 - $50 | PrivacyEscrow + Agent arbitration | Medium (escrow hides intent) |
| ZK | > $50 | Railgun Privacy Pool + ZK-SNARK | Full (zero-knowledge proof) |

This skill focuses on the **ZK tier** — the Railgun integration.

## How Railgun privacy payments work

```
User A (sender)
    |
    v
Shield: deposit tokens into Railgun Privacy Pool (public -> private)
    |
    v
Transfer: private-to-private transfer inside the pool (ZK-SNARK proof)
    |
    v
Unshield: withdraw tokens from pool (private -> public)
    |
    v
User B (receiver)
```

Each step produces a real on-chain transaction with a ZK-SNARK proof. The link between sender and receiver is cryptographically hidden.

## Setup: Local mode

### Step 1: Start a local Hardhat node with Railgun contracts

The Railgun contracts live in the `railgun/` submodule. Start the local node:

```bash
cd railgun/xlayer-toolkit/railgun/contract
npx hardhat node
```

In a second terminal, deploy the test contracts:

```bash
cd railgun/xlayer-toolkit/railgun/contract
npx hardhat deploy:test --network localhost
```

### Step 2: Start the Railgun proxy server

```bash
cd server
npm install
node index.js
```

The server runs on `http://localhost:3001` and provides:

- `GET /api/health` — check node connectivity and current block number
- `POST /api/privacy-pay` — execute the full Shield -> Transfer -> Unshield demo flow

### Step 3: Test the flow

```bash
# Health check
curl http://localhost:3001/api/health

# Run full privacy payment demo
curl -X POST http://localhost:3001/api/privacy-pay
```

The response includes three transaction hashes:
- `shield` — deposit into privacy pool
- `transfer` — private transfer (ZK-SNARK proof)
- `unshield` — withdraw from pool

### Step 4: Test via web UI

Open `http://localhost:5173/privacy-pay?to=Alice&amount=50&service=consulting` to see the full privacy payment UI flow.

## Setup: X Layer Testnet mode

Set the environment variable to switch to testnet:

```bash
cd server
RAILGUN_NETWORK=testnet node index.js
```

Testnet differences:
- Uses X Layer testnet RPC (`https://testrpc.xlayer.tech`)
- No local Hardhat node needed
- Longer timeouts (up to 5 minutes for ZK-SNARK proof generation)
- Transaction URLs link to `https://www.oklink.com/xlayer-test/tx/<hash>`

## Server configuration

| Env Variable | Default | Description |
|-------------|---------|-------------|
| `RAILGUN_CONTRACT_DIR` | `../railgun/xlayer-toolkit/railgun/contract` | Path to Railgun contract directory |
| `RAILGUN_NETWORK` | `local` | `local` or `testnet` |

## Integration with PrivacyEscrow

For the x402 payment tier ($1-$50), the flow involves PrivacyEscrow:

1. Sender creates a deposit via `PrivacyEscrow.createDeposit()` or `depositViaPermit()` (ERC-20)
2. Agent monitors the conversation / service delivery
3. Agent arbitrates based on RuleSet (custom rules + ERC-8004 trust scores)
4. If approved: `releaseDeposit()` sends funds to receiver
5. If rejected: `refundDeposit()` returns funds to sender
6. After settlement: both parties can submit anonymous P2P feedback via AgentRegistry8004

## Troubleshooting

- **"localhost:8545 not reachable"** — Hardhat node not running. Start it with `npx hardhat node` in the contract directory.
- **"Could not parse tx hashes"** — The demo script failed. Check the Hardhat node logs for errors.
- **Testnet timeout** — ZK-SNARK proof generation can take several minutes on testnet. The server allows up to 5 minutes.
