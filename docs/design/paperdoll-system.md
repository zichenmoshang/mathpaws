# 纸娃娃 2D 换装系统规范与生产 SOP（PaperDoll · 整身 + 帽 / 鞋）

> **⚠️ 2026-10-04 起系统已升级到 v5（N+M 运行时合成），本文 §1–§13 仍为 v4 历史记录**，保留切层算法细节与踩坑档案；当前事实以以下两份为准：
> - **新角色 / 新头饰生图契约（新增素材先读）**：[character-generation-spec.md](./character-generation-spec.md)
> - v5 资产结构：`design/paperdoll-assets/manifest.json`（schema `paperdoll-manifest-v5-runtime`）、`anchors.json`（`anchors-v5-runtime`）；运行时实现：`packages/ui/src/paperdoll-compose.ts`；回归页：`#paperdoll-rt`。
>
> v5 关键变更速览：① 抠图默认模型 u2net → **birefnet-general-lite**；② 生产资产从 46 份 N×M 烘焙层瘦身到 **14 份**（6 bodies + 3 heads + 2 hats + 2 masks + 1 shoe），forhat/per-body 变体只保留在 `_truth/` 供回归；③ 运行时完成 item 帽挖洞、整头颈缝合成、wizard 动态 hair gate + 颈色 relit；④ **wizard 帽已修复鼓包并重新上架**；⑤ 新角色只需 1 张光脚 body 母图。

> 版本：v4（整身为主 + 帽 / 鞋弱耦合，3 槽；帽区改为颜色驱动分割）　|　最后更新：2026-09-30（v5 指针 2026-10-04）
> 本文档是**人物 2D 换装（纸娃娃）分层、资产生产、抠图、切层、锚点、遮罩、导出、命名与验收**的事实来源之一，包含一套已跑通、可复现、可批量的端到端 SOP。
> 视觉 / 色板 / 字体以 [../design-system.md](../design-system.md) 为准；图片 prompt 门禁见 [`../../design/asset-prompts/`](../../design/asset-prompts/)。
> v4 已通过离线 step1–4 + 运行时 `#paperdoll` 多尺寸验收。v2 的「素体 + 上衣 / 下装 / 饰品 4 槽」方案因 1px 缝隙与望远镜 × 普通衣的怪异混搭被取代（见 §13）。

---

## 1. 范围与基本结论

- **一期换装只在 2D**：学盒（P10）抽卡揭示、背包 / 换装（P16）纸娃娃穿戴、首页（P4）左列立绘同步穿戴。
- **广场 3D 主角一期固定显示默认着装**，不做实时换装；3D 实时换装列入二期（见 §12）。
- 主角**唯一、中性、不捏脸**：脸、肤色、发型一期固定。
- **核心架构（v4）**：OUTFIT 是**一整张全身图**，只有 HAT / SHOE 两个弱耦合独立槽。运行时最多叠 3 层，z-order：`outfit → shoe → hat`。
- 为什么放弃"上衣 / 下装自由分层"：① 硬切层各自缩放，帽 / 脸、脸 / 身之间出现 1px 缝；② 胸挂件（望远镜）与特定上衣强耦合，跨件混搭必然怪异。整身图从根本上消除内部接缝，只在帽 / 鞋两处边缘小范围耦合。业界（Spine `skins`：成套组合 + 少量独立附件）也是此口径。
- **生产方式**：AI 只负责"画"（整身套装图、补画被遮挡像素）；抠图 / 切层 / 对齐 / 导出全部走**确定性脚本**（rembg + HSV 颜色分割 / 已验证固定切常量 + Pillow/scipy），不用扩散模型做抠图（见 §9）。
- **v4 相对 v3 的关键变化**：帽区不再靠手绘椭圆遮罩 R 硬切（框不准 → 缺口 / 光环 / 切耳），改为**从戴帽源图自身提取帽区**（颜色分割或整头替换，见 §7.1），帽层与 forhat 洞同形构造，内部缺口恒为 0。

