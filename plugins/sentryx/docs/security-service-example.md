# SentryX Security-as-a-Service (x402) — 使用示例

## 触发方式

在 Claude Code 中输入：

```
开启安全扫描收费服务
```

或使用英文：

```
start my security scanning service
```

---

## 模式说明

Security-as-a-Service 支持两种模式：

| 模式 | 触发关键词 | 说明 |
|------|-----------|------|
| **Seller Mode** | "提供服务"、"收费"、"注册端点"、"start service" | 注册并提供安全扫描服务，赚取 USDT |
| **Buyer Mode** | "使用服务"、"扫描我的Token"、"pay for scan" | 付费使用他人的安全扫描服务 |

本示例演示 **Seller Mode** 完整流程。

---

## Seller Mode 完整流程

### Step S1 — 配置服务目录

系统展示默认服务目录，用户可调整价格或禁用服务：

| # | 服务 | 覆盖内容 | 默认价格 |
|---|------|----------|----------|
| 1 | Token Security Scan | 合约风险评分、持仓集中度、流动性深度 | 0.1 USDT / 次 |
| 2 | Address Security Audit | 授权风险、持仓敞口、交易异常检测 | 0.5 USDT / 次 |
| 3 | DApp Security Check | 钓鱼检测、合约验证、交互风险评估 | 0.1 USDT / 次 |

用户可选择：
- 保持默认继续
- 调整价格（如 "Token Scan 改为 0.2 USDT"）
- 禁用某项服务

**本次选择**: 保持默认价格

---

### Step S2 — 注册 x402 端点

系统尝试通过 Payment API 注册服务。

**注册请求：**

```json
POST /payment/x402/register
{
  "network": "xlayer",
  "currency": "USDT",
  "services": [
    { "id": "token-scan",    "price": "0.1", "endpoint": "/security/token-scan" },
    { "id": "address-audit", "price": "0.5", "endpoint": "/security/address-audit" },
    { "id": "dapp-check",    "price": "0.1", "endpoint": "/security/dapp-check" }
  ]
}
```

> **注意**: 若 Payment API 尚未上线，系统自动进入 Demo Mode。所有支付交互模拟进行，安全扫描保持真实。

---

### Step S3 — 服务仪表盘

注册成功后展示服务状态：

```
╔══════════════════════════════════════════════════════════════╗
║           SentryX Security-as-a-Service Dashboard           ║
╚══════════════════════════════════════════════════════════════╝

Network          : X Layer (零 Gas 费)
Currency         : USDT
Receiving Wallet : 0xecc4...07df

┌─────────────────────────┬──────────┬─────────┬──────────┐
│ Service                 │ Price    │ Network │ Status   │
├─────────────────────────┼──────────┼─────────┼──────────┤
│ Token Security Scan     │ 0.1 USDT │ X Layer │ [DEMO]   │
│ Address Security Audit  │ 0.5 USDT │ X Layer │ [DEMO]   │
│ DApp Security Check     │ 0.1 USDT │ X Layer │ [DEMO]   │
└─────────────────────────┴──────────┴─────────┴──────────┘
```

---

### Step S4 — 处理客户请求

当客户通过 x402 协议发起请求时，流程如下：

#### 请求 1: Token Security Scan (BONK)

**收到请求：**

```
POST /security/token-scan
X-Payment: x402;amount=0.1;currency=USDT;network=xlayer;
           from=0xCLIENT...1234;tx=0xDEMO7f8a...3b2c
Body: { "chain": "solana", "token": "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" }
```

**验证支付：**

| 检查项 | 结果 |
|--------|------|
| 支付金额 | 0.1 USDT ✅ |
| 支付网络 | X Layer ✅ |
| 支付确认 | PASSED ✅ |

**执行真实安全扫描，返回报告：**

```
HTTP/1.1 200 OK
X-Payment-Received: x402;confirmed;tx=0xDEMO7f8a...3b2c
Content-Type: application/json
```

```json
{
  "service": "token-scan",
  "payment": "confirmed",
  "report": {
    "token": "Bonk (BONK)",
    "chain": "Solana",
    "contract": "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    "risk_level": "🟢 Safe",
    "contract_security": {
      "honeypot": false,
      "mintable": false,
      "buy_tax": null,
      "sell_tax": null,
      "counterfeit": false,
      "ownership_renounced": true,
      "freeze_authority": false
    },
    "market_health": {
      "price": "$0.000005719",
      "market_cap": "$503.3M",
      "liquidity": "$2.43M",
      "holders": 999204,
      "volume_24h": "$86,042",
      "price_change_24h": "+0.32%"
    },
    "verdict": "No risk flags detected. Token is safe to hold and trade."
  }
}
```

---

#### 请求 2: Address Security Audit

**收到请求：**

