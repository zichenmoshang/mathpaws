# bg-sky · 天空背景

- **标准名**：bg-sky / 天空背景 / 浅蓝天空
- **版本**：v1-draft（2026-10-10，首批试用后转正）
- **使用方**：splash/home/farm/plaza 等主场景
- **图锚**：[anchors/style-tile.png](../anchors/style-tile.png) 第 1 行第 1 格

## 标准描述（prompt 引用段）

```text
浅蓝天空：明快通透的浅蓝色（sky/skyBg 系）自上而下的柔和渐变，
点缀若干圆胖白云；纯平无立体边、无阴沉感、无强烈太阳光斑。
```

## 使用要点

- 主基调背景：全站默认浅色氛围的载体；与夜场景（[bg-starry.md](bg-starry.md)）
  分区共存，互不串场；
- 云朵造型与 tile 样例一致（圆胖、釉面、少量），不画写实云层；
- 页面级使用时注意 4:3 安全框 + 横向 bleed（design-system §10.4）。
