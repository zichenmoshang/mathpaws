# 图生3D（Image-to-3D）操作手册

> 用途：把我们用 Seedream 5.0 Pro 生成的干净单物体图，转成可在 Three.js 里用的带骨骼 GLB。
>
> 工具归属（2026-09 更新）：云端 Tripo / Meshy **免费版只能在线预览、拿不到文件**，当前主线已改为 **AutoDL 自租 GPU + 开源 Hunyuan3D-2.1**（出几何 + PBR 贴图，绑骨在 Blender / Mixamo）；要省事可付费走 fal.ai 按量。下文方式 A/B/C 为云端路线（留档），**方式 D 才是当前实际执行路线**。
>
> 资产状态以 `docs/design/asset-manifest.md` 为准。

---

## 一、输入图要求（已由 Seedream 5.0 Pro 产出）

- 角色/宠物：**单主体、正面、A-pose 双足直立、手臂微张、纯白(#fff)底、完整入画、柔光、无文字/UI/阴影杂物**。
  - 面部必须有神：眼珠 + 高光 + 浅微笑 + 腮红，不可做成无眼/空洞（中性姿势 ≠ 没表情）。
  - 身份特征须与高保真对齐：雪球兔 = 白耳粉内耳、蓝项圈 + 金铃铛、棉花糖尾。
  - 材质为"细腻短毛绒 + 圆润软糖"，**不是纯光滑 clay**。
- 建筑/道具：单主体、3/4 正面视角、纯白底、无 UI 遮挡，材质为 soft clay。
- **毛发**：图生3D 不生成真毛，毛绒靠烘焙绒面贴图 + fresnel 边缘柔光模拟，不做真 fur。
- 注意：**不要把"正/侧/背三视图"拼在同一张图里**——图生3D 会把三个角度误判成一个物体。
- **推荐 Multi View（多视图）**：把正面、侧面（、背面）做成**各自独立的文件**，在 Tripo 的"多视图生成3D"里一起上传（支持 2~4 张：front/left/back/right）。这样侧面/背面有真实参考、比例更准，清理时间从小时级降到分钟级。单图模式则只传正面，背面靠 AI 推测。
  > 注：**Tripo 多视图通常需订阅**；免费版用「单张图片 + 正面图」即可完成验证，侧面图留档，订阅后或后期修正再用。
- 输入图统一放 `design/gen3d-input/<id>.png`。

---

## 二、方式 A：Tripo 网页手动（验证阶段零成本，推荐先用）

Tripo 官方免费额度约 **200~300 credits/月**（非商用、模型公开，协议以官网为准）。

1. 打开 Tripo 官网（tripo3d.ai），注册/登录。
2. 左侧选 **Image to 3D**，上传 `design/gen3d-input/<id>.png`。
3. 参数建议：
   - **Texture**：开启（保留 soft clay 颜色/贴图）；
   - 质量选 **Standard/高**；
   - 角色可开 **PBR**；不需要的话保持默认。
4. 点生成，等待约 1~3 分钟，得到预览模型（可拖动检查）。
5. **绑骨（角色/宠物必做）**：在生成结果上选 **Rig / Auto-Rig**，骨架类型选 **Humanoid / Biped（双足人形）**，自动绑骨。
   - 我们的宠物已统一为"双足直立萌兽"，所以人物和宠物都走同一套 humanoid。
6. 导出：选 **GLB**（含骨骼/动画），下载。
7. 放入项目：
   - 人物 → `apps/web/src/assets/models/characters/hero.glb`
   - 宠物 → `apps/web/src/assets/models/pets/rabbit.glb`（dog/cat 同理）
   - 建筑 → `.../buildings/*.glb`；道具 → `.../props/*.glb`
8. 通知我集成，我在 LookDev / 广场里加载并验证 idle / walk。

### 绑骨后检查清单
- [ ] 站姿自然，双臂不穿模、不扭曲；
- [ ] 走路时左右腿交替、重心不漂；
- [ ] 头/眼/耳等识别特征保留，可爱度不丢；
- [ ] 面数在预算内（主角/宠物 <15k tris，建筑 <8k，道具 <2k）；
- [ ] GLB 能被 `useGLTF` / `GLTFLoader` 正常加载，无报错。

### 预览期常见疑问（多为预览器现象，非模型缺陷）
- **轮廓锯齿**：Tripo 实时预览抗锯齿较弱，耳朵/手与深色背景交界处显锯齿；导出 GLB 后在 Three.js 用 `antialias`(MSAA) + 高 DPR(retina) + 后处理 SMAA 即可顺滑，贴图开 mipmap/各向异性，**不必为此重新生成**。
- **无真毛发、表情固定**：见第一节"毛发"，靠绒面贴图 + fresnel 边缘光，五官为烘焙贴图。
- **身后部件被脑补错（雪球兔实测）**：单张正面图把身后尾巴做成了细长尖尾（应为圆润棉花糖圆球），右大腿旁还多出小凸起。决定**不花 credits 做智能拆分/局部编辑**（拆分40 + 部件编辑 + 重贴图累计上百、且 AI 重做未必好）；先绑骨导出，工程里在臀部挂圆润白球遮挡、必要时隐藏细尾；批量阶段上多视图从源头根治。
- **导出权限实测（2026，关键）**：
  - **Tripo 免费版**：能生成、能在线看，但**下载/导出、导出骨骼、DCC Bridge 全部要订阅**（点导出提示"会员等级不足"，Bridge/骨骼带皇冠跳订阅页）。
  - **Meshy（2026 实测）**：免费版**所有模型（含轻量 T2/T1）点下载都弹 Pro 订阅页**（"无限 3D 模型下载"为 Pro 功能；Pro ¥58/月起、首月 ¥72.5、按年今天 ¥696）。早期"旧版可免费下载"的说法已过时。
  - **付费 / 商用**：① **fal.ai 按量**，Tripo image-to-3D 约 $0.2–0.4/个、可商用、免订阅、可脚本批量（最灵活）；② **Tripo 订阅 ¥273/首年**（~¥22.75/月），含多视图（根治身后/尾巴）、可直接导骨骼、750 积分（长期高频最省心）；③ Meshy Pro 较贵。
  - **本地开源（免费可商用、可批量）**：Hunyuan3D-2.x（贴图较好）/ Stable Fast 3D / TripoSR / TRELLIS；本机 AMD Radeon 780M 核显无 CUDA、只能 CPU/DirectML，较慢、质感比云端差一档，验证阶段不优先。
  - **结论（2026）**：Tripo / Meshy 免费版均**只能在线生成预览、拿不到文件**。要文件只有三条路：① **fal.ai 按量**（Tripo image-to-3D 约 $0.2–0.4/个、可商用、免订阅、可脚本下载，MVP 几个模型总成本仅 ¥10–30，**最推荐**）；② **订阅**（Tripo ¥273/首年最便宜、含多视图+直接导骨骼，长期高频最省心）；③ **本地开源**（Hunyuan3D-2.x / Stable Fast 3D / TripoSR，免费可商用、无限，但本机 AMD 780M 只能 CPU/DirectML、较慢、质感差一档、要搭环境）。
- **贴图质感一般 / 塑料感（T2 实测）**：免费轻量模型（T2/T1）只烘焙基础 albedo 固有色、**不带 normal/roughness 等 PBR 细节**，加上输入图柔光、投影会丢微观明暗，表面偏平偏光滑像塑料，属正常。毛绒质感主要靠**工程材质后期补**：MeshPhysicalMaterial 的 `sheen`（绒面逆反射）+ 高 roughness(0.85~0.95) + 程序化短绒法线/凹凸(tile) + fresnel/backscatter 边缘柔光 + 柔和环境光（LookDev 已验证这套）。要 PBR 全套高质感需 Meshy 高细节 / Tripo（付费下载），正式资产再换。

---

## 三、方式 B：Meshy 网页手动（静态道具备选）

- 免费额度约 **100~200 credits/月**（非商用）。
- 流程类似：Image to 3D → 上传 → 生成 → （静态物通常**不需要绑骨**）→ 导出 GLB/FBX。
- Meshy 的 clay/材质质感常更细腻，**静态建筑/道具**可优先对比它与 Tripo 的成品，选更好看的。

---

## 四、方式 C：API 自动化（验证通过、要批量时）

需要你提供对应平台的 API Key（我无内置图生3D工具，也不替你注册付费）。

- **fal.ai**：第三方模型聚合平台（非 Tripo 官方），统一 API、按次付费，Tripo image-to-3D 约 **$0.2~0.4/次**，适合写脚本批量。
- **Meshy API**：订阅制（约 $20/月起，含 API 额度）。
- 我可写 Node 脚本：读取 `design/gen3d-input/*.png` → 逐张提交 → 轮询结果 → 下载 GLB 到约定目录，并回写 asset-manifest 状态。
- 绑骨自动化以平台 API 能力为准；若 API 不支持自动 humanoid rig，则角色仍需在网页点一次 Auto-Rig。

---

## 四之 D、方式 D：开源模型 + AutoDL GPU（✅ 当前选定：可商用、免费、无限、支持多视图）

云端免费版（Tripo/Meshy）只能在线预览、下载要订阅。改用**开源权重 + 自租 GPU**：模型可商用、无限生成、能多视图输入（根治身后/尾巴）。

**模型选型（2026-09 核实）**
- **主力：腾讯 Hunyuan3D-2.1**（输出 PBR 网格 GLB）。两阶段 = Hunyuan3D-DiT（几何）+ Hunyuan3D-Paint（PBR：Albedo/Normal/Roughness/Metallic）。
  - 变体：标准 1.1B、mini 0.6B、**多视图 Hunyuan3D-2mv**（一致多视图、根治 Janus/身后/尾巴，**优先 2mv**）、Turbo。
  - 仓库：`github.com/Tencent-Hunyuan/Hunyuan3D-2.1`（2.0 在 `Tencent/Hunyuan3D-2`）。
  - 许可：**Tencent Hunyuan 社区许可**——可商用、可售卖生成资产、不可再分发权重；EU/UK/韩国本地部署受限（中国无影响）；MAU 超 100 万需另授权。（部分页面标 Apache 2.0，**以 GitHub 仓库 LICENSE 为准**。）
- 备选：微软 **TRELLIS-2**（几何 ULIP 略高 0.833 vs Hunyuan 0.827、许可宽松近 MIT，但 3090 等消费卡较慢、卡通贴图/可爱度不如 Hunyuan），用于交叉验证；**Stable Fast 3D** 用于道具快速预览。
- ⚠️ **MiniMax H3 不是图生3D**：它是**视频生成模型**（文/图生视频、2K/15秒/带立体声音频），输出视频、不输出网格，不能转 GLB。**留作它用**：开场动画、宠物进化过场、动作短片、宣传片（角色一致性强、自带音频）。
- 实战佐证（2026-09 独立开发者）：Hunyuan 免费可多视图可下载、贴图稍弱 → 下载后进 Blender 优化（减面、尾巴/耳朵摇动骨骼），与本方案一致。

**显存与租卡（2.1 官方数据，2026-09）**

| 版本 | 几何 | 贴图 | 合计 | 建议卡 |
|---|---|---|---|---|
| **Hunyuan3D-2.1**（几何 3.3B + PBR 贴图 2B） | 10GB | 21GB | **29GB** | **48G 单卡满血最稳**（A6000 / RTX6000 Ada / A100 40G）；4090 24G 实测：`--low_vram_mode` 对贴图**并不真正 offload（只 `empty_cache`）**，还须把硬编码 conf 从 `max_num_view=8,resolution=768` 降到 **`max_num_view=6,resolution=512`**，并 `export PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True`，才能跑过多视图贴图 |
| Hunyuan3D-2.0（几何 1.1B，RGB 贴图） | 6GB | — | 12~16GB | 4090 24G 满血、轻快 |

- 验证阶段推荐 **4090 + 2.1 + low_vram**（最省、能看 PBR 质感）；想快/省心上 48G 卡；2.1 太卡则退 2.0。
- 环境：**Python 3.11 + torch 2.5.1 + cu124**（官方 README 写 3.10，但 bpy 4.2 的 Linux pip 包仅 cp311，实测必须 3.11）。
- 关机不计算力费，环境/权重留存、下次开机续用。

**部署（详细 Runbook）**

完整、可复现的从零部署步骤（每步命令、报错与解法、检查清单、关机再开）见内部部署 Runbook（`docs/internal/`，不公开）。要点：

1. **社区镜像（最省事）**：创建实例 →「社区镜像」搜 `Hunyuan3D`，选 2.x 一键镜像（区分 1.x/2.x）。
2. **基础镜像手动**：PyTorch 2.5 镜像 + 自建 **Python 3.11** conda 环境（bpy 4.2 必须 3.11，官方 README 的 3.10 实测装不上 bpy）：
   - **无卡模式**先做完 clone / pip / 权重下载（省钱），**挂 RTX 4090** 后再编译两个 CUDA 扩展、启动；
   - torch 走 AutoDL 内网默认源（Linux 默认 wheel 即 cu124，**勿加国外 `--index-url`**）；
   - 权重用 `huggingface-cli download ... --local-dir`，并打 **`local_patch.py`** 把 `snapshot_download` 重定向到本地（否则只认 HF 缓存、反复联网超时）；另需 `pip install "setuptools<80"`（旧 pytorch_lightning 要 pkg_resources）；
   - 4090 24G 启动必须带 `--low_vram_mode`。

**使用与输出**
- Gradio 起在容器 **8080**（非 7860）：本地用 `ssh -L 18080:localhost:8080 ...` 转发后开 http://localhost:18080；或重启时 `export GRADIO_SERVER_PORT=7860`、用 AutoDL「自定义服务」拿公网链接。
- 上传 `pet-rabbit.png` → 几何（octree resolution 调高）→ PBR 贴图 → **导出 GLB**。导出前**勿勾 Simplify Mesh**（会删掉尾巴等小特征），减面放 Blender 可控进行。
- 批量：我另写 `ml/gen3d/infer.py`（读 `design/gen3d-input/*.png` → 几何+贴图 → 存 GLB），上传实例一键批量。
- 结果经 Jupyter 文件管理器下载，落到 `apps/web/src/assets/models/...`。

**绑骨与质感**
- 输出是静态网格，仍需绑骨：双足走 **Mixamo**（Blender→FBX→Auto-Rig + idle/run→GLB）；**尾巴/耳朵摇动**在 Blender 加少量骨骼。
- Hunyuan 已带 normal/roughness（优于 T2），再叠工程毛绒材质（sheen + 高 roughness + 短绒法线 + fresnel，见常见疑问）。

**成本**：首次租卡+拉权重+跑通约 1~2 小时（几块钱），之后每个模型几十秒、可关机；产出归自己（Apache 2.0）。

---

## 五、验证里程碑（第一个：雪球兔）

1. ✅ 输入图 `pet-rabbit.png`（正面 A-pose、纯白底、短毛绒质感）。
2. ✅ AutoDL 租 RTX 4090，部署 **Hunyuan3D-2.1**（Python 3.11，见方式 D / Runbook）。
3. ✅ **单图**生成几何 + PBR 贴图成功（conf 降为 6 视图 / 512 + expandable_segments；彩色雪球兔已出）。未用多视图 2mv，背面靠 AI 推测。
4. 🔄 导出带贴图 GLB（进行中；已发现一只耳朵空，待 Blender 修）。
5. ⬜ Blender：修耳朵（重算法线 / 破洞封口）、补蓬松大尾巴、绑骨（idle/run + 耳朵、尾巴微动）、可控减面至约 1 万。
6. ⬜ 导出落 `apps/web/src/assets/models/pets/rabbit.glb`。
7. ⬜ LookDev 加载：模型居中、毛绒 sheen + 灯光正确、双足走路自然、可爱度不丢。
8. ⬜ 通过后按同一管线批量：主角 → 另两只宠物 → 建筑 → 道具。

> 若雪球兔这一管线（风格还原 + 可爱度 + 绑骨 + 走路）验证通过，说明整条 image-to-3D 路线成立，再批量；不通过则先调整输入图或换工具，不批量。
