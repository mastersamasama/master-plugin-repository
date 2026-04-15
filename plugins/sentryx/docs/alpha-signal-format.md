# Alpha Signal JSON Format

Standard format for signals produced by alpha-hunt and served by alpha-sell.

## Schema

```json
{
  "signalId": "sig_<YYYYMMDD>_<sequential>",
  "timestamp": "<ISO 8601 UTC>",
  "token": {
    "symbol": "<TOKEN_SYMBOL>",
    "address": "<contract_address>",
    "chain": "<solana|base|ethereum>"
  },
  "sources": {
    "smartMoney": {
      "score": 0-100,
      "wallets": "<number of smart money addresses>",
      "totalBuyUsd": "<total USD bought>"
    },
    "newToken": {
      "score": 0-100,
      "devHistory": "<clean|has_successful_launches>",
      "bundlerRatio": "<percentage>",
      "bondingCurveProgress": "<percentage>"
    },
    "priceAnomaly": {
      "score": 0-100,
      "volumeMultiplier": "<float>",
      "priceBreakoutPct": "<percentage above 24h high>"
    }
  },
  "compositeScore": 0-100,
  "safetyScore": 0-100,
  "action": "BUY",
  "suggestedEntry": "<float, token price at signal time>",
  "suggestedTakeProfit": "+50%",
  "suggestedStopLoss": "-20%"
}
```

## Notes

- `sources` fields are `null` if that signal source did not contribute to this signal
- `compositeScore` is the weighted combination: smartMoney x 0.4 + newToken x 0.35 + priceAnomaly x 0.25
- `safetyScore` is the 4-gate safe-trade score (0-100) applied after signal qualification
- `signalId` format: `sig_` + date (YYYYMMDD) + `_` + 3-digit sequential number (e.g., `sig_20260413_001`)

## Storage

- Latest signal: `~/.sentryx/signals/latest.json` (single object, overwritten each time)
- History: `~/.sentryx/signals/history/<YYYY-MM-DD>.json` (array of signals per day, appended)
