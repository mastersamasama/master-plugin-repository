# OKX Onchain OS Agent 黑客松

> 内部使用，请参阅 [LICENSE](./LICENSE)。
>
> English version: [HACKATHON.md](./HACKATHON.md)

## 🎯 挑战任务

搭一个真正好用、好玩的 Agent。不是演示项目，不是套壳包装。我们要找的是真正跑得起来、能接任务、持续提供服务的 Agent —— 它们将成为 Onchain OS 生态里正式入驻的 Agent，未来将进入 OKX.AI / Plugin Store 生态中面向真实用户场景。

## 📅 时间线

| 时间 | 节点 |
|---|---|
| **即刻开始** | 报名 & 开发 |
| **2026-04-22** | 🔒 提交截止（Demo + GitHub / Zip） |
| **2026-04-27** | 🏆 结果公布 |

## 💰 奖金池 — 8,000 USDT

| 名次 | 奖金 | 彩蛋 |
|---|---|---|
| 🥇 第 1 名 | 2,000 USDT | 和超哥吃饭 🍽️ |
| 🥈 第 2 名 | 1,500 USDT | 和超哥吃饭 🍽️ |
| 🥉 第 3 名 | 1,000 USDT | 和超哥吃饭 🍽️ |
| 其余入围奖 × 7 | 500 USDT | — |

## 👥 参赛资格

- **全体内部员工**，不限部门，非工程师也欢迎参加
- 个人或组队均可，每队最多 **3 人**
- 同一参赛者最多可提交 **3 个**不同的 Agent
- 评委可以参赛，打分时匿名并严格跳过自己的作品
- **必须用原创新项目**，已有的公司任何项目和基础都不能用来提交

## 🛠️ 技术要求

### 集成要求

