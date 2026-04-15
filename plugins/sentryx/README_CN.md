# SentryX

> **AI 驱动的链上 Alpha 猎手 & 安全守护者**

SentryX 是一个**自主链上 Agent**，同时保护你的资产并发现 Alpha 机会。深度集成 Onchain OS **全部 5 大模块**（钱包、交易、行情、支付、安全），提供：

- 自动化多源信号发现（聪明钱 + 新币 + 价格异常）
- 每笔交易前的 **4 关安全管道**（合约安全 → 市场健康 → 代币声誉 → 交易模拟）
- 全自动交易：追踪止盈/止损 + **子钱包风险隔离**
- **双向 x402 信号市场** — 向其他 Agent 出售 Alpha 信号，或订阅购买
- 实时 Web Dashboard（中文默认），SSE 推送，无需刷新
- 8 个 Claude Code 插件技能，支持自然语言交互

---

## 快速开始

```bash
git clone https://github.com/mastersamasama/master-plugin-repository.git
cd master-plugin-repository/sentryx
npm install
npm run start
```

打开浏览器访问 **http://localhost:3000**。

### Demo 模式（推荐首次体验）

```bash
DEMO=true npm run start
```

Demo 模式使用模拟数据运行完整的**信号 → 评分 → 安全 → 交易**管道，无需真实钱包或链上资产。

演示预热（可选，预填充信号和持仓数据）：

```bash
bash demo-warmup.sh
```

### 前置要求

- **Node.js** >= 18
- **onchainos CLI** 安装并登录（仅生产模式需要，Demo 模式无需）：
  ```bash
  npx skills add okx/onchainos-skills
  onchainos wallet login <你的邮箱>
  onchainos wallet verify <验证码>
  onchainos wallet status
  ```

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `DEMO` | — | 设为 `true` 启用 Demo 模式（模拟数据） |
| `OKX_API_KEY` | — | MCP 行情数据 API Key（生产模式必须） |
| `SENTRYX_PORT` | `3000` | Dashboard 端口 |
| `SENTRYX_X402_PORT` | `8402` | x402 信号服务器端口 |
| `SENTRYX_STORE` | `~/.sentryx` | 数据持久化目录 |

---

## Web Dashboard

启动后打开 `http://localhost:3000`，进入实时 Dashboard：

```
┌─────────────────────────────────────────────────────────────────┐
│  SentryX  ● 扫描中  │ 信号:24  交易:5  胜率:60%  +$8.95  │ [停止]│
├─────────────────────────────────────────────────────────────────┤
│  📡 扫描 12 → ⚡ 评分 5 → 🛡️ 安全 3 → 💰 交易 2                │
├──────────┬──────────────────────┬───────────────────────────────┤
│ 钱包     │ 实时信号              │ 持仓（子钱包隔离）            │
│ $1,010   │                      │                               │
│ ◆ SOL    │ BONK SOL             │ POPCAT sm-sol  +15.4%  追踪   │
│ ◆ ETH    │  SM:85 PA:72         │ WIF    sm-sol  -1.3%   监控   │
│ ◆ Base   │  买入 82/100         │ DEGEN  sm-base -0.1%   监控   │
│          │                      │ BRETT  sm-base +2.6%   监控   │
│ 活动日志 │ MOG Base             │                               │
│ 09:24 买入│  SM:55  跳过         │ 已实现: +$0.00                │
│ 09:24 拦截│                     │ 未实现: +$8.95                │
├──────────┴──────────────────────┴───────────────────────────────┤
│ ● LIVE :8402 (0.1 USDG/signal) [停止卖信号] 收入:0 支出:0      │
└─────────────────────────────────────────────────────────────────┘
```

### Dashboard 功能

| 区域 | 功能 |
|------|------|
| **顶部 Header** | 钱包状态、KPI 指标（信号/交易/胜率/盈亏）、开始/停止/报告、中英文切换 |
| **管道可视化** | 实时展示：扫描 → 评分 → 安全检查 → 交易，数字实时更新 |
| **左栏：钱包** | 按链分组展示主钱包余额（Solana / Ethereum / Base） |
| **左栏：活动日志** | 实时事件流（买入 / 卖出 / 安全通过 / 跳过 / 拦截 / 扫描） |
| **中间：信号卡片** | 实时信号，展示来源标签（SM/NT/PA）、复合评分、安全评分、操作结果 |
| **中间：信号详情** | 点击展开：聪明钱地址+标签+金额、各来源得分、4关安全检查详情 |
| **右栏：活跃持仓** | PnL 实时更新、追踪止盈/监控状态、子钱包名称 |
| **右栏：持仓详情** | 点击展开：信号评分、安全评分、入场/当前价格、最高涨幅、止盈止损阈值 |
| **右栏：已平仓** | 平仓原因（止盈/止损/超时/手动）、已实现盈亏 |
| **底部：x402** | 信号卖出控制（开始/停止）+ 收入、信号订阅输入框 + 支出 |
| **安全 Tab** | 钱包持仓安全扫描（10 项检查）、手动代币扫描（详细报告卡片）、8 个插件技能展示 |