```
POST /security/address-audit
X-Payment: x402;amount=0.5;currency=USDT;network=xlayer;
           from=0xCLIENT...5678;tx=0xDEMOa3c1...9e4f
Body: { "chain": "ethereum", "address": "0xecc4d6f3bfcfd127b4c21b32c608ec27eb8c07df" }
```

**验证支付：**

| 检查项 | 结果 |
|--------|------|
| 支付金额 | 0.5 USDT ✅ |
| 支付网络 | X Layer ✅ |
| 支付确认 | PASSED ✅ |

**执行真实安全扫描，返回报告：**

```json
{
  "service": "address-audit",
  "payment": "confirmed",
  "report": {
    "address": "0xecc4d6f3bfcfd127b4c21b32c608ec27eb8c07df",
    "chain": "Ethereum",
    "risk_level": "🟢 Safe",
    "portfolio": {
      "total_value_usd": "$1.44",
      "tokens": [
        { "symbol": "USDT", "balance": "1", "value": "$1.00", "type": "stablecoin" },
        { "symbol": "ETH",  "balance": "0.0002", "value": "$0.44", "type": "native" }
      ]
    },
    "approval_risk": {
      "total_approvals": 0,
      "high_risk": 0,
      "medium_risk": 0,
      "safe": 0,
      "verdict": "No approvals granted. Zero approval risk."
    },
    "transaction_analysis": {
      "recent_tx_count": 2,
      "anomalies_detected": 0,
      "transactions": [
        {
          "type": "Receive",
          "asset": "1 USDT",
          "from": "0x2381...0fa3",
          "tx_hash": "0xd92d...c3f1",
          "status": "SUCCESS"
        },
        {
          "type": "Receive",
          "asset": "0.0002 ETH",
          "from": "0x2381...0fa3",
          "tx_hash": "0x32d4...3cec",
          "status": "SUCCESS"
        }
      ],
      "verdict": "All transactions are normal incoming transfers. No suspicious patterns."
    },
    "overall_verdict": "Address is clean. No risky approvals, no suspicious tokens, no anomalous transactions."
  }
}
```

---

### Step S5 — 收益仪表盘

```
╔══════════════════════════════════════════════════════════════╗
║           SentryX Earnings Dashboard                        ║
╚══════════════════════════════════════════════════════════════╝

Today (2026-04-13)
┌─────────────────────────┬──────────┬──────────┐
│ Service                 │ Requests │ Revenue  │
├─────────────────────────┼──────────┼──────────┤
│ Token Security Scan     │ 1        │ 0.1 USDT │
│ Address Security Audit  │ 1        │ 0.5 USDT │
│ DApp Security Check     │ 0        │ 0.0 USDT │
├─────────────────────────┼──────────┼──────────┤
│ Total                   │ 2        │ 0.6 USDT │
└─────────────────────────┴──────────┴──────────┘
```

---

## x402 协议说明

### 什么是 x402

x402 是基于 HTTP 402 状态码的微支付协议，允许客户端在请求 API 时自动附带支付凭证。服务端验证支付后返回结果。

### 请求流程

```
Client                          Service (SentryX)
  │                                    │
  │  POST /security/token-scan         │
  │  X-Payment: x402;amount=0.1;...    │
  │ ──────────────────────────────────► │
  │                                    │
  │                    Verify payment   │
  │                    Execute scan     │
  │                                    │
  │  HTTP 200 OK                       │
  │  X-Payment-Received: confirmed     │
  │  Body: { report: ... }             │
  │ ◄────────────────────────────────── │
```

### 为什么选择 X Layer

- **零 Gas 费**: USDT/USDG 转账无需支付 Gas
- **微支付友好**: 0.1 USDT 的小额支付不会被 Gas 费吞噬
- **EVM 兼容**: 标准 EVM 地址和合约交互

---

## 服务定价参考

| 服务 | 建议价格范围 | 说明 |
|------|-------------|------|
| Token Security Scan | 0.05 – 0.5 USDT | 单次合约扫描，轻量级 |
| Address Security Audit | 0.2 – 1.0 USDT | 多维度地址审计，较重 |
| DApp Security Check | 0.05 – 0.5 USDT | 钓鱼/仿冒检测 |

---

## Demo Mode 说明

当 Payment API 尚未上线时，系统自动进入 Demo Mode：

| 项目 | Demo Mode | Live Mode |
|------|-----------|-----------|
| 服务注册 | 模拟 | 真实注册到 x402 网络 |
| 支付验证 | 模拟 | 真实链上验证 |
| 安全扫描 | **真实** | **真实** |
| 收益统计 | 会话内模拟 | 链上真实统计 |

> **关键**: 无论何种模式，安全扫描结果始终为真实数据，可直接参考。

---

## 可用指令

| 指令 | 说明 |
|------|------|
| `show earnings` | 查看收益统计 |
| `模拟一次请求` | 模拟客户请求完整流程 |
| 调整价格 (如 "Token Scan 改为 0.2 USDT") | 更新服务定价 |
| 禁用/启用服务 | 管理服务目录 |
