# master-plugin-repository

**OKX 内部 Claude Code 插件市场** —— OKX 内部黑客松的官方插件提交入口。

> English version: [README.md](./README.md)

## 这是什么

一个 Claude Code 插件市场（marketplace）。添加该市场后，黑客松提交的每一个插件都会出现在 Claude Code 的 `/plugin` 界面中，参与者和评审可以一键安装。所有 PR 在合入前都会经过 GitHub Actions 自动校验。

## 面向谁

仅限获得授权的 OKX 员工和黑客松参赛者。使用受 [LICENSE](./LICENSE) 约束 —— 保密、仅限内部使用，未经 OKX 法务书面同意不得外传。比赛规则、参赛资格与评审标准详见 [HACKATHON.md](./HACKATHON.md)，完整提交流程详见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 将该市场添加到 Claude Code

在任意 Claude Code 会话中执行：

```
/plugin marketplace add mastersamasama/master-plugin-repository
```

然后打开市场面板：

```
/plugin
```

在 **Discover（发现）** 标签页中可以看到已提交的插件。

## 安装插件

从列表中挑选一个插件并执行：

```
/plugin install <plugin-name>@master-plugin-repository
/reload-plugins
```

安装后，该插件附带的 skills / commands 即可在当前会话中使用。

## 快速提交指南

完整流程通常 5–10 分钟即可走完。所有步骤都在 Claude Code 会话中通过 `official-plugins` 插件完成。

### 第 1 步 —— 一次性安装

```
/plugin marketplace add mastersamasama/master-plugin-repository
/plugin install official-plugins@master-plugin-repository
/reload-plugins
```

每台机器只需要做一次。后续提交直接从第 2 步开始。

### 第 2 步 —— 打包你的插件

```
/official-plugins:package-plugin
```

这个 skill 会引导你完成：

- **"What do you already have?（你已经有什么？）"**（多选）—— 任意组合：已有的 skill 目录、零散的 `SKILL.md` 文件、slash command `.md` 文件、agent 定义、hooks（`hooks.json` 或脚本）、MCP server 配置、相关脚本，或者 **"Nothing — start from a template（什么都没有，从模板开始）"**（这会直接复制内置的 `examples/minimal-plugin/` 或 `examples/multi-component-plugin/` 作为起点）。
- **插件元数据** —— `name`（kebab-case）、`description`、`author`（默认从 `git config user.name` / `user.email` 取）、`version`、`keywords`、`category`，以及新插件的目标目录（默认 `<当前目录>/<plugin-name>`）。
- **组件吸收** —— 对于你选中的每种组件类型，skill 会询问源路径，把文件复制到正确的子目录（`skills/`、`commands/`、`agents/`、`hooks/`、`scripts/`），并把内部引用重写为 `${CLAUDE_PLUGIN_ROOT}` 形式。

skill 会基于模板生成 `plugin.json` 和 `README.md`，跑一次校验器（非严格模式 —— 警告允许迭代），并把恢复状态写到 `<target>/.package-plugin.state.json`，以便中断后能继续。

### 第 3 步 —— 提交

```
/official-plugins:submit-plugin
```

这个 skill 在做任何对外可见的操作之前会先执行严格门禁：

1. **定位插件** —— 询问插件目录路径（默认是 `package-plugin` 刚生成的目录；如果存在 `<plugin>/.package-plugin.state.json` 则自动预填元数据）。
2. **执行严格质量门禁** —— 对你的插件运行 `validate.mjs --strict`。任何格式或质量问题都会**阻断**提交（具体拦截规则见下一节）。被拦截时，会让你回去跑 `package-plugin` 修复，再重新调用本 skill。
3. **询问 "要先做一次 dry run 吗？"** —— **强烈建议第一次提交时使用。** Dry-run 会拉取线上的 `marketplace.json`，构造合并后的版本并校验（捕获重名等冲突），展示即将生成的 commit message 和 PR 标题/正文，然后**不 fork、不 push 直接停止**。Dry-run 不需要 `gh` CLI。
4. **询问提交模式**（仅真实提交）：
   - **monorepo** —— 你的插件被复制到本市场的 `plugins/<plugin-name>/` 下。PR 体积更小，推荐默认。
   - **external whole-repo** —— 你的插件本身就是一个 GitHub 仓库（`.claude-plugin/plugin.json` 在仓库根目录）。PR 只往 `marketplace.json` 里加一条指向你仓库的条目。
   - **external subdir** —— 你的插件位于一个更大仓库的子目录里。PR 只加一条指向那个子目录的条目。
5. **检查 `gh` CLI** —— 跑 `gh --version` 和 `gh auth status`。如果未安装/未登录，会打印对应的安装/登录命令并停止。
6. **fork → 建分支 → 应用变更 → fork 内再校验 → commit → push → 开 PR** —— skill 会 fork `master-plugin-repository`，新建分支 `submit/<plugin-name>`，应用变更（monorepo 模式下复制插件目录；external 模式下只编辑 `marketplace.json`），在 fork 内再跑一次校验，commit，push，最后通过 `gh pr create` 用 PR 模板填好正文开 PR。
7. **打印 PR URL**，并告诉你 CI 接下来会做什么。

### 第 4 步 —— CI 自动校验你的 PR

