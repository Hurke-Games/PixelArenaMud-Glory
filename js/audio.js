// =========================================================
// js/audio.js — Retro 32-Bit Web Audio Synthesizer
// =========================================================
window.MG = window.MG || {};

MG.Audio = (function () {
  let ctx = null;
  let musicTimer = null;
  let musicStep = 0;

  function ensureCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    }
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  function getVolumes() {
    const opts = MG.Storage ? MG.Storage.getOptions() : { masterVol: 0.7, sfxVol: 0.8, musicVol: 0.35, muted: false };
    if (opts.muted) return { sfx: 0, music: 0 };
    return {
      sfx: (opts.masterVol ?? 0.7) * (opts.sfxVol ?? 0.8),
      music: (opts.masterVol ?? 0.7) * (opts.musicVol ?? 0.35)
    };
  }

  function tone(freq, duration, type = "square", vol = 0.2, slideTo = null) {
    const c = ensureCtx();
    if (!c || vol <= 0.001) return;
    const now = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + duration);
    }
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  function playSfx(name) {
    const { sfx } = getVolumes();
    if (sfx <= 0.001) return;
    const v = 0.22 * sfx;
    switch (name) {
      case "click":
        tone(520, 0.06, "square", v * 0.7, 680);
        break;
      case "hit":
        tone(170, 0.14, "sawtooth", v, 55);
        break;
      case "crit":
        tone(320, 0.09, "square", v, 760);
        setTimeout(() => tone(190, 0.18, "sawtooth", v, 50), 60);
        break;
      case "bow":
        tone(680, 0.12, "triangle", v, 240);
        break;
      case "spell":
        tone(360, 0.22, "sine", v, 880);
        setTimeout(() => tone(540, 0.18, "triangle", v * 0.8, 1080), 80);
        break;
      case "heal":
        tone(440, 0.1, "sine", v);
        setTimeout(() => tone(554, 0.1, "sine", v), 80);
        setTimeout(() => tone(659, 0.18, "sine", v), 160);
        break;
      case "dodge":
        tone(420, 0.08, "triangle", v * 0.7, 690);
        break;
      case "stun":
        tone(600, 0.1, "square", v * 0.7, 450);
        setTimeout(() => tone(500, 0.12, "square", v * 0.7, 360), 110);
        break;
      case "coin":
        tone(987, 0.07, "square", v * 0.6);
        setTimeout(() => tone(1318, 0.18, "square", v * 0.6), 70);
        break;
      case "victory":
        [523, 659, 784, 1046].forEach((f, i) => {
          setTimeout(() => tone(f, 0.18, "square", v * 0.8), i * 110);
        });
        break;
      case "defeat":
        [330, 293, 246, 196].forEach((f, i) => {
          setTimeout(() => tone(f, 0.24, "sawtooth", v * 0.7), i * 160);
        });
        break;
    }
  }

  // Cheerful medieval tavern chiptune loop
  const MELODY = [293, 349, 440, 392, 349, 330, 293, 261, 293, 349, 440, 523, 440, 392, 349, 330];
  function startMusic() {
    if (musicTimer) return;
    musicTimer = setInterval(() => {
      const { music } = getVolumes();
      if (music <= 0.001 || !ctx || ctx.state !== "running") return;
      const note = MELODY[musicStep % MELODY.length];
      tone(note, 0.16, "triangle", 0.08 * music);
      if (musicStep % 2 === 0) {
        tone(note / 2, 0.22, "sine", 0.06 * music);
      }
      musicStep++;
    }, 320);
  }

  function unlock() {
    ensureCtx();
    startMusic();
  }

  return { playSfx, unlock };
})();
