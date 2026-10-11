# anchors · 全站风格锚台账

> 风格锚是 I2I 生图的**参考图资产**：所有页面/面板/组件生图按
> [asset-prompts 门禁](../README.md) 必带双锚（style tile + 色卡）。
> 锚的变更走版本化登记（改锚 = 改全站基准，须用户批准并记录原因）。

| 锚 | 文件 | 来源 | 版本 | 启用日期 | 用途 |
|---|---|---|---|---|---|
| style tile | [style-tile.png](style-tile.png) | seedream_5.0_pro I2I（参考 palette.png）；prompt 存档 [style-tile.md](style-tile.md) | **v2**（2026-10-10 去投影：T2I 重抽"贴纸式无影"prompt + 3 处精准编辑（进度条平滑渐变/胶囊去蓝边/学习单层云底托）；v1 带影稿、编辑版、拆层合成版均留 `_tmp/`；与 M0 标准控件"无投影"语言统一） | 2026-10-10 | 全站 UI 元素语言锚（十类 22 枚 + 2 组：造型/釉面/薄边/标题/图标形态，**无投影**） |
| 色卡 | [palette.png](palette.png) | [gen_palette.py](gen_palette.py) 生成（PIL），色值与 `packages/ui/src/tokens.ts` C 同源（tokens.test.ts 断言守护） | **v1** | 2026-10-08 | 全站色调锚（19 色 I2I 参考） |

## 配套工具

- [gen_palette.py](gen_palette.py)：色卡生成脚本（改 tokens.ts C 后必须重跑）；
- [check_palette_match.py](check_palette_match.py)：色板匹配度抽检
  （生图验收维度 2 的量化项；合格线：≤60 距离 ≥90% 且 >90 ≤1%，2026-10-10 按
  style tile 实测校准）。

## 角色/图标锚（既有，登记位置不同）

- 角色 core-ip：雪球兔 / 主角 / 白雏鸟各锁 1 张，见 `core-ip/` 目录与对应设定文档；
- 图标锚：i-shell 金色贝壳（图标批次风格基准），见 [../README.md](../README.md)。
