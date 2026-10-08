# mathpaws 技术方案文档（Architecture）

> 版本：一期　|　最后更新：2026-10-07（刷新为 CR 修复 + vanilla-extract 迁移后的实现口径）
> 产品范围 / 数值见 [./PRD.md](./PRD.md)，视觉规范见 [./design-system.md](./design-system.md)，广场 3D（二期）细节见 [plaza-3d.md](./design/phase2/plaza-3d.md)。
> 本文档描述**一期当前架构**；未完成事项显式标注【待办】，不虚构已完成能力。

---

## 1. 系统总览

一期是**纯前端、无后端、无注册**的可安装 PWA：所有逻辑在浏览器 / WebView 内完成，进度持久化在本机 IndexedDB，游客身份按设备分配 UUID。二期才引入账号 / 云存档 / 后端。

```
┌──────────────────────────────────────────────────────┐
│                PWA 前端（React 18 + Vite + TS）        │
│  ┌────────────────────────────────────────────────┐  │
│  │ 视图层  2D 页面（P0–P16 全部，含 2D 静态广场）   │  │
│  │        @mathpaws/ui 通用件 + apps/web 业务件     │  │
│  │        样式 = vanilla-extract（零运行时）        │  │
│  ├────────────────────────────────────────────────┤  │
│  │ 能力层  题库生成器 / 掌握度引擎 / 手写识别(MNIST) │  │
│  │        经济结算 / 农场时钟 / 抽卡保底 / 连学      │  │
│  ├────────────────────────────────────────────────┤  │
│  │ 状态层  zustand 分域 stores（内存）              │  │
│  ├────────────────────────────────────────────────┤  │
│  │ 数据层  IndexedDB(idb) 分表存档 + localStorage   │  │
│  └────────────────────────────────────────────────┘  │
│  （二期预留：广场实时 3D 层 three + R3F，见 §7）      │
└──────────────────────────────────────────────────────┘
        一期离线自洽；二期再接 Fastify + DB / 账号 / 云存档
```

- **交付形态**：PWA（vite-plugin-pwa），开发走局域网 HTTP 调试，正式走免费 HTTPS 静态托管（见 §12）。
- **目标真机**：华为 MatePad 11.5" TGR-W10 / HarmonyOS 4.2 / 8GB / 2800×1840 横屏（见 §12）。

## 2. 技术栈

| 依赖 | 版本 | 用途 |
|---|---|---|
| react / react-dom | ^18.3.1 | 视图框架 |
| vite / typescript | ^5.4.10 / ^5.6.3 | 构建 / 类型 |
| zustand | ^5.0.15 | 状态管理 |
| idb | ^8.0.3 | IndexedDB 封装 |
| **@vanilla-extract/css** | ^1.21.2 | 样式（零运行时 CSS-in-TS，见 §5） |
| **@vanilla-extract/vite-plugin** | 配套版本 | 构建期抽取 .css.ts 为静态 CSS |
| @tensorflow/tfjs(+backend-wasm) | ^4.22.0 | 手写数字推理（WASM 后端，不抢 WebGL） |
| @mathpaws/ui / @mathpaws/paperdoll | workspace 链接 | 共享组件库 / 纸娃娃运行时合成 |
| vite-plugin-pwa | ^1.3.0 | PWA manifest / Service Worker / 离线 |
| three + R3F + drei / postprocessing | ^0.169 / ^8.17.10 / ^9.114 / **^2.19.1** | 二期广场 3D（postprocessing v3 不兼容 fiber 8，勿升） |

- **包管理：pnpm 10.14（corepack）**，monorepo = pnpm workspaces；统一 `corepack pnpm` 调用。
- 训练侧（不在前端运行）：Python 3.12 venv、tensorflow 2.18.1 / tfjs 4.22，见 [`../ml/mnist/README.md`](../ml/mnist/README.md)。

## 3. monorepo 目录

