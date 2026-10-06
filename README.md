# MathPaws

面向儿童的口算练习游戏：**手写数字识别答题** + **抽卡换装 / 宠物养成 / 农场经营** 奖励循环。全离线 PWA，AI 生成美术 + 高保真拆层还原。

![首页](design/high-fi/home.png)

## 特性

- **手写答题**：自训 MNIST 模型在浏览器内离线推理（TensorFlow.js WASM 后端），抬笔自动识别，支持多位数分区书写
- **知识路径出题**：按知识点掌握度有序解锁，不设超时，答错保留可重写
- **奖励闭环**：答题得贝壳 → 学盒抽卡（保底持久化）→ 背包 2D 纸娃娃换装；答题得食物 → 宠物喂食进化
- **农场经营**：真实时间生长，收获 → 售卖 → 买种自循环
- **全离线**：IndexedDB 持久化 10 表 + schema 版本迁移，PWA 可安装
- **工程方法论**：手写识别与"AI 生图 → 拆层 → 运行时重组"高保真还原工作流均可复用，见[深度文章](#文档)

![答题](design/high-fi/quiz-page.png)
![广场](design/high-fi/plaza-v2.jpg)
![农场](design/high-fi/farm-v2.png)

## 快速开始

```bash
corepack enable     # 启用 pnpm（仓库已锁定 pnpm 10）
pnpm install
pnpm dev            # 启动 Web 客户端
```

常用命令：`pnpm build` / `pnpm typecheck` / `pnpm lint` / `pnpm test`，详见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 技术栈

Vite + React 18 + TypeScript（strict）· Zustand · TensorFlow.js（WASM）· IndexedDB（idb）· vite-plugin-pwa · pnpm monorepo

## 仓库结构

| 目录 | 说明 |
|---|---|
| `apps/web` | Web 客户端（一期为 2D；二期 3D 广场代码预留于 `src/three/`，未接入） |
| `packages/ui` | 设计系统（tokens、通用组件） |
| `packages/paperdoll` | 2D 纸娃娃换装引擎（独立无业务依赖，二期将拆分为独立项目） |
| `ml/mnist` | 手写数字识别训练管线（Python） |
| `design/` | 设计工作区：生图 prompt 台账、拆层流水线、高保真原稿 |
| `docs/` | PRD、设计规格；`docs/topics/` 技术深度文章 |

## 文档

- [产品需求文档（PRD）](docs/PRD.md)
- [手写数字识别方案](docs/topics/handwriting-recognition.md)
- [高保真 UI 还原工作流](docs/topics/hifi-restoration.md)
- [设计文档索引](docs/design/)

## 路线图

- **一期（当前）**：2D 主流程——口算练习、抽卡换装、宠物、农场、全离线 PWA
- **二期**：3D 广场（three.js 已预留）、错题本页面、手写样本回流迭代模型、换装引擎拆分为独立开源项目

## License

- **代码**：[MIT](LICENSE)
- **美术 / 音频等素材**：[CC BY-NC 4.0](LICENSE-ASSETS)（大部分由 AI 生成，详见 [NOTICE](NOTICE)）
