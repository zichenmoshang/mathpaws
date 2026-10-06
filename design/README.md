# design/ — 美术与设计资产工作区

AI 生图 prompt 存档、高保真原稿、纸娃娃切层管线、拆层与 3D 辅助工具的工作区。本文件只做**导览与环境搭建**；各工具的细节口径见各自文档，不在这里重复维护。

## 设计规范路由（任务 → 必读规范 → 硬门禁）

执行任何"设计 / 美术资产 / 生图 / 切图"类任务前，先在下表定位任务类型，按顺序读对应规范并遵守硬门禁。

| 任务类型 | 必读规范（按序） | 硬门禁 |
|---|---|---|
| 写 / 改 AI 生图 prompt、调用生图工具 | [asset-prompts/README.md](asset-prompts/README.md) → [design-system.md](../docs/design-system.md) §10 | prompt 存档状态 = **已确认** 才允许生图；禁止"先出一张看看" |
| 新增换装角色 body / 新头饰母图 | [character-generation-spec.md](../docs/design/character-generation-spec.md) → [paperdoll-system.md](../docs/design/paperdoll-system.md) | character-generation-spec §6 检查单逐项过；不满足几何契约不生图 |
| 纸娃娃切层 / QC / 发布 | [paperdoll-spike/README.md](paperdoll-spike/README.md) → [paperdoll-system.md](../docs/design/paperdoll-system.md) | 严格 step1→6 顺序；QC 未验收禁止 step6 发布 |
| 高保真稿提取拟物 UI 元素（拆层） | [hifi-ui-extraction-spec.md](../docs/design/hifi-ui-extraction-spec.md) | 先查 §7 通道表确认该元素走本通道；按 §6 清单逐层验收 |
| 角色抠图 / 换装类"从图里取素材" | 同上 §7 通道表 | **禁用 layer_decomposition**；走 rembg / paperdoll 通道 |
| 改配色 / 字体 / 圆角 / 组件 token | `packages/ui/src/tokens.ts`（代码权威）→ [design-system.md](../docs/design-system.md) 同步 | 先改代码再同步文档，禁止只改文档 |
| 广场 3D / 图生 3D / GLB 资产 | [docs/design/phase2/](../docs/design/phase2/)（plaza-3d / asset-manifest / gen3d-guide） | **已冻结，一期不执行**；仅二期开工时续用 |

冲突时优先级：`docs/PRD.md`（产品数值 SSOT）> `docs/design-system.md`（视觉 / token / 尺寸）> 专项 spec > 代码常量（文档与代码不一致时以代码为准并回改文档）。

## 工具链一览

| 路径 | 用途 | 运行时 | 详细文档 |
|---|---|---|---|
| `paperdoll-spike/` | 纸娃娃换装切层管线（step1–6，母图 → WebP 资产） | `design/.venv-art`（Python 3.12） | [paperdoll-spike/README.md](paperdoll-spike/README.md) |
| `asset-prompts/` | 生图 prompt 存档与确认门禁；含 `edit_ref_runner.js`（图生图运行器） | Node（+ Seedream skill） | [asset-prompts/README.md](asset-prompts/README.md) |
| `high-fi/` | 高保真原稿 + `decomp.js` 语义拆层 | Node（+ Seedream skill） | [../docs/design/hifi-ui-extraction-spec.md](../docs/design/hifi-ui-extraction-spec.md) |
| `gen3d-input/` | 3D 生成输入图（宠物多角度） | — | — |
| `rabbit_rig_gui.py` | 兔子 GLB humanoid 骨骼绑定（一次性脚本） | **Blender 内置 Python**（`bpy`） | 见文件头注释 |

## 环境搭建

### 1. Python 切层环境（paperdoll-spike step1–4）

```powershell
py -3.12 -m venv design\.venv-art
design\.venv-art\Scripts\python.exe -m pip install -r design\requirements-venv-art.txt
```

- 锁定清单：[requirements-venv-art.txt](requirements-venv-art.txt)（2026-10-06 实测 freeze 全量 pin：rembg 2.0.84 + onnxruntime 1.30.0 + Pillow / numpy / scipy 等）。
- **必须用 Python 3.12**：3.14 无 onnxruntime wheel。全局 Python（3.14）只跑 step5 回读（仅需 Pillow），不要装 onnxruntime，也别污染 `ml/mnist` 的 venv。
- rembg 模型权重首次运行自动下载到 `%USERPROFILE%\.rembg\models\`；抠图模型选型对比见 [../docs/topics/cutout-model-comparison.md](../docs/topics/cutout-model-comparison.md)。

### 2. Node 生图 / 拆层脚本（edit_ref_runner.js、decomp.js）

- 仅需 Node（内置模块 + fetch，**无 npm 依赖**，无需 package.json）。
- 两个脚本都是对 Seedream skill（byted-ark-seedream-skill）内 generate.js / model-routing.js 的包装，**该 skill 必须已安装在工作区**。
- API Key 走环境变量 `$env:AGENT_PLAN_API_KEY`（不落盘、不打印、不写入任何配置 / 文件）。

### 3. Blender 骨骼脚本（rabbit_rig_gui.py）

- 依赖 **Blender 内置 Python**（`import bpy`），不在任何 venv 里跑：Blender → Scripting 工作区打开执行（脚本按保留 GUI 上下文设计）。
- 输入 `apps/web/src/assets/models/pets/rabbit.glb`，输出同目录 `rabbit_rigged.glb`。
