// Two rotating discs falling into each other, integrated with leapfrog.
// The control switches the force calculation between direct summation and a
// Barnes-Hut quadtree (theta = 0.7). The tree is rebuilt every step and
// drawn, and the readout counts the interactions each method evaluates.

import { rgba, type Create, type Palette } from "./types";

const N = 600;
const M = 1 / N;
const EPS2 = 0.03 * 0.03;
const DT = 0.0015;
const THETA = 0.7;
const STEPS_PER_FRAME = 2;
const RESTART_AFTER = 6000;     // steps; the merger has settled by then
const VIEW_W = 3.2;
const VIEW_H = 1.4;             // 16:7

const CAP = 8 * N;
const nx0 = new Float64Array(CAP);
const ny0 = new Float64Array(CAP);
const ns = new Float64Array(CAP);
const nm = new Float64Array(CAP);
const nmx = new Float64Array(CAP);
const nmy = new Float64Array(CAP);
const body = new Int32Array(CAP);       // -1 empty leaf, -2 internal, else body
const child = new Int32Array(CAP * 4);
const stack = new Int32Array(CAP);

export const create: Create = (initialMode) => {
  let barnesHut = initialMode === 1;
  const x = new Float64Array(N), y = new Float64Array(N);
  const vx = new Float64Array(N), vy = new Float64Array(N);
  const ax = new Float64Array(N), ay = new Float64Array(N);
  let nodes = 0;
  let interactions = 0;
  let steps = 0;

  const reset = () => {
    for (let k = 0; k < N; k++) {
      const blob = k < N / 2 ? 0 : 1;
      const [cx, cy, bvx] = blob ? [0.62, 0.14, -0.34] : [-0.62, -0.14, 0.34];
      const r = 0.2 * Math.sqrt(Math.random());
      const a = Math.random() * 2 * Math.PI;
      x[k] = cx + r * Math.cos(a);
      y[k] = cy + r * Math.sin(a);
      // Roughly circular orbits inside a uniform disc of half the mass.
      const v = 0.9 * Math.sqrt((0.5 * (r / 0.2) ** 2) / (r + 0.03));
      vx[k] = bvx - v * Math.sin(a);
      vy[k] = v * Math.cos(a);
    }
    steps = 0;
    forces();
  };

  // --- Barnes-Hut tree ----------------------------------------------------
  const newNode = (x0: number, y0: number, s: number) => {
    const i = nodes++;
    nx0[i] = x0; ny0[i] = y0; ns[i] = s;
    nm[i] = 0; nmx[i] = 0; nmy[i] = 0;
    body[i] = -1;
    child[4 * i] = child[4 * i + 1] = child[4 * i + 2] = child[4 * i + 3] = -1;
    return i;
  };

  const insertChild = (i: number, b: number, depth: number) => {
    const h = ns[i] / 2;
    const qx = x[b] >= nx0[i] + h ? 1 : 0;
    const qy = y[b] >= ny0[i] + h ? 1 : 0;
    const slot = 4 * i + qx + 2 * qy;
    if (child[slot] < 0) child[slot] = newNode(nx0[i] + qx * h, ny0[i] + qy * h, h);
    insert(child[slot], b, depth + 1);
  };

  const insert = (i: number, b: number, depth: number): void => {
    nm[i] += M; nmx[i] += M * x[b]; nmy[i] += M * y[b];
    if (body[i] === -1) { body[i] = b; return; }
    if (body[i] >= 0) {
      const old = body[i];
      body[i] = -2;
      if (depth > 24 || nodes > CAP - 8) return;   // coincident bodies
      insertChild(i, old, depth);
    }
    if (depth > 24 || nodes > CAP - 8) return;
    insertChild(i, b, depth);
  };

  const build = () => {
    let lo = Infinity, hi = -Infinity;
    for (let k = 0; k < N; k++) {
      lo = Math.min(lo, x[k], y[k]);
      hi = Math.max(hi, x[k], y[k]);
    }
    nodes = 0;
    const root = newNode(lo - 1e-6, lo - 1e-6, hi - lo + 2e-6);
    for (let k = 0; k < N; k++) insert(root, k, 0);
  };

  // --- Forces -------------------------------------------------------------
  const forces = () => {
    ax.fill(0); ay.fill(0);
    if (!barnesHut) {
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = x[j] - x[i], dy = y[j] - y[i];
          const d2 = dx * dx + dy * dy + EPS2;
          const inv = M / (d2 * Math.sqrt(d2));
          ax[i] += dx * inv; ay[i] += dy * inv;
          ax[j] -= dx * inv; ay[j] -= dy * inv;
        }
      }
      interactions = (N * (N - 1)) / 2;
      return;
    }
    build();
    interactions = 0;
    for (let b = 0; b < N; b++) {
      let top = 0;
      stack[top++] = 0;
      while (top) {
        const i = stack[--top];
        if (nm[i] === 0 || body[i] === b) continue;
        const cx = nmx[i] / nm[i], cy = nmy[i] / nm[i];
        const dx = cx - x[b], dy = cy - y[b];
        const d2 = dx * dx + dy * dy;
        if (body[i] >= 0 || ns[i] * ns[i] < THETA * THETA * d2) {
          const r2 = d2 + EPS2;
          const inv = nm[i] / (r2 * Math.sqrt(r2));
          ax[b] += dx * inv; ay[b] += dy * inv;
          interactions++;
        } else {
          for (let q = 0; q < 4; q++) {
            const c = child[4 * i + q];
            if (c >= 0) stack[top++] = c;
          }
        }
      }
    }
  };

  const step = () => {
    for (let k = 0; k < N; k++) {
      vx[k] += 0.5 * DT * ax[k]; vy[k] += 0.5 * DT * ay[k];
      x[k] += DT * vx[k]; y[k] += DT * vy[k];
    }
    forces();
    for (let k = 0; k < N; k++) {
      vx[k] += 0.5 * DT * ax[k]; vy[k] += 0.5 * DT * ay[k];
    }
    if (++steps > RESTART_AFTER) reset();
  };

  reset();

  return {
    step() {
      for (let k = 0; k < STEPS_PER_FRAME; k++) step();
    },
    set(v) {
      barnesHut = v === 1;
      forces();
    },
    readout() {
      const n = Math.round(interactions).toLocaleString("en-US");
      return barnesHut
        ? `${n} interactions per step (θ = ${THETA})`
        : `${n} pair interactions per step`;
    },
    draw(ctx, p: Palette, w, h) {
      ctx.clearRect(0, 0, w, h);
      const s = w / VIEW_W;
      const px = (v: number) => w / 2 + v * s;
      const py = (v: number) => h / 2 - v * s;
      if (barnesHut) {
        ctx.strokeStyle = rgba(p.muted, 0.8);
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        for (let i = 0; i < nodes; i++) {
          if (body[i] !== -2) continue;
          const h2 = ns[i] / 2;
          ctx.moveTo(px(nx0[i]), py(ny0[i] + h2));
          ctx.lineTo(px(nx0[i] + ns[i]), py(ny0[i] + h2));
          ctx.moveTo(px(nx0[i] + h2), py(ny0[i]));
          ctx.lineTo(px(nx0[i] + h2), py(ny0[i] + ns[i]));
        }
        ctx.stroke();
      }
      for (let blob = 0; blob < 2; blob++) {
        ctx.fillStyle = rgba(blob ? p.ink : p.accent, 0.9);
        const from = blob * (N / 2);
        for (let k = from; k < from + N / 2; k++) {
          ctx.fillRect(px(x[k]) - 1, py(y[k]) - 1, 2, 2);
        }
      }
    },
  };
};