```
mathpaws/
├── package.json                 # pnpm workspaces + dev/build/typecheck（--filter mathpaws-client）
├── apps/
│   └── web/                     # 包名 mathpaws-client，当前唯一应用
│       ├── src/
│       │   ├── main.tsx         # 入口：ErrorBoundary + CompatGate 单层门禁 + global.css
│       │   ├── App.tsx          # BootGate 启动编排 + OrientationGate + RouteView
│       │   ├── app/             # router / RouteView / BootGate / CompatGate / ErrorBoundary
│       │   │                    #   / viewport（LogicalStage）/ scaffold.css（启动遮罩样式）
│       │   ├── scenes/          # 一场景一目录（Home/ Plaza/ Farm/ Gacha/ PetPanel/ Quiz/
│       │   │                    #   Result/ Settings/ Backpack + onboarding/ + dev/），
│       │   │                    #   tsx 与 X.css.ts 同目录
│       │   ├── components/      # 一组件一目录：ChestPanel / WritingBoard / GuideTip /
│       │   │                    #   ComingSoonToast
│       │   ├── stores/          # 分域 zustand stores（10 域 + persist + bootstrap）
│       │   ├── db/              # index.ts（10 表 + DB v3）/ migration.ts（新装初始化）/ types.ts
│       │   ├── content/         # 题库与掌握度：oral / mastery / knowledgePath / types
│       │   ├── config/          # 数值集中地：economy / farm / gachaPool / quiz / pets /
│       │   │                    #   cosmetics / petArt / streak / player
│       │   ├── paperdoll/       # catalog.ts（纸娃娃选项 ↔ 资产映射）
│       │   ├── styles/          # global.css（仅 reset）+ motion.css.ts（共享 keyframes）
│       │   ├── three/           # 二期广场预留材质件（ClayMaterial 等，一期未接线）
│       │   ├── utils/           # mnist / audio / preload / id
│       │   └── assets/          # hifi/<page>/ 拆层资产、paperdoll/、img/、gacha/、models/
│       ├── public/models/mnist/ # model.json + 权重 bin + wasm 后端文件
│       └── vite.config.ts       # PWA + vanillaExtractPlugin + optimizeDeps（口径见 §14）
├── packages/
│   ├── ui/                      # @mathpaws/ui：tokens + 通用组件（一组件一 css.ts）
│   └── paperdoll/               # @mathpaws/paperdoll：compose.ts + react.tsx
├── ml/mnist/                    # 训练脚本 + README + requirements
├── design/                      # 美术资产工作区（门户与路由表见 docs/design/README.md）
└── docs/                        # PRD、design-system、architecture、design/*
```

### 3.1 共享包（workspace 链接、发布 TS 源码）

- **`@mathpaws/ui`**：`main`/`types`/`exports` 仅指向 `src/index.ts`；`tokens.ts` 是 token 代码权威（`C` / `FONT` / `R` / `SPACE` / `SHADOW` 等）；组件样式为 vanilla-extract（每组件一个 `X.css.ts`，tokens 构建期直连），共享交互态（按钮 `:active` 下沉）收敛在 `styles.css.ts` 的 `btn` 导出；动态值（size / tone / 进度）保留 props 内联合并 + `style` prop 逃生舱；React 为 peerDependencies 避免多实例；组件不依赖业务 store / 路由。
- **`@mathpaws/paperdoll`**：纸娃娃运行时合成（`compose.ts` 算法 + `react.tsx` 组件），资产吃 `assets/paperdoll/manifest.json`。
- **Vite `optimizeDeps.exclude` 排除这两个 workspace 包**（include 会被预构建缓存、源码改动不触发失效，见 §14）；tfjs 两件仍走 include。

## 4. 路由、启动编排与门禁

