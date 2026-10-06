# MNIST 手写数字识别模型（本地训练）

> **状态：当前采用 2026-09-26 第一版模型（弱增强），前端直接加载。2026-09-27 曾试验更强增强，因准确率反降 / 收益甚微而未采用（见第 7 节）。**
>
> 用途：答题场景的**单格手写数字识别**（每次只识别 1 个数字；多位数由多个格子分别识别）。
>
> 第一版测试集准确率 **97.35%**（2026-09-26）；配合前端**质心居中**预处理，实测可用。

---

## 1. 这是什么 / 在产品里的位置

一个标准 Python 工程：用 TensorFlow / Keras 在本机训练 MNIST CNN，导出 **TensorFlow.js** 格式，前端用 `@tensorflow/tfjs` 加载、在浏览器内做手写数字推理（无需后端、无需联网）。

答题流程（一期定稿）：手写格书写 → `recognizeDigit` 识别单格 → **直接判定对错**；空白 / 没识别出来提示"再写一次"。**"回显识别数字 + 逐格手动确认 / 修改"仅调试模式（可配置开关、默认关）**，不弹数字键盘。每次提交的"笔迹栅格 + 识别数字 + 正确答案 + 对错"存 IndexedDB 供后续再训练（见第 7 节）。

---

## 2. 环境搭建为什么一直失败（根因，重要）

**不是某一个包装不上，而是 Python 3.14 上整条版本链互相矛盾：**

- **TF 2.22rc（Keras 3 时代）**配的却是 **tfjs 3.18（2022 年，只认 Keras 2）**，跨了约 4 个大版本；
- **tfjs 4.22** 虽匹配 TF，但硬依赖 **`tensorflow-decision-forests`**——该包在 Windows 上新版根本没有 wheel（旧版只支持到 TF 2.15）；
- 它还会拉 **orbax**，触发 Windows 长路径报错（**WinError 206**）；
- **numpy 2.5 移除了 `np.object`**，手工 patch 两个文件只是治标。

**结论**：Python 3.14 / 3.13 太新，TF + tfjs 生态在其上没有稳定组合，**不要在 3.13/3.14 上继续折腾，直接用 Python 3.12。**

---

## 3. 解决方案（已全部执行并验证）

用本机 Python 3.12 重建环境 `venv312`，固定版本：

| 包 | 版本 | 说明 |
|---|---|---|
| tensorflow | 2.18.1 | Keras 3 |
| tf-keras | 2.18.0 | 与 TF 对齐的 Keras |
| tensorflow-hub | 0.16.1 | tfjs 转换链路依赖 |
| **tensorflowjs** | **4.22.0** | **必须 `--no-deps` 安装** |
| numpy | 2.0.2 | 与 TF 2.18 兼容 |
| packaging | 23.2 | tfjs 需要 |
| setuptools | <81 | hub 0.16.1 依赖 `pkg_resources`（新版 setuptools 已移除） |

为什么 tfjs 要 `--no-deps`：

- 避开 **tensorflow-decision-forests**（Windows 无新版 wheel）和 **jax / jaxlib / flax / orbax**（orbax 在 Windows 有长路径问题）；
- 这两组依赖只用于 **TFDF / JAX 模型转换**，Keras 模型转换不需要；`patch.py` 会把对应的导入改成可选。

---

## 4. 完整安装步骤（PowerShell）

```powershell
cd ml\mnist
py -3.12 -m venv venv312
.\venv312\Scripts\activate
python -m pip install --upgrade pip

pip install tensorflow==2.18.1 tf-keras==2.18.0 tensorflow-hub==0.16.1 "setuptools<81" packaging==23.2 numpy==2.0.2
pip install --no-deps tensorflowjs==4.22.0
python patch.py
```

- `patch.py` **幂等、可重复运行**：自动把 TFDF、JAX 两组用不到的导入改为可选，并兜底处理 `np.object`。
- 若 `py -3.12` 不可用，可直接指定解释器路径，如 `D:\software\Python312\python.exe -m venv venv312`。
> `requirements.txt` 仅作版本清单；因 tfjs 必须 `--no-deps`，**不要直接 `pip install -r requirements.txt`**，按上面命令执行。

---

## 5. 训练

