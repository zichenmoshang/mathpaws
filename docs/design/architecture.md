# mathpaws 技术方案文档（Architecture）

> 版本：一期定稿　|　最后更新：2026-09-28
> 产品范围 / 数值见 [../PRD.md](../PRD.md)，视觉规范见 [../design-system.md](../design-system.md)，广场 3D 细节见 [plaza-3d.md](./plaza-3d.md)，3D 资产见 [asset-manifest.md](./asset-manifest.md)。
> 本文档描述**一期定稿目标架构**；与当前代码不一致处显式标注 `【现状】` / `【待重构】`，不虚构已完成能力。

---

## 1. 系统总览

一期是**纯前端、无后端、无注册**的可安装 PWA：所有逻辑在浏览器 / WebView 内完成，进度持久化在本机 IndexedDB，游客身份按设备分配 UUID。二期才引入账号 / 云存档 / 后端。

```
┌──────────────────────────────────────────────────────┐
│                PWA 前端（React 18 + Vite + TS）        │
│  ┌────────────────────────────────────────────────┐  │
│  │ 视图层  2D 页面（P0–P16，除广场外全部）          │  │
│  │        @mathpaws/ui 通用件 + apps/web 业务件     │  │
│  ├────────────────────────────────────────────────┤  │
│  │ 3D 层  仅广场：three + @react-three/fiber+drei  │  │
│  ├────────────────────────────────────────────────┤  │
│  │ 能力层  题库生成器 / 掌握度引擎 / 手写识别(MNIST) │  │
│  │        经济结算 / 农场时钟 / 抽卡保底 / 连学      │  │
│  ├────────────────────────────────────────────────┤  │
│  │ 状态层  zustand stores（内存）                   │  │
│  ├────────────────────────────────────────────────┤  │
│  │ 数据层  IndexedDB(idb) 本地存档 + localStorage   │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
        一期离线自洽；二期再接 Fastify + DB / 账号 / 云存档
```

- **交付形态**：PWA（vite-plugin-pwa），开发走局域网 HTTP 调试，正式走免费 HTTPS 静态托管（见 §10）。
- **目标真机**：华为 MatePad 11.5" TGR-W10 / HarmonyOS 4.2 / 8GB / 2800×1840 横屏（详见 §10、design-system §8）。

## 2. 技术栈

| 依赖 | 版本（现状 package.json） | 用途 |
|---|---|---|
| react / react-dom | ^18.3.1 | 视图框架 |
| vite / typescript | ^5.4.10 / ^5.6.3 | 构建 / 类型 |
| three | ^0.169.0 | WebGL 渲染 |
| @react-three/fiber | ^8.17.10 | three 的 React 封装 |
| @react-three/drei | ^9.114.0 | 相机 / 加载器 / 辅助 |
| @react-three/postprocessing | **^2.19.1** | 后处理（**v3 不兼容 fiber 8，勿升**） |
| zustand | ^5.0.15 | 状态管理 |
| idb | ^8.0.3 | IndexedDB 封装 |
| @tensorflow/tfjs | ^4.22.0 | 手写数字推理 |
| @tensorflow/tfjs-backend-wasm | ^4.22.0 | **WASM(CPU) 后端，不抢 WebGL** |
| @mathpaws/ui | * | monorepo 内共享组件库 |
| vite-plugin-pwa | 【待引入】 | PWA manifest / Service Worker / 离线 |

> 训练侧（不在前端运行）：Python 3.12 venv、tensorflow 2.18.1 / tfjs 4.22，见 [`../../ml/mnist/README.md`](../../ml/mnist/README.md)。

## 3. monorepo 目录

npm workspaces（**根 package.json 现状为 `apps/*`、`packages/*`**；统一用 npm，pnpm 不在 PATH）。

