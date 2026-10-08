# 屏幕自适应方案：固定构图 Web 应用的缩放路线调研与工程落地

> **一句话摘要**：锁定设计分辨率 + 等比缩放居中不是野路子，而是 Phaser FIT、Cocos ShowAll、LayaAir showall 的同款行业标准；真正的工程难点在 DOM 载体——`transform: scale()` 的 fixed 定位、坐标换算、光栅化三类副作用，以及"规范写了但没人执行"的落地问题。本文给出完整的方案地图、缺陷机制分析，以及 mathpaws 从"四种结构变体并存"收敛到"一个 SceneShell + 字号 token + ESLint 强制"的全过程。
>
> **适用读者**：做儿童平板 Web 应用、H5 营销页、数据大屏等"固定构图、拒绝响应式重排"场景的前端；在 transform scale / zoom / rem / vw 之间选型的开发者；想把视觉规范从文档落实到 CI 的小团队。

---

## 1. 问题：固定构图应用的适配困境

大多数 Web 自适应讨论围绕"响应式重排"（断点 + 流式布局）展开，但有一类应用**不接受重排**：

- **儿童教育 / 游戏类平板应用**：页面是一幅完整构图（角色在左、卡片在右、按钮贴着场景元素），元素位置即设计本身；
- **H5 营销页 / 活动页**：视觉还原度优先，运营稿什么样页面就什么样；
- **数据可视化大屏**：1920×1080 设计稿直接投射到任意分辨率大屏。

这类场景的共同诉求是：**页面按一个固定的设计分辨率绘制，运行时整体缩放贴合屏幕，元素相对位置永远不变**。mathpaws（儿童口算游戏）是典型案例：

- 逻辑设计基准 **1024×768（4:3）**，场景内所有坐标都是设计稿折算的逻辑像素；
- 目标真机华为 MatePad 11.5"（2800×1840，≈1.52:1 近 3:2；横屏 CSS 视口约 1400×920，DPR≈2，渲染钳制 ≤2）；
- 4:3 画布放进 3:2 屏幕，左右必然出现留边——留边怎么处理是方案的一部分；
- 不做手机响应式：竖屏给轻提示，不阻断。

问题分解为三个决策：① 缩放路线选什么（transform / zoom / rem / vw / canvas）；② 留边与背景怎么处理；③ 规范如何保证新页面不跑偏。第 ①② 题业界已有大量实践（第 2–3 节），第 ③ 题鲜有公开讨论，是本文后半的重点。

---

## 2. 业界方案地图

### 2.1 游戏引擎：锁定设计分辨率是内建标准能力

2D 游戏引擎把"设计分辨率 + 缩放模式"做成了框架的一等公民。主流引擎的模式命名不同，语义只有两种核心：

| 引擎 | 等比缩放、完整显示（= CSS `contain`） | 等比缩放、铺满裁切（= CSS `cover`） | 其他模式 |
|---|---|---|---|
| Phaser 3 | `Scale.FIT`（配 `autoCenter: CENTER_BOTH` 居中） | `Scale.ENVELOP` | `RESIZE`（画布随窗口重排）、`NONE` |
| Cocos Creator | Show All（同时勾选 Fit Width + Fit Height） | No Border（都不勾） | ExactFit（非等比拉伸） |
| LayaAir | `scaleMode = showall` | `scaleMode = noborder` | `fixedwidth` / `fixedheight` / `exactfit` |
| PixiJS | **不内建**，社区做法：`resizeTo: window` + 手动 `stage.scale.set(min(w/W, h/H))` 并居中 | 同左 | `resolution` / `autoDensity` 处理 DPR |

两个关键事实：