```powershell
python train.py
# 可选参数：
python train.py --epochs 5
python train.py --epochs 10 --out D:\some\output_dir
```

- **数据集**：首次运行自动下载 MNIST（约 11MB）。
- **数据增强放在数据管线、不放进模型**（`RandomRotation / RandomTranslation / RandomZoom = 0.12`）——这样增强层不会进入导出图，tfjs 可直接加载。
- **网络结构**：Conv2D(32)→BN→Conv2D(32)→BN→MaxPool→Dropout；Conv2D(64)→BN→Conv2D(64)→BN→MaxPool→Dropout；Flatten→Dense(128)→BN→Dropout→Dense(10, softmax)。
- **回调**：`EarlyStopping(monitor='val_accuracy', patience=4, restore_best_weights=True)`、`ReduceLROnPlateau`。
- **实测**：CPU 约 5 个 epoch、30 秒左右，测试集准确率 **97.35%**。

---

## 6. 导出与自动修复

`train.py` 末尾用 `tfjs.converters.save_keras_model` 导出，默认输出到：

```
apps/web/public/models/mnist/
├── model.json                 # 模型拓扑 + 权重清单
└── group1-shard1of1.bin       # 权重（当前约 1.8MB，以实际导出为准）
```

导出后**自动调用 `fix_model.fix`**（`train.py` 已内置、无需手动），修复 Keras 3 → tfjs 的不兼容：

- `InputLayer` 的 `batch_shape` → `batchInputShape`；
- 权重名中的 `sequential(_N)/` 前缀去掉（正则 `^sequential(?:_\d+)?/`）；
- 递归处理嵌套的 Sequential / Functional 模型。

> 输出路径可用 `--out` 覆盖（不写死）。

---

## 7. 版本演进与何时再重训（重要）

**当前在用：2026-09-26 第一版（弱增强 0.12）。**

2026-09-27 做过两轮增强重训试验，**均未采用**：

| 试验 | 增强 | 验证集结果 | 结论 |
|---|---|---|---|
| 强增强 | 旋转0.18 + 剪切0.15 + 笔画粗细30% + 模糊 + 噪声，同时叠加 | val 最高仅 **98.35%**、第9轮后平台 | 增强过度、反而比第一版低，废弃 |
| 适中增强 | 旋转/平移/缩放0.10 + 剪切0.08 + 笔画20% + 噪声0.03 | 第3轮 98.39%、未跑完 | 决定先回第一版，未采用 |

**关键教训**：

- 问题不在训练轮数（增强后训练 acc 一直低于验证 acc、没有过拟合），而在**增强强度**——多个增强同时叠加 = 过度正则，模型容量浪费在不真实的极端变形上，反而欠拟合；
- 在**没有真实儿童手写数据**前，靠人工调 MNIST 增强的收益很低且无法本地验证，**不为调增强而反复重训**。

**再重训的触发条件**（满足其一）：

1. 实际使用中出现**明显 / 高频误判**；
2. 积累到一定量**真实儿童手写样本**——前端每次提交都把"笔迹栅格 + 识别数字 + 正确答案 + 对错"存 IndexedDB，识别≠答案标"待复核"，导出并人工区分"算错 vs 识别错"后形成"笔迹 + 正确数字"标签（数据闭环），据此做针对性微调最有效。

重训后重新跑 fix、覆盖 `apps/web/public/models/mnist/`，并在本节追加版本记录。

---

## 8. 前端如何使用（`apps/web/src/utils/mnist.ts`）

- **推理后端：WASM（不是默认 WebGL，重要）**：`mnist.ts` 初始化时先 `setWasmPaths({...})` 再 `tf.setBackend('wasm')`，让推理走 CPU。原因是 tfjs 的 WebGL 后端会和 three.js 共用核显 GPU，3D 渲染易触发 Context Lost、导致识别卡死；WASM 不抢 WebGL、可离线，MNIST 单字推理量小、性能足够。三个 `.wasm`（基础 / SIMD / 线程-SIMD）经 Vite `?url` 本地打包，浏览器自动选 SIMD（线程版需 COOP/COEP 跨源隔离，dev 默认不开）。
- dev 测试：访问 `http://localhost:5173/#quiz` 可直达答题页（返回自动清 hash 回广场）。
- **`loadModel()`**：单例缓存，`tf.loadLayersModel('/models/mnist/model.json')`。
- **`recognizeDigit(canvas)` 的预处理（MNIST 标准，关键）**：
  1. 找墨迹包围盒 bbox（非白像素、阈值 **<200**，兼容浅色 / 抗锯齿笔迹）；
  2. 等比缩放到**长边 20px**；
  3. 按墨迹**质心（重心）居中**放进 28×28——MNIST 按质心居中、不是 bbox 几何中心，对 2/7/9 等不对称数字更准；
  4. **反转为黑底白字**（与 MNIST 训练分布一致）；
  5. 归一化后预测，取概率 argmax。
