// P13 设置页（自 SettingsScene.module.css 迁移至 vanilla-extract，数值不变）。
// 场景根铺满 1024×768 LogicalStage，随舞台等比缩放。
import { style } from '@vanilla-extract/css'

// 字体栈取自 @mathpaws/ui 的 FONT.family token，token 变更时需同步
const FONT_FAMILY = '"Baloo 2", "Comic Sans MS", "Microsoft YaHei", system-ui, sans-serif'

export const scene = style({
  position: 'absolute',
  inset: 0,
  overflow: 'hidden',
  fontFamily: FONT_FAMILY,
})

// z0 重绘背景：铺满舞台随缩放（object-fit 缺省值即 fill，不再显式声明）
export const bg = style({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
})

// 静态展示层（left/top/width/height 由 bbox×K 运行时给出，保留内联）
export const layer = style({
  position: 'absolute',
})

// 左上返回（原稿顶部干净区）
export const backBtn = style({
  position: 'absolute',
  left: '14px',
  top: '10px',
})

// 行：图标 x213 / 标签 x301 / 控件区 x725-811（原稿 bbox ×K）；top 逐行内联
export const row = style({
  position: 'absolute',
  left: '213px',
  width: '598px',
  height: '68px',
  display: 'flex',
  alignItems: 'center',
  gap: '20px',
})

export const rowIcon = style({
  width: '62px',
  height: '62px',
  objectFit: 'contain',
})

export const rowLabel = style({
  flex: 1,
  fontWeight: 900,
  fontSize: '27px',
  color: '#4a5560',
})

export const rowControl = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '86px',
})

export const rowBtn = style({
  height: '46px',
  padding: '0 24px',
  borderRadius: '999px',
  border: 'none',
  background: '#fff3e0',
  color: '#ad6800',
  fontWeight: 900,
  fontSize: '18px',
  fontFamily: FONT_FAMILY,
  cursor: 'pointer',
})

// "查看"变体（关于我们）：蓝系；与 rowBtn 同特异度，靠后定义覆盖底色/字色
export const rowBtnInfo = style({
  background: '#e3f2fd',
  color: '#3f8fd0',
})

// 清理完成提示（白卡内底部）
export const cleared = style({
  position: 'absolute',
  left: '50%',
  top: '640px',
  transform: 'translateX(-50%)',
  padding: '6px 18px',
  borderRadius: '999px',
  background: '#e8f5e9',
  border: '2px solid #7ed957',
  fontWeight: 900,
  fontSize: '15px',
  color: '#3e9c4c',
})

// 关于我们弹窗内容
export const about = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '10px',
  minWidth: '320px',
  fontFamily: FONT_FAMILY,
})

export const aboutTitle = style({
  fontSize: '30px',
  fontWeight: 900,
  color: '#4a8fc4',
})

export const aboutText = style({
  fontSize: '16px',
  fontWeight: 800,
  color: '#7a8794',
})
