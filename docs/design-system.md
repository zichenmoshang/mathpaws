# mathpaws 设计系统（Design System）

> 版本：一期定稿　|　最后更新：2026-09-28
> 本文档是**视觉 / 质感 / 配色 / 字体 / 组件规范**的唯一事实来源；产品逻辑 / 数值以 [./PRD.md](./PRD.md) 为准，页面资产跟踪见 [./design/asset-checklist.md](./design/asset-checklist.md)，3D 台账见 [./design/asset-manifest.md](./design/asset-manifest.md)。
> Token 的**代码权威**是 `packages/ui/src/tokens.ts`（`@mathpaws/ui`），本文档与之一致；新增 / 修改 token 先改代码、本文档同步。

---

## 1. 总体风格：两套视觉语言、一个世界观

mathpaws 是面向 8–9 岁孩子的平板横屏游戏，整体为 **Q 版糖果卡通风**（参考洪恩、斑马、Khan Kids），但按渲染方式分两套、必须质感统一：

| | A. 实时 3D（仅广场） | B. 2D 页面（除广场外全部） |
|---|---|---|
| 质感关键词 | **搪胶软糖 / vinyl toy**：圆润饱满、哑光软表面、柔和环境光、软接触阴影、表面细微绒面 | **平面糖果卡通**：厚圆角、描边、糖果立体底边、柔和投影、明快平涂 |
| 实现 | Three.js PBR（roughness 偏高、metalness≈0、软阴影、程序化 IBL、克制 Bloom） | 位图（AI 生图 / 切图）+ CSS + `@mathpaws/ui` 组件 |
| 色板 | 共用同一套品牌色（见 §3） | 共用同一套品牌色 |
| 质感锚（靶子） | 现有 `design/high-fi/plaza/plaza.png` 的质感（**不重出**，只做 Look Dev 对齐 + 返工） | 各页对应高保真 |

**核心原则：2D 页面要"看起来像同一世界观的 3D 玩具"，但不嵌实时 3D。** 通过角色 / 宠物 2D 立绘（core-ip 位图，带柔和投影、轻微高光、厚描边）+ 糖果 UI 容器实现"伪 3D"。

---

## 2. 设计原则

1. **孩子一眼会用**：大按钮、大字号、大点击区（平板手指），主操作唯一且在右下 / 底部。
2. **正向反馈优先**：答对 / 收获 / 进化用欢呼、星星、彩带、弹跳；答错轻量、不批评、不展示答案。
3. **手写区永远不被按钮 / 面板遮挡**（答题页硬约束）。
4. **安全区**：关键内容落在 4:3 安全框内（见 §8），顶部 40px、底部 30px 不放关键操作。
5. **返回统一**：所有二级页左上固定返回组件。
6. **少即是多**：装饰服务于信息层级，拒绝满屏同质化半透明底框 / 贴纸堆砌。
7. **中性、无性别符号**：主角与装扮中性百搭（见 PRD §9.2）。

---

## 3. 色彩系统

> 代码见 `tokens.ts` 的 `C`。主色板保持高饱和但不刺眼，大面积背景用浅色 / 天空色，强调色集中在按钮与焦点。

### 3.1 品牌主色
| Token | 色值 | 用途 |
|---|---|---|
| sky / skyDeep | `#4FC3F7` / `#1565C0` | 主品牌蓝、天空、口算、主按钮之一 |
| sun / sunDeep | `#FFD54F` / `#F57F17` | 阳光黄、主 CTA、星星、宝箱 |
| orange / orangeDeep | `#FF8F00` / `#EF6C00` | 真题大挑战、强调、农场 |
| grass / grassDeep | `#66BB6A` / `#43A047` | 草地、益智乐园入口、成功、农场 |
| red / redDeep | `#EF5350` / `#E53935` | 错误、关闭、倒计时警示（少量） |
| pink / pinkDeep | `#F48FB1` / `#D81B60` | 宠物 / 许愿池氛围 |
| purple / purpleDeep | `#B39DDB` / `#7E57C2` | 学盒 / 抽卡、稀有品质、幻想 |
| white | `#FFFFFF` | 卡片 / 内容底 |
| ink / inkSoft | `#263238` / `#78909C` | 正文 / 辅助文字 |
| skyBg / ground | `#bfe3f5` / `#9ccc8a` | 3D 天空底色 / 草地 |

### 3.2 学科 / 模块色（`SUBJECT`）
- 口算 oral = 蓝（sky）；真题 real = 橙（orange）。
- 奥数 olympiad = 紫（purple）**仅 token 预留、二期启用**；一期 UI 不出现奥数入口。

### 3.3 品质色（抽卡 / 装扮）
普通 = 蓝（skyDeep 边框）、稀有 = 紫（purpleDeep）、传说 = 金（sunDeep + 光晕）。