- **路由**：`app/router.ts` 自研轻量路由（不引第三方库），`RouteId` 覆盖一期页面；`back()` 为 history 栈逐级回退（"从哪来回哪去"）；dev hash 契约保留（`#quiz` / `#gacha` / `#paperdoll` 等直达，**深链 hash 在 init 消费后立即 clearHash**，避免刷新又跳回；dev 场景仅开发构建注册、生产裁剪）。
- **启动编排（单层门禁）**：`main.tsx` = `ErrorBoundary` + `CompatGate`（WASM / IndexedDB 硬性阻断；**WebGL2 一期降级为警告**——一期全 2D 无 WebGL 需求，检测 context 显式释放）→ `App.tsx` = `BootGate`（`bootstrapStores()`：迁移 → 装载 → 跨日重置 → 绑定持久化）→ `OrientationGate`（竖屏轻提示，不阻断）→ `RouteView`。旧 `SceneTransition` 组件已删除（场景过渡由各场景自行处理）。
- **ErrorBoundary**：局部崩溃可重试；"重置"口径 = 清 hash + reload → 回 Splash 按 onboarding 分流（`resetToEntry`）。
- **动线**：设备无档案 → Splash → 主角亮相起名（可跳过）→ 领养雪球兔 → 首次直接进广场；已有档案 → Splash → 首页。答题中返回需 ConfirmDialog 二次确认。

## 5. 样式体系（vanilla-extract）

> 2026-10-07 起全仓样式统一为 **vanilla-extract（ve）**：样式写在 `.css.ts`（真 TypeScript），构建期求值并抽取为静态 CSS，运行时零样式 JS。此前历经"内联样式 → CSS Modules"两轮，均已下线（`.module.css`、ui 的 StyleSheet 对象、全局 `mp-*` keyframes 全部移除）。

**分层约定**：

| 层 | 位置 | 内容 |
|---|---|---|
| 全局 reset | `apps/web/src/styles/global.css` | 仅盒模型 / 字体 / user-select 等，**不含任何组件样式与 keyframes** |
| 启动遮罩 | `apps/web/src/app/scaffold.css` | Boot / 兼容 / 错误遮罩的 `mp-*` 普通 CSS（不进 ve，随入口常驻） |
| 共享动画 | `apps/web/src/styles/motion.css.ts` | 10 个全局 keyframes（mpFloat / mpPopIn 等）单点定义，各 `.css.ts` 按需 import（hash 一致、可 tree-shake） |
| 场景 / 业务组件 | 同目录 `X.css.ts` | 每场景 / 组件一个，静态样式全部进 `style()` / `styleVariants` |
| ui 组件库 | `packages/ui/src/components/X.css.ts` | 同上；共享 `btn` 交互态在 `styles.css.ts` |
| tokens | `packages/ui/src/tokens.ts` | `C` / `FONT` / `R` 等常量，`.css.ts` 构建期直接 import（单源） |

**动态值规范**（"样式定义零内联，style 属性只作值通道"）：

1. 状态枚举（稀有度 / 锁定 / 对错）→ `styleVariants` 或多类拼接，禁内联拼渐变；
2. 参与 CSS 规则的动态值（`animationDelay` 等）→ `createVar()` 声明插槽，tsx 经 `assignInlineVars` 注入；
3. 纯状态驱动的 transform / opacity / clipPath（拖拽、进度）可保留 `style={{...}}` 值通道；
4. ui 组件对外的 `style` prop 逃生舱保留（合并在最后）。

**硬约束**：

- `.css.ts` 内**禁止 import 图片资产**（webp url 留在 tsx import，经内联 / CSS 变量注入）——ve 构建期求值不处理资产管线；
- keyframes 一律 `keyframes()` 创建或引自 `motion.css.ts`，**禁止手写动画名字符串**（历史上全局 keyframes + CSS Modules 局部化曾致动画静默失效）；
- z-index、calc()、clamp、cqw 等原样字符串写入 `style()` 即可（容器查询用 `containerType` 属性）。

## 6. 视口与自适应

**方案**：1024×768 逻辑画布（4:3 安全框）contain 等比缩放 + 背景出血铺满，实现在 `app/viewport.tsx`：

