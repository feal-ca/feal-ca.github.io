// Surrogate-based optimization on a fixed budget, in one dimension.
//
// A made-up lift-to-drag curve over flap angle stands in for the CFD solver,
// and is drawn faintly so you can watch the surrogate learn it. Each "run"
// evaluates it once. A Gaussian process (squared-exponential kernel) is
// fitted to the runs so far, and expected improvement picks where the next
// run should go. None of the numbers are the project's.

import { clamp, rgba, type Create, type Palette } from "./types";

const A0 = 6, A1 = 34;                 // flap angle range, degrees
const GRID = 161;
const ELL = 0.11;                      // kernel length scale, in x in [0, 1]
const SIG2 = 0.04 * 0.04;              // kernel variance
const NOISE = 1e-6;
const XI = 0.003;                      // exploration margin in EI
const FIRST = 0.25;                    // the starting design
const AUTO_EVERY = 72;                 // frames between automatic runs
const FONT = '500 13px "Barlow Semi Condensed", "Arial Narrow", sans-serif';
const SMALL = '500 12px "Barlow Semi Condensed", "Arial Narrow", sans-serif';

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

let gx = 0;
for (const x of xs) if (truth(x) > truth(gx)) gx = x;   // the true optimum

export const create: Create = (params) => {
  let budget = params.budget ?? 10;
  const runX: number[] = [FIRST];
  const runY: number[] = [truth(FIRST)];
  const base = runY[0];
  const mu = new Float64Array(GRID), sd = new Float64Array(GRID), ei = new Float64Array(GRID);
  let next = 0;
  let frames = 0;
  let flash = 0;
  let flap = angle(FIRST);           // drawn flap angle, eases to the latest run

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
    const z = solve(Float64Array.from(runY, (y) => y - mean));
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

  const used = () => runX.length - 1;
  const spent = () => used() >= budget;
  const pct = (y: number) => ((y / base - 1) * 100).toFixed(1);

  const run = (x: number) => {
    if (spent()) return;
    runX.push(x);
    runY.push(truth(x));
    flash = 30;
    fit();
  };

  fit();

  // Layout, in canvas fractions.
  const P = { x0: 0.37, x1: 0.97, y0: 0.13, y1: 0.63, e0: 0.72, e1: 0.87 };
  const lo = 0.86, hi = 1.26;          // L/D axis range

  return {
    step() {
      frames++;
      if (flash) flash--;
      flap += (angle(runX[runX.length - 1]) - flap) * 0.12;
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
      if (!spent()) {
        return `Run ${used()} of ${budget}. Best so far: +${pct(runY[i])}% at ${angle(runX[i]).toFixed(0)}°.`;
      }
      return `Budget spent. Best found: +${pct(runY[i])}% at ${angle(runX[i]).toFixed(0)}°. True optimum: +${pct(truth(gx))}% at ${angle(gx).toFixed(0)}°.`;
    },
    draw(ctx, p: Palette, w, h) {
      ctx.clearRect(0, 0, w, h);
      const X = (x: number) => (P.x0 + x * (P.x1 - P.x0)) * w;
      const Y = (v: number) => (P.y1 - ((v - lo) / (hi - lo)) * (P.y1 - P.y0)) * h;
      const eiMax = Math.max(...ei, 1e-9);
      const E = (v: number) => (P.e1 - (v / eiMax) * (P.e1 - P.e0)) * h;
      const text = rgba(p.ink, 0.78);   // the muted figure color is too faint for text
      const best = Math.max(...runY);

      // --- Axes and labels ---------------------------------------------------
      ctx.strokeStyle = rgba(p.ink, 0.8);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(X(0), P.y0 * h); ctx.lineTo(X(0), P.y1 * h); ctx.lineTo(X(1), P.y1 * h);
      ctx.moveTo(X(0), P.e1 * h); ctx.lineTo(X(1), P.e1 * h);
      ctx.stroke();
      ctx.font = SMALL;
      ctx.fillStyle = text;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      for (const a of [6, 13, 20, 27, 34]) ctx.fillText(`${a}°`, X((a - A0) / (A1 - A0)), (P.e1 + 0.05) * h);
      ctx.textAlign = "right";
      ctx.fillText("Flap angle", X(1), (P.e1 + 0.1) * h);
      ctx.textAlign = "left";
      ctx.fillText("Lift / drag", X(0) + 6, P.y0 * h + 2);
      ctx.fillText("Expected improvement", X(0) + 6, P.e0 * h - 10);

      // --- Budget, as dots ------------------------------------------------
      const dot = Math.min(9, ((P.x1 - P.x0) * w * 0.5) / budget);
      ctx.textAlign = "right";
      const bx = X(1) - budget * dot;
      ctx.fillText("Budget", bx - 8, 0.05 * h);
      for (let k = 0; k < budget; k++) {
        ctx.beginPath();
        ctx.arc(bx + (k + 0.5) * dot, 0.05 * h, dot * 0.32, 0, 2 * Math.PI);
        ctx.lineWidth = 1.2;
        if (k < used()) { ctx.fillStyle = rgba(p.ink); ctx.fill(); }
        else { ctx.strokeStyle = rgba(p.ink, 0.6); ctx.stroke(); }
      }

      // --- Plot, clipped -------------------------------------------------------
      ctx.save();
      ctx.beginPath();
      ctx.rect(X(0), P.y0 * h, X(1) - X(0), (P.y1 - P.y0) * h);
      ctx.clip();

      ctx.fillStyle = rgba(p.accent, 0.16);
      ctx.beginPath();
      for (let g = 0; g < GRID; g++) ctx.lineTo(X(xs[g]), Y(mu[g] + 2 * sd[g]));
      for (let g = GRID - 1; g >= 0; g--) ctx.lineTo(X(xs[g]), Y(mu[g] - 2 * sd[g]));
      ctx.fill();

      // The true curve, faint: what CFD would return, unseen by the optimizer.
      ctx.setLineDash([2, 4]);
      ctx.strokeStyle = rgba(p.muted);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let g = 0; g < GRID; g++) ctx.lineTo(X(xs[g]), Y(truth(xs[g])));
      ctx.stroke();

      // Best so far.
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = rgba(p.accent);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(X(0), Y(best)); ctx.lineTo(X(1), Y(best));
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = rgba(p.ink);
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let g = 0; g < GRID; g++) ctx.lineTo(X(xs[g]), Y(mu[g]));
      ctx.stroke();
      ctx.restore();

      ctx.font = SMALL;
      ctx.fillStyle = rgba(p.accent);
      ctx.textAlign = "right";
      ctx.fillText(`best so far +${pct(best)}%`, X(1) - 4, Y(best) - 10);

      // --- Expected improvement, and where the next run goes ----------------
      ctx.fillStyle = rgba(p.pencil, 0.2);
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
        ctx.moveTo(X(next), P.y0 * h + 14);
        ctx.lineTo(X(next), P.e1 * h);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = rgba(p.pencil);
        ctx.textAlign = next > 0.85 ? "right" : "left";
        ctx.fillText("next run", X(next) + (next > 0.85 ? -5 : 5), P.y0 * h + 14);
      } else {
        ctx.strokeStyle = rgba(p.ink, 0.7);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(X(gx), Y(truth(gx)), 8, 0, 2 * Math.PI);
        ctx.stroke();
      }

      // --- The runs ---------------------------------------------------------
      for (let i = 0; i < runX.length; i++) {
        const last = i === runX.length - 1 && i > 0;
        ctx.beginPath();
        ctx.arc(X(runX[i]), Y(runY[i]), 4.5, 0, 2 * Math.PI);
        ctx.fillStyle = rgba(p.plate);
        ctx.fill();
        ctx.strokeStyle = rgba(last ? p.pencil : p.ink);
        ctx.lineWidth = 1.6;
        ctx.stroke();
        if (last && flash) {
          ctx.beginPath();
          ctx.arc(X(runX[i]), Y(runY[i]), 4.5 + (30 - flash) * 0.6, 0, 2 * Math.PI);
          ctx.strokeStyle = rgba(p.pencil, flash / 30);
          ctx.stroke();
        }
      }

      // --- The wing, flap at the latest run's angle --------------------------
      const li = runX.length - 1;
      drawWing(ctx, p, w, h, flap);
      ctx.font = FONT;
      ctx.textAlign = "left";
      ctx.fillStyle = rgba(p.ink);
      ctx.fillText(li ? `Run ${li}: flap at ${angle(runX[li]).toFixed(0)}°` : `First design: flap at ${angle(FIRST).toFixed(0)}°`, w * 0.03, h * 0.78);
      ctx.font = SMALL;
      ctx.fillStyle = text;
      const change = Number(pct(runY[li]));
      ctx.fillText(
        li ? `Lift / drag ${change >= 0 ? "+" : ""}${pct(runY[li])}% against the first design` : "The baseline every run is compared with",
        w * 0.03, h * 0.86,
      );
    },
  };
};

