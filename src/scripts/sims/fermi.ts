// Metropolis Monte Carlo over 24 spinless fermions on 48 evenly spaced
// levels. Each proposal moves one fermion to an empty level (the exclusion
// principle is the "empty"), accepted with min(1, exp(-dE / T)). The
// time-averaged occupancy is drawn as bars against the Fermi-Dirac curve,
// with mu solved so the curve holds the same 24 particles. One accepted move
// per frame is drawn on the ladder as an arc that fades out.

import { rgba, type Create, type Palette } from "./types";

const LEVELS = 48;
const PARTICLES = 24;
const PROPOSALS_PER_FRAME = 800;
const MEMORY = 20000;           // samples; older ones fade so T changes show

const ARC_LIFE = 36;            // frames

export const create: Create = (params) => {
  let T = params.T ?? 2;
  const arcs: { from: number; to: number; age: number }[] = [];
  let recorded = false;
  const occ = new Uint8Array(LEVELS);
  const avg = new Float64Array(LEVELS);
  for (let k = 0; k < PARTICLES; k++) occ[k] = 1;
  avg.set(occ);
  let samples = 0;

  const mu = () => {
    let lo = -40, hi = LEVELS + 40;
    for (let it = 0; it < 60; it++) {
      const m = (lo + hi) / 2;
      let n = 0;
      for (let k = 0; k < LEVELS; k++) n += 1 / (1 + Math.exp((k - m) / T));
      if (n > PARTICLES) hi = m; else lo = m;
    }
    return (lo + hi) / 2;
  };
  let muNow = mu();

  const propose = () => {
    const a = (Math.random() * LEVELS) | 0;
    const b = (Math.random() * LEVELS) | 0;
    if (occ[a] === 0 || occ[b] === 1) return;
    const dE = b - a;
    if (dE <= 0 || Math.random() < Math.exp(-dE / T)) {
      occ[a] = 0;
      occ[b] = 1;
      if (!recorded && a !== b) {
        arcs.push({ from: a, to: b, age: 0 });
        recorded = true;
      }
    }
  };

  return {
    step() {
      recorded = false;
      for (const arc of arcs) arc.age++;
      while (arcs.length && arcs[0].age > ARC_LIFE) arcs.shift();
      for (let k = 0; k < PROPOSALS_PER_FRAME; k++) {
        propose();
        if ((k & 3) === 0) {
          samples++;
          const rate = 1 / Math.min(samples, MEMORY);
          for (let l = 0; l < LEVELS; l++) avg[l] += (occ[l] - avg[l]) * rate;
        }
      }
    },
    set(name, v) {
      if (name !== "T") return;
      T = v;
      muNow = mu();
      samples = Math.min(samples, 200);   // keep the old average as a start
    },
    readout() {
      return `T = ${T.toFixed(1)}, ${samples.toLocaleString("en-US")} samples`;
    },
    draw(ctx, p: Palette, w, h) {
      ctx.clearRect(0, 0, w, h);
      const top = h * 0.06, span = h * 0.88;
      const ly = (e: number) => top + span * (1 - (e + 0.5) / LEVELS);
      const gap = span / LEVELS;

      // Ladder: every level, with the current configuration on it.
      const l0 = w * 0.05, l1 = w * 0.2;
      ctx.lineWidth = 1;
      for (let k = 0; k < LEVELS; k++) {
        ctx.strokeStyle = rgba(p.muted, 0.7);
        ctx.beginPath();
        ctx.moveTo(l0, ly(k));
        ctx.lineTo(l1, ly(k));
        ctx.stroke();
        if (occ[k]) {
          ctx.fillStyle = rgba(p.accent);
          ctx.beginPath();
          ctx.arc((l0 + l1) / 2, ly(k), Math.min(gap * 0.38, 4), 0, 2 * Math.PI);
          ctx.fill();
        }
      }

      // Recent accepted moves, as arcs to the right of the ladder.
      ctx.lineWidth = 1.5;
      for (const arc of arcs) {
        const y0 = ly(arc.from), y1 = ly(arc.to);
        const bulge = l1 + 6 + Math.min(Math.abs(y1 - y0) * 0.5, w * 0.06);
        ctx.strokeStyle = rgba(p.ink, 0.8 * (1 - arc.age / ARC_LIFE));
        ctx.beginPath();
        ctx.moveTo(l1 + 2, y0);
        ctx.quadraticCurveTo(bulge, (y0 + y1) / 2, l1 + 2, y1);
        ctx.stroke();
      }

      // Occupancy, sideways so it shares the ladder's energy axis.
      const x0 = w * 0.3, fw = w * 0.64;
      ctx.fillStyle = rgba(p.accent, 0.35);
      for (let k = 0; k < LEVELS; k++) {
        ctx.fillRect(x0, ly(k) - gap * 0.35, avg[k] * fw, gap * 0.7);
      }
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = rgba(p.muted);
      ctx.beginPath();
      ctx.moveTo(x0 + fw, top);
      ctx.lineTo(x0 + fw, top + span);
      ctx.moveTo(l0, ly(muNow));
      ctx.lineTo(x0 + fw, ly(muNow));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = rgba(p.muted);
      ctx.beginPath();
      ctx.moveTo(x0, top);
      ctx.lineTo(x0, top + span);
      ctx.stroke();

      ctx.strokeStyle = rgba(p.pencil);
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let s = 0; s <= 240; s++) {
        const e = -0.5 + (LEVELS * s) / 240;
        const f = 1 / (1 + Math.exp((e - muNow) / T));
        const X = x0 + f * fw, Y = ly(e);
        if (s) ctx.lineTo(X, Y); else ctx.moveTo(X, Y);
      }
      ctx.stroke();
    },
  };
};
