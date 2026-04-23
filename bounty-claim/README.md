# bounty-claim

> Open-source contribution → verified → USDC in your wallet. Instantly.

## What it does

BountyClaim automates the last mile of open-source bounty settlement.

Open-source bounty tasks range from a simple doc fix to a $5,000 smart contract audit.
They all share the same problem: after the PR gets merged, payment stalls. Platforms rely
on manual review at every step — maintainers verify by hand, hunters chase payment over
email or Discord, transfers go through PayPal or bank wires with 5–10% fees.

BountyClaim fixes this:

1. PR author comments `@bountyclaim 0xYourWalletAddress` on their merged PR
2. Agent verifies PR is merged via GitHub API
3. Agent reads wallet — only accepts comments from the PR author (identity binding)
4. OKX Onchain OS + Base sends USDC to the verified wallet
5. Done in < 30 seconds. No bank. No manual review. No borders.

## Why this matters for OKX ecosystem

- Every bounty settlement = a real on-chain transaction on Base / X Layer
- Developers are the hardest Web3 users to onboard — BountyClaim gives them a reason to create a wallet that isn't speculation
- No platform registration required — any GitHub PR in the world can use this

## Setup

```bash
git clone https://github.com/Cloriskitty/BountyClaim
cd BountyClaim
pip install -r requirements.txt
# Add OKX API keys and private key to .env
python main.py
```

Server runs at http://localhost:5001

## Onchain OS Integration

- **OKX sign-info API** — fetches gas parameters and nonce from Onchain OS
- **Base mainnet** — USDC settlement
- **Roadmap** — X Layer support and OKX native wallet integration planned

## Competitive positioning

Unlike Gitcoin (requires upfront platform registration and fund custody),
BountyClaim works on any existing GitHub PR with zero setup from the bounty poster.

## Built with

- Python + Flask
- OKX Onchain OS API
- GitHub REST API
- web3.py
- Base mainnet (USDC)
