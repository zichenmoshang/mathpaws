# mathpaws 组件 ↔ 资产映射 / 生图规范

> **【瘦身 · 2026-09-30；2026-10-05 更新】**
> 原"页面 / 资产 / 组件实施总清单"中的页面清单与完成状态、高保真处置、G0–G3 资产需求、UI 组件清单、生产批次（原 §0–§7、§10）已移交 Spec 工作流并随其 2026-10-05 收口删除；当前资产剩余项为 24 张作物阶段图（由内部进度文档跟踪，不公开）。
> **本文仅保留独有内容**：§1 组件 ↔ 图片资产映射、§2 AI 生图生产规范（尺寸 / 工序 / brand-ip 门禁）。
>
> 版本：一期定稿（瘦身版）　|　最后更新：2026-09-30
> 规则 / 数值见 [../PRD.md](../PRD.md)；视觉规范见 [../design-system.md](../design-system.md)；**3D 资产状态台账**见 [asset-manifest.md](./asset-manifest.md)。

---

## 1. 组件 ↔ 图片资产映射

| 组件 | 用到的位图 / SVG / 纹理 | 备注 |
|---|---|---|
| Btn / RoundBtn / Chip | — | 纯 CSS（渐变 + 描边 + 软阴影） |
| Switch / ProgressBar / CountdownRing / StarTrack | — | 纯 CSS / SVG |
| Tabs / OptionButton / Toast | — | 纯 CSS + 文字 |
| Modal / Sheet / ConfirmDialog | 可选 deco-star | 底板纯 CSS 9-slice |
| Icon | G1 全套 SVG（含 gacha/backpack/pet） | 颜色 CSS 可控 |
| TopBar / ResourcePill | i-shell、i-flower、avatar-frame、gear、streak | 食物不进顶部、无教材切换 |
| BackBtn | i-back | SVG |
| TopNavEntries | icon-gacha、icon-backpack、icon-pet | 顶部居中三入口 |
| PetBubble | i-food、icon-pet、pet-rabbit 小图 | 一键喂食 / 进面板 |
| ItemGrid / ItemCell | seed-* / fruit-* / dress-* / pet 缩略、i-lock、frame 三色 | 按场景传 |
| RewardBadge / RewardRow | i-shell、i-flower、i-food | — |
| Tag / LockTag | i-lock、稀有度 frame | — |
| Carousel | card-streak / card-challenge / card-wrongbook + 题型 icon | 首页 3 卡、手动滑动 |
| EmptyState | mascot-bird-pose（待机 / 难过） | — |
| LoadingBar / LoadingOverlay / SceneTransition | bg-loading、mascot-bird-pose / hero-pose | 新增 |
| CloudInput | deco-cloud（优先 CSS） | 起名 |
| PaperDoll / DressUpPanel | paperdoll-body + paperdoll-default + dress-* | 透明 WebP 图层叠加、无 hair/face/skin 多选 |
| PlacementTest | 复用 QuizHud / 答题页位图 | 不单独出整页 |
| EvolutionTrack | pet-rabbit-s1/2/3、i-lock | 未解锁灰度 + 锁 |
| ChestPanel | chest 开/关、deco-confetti、StarTrack(CSS) | 首页 / 广场共用 |
| FloatingQuestionBubble | i-food / i-shell（奖励标注）、CountdownRing | 三选一、底板纯 CSS |
| PetGrid | pet-rabbit-s*、pet-locked | 一期仅兔拥有 |
| GachaReveal | gacha-box、card-back、glow 三色、dress-* | — |
| CropPlot | plot-empty/tilled + crop-{6}×{4 阶段} | 24 张作物 |
| SeedBagPanel | frame-ribbon、seed-*、i-lock | 价格 / 等级锁 / 持有数 |
| QuizHud | notebook、ring-gold、chest-progress、pet-rabbit-pose | 手写区 canvas |
| ResultPanel | mascot-bird 欢呼、banner-great、confetti、RewardBadge | "太棒啦"代码叠字 |
| Joystick | 底座 / 手柄（SVG 或 CSS） | — |
| Plaza 场景 | G3 GLB（主角一套、兔、3 座建筑、环境、chest）+ skybox + billboard + TEX | 实时 3D、无学盒建筑 |
| fx-evolution 进化仪式 | 光柱 / 彩带 / 星星（粒子 / CSS 或少量序列帧） | — |

---

## 2. AI 生图生产规范（摘要，完整见 design-system §10）

### 2.1 标准尺寸（逻辑基准 1024×768 / 4:3 安全框，位图 @2x）
| 规格 | 用途 | 比例 | 出图 | 背景 |
|---|---|---|---|---|
| PAGE | 整页高保真 | 4:3 | 2048×1536 | 满版 |
| STAND | 角色 / 宠物 core、3 阶段立绘 | 1:1 | 1024² | 透明 |
| POSE | 多姿态 / 表情套图 | 4:3 | 2048×1536 网格 | 透明 / 浅底 |
| ICON | UI 图标 | 1:1 | 512² | 透明 |
| ITEM | 作物 / 道具 / 装扮部件 | 1:1 | 512² | 透明 |
| BG | 天空 / 农场背景 | 4:3 | 2048×1536 | 满版 / 可平铺 |
| TEX | PBR / 地面纹理 | 1:1 | 1024/2048 | 无缝 tile |
| REF | GLB 建模输入（正 / 侧） | 1:1 | 1024² | 纯白底、中性光、A-pose |
| PANEL | 底板 / 横幅（仅 CSS 画不出时） | 按组件 | 9-slice | 透明 |

### 2.2 "直接可用"固化工序
1. 元素单独出图、不拼在场景里；2. 纯底生成 → rembg 抠透明底；3. 图标矢量化 SVG、复杂质感用 WebP(alpha,@2x)；4. 立绘 / 纸娃娃统一画布与锚点（脚底基线对齐、居中、留白一致）；5. 地面 / 草地无缝 tile；6. 命名 `类别-名称-状态-视角@倍率.格式`（如 `pet-rabbit-stage1-front@2x.webp`、`icon-shell.svg`、`crop-corn-stage3.webp`）；7. 每件登记 manifest（id / 中文名 / 用途 / 尺寸 / 格式 / 透明 / 生成方式 / 参考 core-ip / prompt 全文 / 消费组件·页面 / 切片状态）。

### 2.3 brand-ip 门禁
中性主角、白雏鸟、雪球兔各先 1 张文生图定 core-ip 并确认；之后所有衍生（阶段 / 姿态 / 表情 / 各页出现）一律 image_edit 带同一 core-ip，**禁止每张独立文生图**。整页高保真走文生图时角色位置留占位、用定稿立绘填，不让 AI 在页面里画角色。主角 / 装扮 prompt 强制中性、主题化、无强性别符号。
