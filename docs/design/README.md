# docs/design — 视觉资产流水线总览

> 本页是**视觉文档门户**（人读全景 + 任务路由的唯一入口），回答三个问题：
> ① 视觉相关文档之间是什么关系；② 一张美术资产从创意到前端落地的完整流程；③ 不同目的该按什么顺序读。
> 本页只做导览、路由与链接，不重复维护任何规范细节；口径冲突时的优先级见 §3 文末。

## 1. 文档地图：三层 + 冻结档案

| 层 | 回答的问题 | 文档 |
|---|---|---|
| **规范层**（SSOT，必须遵守） | 必须怎么做 | [design-system.md](../design-system.md)（风格 / 色板 / token / 尺寸，§10 生图规格）、[character-generation-spec.md](./character-generation-spec.md)（角色生图几何契约）、[paperdoll-system.md](./paperdoll-system.md)（换装规范与 SOP）、[hifi-ui-extraction-spec.md](./hifi-ui-extraction-spec.md)（高保真拆层规范） |
| **操作层**（管线与门禁） | 怎么跑 | [asset-prompts/README.md](../../design/asset-prompts/README.md)（prompt 存档与人工确认门禁）、[paperdoll-spike/README.md](../../design/paperdoll-spike/README.md)（切层 step1–6 操作）、[design/README.md](../../design/README.md)（工具链与环境搭建） |
| **档案层**（调研 / 踩坑） | 为什么是这样 | [hifi-restoration.md](../topics/hifi-restoration.md)（回贴管线叙事）、[visual-qa.md](../topics/visual-qa.md)（视觉走查体系）、[cutout-model-comparison.md](../topics/cutout-model-comparison.md)（抠图模型选型）、[viewport-adaptation.md](../topics/viewport-adaptation.md)（屏幕自适应） |
| **冻结档案**（二期 3D） | 一期不用读 | [phase2/](./phase2/)（plaza-3d / asset-manifest / gen3d-guide，2026-10-05 冻结） |

**规范层与档案层的分工**：规范层只写"现行口径是什么"，决策过程、选型对比与失败路线收进档案层。查"现在该怎么做"读规范层；查"为什么这么做"读档案层。

## 2. 端到端流程

```
① 定基调               docs/design-system.md（风格 / 色板 / token / 尺寸 SSOT，§10 生图规格）
   │
② 写 prompt 存档        design/asset-prompts/（每资产一 md；draft → approved → done）
   │                     ├─ 角色 / 换装类：先读 docs/design/character-generation-spec.md（几何契约）
   │                     └─ 页面 / UI 类：按 design-system.md §10 尺寸表与安全区要求
   │
③ 生图 + 母图归档        换装母图   → design/paperdoll-spike/masters/<系列>/
   │                     页面高保真 → design/high-fi/<page>/
   │
④ 加工（通道二选一，由 hifi-ui-extraction-spec §7 通道表裁决）
   ├─ 换装切层           paperdoll-system.md（规范）→ paperdoll-spike step1→6（怎么跑）
   │                     抠图为何用 BiRefNet：docs/topics/cutout-model-comparison.md
   └─ 拟物 UI 拆层       hifi-ui-extraction-spec.md（layer_decomposition；design/high-fi/decomp.js）
   │
⑤ 资产落地              apps/web/src/assets/（paperdoll/ · hifi/<page>/ · gacha/ · ui/ …）
   │
⑥ 组装 + 验收            坐标回贴：docs/topics/hifi-restoration.md
                         走查回归：docs/topics/visual-qa.md（PIL 回贴 L1 + 页面截图 L2）
```

