# AI 图片资产 Prompt 存档库（asset-prompts）

本目录是 mathpaws 所有 **AI 生成图片资产** 的唯一 prompt 登记与人工确认存档。

## 硬性门禁（不可绕过）

> **任何 AI 图片，必须先在本目录提交 prompt 存档 → 用户人工确认 → 状态置为「已确认」→ 才允许调用生图工具。**
>
> 状态不是「已确认」的资产，禁止调用 `image_gen` / `image_edit`，也不得用"先出一张看看"变相绕过。

流程与状态：

```
草稿(draft)  --用户确认-->  已确认(approved)  --执行生成-->  已生成(done)
     |                            |
     |-- 驳回 --> 修改后回到 draft
```

1. **draft**：AI 填好完整 prompt、尺寸/比例、生成方式、参考图、可见文字清单、负面约束，等待确认。
2. **approved**：用户明确确认（或给出修改意见后回到 draft，再确认）。只有该状态可生成。
3. **done**：生成完成后回填结果（CDN URL / 本地路径、模型、比例、时间、是否采用）。未采用的候选也要留档并标注 superseded。

主流程之外的两个状态：

- **locked**：core-ip 类锚定资产。确认后作为该角色长期参考源锁定，不再变动；其所有衍生图一律以此图为 image_edit 参考。
- **superseded**：被新版本取代的旧稿（含未采用的候选），留档备查、不再使用。

## 品牌 IP 一致性（brand-ip）

- 中性主角、白雏鸟、雪球兔各先出 **1 张文生图（T2I）定 core-ip**，经用户确认；
- 此后该角色的**所有衍生图**（三视图、立绘、表情、姿态、场景、装扮、页面成图中的角色）一律用 **图生图（image_edit）并带上同一张 core-ip**，保持脸型/头身比/物种/配色/材质一致；
- **禁止**每张角色图各自独立文生图，禁止把多张独立生成图当成同一角色。

## 页面高保真构图规则（layout）

- **页面 / 面板类高保真左上角一律留空**，prompt 不得要求生成返回按钮；返回按钮是 UI 库的**独立标准组件**（位图），由前端运行时叠加，避免 bake 进成图后无法复用、也便于统一替换。
- 同理，底部主按钮、Tab 选中/未选中背景等通用控件均以**独立位图资产**登记生成，不要求模型在整页稿里画死；高保真只表达布局与风格意图。

## 页面级双锚与元素圣经（style-anchor，2026-10-10 起）

- **双锚必带**：PAGE / PANEL 类存档的参考图字段必须包含
  [`anchors/style-tile.png`](./anchors/style-tile.png)（元素语言锚：造型/釉面质感/薄边/标题形态）+
  [`anchors/palette.png`](./anchors/palette.png)（色调锚，与 `packages/ui/src/tokens.ts` C 同源）；
  场景页另加当页场景参考图。prompt 一律从 [`_TEMPLATE-page.md`](./_TEMPLATE-page.md) 起笔，
  固定段落（风格语言/通用规则/禁止词）不得改动。
- **元素圣经引用**：跨页元素（宝箱/胶囊/进度条/背景/标题艺术字等）的描述必须引自
  [`elements/`](./elements/) 对应条目并在存档注明条目与版本；条目缺失时先补条目再起草。
- 锚的变更须用户批准，并在 [anchors 台账](./anchors/README.md) 版本化登记。
- 验收量化项：色板匹配度抽检（[`anchors/check_palette_match.py`](./anchors/check_palette_match.py)）
  ≤60 距离 ≥90% 且 >90 ≤1%；中文文字逐字核对。

## 文件与命名

- 每个资产一个 md 文件：`<资产ID>-<短名>.md`，复制 `_TEMPLATE.md` 填写。
- 文件按类别归档到子目录：`core-ip/`（角色锚定）、`paperdoll/<系列>/`（素体与换装母图，新系列在其下新建系列目录）、`gacha/`、`pages/`、`ui/`。
- 资产 ID 与内部执行计划（`docs/internal/`，不公开）的资产批次对齐，例如 `G1-char-hero-core`、`P4-home-page`。
### 类别与生成物落点（新增存档先在 `_TEMPLATE.md` 头字段选定类别，四选一）

生图工具：文生图走 skill 的 generate.js；图生图（带参考图）用本目录 [`edit_ref_runner.js`](./edit_ref_runner.js)（绕 Windows 参数长度限制）。生成图先落本目录 `_tmp/`（gitignored），**用户确认后**按下表归档母图；固化工序再从归档母图落到 `apps/web` 资源目录，并在存档回填路径/URL。

