# 手写数字识别方案：自训 MNIST CNN + 浏览器内 WASM 推理

> **一句话摘要**：本项目不用任何云服务，在本机用 TensorFlow/Keras 训练一个 MNIST CNN（测试集 97.35%），导出为 TensorFlow.js 格式，前端以 WASM 后端在浏览器内离线完成手写数字识别，抬笔 400ms 自动出结果。
>
> **适用读者**：想在 Web / PWA 项目里做离线手写识别、或想把 Keras 模型低成本搬进浏览器的开发者。

---

## 1. 方案选型：为什么自训 MNIST CNN，而不是云服务

答题场景的需求非常具体：

- 用户在手写板上写 0–9 的**单个数字**（多位数由画板分区，每区各识别一次，见 §3.3）；
- 识别完**直接判定对错**，不做候选列表、不做人工确认（正式流程）；
- 应用定位是离线可用的 PWA，**识别不能依赖网络**。

这几条基本排除了云服务：

| 候选方案 | 否决原因 |
|---|---|
| 云 OCR / 手写识别 API | 依赖网络、有调用成本与时延，违背离线 PWA 定位；儿童隐私数据不该出设备 |
| 浏览器内置 / 系统级手写输入 | 面向文本输入设计，返回的是输入法候选而非数字置信度，无法融入"直接判定"流程 |
| 大型端侧模型 | 单数字分类用 CNN 已足够，大模型只会拖慢首屏加载 |
| **自训 MNIST CNN + TF.js** | 模型仅 ~1.8MB、本地资源离线加载、CPU 上毫秒级推理、无隐私出域 |

MNIST 是 28×28 灰度单通道分类问题，一个中等规模 CNN 几分钟内就能在 CPU 上训到 97%+，工程代价几乎只有一次性的环境搭建。真正的难点不在模型，而在**训练环境与前端预处理对训练分布的对齐**——这两件事后文展开。

---

## 2. 训练管线（`ml/mnist/`）

### 2.1 环境与版本链

完整工程在 `ml/mnist/`，README 有逐条安装命令。核心教训一句话：**用 Python 3.12，不要在新版 Python 上碰运气**。

TF 2.18（Keras 3）+ tfjs 4.22 的组合在 Python 3.13/3.14 上没有稳定版本链：tfjs 硬依赖的 `tensorflow-decision-forests` 在 Windows 无新版 wheel，`orbax` 触发 Windows 长路径报错（WinError 206），`numpy` 新版移除 `np.object`。解法是：

```powershell
pip install tensorflow==2.18.1 tf-keras==2.18.0 tensorflow-hub==0.16.1 \
  "setuptools<81" packaging==23.2 numpy==2.0.2
pip install --no-deps tensorflowjs==4.22.0
python patch.py   # 幂等：把用不到的 TFDF/JAX 导入改为可选，兜底 np.object
```

`tensorflowjs` 必须 `--no-deps`——TFDF/JAX 两组依赖只服务于对应模型格式的转换，Keras 模型转换用不到。

### 2.2 数据与模型

`train.py` 是一个非常标准的 Keras 训练脚本，几个关键决策：

- **数据**：`tf.keras.datasets.mnist`，首次运行自动下载（约 11MB）。
- **增强放在数据管线，不放进模型**：`RandomRotation / RandomTranslation / RandomZoom` 各 0.12，通过 `tf.data` 的 `.map` 应用。这样增强层不会出现在导出图里，tfjs 端加载的是纯推理图。
- **网络结构**：`Conv2D(32)→BN→Conv2D(32)→BN→MaxPool→Dropout` ×2 组（第二组 64 通道），`Flatten→Dense(128)→BN→Dropout(0.5)→Dense(10, softmax)`。
- **回调**：`EarlyStopping(val_accuracy, patience=4, restore_best_weights)` + `ReduceLROnPlateau`。

CPU 上约 5 个 epoch、30 秒收敛，测试集准确率 **97.35%**。

