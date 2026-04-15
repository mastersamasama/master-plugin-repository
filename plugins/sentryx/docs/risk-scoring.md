# SentryX Risk Scoring Model

## Overview

SentryX uses a **weighted multi-dimensional scoring system** to evaluate the security and health of on-chain assets, transactions, and DApps. All scores are expressed on a **0–100 scale**, where higher is safer. The final score is a weighted average of five independent dimensions, each assessed by dedicated Onchain OS tools.

---

## Scoring Dimensions

| # | Dimension | Weight | Data Source |
|---|-----------|--------|-------------|
| 1 | Contract Safety | 30% | `security-token-scan` |
| 2 | Approval Risk | 25% | `security-approvals` |
| 3 | Liquidity Health | 20% | Market API |
| 4 | Transaction Anomaly | 15% | `wallet-history` |
| 5 | Token Reputation | 10% | Holder distribution API |

---

## Scoring Logic

Each dimension starts at a base score of **100** and is reduced based on findings:

| Finding Severity | Score Deduction |
|-----------------|-----------------|
| High Risk | -40 per finding |
| Medium Risk | -15 per finding |
| Low Risk | -5 per finding |

- The minimum score per dimension is **0** (floor, no negative scores).
- The **final score** is the weighted average across all five dimensions:

```
Final Score = (Contract Safety × 0.30)
            + (Approval Risk × 0.25)
            + (Liquidity Health × 0.20)
            + (Transaction Anomaly × 0.15)
            + (Token Reputation × 0.10)
```

### Example Calculation

| Dimension | Raw Score | Weight | Contribution |
|-----------|-----------|--------|--------------|
| Contract Safety | 60 | 30% | 18.0 |
| Approval Risk | 45 | 25% | 11.25 |
| Liquidity Health | 85 | 20% | 17.0 |
| Transaction Anomaly | 90 | 15% | 13.5 |
| Token Reputation | 70 | 10% | 7.0 |
| **Final Score** | | | **66.75** |

---

## Score Interpretation

| Score Range | Status | Indicator | Recommended Action |
|-------------|--------|-----------|-------------------|
| 80 – 100 | Healthy | 🟢 | No immediate action required |
| 50 – 79 | Medium Risk | 🟡 | Review flagged items; consider reducing exposure |
| 0 – 49 | High Risk | 🔴 | Immediate action recommended; do not proceed without review |

---

## Safe Trade Gate Scoring

The Safe Trade feature applies a **separate 4-gate model** specifically for evaluating whether a proposed trade should proceed. This model is independent of the general risk score above.

### Gate Weights

| Gate | Weight | Assessment Focus |
|------|--------|-----------------|
| Contract Gate | 35% | Token contract safety (`security-token-scan`) |
| Market Gate | 30% | Liquidity, slippage, price impact (Market API) |
| Reputation Gate | 15% | Bundler ratio, sniper ratio, top-10 holder concentration |
| Simulation Gate | 20% | Transaction simulation outcome |

### Gate Score Calculation

Each gate is scored 0–100 using the same deduction logic as the general model (high -40, medium -15, low -5, floor 0). The weighted average of the four gates produces the **Trade Safety Score**.

### Verdict Thresholds

| Trade Safety Score | Verdict | Description |
|--------------------|---------|-------------|
| >= 70 | **PASS** | Trade is cleared to proceed |
| 40 – 69 | **WARNING** | Trade may proceed with explicit user confirmation |
| < 40 | **BLOCKED** | Trade is blocked; high-risk conditions detected |

### Verdict Behavior

- **PASS**: SentryX presents trade summary and allows execution.
- **WARNING**: SentryX surfaces specific risk details and requires user to confirm before executing.
- **BLOCKED**: SentryX halts the trade, explains the blocking reason(s), and suggests safer alternatives if available.

---

## Notes

- Scores are computed at query time and are **not cached** — real-time data is always fetched.
- Deductions are **cumulative within a dimension** (multiple findings stack, down to the floor of 0).
- The Safe Trade gate model and the general risk score are **independent**; a token may score well overall but still trigger a trade block due to a specific simulation failure.
- All scoring parameters are defined in `skills/shared/scoring.js` and can be adjusted for future calibration.
