// 答题场景 P6（M3-P6-01/02）：按高保真切图层还原（见 assets/hifi/quiz/manifest.json）。
// 背景为 CSS 渐变；顶部栏（返回 / 标题切图 / 代码进度条+宝箱）固定在视口顶部；
// 笔记本切图层在独立舞台中等比缩放；左页题目前端排版（字号自适应不换行），
// 右页手写框底板为切图，其上覆盖透明手写板；抬笔停顿自动 MNIST 识别：
//   正确 → 绿字回写、音效发奖（仅正式轮）、自动进下一题；
//   错误 → 红字回写、停留本题、清板可重写。
// 整轮结束 → 结果写入内存 lastRound store，跳转独立结算场景 result（见 ResultScene.tsx）。
import {
  BackButton, ProgressBar, ConfirmDialog, C,
} from '@mathpaws/ui'
import type { CSSProperties } from 'react'
import {
  useLayoutEffect, useEffect, useMemo, useRef, useState,
} from 'react'

import type { RouteId } from '../../app/router'
import { useStreakStore } from '../../stores/useStreakStore'
import { WritingBoard } from '../../components/WritingBoard/WritingBoard'
import type { WritingBoardHandle } from '../../components/WritingBoard/WritingBoard'
import { GuideTip } from '../../components/GuideTip/GuideTip'
import { useRouter } from '../../app/router'
import pageLeftImg from '../../assets/hifi/quiz/page-left.webp'
import pageRightImg from '../../assets/hifi/quiz/page-right.webp'
import ringsImg from '../../assets/hifi/quiz/rings.webp'
import writingBoxImg from '../../assets/hifi/quiz/writing-box.webp'
import hintTextImg from '../../assets/hifi/quiz/hint-text.webp'
import pencilImg from '../../assets/hifi/quiz/pencil.webp'
import tagImg from '../../assets/hifi/quiz/tag.webp'
import shellIcon from '../../assets/img/icons/i-shell@2x.webp'
import titleImg from '../../assets/hifi/quiz/title.webp'
import chestIcon from '../../assets/img/icons/i-chest@2x.webp'
import { REWARD } from '../../config/economy'
import { QUESTIONS_PER_ROUND } from '../../config/quiz'
import { KNOWLEDGE_PATH } from '../../content/knowledgePath'
import { generateOralRound } from '../../content/oral'
import type { QuizQuestion } from '../../content/types'
import { wrongKey } from '../../stores'
import { useEconomyStore } from '../../stores/useEconomyStore'
import { useLastRoundStore } from '../../stores/useLastRoundStore'
import { useMasteryStore } from '../../stores/useMasteryStore'
import { useWrongbookStore } from '../../stores/useWrongbookStore'
import { audio } from '../../utils/audio'
import { warmupModel } from '../../utils/mnist'

import * as s from './QuizScene.css'

type Verdict = 'none' | 'correct' | 'wrong'

const NEXT_DELAY = 900

// 笔记本舞台在原 2364×1773 稿中的包围区域（含上凸标签）
const ORIG = { x: 170, y: 315, w: 2030, h: 1350 }

// 图层定位：原始全图坐标 → 舞台百分比
const box = (x0: number, y0: number, x1: number, y1: number): CSSProperties => ({
  position: 'absolute',
  left: `${((x0 - ORIG.x) / ORIG.w) * 100}%`,
  top: `${((y0 - ORIG.y) / ORIG.h) * 100}%`,
  width: `${((x1 - x0) / ORIG.w) * 100}%`,
  height: `${((y1 - y0) / ORIG.h) * 100}%`,
})

/** 调试：localStorage 设 mp_oral_digits=1 时仅出个位数答案（验证期用） */
const onlySingleDigit = (): boolean => {
  try { return localStorage.getItem('mp_oral_digits') === '1' } catch { return false }
}

