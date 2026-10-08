#!/usr/bin/env node
// playwright JSON 报告 → visual-qa report.json（AI 诊断协议输入，docs/internal/visual-qa.md §6）。
// 用法：node scripts/visual-report.mjs（在 apps/web 目录下，visual:check 之后执行）
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const RAW = 'test-visual/report.raw.json'
const OUT = 'test-visual/report.json'

if (!fs.existsSync(RAW)) {
  console.error(`未找到 ${RAW} —— 先执行 visual:check`)
  process.exit(2)
}

const raw = JSON.parse(fs.readFileSync(RAW, 'utf-8'))
const cases = []

function rel(p) {
  return p ? path.relative(process.cwd(), p) : null
}

function collect(suite) {
  for (const spec of suite.specs ?? []) {
    const t = spec.tests?.[0]
    const r = t?.results?.[0]
    if (!r) continue
    const att = Object.fromEntries((r.attachments ?? []).map((a) => [a.name, rel(a.path)]))
    const m = r.error?.message?.match(/ratio ([\d.]+) of all/)
    const id = spec.title.replace(/^visual:\s*/, '')
    // pass 时 attachments 不含 expected，按 playwright 快照目录规则推导基线路径
    const specFile = (spec.file ?? 'visual.spec.ts').split(/[\\/]/).pop()
    cases.push({
      id,
      status: spec.ok ? 'pass' : 'fail',
      diffRatio: m ? Number(m[1]) : null,
      baseline: att.expected
        ?? `e2e-visual/__screenshots__/${specFile}-snapshots/${id}-chromium-${process.platform}.png`,
      current: att.actual ?? null,
      diff: att.diff ?? null,
      error: spec.ok ? undefined : r.error?.message?.split('\n')[0],
    })
  }
  for (const child of suite.suites ?? []) collect(child)
}
for (const s of raw.suites ?? []) collect(s)

let commit = null
try {
  commit = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
    .toString().trim()
} catch { /* 非 git 环境可忽略 */ }

const report = {
  // 注意：不能用 process.env.CI 判断——Trae 终端会注入 CI 变量但它是本地环境
  run: { time: new Date().toISOString(), commit, mode: process.env.GITHUB_ACTIONS ? 'ci' : 'local' },
  summary: {
    total: cases.length,
    passed: cases.filter((c) => c.status === 'pass').length,
    failed: cases.filter((c) => c.status === 'fail').length,
  },
  cases,
}

fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, JSON.stringify(report, null, 2), 'utf-8')
console.log(`${OUT}: ${report.summary.passed}/${report.summary.total} 过`)
for (const c of cases.filter((c) => c.status === 'fail')) {
  console.log(`  fail: ${c.id} diffRatio=${c.diffRatio} diff=${c.diff}`)
}
process.exit(report.summary.failed ? 1 : 0)