## 2. 槽位与一期收敛

三个槽位：

| 槽位 | id | 一期内容 | 约束 |
|---|---|---|---|
| 套装 | `outfit` | 一整套：上衣 + 下装 + 四肢，整身一张图（一期 6 套） | 含 `nohat`，每顶在架头饰一个 `forhat` 版本 |
| 头饰 | `hat` | 一期在架 4 顶：探险家帽 / 科学家护目镜 / 青蛙帽 / 精灵帽；可跨套装搭配 | **只换帽，不换发型**；wizard 巫师帽暂下线；换发型二期 |
| 鞋 | `shoe` | 默认暖白软底鞋；可光脚 | 新鞋必须贴现有脚型、脚底基线不变，不做高靴 |

固定不变（不参与抽取）：**脸 / 五官 / 肤色 / 体型 / 发型**（可可棕对称蓬松短发 + 呆毛，来自 core-ip）。

- 无 `gender` 字段、无强性别符号；主题走职业 · 动物 · 幻想 · 节日的中性系列。
- 品质（普通蓝 / 稀有紫 / 传说金）只体现在 UI 边框与光效，**不画进服装贴图**。
- **已移除**：`acc`（胸挂望远镜等，强耦合）；`top` / `bottom`（并入 `outfit`）。

## 3. 图层结构与叠加顺序（z-order，后→前）

| 层 | 文件 | 内容 | 来源 |
|---|---|---|---|
| L1 套装 | `outfits/outfit-<id>-nohat@2x.webp` | 完整整身（不戴帽时用） | 光脚母图 rembg |
| L1′ 套装 | `outfits/outfit-<id>-forhat-<hat>@2x.webp` | 同整身，按该帽的洞 mask 挖空（戴帽时用，每帽一份） | nohat 版 cut_hole |
| L2 鞋 | `shoes/shoe-<id>@2x.webp` | 鞋 + 8px 包踝带；鞋头向裸脚贴合 | core-ip 原图 rembg + 水平切 |
| L3 帽（通用） | `hats/hat-<hat>@2x.webp` | 帽 + 源图自带发际（color/ellipse/head 通用帽） | 戴帽源图 rembg + 对应 cut_mode |
| L3′ 帽（配对） | `hats/hat-wizard-on-<outfit>@2x.webp` | wizard 帽的每套装变体（颈肤按套装重亮） | 配对 cut，见 §7.1 |

- 不戴帽：`outfit-nohat`（可叠加 `shoe`）。
- 戴帽：`outfit-forhat-<hat>` + 对应帽层（帽层覆盖洞），可叠加 `shoe`。
- 每套整身都必须产出 `nohat`；`forhat` 按**在架头饰**逐顶产出——即使该套装主题本身含帽（如探险家），也要有"摘帽版"整身作为 `nohat`（见 §6）。

## 4. 标准姿势、画布、坐标与锚点

- **标准姿势 = core-ip 正面 A-pose**：双臂自然下垂、向两侧微张约 15°，双脚与肩同宽、脚掌朝前，正面平视、左右对称。所有整身图严格沿用，不得改动手臂 / 腿的姿态。
- **AI 出图 2048×2048（1:1，白底）**，角色居中；脚底基线 ground_y≈1888，中线 cx=1024。所有母图同机位、同占比。
- **切层全部在 2048 原图坐标进行，不缩放**；导出全画布 2048² 透明 WebP（@2x）。
- **锚点单一事实源 = `design/paperdoll-assets/anchors.json`**（v4 版本 `anchors-v4-color-splice`），由 `step4_export.py` 从 `step2_layers.py` 常量导出，不手抄、不另维护第二份。v4 anchors 含三部分：**帽拼接参数**（颜色分割 HSV 带、整头切常量、cut_modes、配对门控）、**种子引导框 ellipses**（仅作 color 模式种子/边界，不再是切割形状）与**鞋水平切参数**（旧的 head_box / torso / arm 遮罩已随整身方案删除）。
- 光照 / 质感与 core-ip 一致：左右对称、轻顶光的柔和影棚光，搪胶 vinyl 哑光润泽，白底生成后统一抠透明。

