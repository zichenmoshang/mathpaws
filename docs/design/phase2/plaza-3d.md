# 3D 广场实现方案（Plaza）

> **【冻结 · 二期档案】2026-10-04 拍板：广场实时 3D 整体转二期**（一期广场为 2D 静态页整页背景 + 热点，见 [../../PRD.md](../../PRD.md) §6）；本文留档，二期开工时直接续用。
> 版本：一期定稿　|　最后更新：2026-09-28
> 广场是 mathpaws **唯一的实时 3D 场景**与"游玩 / 探索枢纽"；其余页面全 2D。产品规则见 [../../PRD.md](../../PRD.md) §6，资产需求见 [../../design-system.md](../../design-system.md) §7.3，3D 台账 / 建模管线见 [asset-manifest.md](./asset-manifest.md) 与 [gen3d-guide.md](./gen3d-guide.md)。
> 视觉质感靶子 = `design/high-fi/plaza/plaza.png`（**不重出**，只做 Look Dev 对齐 + 局部返工）。

---

## 1. 定位与范围

- 3D 开放世界小广场：第三人称自由相机，主角用左手摇杆走动、右手拖动转视角，宠物双足跟随；可拾取浮题快速答题赚食物 / 贝壳、进农场、领宝箱、从顶部进学盒 / 背包 / 宠物。
- **一期固定白天好天气**（游戏内天气系统二期；不做现实天气播报）。
- **无体力系统**（不消耗、UI 不显示；二期触发时机 = 广场地图扩大 + 农场 3D 化）。

## 2. 场景布局与建筑（一期 3 座）

| 建筑 | ID | 一期形态 | 交互 |
|---|---|---|---|
| 农场 | bld-farm | 橙色瓦顶小屋 + 栅栏菜畦装饰 | **唯一可进入**：走近"进入"→ 2D 农场 P8，返回到广场 |
| 宠物商店 | bld-petshop | 粉色瓦顶 + 遮阳篷 + 橱窗 | 占位，走近提示"即将开放"（功能二期） |
| 许愿池 | bld-wishwell | 圆润 Q 版许愿池 | **摆 1 个模型、无功能**；玩法二期，暂定方向 A（每日免费 1 次），奖励机制后议 |

- **取消答题小屋（bld-quiz）**：正式 20 题答题只从首页进；广场只保留浮题快速答题。
- **学盒不是建筑（无 bld-gacha）**：学盒 / 背包 / 宠物都改为顶部 UI 图标入口。
- 地形 / 装饰：草地 + 石板路（无缝 TEX）、棉花糖树、灌木、花丛、花坛、路灯、长椅、栅栏；天空盒 + 远景 billboard 远树 / 云。
- **广场边界 + 建筑碰撞一期必须补齐**：不能走出地图、不能穿墙（越界拉回）。
- 【M5 待议】广场平面布局、**360° 盲区概念**（自由相机转到建筑背面时的处理 / 多角度概念设计）、装饰数量、场景切换过渡、广场 BGM。

## 3. UI 叠加（HUD）

- **左上**：返回首页（BackBtn）。
- **顶部居中**：3 个固定圆形图标入口 = **学盒（icon-gacha）/ 背包（icon-backpack）/ 宠物（icon-pet）**，业务组件 `TopNavEntries`。
- **右上**：资源胶囊 = 贝壳 / 花朵币（ResourcePill）；**食物不进顶部、不显示体力**。
- **左下**：虚拟摇杆（Joystick）；**右下 / 右屏**：拖动自由转视角（DragLook）。
- 浮题气泡、拾取 / 进入提示、点宠物的悬浮气泡为 3D 锚定的 2D（HTML/SVG/canvas），不建 3D UI 模型。
- 仓库 = 农场专属（种子 + 果实），**广场不出现仓库入口**；背包 = 人物装扮。

## 4. 角色、宠物与相机

### 4.1 主角
- **中性固定 GLB 一套**（char-hero，默认着装、humanoid、idle / walk）；不捏脸、不选性别；广场一期显示默认着装（2D 装扮不同步到 3D，3D 实时换装二期）。