- **Phaser 官方文档明确**："For the vast majority of games, the FIT mode is likely to be the most used"。FIT + autoCenter 与手写 CSS `s = min(vw/1024, vh/768); transform: translate(-50%,-50%) scale(s)` 语义完全等价；
- **引擎与 DOM 方案的本质差异在载体**：引擎缩放的是 canvas 的 CSS 尺寸，位图由 GPU 重采样、输入坐标由引擎内部换算，因此**天然没有** fixed 定位失效、指针坐标偏移、文本光栅化模糊这些 DOM 副作用（见第 3 节）。DOM 方案要自己填这三个坑。

来源：[Phaser Scale Manager 概念](https://docs.phaser.io/phaser/concepts/scale-manager)、[ScaleManager API](https://docs.phaser.io/api-documentation/class/scale-scalemanager)、[Cocos Creator 多分辨率适配](https://docs.cocos.com/creator/2.4/manual/zh/ui/multi-resolution.html)、[LayaAir Stage API](https://layaair.ldc.layabox.com/api/laya/display/Stage.html)、[PixiJS Application 文档](https://pixijs.download/dev/docs/app.html)。

### 2.2 DOM/CSS：三条路线的兴衰

**路线 A：rem / vw 流式适配**（H5 营销页主流）。阿里手淘 `lib-flexible`（按屏宽动态算根字号，px 转 rem）曾是事实标准，但其 README 已明确"由于 viewport 单位得到众多浏览器的兼容，lib-flexible 这个过渡方案已经可以放弃使用"，生态迁移到 **vw + postcss-px-to-viewport**（原仓多年不维护，社区 fork 如 postcss-px-to-viewport-8-plugin 仍在用）。这条路线的本质是**重排**——元素按视口比例重新分布，不符合"固定构图"诉求。

**路线 B：`transform: scale()` 整页缩放**（数据大屏事实标准）。开源组件 [autofit.js](https://www.cnblogs.com/Kay-Larry/p/17408513.html)（框架无关）、v-scale-screen（Vue2/3）、vfit（Vue3）的核心都是几十行代码：`transform: scale(ratio)` 应用到根容器。这条路线与游戏引擎 FIT 同源，也是 mathpaws 迁移前的路线，缺陷在第 3 节详述。

**路线 C：CSS `zoom`**（2024 年起可用了）。`zoom` 是非标准出身（IE 时代）后被标准化的属性，2024-05 Firefox 126 补齐最后一块后进入 **Baseline**（Chrome 1+ / Safari 3.1+ / Edge 12+ / Firefox 126+）。它与 `transform: scale()` 的关键区别是**布局级缩放**：参与排版、影响文档流占位，而不是合成器事后放大一张位图。来源：[MDN zoom](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/zoom)、[Firefox 126 发布说明](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/126)。

### 2.3 支撑能力：现代 CSS / API 基线

缩放路线之外，2021–2024 年一批相关能力陆续进入 Baseline，显著改善了适配工具箱：

| 能力 | Baseline | 解决的问题 |
|---|---|---|
| `zoom` | 2024-05（Firefox 126 补齐） | 布局级整页缩放，规避 transform 副作用 |
| 容器查询 `@container` / `cqw` | 2023-02 | 组件级（而非视口级）自适应 |
| `dvh` / `svh` / `lvh` | 2022 起（Chrome 108 / Safari 15.4 / Firefox 101）* | 移动浏览器地址栏伸缩导致 vh 抖动/溢出 |
| `visualViewport` API | 2021-08 | 精确跟踪可视区（含地址栏伸缩、pinch-zoom） |
| `env(safe-area-inset-*)` + `viewport-fit=cover` | 较早 | 刘海 / 圆角 / 手势条避让 |

\* dvh 各浏览器起始版本来自社区汇总，未在 MDN 摘要中直接核验，标注为部分确证；其余均可在 MDN 对应词条查到 Baseline 徽标。

---

## 3. `transform: scale()` 整页缩放的四类缺陷（机制分析）

大屏社区对 scale 方案的吐槽集中在"白边、模糊、坐标偏移"，但流传的说法经常夸大或归因错误。逐条按机制拆解：

**缺陷 1：`position: fixed` 后代定位失效（规范级确证）**。CSS 规范与 [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/transform) 明确：transform 非 none 的元素会成为其包含的 fixed/absolute 后代的 containing block。后果是双重的——写在缩放层**内**的 `position: fixed` 弹层会相对设计稿容器而非视口定位；而 portal 到 body 的浮层（全局 toast、第三方组件）**不随舞台缩放**，与缩放后内容的尺寸/坐标系不一致。实践中要么接受"浮层随设计稿缩放"并全部写在层内，要么统一 portal 到层外并自行适配——两套坐标系并存是错位 bug 的温床。

**缺陷 2：指针坐标反推需手动换算（部分确证，常被夸大）**。需要澄清：浏览器的命中测试对 transform 是**自动正确**的——缩放层内的按钮点击不会失灵，"事件热区偏移"的传言只在一个场景成立：当你用 `clientX/Y` **反推设计稿坐标**时（拖拽定位、手写板取点、与 `getBoundingClientRect()` 混算），必须手动除以缩放倍率。mathpaws 的手写板正是踩在这个点上，解法见 §4.3。

**缺陷 3：文本/位图放大模糊（现象级，边界无定论）**。机制上 transform 缩放发生在合成器阶段：若被缩放层按缩放前尺寸光栅化再放大，`scale > 1` 时文字发虚。大屏社区普遍报告此现象（见 [大屏方案对比](https://blog.csdn.net/ZXH0122/article/details/128639247)），但现代 Chrome 对合成层会按变换后比例重光栅化，"必然模糊"与"现代浏览器已修复"两种说法都缺乏规范级定论。**可确定的是**：设计稿 1024 宽放到 2K/4K 屏要放大 1.5–2.5 倍，位图资产（背景、立绘）的清晰度瓶颈是真实的，与浏览器光栅化策略无关——位图就该按 `scale × dpr` 的实际上屏倍率出图。

**缺陷 4：占位不变导致的白边/滚动条（确证）**。transform 不改变元素在文档流中的占位，整页缩放后原占位仍在，可能出现底部白边或多余滚动条，需要容器 `overflow: hidden` 兜底（autofit.js 作者答疑中专门处理过此问题）。

**`zoom` 为何没有这些问题**：MDN 对 zoom 的描述是 "scales the targeted element, which **can affect page layout**"，对 scale() 的描述是 "does not cause layout recalculation"。布局级缩放意味着：文档流占位同步变化（无白边）、不产生新的 containing block 语义分叉（fixed 行为保持）、指针坐标系一致（无需换算）、文本按缩放后尺寸排版（矢量清晰）。代价是改动 zoom 触发重排——对"视口变化时一次性整页缩放"的场景无所谓。

---

## 4. mathpaws 落地架构

### 4.1 分层模型：内容 contain + 背景 cover bleed

方案骨架 = 游戏引擎 FIT 与 ENVELOP 的**分层组合**，实现在 `apps/web/src/app/viewport.tsx`：

```
视口
├─ BackgroundBleed（背景层）：absolute inset 0 铺满整个视口（含刘海区）
│   └─ 同一背景图 cover 出血 / 纯色 / 渐变 —— 填满 4:3 画布外的左右留边
└─ LogicalStage（内容层）：1024×768 逻辑画布
    └─ transform: translate(-50%,-50%) scale(min(vw/1024, vh/768)) 居中等比缩放
```

配套机制：

- **`useViewport()`**：订阅 `resize` / `orientationchange`，输出 `{ width, height, scale, portrait, small, dpr }`；DPR 钳制 ≤2（MatePad 实测 DPR≈2，横屏 CSS 视口约 1400×920，缩放比 >1 属预期，高分屏清晰）；
- **`OrientationGate`**：非阻断横竖屏门——竖屏（高>宽）顶部胶囊"建议横屏体验更佳"，横屏但高 <600 提示"建议平板"，正常放行；
- **safe-area 变量链**：`index.html` 配 `viewport-fit=cover` → `scaffold.css` 把 `env(safe-area-inset-*)` 暴露为 `--sat/--sar/--sab/--sal` → 场景内贴边元素自行 `calc()` 内缩，画布本身不裁切；
- **背景兜底**：位图 bleed 场景先垫兜底色（如天空蓝），图片加载完再覆盖，避免白屏闪烁。

### 4.2 三套布局策略：FIT 不是唯一答案

一刀切地让所有页面走 FIT 是常见错误。mathpaws 按页面性质分三派：

| 策略 | 适用 | 页面 |
|---|---|---|
| 固定像素（1024×768 逻辑画布，SceneShell 包裹） | 构图即设计的场景页 | Home / Plaza / Farm / PetPanel / Settings / Splash / HeroIntro / Adopt |
| 百分比 + aspectRatio 舞台（分辨率无关） | 以交互控件为主、构图弹性大的答题页 | Quiz / Result |
| clamp / vmin / 容器查询流式 | 面板类、网格类、组件密度高的页面 | Gacha / Backpack / ChestPanel |

判定原则：**元素间相对位置承载视觉语义 → 固定像素；内容本身是列表/表单/网格 → 流式**。值得注意的是 Backpack 一度被文档误归为固定像素场景，实际代码是流式——文档与实现漂移正是需要检查单的原因（§5）。

### 4.3 手写板坐标换算（缺陷 2 的实战解法）

手写板需要在祖先带任意 CSS scale 时把指针位置换算为画布逻辑坐标。通式（对任意缩放祖先都成立，不依赖读取具体 scale 值）：

```ts
// rect = canvas.getBoundingClientRect()（缩放后的实际框）；w/h = 画布逻辑尺寸
const x = (clientX - rect.left) * (w / rect.width)
const y = (clientY - rect.top) * (h / rect.height)
```

用 `getBoundingClientRect()` 的实际尺寸与逻辑尺寸的**比值**做换算，等价于除以 scale，但不需要知道 scale 是多少、也不受多层嵌套缩放影响。

---

## 5. 规范落地：让约定不靠自觉

适配方案本身几十行代码就能写完，**真正的工程量在"第 10 个新页面还跟第 1 个一样写"**。mathpaws 迁移前的状态很典型：9 个场景四种结构变体（bleed 包 stage / 平级 / fragment + url 背景 / 纯渐变）、字号规范 5 档但代码里散着约 20 种值、生图规范写了"4:3 安全框 + 横向 bleed"但 prompt 存档库 grep 零命中。收敛做了四件事：

### 5.1 SceneShell：把正确写法做成唯一写法

四种变体收敛为一个组件（`app/viewport.tsx`）， props 即全部自由度：

```tsx
// 收敛前（Home 为例）：每个场景各写一遍，结构还不一样
<div className={s.scene}>
  <BackgroundBleed background="#7dc9f2">
    <img src={bg} alt="" aria-hidden draggable={false} className={s.bleedImg} />
  </BackgroundBleed>
  <LogicalStage>
    <div className={s.stage}>{/* 内容 */}</div>
  </LogicalStage>
</div>

// 收敛后：一行接入，bleed 兜底色 + bleedImage cover 出血 + LogicalStage 三合一
<div className={s.scene}>
  <SceneShell bleed="#7dc9f2" bleedImage={bg}>
    <div className={s.stage}>{/* 内容 */}</div>
  </SceneShell>
</div>
```

7 个场景统一接入（onboarding 的 HeroIntro/Adopt 经共享的 SkyBackdrop 间接接入），各场景 css.ts 里 4 处重复的 bleed 样式随之删除。全屏弹层约定放 SceneShell 外（对应缺陷 1 的"浮层归口"原则）。

### 5.2 字号 token：5 档规范 vs 20 种散值的收敛

设计规范原定 5 档字号（title 30 / h2 22 / body 18 / aux 14 / question 64），但存量代码（含 ui 组件库自己）散着 12–84 的约 20 种值。处理策略是**适度收敛**——既不正视困难地全压回 5 档（视觉剧变），也不把 20 个值全命名进 token（等于没有规范），而是扩展为 9 档比例尺度、散值就近映射（±1–4px）：

| 新档位（逻辑 px @1024×768） | 语义 | 吸收的散值 |
|---|---|---|
| `micro` 12 | 超小标注 | 12、13 |
| `aux` 14 | 辅助 | 14 |
| `small` 16 | 次级正文 | 15、16、17 |
| `body` 18 | 正文 | 18、19 |
| `h2` 22 | 小节·按钮 | 20、21、22、23、24 |
| `title` 28 | 页标题 | 27、28、30（原 title 30 → 28） |
| `display` 36 | 大数字 | 34 |
| `hero` 48 | 特大展示 | 44、50、52 |
| `question` 64 | 答题题干/手写数字 | 64 |

适用范围与豁免同样重要：token 的值是**逻辑 px**，只对固定像素场景有意义——流式场景（clamp/vmin/cqw）、舞台外组件（toast）、dev 工具页明确豁免；装饰性 emoji 字号（如 EmptyState 的 84）保留字面量 + `eslint-disable` 注明理由。共迁移 ui 组件 20 处 + 场景 59 处，仅 1 处孤例豁免。

### 5.3 ESLint：把检查单前两条写进 CI

文档检查单拦不住"复制旧文件改一改"的新页面，强制手段是两条针对 vanilla-extract `css.ts` 的规则（`pnpm lint` 本就在 CI 中）：

```js
// eslint.config.mjs
{
  files: ['apps/web/src/**/*.css.ts', 'packages/ui/src/**/*.css.ts'],
  rules: {
    // 字号禁字面量 → 必须引用 FONT token
    'no-restricted-syntax': ['error', {
      selector: "Property[key.name='fontSize'][value.type='Literal']",
      message: '字号请使用 FONT token（@mathpaws/ui tokens.ts）；确需偏离用 eslint-disable 注明理由',
    }],
    // css.ts 禁 import 图片资产（ve 构建期求值不走资产管线）
    'no-restricted-imports': ['error', {
      patterns: [{ group: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.webp', '**/*.gif', '**/*.svg', '**/*.avif'] }],
    }],
  },
},
{
  // 豁免清单：流式场景 / 舞台外组件 / dev 工具页
  files: ['apps/web/src/scenes/{dev,Gacha,Backpack,Quiz,Result}/**/*.css.ts',
          'apps/web/src/components/{ChestPanel,ComingSoonToast}/**/*.css.ts'],
  rules: { 'no-restricted-syntax': 'off' },
},
```

要点：`no-restricted-syntax` 的 esquery 选择器只匹配**字面量**值（`[value.type="Literal"]`），引用 token 的 `fontSize: FONT.body`（MemberExpression）天然通过；豁免用整目录 override 而非散落行内注释，保持"豁免是架构决策、不是个人行为"。

### 5.4 检查单与 PR 模板：文档的最后一块

机器拦不住的维度（布局策略选型、safe-area 避让、指针坐标换算、生图构图）落成 7 条检查单（`docs/architecture.md` §6.1），PR 模板逐项引用。其中最有价值的一条来自一次缺口发现：设计规范 §8.2 早就写了"4:3 安全框 + 背景横向 bleed 铺满"，但审计生图 prompt 存档库（30+ 份存档）发现**没有任何一份 BG/PAGE prompt 声明出血构图**——留边区不出问题纯靠背景图边缘恰好没有关键内容。修复是把隐式运气变成显式字段：prompt 模板新增「安全区 / bleed」必填项（关键内容限定 4:3 安全框、左右出血区按 cover 可裁切设计、不得放关键元素与文字）。

---

## 6. 结论与可复用建议

**选型决策表**：

| 场景 | 推荐路线 |
|---|---|
| Canvas 游戏 | 引擎内建 FIT/ShowAll，别自己写 |
| DOM 固定构图（儿童应用/营销页/大屏） | FIT 等比缩放；新项目且浏览器允许 → 优先评估 `zoom`，存量 transform 方案可继续用 |
| DOM 流式内容（列表/表单/网格为主） | vw / clamp / 容器查询，不要整页缩放 |
| 多设备认真适配（含手机竖屏） | 响应式重排 + 容器查询，FIT 路线不适用 |

**transform 路线的生存清单**（如果继续用 scale）：

1. 浮层归口：全局弹层统一 portal 到 body（缩放层外）或统一写死在层内，二选一，不并存；
2. 指针反推坐标一律走 `getBoundingClientRect()` 比值换算（§4.3），不读取/硬编码 scale 值；
3. 容器 `overflow: hidden` 兜住占位不变的白边/滚动条；
4. 位图资产按 `scale × dpr` 上屏倍率出图，DPR 钳制 ≤2 平衡性能；
5. 用 `visualViewport` + `dvh` 替代裸 `innerHeight`，规避移动浏览器地址栏伸缩抖动。

**规范落地的排序**（投入产出从高到低）：先把正确写法收敛成唯一组件/函数（结构强制）→ 再把数值规范 token 化 + lint 拦截（机器强制）→ 最后才是检查单与 PR 模板（流程强制）。反过来做（先写文档）几乎一定漂移。

---

## 参考资料

**引擎缩放模式**
- [Phaser 3 Scale Manager 概念文档](https://docs.phaser.io/phaser/concepts/scale-manager) / [ScaleManager API](https://docs.phaser.io/api-documentation/class/scale-scalemanager)
- [Cocos Creator 多分辨率适配方案](https://docs.cocos.com/creator/2.4/manual/zh/ui/multi-resolution.html)
- [LayaAir Stage scaleMode](https://layaair.ldc.layabox.com/api/laya/display/Stage.html) / [LayaAir3 屏幕适配](https://www.layaair.com/3.x/doc-en/basics/common/adaptScreen/readme.html)
- [PixiJS Application（ResizePlugin）](https://pixijs.download/dev/docs/app.html)

**CSS / API 基线与机制**
- [MDN: CSS zoom（Baseline 2024）](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/zoom) / [Firefox 126 发布说明](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/126)
- [MDN: transform（fixed containing block 机制）](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/transform) / [MDN: position](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/position)
- [MDN: @container（Baseline 2023）](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@container) / [MDN: VisualViewport（Baseline 2021）](https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport) / [MDN: 视口长度单位](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length)

**DOM 适配路线**
- [lib-flexible 劝退说明（阿里云开发者社区转载）](https://developer.aliyun.com/article/1126249) / [pxToViewport 取代 lib-flexible（掘金）](https://juejin.cn/post/7537484912820895779)
- [前端大屏适配方案对比（含 scale 缺陷表）](https://blog.csdn.net/ZXH0122/article/details/128639247) / [autofit.js 作者答疑（白边/滚动条问题）](https://www.cnblogs.com/Kay-Larry/p/17408513.html)
- [H5 自适应布局最佳实践（掘金）](https://juejin.cn/post/7534008709216157723)

**mathpaws 内部文档**
- 适配层实现：`apps/web/src/app/viewport.tsx`（SceneShell / LogicalStage / BackgroundBleed / OrientationGate）
- 场景布局策略与检查单：`docs/architecture.md` §6、§6.1
- 字号 token 权威源：`packages/ui/src/tokens.ts`（`FONT`），设计规范 `docs/design-system.md` §4.2
- 生图 bleed 字段：`design/asset-prompts/_TEMPLATE.md`、`design/asset-prompts/README.md` 尺寸速查
