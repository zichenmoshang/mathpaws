// 音频基础设施（M0-ENG-06 / architecture §11）
// 封装 BGM / 音效；首次交互后解锁 AudioContext；默认开、设置可关。
// 一期素材（G4 清单）未就位前：以 WebAudio 程序化轻提示音兜底；
// BGM 用极轻的环境振荡占位（默认关闭实际发声，仅保留接口）。

type SfxName =
  | 'click'
  | 'correct'
  | 'wrong'
  | 'flip'
  | 'pickup'
  | 'open'
  | 'feed'
  | 'evolve'
  | 'reward'

class AudioManager {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private bgmGain: GainNode | null = null
  private unlocked = false
  bgmEnabled = true
  sfxEnabled = true

  /** 首次用户交互时调用 */
  unlock(): void {
    if (this.unlocked) {
      if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume()
      return
    }
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    if (!Ctx) return
    this.ctx = new Ctx()
    this.master = this.ctx.createGain()
    this.master.gain.value = 0.9
    this.master.connect(this.ctx.destination)
    this.bgmGain = this.ctx.createGain()
    this.bgmGain.gain.value = 0.0
    this.bgmGain.connect(this.master)
    this.unlocked = true
    if (this.ctx.state === 'suspended') void this.ctx.resume()
  }

  setBgmEnabled(on: boolean): void {
    this.bgmEnabled = on
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setTargetAtTime(on ? 0.5 : 0, this.ctx.currentTime, 0.1)
    }
  }

  setSfxEnabled(on: boolean): void {
    this.sfxEnabled = on
  }

  /** 播放一个短音（程序化兜底；素材就位后替换为 buffer 播放） */
  private blip(freq: number, duration: number, type: OscillatorType, when = 0): void {
    if (!this.ctx || !this.master || !this.sfxEnabled) return
    const t0 = this.ctx.currentTime + when
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t0)
    gain.gain.setValueAtTime(0.0001, t0)
    gain.gain.exponentialRampToValueAtTime(0.25, t0 + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
    osc.connect(gain)
    gain.connect(this.master)
    osc.start(t0)
    osc.stop(t0 + duration + 0.02)
  }

  playSfx(name: SfxName): void {
    if (!this.unlocked) return
    switch (name) {
      case 'click': this.blip(520, 0.08, 'triangle'); break
      case 'correct':
        this.blip(660, 0.1, 'sine')
        this.blip(880, 0.14, 'sine', 0.09)
        break
      case 'wrong': this.blip(220, 0.18, 'sawtooth'); break
      case 'flip': this.blip(440, 0.06, 'square'); break
      case 'pickup': this.blip(740, 0.1, 'triangle'); break
      case 'open':
        this.blip(330, 0.1, 'sine')
        this.blip(495, 0.12, 'sine', 0.08)
        break
      case 'feed': this.blip(587, 0.1, 'sine'); break
      case 'reward':
        this.blip(523, 0.1, 'sine')
        this.blip(784, 0.16, 'sine', 0.1)
        break
      case 'evolve':
        [523, 659, 784, 1047].forEach((f, i) => this.blip(f, 0.16, 'sine', i * 0.09))
        break
    }
  }
}

export const audio = new AudioManager()

/** 绑定"首次交互解锁"（pointerdown / keydown，一次性） */
export function bindAudioUnlock(): () => void {
  const handler = () => {
    audio.unlock()
  }
  window.addEventListener('pointerdown', handler)
  window.addEventListener('keydown', handler)
  return () => {
    window.removeEventListener('pointerdown', handler)
    window.removeEventListener('keydown', handler)
  }
}
