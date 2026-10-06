# 贡献指南

感谢你对 MathPaws 的关注！

## 环境准备

- Node.js ≥ 20
- pnpm 10（推荐通过 corepack：`corepack enable`，仓库已用 `packageManager` 字段锁定版本）

```bash
corepack enable
pnpm install
pnpm dev        # 启动 Web 客户端（apps/web）
```

## 常用命令

| 命令 | 说明 |
|---|---|
| `pnpm dev` | 开发模式启动 |
| `pnpm build` | 类型检查 + 生产构建 |
| `pnpm typecheck` | 全部包 TypeScript 检查 |
| `pnpm lint` | ESLint 检查 |
| `pnpm format` | Prettier 格式化 |
| `pnpm test` | 全部包的测试（含 IndexedDB 迁移回归） |

## 仓库结构

- `apps/web` — Web 客户端（Vite + React + TypeScript，PWA）
- `packages/ui` — 设计系统（tokens、通用组件）
- `packages/paperdoll` — 2D 纸娃娃换装引擎（独立于业务，二期将拆分为独立项目）
- `ml/mnist` — 手写数字识别训练管线（Python）
- `design/` — 设计工作区（生图 prompt、拆层流水线、高保真原稿）
- `docs/` — PRD 与设计文档；`docs/topics/` 为技术深度文章

## 提交代码

1. 改动前先在 Issue 中讨论较大变更。
2. 代码需通过 `pnpm lint && pnpm typecheck && pnpm test && pnpm build`。
3. 遵循现有代码风格（Prettier 配置为准：单引号、无分号）。
4. **依赖方向约束**：`packages/*` 不得 import `apps/*`（ESLint 强制）。
5. 不要提交任何密钥、个人路径、云实例信息；`.env` 已被 gitignore。
6. 美术/音频素材的贡献默认按 CC BY-NC 4.0 授权（见 LICENSE-ASSETS）。

## 报告问题

请用 GitHub Issues，尽量附带：复现步骤、期望/实际行为、浏览器与设备信息。

## 发布（维护者）

- 每次 push / PR 触发 CI：lint → typecheck → test → build。
- **版本发布全自动（release-please）**：向 main 合并后，release-please
  依据 Conventional Commits 自动生成"发布 PR"（升版本号 + 更新 CHANGELOG）；
  **合并发布 PR** 即自动打 tag、建 GitHub Release、部署 demo 站
  `https://<owner>.github.io/mathpaws/`。忘了发布也没关系——发布 PR 会
  一直挂着等你合并。
- 因此 commit 消息请遵守 Conventional Commits：`feat: ...`（新功能）、
  `fix: ...`（修复）、`docs:` / `chore:` / `refactor:` 等。
- 手动兜底：Actions 页面运行 "Deploy Demo (manual fallback)"。
- 注意：免费版 GitHub Pages 要求仓库公开；demo 站仅面向开源社区，
  正式分发不走 Pages（见 PRD §14）。
