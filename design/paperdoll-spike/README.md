# paperdoll-spike — 纸娃娃换装切层工具集

把"AI 整身套装图"切成 **3 槽（整身 outfit + 帽 hat + 鞋 shoe）** 的透明图层，并导出游戏可用的 WebP 资产。当前为 **v5** 口径：生产层 14 份（6 bodies + 3 heads + 2 hats + 2 masks + 1 shoe），item 帽挖洞 / 整头颈缝 / wizard 动态配对均在运行时合成，forhat 等烘焙变体仅留 `_truth` 供回归；本目录是可复现、可批量的生产工具集。

> 在架头饰 5 顶：explorer / scientist（item 帽 + hole mask）+ frog / elf / wizard（head 整头，wizard 运行时动态配对 + 颈色 relit）。

> 完整规范（槽位 / 层序 / 锚点 / 遮罩解法 / SOP / 验收 / 踩坑）在主文档：
> **[../../docs/design/paperdoll-system.md](../../docs/design/paperdoll-system.md)**。本 README 只讲"怎么跑"。

## 目录结构

```
paperdoll-spike/
├── masters/                 # 【输入·勿删】AI 白底母图（2048²），按系列分目录
│   ├── default/             #   dress-default-barefoot.png（光脚 core-ip 锚点）、dress-default-shod.png（穿鞋，鞋层源）
│   └── <系列>/               #   dress-<系列>-barefoot-nohat.png（nohat 整身）+ dress-<系列>-full(-v2).png（戴帽源图）
├── _step1_export/           # 【中间·不入库】step1 的 rembg 抠图，step2 输入（自动对应 masters）
├── _step2_export/           # 【中间·不入库】step2 切出的全画布透明层
│   ├── outfits/             #   outfit-<id>-{nohat,forhat-<hat>}.png
│   ├── hats/                #   hat-<hat>.png（配对帽 hat-<hat>-on-<outfit>.png）
│   ├── heads/               #   head-<hat>.png（整头覆盖 gear：frog/elf/wizard）
│   ├── masks/               #   hole-<hat>.png（item 帽挖洞 mask：explorer/scientist）
│   └── shoes/               #   shoe-<id>.png
├── _step3_export/           # 【中间·不入库】step3 接缝放大质检 zoom-qc.png
├── _step4_export/           # 【中间·不入库】step4 staging（manifest/layers/icons/_truth），step6 发布源
├── _step5_export/           # 【中间·不入库】step5 WebP 回读验证 export-verify.png
└── step*.py                 # 生产脚本（职责见主文档 §5.3）
```

- 临时产物全部 gitignored：管线侧统一 `_stepN_export/`（step1–5 全部产物：数据层 + QC 图），可重生成；生图 ad-hoc 工作区在 `design/asset-prompts/_tmp/`，拆层 ad-hoc 工作区在 `design/high-fi/_tmp/`。
- `masters/` 是唯一长期保留的输入（也能从 `design/asset-prompts/` 记录的结果重新生成）；explorer 戴帽与穿鞋 core-ip 母图已于 2026-10-06 归档本地，step2 全离线可跑。
- **staging** 在 `_step4_export/`（gitignored：`manifest.json`、`layers/`、`icons/`、`_truth/`）；QC 验收后由 `step6_publish.py` 发布进 `apps/web/src/assets/paperdoll/`。

## Python 环境

step1–4 用 `design\.venv-art`（Python 3.12 + rembg + onnxruntime），step5/6 用全局 `python`。搭建命令与各步解释器口径见 [../README.md](../README.md) 与主文档 §5.2（唯一事实源，此处不重复维护）。

## 快速开始（按顺序）

在本目录打开 PowerShell：

```powershell
cd design/paperdoll-spike   # 仓库根目录下

# 1) 抠图 + 坐标网格：masters -> _step1_export/{*-rmbg.png,grid/,qc/contact-rmbg.png}
& '..\.venv-art\Scripts\python.exe' step1_rembg.py

# 2) 切 3 槽层 + 组合对照（全离线）：_step2_export/{outfits,hats,heads,masks,shoes} + _step2_export/qc/contact-compose.png
& '..\.venv-art\Scripts\python.exe' step2_layers.py

# 3) 接缝放大质检（帽发 / 鞋踝，含每帽）：_step3_export/zoom-qc.png
& '..\.venv-art\Scripts\python.exe' step3_zoomqc.py

# 4) 导出 staging：-> _step4_export/（manifest/layers webp@2x/icons 512/truth）
& '..\.venv-art\Scripts\python.exe' step4_export.py

# 5) 用导出的 WebP 异路径回读验证：_step5_export/export-verify.png（全局 python 即可）
python step5_verify_export.py

# 6) QC 验收通过后发布进业务目录（layers/icons/truth 子集 + 瘦身 manifest）
python step6_publish.py
```

**验收**：看 `_step2_export/qc/contact-compose.png`（组合）、`_step3_export/zoom-qc.png`（放大）、`_step5_export/export-verify.png`（WebP 回读 + 图标），按主文档 §8.2 逐组核对；验收后跑 `step6_publish.py` 发布进 `apps/web/src/assets/paperdoll/`，在 `#paperdoll` 页做运行时验收。

各脚本的输入 / 输出与职责说明见主文档 §5.3（唯一事实源）。管线全离线可跑：戴帽 / 穿鞋源图已归档本地 masters，仅 rembg 模型权重首次下载需联网。

## 生产新套装

1. 先在 `design/asset-prompts/` 写好 prompt（含帽套装再写"摘帽版"），**人工确认后**才 image_edit 生光脚母图与戴帽源图，存进 `masters/`（step1 自动发现，无需改脚本）。易漂移部位用双参考（编辑图 + core-ip）。
2. 在 `step2_layers.py` 的 `OUTFITS` / `HATS` 注册新条目并选帽 `cut_mode`（默认 color；卡其色等与皮肤难分时用 ellipse；大帽体用 head）；新坐标先用 `_step1_export/grid` 量好再改常量。
3. 走"快速开始"1→6，过 §8.2 矩阵验收与 `#paperdoll` 运行时验收，再在 catalog.ts 挂选项、回填台账。

详见主文档 §6（SOP）、§7（帽 / 鞋遮罩解法）、§9（抠图用 rembg、补画才用 Seedream）；抠图模型选型对比见 [../../docs/topics/cutout-model-comparison.md](../../docs/topics/cutout-model-comparison.md)。
