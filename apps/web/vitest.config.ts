import { defineConfig } from 'vitest/config'

// 单测/集成测试（node 环境，非浏览器 E2E —— E2E 见 playwright.config.ts）。
// 不加载 vite.config.ts：无需 vanilla-extract / PWA 等插件，保持测试管线最小。
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts'],
    setupFiles: ['src/test/setup.ts'],
  },
})
