// id 工具单测：自然日 key 与 uuid v4
import { describe, it, expect, vi, afterEach } from 'vitest'

import { dayKey, uuid } from '../id'

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('dayKey', () => {
  it('输出 YYYY-MM-DD，月日不足两位补零', () => {
    expect(dayKey(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(dayKey(new Date(2026, 9, 7))).toBe('2026-10-07')
    expect(dayKey(new Date(2025, 11, 31))).toBe('2025-12-31')
  })

  it('默认取当天，与显式 new Date() 一致', () => {
    expect(dayKey()).toBe(dayKey(new Date()))
    expect(dayKey()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('uuid', () => {
  it('符合 uuid v4 格式（版本位 4、变体位 8/9/a/b）', () => {
    expect(uuid()).toMatch(UUID_V4)
  })

  it('多次生成不重复', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => uuid()))
    expect(ids.size).toBe(1000)
  })

  it('无 crypto.randomUUID 时走兜底实现，格式合法且不重复', () => {
    vi.stubGlobal('crypto', undefined)
    const ids = new Set(Array.from({ length: 500 }, () => uuid()))
    for (const id of ids) expect(id).toMatch(UUID_V4)
    expect(ids.size).toBe(500)
  })
})