## 5. 目录、脚本与 Python 环境

### 5.1 目录

- 工作区 `design/paperdoll-spike/`：
  - `masters/`：**输入**，AI 白底母图（2048²，勿手改）；
  - `cutouts/`：step1 rembg 抠图 `*-rmbg.png`（可重生成）；
  - `layers/outfits|hats|shoes/`：step2 切出的全画布透明 PNG（可重生成）；
  - `_tmp/qc/`、`_tmp/grid/`：**可整体删除**的临时质检图与坐标网格；
  - 根目录为生产脚本。
- **冻结产出 `design/paperdoll-assets/`**：`anchors.json`、`manifest.json`、`layers/{outfits,hats,shoes}/*.webp`、`icons/*.webp`。
- 母图 prompt 存档：`design/asset-prompts/`（门禁见 §10）。
- **正式接入**：`paperdoll-assets/` 的 layers/icons/manifest/anchors 复制进 `apps/web/src/assets/paperdoll/`，由 `PaperDoll` 组件消费。改资产后重跑 step4 再重新复制。

### 5.2 Python 环境

| 环境 | 解释器 | 用途 |
|---|---|---|
| `.venv-art`（Python 3.12） | `design\.venv-art\Scripts\python.exe` | **step1 / step2 / step3 / step4**：凡经 `import step2_layers` 的脚本都间接依赖 rembg（rembg 2.0.x + **单独安装** onnxruntime） |
| 全局 `python`（3.14） | 系统 Python | 仅 **step5**（纯 Pillow 回读，不 import step2）；3.14 无 onnxruntime wheel，勿装 |

