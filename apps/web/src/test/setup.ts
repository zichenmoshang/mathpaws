// 全局测试环境：IndexedDB 由 fake-indexeddb 提供（node 环境无浏览器 API）。
// db / store 集成测试直接依赖；纯逻辑单测不受影响。
import 'fake-indexeddb/auto'