```
mathpaws/
├── package.json                 # workspaces + dev/build/preview（-w mathpaws-client）
├── apps/
│   └── web/                     # 包名 mathpaws-client，当前唯一应用
│       ├── src/
│       │   ├── main.tsx         # 入口（挂全局样式 + @mathpaws/ui/styles.css）
│       │   ├── App.tsx          # 【现状】useState 场景切换 + hash 直达（#lookdev/#quiz/...）
│       │   ├── scenes/          # Plaza Quiz Farm PetShop Gacha PetSelectModal LookDev BackScreen
│       │   ├── three/           # Player Building Environment Interactables SceneRig Effects ClayMaterial
│       │   ├── config/          # buildings farm gachaPool floatingQuestions（数值集中地）
│       │   ├── store/useGameStore.ts
│       │   ├── db/index.ts      # 【现状】单 'state' 仓 key-value，version 1，无分表/迁移
│       │   ├── utils/mnist.ts   # MNIST WASM 推理 + 预处理 + 空白检查
│       │   ├── styles/global.css
│       │   └── assets/models/pets/rabbit.glb
│       ├── public/models/mnist/ # model.json + 权重 bin（tf.loadLayersModel('/models/mnist/model.json')）
│       └── vite.config.ts
├── packages/
│   └── ui/                      # @mathpaws/ui：tokens.ts + components.tsx + styles.css
├── ml/mnist/                    # 训练脚本 train.py/patch.py/fix_model.py + README + requirements
├── design/                      # high-fi 高保真、gen3d-input 建模输入图（已整体对 AI 忽略）
└── docs/                        # PRD、progress、issues、design-system、design/*
```

### 3.1 共享 UI 包 `@mathpaws/ui`
- 私有包、**发布 TS 源码**（web 的 Vite/esbuild 直接编译，不单独打包）；`main`/`types` 指向 `src/index.ts`，exports 暴露 `.` 与 `./styles.css`。
- `src/tokens.ts` 是 token 代码权威：`C`（色板）、`SUBJECT`、`FONT`、`R`、`SPACE`、`edge()`、`SHADOW`、`strokeText()`、`VARIANT`。
- React / React-dom 为 peerDependencies（^18.3.1），@types/react 放 devDeps，避免多实例 React。
- 包内组件**不依赖**业务 store / 路由 / 图片、全内联样式；已有 10 个通用件，待补清单见 Spec tasks。Vite `optimizeDeps.include` 含本包。

## 4. 应用分层与页面路由

### 4.1 页面与场景
- 页面编号 P0–P16（见 PRD §3.3）。**仅 P5 广场是实时 3D**，其余全部 2D。
- 【现状】`App.tsx` 用 `useState<Scene>` + `window.location.hash` 直达（#lookdev/#quiz/#pet/#gacha/#farm），返回时清 hash reload。
- 【待重构，M0】引入统一路由 / 场景状态机：
  - 路由级 **React.lazy + 动态 import** 拆 chunk，2D 页与广场 3D 各自独立；
  - 进广场等重资源前过 **SceneTransition** 显式加载进度，资源未就绪不切场景、失败可重试；
  - 保留 `#lookdev` 调试入口；dev hash 直达可保留为测试便利；
  - 全局 **ErrorBoundary**（局部崩溃可重试，不整页白）+ 首屏超时检测 + 启动兼容性检测（WebGL2 / WASM 不支持时明确提示）。

### 4.2 首次 / 非首流动线（路由编排）
- 设备无档案 → P1 splash → P2 中性主角亮相起名（可跳过）→ P3 领养雪球兔（犬猫"即将开放"）→ **首次直接进 P5 广场**（轻引导 B，可跳过、不重播）。
- 已有档案 → P1 → **P4 首页**。
- 首页"益智乐园"→ 广场；广场农场建筑 → P8 农场（返回到广场）；顶部学盒 / 背包 / 宠物 → P10 / P16 / P9；首页 / 广场宝箱 → ChestPanel；首页卡片 → P6 答题 / P11 错题本；答题中返回需 ConfirmDialog 二次确认。

## 5. 广场 3D 方案（概要，详见 plaza-3d.md）

