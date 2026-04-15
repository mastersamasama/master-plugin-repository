# SentryX 多钱包安全审计 — 使用示例

## 触发方式

在 Claude Code 中输入：

```
检查我所有钱包的安全状况
```

或使用英文：

```
check all my wallets
```

---

## 完整操作流程

### Prerequisites — 验证登录状态

系统调用 `wallet status` 确认钱包已登录，并记录当前活跃钱包作为原始钱包（审计结束后会切回）。

**本次结果：**
- 已登录: team@example.com
- 当前钱包: Account 1 (`d10c5771-3cb3-4684-99ab-b258a9632f57`)

---

### Step 1 — 枚举所有钱包

调用 `wallet balance --all` 获取所有子钱包信息。

**本次结果：**

| 项目 | 数值 |
|------|------|
| 总钱包数 | 1 |
| 非空钱包 | 1 |
| 空钱包（跳过） | 0 |
| 总资产 | $2.98 |

由于非空钱包数 ≤ 10，直接执行 **Full Scan**，无需询问用户选择。

> **注意**: 若非空钱包数 > 10，系统会询问用户选择 Quick Scan（仅余额+授权数）或 Full Scan（完整代币安全分析）。

**钱包清单：**

| Index | 名称 | EVM 地址 | Solana 地址 | 余额 |
|-------|------|----------|-------------|------|
| 0 | Account 1 | 0xecc4...07df | BgpfVr...MZXD4 | $2.98 |

---

### Step 2 — 逐钱包安全数据采集

对每个非空钱包，并行执行以下操作：

#### 2a. 授权扫描 (security-approvals)

分别扫描 EVM 和 Solana 地址的 Token 授权。

| 链 | 授权数量 |
|----|----------|
| EVM (0xecc4...07df) | 0 条 |
| Solana (BgpfVr...MZXD4) | 0 条 |

#### 2b. 持仓获取 (wallet-balance)

| 代币 | 链 | 余额 | 价值 | 类型 |
|------|----|------|------|------|
| USDT | Ethereum | 1 | $1.00 | 稳定币 — 豁免 |
| ETH | Ethereum | 0.0002 | $0.44 | 原生代币 — 豁免 |
| USDC | Solana | 0.9 | $0.90 | 稳定币 — 豁免 |
| SOL | Solana | 0.0068 | $0.56 | 原生代币 — 豁免 |
| **Bonk** | **Solana** | **14,409.83** | **$0.08** | **需要扫描** |

#### 2c. 非稳定币代币安全扫描

仅 BONK 需要扫描，调用 `security token-scan`：

| 检查项 | 结果 |
|--------|------|
| 蜜罐检测 (Honeypot) | ✅ 否 |
| 增发后门 (Mintable) | ✅ 否 |
| 买入/卖出税 | ✅ 无 |
| 伪造代币 (Counterfeit) | ✅ 否 |
| 空投骗局 | ✅ 否 |
| 虚假流动性 | ✅ 否 |
| 所有权放弃 (Renounced) | ✅ 已放弃 |
| 冻结/封锁权限 | ✅ 无 |
| 资产编辑权限 | ✅ 无 |
| 刷量嫌疑 | ✅ 否 |
| 风险代币标记 | ✅ 否 |

同步调用 `token price-info` 获取市场数据：

| 指标 | 数值 | 风险阈值 | 状态 |
|------|------|----------|------|
| 市值 | $503M | > $5,000 | ✅ |
| 流动性 | $2.43M | > $1,000 | ✅ |
| 24h 交易量 | $86,061 | > $1,000 | ✅ |
| 持有者数 | 999,204 | — | ✅ |
| 24h 涨跌 | +0.18% | — | 正常 |

---

### Step 3 — 钱包安全评分

使用五维加权模型计算安全分数：

| 维度 | 分数 | 权重 | 加权 |
|------|------|------|------|
| Contract Safety | 100 | 30% | 30.0 |
| Approval Risk | 100 | 25% | 25.0 |
| Liquidity Health | 100 | 20% | 20.0 |
| Transaction Anomaly | 100 | 15% | 15.0 |
| DApp Reputation | 100 | 10% | 10.0 |
| **总计** | | | **100.0** |

评分结果: **100/100 🟢 Healthy**

---

### Step 4 — 跨钱包风险聚合

由于仅有 1 个钱包，跨钱包分析结果如下：

#### 4a. 共享授权风险
N/A — 仅 1 个钱包，无跨钱包授权重叠

#### 4b. 资产集中度
Wallet #0 持有 100% 资产 — 仅有单一钱包，集中度分析不适用

#### 4c. 链分布

| 链 | 金额 | 占比 |
|----|------|------|
| Ethereum | $1.44 | 48.3% |
| Solana | $1.54 | 51.7% |

#### 4d. 全局高风险敞口
$0.00 (0% of portfolio)

---

### Step 5 — 生成全局安全地图