- **`recognizeDigitTopK(canvas, k=3)`**：返回概率最高的 k 个候选数字（已实现、当前 UI 暂未使用）；后续若启用"候选点选"兜底可直接接入（见第 7 节）。
- **`isCanvasBlank(canvas)`**：空白检查（阈值 <200、无墨迹返回 `true`），防止空格子被误识别。
- **答题 UI（定稿）**：正式流程手写 → 识别 → **直接判定**，不弹回显；空白由 `isCanvasBlank` 拦截提示"再写一次"。**回显识别数字 + 逐格确认 / 修改仅调试模式（默认关）**。识别≠正确答案的样本在 IndexedDB 标"待复核 / 潜在识别错误"，可导出区分"算错 vs 识别错"。

---

## 9. 文件清单

| 文件 | 作用 |
|---|---|
| `train.py` | 训练 + 导出（弱增强基线）；支持 `--epochs` / `--out`，导出后自动 fix |
| `patch.py` | 幂等 patch tfjs（TFDF / JAX 导入改可选、np.object 兜底） |
| `fix_model.py` | 修复导出的 model.json（batch_shape、权重前缀）；也可单独对某目录运行 |
| `requirements.txt` | 版本清单（勿直接 `-r` 安装，tfjs 需 `--no-deps`） |
| `README.md` | 本文档 |
| `venv312/` | 虚拟环境（不入库、自行创建） |
| 产物 `apps/web/public/models/mnist/` | `model.json` + `group1-shard1of1.bin` |

---

## 10. 复现 / 重建

- **只在前端用（不重训）**：什么都不用做，前端加载 `model.json` 即可。
- **重建训练环境**：按第 4 步建 venv、装依赖、`patch.py`（幂等），再 `train.py`。

---

## 11. 踩坑速查表

| 现象 / 报错 | 根因 | 解决 |
|---|---|---|
| TF / tfjs / numpy 一堆版本冲突、装不上 | Python 3.14 整条版本链矛盾 | 改用 **Python 3.12**、按第 3 节版本清单 |
| tfjs 拉 `tensorflow-decision-forests` 失败 | Windows 无新版 wheel | tfjs 用 **`--no-deps`** + `patch.py` |
| orbax 报 **WinError 206**（长路径） | Windows 长路径 + JAX 依赖 | tfjs `--no-deps`，不装 jax/orbax |
| `np.object` 报错 | numpy 新版移除该别名 | `patch.py` 兜底替换为 `object` |
| `No module named 'pkg_resources'` | setuptools 81+ 移除 | `pip install "setuptools<81"` |
| tfjs 加载导出模型报错（batch_shape / 权重名） | Keras 3 导出与 tfjs 不兼容 | `fix_model.py`（train.py 已自动执行） |
| 实测误判（如 111→107、390→270） | 单格预处理未对齐 MNIST 分布（居中方式 / 阈值） | bbox 裁剪→长边20→**质心居中**28→反转、阈值放宽到 <200；加**空白检查**。正式流程直接判定、误判靠**错题本重做**兜底；回显 / 逐格确认仅调试模式（默认关），高频误判走第 7 节样本采集再训练 |
| 强增强后验证集反降到 98.35%、平台 | 多个增强同时叠加、过度正则致欠拟合 | 增强从简（0.12）；勿无条件叠加，见第 7 节 |
| 点识别卡死、控制台 Context Lost / fetch 永久 pending | tfjs WebGL 与 three.js 共用核显、GPU 上下文丢失 | tfjs 切 **WASM 后端**（setWasmPaths + setBackend('wasm')），见第 8 节 |