- **单例 renderer + 场景状态机**：离开广场回 2D 时 dispose 几何 / 材质 / 纹理、释放 WebGL 上下文（最近 GLB 可留缓存），避免与长会话叠加显存。
- **渲染参数**：DPR 钳制 ≤2；贴图 ≤1024（特写 2K）；场景总 tris <300k；GLB Draco/Meshopt；后处理按设备分级（低端降 / 关 Bloom / DOF），帧率监控掉帧自动降质。
- **相机 / 操控**：第三人称自由旋转跟随相机（右手拖动，水平 360°、俯仰 clamp），左手虚拟摇杆移动；广场边界 + 建筑碰撞体，越界拉回。**无体力系统**（旧"每分钟 -5 体力"作废）。
- **质感**：Clay / vinyl PBR（润搪胶、roughness 约 0.4–0.6 起调、metalness≈0、软阴影、程序化 IBL、毛绒用 fresnel sheen，最终以 Look Dev 校准固化为准），先在 Look Dev 以 `design/high-fi/plaza.png` 为靶子固化预设（`three/ClayMaterial.tsx` / `SceneRig.tsx` / `Effects.tsx`，后处理链见 plaza-3d §7）。
- 标签页 hidden 时 requestAnimationFrame 暂停会导致 3D 空白，属预期；回到前台需正确恢复（ResizeObserver / resize 监听兜底）。

## 6. 手写数字识别（MNIST / tfjs）

### 6.1 现状（已落地，`utils/mnist.ts`）
- 答案按数位拆格，每格识别一个 0–9。
- **WASM 后端**：`setWasmPaths` 指向本地打包的三个 wasm（普通 / simd / threaded-simd，随 Vite 打包、可离线、不依赖 CDN），`tf.setBackend('wasm')`；three.js 仍用 WebGL。**解决了 WASM 与 WebGL 抢 GPU 导致 Context Lost / 点击识别卡死的问题。**
- 预处理：墨迹包围盒裁剪 → 长边缩到 20 → **质心居中到 28×28** → 反转为黑底白字并归一化（与训练口径一致）。
- API：`loadModel()`（单例 + in-flight 复用、失败可重试）、`warmupModel()`（进答题页后台预热）、`recognizeDigitTopK(canvas,k)`、`recognizeDigit()`、`isCanvasBlank()`（空白检查，空白抛错由 UI 提示"再写一次"）。
- 模型：`/models/mnist/model.json` + 权重 bin（**文件大小以 `apps/web/public/models/mnist/` 实际文件为准**）；第一版弱增强模型测试集准确率 97.35%，当前在用。

### 6.2 采集与重训策略
- 每题保存手写样本（笔迹栅格 / 识别数字 / 正确答案 / 对错）到 IndexedDB；识别结果 ≠ 正确答案标"待复核"，支持导出供再训练。
- 回显识别数字 + 逐格手动确认仅用于**调试模式（默认关）**；正式流程没识别出来提示重写。
- **不无条件重训**：仅当出现明显 / 高频误判、或积累足够真实样本后再重训。训练 Runbook（Python3.12 venv312、版本链、patch、导出 tfjs）见 [`../../ml/mnist/README.md`](../../ml/mnist/README.md)。
- 应用题 / 填空（含多位数语义）二期；一期手写仅口算单个 0–9，真题为选择题。

## 7. 状态管理（zustand）

【现状】单一 `useGameStore` 大而全，且含**已定稿废弃字段**：`stamina`（体力）、`waterDrops` / `waterPlot` / `rollQuizWaterDrop` / `claimRoundWaterDrop`（水滴）、`equipped`/`equipItem`（宠物装备）、抽卡重复返还贝壳 `DUP_REFUND` 等。

【待重构，M0】按域拆分 stores，并删除废弃字段：

