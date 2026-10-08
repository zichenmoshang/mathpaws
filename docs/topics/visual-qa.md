# 视觉走查体系：拆层资产的离线验收与页面截图回归

> **一句话摘要**：给"AI 生图 → 语义拆层 → 前端按坐标重组"的 UI 资产管线补上两道自动化防线——拆层时 PIL 回贴比对（资产本身是对的），页面级 Playwright 截图基线（前端把资产渲染对了）——再用结构化报告把机器比对结果交给 AI 判读，形成"机器发现、AI 解释、人控闸口"的走查闭环。
>
> **适用读者**：用 AI 生图/拆层管线生产 UI 资产的开发者；想给游戏/教育类重度视觉项目配视觉回归测试（VRT），又不想采购 Percy/Chromatic 这类 SaaS 的小团队。

---

## 1. 问题：两条防线的缺口

本项目（MathPaws，儿童口算游戏）的高保真页面不是手写 CSS 画的，而是走 [hifi-restoration](./hifi-restoration.md) 的管线：AI 文生图出整页原稿，`layer_decomposition` 拆成透明图层，前端按 bbox 台账把图层贴回原稿坐标。这条管线有两个特有的回归风险：

- **资产层：拆层会错，而且错了不报警**。bbox 给歪（实测 absolute 与 normalized 两套坐标曾在进度条层相差数百像素）、图层宽高比被拉伸、边缘带杂色——这些错前端照样渲染，只是"看着有点歪"，纯逻辑测试（单测/E2E）完全发现不了；
- **页面层：改 A 页弄坏 B 页**。所有页面共享同一套组件与样式体系，一次改动可能在完全意料之外的页面上造成视觉回归，靠人工走查 13 个页面成本随页面数线性增长。

业内的通用答案有四条路线：**人工走查清单**（兜底但贵）、**视觉回归测试**（Percy、Chromatic、Playwright 内置 `toHaveScreenshot` 等，PR 级自动拦截）、**设计稿 vs 实现比对**（字节 Copixel 叠图插件、开源 pixel-diff 工具链）、以及 2025 年后兴起的 **AI 视觉模型判读**（Percy Visual Review Agent、用多模态大模型解释 diff）。趋势很明确：像素 diff 负责"发现"，大模型负责"解释这是缺陷还是预期变更"，人只处理争议项。本方案是这个趋势在一个具体项目里的落地，但针对拆层管线做了两件业内工具不覆盖的事：**拆层资产的离线回贴验收**（L1）和**真值基线的豁免语义**（erasedRegions）。

项目的四个现状条件决定了方案形态：

1. 逻辑画布固定 1024×768、contain 等比缩放、DPR 钳制 ≤2——**截图只需锁一档视口**，不需要多视口矩阵；
2. 自研 hash 路由，13 个页面全部深链直达——场景枚举成本极低；
3. 高保真原稿是唯一视觉真值——但原稿是"完整效果图"，拆层图层是"擦除了动态内容的静态底版"，**两者差异有一部分是刻意的**；
4. 已有 Playwright + chromium 的 E2E 冒烟基建——截图能力零新依赖，但视觉比对必须与之**完全隔离**。

---

## 2. 体系：五层分工

| 层 | 内容 | 产出 |
|---|---|---|
| L0 静态门禁 | lint / typecheck / build / 单测（CI 已有） | 代码级正确性 |
| L1 资产离线比对 | `recompose_qc.py`：图层 + bbox 台账能否还原原稿 | 逐层验收单 + 对照图 |
| L2 页面截图基线 | Playwright `toHaveScreenshot`，试点页 splash | 像素 diff + report.json |
| L3 语义诊断 | AI 读 report.json 与 diff 图，判读"缺陷 vs 预期变更" | 修复建议或基线更新申请 |
| L4 人工走查 | 逐页 checklist、真机验收、基线更新批准 | 签核 |