| 类别 | 覆盖的存档目录 | 母图落点 | 下游工序 |
|---|---|---|---|
| pet（宠物） | `core-ip/` 的 pet-* | `design/gen3d-input/` | 图生 3D |
| paperdoll（换装母图） | `paperdoll/<系列>/`、主角 core-ip（G1） | `design/paperdoll-spike/masters/<系列>/` | step1–6 管线 |
| page（页面高保真） | `pages/` | `design/high-fi/<page>/` | `decomp.js` 拆层（工作区 `design/high-fi/_tmp/decomp-<page>`）→ hifi 资产 |
| ui（控件 / 元素） | `ui/`、`gacha/`、`core-ip/` 的 brand-bird | `design/ui/` | 固化进 `apps/web` 资源 |

## 尺寸速查（唯一事实源 = [../../docs/design-system.md](../../docs/design-system.md) §10）

| 类型 | 用途 | 比例/像素 |
|---|---|---|
| PAGE | 整页高保真/满版背景 | 4:3，2048×1536 |
| STAND | 角色/宠物 core、进化立绘（透明底） | 1:1，1024×1024 |
| POSE | 多姿态/多表情 | 4:3，2048×1536 |
| ICON / ITEM | 图标、道具、作物、装扮部件 | 1:1，512×512 |
| BG | 场景背景 | 4:3，2048×1536 |
| TEX | 无缝贴图 | 1024 或 2048，无缝 |
| REF | 图生 3D 输入（纯白底 A-pose） | 1:1，1024×1024 |

> 目标设备横屏，**没有 3:4 竖规格**。运行时会变化的数字（贝壳/价格/倒计时/分数/题干）一律用 Web 字体，不用位图拼接。
>
> **PAGE / BG 构图要求**：关键内容（角色面部、文字、控件、主体物）限定在 4:3 安全框内；左右出血区按 cover 裁切设计，不得放关键元素与文字——运行时舞台外留边以同一背景 cover 出血铺满（design-system §8.2）。存档时在模板「安全区 / bleed」字段声明。

## 登记表 INDEX

> 存档文件按类别归档到子目录，与「文件与命名」约定一致。

### core-ip（角色锚定）

| 资产 ID | 名称 | 类型 | 生成方式 | 状态 | 存档文件 | 结果 |
|---|---|---|---|---|---|---|
| G1-char-hero-core | 中性主角 core-ip（定锚；**2026-09-30 改以光脚默认装母图为锚**） | STAND/REF | T2I（seedream_5.0_pro） | **locked** | [`G1-char-hero-core.md`](./core-ip/G1-char-hero-core.md) | `design/paperdoll-spike/masters/default/dress-default-barefoot.png`（初锁候选 https://aka.doubaocdn.com/s/mrlfo0WwGM） |
| pet-rabbit-core | 雪球兔 core-ip（毛绒短绒质感；蓝项圈金骨牌） | STAND/REF | 既有图锁定 | **locked（2026-09-30）** | [`pet-rabbit-core.md`](./core-ip/pet-rabbit-core.md) | `design/gen3d-input/pet-rabbit.png` |
| brand-bird-core | 白雏鸟 core-ip（吉祥物**插画**，搪胶风带浅色外描边，刻意区别于宠物质感） | STAND | T2I（seedream_5.0_pro） | **locked（2026-09-30）** | [`brand-bird-core.md`](./core-ip/brand-bird-core.md) | `apps/web/src/assets/img/core/brand-bird-core@2x.png` |
| pet-dog-core | 小狗 core-ip（一期"即将开放"锁定占位） | STAND | T2I（seedream_5.0_pro） | **locked（2026-09-30）** | [`pet-dog-core.md`](./core-ip/pet-dog-core.md) | `apps/web/src/assets/img/core/pet-dog-core@2x.png` |
| pet-cat-core | 小猫 core-ip（一期"即将开放"锁定占位） | STAND | T2I（seedream_5.0_pro） | **locked（2026-09-30）** | [`pet-cat-core.md`](./core-ip/pet-cat-core.md) | `apps/web/src/assets/img/core/pet-cat-core@2x.png` |

### paperdoll（素体与换装母图）