// A two-element front wing in section, inverted for downforce, with the
// flap at the given angle. Thickness from the NACA four-digit formula.
function section(chord: number, t: number, deg: number, x: number, y: number) {
  const pts: [number, number][] = [];
  const a = (deg * Math.PI) / 180;
  const surface = (s: number, sign: number) => {
    const u = (1 - Math.cos((s / 40) * Math.PI)) / 2;
    const yt = 5 * t * (0.2969 * Math.sqrt(u) - 0.126 * u - 0.3516 * u * u + 0.2843 * u ** 3 - 0.1015 * u ** 4);
    pts.push([u, -0.05 * Math.sin(Math.PI * u) + sign * yt]);
  };
  for (let s = 0; s <= 40; s++) surface(s, -1);
  for (let s = 40; s >= 0; s--) surface(s, 1);
  return pts.map(([u, v]) => [
    x + chord * (u * Math.cos(a) - v * Math.sin(a)),
    y - chord * (u * Math.sin(a) + v * Math.cos(a)),
  ] as [number, number]);
}

function drawWing(ctx: CanvasRenderingContext2D, p: Palette, w: number, h: number, deg: number) {
  const c = w * 0.19;
  const x = w * 0.03, y = h * 0.42;
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
  // Ground plane: a front wing works in ground effect.
  ctx.strokeStyle = rgba(p.muted);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, h * 0.66);
  ctx.lineTo(x + c * 1.6, h * 0.66);
  ctx.stroke();
}