| 环节 | 做什么 | 硬门禁 |
|---|---|---|
| ① 定基调 | 确认风格 / 色板 / 尺寸口径 | token 先改代码（`packages/ui/src/tokens.ts`）再同步文档 |
| ② 写 prompt | 按 `_TEMPLATE.md` 填完整 prompt 并登记 | **状态 = 已确认才允许生图**，禁止"先出一张看看" |
| ③ 生图归档 | 调用生图工具，母图按类别归档 | 角色衍生图一律 image_edit + core-ip 参考，保持 IP 一致 |
| ④ 加工 | 换装走确定性脚本切层；拟物 UI 走语义拆层 | 角色抠图 / 换装**禁用 layer_decomposition** |
| ⑤ 落地 | 发布进 `apps/web/src/assets/` | 纸娃娃须 QC 验收后才允许 step6 发布 |
| ⑥ 组装验收 | 前端按 bbox 台账回贴，走查回归 | 文字一律前端排版，不进图层 |

## 3. 设计规范路由（任务 → 必读规范 → 硬门禁）

执行任何"设计 / 美术资产 / 生图 / 切图"类任务前，先在下表定位任务类型，按顺序读对应规范并遵守硬门禁。

| 任务类型 | 必读规范（按序） | 硬门禁 |
|---|---|---|
| 写 / 改 AI 生图 prompt、调用生图工具 | [asset-prompts/README.md](../../design/asset-prompts/README.md) → [design-system.md](../design-system.md) §10 | prompt 存档状态 = **已确认** 才允许生图；禁止"先出一张看看" |
| 新增换装角色 body / 新头饰母图 | [character-generation-spec.md](./character-generation-spec.md) → [paperdoll-system.md](./paperdoll-system.md) | character-generation-spec §6 检查单逐项过；不满足几何契约不生图 |
| 纸娃娃切层 / QC / 发布 | [paperdoll-spike/README.md](../../design/paperdoll-spike/README.md) → [paperdoll-system.md](./paperdoll-system.md) | 严格 step1→6 顺序；QC 未验收禁止 step6 发布 |
| 高保真稿提取拟物 UI 元素（拆层） | [hifi-ui-extraction-spec.md](./hifi-ui-extraction-spec.md) | 先查 §7 通道表确认该元素走本通道；按 §6 清单逐层验收 |
| 角色抠图 / 换装类"从图里取素材" | 同上 §7 通道表 | **禁用 layer_decomposition**；走 rembg / paperdoll 通道 |
| 改配色 / 字体 / 圆角 / 组件 token | `packages/ui/src/tokens.ts`（代码权威）→ [design-system.md](../design-system.md) 同步 | 先改代码再同步文档，禁止只改文档 |
| 广场 3D / 图生 3D / GLB 资产 | [phase2/](./phase2/)（plaza-3d / asset-manifest / gen3d-guide） | **已冻结，一期不执行**；仅二期开工时续用 |

冲突时优先级：`docs/PRD.md`（产品数值 SSOT）> `docs/design-system.md`（视觉 / token / 尺寸）> 专项 spec > 代码常量（文档与代码不一致时以代码为准并回改文档）。

## 4. 三条阅读路径

- **理解全局**（新人 / 回顾）：本页 §1–2 → [design-system.md](../design-system.md) §1–2（风格与原则）→ 按当前在做的事下钻对应规范；
- **动手做任务**：本页 §3 路由表定位任务类型 → 按表顺序读必读规范 → 遵守对应硬门禁；
- **查数值 / 规格**：视觉与尺寸查 [design-system.md](../design-system.md)；产品数值查 [PRD.md](../PRD.md)；换装几何常量以 `design/paperdoll-spike/step2_layers.py` 注册表为准。

## 5. 边界与冻结

- [phase2/](./phase2/) 三篇（广场 3D 方案 / 3D 台账 / 建模手册）已于 2026-10-05 冻结，一期链路不经过 3D；二期开工时直接续用。
- [viewport-adaptation.md](../topics/viewport-adaptation.md) 属前端工程话题（页面如何贴屏缩放），与资产生产管线正交；列入档案层是因为它是高保真坐标回贴的落地依据。
