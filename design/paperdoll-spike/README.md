# paperdoll-spike — 纸娃娃换装切层工具集

把"AI 整身套装图"切成 **3 槽（整身 outfit + 帽 hat + 鞋 shoe）** 的透明图层，并导出游戏可用的 WebP 资产。v4（整身为主 + 帽 / 鞋弱耦合；帽区从源图自身分割）已通过离线与运行时验收，本目录是可复现、可批量的生产工具集。

> **wizard 巫师帽当前已在应用侧下线**（帽后头发鼓包未根治，图层与管线保留）；在架头饰为 explorer / scientist / frog / elf 四顶。

> 完整规范（槽位 / 层序 / 锚点 / 遮罩解法 / SOP / 验收 / 踩坑）在主文档：
> **[../../docs/design/paperdoll-system.md](../../docs/design/paperdoll-system.md)**。本 README 只讲"怎么跑"。

## 目录结构

```
paperdoll-spike/
├── masters/                 # 【输入·勿删】AI 白底母图（2048²；光脚 nohat + 戴帽 full）
│   ├── dress-default-barefoot.png
│   ├── dress-job-explorer-barefoot-nohat.png   # 探险家摘帽版（真正的 nohat）
│   └── dress-*-full(-v2).png                   # 各帽的戴帽源图（帽层输入）
├── _step1_export/           # 【中间·不入库】step1 的 rembg 抠图，step2 输入（自动对应 masters）
├── _step2_export/           # 【中间·不入库】step2 切出的全画布透明层
│   ├── outfits/             #   outfit-<id>-{nohat,forhat-<hat>}.png
│   ├── hats/                #   hat-<hat>.png（配对帽 hat-wizard-on-<outfit>.png）
│   └── shoes/               #   shoe-<id>.png
├── _step4_export/           # 【中间·不入库】step4 staging（manifest/layers/icons/_truth），step6 发布源
├── _tmp/                    # 【可整体删除】临时产物，重跑会再生成（当前已清空）
│   ├── qc/                  #   contact-rmbg / contact-compose / zoom-qc / export-verify
│   └── grid/                #   step1 的坐标网格（排查坐标用，标注 2048 原坐标）
└── step*.py / *.py          # 生产脚本（见下表）
```

- 可随时整个删 `_tmp/`；`_stepN_export/` 系列（step1/2/4 中间产物）同样可重生成，统一 `_stepN_export` 命名且全部 gitignored。
- `masters/` 是唯一长期保留的输入（也能从 `design/asset-prompts/` 记录的结果重新生成）；explorer 戴帽与穿鞋 core-ip 母图已于 2026-10-06 归档本地，step2 全离线可跑。
- **staging** 在 `_step4_export/`（gitignored：`manifest.json`、`layers/`、`icons/`、`_truth/`）；QC 验收后由 `step6_publish.py` 发布进 `apps/web/src/assets/paperdoll/`。

## Python 环境（重要）

| 用途 | 解释器 | 依赖 |
|---|---|---|
| **step1 / step2 / step3 / step4** | `design\.venv-art`（Python 3.12） | rembg 2.0.84 + onnxruntime（**必须单独装 onnxruntime**）+ Pillow/numpy |
| **step5**（回读验证） | 全局 `python`（3.14 即可） | 仅 Pillow（不 import step2，故不需 rembg） |

- 不要在全局 Python 装 onnxruntime（3.14 无 wheel）；也别污染 mnist 的 venv。
- 首次跑 step1 若 u2net 下载失败（GitHub SSL），先跑 `download_model.py`（镜像，落到 `%USERPROFILE%\.rembg\models\u2net\u2net.onnx`）。
- step2 需联网：从 CDN 下载戴帽 / 穿鞋原图（光脚母图无鞋可切）。
- 详见主文档 §5.2。

## 快速开始（按顺序）

在本目录打开 PowerShell：

```powershell
cd design/paperdoll-spike   # 仓库根目录下

# 0)（仅首次 / u2net 缺失）下载抠图模型
python download_model.py

# 1) 抠图 + 坐标网格：masters -> _step1_export/*-rmbg.png、_tmp/grid、_tmp/qc/contact-rmbg.png
& '..\.venv-art\Scripts\python.exe' step1.py

# 2) 切 3 槽层 + 组合对照（仅 explorer 帽源/首次切鞋需联网）：layers/{outfits,hats,shoes} + _tmp/qc/contact-compose.png
& '..\.venv-art\Scripts\python.exe' step2_layers.py

# 3) 接缝放大质检（帽发 / 鞋踝，含每帽）：_tmp/qc/zoom-qc.png
& '..\.venv-art\Scripts\python.exe' step3_zoomqc.py

# 4) 导出 staging：-> _step4_export/（manifest/layers webp@2x/icons 512/truth）
& '..\.venv-art\Scripts\python.exe' step4_export.py

# 5) 用导出的 WebP 异路径回读验证：_tmp/qc/export-verify.png（全局 python 即可）
python step5_verify_export.py

# 6) QC 验收通过后发布进业务目录（layers/icons/truth 子集 + 瘦身 manifest）
python step6_publish.py
```

**验收**：看 `_tmp/qc/contact-compose.png`（组合）、`zoom-qc.png`（放大）、`export-verify.png`（WebP 回读 + 图标），按主文档 §8.2 逐组核对；验收后跑 `step6_publish.py` 发布进 `apps/web/src/assets/paperdoll/`，在 `#paperdoll` 页做运行时验收。

## 脚本一览

| 脚本 | 解释器 | 输入 → 输出 |
|---|---|---|
| `download_model.py` | 任意联网 | 下载 u2net.onnx 到用户目录 |
| `step1.py` | **.venv-art** | 自动发现 `masters/` → `_step1_export/*-rmbg.png`、`_tmp/grid`、`_tmp/qc/contact-rmbg.png` |
| `step2_layers.py` | **.venv-art** | `_step1_export/`（+ 本地 masters 戴帽/穿鞋源）→ `_step2_export/{outfits,hats,heads,masks,shoes}/*.png` + `_tmp/qc/contact-compose.png`；帽 cut_mode / HSV 带 / 鞋切常量在此 |
| `step3_zoomqc.py` | **.venv-art** | 复用 step2 图层 → `_tmp/qc/zoom-qc.png` |
| `step4_export.py` | **.venv-art** | `_step2_export/` → `_step4_export/`（manifest/WebP/图标/truth） |
| `step5_verify_export.py` | 全局 | `_step4_export/` WebP 回读 → `_tmp/qc/export-verify.png` |
| `step6_publish.py` | 全局 | `_step4_export/` → `apps/web/src/assets/paperdoll/`（layers/icons/truth 子集 + 瘦身 manifest） |

## 生产新套装

1. 先在 `design/asset-prompts/` 写好 prompt（含帽套装再写"摘帽版"），**人工确认后**才 image_edit 生光脚母图与戴帽源图，存进 `masters/`（step1 自动发现，无需改脚本）。易漂移部位用双参考（编辑图 + core-ip）。
2. 在 `step2_layers.py` 的 `OUTFITS` / `HATS` 注册新条目并选帽 `cut_mode`（默认 color；卡其色等与皮肤难分时用 ellipse；大帽体用 head）；新坐标先用 `_tmp/grid` 量好再改常量。
3. 走"快速开始"1→6，过 §8.2 矩阵验收与 `#paperdoll` 运行时验收，再在 catalog.ts 挂选项、回填台账。

详见主文档 §6（SOP）、§7（帽 / 鞋遮罩解法）、§9（抠图用 rembg、补画才用 Seedream）。
