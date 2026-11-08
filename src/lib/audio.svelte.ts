/**
 * Ember audio — pure Web Audio synthesis, zero assets, zero deps.
 * All sounds are short, warm, and quiet by design: ambience for a bedroom, not a stadium.
 * The context is created/resumed inside user gestures (unlockAudio) so Android WebView
 * autoplay policy never eats a sound. Reduced-motion users get silent deals by default.
 */

let ctx: AudioContext | null = null;
let muted = $state(false);

export function isMuted() { return muted; }
export function setMuted(m: boolean) {
  muted = m;
  try { localStorage.setItem('ember.muted', m ? '1' : '0'); } catch { /* private mode */ }
  if (m && ctx) ctx.suspend().catch(() => {});
  else if (!m && ctx) ctx.resume().catch(() => {});
}
export function loadMuted() {
  try { muted = localStorage.getItem('ember.muted') === '1'; } catch { /* fresh */ }
  return muted;
}

export function unlockAudio() {
  try {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();
  } catch { /* silence is fine */ }
}

function ac(): AudioContext | null {
  try {
    if (!ctx) ctx = new AudioContext();
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch { return null; }
}

/** short noise burst through a bandpass — the "whoosh" body */
function noiseBurst(c: AudioContext, dur: number, freq: number, q: number, gainV: number, when = 0) {
  const rate = c.sampleRate;
  const buf = c.createBuffer(1, Math.ceil(rate * dur), rate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = freq;
  bp.Q.value = q;
  const g = c.createGain();
  const t = c.currentTime + when;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gainV, t + dur * 0.3);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(bp).connect(g).connect(c.destination);
  src.start(t);
  src.stop(t + dur + 0.05);
}

function tone(c: AudioContext, freq: number, dur: number, gainV: number, when = 0, type: OscillatorType = 'sine', glideTo?: number) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  const t = c.currentTime + when;
  o.frequency.setValueAtTime(freq, t);
  if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gainV, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

/** card deal: a soft whoosh + warm landing tone. Quiet — it happens many times a night. */
export function deal() {
  if (muted) return;
  const c = ac(); if (!c) return;
  try {
    noiseBurst(c, 0.28, 900, 0.8, 0.05);
    tone(c, 320, 0.22, 0.05, 0.10, 'sine', 420);
  } catch { /* silence */ }
}

/** spice bomb: a low thrum + rising heat. Noticeable, not alarming. */
export function bomb() {
  if (muted) return;
  const c = ac(); if (!c) return;
  try {
    tone(c, 110, 0.5, 0.10, 0, 'triangle', 82);
    noiseBurst(c, 0.4, 300, 0.6, 0.04);
    tone(c, 520, 0.35, 0.05, 0.18, 'sine', 780);
  } catch { /* silence */ }
}

/** timer chime: two soft glasses. The old single-sine version, warmed up. */
export function chime() {
  if (muted) return;
  const c = ac(); if (!c) return;
  try {
    tone(c, 880, 0.5, 0.09, 0, 'sine');
    tone(c, 1320, 0.7, 0.07, 0.12, 'sine');
    tone(c, 1760, 0.9, 0.03, 0.24, 'sine');
  } catch { /* silence */ }
}

/** timer urgent tick (last 10s): tiny wooden tick per second — wired from the Card timer */
export function tick() {
  if (muted) return;
  const c = ac(); if (!c) return;
  try {
    tone(c, 660, 0.06, 0.035, 0, 'square');
  } catch { /* silence */ }
}

/** celebration swell: a warm major chord blooming. The night's last sound. */
export function swell() {
  if (muted) return;
  const c = ac(); if (!c) return;
  try {
    // F major-ish bloom: F3 A3 C4 F4 A4
    const notes: [number, number][] = [[174.6, 0], [220, 0.1], [261.6, 0.2], [349.2, 0.3], [440, 0.45]];
    for (const [f, w] of notes) tone(c, f, 1.6, 0.055, w, 'sine');
    noiseBurst(c, 1.2, 1400, 0.4, 0.012, 0.2); // shimmer
  } catch { /* silence */ }
}
