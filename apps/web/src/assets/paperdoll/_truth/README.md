# \_truth —— dev 回归真值，非生产资产

本目录是换装 N+M 运行时合成的**离线烘焙回归真值**（forhat 身体 + per-body relit 帽层），
仅被 dev 回归页 `scenes/dev/PaperDollCompositeDev.tsx`（#paperdoll-rt，仅开发构建路由可达）
引用，用于逐行对比「离线烘焙 vs 运行时 composeLook」的像素一致性。

- **不进入生产 chunk**：生产构建中 dev 路由被 `import.meta.env.DEV` 裁剪，本目录不会被打包。
- 不要移动到生产图层目录（`layers/`），也不要被生产 UI / catalog 引用。
- 内容由 design/paperdoll-spike 离线管线生成；`assets/paperdoll/manifest.json` 的
  `truth_dir` 字段指向本目录，重新导出资产时由离线脚本维护。
