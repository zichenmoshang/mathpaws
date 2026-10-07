import { defineConfig, devices } from '@playwright/test'

// Playwright E2E 冒烟配置（仅 chromium）。
// 注意：webServer 使用 `vite preview`，服务的是已构建的 dist ——
// 本地或 CI 运行前必须先执行 `corepack pnpm --filter mathpaws-client build`，
// 否则 preview 起不来或跑到旧产物（CI 中 build 步骤位于 e2e 之前）。
// 设置 E2E_BASE_URL 时改为直打该地址（部署后冒烟），不再启动本地 preview。
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:4173/'

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  // CI 上失败重试 1 次，吸收偶发抖动；本地不重试
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    // 拦截 PWA service worker 注册，避免 SW 缓存干扰用例
    serviceWorkers: 'block',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'corepack pnpm run preview -- --port 4173',
        url: 'http://localhost:4173',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
})
