# 鸿蒙 6 平板 PWA 安装踩坑记：桌面图标消失之后

> **一句话摘要**：平板从鸿蒙 4 升级鸿蒙 6（NEXT 系）后，PWA 桌面图标消失、Chrome 不再出现「安装应用」。根因是系统底座从 AOSP 换成了纯血鸿蒙，WebAPK 机制整体失效；目前实测可行的恢复路径是 Aira 浏览器的「安装网页」功能。文末附鸿蒙 6 各安装路径对比与子路径部署 PWA 的自检清单。
>
> **适用读者**：PWA 目标设备包含鸿蒙 5/6（HarmonyOS NEXT 系）平板或手机的开发者；以及在 GitHub Pages 子路径部署 PWA 的开发者。

---

## 1. 事故现象

一个部署在 GitHub Pages 的 PWA 应用，主要使用场景是孩子的平板。平板系统从鸿蒙 4 升级到鸿蒙 6 后，两个问题同时出现：

1. 桌面上的应用图标**没了**（系统应用列表里也没有残留）；
2. 重新用 Chrome 访问站点，菜单里**没有**「安装应用」，浏览器也不主动弹安装提示。

这两个问题同源，都是系统升级引起的，与站点本身无关。

---

## 2. 根因分析

### 2.1 系统底座更换，WebAPK 机制整体失效

Chrome 在 Android 上安装 PWA 走的是 **WebAPK** 机制：浏览器向 Google 后端请求铸造（minting）一个签名 APK，再经系统包管理器安装。这条链路依赖两个前提：

- Android 系统服务（包管理器、系统级 WebView 协作）；
- Google Play 服务参与握手。

鸿蒙 4 及更早版本底层是 AOSP，这两个前提都成立，所以图标和安装提示一直正常。**鸿蒙 6 属于 NEXT 系纯血鸿蒙，不再原生运行 Android 应用**——升级后旧 Chrome 连同其 WebAPK 数据一起被清掉（图标消失的原因）；通过兼容容器运行的 Chrome 里，WebAPK 链路断裂，「安装应用」选项根本不出现（不再弹提示的原因，与 Chrome 安装冷却策略无关）。

### 2.2 华为浏览器没有实现 PWA 安装流程

系统自带浏览器看起来是「原生替代品」，实际不行。华为开发者论坛的实测与官方支持文档相互印证：

- 华为浏览器的内核 ArkWeb 基于 Chromium 132（6.0.0 Release Notes），**内核能力不等于产品暴露**：浏览器产品层没有实现 `beforeinstallprompt` / 安装横幅 / standalone 独立窗口这套 W3C PWA 安装流程；
- 它的「∷ → 添加至桌面」只是**书签快捷方式**（上限 10 个），打开仍带浏览器 UI；
- 最接近的替代是 6.1.3.300+ 版本的手动「全屏浏览」模式（平板按 F11），但那是浏览器进程内全屏，不是独立 PWA 窗口；
- 历史插曲：鸿蒙 5.0 以下（AOSP 系）的华为浏览器曾把 PWA 转成**快应用（QuickApp）**创建快捷方式（图标带蓝色闪电角标），这条路线在纯血鸿蒙上已不存在。

华为的官方路线是元服务（Atomic Service）和原生 hap，不是 W3C PWA；截至鸿蒙 6（API 23）没有任何 PWA 支持的路线图。

---

## 3. 鸿蒙 6 上的 PWA 安装路径对比

| 路径 | 结果 | 说明 |
|---|---|---|
| 兼容容器里的 Chrome | ✗ | 无 GMS，WebAPK 链路断裂，菜单无「安装应用」 |
| 华为浏览器「添加至桌面」 | △ | 书签快捷方式，打开带地址栏；SW 离线缓存可用（内核级能力） |
| **Aira 浏览器「安装网页」** | ✓（实测） | 独立窗口、无地址栏，真 PWA 体验；全局限 2 个快捷方式 |
| 卓易通 + Firefox（Android 版） | 未实测 | 卓易通是鸿蒙官方 Android 兼容层（应用市场可装）；Firefox 的 PWA 安装不依赖 GMS，成功概率高于 Chrome |
| ArkWeb 壳打包 hap | 未实施 | 华为官方推荐路线（原生容器内嵌 Web 页），工程量最大，适合产品化阶段 |