- **`SceneShell`**（BackgroundBleed + LogicalStage 二合一）：固定像素场景的统一入口——`bleed` 留边兜底色/渐变、`bleedImage` 留边 cover 出血位图。8 个固定像素场景（Home / Plaza / Farm / PetPanel / Settings / Splash / HeroIntro / Adopt）全部接入（HeroIntro / Adopt 经 SkyBackdrop 间接使用）——场景内坐标即设计稿折算的 1024×768 px，视口变化时整体等比缩放，元素不错位；
- **`LogicalStage` / `BackgroundBleed`**：SceneShell 的底层件，场景一般不直接使用；
- **`OrientationGate`**：竖屏显示轻提示胶囊（不阻断；一期目标设备为平板横屏，不做手机竖屏适配）；
- **safe-area**：`scaffold.css` 定义 `--sat/--sar/--sab/--sal`（`env(safe-area-inset-*)`），`index.html` 已配 `viewport-fit=cover`；刘海区内容避让按此变量；
- **三套场景布局策略**：固定像素场景走 SceneShell；Quiz / Result 用"百分比 + aspectRatio 舞台"（分辨率无关）；Gacha / Backpack / ChestPanel 用 clamp / vmin / 容器查询流式；
- **手写板坐标**：`WritingBoard` 笔迹按 `rect` 实际尺寸与画布逻辑尺寸**比例换算**（`(clientX - rect.left) * (w / rect.width)`），祖先带 CSS scale（LogicalStage）时笔迹仍准确；
- **字号**：固定像素场景字号一律引用 `FONT` token（packages/ui tokens.ts 9 档：micro 12 / aux 14 / small 16 / body 18 / h2 22 / title 28 / display 36 / hero 48 / question 64），ESLint `no-restricted-syntax` 拦截 css.ts 内 fontSize 字面量；流式场景、舞台外组件与 dev 工具页豁免（eslint.config.mjs 豁免清单）；
- **DPR 钳制 ≤2**；MatePad 横屏 CSS 视口约 1400×920，缩放比 >1 属预期（高分屏清晰）。

### 6.1 新增场景检查单

1. **布局策略三选一**：固定像素（默认，SceneShell）/ 百分比 + aspectRatio / 流式（clamp·vmin·容器查询）；在 §6 策略清单登记归类。
2. **固定像素场景**：`SceneShell` 包裹；有位图背景时 `bleed` 给兜底色 + `bleedImage` cover 出血；舞台内 z0 背景 `<img>` 铺满随舞台缩放，禁 `objectFit: fill`；全屏弹层放 SceneShell 外。
3. **字号**：走 FONT 9 档（css.ts 内字面量会被 ESLint 拦截；孤例用 eslint-disable 注明理由）。
4. **safe-area**：贴边交互元素用 `var(--sat)` 等变量避让。
5. **工程约束**：css.ts 不 import 图片（ESLint 拦截）；keyframes 一律 `keyframes()` 或引自 motion.css.ts。
6. **指针坐标**：拖拽 / 手写等用 clientX/Y 反推逻辑坐标的组件，按 rect 比例换算（参考 WritingBoard），祖先有 CSS scale 仍准确。
7. **背景生图**：PAGE / BG 类 prompt 必须声明 4:3 安全框 + 横向 bleed 构图（asset-prompts 模板「安全区 / bleed」字段；design-system §10）。

## 7. 广场 3D 方案（二期；概要，详见 [plaza-3d.md](./design/phase2/plaza-3d.md)）

> 2026-10-04 拍板：广场实时 3D 整体转二期，一期广场为 2D 静态页。以下保留为二期技术基线。

