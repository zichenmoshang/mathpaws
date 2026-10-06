// 整块手写板（M3-P6-02）：透明 canvas 覆盖在高保真手写框底板上（透出纸面横线）。
// 多位数时用 HTML 虚线在板上分区；抬笔停顿约 400ms 后对有墨迹且未锁定的区逐区识别。
import {
  forwardRef, useImperativeHandle, useEffect, useRef,
} from 'react'
import type { PointerEvent } from 'react'

import { recognizeRegion } from '../utils/mnist'

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

    const setup = () => {
      const wrap = wrapRef.current
      const canvas = canvasRef.current
      if (!wrap || !canvas) return
      const dpr = Math.max(1, window.devicePixelRatio || 1)
      const w = wrap.clientWidth
      const h = wrap.clientHeight
      sizeRef.current = { w, h }
      canvas.width = w * dpr
      canvas.height = h * dpr
      const c = canvas.getContext('2d')!
      c.setTransform(dpr, 0, 0, dpr, 0, 0)
      c.lineCap = 'round'
      c.lineJoin = 'round'
      c.strokeStyle = '#263238'
      c.lineWidth = Math.max(9, Math.min(24, w * 0.035))
      c.clearRect(0, 0, w, h)
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
      const onResize = () => setup()
      window.addEventListener('resize', onResize)
      return () => {
        window.removeEventListener('resize', onResize)
        if (timer.current) clearTimeout(timer.current)
      }
       
    }, [regions])

    const pos = (e: PointerEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
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
      <div ref={wrapRef} style={{ position: 'absolute', inset: 0 }}>
        {/* 位间分隔：小数点位置画圆点，其余画竖虚线（不进 canvas，避免被识别成墨迹） */}
        {Array.from({ length: regions - 1 }, (_, k) => {
          const i = k + 1
          if (dotAfter !== null && i === dotAfter) {
            return (
              <span
                key={`s${i}`}
                style={{
                  position: 'absolute', left: `${(i / regions) * 100}%`,
                  top: '50%', transform: 'translate(-50%,-50%)',
                  width: 12, height: 12, borderRadius: '50%',
                  background: 'rgba(96,125,139,.5)', pointerEvents: 'none',
                }}
              />
            )
          }
          return (
            <span
              key={`s${i}`}
              style={{
                position: 'absolute', left: `${(i / regions) * 100}%`,
                top: '5%', bottom: '5%',
                borderLeft: '2px dashed rgba(96,125,139,.45)',
                pointerEvents: 'none',
              }}
            />
          )
        })}

        <canvas
          ref={canvasRef}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={finish}
          onPointerCancel={finish}
          style={{ width: '100%', height: '100%', touchAction: 'none', display: 'block' }}
        />
      </div>
    )
  },
)