### 4.2 宠物
- 一期 1 只雪球兔，**双足直立 Q 版**（非四足），humanoid 绑骨 idle / walk / jump；3 阶段以 Lv.3 为主模型、Blender 同模改版 s1/s2。
- **跟随（已实现并被认可，保留）**：路径点 / 圆弧滞后 + 速度惯性，与主角保持约 1.5–2 格；**转向不能线性突变**（此前"转向时位置快速横跳、过于线性"已修为自然弧线滞后）。
- **点宠物快捷交互（PetBubble）**：点击场景中跟随的宠物 → 蹦跳反馈 + 悬浮气泡，提供 **一键喂食（全部）** 与 **进入宠物面板** 两个动作；也可由顶部宠物图标进面板。浮题答对时宠物跳跃欢呼。

### 4.3 相机与操控
- 第三人称**自由旋转跟随相机**（体验已被用户明确认可）：右手拖动水平 360°、俯仰角 clamp（不翻到地下 / 不穿模）；左手摇杆相对相机方向移动（注意移动方向与镜头朝向一致，早期曾出现"左移人物往右走"的反向 bug，已修，回归需验证）。
- 不做 D-pad、不做点击移动、不做固定镜头；广场复杂后靠自由相机绕建筑。
- 标签页 hidden 时 RAF 暂停，回前台要正确恢复（resize / ResizeObserver 兜底）。

## 5. 浮题（快速答题）

业务组件 `FloatingQuestionBubble`，复用口算生成器（低难度）。

- **拾取流程**：靠近浮题 → 出现"拾取"按钮 → 点击弹出**简单口算三选一**（OptionButton，非手写）。
- **倒计时 5 秒**（CountdownRing）；**无跳过按钮**。
- 超时未答 / 答错：气泡**直接消失，不奖不罚、不展示答案、不进错题本**。
- **气泡下方显示该题奖励图标 + 数量**（食物或贝壳），与拾取收获契合。
- 奖励：随机 **食物 70% / 贝壳 30%**；单次食物 +1 / 贝壳 +5。
- 节奏：场上同时 **5 个气泡**，被答掉 / 消失后约 **60 秒补 1 个**；**每日上限 25 次**（与正式答题轮次分开计数，数值进 config）。
- 正式答题（首页进入的口算 / 真题）与浮题相互独立：正式答题不超时、错题进错题本；浮题不收错题。

## 6. 宝箱（ChestPanel）

- 3D 发光宝箱 prop-chest（克制 Bloom）；点击弹复用组件 **ChestPanel**（首页连学卡与广场宝箱共用同一面板、状态同步）。
- 每日一次，奖励按连学等级（PRD §13.8，去水滴）；当日已领则宝箱呈开启 / "明日再来"。

## 7. 渲染、质感与性能

### 7.1 Look Dev 质感锚（先立靶子再做资产）
- 在 `#lookdev`（`scenes/LookDev.tsx`）以 plaza.png 为靶子，调 `three/ClayMaterial.tsx`（Clay/vinyl PBR：**roughness 约 0.4–0.6 起调（润的搪胶，非哑光陶土；现状 0.88 偏哑需下调）**、metalness≈0、毛绒 fresnel sheen）、`SceneRig.tsx`（暖色主光软阴影 2048 + 半球补光 + 程序化 IBL）、`Effects.tsx`（**ACES Filmic 色调映射 + SSAO 接触阴影 / 环境光遮蔽 + 克制 Bloom（仅发光物）+ 轻 DOF 景深（远景 / 道具）+ 糖果色色彩分级 + SMAA + 轻 Vignette**），**固化为预设**；后处理按设备分级、低端自动降 / 关 DOF 与 SSAO；曝光 1.0 防过曝。后续每个 GLB / 材质回流到该预设下对比验收（视觉口径同 [design-system.md](../../design-system.md) §6.2）。
- 概念图是 Seedream 生成的理想单帧、无真实 3D 结构，实时 3D 会比原画差一档；目标是"质感神似、任意角度无穿帮"，而非逐像素 1:1。

### 7.2 性能预算（MatePad 集成 GPU，从严）
- DPR 钳制 ≤2；贴图 ≤1024（特写 2K）；主角 / 宠物 tris<15k、建筑<8k、设施道具<2k；场景总 tris<300k；GLB Draco/Meshopt。
- 单例 renderer + 场景状态机；离开广场 dispose 几何 / 材质 / 纹理、释放 WebGL（最近 GLB 可留缓存）；后处理按设备分级、帧率监控掉帧自动降质。
- 进广场前过 SceneTransition 显式加载（GLB / 纹理），首页停留时 requestIdleCallback 后台预取；LoadingManager 失败重试 + 占位，防白屏。