- **单例 renderer + 场景状态机**：离开广场回 2D 时 dispose 几何 / 材质 / 纹理、释放 WebGL 上下文，避免与长会话叠加显存。
- **渲染参数**：DPR 钳制 ≤2；贴图 ≤1024（特写 2K）；场景总 tris <300k；GLB Draco/Meshopt；后处理按设备分级，帧率监控掉帧自动降质。
- **相机 / 操控**：第三人称自由旋转跟随相机 + 左手虚拟摇杆；广场边界 + 建筑碰撞体。**无体力系统**。
- **质感**：Clay / vinyl PBR（roughness 0.4–0.6、metalness≈0、软阴影、程序化 IBL），以 Look Dev 校准固化为准（`three/ClayMaterial.tsx` 等预留件一期未接线）。
- 标签页 hidden 时 RAF 暂停致 3D 空白属预期，回前台恢复（ResizeObserver / resize 监听兜底）。

## 8. 手写数字识别（MNIST / tfjs）

- 答案按数位拆格，每格识别一个 0–9；**WASM 后端**（本地打包三个 wasm，可离线、不依赖 CDN），不与 three.js 抢 WebGL。
- 预处理：墨迹包围盒裁剪 → 长边缩到 20 → 质心居中 28×28 → 反转为黑底白字归一化（与训练口径一致）。
- API：`loadModel()`（单例 + in-flight 复用、**失败清缓存可重试**）、`warmupModel()`、`recognizeDigitTopK()`、`isCanvasBlank()`（**RGB 三通道判定**，与识别口径一致；空白提示"再写一次"）。
- 模型：第一版弱增强模型（测试集 97.35%）当前在用；**不无条件重训**（高频误判或积累足够真实样本再说，Runbook 见 [`../ml/mnist/README.md`](../ml/mnist/README.md)）。
- 手写样本采集转二期：strokes 表 schema 保留、一期不写入。回显识别数字 + 逐格确认仅调试模式（默认关）。
- 图片预加载（`utils/preload.ts`）：失败重试**复用原 src**（缓存键与 `<img>` 最终使用键一致，成功一次后不再发请求）。

## 9. 状态管理（zustand）

`stores/` 按域拆分 10 个 store + `persist.ts` + `index.ts bootstrapStores()` 启动编排。

| store | 职责 |
|---|---|
| usePlayerStore | 游客设备 UUID、主角名（默认"小朋友"，上限 `PLAYER_NAME_MAX`）、默认着装、引导完成标志 |
| useEconomyStore | shells / flowerCoins / petFood（无体力无水滴）；每日轮次与浮题计数——**dateKey 组与 floatDate 组各自独立跨日重置**；`registerRound` / `registerFloat` 无参化、配置内部直读 |
| usePetStore | 宠物列表（一期仅 rabbit）、跟随 petType、petName、累计 petExp、等级（1食物=10经验，阈值 0/50/1000）；**`feedAll()` 自包含编排：满级拒绝、校验并原子扣食物，返回 `FeedResult{ok, reason?, fed, leveled, leveledTo}`** |
| useFarmStore | farmLevel/farmExp、plots（一期固定 4）、种子 / 果实库存、售卖、真实时间生长；`buySeeds` 走 `pay` 回调注入；`harvest` 的 leveled 只标触发升级的那条 |
| useGachaStore | 保底计数（10 稀有 / 100 传说，持久重置）、单抽 50 / 十连 450、每次必出、重复只提示不返贝壳；**`performDraw` 扣费原子化（`spendShells` 失败即不发奖）** |
| useEquippedStore | ownedCosmetics / equippedCosmetics（无 gender） |
| useLastRoundStore | 答题轮次：题目 / 索引 / 答对数 / mode / status；正式答题不超时、每日前 2 轮发奖 |
| useMasteryStore | 有序知识点路径 + 三态 + 掌握计数；`distribution` 供每轮 70/30 配比（**某阵营为空时配额重分配，保证总和 = 总题数**） |
| useWrongbookStore | 错题按"知识点+题型"去重、容量 `WRONGBOOK_CAPACITY`（config/quiz.ts，默认 100）；**LRU：重复答错移到队尾，淘汰最久未答错**（PRD §7.4 口径）；`removeIfCorrect` 仅在 key 存在且答对时返回 true |
| useStreakStore | 当天完成 ≥1 轮、连续 streak、累计天数、宝箱记录；断签后 streak 重置为 1、宝箱等级由 streak 直接推导；`markChestOpened()` 无参化（日期内部自取 `dayKey()`） |
| useSettingsStore | BGM / 音效开关、清缓存（只清 SW / CacheStorage，不碰存档） |

