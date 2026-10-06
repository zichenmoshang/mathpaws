// 整块手写板（M3-P6-02）：透明 canvas 覆盖在高保真手写框底板上（透出纸面横线）。
// 多位数时用 HTML 虚线在板上分区；抬笔停顿约 400ms 后对有墨迹且未锁定的区逐区识别。
import {
  forwardRef, useImperativeHandle, useEffect, useRef,
} from 'react'
import type { PointerEvent } from 'react'

import { recognizeRegion } from '../utils/mnist'
import styles from './WritingBoard.module.css'

export interface WritingBoardHandle {
  /** 清板并解锁所有区（答错重写） */
  reset: () => void
}

interface Props {
  /** 数字位数（分区数） */
  regions: number
  /** 小数点位于第几位数之后；null 表示整数 */
  dotAfter: number | null
  /** 某区识别成功；区下标从 0 起 */
  onRecognized: (index: number, digit: number) => void
  /** 开始落笔（用于隐藏占位提示） */
  onStrokeStart?: () => void
  /** 识别服务不可用（模型/后端加载失败；区别于"该区空白"） */
  onRecognitionError?: () => void
}

const IDLE_DELAY = 400

export const WritingBoard = forwardRef<WritingBoardHandle, Props>(
  function WritingBoard({ regions, dotAfter, onRecognized, onStrokeStart, onRecognitionError }, ref) {
    const wrapRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const drawing = useRef(false)
    // 识别循环运行标志：串行推理期间禁止落笔（见 onDown）
    const recognizing = useRef(false)
    const last = useRef<{ x: number; y: number } | null>(null)
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const locked = useRef<boolean[]>(Array(regions).fill(false))
    const sizeRef = useRef({ w: 0, h: 0 })

    /** 各区 CSS 像素矩形（均分板宽） */
    const regionRects = () => {
      const { w, h } = sizeRef.current
      const rw = w / regions
      return Array.from({ length: regions }, (_, i) => ({
        x: i * rw, y: 0, w: rw, h,
      }))
    }

    const setup = (preserveInk = false) => {
      const wrap = wrapRef.current
      const canvas = canvasRef.current
      if (!wrap || !canvas) return
      const dpr = Math.max(1, window.devicePixelRatio || 1)
      const w = wrap.clientWidth
      const h = wrap.clientHeight
      // 重设 canvas 尺寸会清空位图：resize 前把当前墨迹快照到离屏 canvas，之后回贴
      let snapshot: HTMLCanvasElement | null = null
      if (preserveInk && canvas.width > 0 && canvas.height > 0) {
        snapshot = document.createElement('canvas')
        snapshot.width = canvas.width
        snapshot.height = canvas.height
        snapshot.getContext('2d')!.drawImage(canvas, 0, 0)
      }
      sizeRef.current = { w, h }
      canvas.width = w * dpr
      canvas.height = h * dpr
      const c = canvas.getContext('2d')!
      c.setTransform(dpr, 0, 0, dpr, 0, 0)
      c.lineCap = 'round'
      c.lineJoin = 'round'
      c.strokeStyle = '#263238'
      c.lineWidth = Math.max(9, Math.min(24, w * 0.035))
      if (snapshot) {
        // 旧位图整体缩放回贴到新画布（目标坐标为 CSS 像素，dpr 由 setTransform 处理）
        c.drawImage(snapshot, 0, 0, snapshot.width, snapshot.height, 0, 0, w, h)
      } else {
        c.clearRect(0, 0, w, h)
      }
    }

    /** 抬笔停顿：识别所有有墨迹但未锁定的区 */
    const scheduleRecognize = () => {
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(async () => {
        const canvas = canvasRef.current
        if (!canvas) return
        // 逐区串行推理耗时数百毫秒，期间落笔会把残笔裁进下一区图像；置标志让 onDown 忽略
        recognizing.current = true
        try {
          const rects = regionRects()
          for (let i = 0; i < rects.length; i++) {
            if (locked.current[i]) continue
            try {
               
              const digit = await recognizeRegion(canvas, rects[i])
              console.info(`[mnist] 识别数字: ${digit}`)
              locked.current[i] = true
              onRecognized(i, digit)
            } catch (err) {
              if (err instanceof Error && err.message === 'blank region') {
                // 该区空白：不锁定，等待书写
              } else {
                // 识别服务不可用：上报场景层提示并终止本轮（其余区同样不可用）
                console.error('[mnist] 识别服务不可用:', err)
                onRecognitionError?.()
                break
              }
            }
          }
        } finally {
          recognizing.current = false
        }
      }, IDLE_DELAY)
    }

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (timer.current) clearTimeout(timer.current)
        locked.current = Array(regions).fill(false)
        const { w, h } = sizeRef.current
        canvasRef.current?.getContext('2d')?.clearRect(0, 0, w, h)
      },
    }))

    useEffect(() => {
      locked.current = Array(regions).fill(false)
      setup()
      // resize / 横竖屏切换：重设画布尺寸但保留用户墨迹；
      // locked 识别状态不重置（仅挂载 / 分区数变化时重置）
      const onResize = () => setup(true)
      window.addEventListener('resize', onResize)
      window.addEventListener('orientationchange', onResize)
      return () => {
        window.removeEventListener('resize', onResize)
        window.removeEventListener('orientationchange', onResize)
        if (timer.current) clearTimeout(timer.current)
      }
       
    }, [regions])

    const pos = (e: PointerEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const { w, h } = sizeRef.current
      // 比例式换算：rect 是 CSS 缩放后的屏幕尺寸，笔迹坐标系是未缩放的画布 CSS px
      // （dpr 已由 ctx.setTransform 处理，此处不重复计入）；按两者比例还原，
      // 祖先带任意 CSS scale（如 LogicalStage）时笔迹位置仍准确
      return {
        x: (e.clientX - rect.left) * (w / rect.width),
        y: (e.clientY - rect.top) * (h / rect.height),
      }
    }

    const onDown = (e: PointerEvent<HTMLCanvasElement>) => {
      if (timer.current) clearTimeout(timer.current)
      // 识别循环运行中忽略本次落笔；不自动补触发新一轮，由用户下次抬笔正常识别
      if (recognizing.current) return
      drawing.current = true
      last.current = pos(e)
      onStrokeStart?.()
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    const onMove = (e: PointerEvent<HTMLCanvasElement>) => {
      if (!drawing.current) return
      const p = pos(e)
      const c = canvasRef.current!.getContext('2d')!
      c.beginPath()
      c.moveTo(last.current!.x, last.current!.y)
      c.lineTo(p.x, p.y)
      c.stroke()
      last.current = p
    }
    const finish = () => {
      if (!drawing.current) return
      drawing.current = false
      last.current = null
      scheduleRecognize()
    }

    return (
      <div ref={wrapRef} className={styles.wrap}>
        {/* 位间分隔：小数点位置画圆点，其余画竖虚线（不进 canvas，避免被识别成墨迹） */}
        {Array.from({ length: regions - 1 }, (_, k) => {
          const i = k + 1
          if (dotAfter !== null && i === dotAfter) {
            return (
              <span
                key={`s${i}`}
                className={styles.dot}
                style={{ left: `${(i / regions) * 100}%` }}
              />
            )
          }
          return (
            <span
              key={`s${i}`}
              className={styles.sep}
              style={{ left: `${(i / regions) * 100}%` }}
            />
          )
        })}

        <canvas
          ref={canvasRef}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={finish}
          onPointerCancel={finish}
          className={styles.board}
        />
      </div>
    )
  },
)
