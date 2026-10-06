// 2D 资源预加载（M4-BOOT-01）：无 GLB，仅预取 2D 图片。
// 分两级：
//   - CRITICAL：Splash 进度条期间必须就绪（首页/广场关键视觉）；
//   - IDLE：进入首页后 requestIdleCallback 后台预取（广场语义层/结算/宝箱）。
// 单张失败自动重试；最终仍失败不阻塞流程（页面上 <img> 会再次尝试加载）。

import chestBg from '../assets/hifi/daily-chest/bg.jpg'
import homeAlarm from '../assets/hifi/home/alarm-books.webp'
import homeBg from '../assets/hifi/home/bg.jpg'
import homeRabbit from '../assets/hifi/home/rabbit-lie.webp'
import homeBtn from '../assets/hifi/home/btn-plaza.webp'
import plazaBg from '../assets/hifi/plaza/bg.jpg'
import resultBg from '../assets/hifi/result/bg.webp'
import bldFarm from '../assets/hifi/plaza/bld-farm.webp'
import bldQuiz from '../assets/hifi/plaza/bld-quiz.webp'
import scarecrow from '../assets/hifi/plaza/farm-scarecrow.webp'
import signQuiz from '../assets/hifi/plaza/sign-quiz.webp'
import signFarm from '../assets/hifi/plaza/sign-farm.webp'
import bldPetshop from '../assets/hifi/plaza/bld-petshop.webp'
import signPetshop from '../assets/hifi/plaza/sign-petshop.webp'
import roofBird from '../assets/hifi/plaza/roof-bird.webp'
import petshopPets from '../assets/hifi/plaza/petshop-pets.webp'
import btnFarm from '../assets/hifi/plaza/btn-farm.webp'
import btnPet from '../assets/hifi/plaza/btn-pet.webp'
import btnBackpack from '../assets/hifi/plaza/btn-backpack.webp'
import splashBg from '../assets/hifi/splash/bg.jpg'
import splashBird from '../assets/hifi/splash/bird.webp'
import splashLogo from '../assets/hifi/splash/logo.webp'
import splashNumsC from '../assets/hifi/splash/nums-center.webp'
import splashNumsL from '../assets/hifi/splash/nums-left.webp'
import splashNumsR from '../assets/hifi/splash/nums-right.webp'
import splashBar from '../assets/hifi/splash/progress-bar.webp'

/** 关键资源：Splash 期间加载（splash 自身拆层排前，随后首页/广场关键视觉） */
export const CRITICAL_IMAGES: string[] = [
  splashBg,
  splashBird,
  splashLogo,
  splashBar,
  splashNumsL,
  splashNumsC,
  splashNumsR,
  homeBg,
  homeRabbit,
  homeBtn,
  homeAlarm,
  plazaBg,
  resultBg,
  chestBg,
]

/** 空闲资源：进入首页后后台预取 */
export const IDLE_IMAGES: string[] = [
  bldQuiz,
  bldFarm,
  bldPetshop,
  scarecrow,
  signQuiz,
  signFarm,
  signPetshop,
  roofBird,
  petshopPets,
  btnFarm,
  btnPet,
  btnBackpack,
]

const loaded = new Set<string>()

/** 预载单张图片（带重试）；成功后浏览器缓存命中，后续 <img> 不再发请求 */
function loadOne(src: string, retries = 2): Promise<void> {
  return new Promise(resolve => {
    if (loaded.has(src)) {
      resolve()
      return
    }
    const img = new Image()
    let attempts = 0
    const done = () => {
      loaded.add(src)
      resolve()
    }
    img.onload = done
    img.onerror = () => {
      attempts += 1
      if (attempts <= retries) {
        // 重新赋 src 触发重试（加查询串规避可能的中间态缓存）
        img.src = `${src}${src.includes('?') ? '&' : '?'}r=${attempts}`
      } else {
        // 不阻塞：让页面上的 <img> 自行兜底加载
        resolve()
      }
    }
    img.src = src
  })
}

/**
 * 加载关键资源，逐张汇报进度（0–1）。
 * 并发加载、单张失败不中断；全部 settle 后 Promise 结束。
 */
export async function preloadCritical(
  onProgress?: (ratio: number) => void,
): Promise<void> {
  const total = CRITICAL_IMAGES.length
  let done = 0
  onProgress?.(0)
  await Promise.all(
    CRITICAL_IMAGES.map(async src => {
      await loadOne(src)
      done += 1
      onProgress?.(done / total)
    }),
  )
  onProgress?.(1)
}

let idleStarted = false

/** 首页停留期间后台预取非关键资源（requestIdleCallback，不可用则 setTimeout） */
export function preloadIdle(): void {
  if (idleStarted) return
  idleStarted = true
  const run = () => {
    void Promise.all(IDLE_IMAGES.map(src => loadOne(src)))
  }
  const ric = (window as unknown as {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
  }).requestIdleCallback
  if (ric) ric(run, { timeout: 4000 })
  else setTimeout(run, 1200)
}