- **必须调用 [Onchain OS](https://www.okx.com/web3/build/docs/waas/about-onchain-os)**，开发框架与语言不限
- Onchain OS 相关技术问题，请联系评委组

### 代码规范

- 提交 GitHub 仓库（public 或 private 均可）**或** zip 压缩包
- 包含完整 **README.md**，说明项目名称、功能与运行方式
- 可通过 `npm install && npm run start`（或等效命令）在本地直接运行
- **注意：使用 GitHub 提交时，必须使用个人账号，不可使用公司账号**

### Demo 形式

- 本地运行录屏 **或** 在线演示链接，均可接受

## 📦 提交内容（三样缺一不可）

1. ✅ **Demo** —— 录屏或在线链接
2. ✅ **代码** —— GitHub 仓库（方式 A）或 zip 文件（方式 B）
3. ✅ **提交表** —— 扫描组织方提供的二维码填写

> **注意：GitHub 提交完还需扫描二维码填写提交表！**

## 🚀 两种提交方式

### 方式 A — GitHub PR 提交到插件市场（推荐会用 GitHub 的同学）

使用本仓库的 `official-plugins` 插件一键完成：

```
/plugin marketplace add mastersamasama/master-plugin-repository
/plugin install official-plugins@master-plugin-repository
/reload-plugins
/official-plugins:package-plugin     ← 打包你的 Agent/插件
/official-plugins:submit-plugin      ← 自动开 PR 提交
```

详细步骤见 [CONTRIBUTING.md](./CONTRIBUTING.md) 和 [README.zh-Hans.md](./README.zh-Hans.md) 的快速提交指南。

### 方式 B — Zip 上传（不会用 GitHub 也能参加！）

**完全不需要 GitHub 账号！** 用 Claude Code 帮你打包和提交：

**第 1 步** —— 安装插件市场工具：
```
/plugin marketplace add mastersamasama/master-plugin-repository
/plugin install official-plugins@master-plugin-repository
/reload-plugins
```

**第 2 步** —— 打包你的项目：
```
/official-plugins:package-plugin
```
它会问你几个问题（项目名、描述、你有什么文件），然后自动帮你整理成标准目录结构，生成 `plugin.json` 和 `README.md`，跑校验器确认格式正确。

**第 3 步** —— 压缩成 zip：

直接告诉 Claude：
```
请帮我把插件目录压缩成 zip 文件
```
Claude 会自动运行压缩命令，生成一个 `.zip` 文件。

**第 4 步** —— 上传：

把 zip 文件 + Demo（录屏或在线链接）上传到提交表（链接由组织方提供）。

> **Zip 里面需要包含：**
> - `README.md` —— 必须包含项目名称，说明功能和运行方式
> - 完整可运行的代码
> - （可选）Demo 录屏文件

## ⚖️ 评审规则

全程匿名，去极值取平均。

### 第一步 — AI 初评

OKX Agent 自动读取提交内容，生成评分卡与文字评价报告。

### 第二步 — 公平委员会终审

评委独立打分，去掉最高分与最低分，取剩余均值，确保公正。

**评委**: 匿名评审团

### 评审维度

| 维度 | 说明 |
|---|---|
| 🔗 **链上能力使用深度** | 真正调用了 Onchain OS 核心能力，不是套壳 |
| 🎯 **问题真实性** | 解决 Wallet 用户/团队真实痛点，不是演示题 |
| 🎮 **好玩！！** | 让人看了马上想使用 |
| 📢 **推特热度（加分项）** | Twitter/X 提及热度、参与度 |

## 💡 项目灵感

搭一个真正有用的 Agent，例如：

- 🔍 一键链上资产分析
- 💱 智能 swap 路由推荐
- 🔔 链上活动监控 & 提醒
- 📊 DeFi 策略助手
- 🖼️ NFT 估值 & 追踪
- ⛽ 多链 gas 优化
- 🛡️ Web3 钱包安全检测
- 🤖 自动化链上交易 workflow

## ❓ 常见问题 FAQ

### 关于参赛

**Q：一个人可以提交多个 Agent 吗？**
A：可以，同一参赛者可提交多个不同的 Agent，最多为 3 个。

**Q：评委组成员可以参赛吗？**
A：评委可以参赛，到时候打分会匿名，并严格跳过自己的作品，其他评委全程监督。

**Q：参与范围？**
A：全体内部员工，不限部门。**非工程师也欢迎参加** —— 用 Claude Code 等 AI 工具辅助开发即可，你只需要有一个好创意。

**Q：可以基于现有开源项目开发吗？**
A：可以，但需在提交时注明原始项目出处，且最终提交内容不能与原项目完全一致。

**Q：可以基于公司的内部项目来做吗？**
A：不可以。必须用原创新项目，已有的公司任何项目和基础都不能用来提交。

### 关于提交

**Q：提交后可以修改吗？**
A：截止前可以重新提交，但每支队伍最多提交两次，以最后一次为准。

**Q：GitHub 仓库上传可以使用公司账号吗？**
A：不可以。必须用个人 GitHub 账号。

**Q：我不会用 GitHub 怎么办？**
A：完全没问题！使用 **方式 B — Zip 上传**：
1. 在 Claude Code 里运行 `/official-plugins:package-plugin` 让 AI 帮你整理代码
2. 让 Claude 帮你压缩成 zip（直接说"帮我压缩成 zip"）
3. 到提交表（链接由组织方提供）上传 zip + Demo

不需要任何 GitHub 操作！

**Q：提交需要包含什么？**
A：三样东西缺一不可：
1. **Demo** —— 录屏或在线演示链接
2. **代码** —— GitHub 仓库 或 zip 文件
3. **提交表** —— 扫描组织方提供的二维码填写

**Q：Zip 里面需要包含什么？**
A：
- `README.md` —— 说明项目名称、功能、运行方式（**README 中必须包含项目名称**）
- 完整代码 —— 可以通过 `npm install && npm run start`（或等效命令）直接运行
- （可选）Demo 录屏文件

**Q：怎么用 `/official-plugins:package-plugin` 打包？**
A：在 Claude Code 里运行以下命令：
```
/plugin marketplace add mastersamasama/master-plugin-repository
/plugin install official-plugins@master-plugin-repository
/reload-plugins
/official-plugins:package-plugin
```
它会问你几个问题（项目名、描述、你有什么文件），然后自动帮你：
- 整理成标准目录结构
- 生成 `plugin.json` 和 `README.md`
- 跑校验器确认格式正确
- 告诉你下一步怎么提交

**Q：打包完之后怎么提交？**
A：两种方式任选：
- **会 GitHub**：运行 `/official-plugins:submit-plugin`，它会帮你自动 fork、建分支、开 PR
- **不会 GitHub**：告诉 Claude "帮我把这个目录压缩成 zip"，然后把 zip 上传到提交表

### 关于技术

**Q：Onchain OS 是什么？在哪里看文档？**
A：[Onchain OS 文档](https://www.okx.com/web3/build/docs/waas/about-onchain-os) —— OKX 的链上基础设施，提供钱包、交易、DeFi 等能力。技术问题请联系评委组。

**Q：开发框架有限制吗？**
A：没有。任何语言、任何框架都可以，只要调用了 Onchain OS。

**Q：一定要做 Claude Code 插件吗？**
A：不一定。本仓库提供了一个便捷的插件市场和提交工具，但你也可以做任何形式的 Agent（Web 应用、CLI 工具、Bot 等），只要集成了 Onchain OS 并通过 GitHub 或 Zip 提交即可。

## 🔗 链接

- **Onchain OS 文档**: https://www.okx.com/web3/build/docs/waas/about-onchain-os
- **Plugin Store（本仓库）**: https://github.com/mastersamasama/master-plugin-repository
- **提交表**: 由组织方提供
- **提交方式详情**: [CONTRIBUTING.md](./CONTRIBUTING.md)
- **插件快速上手**: [plugins/official-plugins/QUICKSTART.md](./plugins/official-plugins/QUICKSTART.md)

---

> 🎉 非工程师也能参加！用 Claude Code 帮你写代码、打包、提交 —— 你只需要有一个好的 Agent 创意。
