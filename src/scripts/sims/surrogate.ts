// Surrogate-based optimization on a fixed budget, in one dimension.
//
// A made-up lift-to-drag curve over flap angle stands in for the CFD solver.
// Each "run" evaluates it once. A Gaussian process (squared-exponential
// kernel) is fitted to the runs so far, and expected improvement picks where
// the next run should go. The true curve is drawn only once the budget is
// spent. None of the numbers are the project's.

import { clamp, rgba, type Create, type Palette } from "./types";

const A0 = 6, A1 = 34;                 // flap angle range, degrees
const GRID = 161;
const ELL = 0.11;                      // kernel length scale, in x in [0, 1]
const SIG2 = 0.04 * 0.04;              // kernel variance
const NOISE = 1e-6;
const XI = 0.003;                      // exploration margin in EI
const FIRST = 0.25;                    // the starting design
const AUTO_EVERY = 48;                 // frames between automatic runs
const FONT = '500 12px "Barlow Semi Condensed", "Arial Narrow", sans-serif';

// The stand-in for CFD: a broad optimum, a decoy bump and a fall-off.
const truth = (x: number) =>
  1 + 0.17 * Math.exp(-(((x - 0.69) / 0.12) ** 2))
    + 0.07 * Math.exp(-(((x - 0.3) / 0.07) ** 2))
    - 0.22 * (x - 0.5) ** 2;

const angle = (x: number) => A0 + x * (A1 - A0);
const xs = Array.from({ length: GRID }, (_, i) => i / (GRID - 1));
const kern = (a: number, b: number) => SIG2 * Math.exp(-((a - b) ** 2) / (2 * ELL * ELL));
const phi = (z: number) => Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
// Abramowitz and Stegun 7.1.26, plenty for a picture.
const Phi = (z: number) => {
  const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t
    + 0.254829592) * t * Math.exp(-(z * z) / 2);
  return z >= 0 ? 0.5 * (1 + y) : 0.5 * (1 - y);
};