| 资产 ID | 名称 | 类型 | 生成方式 | 状态 | 存档文件 | 结果 |
|---|---|---|---|---|---|---|
| paperdoll-body | 中性主角纸娃娃素体（内衣基底，切固定层） | STAND | I2I（edit core-ip） | **done 已验收（spike 通过）** | [`paperdoll-body.md`](./paperdoll/paperdoll-body.md) | https://aka.doubaocdn.com/s/TzoBbgeB2t |
| dress-job-explorer-full | 小探险家整身套装（换装 spike，切 hat/top/bottom/acc；acc 专用） | STAND | I2I（edit core-ip） | **done 已验收（spike 通过）** | [`dress-job-explorer-full.md`](./paperdoll/job-explorer/dress-job-explorer-full.md) | https://aka.doubaocdn.com/s/CTss4TXJgU |
| dress-job-explorer-top-noacc | 小探险家去望远镜补全马甲母图（切 hat/top/bottom 专用） | STAND | I2I（edit explorer-full） | **done 已验收（spike 通过）** | [`dress-job-explorer-top-noacc.md`](./paperdoll/job-explorer/dress-job-explorer-top-noacc.md) | https://aka.doubaocdn.com/s/V1rRGkBfRG |
| dress-job-scientist-full | 小科学家·戴护目镜穿鞋整身母图（v3，帽=护目镜，已去放大镜 acc） | STAND | I2I（edit core-ip） | done 已切层 | [`dress-job-scientist-full.md`](./paperdoll/job-scientist/dress-job-scientist-full.md) | `apps/web/src/assets/paperdoll/layers` |
| dress-job-scientist-barefoot-nohat | 小科学家·光脚摘护目镜整身母图（outfit nohat 来源） | ITEM | I2I（双参考 scientist-full+core-ip） | done 已切层 | [`dress-job-scientist-barefoot-nohat.md`](./paperdoll/job-scientist/dress-job-scientist-barefoot-nohat.md) | `apps/web/src/assets/paperdoll/layers` |
| dress-animal-frog-full | 小青蛙·戴蛙眼帽穿鞋整身母图（v3，帽=蛙眼帽，验证顶部外扩，已去荷叶包 acc） | STAND | I2I（edit core-ip） | done 已切层 | [`dress-animal-frog-full.md`](./paperdoll/animal-frog/dress-animal-frog-full.md) | `apps/web/src/assets/paperdoll/layers` |
| dress-animal-frog-barefoot-nohat | 小青蛙·光脚摘蛙眼帽整身母图（outfit nohat 来源） | ITEM | I2I（双参考 frog-full+core-ip） | done 已切层 | [`dress-animal-frog-barefoot-nohat.md`](./paperdoll/animal-frog/dress-animal-frog-barefoot-nohat.md) | `apps/web/src/assets/paperdoll/layers` |
| dress-festival-elf-full | 小圣诞精灵·戴尖顶帽穿鞋整身母图（festival 系列） | STAND | I2I（edit core-ip） | done 已切层 | [`dress-festival-elf-full.md`](./paperdoll/festival-elf/dress-festival-elf-full.md) | `apps/web/src/assets/paperdoll/layers` |
| dress-festival-elf-barefoot-nohat | 小圣诞精灵·光脚摘帽整身母图（outfit nohat 来源） | ITEM | I2I（双参考 elf-full+core-ip） | done 已切层 | [`dress-festival-elf-barefoot-nohat.md`](./paperdoll/festival-elf/dress-festival-elf-barefoot-nohat.md) | `apps/web/src/assets/paperdoll/layers` |
| dress-fantasy-wizard-full | 小魔法师·戴尖顶巫师帽穿鞋整身母图（fantasy 系列） | STAND | I2I（edit core-ip） | done 已切层 | [`dress-fantasy-wizard-full.md`](./paperdoll/fantasy-wizard/dress-fantasy-wizard-full.md) | `apps/web/src/assets/paperdoll/layers` |
| dress-fantasy-wizard-barefoot-nohat | 小魔法师·光脚摘帽整身母图（outfit nohat 来源） | ITEM | I2I（双参考 wizard-full+core-ip） | done 已切层 | [`dress-fantasy-wizard-barefoot-nohat.md`](./paperdoll/fantasy-wizard/dress-fantasy-wizard-barefoot-nohat.md) | `apps/web/src/assets/paperdoll/layers` |
| _superseded_ dress-job-scientist-top-noacc | v2 旧 4 槽草稿，已被 barefoot-nohat 取代（acc/top/bottom 槽已移除） | STAND | I2I | superseded（v3） | [`dress-job-scientist-top-noacc.md`](./paperdoll/job-scientist/dress-job-scientist-top-noacc.md) | — |
| _superseded_ dress-animal-frog-top-noacc | v2 旧 4 槽草稿，已被 barefoot-nohat 取代 | STAND | I2I | superseded（v3） | [`dress-animal-frog-top-noacc.md`](./paperdoll/animal-frog/dress-animal-frog-top-noacc.md) | — |

### gacha（抽卡）

| 资产 ID | 名称 | 类型 | 生成方式 | 状态 | 存档文件 | 结果 |
|---|---|---|---|---|---|---|
| gacha-box | 魔法学盒·关闭态正视图 | ITEM | T2I（seedream_5.0_pro） | done | [`gacha-box.md`](./gacha/gacha-box.md) | `apps/web/src/assets/gacha/gacha-box@2x.webp` |
| gacha-card-back | 抽卡卡背 | ITEM | T2I（seedream_5.0_pro） | done | [`gacha-card-back.md`](./gacha/gacha-card-back.md) | `apps/web/src/assets/gacha/gacha-card-back@2x.webp` |
| gacha-bg-starry | 抽卡星空背景 | BG | T2I（seedream_5.0_pro，无水印） | done | [`gacha-bg-starry.md`](./gacha/gacha-bg-starry.md) | `apps/web/src/assets/gacha/gacha-bg-starry@2x.webp` |
| gacha-box-open | 魔法学盒·开启态 3/4 侧视溢光 | ITEM | i2i（参考关闭态 gacha-box） | done | [`gacha-box-open.md`](./gacha/gacha-box-open.md) | `apps/web/src/assets/gacha/gacha-box-open@2x.webp` |