两个关键约束（华为官方文档）：

- **第三方应用桌面快捷方式配额 = 2 个**：Aira 本质是作为应用向系统申请快捷方式（AppGallery Kit 通道），所有 PWA 共用这 2 个名额；华为浏览器是 10 个（疑似系统特权通道，无文档直证）。
- 卓易通安装的应用在鸿蒙桌面带「卓」字角标。

---

## 4. Aira 安装步骤（实测路径）

Aira 是鸿蒙原生第三方浏览器（活跃维护，另有配套 Firefox 扩展「Aira 同步助手」），其 PWA 安装入口**没有任何公开文档**，主菜单里也看不到——这是本次踩坑最耗时的部分。实测路径（2026-10，鸿蒙 6 平板）：

1. Aira 打开站点，横屏**停留 10 秒以上**（等 Service Worker 注册激活，安装性检测需要时间）；
2. 打开菜单，找到「**安装网页**」项（注意：主菜单网格里全是书签/脚本/代理等工具项，安装入口在菜单下方区域，容易漏看）；
3. 确认安装，桌面出现图标（计入 Aira 的 2 个配额）；
4. 从桌面图标启动验证：独立窗口、无地址栏 = 真 PWA。

装完后建议再验证两件事：断网打开是否正常（SW 预缓存是否生效）、应用内功能是否完整（兼容层/内核对 wasm 等特性的支持度）。

---

## 5. 站点侧自检清单（子路径部署 PWA）

如果站点装在 GitHub Pages 项目页（`/<repo>/` 子路径）这类非根路径下，安装入口不出现或功能异常时，按这个顺序自查：

1. **manifest 的 `start_url` / `scope` 必须含子路径**。vite-plugin-pwa 会以 vite `base` 自动注入，所以构建部署包时务必设置 `BASE_PATH`；线上验证直接 fetch `manifest.webmanifest` 看实际值，不要只看源码。
2. **代码里所有资源 URL 用 `import.meta.env.BASE_URL` 拼接**，禁止写死 `/` 开头的绝对路径——这是子路径部署最常见的功能失效原因（`?url` import 的资源 vite 会自动加前缀，不受影响）。
3. **installability 三要素逐个 HEAD 验证**：icons 192/512、sw.js、start_url 全部返回 200。
4. **预缓存白名单覆盖推理类资源**：wasm、模型 json/bin 容易被 `globPatterns` 默认配置漏掉，导致离线/弱网时功能失效。
5. **验证部署版本是否符合预期**：线上 bundle 是 hash 文件名，fetch `index.html` 拿到 chunk 名，下载后搜特征串确认——「部署了」和「部署的是你以为的版本」是两回事。

---

## 6. 参考来源

- [请问鸿蒙6什么时候原生支持PWA? - 华为开发者问答](https://developer.huawei.com/consumer/cn/forum/topic/0208224242648299126)（2026-09，含 Aira 实测与配额分析）
- [添加桌面快捷方式 - AppGallery Kit 开发文档](https://developer.huawei.com/consumer/cn/doc/HarmonyOS-Guides/appgallery-productview-addshortcut)（单应用最多 2 个快捷方式）
- [华为浏览器中设置网站桌面快捷方式 - 华为官网](https://consumer.huawei.com/cn/support/content/zh-cn16032141/)（浏览器快捷方式上限 10 个）
- [华为浏览器添加网站至桌面快捷方式 - 华为官网](https://consumer.huawei.com/cn/support/content/zh-cn00448896/)（5.0 以下 PWA 转快应用的历史行为）
- [版本概览 6.0.0(20) - 华为开发者](https://developer.huawei.com/consumer/cn/doc/harmonyos-releases/overview-600)（ArkWeb 内核升级至 Chromium 132）
- [通过华为浏览器App下载安装应用 - 华为官网](https://consumer.huawei.com/cn/support/content/zh-cn16010239/)（下载 APK 拉起卓易通安装）
- [卓易通官网 - 常见问题](https://www.droitong.com/CommonQues.html)（兼容层安装与「卓」字角标）