关于增强强度，有过一次真实的反面实验：把旋转/剪切/笔画粗细/模糊/噪声多路叠加做强增强，验证集反而停在 98.35% 且更早平台——**多个增强同时叠加 = 过度正则**，模型容量浪费在不真实的极端变形上。在没有真实用户手写数据之前，靠调 MNIST 增强的收益很低，所以基线只保留 0.12 弱增强。

### 2.3 导出与 fix_model

训练末尾用 `tfjs.converters.save_keras_model` 直接导出到前端公共资源目录：

```
apps/web/public/models/mnist/
├── model.json                 # 模型拓扑 + 权重清单
└── group1-shard1of1.bin       # 权重，约 1.8MB
```

Keras 3 导出的 `model.json` 与 tfjs 加载器存在两处不兼容，`fix_model.py` 在导出后自动修复（`train.py` 末尾已内置调用）：

1. `InputLayer` 配置里的 `batch_shape` 键改名为 tfjs 认识的 `batchInputShape`（递归处理嵌套的 Sequential/Functional 模型）；
2. 权重名里的 `sequential/`、`sequential_N/` 前缀用正则 `^sequential(?:_\d+)?/` 剥掉。

不修这两处，前端 `loadLayersModel` 会直接报错。这个脚本也可单独对某个导出目录运行。

---

## 3. 前端推理（`apps/web/src/utils/mnist.ts`）

### 3.1 为什么用 WASM 后端而不是 WebGL

tfjs 默认走 WebGL 后端，理论上更快，但本项目明确切换到 WASM：

- 应用内有 three.js 3D 场景，tfjs 的 WebGL 后端会与其**共用核显 GPU**，3D 渲染易触发 GPU Context Lost，表现为识别卡死、`fetch` 永久 pending；
- MNIST 单字推理量很小，WASM（CPU）性能完全足够；
- WASM 二进制作为本地资源打包，天然离线。

实现上是先 `setWasmPaths` 再 `setBackend('wasm')`。三个 `.wasm` 文件（基础 / SIMD / 线程-SIMD）通过 Vite 的 `?url` 导入，浏览器支持 SIMD 时自动选用 SIMD 版（线程版需要 COOP/COEP 跨源隔离，默认不开）：

```ts
import { setWasmPaths } from '@tensorflow/tfjs-backend-wasm'
import wasmSimdUrl from '@tensorflow/tfjs-backend-wasm/dist/tfjs-backend-wasm-simd.wasm?url'
// ...
setWasmPaths({ /* base / simd / threaded 三个本地 URL */ })
await tf.setBackend('wasm')
```

模型本体 `tf.loadLayersModel('/models/mnist/model.json')` 走单例缓存 + in-flight Promise 复用，进入答题页即 `warmupModel()` 后台预热，避免提交时才加载造成卡顿。

### 3.2 预处理：把"用户随手写的字"对齐到 MNIST 分布

这是整条链路里**对准确率影响最大**的部分，也是实测误判的主要根因。MNIST 训练集的图像约定是：墨迹为高亮（≈1）、背景为黑（0）、数字按**质心**居中、长边约占 20px。用户手写 canv要喂给模型，必须复刻这个分布。`preprocessFromData` 做四件事：

1. **找墨迹包围盒 bbox**：扫描像素，R 通道 `< 200` 视为墨迹（阈值放宽以兼容浅色、抗锯齿笔迹）；
2. **等比缩放到长边 20px**：`scale = min(20/bw, 20/bh)`，不拉伸变形；
3. **质心居中放入 28×28**：先几何居中绘制，再计算墨迹的加权质心（权重 = `255 - 像素值`），平移画布让质心落在画布中心。**MNIST 是按质心而非 bbox 几何中心居中的**，对 2/7/9 这类上下不对称的数字，这一步差异直接决定对错；
4. **反转为黑底白字并归一化**：`fromPixels` 归一化到 [0,1] 后用 `1 - x` 反转，得到墨迹=1、底=0 的 `[1,28,28,1]` 张量。

两个容易踩的细节：