### 3.4 货币色
贝壳 = 暖黄 / 奶白（sun 系）；花朵币 = 粉橙（pink/orange）；宠物食物 = 橙棕（宠物食品色）。一期**无水滴、无体力**，UI 不出现这两个资源。

### 3.5 农场色
泥土棕、嫩绿苗、作物本色 + grass / orange 主色，沿用品牌色板，不另起体系。

---

## 4. 字体系统

### 4.1 字体栈（`FONT.family`）
```
"Baloo 2", "Comic Sans MS", "Microsoft YaHei", system-ui, sans-serif
```
- **英文 / 数字：Baloo 2**（圆润、SIL OFL 可商用、已在用）。
- **中文：当前回退微软雅黑；正式需选定一款可商用中文圆体**（候选：站酷快乐体、阿里巴巴普惠体、得意黑 / 寒蝉系列等，**M0 必须联网核对授权条款 + 取得授权凭证**，见 issues）。
- 标题用圆体 / 快乐体的"胖圆"气质 + `strokeText()` 描边；正文保证清晰可读。

### 4.2 字号（`FONT`，逻辑基准 1024×768，单位 px）
title 30（页标题）/ h2 22 / body 18 / aux 14 / question 64（答题题干 / 手写区数字）。
- 平板上整体可按安全框等比缩放；题干与手写数字是全应用最大字。

### 4.3 字体子集化与数字兜底
- 中文字体文件大，正式上线用 **fontmin / glyph 子集化**（只打包用到的汉字 + 常用字 + 0-9 + 标点），按页面或全量分包，woff2 托管、`font-display: swap`。
- **数字风格兜底**：若圆体中文的数字与整体画风不统一，优先做一款**定制数字字体（0–9 字形，随 Web 字体一起加载）**。
  - **运行时会变化的数字**（贝壳 / 花朵币 / 食物、价格、倒计时、分数、连学天数、题目与手写回显数字等）一律用 **Web 字体渲染**，不做多位拼接位图，避免任何数值都要切图。
  - **0–9 位图切图只留给固定装饰大字**（logo、启动页、活动标题等不变的艺术字）。
  - 数字仅用于显示层，不影响手写识别。

---

## 5. 形状、描边、立体感

- 圆角（`R`）：sm 10 / md 16 / lg 22 / pill 999（胶囊）。卡片大圆角、按钮 pill 或大圆角。
- 间距（`SPACE`）：xs4 / sm8 / md12 / lg16 / xl24。
- **糖果立体底边**：`edge(deep, 5px)` = 元素底部一条深色 `box-shadow` 制造厚度，按下时下沉 / 消失（`.mp-btn` 按压反馈）。主按钮统一用它，不用重投影。
- **描边标题**：`strokeText(fill, stroke, 2px)` 多层 text-shadow，页标题 / 大数字用。
- 投影（`SHADOW`）：card `0 6px 16px rgba(21,101,192,.16)`、panel `0 10px 30px rgba(0,0,0,.20)`。
- 2D 角色 / 宠物立绘：脚下椭圆软接触阴影 + 表面轻微高光 + 干净厚描边，贴合 3D 玩具感。

---

## 6. Token 分层：A（3D 材质）/ B（2D UI）

### 6.1 B 类：2D UI token（已落地 `packages/ui/src/tokens.ts`）
色板 `C`、学科 `SUBJECT`、字体 `FONT`、圆角 `R`、间距 `SPACE`、`edge()`、`SHADOW`、`strokeText()`、按钮 `VARIANT`（sun/sky/grass/red/purple/pink/ghost）。

### 6.2 A 类：3D 材质 / 渲染 token（广场 Look Dev 固化，落在 `three/ClayMaterial.tsx` + `SceneRig.tsx` + `Effects.tsx`）
- **Clay / vinyl PBR**：**roughness 约 0.4–0.6 起调（润的搪胶 / vinyl，非哑光陶土；现状 ClayMaterial 的 0.88 偏哑、需下调）**、metalness ≈ 0、clearcoat 轻微（搪胶釉感，可选）、SSS 感用暖色次表面近似 / fresnel 边缘柔光；最终值在 Look Dev 以 plaza.png 校准固化。
- 毛绒角色：albedo 烘焙短绒 + normal 细微绒面 + **fresnel sheen 边缘柔光**模拟绒感（不做真 fur，Pad 性能 / 绑骨不允许）。
- 光照：暖色主方向光（软阴影 2048）+ 半球补光 + 程序化 IBL（drei Lightformer，无需 HDRI 文件）。
- 后处理（完整链见 [plaza-3d.md](./design/plaza-3d.md) §7，按设备分级、低端自动降 / 关）：**ACES Filmic 色调映射**、**SSAO 环境光遮蔽（接触阴影 / 缝隙立体感）**、克制 Bloom（仅宝箱 / 奖励发光）、**轻 DOF 景深（道具 / 远景，低端可关）**、SMAA 抗锯齿、轻微 Vignette、糖果色色彩分级 LUT；曝光 1.0，避免过曝发白。
- 色板与 B 类共用（天空 skyBg、草地 ground、建筑用品牌色）。
- **Look Dev 流程**：先在 `#lookdev` 小样把材质 / 光照 / 后处理调到与 plaza.png 质感一致并**固化为预设**，再批量做资产；后续每个 GLB / 2D 立绘都回流到该预设下对比验收。