**持久化与启动加固**：

- `persist.ts` 订阅防抖（`PERSIST_DEBOUNCE_MS` 共享常量）写入分表；**`beforeunload` / `pagehide` 触发 flush**，关页不丢最后一次变更；
- `bootstrapStores()` 用 **in-flight Promise 缓存**（并发调用共享、失败清缓存可重试）；重复绑定时**先解绑旧订阅**（解绑函数全部留存），StrictMode 双调用安全；
- 数值全部集中 `config/`（含 `config/player.ts` 的 `PLAYER_NAME_MAX`）；死配置已清理（oralParams / CHECKIN_REQUIRED_ROUNDS / STREAK_RESET_ON_MISS / FORMAL_HAS_TIMEOUT / COLD_START.flowerCoins 等）；
- 经济模拟脚本已就位（`apps/web/scripts/economy-sim.mjs`）。【待办】上线前跑 7 / 30 天模拟（PRD §13）。

## 10. 本地数据（IndexedDB）

`db/index.ts` DB v3 = 10 张业务表（旧 v1 `state` 仓在 v2→v3 升级中一次性 `deleteObjectStore`，纯 schema 清理）。demo 阶段无老存档、不做 legacy 迁移：`db/migration.ts` 仅负责**新装默认初始化**（`ensureInitialized`：无 profile 写全套默认值，已有 profile 幂等补齐缺失表）。未来 schema 变更走 `upgrade(vN→vN+1)`。

| objectStore | 内容 |
|---|---|
| profile | 设备游客 UUID、主角名、引导完成标志 |
| economy / pets / cosmetics / farm | 各域存档（farm 地块含 plantedAt） |
| mastery / wrongbook / strokes / streak / settings | 掌握路径 / 错题 / 手写样本（一期不写）/ 连学 / 音频开关 |

- **初始化幂等**：`ensureMissingTables` 只补整表，字段级兜底由 store 装载时 spread 默认值承担。
- `getDB` 打开失败**清缓存 Promise 允许重试**（隐私模式 / 版本错误场景）。
- 时间口径：本地时间戳、接受改设备时间（一期无后端校验）；自然日 key 用 `dayKey()`。
- "清除缓存"只清 SW / CacheStorage，**不碰 IndexedDB 存档**；一期不做导出 / 导入 / 云存档。

## 11. 题库与掌握度引擎（一期）

- **口算**：100% 程序生成（`content/oral.ts`：模板 + 参数 + 确定性答案），不依赖题库文件；**生成参数随生成器函数维护**（原 knowledgePath 的 `oralParams` 双事实源已删除）；重试超限的兜底题 `knowledgeId` 归属请求节点（掌握度归因不错标）。
- **掌握度**（`content/mastery.ts` + `knowledgePath.ts`）：有序路径 + 三态，阈值默认连续掌握 3–5 次（可配）自动解锁下一个；未解锁不出题（不超纲）；每轮 70% 当前 + 30% 复习（某阵营为空时配额重分配）；开学小测 / 完整掌握度机制转二期。
- **真题（选择题）**：有限模板库 + 参数填充，**模板须经用户教研审核**【待办】；填空 / 应用题 / 奥数二期。
- **不爬商业题库**；开源 Ape210K / Math23K 仅作题型参考。
- 错题本：一期仅数据层记录（写而不显），按"知识点+题型"去重、LRU 上限 100。

## 12. PWA、部署与真机

