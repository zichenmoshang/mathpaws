# P5-plaza-page · 2D 广场原创整页高保真

- **状态**：done（2026-10-04 拆层落地；2026-10-06 事后补登存档）
- **所属批次 / 消费方**：M5；P5 广场页（2D 静态整页背景 + 热点；实时 3D 已于 2026-10-04 拍板转二期）
- **类型**：PAGE
- **比例与像素**：4:3，2364×1773
- **生成方式**：T2I 文生图（seedream_5.0_pro）
- **后处理**：layer_decomposition 拆层
- **参考图 / core-ip**：无（场景原创文生图）
- **采用结果**：`design/high-fi/plaza/plaza.jpg`；[`apps/web/src/assets/hifi/plaza/`](../../../apps/web/src/assets/hifi/plaza)（bg + 13 语义层 + manifest.json）

---

## Prompt（原始文本未存档）

> 2026-10-04 在会话内直接执行文生图，**原始 prompt 未即时存档**（本目录门禁此前未覆盖该批次）。
> 以下为依据拆层产物反推的画面要点，仅供复核与衍生参考，**非原始提交文本**。

## 定稿内容（依据拆层产物）

| 区域 | 内容 |
|---|---|
| 背景 | 2D 等距广场全景原创稿（替代旧 plaza.png 拆层方案，旧稿因版权拦截作废） |
| 建筑 ×3 | 答题（bld-quiz）、宠物店（bld-petshop）、农场（bld-farm） |
| 招牌 ×3 | sign-quiz / sign-petshop / sign-farm |
| 热点按钮 | btn-farm（农场）、btn-pet（宠物）、btn-backpack（背包） |
| 装饰 | 农场稻草人（farm-scarecrow）、宠物店橱窗宠物（petshop-pets）、屋顶白雏鸟（roof-bird） |

## 可见文字清单

- 烘焙文字以三张招牌为限（具体内容以 manifest 台账为准）；运行时动态文字一律前端排版。

## 负面约束（禁止项）

- 不出现旧稿元素：摇杆、状态栏、爱心；
- 左上角留空，不生成返回按钮（layout 规则，返回钮为 UI 独立位图组件）。

## 确认记录

- 2026-10-04：用户确认按"原创文生图 + 标准 layer_decomposition 拆层"执行，一稿采用并落地。
- 2026-10-06：事后补登存档。原会话 prompt 未即时存档，本档以成图与拆层产物事实重建。
