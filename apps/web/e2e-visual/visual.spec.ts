import { expect, test } from '@playwright/test'

import { SCENARIOS } from './scenarios'

// 页面截图基线比对（visual-qa P1，基线 A：回归基线）。
// 基线更新：`corepack pnpm --filter mathpaws-client visual:update`
// ——按治理纪律须用户批准后才可执行（docs/internal/visual-qa.md §9）。
for (const sc of SCENARIOS) {
  test(`visual: ${sc.id}`, async ({ page }) => {
    if (sc.freezeClock) await page.clock.install()
    await page.goto(`/${sc.hash}`)
    // 等字体就绪，消除字体加载抖动
    await page.evaluate(() => document.fonts.ready)
    if (sc.settleMs) await page.waitForTimeout(sc.settleMs)
    await expect(page).toHaveScreenshot(`${sc.id}.png`, {
      animations: 'disabled',
      maxDiffPixelRatio: 0.01,
      mask: sc.mask?.map((sel) => page.locator(sel)),
    })
  })
}
