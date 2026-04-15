# SentryX Safe Trade — 使用示例

## 触发方式

在 Claude Code 中输入：

```
安全地帮我买 0.001 SOL 的 BONK
```

或使用英文：

```
safely buy 0.001 SOL worth of BONK
```

---

## 完整操作流程

### Step 1 — 解析交易意图

用户输入后，SentryX 自动解析：

- **操作**: 用 0.001 SOL 买入 BONK
- **链**: Solana
- **钱包**: `BgpfVr...MZXD4`

系统会先检查钱包状态和余额，确认：
- 钱包已登录
- Solana 链上有足够 SOL 余额

### Step 2 — 四道安全检查 (Security Gate Pipeline)

系统提示：`"Running security pipeline — please wait..."`

随后依次运行全部 4 道安全检查。

---

### Gate 1: 合约安全 (Contract Security)

调用 `security token-scan` 扫描 BONK 合约 (`DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263`)

**扫描结果：**

| 检查项 | 结果 |
|--------|------|
| 蜜罐检测 (Honeypot) | 否 |
| 增发后门 (Mintable) | 否 |
| 买入/卖出税 | 无 |
| 伪造代币 (Counterfeit) | 否 |
| 空投骗局 | 否 |
| 虚假流动性 | 否 |
| 所有权放弃 | 已放弃 |
| 冻结/封锁权限 | 无 |
| 风险代币标记 | 否 |

**结论**: ✅ PASS — 35/35 分

---

### Gate 2: 市场健康度 (Market Health)

查询 BONK 代币市场数据

**市场数据：**

| 指标 | 数值 | 阈值 | 状态 |
|------|------|------|------|
| 价格 | $0.000005712 | — | — |
| 市值 | $502.6M | > $5,000 | ✅ |
| 流动性 | $2.43M | > $1,000 | ✅ |
| 24h 交易量 | $90,213 | > $1,000 | ✅ |
| 持有者数 | 999,198 | — | ✅ |
| 24h 涨跌 | -0.67% | — | 正常 |

**结论**: ✅ PASS — 30/30 分

---

### Gate 3: 代币声誉 (Token Reputation)

分析代币持仓者结构——捆绑率、狙击手比例、前10大持有者集中度。

**检查结果：**

| 检查项 | 值 | 状态 |
|--------|-----|------|
| 捆绑率 (bundler ratio) | 8.2% | ✅ < 30% |
| 狙击手比例 (sniper ratio) | 3.1% | ✅ < 20% |
| 前10持仓占比 (top10) | 42% | ✅ < 60% |

**结论**: ✅ PASS — 15/15 分

---

### Gate 4: 交易模拟 (Transaction Simulation)

调用 `swap quote` 模拟交易路径

**模拟结果：**

| 项目 | 详情 |
|------|------|
| 路由 | SOL → JUP (PancakeSwap V3) → USDC (Orca) → BONK (Orca 62%+33%, Stabble 5%) |
| 预计收到 | 14,417.95 BONK |
| 价格影响 | 0.15% |
| Gas 费 | ~0.000829 SOL (~$0.068) |
| 交易税 | 0% |
| 蜜罐检测 | 双向安全 |

**结论**: ✅ PASS — 20/20 分

---

### Step 3 — 安全评估报告

四道检查完成后，系统生成完整报告：

```
═══════════════════════════════════════════
  SentryX Safe Trade — Security Report
═══════════════════════════════════════════
Token:    Bonk (BONK)
Chain:    Solana
Amount:   0.001 SOL → BONK (买入)

─── Gate 1: Contract Security ───────────
Status:   ✅ PASS
Details:  无蜜罐 | 不可增发 | 无转账税 | 无伪造标记
          所有权已放弃 | 非风险代币 | 无冻结/封锁权限
Score:    35 / 35

─── Gate 2: Market Health ───────────────
Status:   ✅ PASS
Details:  价格: $0.000005712
          市值: $502.6M
          流动性: $2.43M
          24h 交易量: $90,213 (5,280 笔)
          持有者: 999,198
          24h 涨跌: -0.67%
Score:    30 / 30

─── Gate 3: Token Reputation ────────────
Status:   ✅ PASS
Details:  Bundler: 8.2%, Sniper: 3.1%, Top10: 42%
Score:    15 / 15

─── Gate 4: Transaction Simulation ──────
Status:   ✅ PASS
Details:  路由: SOL → JUP (PancakeSwap V3) → USDC
          (Orca) → BONK (Orca 62% + 33%, Stabble 5%)
          预计收到: 14,417.95 BONK
          价格影响: 0.15%
          Gas 费: ~0.000829 SOL (~$0.068)
          交易税: 0%
          蜜罐检测: 双向安全
Score:    20 / 20

─────────────────────────────────────────
  Safety Score:  100 / 100
  Verdict:       ✅ PASS
═══════════════════════════════════════════
```

系统询问：`"所有检查均通过，交易安全。是否确认执行交易？"`

---

### Step 4 — 用户确认后执行交易

用户回复 `yes` 后，系统执行 swap：

```
onchainos swap execute \
  --from 11111111111111111111111111111111 \
  --to DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263 \
  --readable-amount 0.001 \
  --chain solana \
  --wallet BgpfVrWuXN3dvjiVUxiq27jrKT5sfMyPUx2bcGwMZXD4
```

**交易结果：**

| 项目 | 详情 |
|------|------|
| 支出 | 0.001 SOL |
| 收到 | 14,409.83 BONK |
| Gas 费 | 0.0007305 SOL |
| 价格影响 | 0.17% |
| 交易哈希 | `48YgVEqFzddYDgNjptRemv49HFTdhZFoR5sM5J1kXVUSJ7uhCmDQ78zNMAjjheS4G22cJL4YAY5sfaBq7vsS2txg` |
| 状态 | ✅ SUCCESS |

---

## 评分维度与权重

| Gate | 权重 | 说明 |
|------|------|------|
| Gate 1: Contract Security | 35 分 | 合约蜜罐、增发后门、隐藏税率、代理合约等 |
| Gate 2: Market Health | 30 分 | 流动性、交易量、持仓集中度、市值 |
| Gate 3: Token Reputation | 15 分 | 捆绑率、狙击手比例、前10持仓集中度 |
| Gate 4: Transaction Simulation | 20 分 | 交易模拟、异常转账检测、Gas 异常 |
| **总计** | **100 分** | |

## 判定阈值

| 分数区间 | 判定结果 | 处理 |
|----------|----------|------|
| >= 70 | ✅ PASS | 展示报告，询问是否执行 |
| 40–69 | 🟡 WARNING | 展示风险，提示谨慎后可继续 |
| < 40 | 🔴 BLOCKED | 阻止交易，需 `force buy` 强制覆盖 |

## 支持的操作指令

| 指令 | 说明 |
|------|------|
| `安全地帮我买 X 的 Y` | 安全买入代币 |
| `safe swap X for Y` | 安全交换代币 |
| `force buy` | 覆盖 BLOCKED 判定（需二次确认） |
| `cancel` / `取消` | 取消交易 |
