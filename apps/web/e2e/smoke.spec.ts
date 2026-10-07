import { test, expect } from '@playwright/test'

// 冒烟用例：只覆盖最轻量链路。
// 启动动线：BootGate 启动 → Splash 进度条（最短 1.4s）→
// 新设备 onboardingDone=false，自动进 P2 亮相起名页。

test('冒烟一：应用启动后非白屏，进入引导首屏', async ({ page }) => {
  // 用 './' 而非 '/'：保留 baseURL 路径前缀（部署后冒烟时 Pages 站点带 /<repo>/ 前缀）
  await page.goto('./')
  // P2 标题文案出现即证明渲染成功（含 Splash 过渡，放宽超时）
  await expect(page.getByText('你好呀，小朋友')).toBeVisible({ timeout: 15_000 })
})

test('冒烟二：黄金路径 起名 → 领养雪球兔 → 进入广场', async ({ page }) => {
  await page.goto('./')

  // P2：填名字（可留空），点"下一步"
  await expect(page.getByText('你好呀，小朋友')).toBeVisible({ timeout: 15_000 })
  await page.getByPlaceholder('输入你的名字').fill('小测')
  await page.getByRole('button', { name: '下一步' }).click()

  // P3：雪球兔默认选中，点"开始冒险"（犬/猫未解锁，不点）
  await expect(page.getByText('选择你的小伙伴')).toBeVisible()
  await page.getByRole('button', { name: '雪球兔' }).click()
  await page.getByRole('button', { name: '开始冒险' }).click()

  // P5 广场：答题小屋热点可见即到达第一个主场景
  // （手写板/抽卡/音频等重交互不在冒烟范围内）
  await expect(page.getByRole('button', { name: '答题小屋' })).toBeVisible()
})
