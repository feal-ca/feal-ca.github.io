// Two rotating discs falling into each other, integrated with leapfrog.
// The force calculation switches between direct summation and a Barnes-Hut
// quadtree with an adjustable opening angle. The tree is rebuilt every step
// and drawn, and the readout counts the interactions each method evaluates.
// Clicking drops a new clump of bodies into the field.

import { rgba, type Create, type Palette } from "./types";

const START = 600;
const MAX = 1200;
const M = 1 / START;            // every body has the same mass
const EPS2 = 0.03 * 0.03;
const DT = 0.0015;
const STEPS_PER_FRAME = 2;
const BUDGET_MS = 8;            // direct summation on 1,200 bodies is heavy
const RESTART_AFTER = 7000;     // steps; the merger has settled by then
const VIEW_W = 3.2;             // world units across the plate (16:7)
const CLUMP = 70;

const CAP = 8 * MAX;
const nx0 = new Float64Array(CAP);
const ny0 = new Float64Array(CAP);
const ns = new Float64Array(CAP);
const nm = new Float64Array(CAP);
const nmx = new Float64Array(CAP);
const nmy = new Float64Array(CAP);
const body = new Int32Array(CAP);       // -1 empty leaf, -2 internal, else body
const child = new Int32Array(CAP * 4);
const stack = new Int32Array(CAP);

