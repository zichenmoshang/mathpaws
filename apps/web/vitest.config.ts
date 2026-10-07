import { defineConfig } from 'vitest/config'

// 单测/集成测试（node 环境，非浏览器 E2E —— E2E 见 playwright.config.ts）。
// 不加载 vite.config.ts：无需 vanilla-extract / PWA 等插件，保持测试管线最小。
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts'],
    setupFiles: ['src/test/setup.ts'],
    // 覆盖率仅打标基线（pnpm test:coverage / CI 出报告），不设硬门槛。
    // 统计范围限定逻辑层；scenes/components/three 等 UI 层不在基线内（口径：UI 由人工走查 + E2E 兜底）。
    coverage: {
      provider: 'v8',
      include: ['src/content/**', 'src/config/**', 'src/db/**', 'src/stores/**', 'src/utils/**'],
      exclude: ['**/__tests__/**', 'src/test/**'],
      reporter: ['text', 'html'],
    },
  },
})