| store | 职责（定稿） |
|---|---|
| usePlayerStore | 游客设备 UUID、主角名（默认"小朋友"）、默认着装、**人物装扮 ownedCosmetics / equippedCosmetics（头/衣/裤/饰，无 gender）**、新手引导完成标志、开学小测是否完成 |
| useEconomyStore | shells 贝壳、flowerCoins 花朵币、petFood 食物（**无体力 / 无水滴滴**）；每日轮次计数与日期戳、浮题日计数 |
| usePetStore | 拥有宠物列表（一期仅 rabbit）、当前跟随 petType、petName（≤6 字）、累计 petExp、等级（1食物=10经验，阈值 0/50/1000）、一键喂食 |
| useFarmStore | farmLevel/farmExp、plots（4→6→8→9）、种子库存、果实库存、售卖、真实时间生长 |
| useGachaStore | 学盒保底计数（10 稀有 / 100 传说，持久重置）、单抽 50 / 十连 450、每次必出、**重复只提示"已有"不返贝壳** |
| useQuizStore | 当前轮题目 / 索引 / 答对数 / mode（oral/real；olympiad 二期）/ status、正式答题不超时、每日前 2 轮发奖 |
| useMasteryStore | 有序知识点路径 + 三态（未解锁 / 学习中 / 已掌握）+ 每点掌握计数、出题 70% 当前 / 30% 复习、未解锁不出 |
| useWrongBookStore | 错题（按"知识点+题型"去重、错误次数、分步思路、答案默认隐藏） |
| useStreakStore | 当天是否完成 ≥1 轮、连续 streak、累计学习天数、宝箱 lastOpened、断签降级 |
| useSettingsStore | BGM / 音效开关（localStorage 亦可）、清缓存 |

- 数值全部集中在 `config/`（可配），上线前跑 7 / 30 天经济模拟（PRD §13）。
- 持久化：订阅 store 变更做防抖写入（现状已有 500ms debounce 写 `gameState`，保留该思路、按新分表写）。

## 8. 本地数据（IndexedDB）

【现状】`db/index.ts` 仅一个 `state` objectStore、key-value 存 `gameState`，DB version 1，无分表 / 迁移。

【定稿目标】分表 + **schema version + 迁移函数**（`upgrade(vN→vN+1)`，改字段不丢档）：

| objectStore | 内容 |
|---|---|
| profile | 设备游客 UUID、主角名、引导 / 小测完成标志 |
| economy | 贝壳 / 花朵币 / 食物、每日轮次与浮题计数、日期戳 |
| pets | 拥有 / 跟随宠物、名字、累计经验 |
| cosmetics | 装扮拥有列表、当前穿戴、抽卡保底计数 |
| farm | 农场等级 / 经验、地块状态（含 plantedAt）、种子 / 果实库存 |
| mastery | 知识点有序路径、各点状态与掌握计数 |
| wrongbook | 错题（去重键、错误次数、分步思路、揭示状态） |
| strokes | 手写样本（笔迹栅格 + 识别数字 + 正确答案 + 对错 + 时间戳），供再训练 |
| streak | 连学 / 累计天数、宝箱领取记录 |
| settings | 音频开关等轻状态（也可 localStorage） |

- 时间口径：本地时间戳、接受用户改设备时间（一期无后端校验）；自然日 key 沿用 `dayKey()`（现状注释提到"04:00 切日待全端统一"，一期按本地自然日）。
- "清除缓存"只清 Service Worker / CacheStorage，**不碰 IndexedDB 存档**；一期不做存档导出 / 导入、不做云存档（二期随家长中心 / 账号）。

## 9. 题库与掌握度引擎（一期）

- **口算**：100% 程序生成（题干模板 + 参数填充 + 确定性答案 + 干扰项），不依赖题库文件。
- **真题（一期仅选择题）**：计算结果选择 + 概念辨析，走"有限模板库 + 参数填充"，**模板须经用户教研审核**；填空 / 应用题 / 奥数二期。
- **不爬商业题库**（版权 / 反爬 / 脏数据）；开源 Ape210K / Math23K 仅作题型 / 知识点参考。
- 前置产物：《一期知识点 - 题型 - 解法清单》（北师大三上，去除观察物体 / 作图测量 / 里程表 / 数学好玩；助手起草、用户审）。
- 题目 schema：`{ id, 题型, 知识点id, 序号, 单元, 题干模板, 参数范围, 答案, 选项(真题), 分步思路, 干扰项生成, 难度, 来源 }`。
- 掌握度：有序知识点路径 + 三态；阈值默认连续掌握 3–5 次（可配）自动解锁下一知识点；开学小测 5–10 题可跳过，跳过则从第 1 单元靠掌握度追赶；每轮当前知识点 70% + 复习 30%，未解锁不出（不超纲）。
- 错题本：仅收正式答题错题（浮题不收）、按"知识点+题型"去重（同类 1 条 + 错误次数）、重做生成同类新题、分步思路默认展示、最终答案默认隐藏手动揭示、容量约 100。