### 12.1 PWA
- **骨架已配**：manifest（standalone / landscape / 主题色 sky）、SW `registerType: 'autoUpdate'` + workbox precache（≤4MB，GLB / 音频运行时缓存）；dev 不注入 SW。
- 离线：核心 2D 与已缓存资源可离线；一期不上应用商店、不做推送。
- 【待办 M6】"发现新版本→刷新"提示、添加桌面引导、华为真机五项验收、缓存配额管理（8GB 设备从严）。

### 12.2 部署
- **开发 / 调试 = 局域网 HTTP**：Vite `--host` 监听 0.0.0.0，MatePad 连同 WiFi 访问。
- **正式 = 免费 HTTPS 静态托管**（Vercel / Netlify / Cloudflare Pages 之一）。【待办】定平台 / 账号。
- 硬限制：SW / 添加桌面 / 离线要求安全上下文，**局域网 http://IP 注册不了 SW**，PWA 安装 / 离线只在正式 HTTPS 验收。

### 12.3 目标真机与必测
- MatePad TGR-W10：HarmonyOS 4.2、2800×1840 横屏、8GB、DPR≈2（钳制 ≤2）、横屏 CSS 视口约 1400×920。
- 适配方案见 §6（LogicalStage 等比缩放 + 背景出血 + safe-area）；竖屏轻提示，不做手机响应式。
- **华为浏览器 PWA 五项 M6 必测**：①添加桌面图标 / 名称；②standalone 全屏启动；③离线打开缓存；④SW 发现新版本刷新；⑤WASM（MNIST）/ IndexedDB（存档）可用（WebGL2 为二期广场项）。
- 降级：若华为浏览器 PWA 能力不完整，一期降级"添加桌面快捷方式 + 在线 / 缓存使用"，二期用 **Capacitor 打安卓 APK**。

## 13. 音频
- **已封装** `utils/audio.ts`（AudioManager：首次交互后解锁 AudioContext、BGM / 音效独立开关、默认开、设置可关）；素材未就位前以 WebAudio 程序化轻提示音兜底。
- 【待办 G4】AI 生成正式素材：BGM 2–3 首 + 音效全套；统一轻快童趣、**商用授权清晰**。

## 14. 已验证的坑（勿重复踩）
- tfjs 与 three 抢 WebGL → MNIST 固定走 WASM 后端（本地 wasm，不依赖 CDN）。
- workspace 链接包（@mathpaws/ui / @mathpaws/paperdoll）被 `optimizeDeps.include` 预构建后，源码改动不触发缓存失效（曾致画布空白）→ **vite.config 固定 `exclude` 这两个包**，必要时 `vite --force`。
- Vite 对 tfjs 预构建偶发留坏缓存致白屏 → tfjs 两件固定 `include` + 硬刷新。
- @react-three/postprocessing 用 ^2.19.1，v3 不兼容 fiber 8。
- 在线 MNIST 模型 URL 全 404（模型本地化）；包管理统一 `corepack pnpm`。
- **CSS Modules 会把 `animation` 里的裸动画名局部化**，引用全局 keyframes 静默失效——已随 vanilla-extract 迁移根治（ve 的 `keyframes()` 创建与引用同源），禁止回退到手写动画名字符串。
- **vanilla-extract 的 `.css.ts` 不处理资产管线**：图片 url 一律在 tsx import 后注入，勿在 `.css.ts` 里 import 资产。
- 自动化浏览器多次 WebGL Context Lost 后 ResizeObserver 不回调 → 重启真实浏览器即恢复，勿因此改 three 代码；合成 click 在 WebGL 不触发 React，用元素 `.click()`。
- 标签页 hidden 时 RAF 暂停致 3D 空白（非缺陷，回前台恢复）。

## 15. 二期后端（不在一期）
Fastify REST + 数据库：题库内容下发、账号体系、学习记录 / 错题云同步、家长中心、云存档、补签、可选 Sentry / 监控；Capacitor 打包独立 App。一期代码避免把进度写死在组件内，为二期接 API 预留 repository 边界（数据访问收敛到 db / api 层）。