export const create: Create = (params) => {
  let budget = params.budget ?? 10;
  const runX: number[] = [FIRST];
  const runY: number[] = [truth(FIRST)];
  const base = runY[0];
  let mu = new Float64Array(GRID), sd = new Float64Array(GRID), ei = new Float64Array(GRID);
  let next = 0;
  let frames = 0;
  let flash = 0;

  // Fit the GP: Cholesky of the kernel matrix, then mean, sd and EI on the grid.
  const fit = () => {
    const n = runX.length;
    const mean = runY.reduce((a, b) => a + b, 0) / n;
    const L = Array.from({ length: n }, () => new Float64Array(n));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j <= i; j++) {
        let s = kern(runX[i], runX[j]) + (i === j ? NOISE : 0);
        for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k];
        L[i][j] = i === j ? Math.sqrt(Math.max(s, 1e-12)) : s / L[j][j];
      }
    }
    const solve = (b: Float64Array) => {
      const z = new Float64Array(n);
      for (let i = 0; i < n; i++) {
        let s = b[i];
        for (let k = 0; k < i; k++) s -= L[i][k] * z[k];
        z[i] = s / L[i][i];
      }
      return z;
    };
    const resid = Float64Array.from(runY, (y) => y - mean);
    // alpha = K^-1 r, by forward then back substitution.
    const z = solve(resid);
    const alpha = new Float64Array(n);
    for (let i = n - 1; i >= 0; i--) {
      let s = z[i];
      for (let k = i + 1; k < n; k++) s -= L[k][i] * alpha[k];
      alpha[i] = s / L[i][i];
    }
    const best = Math.max(...runY);
    let bestEi = -1;
    for (let g = 0; g < GRID; g++) {
      const ks = Float64Array.from(runX, (x) => kern(xs[g], x));
      let m = mean;
      for (let i = 0; i < n; i++) m += ks[i] * alpha[i];
      const v = solve(ks);
      let vv = SIG2;
      for (let i = 0; i < n; i++) vv -= v[i] * v[i];
      const s = Math.sqrt(Math.max(vv, 1e-12));
      mu[g] = m;
      sd[g] = s;
      const imp = m - best - XI;
      const zz = imp / s;
      ei[g] = s < 1e-6 ? 0 : imp * Phi(zz) + s * phi(zz);
      if (ei[g] > bestEi) { bestEi = ei[g]; next = xs[g]; }
    }
  };

  const spent = () => runX.length - 1 >= budget;

  const run = (x: number) => {
    if (spent()) return;
    runX.push(x);
    runY.push(truth(x));
    flash = 30;
    fit();
  };

  fit();

  // Layout, in canvas fractions.
  const P = { x0: 0.36, x1: 0.97, y0: 0.08, y1: 0.62, e0: 0.72, e1: 0.9 };
  const lo = 0.86, hi = 1.26;         // L/D axis range

  return {
    step() {
      frames++;
      if (flash) flash--;
      if (frames % AUTO_EVERY === 0) run(next);
    },
    action(name) {
      if (name === "run") run(next);
    },
    set(name, v) {
      if (name === "budget") budget = v;
    },
    pointer(p) {
      if (p.type !== "down") return false;
      if (p.x < P.x0 || p.x > P.x1 || p.y < P.y0 || p.y > P.e1) return false;
      run(clamp((p.x - P.x0) / (P.x1 - P.x0), 0, 1));
      return false;
    },
    cursor(x, y) {
      return !spent() && x >= P.x0 && x <= P.x1 && y >= P.y0 && y <= P.e1 ? "crosshair" : "default";
    },
    readout() {
      const i = runY.indexOf(Math.max(...runY));
      const pct = ((runY[i] / base - 1) * 100).toFixed(1);
      const used = runX.length - 1;
      if (!spent()) {
        return `Run ${used} of ${budget}. Best: +${pct}% over the first design, at ${angle(runX[i]).toFixed(0)}°`;
      }
      let gx = 0;
      for (const x of xs) if (truth(x) > truth(gx)) gx = x;
      const opt = ((truth(gx) / base - 1) * 100).toFixed(1);
      return `Budget spent. Best: +${pct}% at ${angle(runX[i]).toFixed(0)}°; the true optimum is +${opt}% at ${angle(gx).toFixed(0)}°`;
    },
    draw(ctx, p: Palette, w, h) {
      ctx.clearRect(0, 0, w, h);
      const X = (x: number) => (P.x0 + x * (P.x1 - P.x0)) * w;
      const Y = (v: number) => (P.y1 - ((v - lo) / (hi - lo)) * (P.y1 - P.y0)) * h;
      const eiMax = Math.max(...ei, 1e-9);
      const E = (v: number) => (P.e1 - (v / eiMax) * (P.e1 - P.e0)) * h;

      ctx.font = FONT;
      ctx.textBaseline = "middle";

      // Axes.
      ctx.strokeStyle = rgba(p.ink, 0.8);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(X(0), P.y0 * h); ctx.lineTo(X(0), P.y1 * h); ctx.lineTo(X(1), P.y1 * h);
      ctx.moveTo(X(0), P.e1 * h); ctx.lineTo(X(1), P.e1 * h);
      ctx.stroke();
      // Text in ink: the muted figure color is too faint to read as text.
      ctx.fillStyle = rgba(p.ink, 0.75);
      ctx.textAlign = "center";
      for (const a of [6, 13, 20, 27, 34]) {
        ctx.fillText(`${a}°`, X((a - A0) / (A1 - A0)), (P.e1 + 0.05) * h);
      }
      ctx.textAlign = "right";
      ctx.fillText("Lift / drag", X(0) - 6, P.y0 * h + 4);
      ctx.fillText("Expected", X(0) - 6, P.e0 * h + 4);
      ctx.fillText("improvement", X(0) - 6, P.e0 * h + 18);

      // Uncertainty band and surrogate mean, clipped to the plot.
      ctx.fillStyle = rgba(p.accent, 0.16);
      ctx.save();
      ctx.beginPath();
      ctx.rect(X(0), P.y0 * h, X(1) - X(0), (P.y1 - P.y0) * h);
      ctx.clip();
      ctx.beginPath();
      for (let g = 0; g < GRID; g++) ctx.lineTo(X(xs[g]), Y(mu[g] + 2 * sd[g]));
      for (let g = GRID - 1; g >= 0; g--) ctx.lineTo(X(xs[g]), Y(mu[g] - 2 * sd[g]));
      ctx.fill();

      if (spent()) {
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = rgba(p.muted);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let g = 0; g < GRID; g++) ctx.lineTo(X(xs[g]), Y(truth(xs[g])));
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.strokeStyle = rgba(p.ink);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let g = 0; g < GRID; g++) ctx.lineTo(X(xs[g]), Y(mu[g]));
      ctx.stroke();

      // Best so far.
      const best = Math.max(...runY);
      ctx.setLineDash([2, 4]);
      ctx.strokeStyle = rgba(p.accent);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(X(0), Y(best)); ctx.lineTo(X(1), Y(best));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Expected improvement, and where the next run goes.
      ctx.fillStyle = rgba(p.pencil, 0.22);
      ctx.strokeStyle = rgba(p.pencil);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(X(0), E(0));
      for (let g = 0; g < GRID; g++) ctx.lineTo(X(xs[g]), E(ei[g]));
      ctx.lineTo(X(1), E(0));
      ctx.fill();
      ctx.beginPath();
      for (let g = 0; g < GRID; g++) ctx.lineTo(X(xs[g]), E(ei[g]));
      ctx.stroke();
      if (!spent()) {
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(X(next), P.y0 * h);
        ctx.lineTo(X(next), P.e1 * h);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // The runs.
      for (let i = 0; i < runX.length; i++) {
        const last = i === runX.length - 1;
        ctx.beginPath();
        ctx.arc(X(runX[i]), Y(runY[i]), 4, 0, 2 * Math.PI);
        ctx.fillStyle = rgba(p.plate);
        ctx.fill();
        ctx.strokeStyle = rgba(last ? p.pencil : p.ink);
        ctx.lineWidth = 1.5;
        ctx.stroke();
        if (last && flash) {
          ctx.beginPath();
          ctx.arc(X(runX[i]), Y(runY[i]), 4 + (30 - flash) * 0.5, 0, 2 * Math.PI);
          ctx.strokeStyle = rgba(p.pencil, flash / 30);
          ctx.stroke();
        }
      }

      // The wing at the best flap angle so far, left of the plot.
      const bi = runY.indexOf(best);
      drawWing(ctx, p, w, h, angle(runX[bi]));
    },
  };
};

