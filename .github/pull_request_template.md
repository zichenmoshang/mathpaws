## 变更说明

<!-- 简述改了什么、为什么 -->

## 新增场景 / 页面检查单

<!-- 不涉及新场景可删除本节；口径见 docs/architecture.md §6.1 -->

- [ ] 布局策略已定（固定像素 SceneShell / 百分比 + aspectRatio / 流式），并在 architecture.md §6 登记
- [ ] 固定像素场景用 SceneShell 包裹；bleed 兜底色 + bleedImage cover 出血；禁 objectFit: fill
- [ ] 字号走 FONT token（css.ts 无散值字面量）
- [ ] 贴边交互元素做 safe-area 避让（var(--sat) 等）
- [ ] css.ts 未 import 图片；keyframes 走 keyframes() / motion.css.ts
- [ ] 涉及拖拽 / 手写坐标：已按 rect 比例换算验证
- [ ] 新增背景图：prompt 存档含「安全区 / bleed」字段（design/asset-prompts）

## 验证

- [ ] `pnpm typecheck` / `pnpm lint` 通过
- [ ] 浏览器走查（窗口尺寸变化、竖屏提示、背景出血）
