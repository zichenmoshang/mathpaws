# 3D 资产清单（Asset Manifest）

> **【冻结 · 2026-10-05】2026-10-04 拍板：广场实时 3D 整体转二期，本台账随之冻结**；rabbit.glb 与 Hunyuan 环境部署 Runbook 留档于内部目录（不公开），二期直接续用。
> 一期实际落地的 2D 拆层资产台账在各页面目录：`apps/web/src/assets/hifi/<page>/manifest.json`（home / plaza / quiz / result / daily-chest / splash / farm / settings / pet）。
>
> 用途：跟踪 mathpaws **广场实时 3D** 全部 GLB / 纹理资产的状态，配合 AI 图生 3D（Hunyuan3D）+ Blender 修模绑骨流程。
>
> 状态流转：`待出图 → 待生成 → 已生成 → 已修模绑骨 → 已集成 → 已验收`
>
> 当前主线（2026-09）：云端免费版 Tripo / Meshy 拿不到 glb / 骨骼 / 多图（全订阅，已验证为死路），改 **AutoDL RTX4090 + 开源 Hunyuan3D-2.1** 出几何 / 彩色 PBR，**Blender 修模 / 绑骨 / 减面 / 导出**。建模操作见 [gen3d-guide.md](./gen3d-guide.md)（环境搭建 Runbook 在内部目录，不公开）。
>
> 📋 本台账只管 3D；**页面组件 ↔ 位图资产映射见 [../../design-system.md](../../design-system.md) §7.3**；视觉质感规范同文。
>
> **一期范围原则：仅广场实时 3D；农场是 2D（其道具不入 3D）；学盒 / 背包是顶部 UI 图标（无建筑）；一期宠物仅雪球兔。**

---

## 一、角色与宠物（humanoid 双足；Hunyuan 出模 + Blender 绑骨；A-pose）

| ID | 物体 | 形态要点 | 输入图 | 状态 |
|---|---|---|---|---|
| char-hero | **中性主角**（重新设计、固定一套、默认着装，无性别符号、不捏脸） | Q 版儿童、大头、圆润搪胶、默认中性服 | ref-hero 正+侧 A-pose 纯白底（待 G0 出） | 🔲 待出图（依赖中性主角 core-ip 定稿） |
| pet-rabbit-s3 | 雪球兔 **Lv.3 成年主模型**（特征最全，绑骨 待/走/跳） | 白色双足直立兔、白耳粉内耳、大眼高光、蓝项圈金铃铛、小短手、**蓬松棉花糖尾** | `pet-rabbit.png` 正面 + `pet-rabbit-side.png` 侧面（已出） | 🔄 几何 + 彩色 PBR 已生成（Hunyuan 单图、6 视图 / 512）；现有 `apps/web/src/assets/models/pets/rabbit.glb`。**待修**：一只耳朵空 / 缺、尾巴被 Simplify 吃掉只剩小贴球、有锯齿；待 Blender 补蓬松尾 / 修耳 / 减面 / humanoid 绑骨 / 导出 |
| pet-rabbit-s2 / s1 | Lv.2 / Lv.1 幼态 | **同模 Blender 改版**（放大头眼、缩小身体、减附件、调圆润），共用骨架 / 贴图 / 动画，保证进化连续 | 由 s3 改版，不单独建模 | 🔲 待 s3 验收后改版 |
| ~~pet-dog / pet-cat~~ | 布丁犬 / 电光猫 | — | — | **二期**；一期 P3 选宠 / P9 图鉴仅用 2D pet-locked 占位"即将开放"，不建 3D |

> 导出注意（踩坑记录）：Hunyuan / 导出时**不要勾 Simplify Mesh**（侧面尾巴曾因此消失）；减面在 Blender 里受控进行并保留尾巴 / 耳朵；导出 glb 前确认骨骼 / 动画完整。

## 二、建筑（静态；一期 3 座；3/4 正面视角、纯白底、无 UI）

| ID | 物体 | 形态要点 | 一期形态 | 状态 |
|---|---|---|---|---|
| bld-farm | 农场小屋 | 橙色瓦顶、木栅栏、菜畦装饰（稻草人 / 小鸡 / 胡萝卜筐可作装饰贴花或省略，农场内部是 2D） | **唯一可进入**（走近→进入 2D 农场 P8） | 🔲 待出图 |
| bld-petshop | 宠物商店 | 粉色瓦顶 + 遮阳篷、拱形橱窗、爪印灯箱、台阶 | 占位，交互弹"即将开放" | 🔲 待出图 |
| bld-wishwell | 许愿池 | 圆润 Q 版许愿池（水池 + 硬币 / 星光），搪胶风 | 摆模型占位，**功能 / 奖励二期**（暂定玩法 A：每日免费 1 次，后续单议） | 🔲 待出图 |
| ~~bld-quiz~~ | ~~答题小屋~~ | — | **取消**：正式答题只从首页进，广场只保留浮题快速答题 | — |
| ~~bld-gacha~~ | ~~学盒建筑~~ | — | **取消**：学盒改广场顶部 UI 图标 | — |

## 三、环境与植被（静态，可复用）

