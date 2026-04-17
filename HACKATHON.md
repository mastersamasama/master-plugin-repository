# OKX Onchain OS Agent Hackathon

> 内部使用 / Internal use only. See [LICENSE](./LICENSE).

## 🎯 挑战任务 / The Challenge

搭一个真正好用、好玩的 Agent。不是演示项目，不是套壳包装。我们要找的是真正跑得起来、能接任务、持续提供服务的 Agent —— 它们将成为 Onchain OS 生态里正式入驻的 Agent，未来将进入 OKX.AI / Plugin Store 生态中面向真实用户场景。

Build a genuinely useful, fun Agent that integrates with [Onchain OS](https://www.okx.com/web3/build/docs/waas/about-onchain-os). Not a demo wrapper — a real, working Agent that can take on tasks and provide ongoing value. Winning entries will be officially onboarded into the Onchain OS ecosystem and may enter the OKX.AI / Plugin Store for real user scenarios.

## 📅 时间线 / Timeline

| 时间 | 节点 |
|---|---|
| **即刻开始** | 报名 & 开发 / Registration & development starts |
| **2026-04-22** | 🔒 提交截止 (Demo + GitHub) / Submission deadline |
| **2026-04-27** | 🏆 结果公布 / Results announced |

## 💰 奖金池 / Prize Pool — 8,000 USDT

| 名次 | 奖金 | 彩蛋 |
|---|---|---|
| 🥇 第 1 名 | 2,000 USDT | 和超哥吃饭 🍽️ |
| 🥈 第 2 名 | 1,500 USDT | 和超哥吃饭 🍽️ |
| 🥉 第 3 名 | 1,000 USDT | 和超哥吃饭 🍽️ |
| 其余入围奖 × 7 | 500 USDT | — |

## 👥 参赛资格 / Eligibility

- **全体内部员工**，不限部门 / All OKX employees, any department
- 个人或组队均可，每队最多 **3 人** / Solo or team, max 3 per team
- 同一参赛者最多可提交 **3 个**不同的 Agent / One person may submit up to 3 different Agents
- 评委可以参赛，打分时匿名并严格跳过自己的作品 / Judges may participate; they score anonymously and skip their own work
- **必须用原创新项目**，已有的公司任何项目和基础都不能用来提交 / Must be original new work — no existing company projects

## 🛠️ 技术要求 / Technical Requirements

### 集成要求 / Integration

- **必须调用 [Onchain OS](https://www.okx.com/web3/build/docs/waas/about-onchain-os)**，开发框架与语言不限
- Onchain OS 相关技术问题，请联系评委组
- Must integrate Onchain OS; any dev framework or language

### 代码规范 / Code Standards

- 提交 GitHub 仓库（public 或 private 均可）/ Submit a GitHub repo (public or private OK)
- 包含完整 **README**，说明项目功能与运行方式 / Complete README explaining what it does and how to run
- 可通过 `npm install && npm run start`（或等效命令）在本地直接运行 / Must be runnable locally
- **注意：必须使用个人 GitHub 账号提交，不可使用公司账号** / Must use personal GitHub, NOT company account

### Demo 形式

- 本地运行录屏 **或** 在线演示链接，均可接受 / Screen recording or live demo link

## 📦 提交内容 / What to Submit

- ✅ Demo（录屏或在线链接）
- ✅ GitHub 仓库（代码可读，可直接运行）
- ✅ 填写提交表（队伍信息 + 说明）：提交表链接由组织方提供 / Submission form link provided by organizers

> **注意：GitHub 提交完还需扫描二维码填写提交表！** / After GitHub submission, you MUST also fill the form via QR code!

## 🚀 两种提交方式 / Two Submission Paths

### 方式 A — GitHub PR 提交到插件市场（推荐会用 GitHub 的同学）

使用本仓库的 `official-plugins` 插件一键完成：

```
/plugin marketplace add mastersamasama/master-plugin-repository
/plugin install official-plugins@master-plugin-repository
/reload-plugins
/official-plugins:package-plugin     ← 打包你的 Agent/插件
/official-plugins:submit-plugin      ← 自动开 PR 提交
```

详细步骤见 [CONTRIBUTING.md](./CONTRIBUTING.md) 和 [README.md](./README.md) 的快速提交指南。

### 方式 B — Zip 上传（不会用 GitHub 的同学）

**完全不需要 GitHub 账号！** 用 Claude Code 帮你打包：

1. 安装市场插件（同上）
2. 运行 `/official-plugins:package-plugin` —— 回答几个问题，它会帮你整理好插件目录
3. 打包完成后，让 Claude 帮你压缩：
   ```
   请帮我把插件目录压缩成 zip 文件
   ```
   Claude 会运行类似 `zip -r my-agent.zip my-agent/` 的命令
4. 把生成的 `.zip` 文件上传到提交表（链接由组织方提供）
5. **不要忘记也要上传 Demo（录屏或在线链接）！**

> **Zip 里必须包含的内容** / What must be in the zip:
> - `README.md` —— 说明你的 Agent 是什么、怎么跑、解决了什么问题
> - 完整可运行的代码 / Complete runnable code
> - `README.md` 中必须包含你的项目名称 / README must contain your project name

## ⚖️ 评审规则 / Judging Rules

全程匿名，去极值取平均 / Anonymous scoring, remove extremes, average remaining.

### 第一步 — AI 初评

OKX Agent 自动读取提交内容，生成评分卡与文字评价报告。

### 第二步 — 公平委员会终审

评委独立打分，去掉最高分与最低分，取剩余均值。

**评委 / Judges**: 匿名评审团 / Anonymous judging panel

### 评审维度 / Judging Criteria

| 维度 | 说明 |
|---|---|
| 🔗 **链上能力使用深度** | 真正调用了 Onchain OS 核心能力，不是套壳 / Actually uses Onchain OS deeply, not a wrapper |
| 🎯 **问题真实性** | 解决 Wallet 用户/团队真实痛点，不是演示题 / Solves real pain points, not toy problems |
| 🎮 **好玩！！** | 让人看了马上想使用 / Makes people want to use it immediately |
| 📢 **推特热度（加分项）** | Twitter/X 提及热度、参与度 / Twitter/X mentions and engagement (bonus) |

## 💡 项目灵感 / Inspiration

搭一个真正有用的 Agent，例如：

- 一键链上资产分析 / One-click on-chain asset analyzer
- 智能 swap 路由推荐 / Smart swap route recommender
- 链上活动监控 & 提醒 / On-chain activity monitor & alerts
- DeFi 策略助手 / DeFi strategy assistant
- NFT 估值 & 追踪 / NFT valuation & tracking
- 多链 gas 优化 / Multi-chain gas optimizer
- Web3 钱包安全检测 / Web3 wallet security scanner
- 自动化链上交易 workflow / Automated on-chain trading workflow

## ❓ 常见问题 / FAQ

### 关于参赛 / Participation

**Q：一个人可以提交多个 Agent 吗？**
A：可以，同一参赛者可提交多个不同的 Agent，最多为 3 个。

**Q：评委组成员可以参赛吗？**
A：评委可以参赛，到时候打分会匿名，并严格跳过自己的作品，其他评委全程监督。

**Q：参与范围？**
A：全体内部员工，不限部门。**非工程师也欢迎参加** —— 用 Claude Code 等 AI 工具辅助开发即可。

**Q：可以基于现有开源项目开发吗？**
A：可以，但需在提交时注明原始项目出处，且最终提交内容不能与原项目完全一致。

**Q：可以基于公司的内部项目来做吗？**
A：不可以。必须用原创新项目，已有的公司任何项目和基础都不能用来提交。

### 关于提交 / Submission

**Q：提交后可以修改吗？**
A：截止前可以重新提交，但每支队伍最多提交两次，以最后一次为准。

**Q：GitHub 仓库上传可以使用公司账号吗？**
A：不可以。路径是个人自己的 GitHub → 上传。必须用个人 GitHub 账号。

**Q：我不会用 GitHub 怎么办？**
A：完全没问题！使用 **方式 B — Zip 上传**：
1. 在 Claude Code 里安装 `official-plugins`
2. 运行 `/official-plugins:package-plugin` 让 AI 帮你整理代码
3. 让 Claude 帮你压缩成 zip
4. 到提交表（链接由组织方提供）上传 zip + Demo
不需要任何 GitHub 操作！

**Q：提交需要包含什么？**
A：三样东西缺一不可：
1. **Demo** —— 录屏或在线演示链接
2. **代码** —— GitHub 仓库（方式 A）或 zip 文件（方式 B）
3. **提交表** —— 扫描组织方提供的二维码填写

**Q：Zip 里面需要包含什么？**
A：
- `README.md` —— 说明项目名称、功能、运行方式
- 完整代码 —— 可以通过 `npm install && npm run start`（或等效命令）直接运行
- （可选）Demo 录屏文件

**Q：怎么用 `/official-plugins:package-plugin` 打包？**
A：在 Claude Code 里运行这几步：
```
/plugin marketplace add mastersamasama/master-plugin-repository
/plugin install official-plugins@master-plugin-repository
/reload-plugins
/official-plugins:package-plugin
```
它会问你几个问题（项目名、描述、你有什么文件），然后自动帮你整理成标准插件目录结构，包括生成 `plugin.json` 和 `README.md`。最后它会跑校验器确认格式正确。

**Q：打包完之后怎么提交？**
A：两种方式任选：
- **会 GitHub**：运行 `/official-plugins:submit-plugin`，它会帮你自动 fork、建分支、开 PR
- **不会 GitHub**：告诉 Claude "帮我把这个目录压缩成 zip"，然后把 zip 上传到提交表

### 关于技术 / Technical

**Q：Onchain OS 是什么？在哪里看文档？**
A：[Onchain OS 文档](https://www.okx.com/web3/build/docs/waas/about-onchain-os) —— OKX 的链上基础设施，提供钱包、交易、DeFi 等能力。技术问题请联系评委组。

**Q：开发框架有限制吗？**
A：没有。任何语言、任何框架都可以，只要调用了 Onchain OS。

**Q：一定要做 Claude Code 插件吗？**
A：不一定。本仓库提供了一个便捷的插件市场和提交工具，但你也可以做任何形式的 Agent（Web 应用、CLI 工具、Bot 等），只要集成了 Onchain OS 并通过 GitHub 或 Zip 提交。

## 链接 / Links

- **Onchain OS 文档**: https://www.okx.com/web3/build/docs/waas/about-onchain-os
- **Plugin Store (本仓库)**: https://github.com/mastersamasama/master-plugin-repository
- **提交表 / Submission Form**: 由组织方提供 / provided by organizers
- **提交方式详情**: [CONTRIBUTING.md](./CONTRIBUTING.md)
- **插件快速上手**: [plugins/official-plugins/QUICKSTART.md](./plugins/official-plugins/QUICKSTART.md)

---

> 非工程师也能参加！用 Claude Code 帮你写代码、打包、提交 —— 你只需要有一个好的 Agent 创意。
>
> Non-engineers welcome! Use Claude Code to help you write code, package, and submit — all you need is a good Agent idea.