## 8. 文件结构（现状 → 目标）

```
apps/web/src/
├── scenes/
│   ├── Plaza.tsx          # 广场：3D Canvas + HUD 叠加
│   ├── LookDev.tsx        # 材质 / 光照 / 模型验证小样（质感锚）
│   ├── Farm.tsx / Quiz.tsx / PetShop.tsx / Gacha.tsx / PetSelectModal.tsx / BackScreen.tsx
├── three/
│   ├── Player.tsx         # 主角：摇杆移动 / 相机跟随 / 碰撞（移除体力逻辑）
│   ├── Building.tsx       # 3 座建筑 + 进入 / 即将开放提示
│   ├── Environment.tsx    # 草地 / 石板路 / 天空盒 / billboard / 装饰
│   ├── Interactables.tsx  # 浮题气泡 / 宝箱 / 拾取触发
│   ├── SceneRig.tsx       # 相机 + 光照 + IBL
│   ├── Effects.tsx        # Bloom / SMAA / Vignette（分级）
│   └── ClayMaterial.tsx   # 搪胶 / vinyl / 毛绒材质
├── config/  buildings.ts / floatingQuestions.ts / farm.ts / gachaPool.ts
├── components/（待建业务件）Joystick / DragLook / FloatingQuestionBubble /
│            EnterPrompt / TopNavEntries / PetBubble / NewUserGuide / ChestPanel ...
├── store/useGameStore.ts  # 【待按域拆分，去体力 / 水滴 / 宠物装备】
├── db/index.ts            # 【待分表 + version 迁移】
└── utils/mnist.ts         # 浮题为三选一不走手写；手写仅正式口算
```

## 9. 美术资产管线（2026-09 调研 / 实测结论，保留）

### 核心认知
- plaza.png 等是 2D 概念图（concept art），细节是"画"的理想单帧、无真实 3D 结构；实时 3D 实机通常比原画差一档，商城现成模型也"长得不像"。
- 高保真质感 = 表面纹理（草 / 瓦 / 木纹 / 黏土颗粒，需贴图）× 造型资产数量 × 会动的角色 / 宠物；纯色圆角几何只能到"方向对"。

### 路线：AutoDL 自建开源 Hunyuan3D-2.1 + Blender（已跑通）
- 云端 **Tripo / Meshy 免费版只能在线预览，下载 glb / 骨骼 / DCC Bridge 全部跳订阅，拿不到文件（已验证为死路）**。
- 当前主线 = AutoDL RTX4090 + 开源 **Hunyuan3D-2.1**：几何（DiT）+ 彩色 PBR 一次产出；操作见 [gen3d-guide.md](./gen3d-guide.md)（环境搭建 Runbook 在内部目录，不公开）。
  - 24G 卡贴图需把硬编码 conf 从 `max_num_view=8, resolution=768` 降为 **`max_num_view=6, resolution=512`**，并 `export PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True`（默认必 OOM；`--low_vram_mode` 对贴图只 empty_cache、不真正 offload）；48G 可满血。
- 绑骨 / 修模在 **Blender**（统一 humanoid + 耳朵 / 尾巴小骨）；付费兜底 fal.ai 按量（约 ¥2–3/个）。
- 宠物 / 主角统一 **humanoid 双足** + idle/walk（不依赖四足 rig）。
- 导出均为 GLB，R3F 用 `useGLTF` 加载；**不能整场景一次生成**，拆单物体分别出模再组装；单物体输入图要干净背景（Seedream 单独出或从整图裁）；导出**不要勾 Simplify Mesh**（兔子尾巴曾被吃掉）。

### 最小验证（Go/No-Go）
- 雪球兔为首个验证件：✅ 几何 + 彩色 PBR 已生成（Hunyuan 单图、6 视图 / 512，现有 `assets/models/pets/rabbit.glb`）；🔄 待 Blender 修一只空耳、补蓬松棉花糖尾、减面至约 1 万、humanoid 绑骨、导出；LookDev 验收（风格还原 + 可爱度 + 双足走路）通过后，按同管线批量：中性主角 → 3 座建筑 → 环境设施 → 宝箱。
- 2D core-ip（主角 / 兔）先行定稿并作为 GLB 建模锚图（REF 正侧 A-pose），保证 2D 与 3D 是"同一只 / 同一个"。