---

## 7. 组件两层结构

### 7.1 通用组件层 —— `packages/ui`（`@mathpaws/ui`）
与业务 / store / 路由 / 图片解耦、全内联样式、可跨应用复用。
- **已有 10 个**：`Btn`（糖果立体按钮）、`RoundBtn`（圆形功能键）、`Chip`（资源胶囊）、`TopBar`、`BackBtn`、`Card`、`Sheet`（底部弹层）、`Modal`（居中弹窗）、`ProgressBar`、`Title`（描边标题）。
- **一期待补**：`Switch`、`Tabs·Segmented`（**不做 TabBar**）、`CloudInput`（起名 / 云朵输入框）、`ConfirmDialog`（答题返回二次确认等）、`OptionButton`（真题 ABC / 浮题三选一）、`ItemGrid·ItemCell`（宠物图鉴 / 装扮 / 种子 / 错题网格）、`RewardBadge·RewardRow`（贝壳 / 花朵币 / 食物图标 + 数量）、`Tag·LockTag`（锁 / 即将开放）、`Toast·Tip`、`EmptyState`、`StarTrack`（宠物进化轨道 / 连学）、`CountdownRing`（浮题 5 秒环）、`Carousel`（**手动滑动、不自动轮播**，首页 3 卡）、`ResourcePill`、`LoadingBar·LoadingOverlay·SceneTransition`（P0 加载过渡）、`Icon`（SVG 图标体系）。

### 7.2 业务组件层 —— `apps/web/src/components`（或 scenes 内）
强业务耦合、可在 app 内多页复用：
- 3D / 广场：`Joystick`（摇杆）、`DragLook`（右手自由视角）、`FloatingQuestionBubble`、`EnterPrompt`（拾取 / 进入）、`NewUserGuide`（B 轻引导）、`TopNavEntries`（顶部学盒 / 背包 / 宠物）、`PetBubble`（点宠物悬浮气泡）。
- 答题：`HandwritingCanvas`（MNIST 手写）、`QuizHud`、`ResultPanel`、`PlacementTest`（开学小测）。
- 养成 / 经营：`PaperDoll`（中性 2D 换装）、`EvolutionTrack`、`PetGrid`、`ChestPanel`（首页 / 广场共用打卡）、`GachaReveal`、`DressUpPanel`、`CropPlot`、`SeedBagPanel`、`WarehousePanel`。

> 组件 ↔ 位图资产的映射、每页用到哪些组件，见 [asset-checklist.md](./design/asset-checklist.md)。

---

## 8. 适配与安全框（平板横屏）

### 8.1 目标真机
华为 MatePad 11.5"，**TGR-W10 / HarmonyOS 4.2.0 / 8GB RAM / 2800×1840（≈1.52:1，近 3:2）**，集成 GPU（Mali 级），华为浏览器 Chromium 内核；DPR 实测≈2，**渲染 DPR 钳制 ≤2**；横屏 CSS 视口约 1400×920。

### 8.2 逻辑基准与适配策略
- **逻辑设计基准 = 1024×768（4:3）**。
- 适配 = **4:3 安全框 + 背景横向 bleed 铺满**：
  - 所有关键 UI / 文字 / 按钮放进居中的 4:3 安全框（目标机上下留少量边、左右用背景填满）；
  - 背景图 / 天空 / 草地按 `cover` 横向 bleed 铺满更宽的 3:2 屏，**不黑边、不裁切关键内容**；
  - 安全框内用弹性布局（flex / 百分比 / clamp 字号），不写死绝对像素。
- **统一 scale 适配层**：以 1024×768 为逻辑画布做整体 `contain` 等比缩放（内容层始终完整、不变形），**背景层单独按 `cover` 铺满**更宽的 3:2 屏；内容与背景分两层，避免整屏拉伸。
- 布局避让平板**系统手势条 / 屏幕圆角 / 摄像头挖孔**（安全区 env(safe-area-inset-*)），关键按钮不贴边。
- **不做手机响应式**；竖屏给"请横屏使用"遮罩；更小屏横屏可打开但提示"建议在平板上获得最佳体验"。
- 3D 广场相机按宽高比自适应，HUD 走安全框。

