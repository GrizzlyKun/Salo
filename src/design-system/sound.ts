/**
 * Sonidos suaves con la Web Audio API — sin archivos, sin peso, offline.
 *
 * Filosofía: acertar suena agradable; errar hace un tono suave y breve, nunca
 * un "error" agresivo (equivocarse no penaliza). Con toggle de silencio
 * persistido. El AudioContext se crea perezosamente en el primer sonido (tras
 * un gesto del usuario), así que no molesta si nunca se usa.
 */

const KEY = 'salo-muted';

let muted =
  typeof localStorage !== 'undefined' && localStorage.getItem(KEY) === '1';

export function isMuted(): boolean {
  return muted;
}

export function setMuted(value: boolean): void {
  muted = value;
  try {
    localStorage.setItem(KEY, value ? '1' : '0');
  } catch {
    /* almacenamiento no disponible */
  }
}

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** Una nota corta con envolvente suave (fade in/out). */
function tone(
  freq: number,
  startOffset: number,
  duration: number,
  peak = 0.14,
): void {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(c.destination);
  const t0 = c.currentTime + startOffset;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.start(t0);
  osc.stop(t0 + duration + 0.03);
}

/** Pling ascendente al acertar. */
export function playCorrect(): void {
  if (muted) return;
  tone(660, 0, 0.13);
  tone(988, 0.085, 0.16);
}

/** Tono grave, suave y breve al fallar (sin dramatismo). */
export function playIncorrect(): void {
  if (muted) return;
  tone(200, 0, 0.16, 0.09);
}

/** Pequeño arpegio alegre (C–E–G) al completar. */
export function playComplete(): void {
  if (muted) return;
  [523.25, 659.25, 783.99].forEach((f, i) => tone(f, i * 0.11, 0.3));
}