- 质心平移后画布边缘可能是透明的，而 `tf.browser.fromPixels` 会把透明当黑色处理，反转后变成白噪底——所以平移结果要先**合成到白底**再读取像素；
- 手写板画布本身是透明的（透出底下高保真纸面），区域裁剪时同样先做 alpha 到白底的合成：`out = ink*a + 255*(1-a)`，否则透明区域会被误判成墨迹。

### 3.3 交互流程：抬笔 400ms + 多位数分区（`WritingBoard.tsx`）

多位数不交给一个模型去分割，而是**在 UI 层先把画布分区**：

- 手写板是一块覆盖在高保真手写框底图上的透明 canvas；多位数时用 HTML 虚线（不进 canvas，避免被当成墨迹）把板面均分为 N 个区；
- 每次抬笔启动 **400ms 空闲计时**（落笔即取消），超时后对所有"有墨迹且未锁定"的区**逐区串行识别**；
- 某区识别成功即锁定（`locked[i]`），已锁定的区不再重复识别；用户重写错题时 `reset()` 清板并解锁全部区；
- 位间若是小数点位置，画圆点而不是虚线。

串行推理期间有一个并发防护：逐区推理耗时数百毫秒，这期间用户若落笔，残笔会被裁进下一区的图像。所以识别循环运行中置 `recognizing` 标志，`onDown` 直接忽略这次落笔，等用户正常抬笔后下一轮自然识别。

---

## 4. 工程细节清单

- **张量泄漏防护**：所有 `predict` 调用包在 `tf.tidy()` 内，返回的概率张量用完显式 `dispose()`；预处理返回的输入张量交给 `tidy` 一并回收。tfjs 不会自动管理显存，漏一处 `dispose` 在长会话里就是稳定的内存增长。
- **失败可重试**：后端初始化与模型加载的 Promise 缓存在 `catch` 里**清空**（`backendReady = null` / `modelPromise = null`），下次调用会重新尝试，而不是把一次失败缓存成永久不可用。
- **空白区不误识别**：`isCanvasBlank`（无像素低于墨迹阈值）与 `recognizeRegion` 的 `'blank region'` 错误区分开"没写"和"识别服务不可用"——前者安静跳过等书写，后者上报一次并终止本轮循环（其余区必然同样不可用，不必逐区报错）。
- **预热**：`warmupModel()` 吞掉异常仅作预热；真正提交时再走完整加载链并向用户提示。

---

## 5. 局限与二期方向

**已知局限**：

- 训练分布是成人印刷体风格的 MNIST，与儿童真实手写存在 domain gap，个别字形会误判（实测出现过 111→107、390→270 这类案例，当时主要由预处理未对齐引起，已通过质心居中 + 阈值放宽修复）；
- 单格单字模型，不理解上下文，无法利用算式结构做纠错；
- 97.35% 是 MNIST 测试集数字，不等于真实场景的体感准确率。

**二期方向**：

- **样本回流与数据闭环**：前端每次提交都把"笔迹栅格 + 识别数字 + 正确答案 + 对错"存入 IndexedDB，识别结果≠正确答案的样本标记"待复核"。积累到一定量后导出，人工区分"算错 vs 识别错"，形成"笔迹 + 正确数字"标签做针对性微调——这是触发重训的首要条件，比继续调 MNIST 增强有效得多；
- **模型迭代触发条件**：出现明显/高频误判，或真实样本积累到位，两者满足其一即重训；重训后重跑 fix、覆盖 `apps/web/public/models/mnist/`；
- **候选兜底**：`recognizeDigitTopK(k=3)` 已实现但 UI 暂未启用，后续若需要"候选点选"兜底可直接接入。

---

## 相关链接

- 训练工程与完整踩坑记录：`ml/mnist/README.md`
- 训练脚本：`ml/mnist/train.py`
- 导出修复：`ml/mnist/fix_model.py`、环境补丁 `ml/mnist/patch.py`
- 前端推理：`apps/web/src/utils/mnist.ts`
- 手写板组件（抬笔识别 / 分区）：`apps/web/src/components/WritingBoard.tsx`
- 模型产物：`apps/web/public/models/mnist/`
