import react from '@vitejs/plugin-react'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// PWA manifest（PRD §技术、architecture §10）
const pwaManifest = {
  name: 'mathpaws',
  short_name: 'mathpaws',
  description: '游戏化数学练习 · 养宠物、种庄稼、抽装扮',
  // 一期仅平板横屏
  orientation: 'landscape',
  display: 'standalone',
  theme_color: '#4FC3F7',
  background_color: '#bfe3f5',
  // 图标在 public/icons 下；占位件由 M1 批次替换为正式 IP 图标
  icons: [
    { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    {
      src: 'icons/icon-512-maskable.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],
}

export default defineConfig({
  // GitHub Pages 等项目站点需要 '/<repo>/' 前缀；本地 dev / 正式 CDN 用 '/'
  base: process.env.BASE_PATH ?? '/',
  plugins: [
    react(),
    vanillaExtractPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      // 开发期可关闭注入；build 必出 manifest + SW
      injectRegister: 'auto',
      includeAssets: ['icons/icon-192.png'],
      manifest: pwaManifest as Record<string, unknown>,
      workbox: {
        // App Shell + 静态资源 precache；json/bin/wasm 含手写识别模型与 tfjs wasm（离线可用）
        globPatterns: ['**/*.{js,css,html,svg,webp,woff2,json,bin,wasm}'],
        // GLB / 音频按需运行时缓存，不进 precache
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
      devOptions: {
        // 局域网 HTTP 调试不注册 SW（注册不了/无意义）
        enabled: false,
      },
    }),
  ],
  server: {
    port: 5173,
    host: true,
  },
  optimizeDeps: {
    // @mathpaws/ui 与 @mathpaws/paperdoll 是指向 TS 源码的 workspace 链接包；
    // 若 include 会被预构建缓存且源码改动不触发失效（曾导致加载旧版
    // PaperDoll、画布空白）。改为 exclude，让 Vite 直接按需编译其源码。
    exclude: ['@mathpaws/ui', '@mathpaws/paperdoll'],
    include: [
      '@tensorflow/tfjs',
      '@tensorflow/tfjs-backend-wasm',
    ],
  },
})
