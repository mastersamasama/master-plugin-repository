# SentryX Security Scan — 使用示例

## 触发方式

在 Claude Code 中输入：

```
/security-scan
```

## 扫描结果示例

### 示例 1: 空钱包扫描

```
══════════════════════════════════════
   SentryX Security Health Report
   Wallet: 0xecc4...07df (EVM) / BgpfVr...MZXD4 (Solana)
   Time: 2026-04-13 UTC
══════════════════════════════════════

📊 Overall Security Score: 100/100 🟢 Healthy

  Contract Safety ......... 100/100 (no tokens held)
  Approval Risk ........... 100/100 (no approvals granted)
  Liquidity Health ........ 100/100 (no tokens to evaluate)
  Transaction Anomaly ..... 100/100 (no transactions)
  DApp Reputation ......... 100/100 (no DApp interactions)

────────────────────────────────────
🔴 High Risk (0 items)
────────────────────────────────────
  None

────────────────────────────────────
🟡 Medium Risk (0 items)
────────────────────────────────────
  None

────────────────────────────────────
🟢 Safe (summary)
────────────────────────────────────
  Approvals: 0 (none granted on any chain)
  Tokens:    0 (wallet is empty)
  DApps:     0 (no interactions detected)

────────────────────────────────────
🛡️ Suggested Actions
────────────────────────────────────
  No action required. Your wallet is clean.

══════════════════════════════════════
```

### 示例 2: 持有稳定币的钱包扫描

```
══════════════════════════════════════
   SentryX Security Health Report
   Wallet: 0xecc4...07df (EVM) / BgpfVr...MZXD4 (Solana)
   Time: 2026-04-13 UTC
══════════════════════════════════════

📊 Overall Security Score: 100/100 🟢 Healthy

  Contract Safety ......... 100/100 (USDT — 知名稳定币，豁免扫描)
  Approval Risk ........... 100/100 (无任何授权)
  Liquidity Health ........ 100/100 (仅持有 USDT)
  Transaction Anomaly ..... 100/100 (1 笔正常入账)
  DApp Reputation ......... 100/100 (无 DApp 交互)

────────────────────────────────────
🔴 High Risk (0 items)
────────────────────────────────────
  None

────────────────────────────────────
🟡 Medium Risk (0 items)
────────────────────────────────────
  None

────────────────────────────────────
🟢 Safe (3 items)
────────────────────────────────────
  Approvals: 0 (未授予任何合约权限)
  Tokens:    USDT (0xdac1...1ec7) — $1.00, Ethereum
  DApps:     无交互记录

  Transactions:
  • 收到 1 USDT from 0x2381...0fa3
    TxHash: 0xd92d011e299a3f3c3336a415bc650215c5796dea
            368c5098a88fc2bb01f2c3f1
    Status: SUCCESS

────────────────────────────────────
🛡️ Suggested Actions
────────────────────────────────────
  No immediate action required.

  安全建议:
  1. 当前钱包状态良好，无高危风险
  2. 未配置安全规则（交易限额/白名单），建议前往设置:
     https://web3.okx.com/portfolio/agentic-wallet-policy
  3. 与 DApp 交互时避免授予无限额度的 Token 授权
  4. X Layer 链上转账零 Gas 费，适合小额转账
  5. 资产增加后建议定期重新扫描

══════════════════════════════════════
```

## 评分维度说明

| 维度 | 权重 | 说明 |
|------|------|------|
| Contract Safety | 30% | 持仓代币的合约安全性（蜜罐、增发后门、高税率等） |
| Approval Risk | 25% | Token 授权风险（无限授权、未知 spender） |
| Liquidity Health | 20% | 代币流动性深度与持仓集中度 |
| Transaction Anomaly | 15% | 近期交易是否存在异常模式 |
| DApp Reputation | 10% | 交互过的 DApp/合约的信誉评估 |

## 风险等级

| 分数区间 | 风险等级 | 标识 |
|----------|----------|------|
| 80–100 | Healthy | 🟢 |
| 50–79 | Medium Risk | 🟡 |
| 0–49 | High Risk | 🔴 |

## 后续操作

扫描完成后支持以下指令：

| 指令 | 说明 |
|------|------|
| `revoke risky approvals` / `撤销高危授权` | 撤销所有高风险授权 |
| `sell risky tokens` / `卖出高危Token` | 模拟并执行卖出高风险代币 |
| `full details` / `详细` | 展开完整扫描元数据 |
| `re-scan` / `重新扫描` | 重新执行全量扫描 |

## Token 消耗估算

单次 `/security-scan` 的 LLM token 消耗（粗略估算）：

| 部分 | 估算 Input Tokens | 估算 Output Tokens |
|------|---|---|
| Skill 指令加载 | ~3,000 | — |
| wallet status 调用 + 结果 | ~200 | ~50 |
| 5 个并行数据采集（命令 + 返回） | ~1,500 | ~100 |
| 分析 + 报告生成 | ~500 | ~1,200 |
| **合计（单次扫描）** | **~5,200** | **~1,350** |

> **注意**: 以上仅为 security-scan 单轮的估算。实际消耗还包括整个对话的累积上下文（历史消息均在 context window 中），因此真实 input tokens 会随对话轮次递增。如需精确数据可通过 Anthropic Console → Usage 页面查看。