export const create: Create = (params) => {
  let barnesHut = (params.mode ?? 1) === 1;
  let theta = params.theta ?? 0.7;
  let trails = (params.trails ?? 0) === 1;
  const x = new Float64Array(MAX), y = new Float64Array(MAX);
  const vx = new Float64Array(MAX), vy = new Float64Array(MAX);
  const ax = new Float64Array(MAX), ay = new Float64Array(MAX);
  const group = new Uint8Array(MAX);      // 0, 1: the discs; 2: dropped clumps
  let n = 0;
  let nodes = 0;
  let interactions = 0;
  let steps = 0;

  // A disc of bodies on roughly circular orbits around its own center.
  const disc = (count: number, cx: number, cy: number, bvx: number, radius: number, grp: number) => {
    const mass = count * M;
    for (let k = 0; k < count && n < MAX; k++, n++) {
      const r = radius * Math.sqrt(Math.random());
      const a = Math.random() * 2 * Math.PI;
      x[n] = cx + r * Math.cos(a);
      y[n] = cy + r * Math.sin(a);
      const v = 0.9 * Math.sqrt((mass * (r / radius) ** 2) / (r + 0.03));
      vx[n] = bvx - v * Math.sin(a);
      vy[n] = v * Math.cos(a);
      group[n] = grp;
    }
  };

  const reset = () => {
    n = 0;
    disc(START / 2, -0.62, -0.14, 0.34, 0.2, 0);
    disc(START / 2, 0.62, 0.14, -0.34, 0.2, 1);
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
    if (depth > 24 || nodes > CAP - 8) { body[i] = -2; return; }   // coincident
    if (body[i] >= 0) {
      const old = body[i];
      body[i] = -2;
      insertChild(i, old, depth);
    }
    insertChild(i, b, depth);
  };

  const build = () => {
    let lo = Infinity, hi = -Infinity;
    for (let k = 0; k < n; k++) {
      lo = Math.min(lo, x[k], y[k]);
      hi = Math.max(hi, x[k], y[k]);
    }
    nodes = 0;
    const root = newNode(lo - 1e-6, lo - 1e-6, hi - lo + 2e-6);
    for (let k = 0; k < n; k++) insert(root, k, 0);
  };

  // --- Forces -------------------------------------------------------------
  const forces = () => {
    ax.fill(0); ay.fill(0);
    if (!barnesHut) {
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const dx = x[j] - x[i], dy = y[j] - y[i];
          const d2 = dx * dx + dy * dy + EPS2;
          const inv = M / (d2 * Math.sqrt(d2));
          ax[i] += dx * inv; ay[i] += dy * inv;
          ax[j] -= dx * inv; ay[j] -= dy * inv;
        }
      }
      interactions = (n * (n - 1)) / 2;
      return;
    }
    build();
    interactions = 0;
    const t2 = theta * theta;
    for (let b = 0; b < n; b++) {
      let top = 0;
      stack[top++] = 0;
      while (top) {
        const i = stack[--top];
        if (nm[i] === 0 || body[i] === b) continue;
        const cx = nmx[i] / nm[i], cy = nmy[i] / nm[i];
        const dx = cx - x[b], dy = cy - y[b];
        const d2 = dx * dx + dy * dy;
        if (body[i] >= 0 || ns[i] * ns[i] < t2 * d2) {
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
    for (let k = 0; k < n; k++) {
      vx[k] += 0.5 * DT * ax[k]; vy[k] += 0.5 * DT * ay[k];
      x[k] += DT * vx[k]; y[k] += DT * vy[k];
    }
    forces();
    for (let k = 0; k < n; k++) {
      vx[k] += 0.5 * DT * ax[k]; vy[k] += 0.5 * DT * ay[k];
    }
    if (++steps > RESTART_AFTER) reset();
  };

  reset();

  // Trails accumulate on their own layer so the tree can be drawn crisp on
  // top every frame instead of smearing with the bodies.
  const layer = document.createElement("canvas");
  const lctx = layer.getContext("2d")!;
  let fresh = true;

  return {
    step() {
      const t0 = performance.now();
      let k = 0;
      do { step(); k++; } while (k < STEPS_PER_FRAME && performance.now() - t0 < BUDGET_MS / 2);
    },
    set(name, v) {
      if (name === "mode") barnesHut = v === 1;
      if (name === "theta") theta = v;
      if (name === "trails") { trails = v === 1; fresh = true; }
      forces();
    },
    readout() {
      const count = Math.round(interactions).toLocaleString("en-US");
      return `${n.toLocaleString("en-US")} bodies, ${count} ${barnesHut ? "interactions" : "pair interactions"} per step`;
    },
    pointer(p) {
      if (p.type !== "down" || n >= MAX) return false;
      const wx = (p.x - 0.5) * VIEW_W;
      const wy = (0.5 - p.y) * (VIEW_W * 7) / 16;
      disc(Math.min(CLUMP, MAX - n), wx, wy, 0, 0.09, 2);
      forces();
      return false;
    },
    cursor() {
      return n < MAX ? "copy" : "not-allowed";
    },
    draw(ctx, p: Palette, w, h) {
      const s = w / VIEW_W;
      const px = (v: number) => w / 2 + v * s;
      const py = (v: number) => h / 2 - v * s;
      const dpr = ctx.getTransform().a;

      if (layer.width !== ctx.canvas.width || layer.height !== ctx.canvas.height) {
        layer.width = ctx.canvas.width;
        layer.height = ctx.canvas.height;
        fresh = true;
      }
      lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (fresh || !trails) {
        lctx.clearRect(0, 0, w, h);
        fresh = false;
      } else {
        lctx.globalCompositeOperation = "destination-out";
        lctx.fillStyle = "rgba(0,0,0,0.16)";
        lctx.fillRect(0, 0, w, h);
        lctx.globalCompositeOperation = "source-over";
      }
      const colors = [p.accent, p.ink, p.pencil];
      for (let grp = 0; grp < 3; grp++) {
        lctx.fillStyle = rgba(colors[grp], 0.9);
        for (let k = 0; k < n; k++) {
          if (group[k] !== grp) continue;
          lctx.fillRect(px(x[k]) - 1, py(y[k]) - 1, 2, 2);
        }
      }

      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(layer, 0, 0);
      ctx.restore();

      if (barnesHut) {
        ctx.strokeStyle = rgba(p.muted, 0.85);
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
    },
  };
};

