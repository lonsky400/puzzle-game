/**
 * 拼图音效：拾取、放置、合并（Web Audio API 短音，不打扰；合并音偏愉悦）
 */

let audioContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioContext) audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  return audioContext;
}

function playTone(
  frequency: number,
  duration: number,
  volume: number,
  type: OscillatorType = 'sine',
  fadeOut = true,
) {
  const ctx = getContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(frequency, now);
    osc.type = type;
    gain.gain.setValueAtTime(volume, now);
    if (fadeOut) gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  } catch {
    // ignore
  }
}

/** 拾取：极短、极轻，不打扰 */
export function playPickup() {
  const ctx = getContext();
  if (ctx?.state === 'suspended') ctx.resume();
  playTone(280, 0.04, 0.06, 'sine', true);
}

/** 移动中：可选，非常轻的提示（当前不播放，避免频繁打扰） */
export function playMove() {
  // 不播放，或极偶尔一次 tick
}

/** 放置：短促、柔和 */
export function playPlace() {
  const ctx = getContext();
  if (ctx?.state === 'suspended') ctx.resume();
  playTone(360, 0.06, 0.08, 'sine', true);
}

/** 合并：愉悦短和弦，偏清脆（快起、短衰减） */
export function playMerge() {
  const ctx = getContext();
  if (ctx?.state === 'suspended') ctx.resume();
  const now = ctx?.currentTime ?? 0;
  if (!ctx) return;
  try {
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    const freqs = [523.25, 659.25, 783.99];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.connect(gain);
      osc.frequency.setValueAtTime(f, now);
      osc.type = 'sine';
      osc.start(now + i * 0.018);
      osc.stop(now + 0.24);
    });
  } catch {
    playTone(523.25, 0.18, 0.15, 'sine', true);
  }
}

/** 闯关成功：简短祝贺音效，简洁愉悦 */
export function playWin() {
  const ctx = getContext();
  if (ctx?.state === 'suspended') ctx.resume();
  const now = ctx?.currentTime ?? 0;
  if (!ctx) return;
  try {
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    const freqs = [523.25, 659.25, 783.99, 1046.5];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.connect(gain);
      osc.frequency.setValueAtTime(f, now + i * 0.06);
      osc.type = 'sine';
      osc.start(now + i * 0.06);
      osc.stop(now + 0.5);
    });
  } catch {
    playTone(523.25, 0.35, 0.15, 'sine', true);
  }
}