## 10. PWA、部署与真机

### 10.1 PWA（M0 搭骨架，M6 真机验收）
- vite-plugin-pwa：manifest（名称 mathpaws、全尺寸图标、display standalone、orientation landscape、主题色）；Service Worker 做 App Shell + 带版本号 precache，"发现新版本→刷新"提示；添加到桌面引导按浏览器给。
- 离线：核心 2D 与已缓存资源可离线；GLB / 音频按需 CacheStorage 并做配额管理（8GB 设备从严控体积 / 显存）。
- 一期不上应用商店、不做推送。

### 10.2 部署
- **开发 / 调试 = 局域网 HTTP**：Vite `--host` 监听 0.0.0.0、放行防火墙，MatePad 连同一 WiFi 访问 `http://电脑局域网IP:端口`。
- **正式 = 免费 HTTPS 静态托管**（Vercel / Netlify / Cloudflare Pages 之一，M0 定平台 / 账号）。
- 硬限制：Service Worker / 添加桌面 / 离线要求安全上下文，**局域网 http://IP 注册不了 SW**；PWA 安装 / 离线只在正式 HTTPS 验收（局域网 HTTP 下 IndexedDB 一般可用，需真机确认）。

### 10.3 目标真机与必测
- MatePad TGR-W10：HarmonyOS 4.2、2800×1840（≈1.52:1）横屏、8GB、集成 GPU（Mali 级）、华为浏览器 Chromium 内核、DPR≈2（钳制 ≤2）、横屏 CSS 视口约 1400×920。
- 逻辑设计基准 1024×768（4:3），适配 = **4:3 安全框 + 背景横向 bleed 铺满**，不黑边、不裁关键内容、不做手机响应式；竖屏给"请横屏使用"遮罩。
- **华为浏览器 PWA 五项 M6 必测**：①添加桌面图标 / 名称；②standalone 全屏启动；③离线打开缓存；④SW 发现新版本刷新；⑤WebGL2（广场）/ WASM（MNIST）/ IndexedDB（存档）可用。
- 降级：若华为浏览器 PWA 能力不完整，一期降级"添加桌面快捷方式 + 在线 / 缓存使用"，二期用 **Capacitor 打安卓 APK**（HarmonyOS 4.2 兼容安卓，代码不重写）。

## 11. 音频
- 【待实现】`utils/audio.ts` 封装；BGM 先 2–3 首（首页 / 广场、答题、农场 / 抽卡），音效（按钮 / 答对 / 错 / 翻题 / 拾取 / 开箱 / 喂食 / 进化 / 领奖 / 弹窗）；统一轻快童趣、AI 生成且**商用授权清晰**（M0 选型）；首次交互后解锁 AudioContext，默认开、设置可关。

## 12. 已验证的坑（勿重复踩）
- tfjs 与 three 抢 WebGL → MNIST 固定走 WASM 后端（本地 wasm，不依赖 CDN）。
- Vite 对 tfjs 预构建偶发留坏缓存致白屏 → `optimizeDeps.include` 固定 + `npx vite optimize --force` + 硬刷新。
- @react-three/postprocessing 用 ^2.19.1，v3 不兼容 fiber 8。
- 在线 MNIST 模型 URL 全 404（模型本地化）；pnpm 不在 PATH（用 npm）。
- 自动化浏览器多次 WebGL Context Lost 后 ResizeObserver 不回调 → 重启真实浏览器即恢复，勿因此改 three 代码；合成 click 在 WebGL 不触发 React，用元素 `.click()`。
- 标签页 hidden 时 RAF 暂停致 3D 空白（非缺陷，回前台恢复）。

## 13. 二期后端（不在一期）
Fastify REST + 数据库：题库内容下发、账号体系、学习记录 / 错题云同步、家长中心、云存档、补签、可选 Sentry / 监控；Capacitor 打包独立 App。一期代码避免把进度写死在组件内，为二期接 API 预留 repository 边界（数据访问收敛到 db / api 层）。