GitHub Actions 会在几十秒内对你的 PR 跑 `validate.mjs --all`。如果检查失败，本地修复后 push 到你的 `submit/<plugin-name>` 分支即可 —— PR 会自动更新。**修订时不要新开 PR。**

### 第 5 步 —— 评审合入

评审会逐项核对 PR 模板的勾选框（无密钥、合规、元数据齐全），然后合入。合入后你的插件就在市场里了，其他参赛者就可以安装：

```
/plugin marketplace update master-plugin-repository
/plugin install <你的插件名>@master-plugin-repository
```

### 替代方式：Zip 上传（不需要 GitHub）

**不会用 GitHub？完全没问题！** 完成第 2 步（package-plugin）后，跳过 submit-plugin，直接让 Claude 帮你压缩：

```
请帮我把插件目录压缩成 zip 文件
```

Claude 会自动生成 `.zip` 文件。然后把 zip 文件和你的 Demo（录屏或在线链接）上传到提交表（链接由组织方提供）就行了。不需要 GitHub 账号，不需要 PR，不需要 `gh` CLI。

**Zip 里面必须包含：**
- `README.md` —— 必须包含项目名称，说明功能和运行方式
- 完整可运行的代码（`npm install && npm run start` 或等效命令）

> **详细黑客松信息**：奖金、时间线、评审规则和完整 FAQ 请看 [HACKATHON.zh-Hans.md](./HACKATHON.zh-Hans.md)（[English](./HACKATHON.md)）。
>
> **更短的版本**：60 秒压缩版请看 [`plugins/official-plugins/QUICKSTART.md`](./plugins/official-plugins/QUICKSTART.md)。

## `submit-plugin` 会拦截哪些问题

`submit-plugin` 在做任何对外可见的操作之前，会先以 `--strict` 模式调用 `validate.mjs`。下列任意一项触发都会**阻断**提交：

**格式门禁**（始终为错误）：
- `plugin.json` 缺失或格式错误
- `name` 不是 kebab-case，或与目录名不一致
- `SKILL.md` 缺失或 YAML frontmatter 不合法
- 任意字符串字段中出现路径穿越（`..`）

**质量门禁**（在 `--strict` 模式下为错误，`submit-plugin` 始终启用此模式）：
- skill description 缺失，或没有遵循第三人称 `"This skill should be used when the user asks to ..."` 的触发短语规范
- plugin description 缺失、长度不足 20 字符，或仍包含未填充的 `{{...}}` 模板占位符
- 插件没有任何组件（没有 skills / commands / agents / hooks / MCP server）
- **缺少根目录的 `README.md`**，**或** README 中没有出现插件的 kebab-case 名称
- 文件中含有已知格式的密钥（OpenAI / Anthropic API key、GitHub PAT、AWS key、Google key、Slack token、JWT 等）

完整的错误码、原因与修复方法见 [`plugins/official-plugins/skills/submit-plugin/references/quality-gates.md`](./plugins/official-plugins/skills/submit-plugin/references/quality-gates.md)。

你可以在提交之前自己跑一遍校验器：

```
node plugins/official-plugins/scripts/validate.mjs --plugin <你的插件目录> --strict
```

这是一个零依赖的 Node.js 单文件脚本，不需要 `npm install`。

## 持续集成

每个 PR 都会触发 `.github/workflows/validate-submissions.yml`，使用 Node 20 对整个市场跑一次校验器。CI 会在人工评审之前先拦截掉任何格式错误的插件或市场条目。

## 仓库结构

```
.claude-plugin/
└── marketplace.json                # 市场目录文件
.github/
├── workflows/validate-submissions.yml  # 每个 PR 自动跑校验
├── PULL_REQUEST_TEMPLATE.md
└── ISSUE_TEMPLATE/plugin-submission.md
plugins/
├── official-plugins/               # 黑客松官方工具（package + submit）
│   ├── scripts/validate.mjs        # 零依赖校验器（CI 共用）
│   ├── schemas/                    # JSON Schema 文档
│   ├── templates/                  # 新插件占位模板
│   ├── examples/                   # minimal-plugin + multi-component-plugin
│   └── skills/
│       ├── package-plugin/
│       └── submit-plugin/
└── test-plugin/                    # 引导用插件（保留作参考）
CONTRIBUTING.md                     # 完整提交流程
HACKATHON.md                        # 规则、时间表、评审标准
CODE_OF_CONDUCT.md                  # 引用 OKX 内部行为准则
LICENSE                             # OKX 专有授权声明
README.md                           # English
README.zh-Hans.md                   # 你正在阅读
```

## 关于 `test-plugin`

`test-plugin` 是 `official-plugins` 出现之前的**引导用产物**。它内置一个更简单的 `submit-plugin` skill，使用内联检查。我们把它保留在市场中，作为参赛者可以参考的"最小合法插件"样例。**真实提交请使用 `official-plugins` —— 它的 `submit-plugin` 会通过共享校验器运行严格的质量门禁。**

## 合规声明

本仓库及其中所有插件均为 OKX 机密资产。禁止对外发布、对外 fork 或在 OKX 授权渠道之外分享。提交的插件中不得包含任何密钥、机密 OKX 数据或你不拥有合法使用权的第三方知识产权。完整条款详见 [LICENSE](./LICENSE)，行为准则详见 [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)。

## 问题反馈

使用 **Plugin submission help** issue 模板提交问题，或通过 OKX 内部渠道联系黑客松组织者。
