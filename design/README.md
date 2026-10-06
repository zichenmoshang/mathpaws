# design/ — 美术与设计资产工作区

AI 生图 prompt 存档、高保真原稿、纸娃娃切层管线、拆层与 3D 辅助工具的工作区。本文件只做**导览与环境搭建**；各工具的细节口径见各自文档，不在这里重复维护。

> **执行任何设计 / 生图 / 切图任务前**，先按 [../.trae/rules/design-spec-routing.md](../.trae/rules/design-spec-routing.md) 的任务路由表定位必读规范与硬门禁。

## 工具链一览

| 路径 | 用途 | 运行时 | 详细文档 |
|---|---|---|---|
| `paperdoll-spike/` | 纸娃娃换装切层管线（step1–6，母图 → WebP 资产） | `design/.venv-art`（Python 3.12） | [paperdoll-spike/README.md](paperdoll-spike/README.md) |
| `asset-prompts/` | 生图 prompt 存档与确认门禁；含 `edit_ref_runner.js`（图生图运行器） | Node（+ .trae Seedream skill） | [asset-prompts/README.md](asset-prompts/README.md) |
| `high-fi/` | 高保真原稿 + `decomp.js` 语义拆层 | Node（+ .trae Seedream skill） | [../docs/design/hifi-ui-extraction-spec.md](../docs/design/hifi-ui-extraction-spec.md) |
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
- 两个脚本都是对 `.trae/skills/byted-ark-seedream-skill/scripts/`（generate.js / model-routing.js）的包装，**该 skill 必须已安装在工作区**。
- API Key 走环境变量 `$env:AGENT_PLAN_API_KEY`（不落盘、不打印、不写入配置，见 `../.trae/rules/secrets.md`）。

### 3. Blender 骨骼脚本（rabbit_rig_gui.py）

- 依赖 **Blender 内置 Python**（`import bpy`），不在任何 venv 里跑：Blender → Scripting 工作区打开执行（脚本按保留 GUI 上下文设计）。
- 输入 `apps/web/src/assets/models/pets/rabbit.glb`，输出同目录 `rabbit_rigged.glb`。