```
╔══════════════════════════════════════════════════════════════╗
║           SentryX Global Security Map                       ║
║           Multi-Wallet Audit Report                         ║
║           Time: 2026-04-13 UTC                              ║
╚══════════════════════════════════════════════════════════════╝

📋 Wallet Roster Summary
Total wallets found: 1  |  Scanned: 1  |  Skipped (empty): 0

────────────────────────────────────────────────────────────────
WALLET-BY-WALLET SUMMARY
────────────────────────────────────────────────────────────────

🟢 Wallet #0 — Account 1
  EVM     : 0xecc4d6f3bfcfd127b4c21b32c608ec27eb8c07df
  Solana  : BgpfVrWuXN3dvjiVUxiq27jrKT5sfMyPUx2bcGwMZXD4
  Value   : $2.98
  Score   : 100/100
  Key Risk: No issues found

  Holdings:
    USDT ......... 1         $1.00  (Ethereum, 稳定币)
    USDC ......... 0.9       $0.90  (Solana, 稳定币)
    SOL .......... 0.0068    $0.56  (Solana, 原生代币)
    ETH .......... 0.0002    $0.44  (Ethereum, 原生代币)
    Bonk ......... 14,409.83 $0.08  (Solana, ✅ 合约安全)

  Approvals: 0 high / 0 medium / 0 safe

  Token Scan — Bonk (BONK):
    蜜罐: 否 | 增发: 否 | 交易税: 无 | 伪造: 否
    所有权: 已放弃 | 流动性: $2.43M | 持有者: 999K
    市值: $503M | 24h量: $86K
    结论: ✅ Safe

────────────────────────────────────────────────────────────────
CROSS-WALLET RISK FINDINGS
────────────────────────────────────────────────────────────────

🔗 Shared Approval Risks (0)
  N/A — 仅有 1 个钱包，无跨钱包授权风险

⚖️ Asset Concentration
  Total Portfolio Value : $2.98
  Wallet #0 (Account 1): 100% of total
  → 仅有单一钱包，集中度分析不适用

🌐 Chain Distribution
  Ethereum : $1.44 (48.3%) — USDT + ETH
  Solana   : $1.54 (51.7%) — USDC + SOL + BONK

────────────────────────────────────────────────────────────────
GLOBAL SUMMARY
────────────────────────────────────────────────────────────────

  Total Portfolio Value    : $2.98
  Global High-Risk Exposure: $0.00 (0% of portfolio)
  Wallets in 🔴 High Risk  : 0
  Wallets in 🟡 Medium Risk: 0
  Wallets in 🟢 Healthy    : 1

────────────────────────────────────────────────────────────────
🛡️ Recommended Actions
────────────────────────────────────────────────────────────────
  No immediate action required. All wallets are healthy.

  建议:
  1. 未配置安全规则（交易限额/转账白名单），建议前往:
     https://web3.okx.com/portfolio/agentic-wallet-policy
  2. 资产增长后可考虑分散到多个子钱包降低单点风险
  3. 定期执行多钱包审计，监控授权和持仓变化

────────────────────────────────────────────────────────────────
Available Commands
────────────────────────────────────────────────────────────────
  • "batch revoke risky approvals" — 批量撤销所有高危授权
  • "clean wallet #N"              — 清理指定钱包的风险资产和授权
  • "details #N"                   — 查看指定钱包的完整安全报告
  • "isolate risky tokens"         — 将高危代币隔离到新子钱包

══════════════════════════════════════════════════════════════════
```

---

## 评分维度说明

| 维度 | 权重 | 数据来源 | 说明 |
|------|------|----------|------|
| Contract Safety | 30% | token-scan 结果 | 合约蜜罐、增发后门、隐藏税率等 |
| Approval Risk | 25% | security-approvals | 无限授权、未知 spender |
| Liquidity Health | 20% | 市场数据 | 流动性深度、持仓集中度 |
| Transaction Anomaly | 15% | 授权时间 + 代币年龄 | 异常交易模式 |
| DApp Reputation | 10% | spender 分类 | 交互合约的信誉 |

## 扣分规则

| 风险等级 | 单项扣分 |
|----------|----------|
| High Risk | -40 分 |
| Medium Risk | -15 分 |
| Low Risk | -5 分 |

每个维度最低 0 分，不会为负。

## 跨钱包风险分析说明

| 分析维度 | 说明 |
|----------|------|
| 共享授权风险 | 同一 spender 被 2+ 个钱包授权 → 高风险 |
| 资产集中度 | 单钱包 > 80% 资产 → 高集中风险 |
| 链分布 | 各链资产占比（仅信息性，不影响评分） |
| 全局高危敞口 | 所有钱包高风险代币的 USD 总值 |

## 后续操作指令

| 指令 | 说明 |
|------|------|
| `batch revoke risky approvals` / `批量撤销高危授权` | 跨所有钱包批量撤销高危授权 |
| `clean wallet #N` / `清理钱包 #N` | 卖出风险代币 + 撤销授权 |
| `details #N` / `查看钱包 #N 详情` | 对指定钱包执行完整 security-scan |
| `isolate risky tokens` / `隔离高危资产` | 创建隔离子钱包并转移高危代币 |

## Quick Scan vs Full Scan

当非空钱包数 > 10 时，系统会询问用户选择扫描模式：

| 模式 | 内容 | 速度 |
|------|------|------|
| **Quick Scan** | 余额汇总 + 授权数量统计 | 较快 (~N×5s) |
| **Full Scan** | 完整代币合约安全分析 + 授权详情 | 较慢 (~N×30s) |

≤ 10 个钱包时默认执行 Full Scan。