所有更新通过 **SSE** 实时推送 — 无需刷新页面。

---

## 工作原理

### 1. 信号发现（3 个信号源，并行扫描）

| 来源 | 检测内容 | 权重 |
|------|---------|------|
| **聪明钱** | >= 2 个鲸鱼/KOL 地址在 1 小时内买入同一代币 | 40% |
| **新币** | 新上线代币，开发者无 rug 历史，捆绑率 < 30% | 35% |
| **价格异常** | 交易量激增 >= 3x 且价格突破 24h 高点 | 25% |

信号合并为**复合评分**（0-100）。资格阈值：聪明钱 >= 70、新币 >= 75、价格异常 >= 80、多源 >= 60。

### 2. 安全门（4 关，拒绝不安全代币）

| 关卡 | 检查项 | 分数 |
|------|--------|------|
| 合约安全 | 蜜罐、增发后门、转账税、隐藏所有者 via `security-token-scan` | /35 |
| 市场健康 | 前10持仓占比、流动性、24h交易量、市值 via MCP | /30 |
| 代币声誉 | 捆绑率、狙击手比例、前10持仓集中度 via MCP | /15 |
| 交易模拟 | 预执行模拟、异常检测 via `security-tx-scan` | /20 |

评分 >= 70：**自动执行**。40-69：跳过。< 40：加入黑名单（后续扫描自动跳过）。

### 3. 自动交易

- 通过 Onchain OS DEX 聚合器执行交易（500+ DEX，20+ 链）
- 每个信号源 x 链组合使用独立**隔离子钱包**（如 `sm-sol`、`an-base`）
- **追踪止盈**：+50% 激活，从最高点回落 10% 时卖出
- **固定止损**：-20% 立即卖出
- **超时**：24 小时后自动平仓
- **硬限制**：单笔 <= 50 USDT，单钱包 <= 200 USDT，总敞口 <= 1000 USDT

### 4. x402 信号市场（Agent-to-Agent）

**卖出信号**：启动本地 x402 支付网关服务器（`:8402`）。其他 Agent 发起请求，收到 `402 Payment Required`，支付 0.1 USDG（X Layer 零 Gas），获得信号数据。服务端验证签名结构和收款地址匹配后才返回数据。

**买入信号**：订阅任意 x402 信号源 URL。SentryX 自动探测 → 检查支付限额 → 签名支付 → 获取信号 → 运行 4 关安全检查 → 在隔离钱包中执行交易。

**自循环演示**：启动卖出，然后在底部订阅框输入 `http://localhost:8402/signals/latest` — 一台机器演示完整的 Agent-to-Agent 信号交易循环。

---

## Onchain OS 集成深度

SentryX 使用 **Onchain OS 全部 5 个模块**：

### 钱包（Wallet）
| 接口 | 用途 |
|------|------|
| `wallet-login` / `wallet-verify` | 邮箱 + OTP 登录（TEE 托管） |
| `wallet-status` | 验证登录状态 |
| `wallet-balance` | 按链查询持仓余额 |
| `wallet-create` | 创建隔离子钱包（策略 x 链） |
| `wallet-switch` | 在主钱包和子钱包间切换 |
| `wallet-send` | 转账、给子钱包充值、归集资金 |
| `wallet-addresses` | 获取各链地址 |

### 安全（Security）
| 接口 | 用途 |
|------|------|
| `security-token-scan` | 合约风险分析（蜜罐、增发后门、转账税、代理合约、隐藏所有者等 10 项） |
| `security-tx-scan` | 交易预执行模拟，检测资产流失风险 |
| `security-approvals` | 代币授权风险审计 |

### 行情（Market，via MCP Server）
| 接口 | 用途 |
|------|------|
| `getSmartMoneyActivity` | 聪明钱/KOL 买入信号（地址 + 标签 + 金额） |
| `getNewPairs` | 新币上线扫描（bonding curve 进度） |
| `getTrendingTokens` | 趋势代币发现（交易量激增 + 价格异常） |
| `getTokenDetail` | 代币详情（持仓集中度、流动性、市值、交易量） |
| `getTokenPrice` | 实时跨链定价（持仓监控用） |
| `getHolderDistribution` | 持仓分布（捆绑率/狙击手/鲸鱼占比） |
| `getDevInfo` | 开发者信誉（rug 历史、过往项目） |