### 8.3 性能与渲染
- 3D：DPR ≤2、场景总 tris 目标 <300k、GLB Draco / Meshopt 压缩（预算见 asset-manifest）。
- tfjs 手写识别走 **WASM 后端**（CPU），不与 three.js 争抢 WebGL（见 architecture）。

---

## 9. 2D 页面"伪 3D"贴合手法

- 角色 / 宠物用 **core-ip 2D 立绘位图**（透明底 PNG / WebP），脚下软阴影、轻微 idle 呼吸 / 摇摆动画（CSS / Lottie），不嵌实时 3D、不依赖 GLB 离线渲染。
- 容器用糖果厚圆角 + `edge()` 立体底边 + 柔和投影；标题用 `strokeText()`。
- 场景类 2D 页（农场）用俯视插画背景 + 独立可动元素（地块 / 作物 / 按钮分层 PNG），做出层次与纵深感。
- 转场用 `SceneTransition`（轻缩放 / 淡入），保持"进入玩具世界"的连贯。

---

## 10. AI 生图与资产生产规范（概要）

> 完整尺寸 / 工序 / 命名见 [asset-checklist.md](./design/asset-checklist.md)（§2）；生图走 `doubao-creative-design`，3D 建模走 Hunyuan3D（见 [asset-manifest](./design/asset-manifest.md)）。

1. **先定 core-ip 再衍生（brand-ip 门禁）**：中性主角、白雏鸟、雪球兔各先生成 1 张**核心形象 core-ip** 并确认；之后所有衍生（立绘、表情、装扮、场景）一律基于同一 core-ip 做图生图（image_edit），**禁止每张独立文生图导致"多张脸"**。
2. **画风统一**：圆润搪胶 / 软糖、哑光、马卡龙品牌色、厚描边、软阴影；中性、无强性别符号。
3. **预设尺寸 / 比例**：页面背景按横屏（4:3 安全框 + bleed，建议出图 ≥2048×1536）；角色 / 宠物立绘用 **1:1 透明底（STAND 1024²）**，多姿态 / 表情套图用 **4:3（POSE 2048×1536）**；图标 1:1；组件状态图按需（无 3:4 竖规格，详见 asset-checklist §2）。生图前先定尺寸与安全区。
4. **元素可直接使用**：角色 / 宠物立绘可直接当位图贴图 / `<img>`；图标用 SVG；装饰元素透明底 PNG，可直接进 CSS。
5. **文字不进图**：AI 不负责渲染中文正文 / 数字（易乱码），文字一律前端用 **Web 字体渲染**（仅 logo / 启动页 / 活动标题等固定装饰大字可用切图，运行时变化数字不切图，见 §4.3）；图内只保留 logo 等极少数固定字。
6. **命名与目录**：按 asset-checklist 的资产 ID 命名（如 `char-hero`、`pet-rabbit-s3`、`icon-gacha`），位图入 `apps/web/src/assets/img/`，3D 入 `src/assets/models/`。
7. **定稿即固化**：高保真不是 Figma、没有图层；每页高保真确认后立即按元素切图 / 出图并登记台账，避免后续混乱。

---

## 11. 图标 / 动效 / 音频

- **图标统一 SVG**（可着色、可缩放、体积小），建 `Icon` 组件 + 图标表；学盒 / 背包 / 宠物 / 贝壳 / 花朵币 / 食物 / 返回 / 设置等为一期必备。
- 动效：CSS / Lottie（idle 呼吸、按钮按压、奖励弹跳、进化、抽卡揭示、加载）；3D 内动画走 GLB skeletal（idle / walk）。
- 音频：BGM / 音效**用 AI 生成**（工具需可商用、M0 选型，见 issues）；首次点击屏幕后解锁音频、默认开、可在设置关。

---

## 12. 验收标准（逐页 1:1 对齐）

每个 2D 页面 / 面板按以下顺序验收，不达标不进入下一页：
1. 布局 / 信息层级 / 元素位置与高保真一致（安全框内）；
2. 色板、字体、圆角、描边、立体底边、投影取自 token，无游离硬编码；
3. 角色 / 宠物为同一 core-ip 衍生、无"多张脸"；
4. 组件取自 `@mathpaws/ui` / 业务组件层，无重复造轮子；
5. MatePad TGR-W10 横屏实机无黑边、关键内容不裁切、触控区足够；
6. 交互态（按压 / 禁用 / 加载 / 空 / 锁）齐全。

3D 广场的质感验收以 Look Dev 预设 + plaza.png 为靶子（见 plaza-3d.md）。