- step2 仅在需要时联网：explorer 帽源与首次切鞋走 CDN（本地缺 cutout 时）；scientist/frog/elf/wizard 帽源均为本地 master 对应的 cutout，已切出的鞋层自动复用。须在能联网的 `.venv-art` 环境运行（至少留好 CDN 兜底）。
- **u2net 模型**：首次自动下载易撞 GitHub SSL。用 `download_model.py`（镜像兜底）手动下载到 `%USERPROFILE%\.rembg\models\u2net\u2net.onnx`（约 176MB；rembg 2.0.x 路径是 `.rembg\models\u2net\`）。

### 5.3 脚本清单（按执行顺序，均在 paperdoll-spike/）

| 脚本 | 作用 |
|---|---|
| `download_model.py` | 镜像下载 u2net.onnx，一次性 |
| `step1.py` | rembg 抠图 + 坐标网格：**自动发现** `masters/` 全部白底 PNG，写 `cutouts/*-rmbg.png`、`_tmp/grid/*-grid.png`、`_tmp/qc/contact-rmbg.png` |
| `step2_layers.py` | **核心**：先从戴帽源图按各帽 `cut_mode`（color/ellipse/head，wizard 配对）切帽层；再从光脚 cutout 产出整身 nohat 与每帽 forhat（洞与帽层同形）；鞋层水平切 + 向裸脚贴合（已产出则复用）；写 `layers/{outfits,hats,shoes}/*.png` 与 `_tmp/qc/contact-compose.png`；HSV 带 / 切常量在此文件 |
| `step3_zoomqc.py` | 接缝放大质检：鞋踝 + 每帽帽发（含配对帽），写 `_tmp/qc/zoom-qc.png` |
| `step4_export.py` | 从 step2 常量导出 `anchors.json`、全画布 WebP@2x、512 图标、`manifest.json` 到 `../paperdoll-assets/` |
| `step5_verify_export.py` | **用导出的 WebP 异路径回读**重新合成 + 图标拼图，写 `_tmp/qc/export-verify.png` |

## 6. 端到端生产 SOP（每套照此执行）

> 门禁：任何 AI 生图前，prompt 必须先在 `design/asset-prompts/` 存档并经用户确认（draft→approved），见 §10。

1. **整身·光脚母图（每套装 1–2 张）**：image_edit 带 core-ip，生成与 core-ip 同姿势 / 同脸 / 同机位的**光脚整身图**（去掉鞋、补全双脚）。
   - 默认套装：`dress-default-barefoot`；
   - **含帽套装（如探险家）需生成"摘帽版"** `dress-job-explorer-barefoot-nohat`——一次 image_edit 同时完成：摘帽补全帽下头发 + 光脚补脚 + 眼部锚定 core-ip（无睫毛圆眼）。这张是真正的 `nohat` 整身。
   - 眼部 / 脸部易在单参考编辑时漂移（探险家曾被改成带睫毛眼型）；含帽或易漂移场景用**双参考**：编辑对象 [img0] + core-ip [img1]，prompt 明确"无睫毛圆眼、严格锚定 [img1]"。
2. **抠图 + 网格**：`.venv-art` 跑 `step1.py`（自动发现 masters 全部母图），得透明 `cutouts/*-rmbg.png`。
3. **切层**：`.venv-art` 跑 `step2_layers.py`：
   - 整身 nohat 直接来自光脚 cutout；每帽 forhat = cut_hole(该帽洞 mask)；
   - 帽层从戴帽源图按其 `cut_mode` 切（颜色分割 / 椭圆 / 整头，见 §7.1）；鞋层水平切并向裸脚贴合（见 §7.2，已产出自动复用）。
4. **放大质检**：`step3_zoomqc.py` 查帽发 / 鞋踝 / 帽跨套。
5. **混搭对照**：`step2` 自动出多组合 `contact-compose.png`，逐组人工核对。
6. **导出**：`step4_export.py` 冻结 anchors、输出 WebP@2x + 512 图标 + manifest。
7. **异路径回读**：`step5_verify_export.py` 用导出 WebP 重新合成验证。
8. **迁入 / 登记**：复制进 `apps/web/src/assets/paperdoll/`，回填 manifest 与 asset-prompts 状态。

## 7. 两个弱耦合区的遮罩解法（踩坑后定稿）

### 7.1 帽与发型：三种 cut_mode（从戴帽源图自身取帽区）

> 共同原则：椭圆框降级为**种子引导区**（不再是切割形状）；帽层与 forhat 洞**同形构造、源 alpha 门控**，因此「洞挖了但帽层没像素」的内部缺口恒为 0。各帽在 `HATS` 注册表选模式：

| cut_mode | 适用 | 帽层 / 洞构造 |
|---|---|---|
| `color`（默认） | scientist | ① HSV 排除皮肤+头发（标定带见下），其余为帽像素；② 从椭圆内部侵蚀 24px 的种子出发，只沿强 alpha（>120）帽像素**区域生长**（rembg 软光晕无法桥接杂点），受 R 外扩 140px 硬边界约束；③ 闭运算 + 填洞 + alpha 门控 12px 包边（可压源自身头发，棕替棕）。洞 = 帽形侵蚀 4px + 羽化 |
| `ellipse` | explorer | 卡其帽冠（H30/S0.26/V0.85）与皮肤 HSV 几乎不可分，颜色法不适用；保留**已验证紧椭圆 R**，洞 = R ∩ 源 alpha（自动修掉椭圆比真帽缘多出的 1–3px 细条） |
| `head` | frog / elf | 源图接管**整个头部**：切点（颈部最窄处的已验证常量，frog 920 / elf 985）以上整行替换（任何帽形外头发鼓包无法存活）；切点前 40px **过渡带只沿源 alpha 列**切（身体宽衣领两侧保留）；源颈肤下延 12px overlap 包接缝；垂直方向 1D 羽化（2D 羽化会溢入源图封闭空气口袋） |
| `head` + 配对 | wizard（已下线） | 在 head 基础上**每套装切一份帽层**：源皮肤不直接用（源颈处在长袍衣领阴影里偏暗），按 `0.28×源 + 0.72×身体自身亮颈肤色`重亮；源头发只在身体皮肤/头发区通过，不覆盖衣服/空气。6 个 `hat-wizard-on-<outfit>` 变体仍在导出目录，应用侧 `catalog.ts` 暂时不挂选项 |

- HSV 排除带（针对当前素材采样标定）：皮肤 `H 3–32, S 0.18–0.48, V≥0.62`；头发 `H 4–45, S≥0.32, V≤0.72`；新增帽色若落入这些带，需要单独选模式或收紧带子。
- 戴帽组合**必须**用对应 forhat；不戴帽用 nohat。

### 7.2 鞋：水平切 + 鞋头向裸脚贴合

- 整身是光脚，鞋来自独立穿鞋原图。**单一水平切**（`SHOE_CUT=1780`），鞋层保留原生 alpha，自 `cut − SHOE_OVERLAP(8)` 起，使鞋领包住脚踝。
- **鞋 / 脚轮廓贴合**：分别生成的裸脚在鞋底外侧可能比鞋宽几像素（v3 验收时实测到两点裸脚边）。`fit_shoe_to_foot` 只在鞋头下部（y≥`SHOE_FIT_YMIN=1830`）逐行向两侧外扩至多 `SHOE_FIT_RADIUS=14`，**且仅当该像素被裸脚占据**时用最近鞋边色填充，遇到空像素即停——盖住裸脚边，又不会在空气中产生白边。

## 8. 导出规格与验收

### 8.1 规格

- 图层：与母图同尺寸 / 同原点的 **2048² 全画布透明 WebP（lossless alpha，@2x）**，同原点叠加，无需逐件定位。
- 图标：每件 **512² 透明 WebP**，由该层 alpha bbox 等比 fit（pad 64）居中。
  - 整身图标 = 全身；帽图标含帽 + 下压发际（呈现"戴上后样子"）；鞋图标含 8px 包踝肤色。若后续需要"纯净单帽 / 单鞋"图标，再单独收紧裁框或生成。

### 8.2 离线组合验收（矩阵，每次切层全过）

1. **6 套装 nohat + 光脚** 各一张；
2. **在架 4 头饰（explorer/scientist/frog/elf）× 6 套装全部组合**：无缺块 / 重影 / 白边 / 光环，颈部接缝自然，帽与眼睛对齐；
3. **摘帽切换**：含帽套装（explorer）nohat 头顶无帽痕、发型饱满；
4. **+ 鞋** 各组合鞋踝正常。

通过标准：脸一致、锚点重合、合成无损、透明干净、质感统一；`step3` 放大图与 `step5` WebP 回读图都要看。wizard 帽不参与（已下线），其管线产物单独留档。

### 8.3 运行时：PaperDoll 组件与 `#paperdoll` LookDev

- **`packages/ui/src/paperdoll.tsx`**（导出 `PaperDoll` / `PaperDollLayers` / `PaperDollBackground`）：
  - **离屏 canvas 先合成再整体缩放**：先在固定 2048 离屏画布按 `outfit → shoe → hat` drawImage 成单图，再把这张合成图一次性高质量缩放到显示画布。各层只在原生分辨率叠加、边界吻合，整体只经历一次缩放——根除"每层独立缩小 → 边界采样 → 1px 缝"。
  - 纯展示，只吃解析好的图层 URL；传 `hat` 即自动改用 `outfitForHat`，传 `shoe` 即穿鞋。
  - **ResizeObserver**：容器尺寸变化时 rAF 节流重绘并更新 backing（canvas.width = clientWidth × DPR，DPR 封顶 3），拖拽窗口清晰度实时跟随，无需换装 / 刷新。
  - `background: 'transparent' | 'checker' | 'white' | 'sky'`；图片加载失败显示错误提示，不静默白屏。
- **资产目录 `apps/web/src/assets/paperdoll/`**：`layers/{outfits,hats,shoes}`、`icons/`、`anchors.json`、`manifest.json`。
- **映射 `apps/web/src/paperdoll/catalog.ts`**：`OUTFIT_OPTIONS`（6 套）/ `HAT_OPTIONS`（在架 4 头饰 + 无）/ `SHOE_OPTIONS`、`DEFAULT_SELECTION`（默认套装、光脚、不戴帽）、`buildLayers(sel)`（帽层按当前套装解析，支持单图层或 layer 变体表）、`randomSelection()`、`optionLabel()`。wizard 帽选项在文件中注释保留，恢复时加回即可。
- **常驻场景 `apps/web/src/scenes/PaperDollLookDev.tsx`**，hash 直达 `#paperdoll`（React.lazy 独立 chunk）。

**运行时验收（每套在 `#paperdoll` 逐组合点一遍）**：

1. 图层在各 DPR 下清晰，canvas backing 随尺寸变化（验收实测 backing 330 / 461 / 878 对应不同视口）；
2. WebP 透明 / 色彩正确，棋盘格与白底均无白边、光晕；
3. 戴帽 / 摘帽切换：戴帽无蓬发鼓出、摘帽发型与呆毛完整、无帽痕；
4. 穿鞋 / 光脚切换：鞋帮包踝自然、鞋外侧不露裸脚边；
5. 跨套装戴帽对齐；拖拽改尺寸时 ResizeObserver 实时重绘。

**v4 已验结论（2026-09-30）**：在架 4 头饰 × 6 套装组合与多尺寸通过（轻微瑕疵经确认可接受）；`tsc` 零错误。wizard 帽下线待重做。

**P16 背包边界**：直接复用 `PaperDoll` + `catalog`，只剩业务外壳——`DressUpPanel` / `ItemGrid`、穿戴与库存 store、IndexedDB `cosmetics` 持久化、P10 获得→可穿戴、P4 立绘同步。

## 9. 工具边界：抠图用分割模型，补画才用生成模型

- **删背景 / 分离已画好的像素 → rembg（u2net 分割）**：只算 alpha、主体一个像素不改、确定性可复现、给真透明与羽化、可批量、零额度。多层 / 多件要逐像素对齐，这是硬要求。
- **补画原图不存在的像素（inpaint）→ Seedream（image_edit）**：光脚母图里被鞋挡住的脚、摘帽版里被帽压住的头发，分割无法凭空生成，必须生成模型补。
- **不要让 Seedream / 扩散模型做抠图**：去背景本质是"重画整图"，会漂移颜色 / 边缘 / 比例，且常返回白底或棋盘假透明、无可靠 alpha。
- **`layer_decomposition` 不能用于换装**：它只把现有像素按语义分堆（最多 16 个透明 PNG），不补"被遮住的部分"——拿走某层下面是洞，无法交叉替换；且拆分粒度不可指定、不可复现。它是"多对象合成图的素材提取器"，不是角色绑定 / 换装系统。
- rembg 优于 floodfill：floodfill 进不去两腿间封闭白区，也难分白T 与脚下近白阴影。

## 10. 一致性门禁与人工验收

- 全部主题图必须 **image_edit 带同一 core-ip**，锁脸 / 发型 / 体型 / 肤色 / 材质 / 光 / 机位，只换服装；禁止独立文生重画主角。易漂移部位用双参考（+ core-ip）。
- 每套装 / 每张母图**先 prompt 存档 → 用户确认 → 才生成**；结果本地路径 / CDN 回填存档。
- 切层前人工验收：脸 / 发型 / 肤色与 core-ip 一致；姿势、脚底基线、中线与 anchors 重合；搪胶质感 / 光照统一；无强性别符号、无文字数字 logo；§8.2 组合全过。

## 11. 命名与 manifest

- 整身母图（留档）：`dress-default-barefoot.png`、`dress-job-explorer-barefoot-nohat.png`。
- 整身层：`layers/outfits/outfit-<id>-{nohat,forhat-<hat>}@2x.webp`；帽：`layers/hats/hat-<hat>@2x.webp`（配对帽 `hat-wizard-on-<outfit>@2x.webp`）；鞋：`layers/shoes/shoe-<id>@2x.webp`。
- 图标：`icons/<outfit|hat|shoe>-<id>-icon.webp`（512²）。
- series = `job` / `animal` / `fantasy` / `festival`；id：`default` / `explorer` / `scientist` / `frog` / `elf` / `wizard`。
- `manifest.json`（schema `paperdoll-manifest-v4`）：按 `outfits / hats / shoes` 组织，含 id / cn_name / icon / layer 或 layer_variants / master_image / prompt_doc；`default_look = { outfit:'default', hat:null, shoe:null }`。rarity 未定时留备注，不臆造。

## 12. 批量生产（批次 4）与 3D 预留

- 批次 4 已生产 **6 套中性装扮**（default/explorer/scientist/frog/elf/wizard），每套走 §6 全流程；含帽套装出"摘帽版"母图。
- 状态：4 头饰在架；wizard 帽（含 v2 重出版与每套装变体）待问题根治后恢复上架；wizard 法袍服装本身在架。
- 批量生图受 §10 门禁：先逐套提交 prompt 经确认再 image_edit，不擅自批量。
- **3D 预留（本期不实现）**：广场 char-hero 只显示默认着装；建模按标准 humanoid 骨架命名，二期做成挂同一骨架的 skinned mesh，与 2D 槽位口径一致。

## 13. 已验证死路 / 踩坑（勿重复）

- **v2 上衣 / 下装硬切分层** → 帽 / 脸、脸 / 身 1px 缝；望远镜 × 普通衣混搭怪异 → v3 整身 + 帽 / 鞋。
- **扩散模型抠图 / layer_decomposition 做换装** → 重画漂移 / 无遮挡补全，不可用（§9）。
- **单参考编辑脸部漂移**：探险家被改成带睫毛眼型 → 双参考（+ core-ip）+ prompt 强锚定无睫毛圆眼。
- **把戴帽母图当 nohat**：整身含帽无法靠切割得到摘帽版（帽下发际不存在） → 单独生成"摘帽版"母图。
- **裸脚比鞋宽**：鞋底外侧露裸脚边 → `fit_shoe_to_foot` 只在鞋头沿裸脚外扩。
- **Vite 预构建陈旧导致画布空白**：`@mathpaws/ui` 是指向 TS 源码的 workspace 链接包，被 `optimizeDeps.include` 预构建后，源码改动不触发缓存失效，浏览器一直加载旧 PaperDoll（空 img、控制台无报错）。解法：vite.config 中 `optimizeDeps.exclude: ['@mathpaws/ui']`（让 Vite 直接按需编译源码），改动即时生效；必要时停唯一实例后 `vite --force`。
- **手绘椭圆 R 硬切帽区（v3 做法）的三类问题**：框比帽小 → 切缺（scientist 镜框顶部 V 缺口）；框比帽大 / 切到轮廓外头发 → 光环、切耳。→ v4 改为从源图自身取帽区（§7.1）。
- **一顶帽的轮廓罩不住 6 套不同大小的发穹**：wizard v1/v2（帽檐加宽、帽锥仍窄）跨套时身体头发在帽锥两侧、后上方鼓出；单纯重出一张图、颜色分割、配对重亮都无法同时满足全部套装 → 该帽暂时下线。后续要么以"统一发穹"重新生成全部素材，要么接受每套装专用帽层方案的视觉效果后再上架。
- **缺口指标只数"源覆盖行内部"**：把按设计删除的轮廓外头发当缺口会得到误导性大数字；视觉验收（contact/zoom）才是最终判据。
- **core-ip 短链会失效（404/超时）**：step2 鞋层与改帽无关，已产出时直接复用 `layers/shoes/`，不要为重切帽层强依赖该链接。
- floodfill 处理不了封闭白区与近白阴影；Python 3.14 装不了 onnxruntime；rembg 2.x 需单装 onnxruntime、模型路径变为 `.rembg\models\u2net\`。
