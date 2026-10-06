# P12-daily-chest · 每日打卡高保真重做（贝壳 + 食物 + 7 日星轨）

- **状态**：done（2026-10-04，用户确认按方案执行）
- **所属页面/批次**：每日打卡 ChestPanel（P12）/ M1-AST-03；M3-STREAK
- **类型**：PANEL（弹窗式高保真）
- **比例与像素**：4:3，2364×1773
- **生成方式**：T2I 文生图（seedream_5.0_pro，`watermark:false`），随后标准 layer_decomposition 拆层
- **采用结果**：[`design/high-fi/daily-chest.png`](../high-fi/daily-chest.png)；旧稿留存 `design/high-fi/daily-chest-v1-deprecated.png`

---

## 重做原因（口径变更）

- 旧稿奖励为奖杯/金币/爱心，且无"食物"产出，与新经济链路不符；
- 本期浮题取消，**食物改由口算结算与每日打卡发放**；体力/水滴/爱心均已删除。

## 定稿内容

| 区域 | 内容 |
|---|---|
| 标题 | 「每日打卡」 |
| 卷轴 | 「连续学习 N 天」 |
| 奖励卡 ×2 | 贝壳 x20、宠物食物 x2（图标 + 数量） |
| 7 日星轨 | 5 颗金色带勾 → 第 6 颗高亮蓝色带勾 → 第 7 颗半透明紫色 |
| 主按钮 | 金色大按钮「领取奖励」 |
| 氛围 | 深蓝星空 + 彩纸丝带 |

> 备注：原 Prompt 希望第 6 颗蓝星不带勾（高亮"今天"位），实稿带勾；用户确认不影响定稿。

## 拆层与落地（标准 layer_decomposition）

- 调用：`node design/paperdoll-spike/decomp.js design/high-fi/daily-chest.png design/paperdoll-spike/_tmp/decomp-chest`（不传 prompt，`watermark:false`）
- 产物：z0 背景 + 10 语义层（ribbon-left/right、stage、chest、scroll、card-shell、card-food、stars、title、button）
- 正式资产：[`apps/web/src/assets/hifi/daily-chest/`](../../apps/web/src/assets/hifi/daily-chest)（含 manifest.json，bbox 台账）
- **烘焙文字处理**：scroll / card-shell / card-food 三层上的烘焙文字在图层内擦除（保留羊皮纸质感），由前端排真实文案；脚本 [`design/paperdoll-spike/_tmp/erase_chest_text.py`](../paperdoll-spike/_tmp/erase_chest_text.py)，原图备份 `_tmp/decomp-chest/original/`
  - 擦除盒起点设在图标右缘（贝壳 x398、食物碗 x368），图标本体不遮挡
  - 重建方式：卷轴 = 左右干净带按行水平插值；卡片 = 上下干净行按列垂直插值，右侧用最右列延展
- 落点组件：[`apps/web/src/components/ChestPanel.tsx`](../../apps/web/src/components/ChestPanel.tsx)

## 交互口径

1. 打卡门控：`lastStudyDate === today`（完成 ≥1 轮答题，练习轮也计入）才可领取；未完成时领取钮置灰，提示先完成答题
2. 领取：贝壳 + 食物入账（数值取 config/streak，随连学等级）→「领取成功」0.9s → **弹框自动关闭**
3. 当天再次打开：置灰「已领取，明日再来」，按钮不可点击（`disabled` + 光标 not-allowed + `claim()` 入口硬拦截）
4. 首页/广场共用同一 streak 状态；已打卡**不影响继续学习**（首页"练口算"始终可进）

## 负面约束

- 不出现奖杯/金币/爱心/水滴/体力；不出现旧稿的多奖杯陈列
- 中文零错字、无水印、不贴边裁切

## 待办 / 风险

- 奖励卡数量、卷轴天数为前端动态排版（config/streak），位置按图层比例估算，真机终验时核对对齐
