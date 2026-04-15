# Sub-Wallet Matrix

SentryX Alpha uses Agentic Wallet sub-wallets to isolate positions by strategy and chain.

## Naming Convention

Format: `{source}-{chain}`

| Source Code | Meaning |
|-------------|---------|
| `sm` | Smart Money signal |
| `sn` | New Token Sniper signal |
| `an` | Price Anomaly signal |
| `buy-{hash}` | External x402 subscription (hash = first 8 chars of URL hash) |

| Chain Code | Blockchain |
|------------|-----------|
| `sol` | Solana |
| `base` | Base |
| `eth` | Ethereum |

## Example Matrix

```
                 Solana     Base       Ethereum
Smart Money      sm-sol     sm-base    sm-eth
New Token        sn-sol       —          —
Price Anomaly    an-sol     an-base    an-eth
External Sub A   buy-a1b2-sol  buy-a1b2-base  —
```

## Lazy Creation

Sub-wallets are NOT pre-created. A wallet is created only when:
1. A signal for that strategy x chain combo first qualifies for execution
2. The signal passes all safety gates
3. The system is about to execute a trade

At creation time:
1. `wallet-create` creates a new sub-wallet
2. The wallet index and address are recorded in `~/.sentryx/wallets/matrix.json`
3. Funds are transferred from the main wallet

## Fund Flow

```
Main Wallet (holds budget)
  -> Signal triggers -> transfer position size to sub-wallet
  -> Sub-wallet executes buy
  -> Sub-wallet holds position
  -> TP/SL/timeout triggers sell
  -> Profits remain in sub-wallet
  -> User can "aggregate" all funds back to main wallet
```

## Limits

- Max ~12 sub-wallets (well under the 50 Agentic Wallet limit)
- Per sub-wallet: max 200 USDT
- Total across all alpha sub-wallets: max 1000 USDT

## matrix.json Format

```json
{
  "wallets": {
    "sm-sol": {
      "index": 2,
      "address": "...",
      "chain": "solana",
      "createdAt": "2026-04-13T14:00:00Z"
    },
    "sn-sol": {
      "index": 3,
      "address": "...",
      "chain": "solana",
      "createdAt": "2026-04-13T14:30:00Z"
    }
  },
  "createdAt": "2026-04-13T13:00:00Z"
}
```