分工原则：L1 回答"喂给前端的资产是对的"，L2 回答"前端把资产渲染对了"——缺了 L1，走查发现页面歪时无法区分是代码写错还是资产切错。L3 是成本最低的层（AI 读图是现成能力），但必须有 L2 的结构化产物喂它，否则退回"人肉贴截图"的非标状态。

---

## 3. 实践一：拆层回贴验收（`design/high-fi/recompose_qc.py`）

把拆层规格（`docs/design/hifi-ui-extraction-spec.md` §6）原来靠临时手工执行的验收动作固化成一键脚本。两种调用模式：

```powershell
# 模式 A：拆层门禁——decomp.js 拆完立即验，超阈值层修复/重拆前禁止登记台账
design/.venv-art/Scripts/python.exe design/high-fi/recompose_qc.py decomp `
  design/high-fi/_tmp/decomp-<page> --source design/high-fi/<page>/<page>.png

# 模式 B：存量回归——按已发布台账全量复验
design/.venv-art/Scripts/python.exe design/high-fi/recompose_qc.py page splash home plaza ...
```

输入是 bbox 台账（`apps/web/src/assets/hifi/<page>/manifest.json`）+ 图层 + 原稿；输出是三联对照图（回贴 | 原稿 | 差分热图）、JSON 验收单、退出码（0 全过 / 1 有超阈值层）。脚本价值不在"回贴"本身（几十行 PIL），而在四个比对机制——每一个都是首轮全量跑出来的教训：

### 3.1 alpha 引导的逐层比对：只验"图层实际画了什么"

最初的实现是"回贴合成图的该层区域 vs 原稿同区"——首页的金色闹钟层立刻报出 39% 差异。看对照图才发现：原稿里闹钟印在白色卡面板上，而白卡是前端 CSS 重实现的（不在图层里），回贴图闹钟底下是天空。**区域整体比对对"层下垫着未回贴内容"的情况天然失效**。

改为 alpha 引导：单层缩放到 bbox 尺寸后，只在图层 alpha > 128 的像素内与原稿同位置比对——语义变成"图层实绘的内容与原稿该处是否一致"，透明区（原稿里的 CSS 面板、动态文字）不参与。这是拆层验收的正确语义。

### 3.2 ±3px 偏移搜索：区分"bbox 记错了"与"内容真不同"

图层 diff 超标有两种成因：bbox 台账记偏了几像素（对齐后能重合），或图层内容本身与原稿不同（怎么对齐都不同）。处置完全不同：前者修台账，后者重拆层。脚本对每层在 ±3px 范围内搜索 diff 最小的对齐位置：

- 对齐后 diff 骤降（< 原值 50%）且偏移 ≥2px → 报"bbox 疑似偏移 (dx,dy)，建议核对台账"——这正是当年进度条 absolute/normalized 矛盾案的自动化；
- 对齐后仍超阈值 → 报内容差异。

首轮全量跑证明这个区分是必要的：9 页所有超标层全部是"对齐后仍超"，没有一例真偏移——差异另有来源（见 3.4）。

### 3.3 抗锯齿容忍：形态学腐蚀 ≈ pixelmatch 的 AA 处理

首跑时 splash 的数字符号层报 13–20% 差异，看差分热图却发现差异全部沿轮廓分布——拆层图层的边缘 alpha 渐变与原稿合成边缘存在 1px 级的固有差异（抗锯齿/重采样），不是缺陷。业内 VRT 工具（pixelmatch）对此有专门的 anti-alias 检测；这里用更朴素的近似：差像素 mask 做一次 3×3 形态学腐蚀，1px 宽的孤立边缘线被消除，错位、色块、缺失等成块缺陷保留。

### 3.4 erasedRegions：刻意差异必须登记，否则告警淹没

首轮 9 页全量跑的结果是 **0/9 全过**——但失败不是工具失效，而是暴露了一个语义盲区：拆层工作流本来就**刻意擦除动态内容**（每日打卡页卷轴上的"连续学习N天"烘焙文字、答题页书页上的题目、农场田里的作物、首页的换装人物），图层是"静态底版"，原稿是"完整效果图"。这类差异占失败层的绝大多数，且是**正确的**。

处置不是放宽阈值（那会把真缺陷也放过去），而是给每层支持 `erasedRegions` 登记（层内相对坐标的豁免矩形）：擦除区在拆层时随拆随登记，该区域不参与比对。首轮跑出的差异因此分成三类，这也是工具的产出价值：

1. **刻意语义差异**（主体）→ 登记 `erasedRegions` 豁免；
2. **细元素高边缘占比**（splash 数字符号/logo，3%–21%）——细笔画元素的边缘像素占比天然高，腐蚀一次不足以消除，列为按元素形态裁定阈值的专项；
3. **真缺陷**：quiz 页书写框宽高比偏差 0.129（bbox 与图层原生比例差 13%，真拉伸）——混在 30 余个超标层里，没有工具就会被噪声淹没。

### 3.5 双 bbox 交叉校验与台账兼容

模式 A 下对每层做 `absolute` vs `normalized`（0–1000 坐标系）交叉校验，换算偏差 >2px 即报人工裁定（裁定规则沿用拆层规格 §4：用层 PNG 原生尺寸验证哪套自洽，仍无法判定以 normalized 为准并记 `bboxNote`，禁止静默采用）。存量台账存在三代 schema（`stage`/`canvas`/`source_size`、文件名在 `file` 或 `name` 字段、z 缺省），脚本全部兼容并给出兜底。

随工具落地，拆层规格 §5/§6 已修订：**拆层后自动执行脚本验收（门禁），人工只做裁定与抽查**（边缘质感、文案错字、擦除区登记确认）。

---

## 4. 实践二：页面截图基线（`visual:check`）

### 4.1 与 E2E 的物理隔离

最初设想是在现有 `playwright.config.ts` 里加一个 `visual` project——但 `playwright test` 默认跑**全部** project，视觉用例会污染 E2E（CI 里变慢、缺基线即失败）。改为完全独立的 `playwright.visual.config.ts`：独立 `testDir`（`e2e-visual/`，与 `e2e/` 平级互不扫描）、独立基线目录、独立产物目录（`test-visual/`，gitignored）、**独立端口 4174**（E2E 用 4173，两套可并行）。E2E 的 config 与 CI 一行未改。

### 4.2 单视口与场景表

利用"固定 1024×768 逻辑画布 + contain 缩放"的架构特性，截图只锁一档：viewport 1024×768（与画布同比例，contain 无黑边）、`deviceScaleFactor: 2`（对齐 DPR 钳制上限）、`reducedMotion: 'reduce'`。场景表驱动（`e2e-visual/scenarios.ts`），每个场景声明 hash、前置存档、冻结/打码手段；一期只收试点页 splash，验证抗噪与阈值后再按清单扩展。

### 4.3 splash 的时钟冻结

splash 是最简场景却有一个陷阱：资源加载完 ≥1400ms 后**自动跳转**下一页，进度条有 rAF 缓动动画——直接截图会截到不确定的进度位置甚至跳转后的页面。解法是 `page.clock.install()`：冻结时钟后 rAF 停止（进度条停在确定状态）、`setTimeout` 停止（永不跳转），整个页面成为确定画面，无需 mask 任何区域。配合 `document.fonts.ready` 等字体就绪，连续 4 次触发像素级一致。

### 4.4 报告协议：机器结论 → AI 诊断的交接单

`visual:report` 把 playwright 的 JSON 输出汇总为 `test-visual/report.json`：

```json
{
  "run": { "time": "...", "commit": "78defe0", "mode": "local" },
  "summary": { "total": 1, "passed": 1, "failed": 0 },
  "cases": [
    { "id": "splash", "status": "pass", "diffRatio": null,
      "baseline": "e2e-visual/__screenshots__/visual.spec.ts-snapshots/splash-chromium-win32.png",
      "current": null, "diff": null }
  ]
}
```

pass 时只有结论；fail 时 `diffRatio`（差异像素占比）、`current`（实际截图）、`diff`（差异热图）才有值。诊断流程约定为：先读 JSON 拿到 fail 清单 → 只对 fail 项读 1–2 张 diff 图 → 判读"预期变更（经批准后 `--update-snapshots`）还是缺陷（修代码复跑）"。治理纪律两条：基线更新必须经人批准、禁止为消红随手 update。

---

## 5. 双基线策略与后续规划

| | 基线 A：回归基线（已落地） | 基线 B：真值基线（待启动） |
|---|---|---|
| 比对对象 | 上次实现 vs 本次实现 | 实现 vs 高保真原稿 |
| 目的 | 防"改 A 页弄坏 B 页" | 逐页 1:1 还原度验收 |
| 判定 | 严格阈值自动 pass/fail | overlay 叠图 + 分块 SSIM + 人工/AI 确认 |
| 频率 | 按需触发 | 仅新页施工验收、大改版 |

原稿与实现直接像素比对噪音大（字体渲染、动效帧、3D），所以 B 线不走严格阈值，产物是叠图与差异区域清单，判定交给人或 AI。启动时机与原稿重生成计划对齐——在真值本身要换代的时候铺回归基线会造成返工。后续扩展按场景清单逐页接入：存档用 storageState 录制、含 WebGL 的页面 mask 掉 canvas 区域只比 UI 层、时间依赖用 `page.clock` 固定、随机依赖 mock 固定结果。CI 视觉门禁留作远期可选（跨 OS 渲染差异要求基线在 CI 环境重建，先非阻塞观察再转 required）。

---

## 6. 经验与踩坑

1. **先分清"刻意差异"再谈阈值**。资产比对最大的坑不是像素噪声，而是语义：拆层管线刻意擦除的动态内容会造成大量"正确的差异"，不登记豁免区就会把真缺陷淹死在告警里。任何设计稿比对类工具落地前，先问"哪些差异是业务上刻意存在的"。
2. **`pnpm run` 的 `--` 会被当字面量吞掉**。`pnpm run preview -- --port 4174` 实际执行 `vite preview "--" "--port" "4174"`，端口参数被忽略——E2E config 里同款冗余因为用的恰好是默认端口 4173 而长期无感，换端口时才暴露。pnpm 直传参数不需要 `--`。
3. **AI 终端/IDE 终端可能注入 `CI` 环境变量**。用它区分本地与 CI 会把本地误判成 CI——本方案两处中招（浏览器路径选择、report 的 mode 字段）。判定真 CI 用 `GITHUB_ACTIONS` 这类具体变量。
4. **浏览器二进制目录可能被沙箱拦**。默认的 `%LOCALAPPDATA%/ms-playwright` 写不进时，把 `PLAYWRIGHT_BROWSERS_PATH` 指到仓库内目录（gitignored）；注意必须在 playwright 进程启动前注入（config 里设置太迟，registry 已缓存默认路径）。
5. **视觉比对的稳定性指标优先于内容解释**。splash 基线最终定格在"满格进度条"状态，与最初设想的"空轨道"不同——但连续 4 次触发像素级一致。回归基线的唯一硬指标是确定性，画面停在哪个确定状态是次要的。

---

## 相关链接

- 拆层回贴验收脚本：`design/high-fi/recompose_qc.py`
- 拆层规格（§5 门禁命令、§6 脚本验收清单）：`docs/design/hifi-ui-extraction-spec.md`
- 视觉截图配置与场景表：`apps/web/playwright.visual.config.ts`、`apps/web/e2e-visual/`
- 报告汇总脚本：`apps/web/scripts/visual-report.mjs`（产物 `apps/web/test-visual/`，不入库）
- 高保真还原工作流（资产管线本体）：[hifi-restoration](./hifi-restoration.md)
- 业内 VRT 工具对照：[Playwright Visual comparisons](https://playwright.dev/docs/test-snapshots)、[Percy](https://www.browserstack.com/guide/visual-regression-testing-tool)、[Chromatic](https://www.chromatic.com/compare/percy)、[Argos 工具综述](https://argos-ci.com/blog/best-visual-regression-testing-tools)