export function QuizScene(
  { onNavigate }: { onNavigate: (id: RouteId) => void },
) {
  // 进入答题的来源页（退出时"从哪来回哪去"）：挂载后在 effect 中读取一次上一路由，
  // 仅在上一页是 plaza/home 时记录；result 往返（再练一轮）不覆盖来源。
  // （原实现为模块级可变变量 + useState 初始化器里的渲染期副作用，已改为 ref/effect）
  const originRef = useRef<'plaza' | 'home'>('home')
  useEffect(() => {
    const p = useRouter.getState().previous
    if (p === 'plaza' || p === 'home') originRef.current = p
  }, [])

  const buildRound = (): QuizQuestion[] => {
    const unlockedIds = useMasteryStore.getState()
      .unlocked(KNOWLEDGE_PATH.map(n => n.id))
    const oralIds = KNOWLEDGE_PATH
      .filter(n => n.kind !== 'real' && n.capability === 'compute')
      .map(n => n.id)
    const ids = oralIds.filter(id => unlockedIds.includes(id))
    if (onlySingleDigit()) {
      const out: QuizQuestion[] = []
      let guard = 0
      while (out.length < QUESTIONS_PER_ROUND && guard < 2000) {
        const q = generateOralRound(1, ids.length ? ids : oralIds)[0]
        guard++
        if (!q.answer.includes('.') && q.answer.replace('-', '').length === 1) out.push(q)
      }
      return out
    }
    return generateOralRound(QUESTIONS_PER_ROUND, ids.length ? ids : oralIds)
  }

  const [round] = useState<QuizQuestion[]>(() => buildRound())
  const [qIndex, setQIndex] = useState(0)
  const [digits, setDigits] = useState<Array<number | null>>([])
  const [verdict, setVerdict] = useState<Verdict>('none')
  const [hasInput, setHasInput] = useState(false)
  const [confirmExit, setConfirmExit] = useState(false)
  const [fontPx, setFontPx] = useState(64)
  // 识别服务不可用（模型/后端加载失败）：在书写区附近提示
  const [recogError, setRecogError] = useState(false)

  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const boardRef = useRef<WritingBoardHandle>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const promptRef = useRef<HTMLDivElement>(null)
  // digitsRef 为权威累积（避免同一轮多次 onRecognized 共享旧闭包）；digits 仅用于渲染
  const digitsRef = useRef<Array<number | null>>([])
  // 本轮奖励口径：轮次开始时预判是否仍为全额奖励轮（练习轮不发任何奖励）
  const paidRoundRef = useRef<boolean>(useEconomyStore.getState().canPayRound())
  // 本轮统计：首次答对题数、本轮实际贝壳/食物
  const correctCountRef = useRef(0)
  const shellsEarnedRef = useRef(0)
  const foodEarnedRef = useRef(0)
  // 本题是否已判定过（防止同一题多次首次判定）
  const judgedRef = useRef(false)
  // 答错重写掩码：null = 首次做答；数组标记各区是否已重写识别（左侧错误值保留显示）
  const rewriteMaskRef = useRef<boolean[] | null>(null)
  const question = round[qIndex]

  const answerLayout = useMemo(() => {
    const parts = question.answer.split('.')
    const intDigits = parts[0].split('')
    const fracDigits = parts.length > 1 ? parts[1].split('') : []
    return { intDigits, fracDigits, hasDot: fracDigits.length > 0 }
  }, [question])

  const totalDigits = answerLayout.intDigits.length + answerLayout.fracDigits.length

  // digits 数组 → 答案字符串：判定与回显共用，按 hasDot 在整数位后补小数点，保证两处口径一致
  const formatDigits = (ds: Array<number | null>): string => {
    const strs = ds.map(d => String(d))
    if (answerLayout.hasDot) {
      const intN = answerLayout.intDigits.length
      return `${strs.slice(0, intN).join('')}.${strs.slice(intN).join('')}`
    }
    return strs.join('')
  }

  useEffect(() => {
    warmupModel()
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current)
    }
  }, [])

  useEffect(() => {
    digitsRef.current = Array(totalDigits).fill(null)
    setDigits(Array(totalDigits).fill(null))
    setVerdict('none')
    setHasInput(false)
    judgedRef.current = false
    rewriteMaskRef.current = null
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qIndex])

  // 题目字号自适应：从舞台高度 8.6% 起逐步收缩，保证一行不溢出
  useLayoutEffect(() => {
    const stage = stageRef.current
    const row = promptRef.current
    if (!stage || !row) return
    let fs = stage.clientHeight * 0.086
    row.style.fontSize = `${fs}px`
    let guard = 0
    while (row.scrollWidth > row.clientWidth + 1 && guard < 40) {
      fs *= 0.94
      row.style.fontSize = `${fs}px`
      guard++
    }
    setFontPx(fs)
  }, [qIndex, question.prompt])

  const goNext = () => {
    audio.playSfx('click')
    if (qIndex + 1 >= round.length) {
      // 本轮奖励口径以轮次开始时的预判为准
      if (paidRoundRef.current) {
        const econ = useEconomyStore.getState()
        econ.registerRound()
        econ.addShells(REWARD.roundBonus)
        econ.addPetFood(REWARD.foodPerRound)
        shellsEarnedRef.current += REWARD.roundBonus
        foodEarnedRef.current += REWARD.foodPerRound
      }
      useStreakStore.getState().markStudyDone()
      useLastRoundStore.getState().save({
        correctCount: correctCountRef.current,
        totalCount: round.length,
        shellsEarned: shellsEarnedRef.current,
        foodEarned: foodEarnedRef.current,
        paidRound: paidRoundRef.current,
        finishedAt: Date.now(),
      })
      onNavigate('result')
    } else {
      boardRef.current?.reset()
      setQIndex(i => i + 1)
    }
  }

  /** 某区识别成功；全部识别完则自动判定 */
  const onRecognized = (idx: number, digit: number) => {
    const next = [...digitsRef.current]
    next[idx] = digit
    digitsRef.current = next
    setDigits(next)

    // 答错重写中：左侧保留错误值显示，仅等所有区都被重写识别后再判
    const mask = rewriteMaskRef.current
    if (mask) {
      mask[idx] = true
      if (mask.some(done => !done)) return
    } else if (next.some(d => d === null)) {
      return
    }

    const rec = formatDigits(next)

    if (judgedRef.current) return
    judgedRef.current = true

    const isCorrect = rec === question.answer
    useMasteryStore.getState().recordAnswer(question.knowledgeId, isCorrect)

    if (isCorrect) {
      rewriteMaskRef.current = null
      correctCountRef.current += 1
      if (paidRoundRef.current) {
        useEconomyStore.getState().addShells(REWARD.oralPerQuestion)
        shellsEarnedRef.current += REWARD.oralPerQuestion
      }
      useWrongbookStore.getState().removeIfCorrect(wrongKey(question), true)
      audio.playSfx('correct')
      setVerdict('correct')
      advanceTimer.current = setTimeout(goNext, NEXT_DELAY)
    } else {
      // 一期静默预采集：无入口展示，上限 100 条（PRD §7.4 口径）
      useWrongbookStore.getState().add(question, rec)
      audio.playSfx('wrong')
      setVerdict('wrong')
      // 只清右侧手写板；左侧错误数字与红色状态保留显示。
      // 进入重写模式：逐区等待重新识别，全部重写后才再次判定。
      boardRef.current?.reset()
      judgedRef.current = false
      rewriteMaskRef.current = Array(totalDigits).fill(false)
      setHasInput(false)
    }
  }

  /* ---------------- 答题页 ---------------- */
  const progress = (qIndex + (verdict === 'correct' ? 1 : 0)) / round.length
  const recognizedText = digits.every(d => d !== null)
    ? formatDigits(digits)
    : null
  const boxColor = verdict === 'correct'
    ? C.grassDeep : verdict === 'wrong' ? C.redDeep : '#7d8a99'
  // 题目行（原稿坐标：算式起 x≈393，中心 y≈968）
  const promptTop = ((968 - ORIG.y) / ORIG.h) * 100
  // 题目行在左页内容区水平居中，两侧保留安全距离（左页内缩后约 x300..1080）
  const promptLeft = ((300 - ORIG.x) / ORIG.w) * 100
  const promptWidth = ((1080 - 300) / ORIG.w) * 100

  return (
    <div className={s.scene}>
      {/* 顶部栏：返回 / 标题 / 进度+宝箱，同一层级 */}
      <div className={s.topBar}>
        <BackButton onClick={() => { audio.playSfx('click'); setConfirmExit(true) }} />
        <img
          src={titleImg} alt="计算正确答案" draggable={false}
          className={s.titleImg}
        />
        <div className={s.progressWrap}>
          <ProgressBar ratio={progress} base="#ffffff" deep="rgba(255,255,255,.95)" height={16} />
          <img src={chestIcon} alt="" draggable={false} className={s.chestInBar} />
        </div>
      </div>

      {/* 笔记本舞台 */}
      <div className={s.bookArea}>
        <div ref={stageRef} className={s.stage}>
          <img src={pageLeftImg} alt="" draggable={false}
            className={s.fillImg} style={box(177, 331, 1173, 1661)} />
          <img src={pageRightImg} alt="" draggable={false}
            className={s.fillImg} style={box(1203, 333, 2196, 1660)} />
          <img src={ringsImg} alt="" draggable={false}
            className={s.peNone} style={box(1099, 506, 1275, 1476)} />

          {/* 题目（前端排版，自适应单行；fontPx 为运行时自适应字号） */}
          <div
            ref={promptRef}
            className={s.prompt}
            style={{
              left: `${promptLeft}%`,
              width: `${promptWidth}%`,
              top: `${promptTop}%`,
              fontSize: fontPx,
            }}
          >
            <span className={s.promptText}>{question.prompt}</span>
            <span>=</span>
            {/* 边框/文字颜色随判定状态变化，保留内联 */}
            <span
              className={s.answerBox}
              style={{
                border: `0.055em dashed ${verdict === 'none' ? 'rgba(110,128,146,.6)' : boxColor}`,
                color: boxColor,
              }}
            >
              {verdict === 'none' ? '?' : recognizedText}
            </span>
          </div>

          {/* 手写框底板 + 标签 */}
          <img src={writingBoxImg} alt="" draggable={false} style={box(1335, 501, 2058, 1446)} />
          <img src={tagImg} alt="" draggable={false}
            className={s.peNone} style={box(1514, 319, 1880, 459)} />

          {/* 手写板：按实际手写区域大小（内缩对齐虚线框），高度 70% */}
          <div style={box(1347, 513, 2046, 1458)}>
            <WritingBoard
              key={`q${qIndex}`}
              ref={boardRef}
              regions={totalDigits}
              dotAfter={answerLayout.hasDot ? answerLayout.intDigits.length : null}
              onRecognized={onRecognized}
              onStrokeStart={() => setHasInput(true)}
              onRecognitionError={() => setRecogError(true)}
            />
          </div>

          {/* 占位提示「答案写这里」+ 铅笔：无输入时显示，落笔自动消失 */}
          {!hasInput && (
            <>
              <img src={hintTextImg} alt="" draggable={false}
                className={s.peNone} style={box(1548, 840, 1847, 897)} />
              <img src={pencilImg} alt="" draggable={false}
                className={s.peNone} style={box(1654, 947, 1751, 1052)} />
            </>
          )}

          {/* 答对提示：右上角 +奖励贝壳 + 太棒啦 */}
          {verdict === 'correct' && (
            <div className={s.correctHint} style={box(1820, 350, 2120, 560)}>
              <div className={s.correctRow}>
                <span className={s.correctPlus}>
                  +{REWARD.oralPerQuestion}
                </span>
                <img src={shellIcon} alt="贝壳" className={s.correctShell} />
              </div>
              <span className={s.cheerText}>
                太棒啦！
              </span>
            </div>
          )}

          {/* 答错提示：落笔重写即消失（左侧错误数字与红框仍保留） */}
          {verdict === 'wrong' && !hasInput && (
            <div
              className={s.floatHint}
              style={{
                left: `${((1335 - ORIG.x) / ORIG.w) * 100}%`,
                top: `${((519 - ORIG.y) / ORIG.h) * 100}%`,
                width: `${(723 / ORIG.w) * 100}%`,
              }}
            >
              <span className={s.floatHintTag}>
                答错了，再写一次吧
              </span>
            </div>
          )}

          {/* 识别服务不可用提示（模型/后端加载失败时由 WritingBoard 上报），位于书写区下缘 */}
          {recogError && (
            <div
              className={s.floatHint}
              style={{
                left: `${((1335 - ORIG.x) / ORIG.w) * 100}%`,
                top: `${((1470 - ORIG.y) / ORIG.h) * 100}%`,
                width: `${(723 / ORIG.w) * 100}%`,
              }}
            >
              <span className={s.floatHintTag}>
                识别暂时不可用，请刷新重试
              </span>
            </div>
          )}
        </div>
      </div>

      {confirmExit && (
        <ConfirmDialog
          title="退出答题？"
          message="放弃则本轮进度与奖励不保留，确定要退出吗？"
          confirmText="退出"
          cancelText="继续答题"
          danger
          onConfirm={() => { setConfirmExit(false); onNavigate(originRef.current) }}
          onCancel={() => setConfirmExit(false)}
        />
      )}

      {/* 新手引导 B：手写区提示（可跳过、不重播） */}
      <GuideTip id="quiz-writing" text="在右侧手写区写出答案，抬笔自动识别" style={{ right: '6%', bottom: '8%' }} />
    </div>
  )
}