// A two-element front wing in section, inverted for downforce, with the
// flap at the given angle. Thickness from the NACA four-digit formula.
function section(chord: number, t: number, deg: number, x: number, y: number) {
  const pts: [number, number][] = [];
  const a = (deg * Math.PI) / 180;
  for (let s = 0; s <= 40; s++) {
    const u = (1 - Math.cos((s / 40) * Math.PI)) / 2;
    const yt = 5 * t * (0.2969 * Math.sqrt(u) - 0.126 * u - 0.3516 * u * u + 0.2843 * u ** 3 - 0.1015 * u ** 4);
    pts.push([u, -0.05 * Math.sin(Math.PI * u) - yt]);
  }
  for (let s = 40; s >= 0; s--) {
    const u = (1 - Math.cos((s / 40) * Math.PI)) / 2;
    const yt = 5 * t * (0.2969 * Math.sqrt(u) - 0.126 * u - 0.3516 * u * u + 0.2843 * u ** 3 - 0.1015 * u ** 4);
    pts.push([u, -0.05 * Math.sin(Math.PI * u) + yt]);
  }
  return pts.map(([u, v]) => [
    x + chord * (u * Math.cos(a) - v * Math.sin(a)),
    y - chord * (u * Math.sin(a) + v * Math.cos(a)),
  ] as [number, number]);
}

function drawWing(ctx: CanvasRenderingContext2D, p: Palette, w: number, h: number, deg: number) {
  const c = w * 0.17;
  const x = w * 0.03, y = h * 0.5;
  const main = section(c, 0.11, 4, x, y);
  const te = main[40];
  const flap = section(c * 0.55, 0.1, deg, te[0] - c * 0.08, te[1] - c * 0.07);
  ctx.fillStyle = rgba(p.ink);
  for (const el of [main, flap]) {
    ctx.beginPath();
    el.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = rgba(p.muted);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, h * 0.72);
  ctx.lineTo(x + c * 1.6, h * 0.72);
  ctx.stroke();
  ctx.fillStyle = rgba(p.ink, 0.75);
  ctx.font = FONT;
  ctx.textAlign = "left";
  ctx.fillText(`Best flap angle ${deg.toFixed(0)}°`, x, h * 0.8);
}
