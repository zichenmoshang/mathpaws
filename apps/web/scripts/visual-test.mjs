#!/usr/bin/env node
// visual 测试包装器（visual-qa P1）。
// 本地沙箱写不了默认浏览器目录（%LOCALAPPDATA%/ms-playwright），浏览器二进制装到
// 仓库内 .pw-browsers（gitignored）。必须在 playwright 进程启动前注入
// PLAYWRIGHT_BROWSERS_PATH——在 config 里设置太迟（registry 路径已按默认缓存）。
// CI 保持默认路径。
// 用法：
//   node scripts/visual-test.mjs [--update-snapshots | ...]   # 等价 playwright test -c playwright.visual.config.ts
//   node scripts/visual-test.mjs install chromium             # 首次安装浏览器（装到 .pw-browsers）
import { spawnSync } from 'node:child_process'
import path from 'node:path'

// 真 CI（GitHub Actions）用默认浏览器路径；本地强制仓库内 .pw-browsers。
// 注意：不能用 process.env.CI 判断——Trae 终端会注入 CI 变量但它是本地环境。
if (!process.env.GITHUB_ACTIONS && !process.env.PLAYWRIGHT_BROWSERS_PATH) {
  process.env.PLAYWRIGHT_BROWSERS_PATH = path.resolve('.pw-browsers')
}

const args = process.argv.slice(2)
const pwArgs = args[0] === 'install'
  ? args
  : ['test', '-c', 'playwright.visual.config.ts', ...args]

// 与已验证可用的路径一致：经 pnpm exec 启动 playwright（shim 会补全 .bin 环境与进程树）
const bin = process.platform === 'win32' ? 'corepack.cmd' : 'corepack'
const r = spawnSync(bin, ['pnpm', 'exec', 'playwright', ...pwArgs], {
  stdio: 'inherit',
  env: process.env,
  shell: process.platform === 'win32',
})
process.exit(r.status ?? 1)
