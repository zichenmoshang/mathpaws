import { defineConfig, devices } from '@playwright/test'

// 视觉走查截图配置（visual-qa P1，见 docs/internal/visual-qa.md §4.1）——与 e2e 完全隔离：
// 独立 testDir（e2e-visual/）、独立基线（__screenshots__/）、独立产物（test-visual/）、
// 独立端口 4174（e2e 用 4173，可并行）；e2e 的 playwright.config.ts 不感知本文件。
// 注意 1：webServer 服务的是已构建 dist —— 运行前必须先执行
//   `corepack pnpm --filter mathpaws-client build`，否则跑到旧产物。
// 注意 2：请经 scripts/visual-test.mjs（visual:check/visual:update）启动——
//   本地浏览器二进制在仓库内 .pw-browsers，环境变量由包装器注入。
export default defineConfig({
  testDir: './e2e-visual',
  snapshotDir: './e2e-visual/__screenshots__',
  outputDir: './test-visual/results',
  timeout: 30_000,
  // 视觉比对不做重试：flaky 应通过抗噪（clock/mask/seed）消除，重试会掩盖问题
  retries: 0,
  reporter: [['list'], ['json', { outputFile: 'test-visual/report.raw.json' }]],
  use: {
    baseURL: 'http://localhost:4174/',
    trace: 'retain-on-failure',
    // 与 e2e 一致：拦截 PWA service worker，避免 SW 缓存干扰截图一致性
    serviceWorkers: 'block',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // 与 LogicalStage 1024×768 同比例（contain 无黑边），DSF 对齐 DPR 钳制上限
        viewport: { width: 1024, height: 768 },
        deviceScaleFactor: 2,
        reducedMotion: 'reduce',
      },
    },
  ],
  webServer: {
    // pnpm run 直传参数（不加 `--`，否则被当字面量吞掉，见 e2e config 的同类冗余）
    command: 'corepack pnpm run preview --port 4174',
    url: 'http://localhost:4174',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
