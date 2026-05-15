# curator-agent

Turn any agent into a professional DeFi curator — continuously auto-rebalances yield positions across vaults and pools for optimal APY, settled on-chain via OKX Agentic Wallet.

## What's inside

- **Skill**: `curator-agent` — fetches optimal rebalance actions from a curator optimizer API and executes them sequentially on-chain via OKX Agentic Wallet. Supports one-shot, loop (continuous auto-rebalance), and full-withdrawal modes.

## Installation

Install via the OKX Claude Code marketplace:

```
/plugin install curator-agent@master-plugin-repository
```

## Usage

Once installed, invoke any of:

- "rebalance vault"
- "curator rebalance"
- "optimize yield allocations"
- "start rebalance monitor" (loop mode)
- "withdraw all positions"

The skill walks through pre-flight checks (wallet login, network), fetches the optimizer's recommended actions, confirms with you, and executes via Agentic Wallet.

## Author

AlphaYield