| ID | 物体 | 形态要点 | 状态 |
|---|---|---|---|
| env-ground | 草地 + 石板路 | 草地用无缝草纹理 / 材质（非密集模型），含斑驳深浅；石板路用 TEX 或低模圆角石板拼接 | 🔲 待处理（含 TEX 草地 / 石板无缝纹理） |
| env-tree | 棉花糖树 | 多个重叠圆润球组成花椰菜状树冠、棕色短干 | 🔲 待出图 |
| env-bush | 灌木 | 2–3 个重叠圆润球 | 🔲 待出图 |
| env-flower | 花丛 | 茎 + 圆头花，多配色（复用） | 🔲 待出图 |
| env-planter | 花坛 | 圆角花箱 + 多朵花（原 prop-planter 归入环境） | 🔲 待出图 |

## 四、设施（静态，可复用）

| ID | 物体 | 形态要点 | 状态 |
|---|---|---|---|
| fac-lamp | 路灯 | 黑色 / 深色灯柱 + 圆润灯罩 | 🔲 待出图 |
| fac-bench | 长椅 | 木板座 + 椅腿 + 靠背 | 🔲 待出图 |
| fac-fence | 木栅栏 | 木桩 + 横杆（段，复用） | 🔲 待出图 |

## 五、道具（静态）

| ID | 物体 | 形态要点 | 状态 |
|---|---|---|---|
| prop-chest | 发光宝箱 | 木箱 + 金边、发光（克制 Bloom）；首页 / 广场共用每日打卡 | 🔲 待出图 |

> **一期 3D 道具仅 prop-chest。** 以下随农场 2D 化、**不建 3D**：~~prop-bowl 宠物碗~~（喂食在 2D 宠物面板 / PetBubble）、~~prop-scarecrow / prop-cropbed / prop-carrotbasket~~（农场 2D 装饰 / 作物）。浮题气泡、摇杆、顶部图标、返回等均为 2D（HTML/SVG/canvas），不生成 3D。

## 六、天空 / 全景 / 纹理

| ID | 内容 | 形态要点 | 状态 |
|---|---|---|---|
| skybox | 360° 天空全景 | 固定白天好天气、马卡龙蓝天 + 软云；程序化天空 / 天空盒 | 🔲 |
| billboard | 远景远树 / 云 | 贴片（billboard）做纵深，低成本 | 🔲 |
| TEX-grass / TEX-stone | 草地 / 石板无缝 PBR 纹理 | 1024 / 2048 无缝 tile | 🔲 |

---

## 合计（一期）

- 独立建模：角色 2（char-hero、pet-rabbit-s3；s1/s2 为同模改版不另计）+ 建筑 3 + 环境 5 + 设施 3 + 道具 1 = **14 个独立模型**（兔子另衍生 s1/s2 两形态 glb）。
- 外加 skybox / billboard / 2 张无缝 TEX。
- 布丁犬 / 电光猫及任何农场道具均不在一期 3D 范围。

## 命名与目录
```
apps/web/src/assets/models/
├── characters/  hero.glb                       # 中性主角，一套
├── pets/        rabbit-s3.glb rabbit-s2.glb rabbit-s1.glb   # s3 主模型，s1/s2 改版
├── buildings/   farm.glb petshop.glb wishwell.glb
├── environment/ ground.glb tree.glb bush.glb flower.glb planter.glb
├── facilities/  lamp.glb bench.glb fence.glb
└── props/       chest.glb
apps/web/src/assets/textures/  grass.webp stone.webp（无缝 tile）
```
> 当前已就位：`apps/web/src/assets/models/pets/rabbit.glb`（pet-rabbit-s3 的早期未修版，可加载性 / 面数 / 骨骼 / 是否 Draco 待验证）。
> 输入图（图生 3D 用）放 `design/gen3d-input/<id>.png`（现有 pet-rabbit.png / pet-rabbit-side.png）。

## 输入图规范
- 角色 / 宠物：**A-pose 双足直立**、手臂微张、纯白 (#fff) 底、正面 + 侧面、完整入画、柔光、无文字 / UI。
- 建筑 / 道具：3/4 正面视角、纯白底、完整入画、柔光、无 UI 遮挡。
- 材质风格：**人物 / 宠物 = 细腻短毛绒 + 圆润软糖（plush-clay）**（表面细微绒面、圆润饱满、哑光、马卡龙色）；**建筑 / 道具 = soft clay 软糖 / 黏土风**。
- 面部必须有神：即使 A-pose 中性脸也要有眼珠 + 高光 + 浅微笑，不可无眼 / 空洞。
- **毛发技术**：图生 3D 只出光滑几何、不产生一根根真毛；毛绒感靠"输入图带短绒 → 烘焙绒面 albedo/normal + 后期 fresnel 边缘柔光 (sheen)"模拟，**不做真 fur**（Pad 性能 / 绑骨不允许）。
- 主角 / 宠物的 2D core-ip 先行定稿，REF 正侧视图据 core-ip 出，保证 2D 与 3D 是"同一只 / 同一个"。

## 性能 / 验收预算（MatePad，横屏）
| 类型 | tris 上限 | 贴图 |
|---|---|---|
| 主角 / 宠物 | < 15k | ≤1024 |
| 建筑 | < 8k | ≤1024 |
| 设施 / 道具 | < 2k | ≤512（特写可 1024） |

- 场景总 tris 目标 < 300k；GLB 用 Draco / Meshopt 压缩；贴图 ≤1024（特写 2K）。
- 验收：风格匹配 plaza.png 搪胶质感、可爱度、能干净绑骨 / 走路、任意角度无穿帮；集成后在 Look Dev 预设下对比（见 [plaza-3d.md](./plaza-3d.md)）。