### 交易（Trade）
| 接口 | 用途 |
|------|------|
| `dex-quote` | 500+ DEX 最优路由报价 |
| `dex-swap` | 通过聚合器执行交易（滑点控制） |

### 支付（Payment）
| 接口 | 用途 |
|------|------|
| `x402-pay` | TEE 签名 x402 微支付（购买信号） |
| 信号服务器 | x402 支付网关出售信号（`402 → 验证签名 → 返回数据`） |

---

## 项目结构

```
sentryx/
├── package.json                     # npm install && npm run start
├── tsconfig.json                    # TypeScript 严格模式
├── demo-warmup.sh                   # 演示预热脚本（预填充数据）
│
├── src/                             # TypeScript 应用
│   ├── index.ts                     # 入口：Express 服务器 + Demo 模式切换
│   ├── config.ts                    # 类型定义、默认值、链配置、硬限制
│   ├── store.ts                     # JSON 文件持久化 (~/.sentryx/)
│   │
│   ├── api/
│   │   ├── routes.ts                # REST API + SSE + 扫描循环 + 登录
│   │   ├── mcp-client.ts            # Onchain OS MCP Server HTTP 客户端
│   │   └── cli.ts                   # onchainos CLI 封装
│   │
│   ├── core/
│   │   ├── scanner.ts               # 3 源信号扫描引擎（并行）
│   │   ├── scorer.ts                # 复合评分（纯函数）
│   │   ├── safety.ts                # 4 关安全管道
│   │   ├── trader.ts                # 自动交易执行 + 硬限制检查
│   │   ├── position.ts              # 追踪止盈/止损/超时管理
│   │   └── wallet-matrix.ts         # 子钱包矩阵（懒创建）
│   │
│   ├── mock/                        # Demo 模式模拟层
│   │   ├── mock-mcp.ts              # 模拟行情数据 + 价格随机游走
│   │   └── mock-cli.ts              # 模拟钱包/安全/交易/支付
│   │
│   └── x402/
│       ├── signal-server.ts         # x402 支付网关（签名验证 + 信号卖出）
│       └── signal-buyer.ts          # x402 信号订阅（探测 + 付款 + 安全检查 + 执行）
│
├── public/                          # Web Dashboard（无需构建步骤）
│   ├── index.html                   # 暗色主题 Tailwind SPA（中文默认）
│   └── app.js                       # SSE + 状态管理 + 中英文 i18n
│
├── skills/                          # Claude Code 插件技能（8 个）
│   ├── alpha-hunt/SKILL.md          # 信号发现 + 自动交易
│   ├── alpha-sell/SKILL.md          # x402 信号卖出
│   ├── alpha-buy/SKILL.md           # x402 信号订阅
│   ├── security-scan/SKILL.md       # 钱包安全扫描
│   ├── safe-trade/SKILL.md          # 安全交易守卫
│   ├── portfolio-guard/SKILL.md     # 持仓风险监控
│   ├── multi-wallet-audit/SKILL.md  # 多钱包审计
│   └── security-service/SKILL.md    # 安全即服务
│
├── .claude-plugin/
│   └── plugin.json                  # 插件元数据
│
└── docs/                            # 文档
    ├── risk-scoring.md              # 风险评分模型
    ├── demo-script.md               # 演示录屏指南
    ├── wallet-matrix.md             # 子钱包矩阵设计
    └── alpha-signal-format.md       # 信号数据格式
```

---

## 技术栈

| 层 | 技术 |
|----|------|
| 语言 | TypeScript（严格模式） |
| 后端 | Express v4 |
| 前端 | HTML + Vanilla JS + Tailwind CSS (CDN) |
| 实时通信 | Server-Sent Events (SSE) |
| 行情数据 | Onchain OS MCP Server (JSON-RPC) |
| 钱包/交易/安全 | onchainos CLI（TEE 签名） |
| 持久化 | JSON 文件 (`~/.sentryx/`) |
| x402 支付 | X Layer，USDG，零 Gas |

**依赖极简**：仅 `express` 一个运行时依赖 + TypeScript 工具链。

---

## API 参考

### 认证

| 方法 | 端点 | 描述 |
|------|------|------|
| POST | `/api/auth/login` | 邮箱登录（发送验证码） |
| POST | `/api/auth/verify` | 验证码确认 |