### pages（整页高保真）

| 资产 ID | 名称 | 类型 | 生成方式 | 状态 | 存档文件 | 结果 |
|---|---|---|---|---|---|---|
| P16-backpack-page | 人物背包/换装页高保真（无水印） | PAGE | T2I（seedream_5.0_pro） | done | [`P16-backpack-page.md`](./pages/P16-backpack-page.md) | `design/high-fi/backpack/backpack.png` |
| P4-home-page | 首页整页重出（纯学习枢纽：左列主角+s1兔+益智乐园，右侧 3 卡轮播） | PAGE | I2I 多参考（hero+rabbit 双锚点，seedream_5.0_pro） | **done（2026-10-01 一稿采用）** | [`P4-home-page.md`](./pages/P4-home-page.md) | `design/high-fi/home/home.png`（旧稿 v1 已于 2026-10-06 清理） |
| P5-plaza-page | 2D 广场原创稿（旧 plaza.png 拆层被版权拦截，重新文生图；无摇杆/状态栏/爱心） | PAGE | T2I（seedream_5.0_pro）+ layer_decomposition | **done（2026-10-04 拆层落地）** | [`P5-plaza-page.md`](./pages/P5-plaza-page.md)（事后补登） | `design/high-fi/plaza/plaza.jpg`、`apps/web/src/assets/hifi/plaza/*` |
| P12-daily-chest | 每日打卡重做（贝壳+食物、7 日星轨；旧稿奖杯/金币/爱心作废） | PANEL | T2I（seedream_5.0_pro）+ layer_decomposition | **done（2026-10-04 拆层落地）** | [`P12-daily-chest.md`](./pages/P12-daily-chest.md) | `design/high-fi/daily-chest/daily-chest.jpg`、`apps/web/src/assets/hifi/daily-chest/*`（旧稿 v1 已于 2026-10-06 清理） |

### ui（标准控件与图标）

| 资产 ID | 名称 | 类型 | 生成方式 | 状态 | 存档文件 | 结果 |
|---|---|---|---|---|---|---|
| UI-back-button | 标准返回钮（全页面复用，透明） | ICON | T2I（seedream_5.0_pro，无水印） | done | [`UI-standard-controls.md`](./ui/UI-standard-controls.md) | `packages/ui/src/assets/ui-back-button.webp` |
| UI-primary-button | 标准底部主按钮背景（9-slice，无文字） | ITEM | T2I（seedream_5.0_pro，无水印） | done | [`UI-standard-controls.md`](./ui/UI-standard-controls.md) | `packages/ui/src/assets/ui-primary-button.webp` |
| UI-tab-active | Tab 选中态背景（9-slice，无文字） | ITEM | T2I（seedream_5.0_pro，无水印） | done | [`UI-standard-controls.md`](./ui/UI-standard-controls.md) | `packages/ui/src/assets/ui-tab-active.webp` |
| UI-tab-inactive | Tab 未选中态背景（9-slice，无文字） | ITEM | T2I（seedream_5.0_pro，无水印） | done | [`UI-standard-controls.md`](./ui/UI-standard-controls.md) | `packages/ui/src/assets/ui-tab-inactive.webp` |
| P16-dressing-title | 「换装书房」标题艺术字 v2（透明） | ITEM | T2I（seedream_5.0_pro，无水印） | done | [`UI-standard-controls.md`](./ui/UI-standard-controls.md) | `apps/web/src/assets/ui/p16-dressing-title.webp` |
| P16-platform | 人物脚下椭圆平台（透明） | ITEM | T2I（seedream_5.0_pro，无水印） | done | [`UI-standard-controls.md`](./ui/UI-standard-controls.md) | `apps/web/src/assets/ui/p16-platform.webp` |
| M1-icon-set | 图标库批次2（37 个；单图 1024²·立体厚涂游戏图标风，透明 WebP） | ICON/ITEM/PANEL | T2I（rembg 抠图） | **done（2026-10-01）** | [`M1-icon-set.md`](./ui/M1-icon-set.md) | `apps/web/src/assets/img/icons/*.webp`、`.../img/farm/*.webp` |

> 其余整页高保真、装扮部件、作物道具、图标、背景随 M1–M5 批次在开工前逐批补登；**未登记不生成**。
