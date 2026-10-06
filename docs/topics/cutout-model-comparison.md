# 抠图模型选型对比：为什么白底去背最终落在 BiRefNet-lite

> **一句话摘要**：纸娃娃管线的"白底母图 → 透明图层"这一步，先后试过边界 flood-fill、生成模型去背、layer_decomposition 拆层、rembg+u2net，最终在 2026-10-03 的 A/B 后定型 **rembg + birefnet-general-lite**。本文记录五条路线的对比结论与适用边界，避免后人重走死路。
>
> **适用读者**：需要给"已画好的像素"去背 / 分层，且要求像素忠实、可复现、可批量的开发者。

---

## 1. 任务的硬要求

换装管线的抠图不是"差不多透明就行"，而是后续所有对齐的地基：

- **主体一个像素不改**：只算 alpha，不重绘、不调色——多层 / 多件要逐像素对齐；
- **确定性可复现**：同一张输入永远得到同一张输出，才能进批量管线与离线回归；
- **真透明 + 羽化边缘**：不能有白底、棋盘格假透明或深色残边；
- **本地、零配额、可批量**：不消耗生图额度，不依赖服务可用性。

拿这五条去卡，候选工具的生死一目了然。

---

## 2. 五条路线对比

| 路线 | 本质 | 像素忠实 | 可复现 | 致命伤 | 结局 |
|---|---|---|---|---|---|
| 边界 flood-fill（自实现） | 从图边灌水填背景 | ✅ | ✅ | 进不去两腿间等**封闭白区**；难分白衣与脚下**近白阴影** | 已废弃，仅坐标网格思路被 step1 继承 |
| 扩散模型"去背景"（Seedream 等） | 重画整图 | ❌ | ❌ | 漂移颜色 / 边缘 / 比例；常返回白底或棋盘格假透明，无可靠 alpha | 禁用（补画才用，见 §4） |
| `layer_decomposition` 拆层服务 | 按语义分堆现有像素 | ❌（重绘） | ❌（随机） | 不补遮挡（拿层留洞）、粒度不可指定、明确拒绝拆遮挡（HTTP 400） | 仅作多对象合成图的素材提取器，不进换装管线 |
| rembg + u2net | 分割模型，只算 alpha | ✅ | ✅ | 轮廓忠实度略逊（A/B 差 1–3px）；**脚下有深色残边**；首次下载撞 GitHub SSL 需镜像兜底（约 176MB） | 2026-10-03 起被替换，兜底代码已移除 |
| **rembg + birefnet-general-lite** | 分割模型，只算 alpha | ✅ | ✅ | —（同一 rembg API，零迁移成本） | **现默认** |

---

## 3. u2net → birefnet-general-lite 的 A/B（2026-10-03）

在光脚母图（`dress-default-barefoot`）上同图对比：

- **轮廓忠实度**：birefnet-general-lite 比 u2net 贴合 1–3px，发丝与搪胶边缘更准；
- **脚下残边**：u2net 在脚底接触阴影处留深色 rim，birefnet-general-lite 无此问题；
- **工程面**：两者同属 rembg，`new_session("birefnet-general-lite")` 一行切换，API 与 `post_process_mask` 行为一致。

当时的对比图已弃置，结论以代码常量为准（`step1_rembg.py` / `step2_layers.py` 中的 `birefnet-general-lite`）。u2net 曾保留为 argv 兜底，因其镜像下载脚本（撞 GitHub SSL 的 workaround）与 fallback 路径都已无实际调用，2026-10-06 一并移除。

---

## 4. 决策口诀：删像素用分割，补像素用生成

抠图与补画是两类任务，工具不可混用：

- **删背景 / 分离已画好的像素 → 分割模型（rembg + birefnet-general-lite）**：只算 alpha、主体不动、确定性、真透明羽化、可批量、零额度；
- **补画原图不存在的像素（inpaint）→ 生成模型（Seedream image_edit）**：光脚母图里被鞋挡住的脚、摘帽版里被帽压住的头发，分割无法凭空生成，必须生成模型补。

一句话：**生成模型不做抠图，分割模型不做补画。**

---

## 5. 运维注记

- rembg 2.x 必须**单独安装 onnxruntime**；Python 3.14 无 onnxruntime wheel，抠图脚本统一跑在 `design/.venv-art`（Python 3.12）；
- 模型权重首次运行自动下载，缓存在 `%USERPROFILE%\.rembg\models\`；
- 若本机网络对 GitHub 有 SSL 拦截导致权重下载失败，先确认失败的是哪个模型的下载源，再针对性配代理——不要再为单个模型写一次性镜像脚本进仓库。

---

## 附：相关文档

- 管线全貌与踩坑清单：[../design/paperdoll-system.md](../design/paperdoll-system.md)（§9 工具边界、§13 已验证死路）
- 拆层通道的边界与规格：[../design/hifi-ui-extraction-spec.md](../design/hifi-ui-extraction-spec.md)
- 高保真还原工作流（layer_decomposition 的正确用法）：[hifi-restoration.md](hifi-restoration.md)