### 状态与数据

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/status` | 钱包 + 策略 + 扫描状态 + Demo 标识 |
| GET | `/api/portfolio` | 按链分组的钱包余额 |
| GET | `/api/signals` | 最近发现的信号（含评分和安全结果） |
| GET | `/api/positions` | 活跃 + 已平仓持仓 |
| GET | `/api/report` | 综合报告（盈亏 + x402 收支） |

### 策略控制

| 方法 | 端点 | 描述 |
|------|------|------|
| POST | `/api/strategy/start` | 启动扫描循环（请求体：策略配置） |
| POST | `/api/strategy/stop` | 停止扫描 |
| POST | `/api/sell/:id` | 手动卖出指定持仓 |
| POST | `/api/aggregate` | 归集全部子钱包资金到主钱包 |

### 安全

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/security/scan` | 钱包持仓安全扫描（10 项检查） |
| POST | `/api/security/token-scan` | 手动扫描单个代币（详细报告） |
| GET | `/api/security/approvals` | 授权风险查询 |

### x402 信号市场

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/x402/status` | 信号卖出/订阅状态 |
| POST | `/api/x402/sell/start` | 启动 x402 信号服务器 (:8402) |
| POST | `/api/x402/sell/stop` | 停止 x402 信号服务器 |
| POST | `/api/x402/buy` | 订阅外部 x402 信号源并自动执行 |

### 实时推送

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/events` | SSE 事件流（signal:new, trade:executed, position:update, position:closed, x402:payment, pipeline:update, activity） |

---

## 安全限制

| 限制 | 值 | 可配置？ |
|------|---|---------|
| 单笔交易上限 | 50 USDT | 否（硬编码） |
| 单子钱包上限 | 200 USDT | 否（硬编码） |
| 总 Alpha 敞口 | 1,000 USDT | 否（硬编码） |
| x402 单笔信号 | 0.5 USDT | 否（硬编码） |
| x402 每日支出 | 5.0 USDT | 否（硬编码） |
| 默认仓位大小 | 5 USDT | 是 |
| 止盈触发 | +50% | 是 |
| 追踪回撤 | 10% | 是 |
| 止损 | -20% | 是 |
| 超时 | 24h | 是 |
| 扫描间隔 | 30s（最小 10s） | 是 |

---

## 支持的链

| 链 | 信号源 | 交易 | x402 支付 |
|----|--------|------|----------|
| **Solana** | 聪明钱 + 新币 + 价格异常 | DEX Swap | — |
| **Base** | 聪明钱 + 价格异常 | DEX Swap | — |
| **Ethereum** | 聪明钱 + 价格异常 | DEX Swap | — |
| **X Layer** | — | — | 零 Gas 结算 |

---

## 两种使用方式

### 1. Web Dashboard（主要）

```bash
npm install && npm run start
# 打开 http://localhost:3000
```

完整实时 Dashboard：信号发现、安全扫描、自动交易、持仓监控、x402 信号市场。

### 2. Claude Code 插件（附加）

8 个自然语言技能：

| 技能 | 说明 |
|------|------|
| `/sentryx:alpha-hunt` | 多源信号发现 + 4 关安全自动交易 |
| `/sentryx:alpha-sell` | x402 信号卖出 |
| `/sentryx:alpha-buy` | x402 信号订阅 + 自动执行 |
| `/sentryx:security-scan` | 钱包安全扫描（10 项检查） |
| `/sentryx:safe-trade` | 单笔交易 4 关安全评估 |
| `/sentryx:portfolio-guard` | 持仓风险监控 + 自动处置 |
| `/sentryx:multi-wallet-audit` | 多钱包安全审计 |
| `/sentryx:security-service` | 安全即服务（x402 微支付） |

自然语言交互："帮我找 Alpha 机会"、"扫描我的钱包安全"、"开始卖信号"。

---

## 说明

- **无代码中的密钥**：认证通过 Agentic Wallet 邮箱登录。生产模式需设置 `OKX_API_KEY` 环境变量，或使用 `DEMO=true` 模式。
- **TEE 签名**：所有交易签名在可信执行环境（TEE）中完成，私钥永远不会离开安全飞地。
- **x402 签名验证**：信号服务器对付款证明做完整结构验证（base64 解码 → 字段校验 → 收款地址匹配），非简单 header 检查。
- **Demo 模式**：`DEMO=true` 启动时使用模拟数据（8 个代币池 + 价格随机游走），完整展示信号 → 评分 → 安全 → 交易管道。模拟层（`mock-mcp.ts` + `mock-cli.ts`）与真实接口同接口，可无缝切换。

---

## License

仅供内部使用。
