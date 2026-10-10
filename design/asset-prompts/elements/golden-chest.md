# golden-chest · 金色宝箱

- **标准名**：golden-chest / 金色宝箱 / 金宝箱
- **版本**：v1-draft（2026-10-10，首批试用后转正）
- **使用方**：daily-chest（每日打卡宝箱）、gacha（抽卡箱）
- **图锚**：tile 无此样例（特殊大件）；既有成图 `apps/web/src/assets/gacha/gacha-box@2x.webp`

## 标准描述（prompt 引用段）

```text
金色圆润宝箱：箱身饱满圆角、哑光釉面金色（sun/orange 系）、箱盖微鼓带弧度、
圆润金属扣件与包边、柔和接触阴影；卡通 3D 黏土釉面质感，不写实、不做旧、
无尖锐棱角。
```

## 使用要点

- 开/关两态为两张资产（如 `gacha-box` / `gacha-box-open`），prompt 注明状态；
- 发光/彩带等氛围效果为独立图层描述，不 bake 进箱体；
- 宝箱上的装饰纹案（星星/贝壳等）引用对应图标条目，不自由发挥。
