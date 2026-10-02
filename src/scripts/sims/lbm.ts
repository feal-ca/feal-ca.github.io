// D2Q9 lattice Boltzmann, BGK collision, flow past a cylinder you can drag.
//
// Pull streaming fused with collision (the access pattern the project found
// 3.6x faster than push), bounce-back on the cylinder, an equilibrium inlet,
// a zero-gradient outlet and periodic top and bottom. Colored by vorticity,
// with tracer particles advected through the velocity field on top.

import { clamp, rgba, type Create, type Palette } from "./types";

const NX = 208;
const NY = 91;                  // 16:7, the plate's aspect
const N = NX * NY;
const U0 = 0.08;                // inlet speed, lattice units
const R = 8;                    // cylinder radius; D = 16 cells
const STEPS_PER_FRAME = 6;
// The impulsive start sends pressure waves around the box and the street
// takes a while to form. Run that fast, behind the drawing, before showing
// anything.
const WARMUP = 1200;
const WARMUP_PER_FRAME = 40;
const TRACERS = 700;

const W0 = 4 / 9, W1 = 1 / 9, W2 = 1 / 36;
const EX = [0, 1, 0, -1, 0, 1, -1, -1, 1];
const EY = [0, 0, 1, 0, -1, 1, 1, -1, -1];
const W = [W0, W1, W1, W1, W1, W2, W2, W2, W2];
const OPP = [0, 3, 4, 1, 2, 7, 8, 5, 6];

function feq(q: number, rho: number, ux: number, uy: number) {
  const eu = EX[q] * ux + EY[q] * uy;
  return W[q] * rho * (1 + 3 * eu + 4.5 * eu * eu - 1.5 * (ux * ux + uy * uy));
}

export const create: Create = (params) => {
  let tau = params.tau ?? 0.54;
  let showTracers = (params.tracers ?? 1) === 1;
  let cx = 42, cy = 45;           // cylinder center; half a cell off-center
  let f = new Float32Array(9 * N);
  let g = new Float32Array(9 * N);
  const ux = new Float32Array(N);
  const uy = new Float32Array(N);
  const solid = new Uint8Array(N);
  const inlet = Array.from({ length: 9 }, (_, q) => feq(q, 1, U0, 0));
  let steps = 0;
  let dragging = false;

  const inside = (x: number, y: number) => (x - cx) ** 2 + (y - cy) ** 2 <= R * R;

  for (let y = 0; y < NY; y++) {
    for (let x = 0; x < NX; x++) {
      const i = y * NX + x;
      solid[i] = inside(x, y) ? 1 : 0;
      // A one-sided transverse kick in the near wake. A symmetric start can
      // sit as a steady twin-vortex wake for thousands of steps before
      // round-off tips it over.
      const vy = x > cx + R && x < cx + 6 * R ? 0.04 : 0;
      for (let q = 0; q < 9; q++) f[q * N + i] = feq(q, 1, U0, vy);
    }
  }

  // Move the cylinder: re-mask the cells around it, and give any cell that
  // has just become fluid the equilibrium of a fluid at rest, so it doesn't
  // carry the stale populations it held while solid.
  const moveTo = (nx: number, ny: number) => {
    nx = Math.round(clamp(nx, R + 6, NX * 0.62));
    ny = Math.round(clamp(ny, R + 3, NY - R - 4));
    if (nx === cx && ny === cy) return;
    const x0 = Math.min(cx, nx) - R - 1, x1 = Math.max(cx, nx) + R + 1;
    const y0 = Math.min(cy, ny) - R - 1, y1 = Math.max(cy, ny) + R + 1;
    cx = nx; cy = ny;
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const i = y * NX + x;
        const now = inside(x, y) ? 1 : 0;
        if (solid[i] && !now) {
          for (let q = 0; q < 9; q++) f[q * N + i] = feq(q, 1, 0, 0);
          ux[i] = 0; uy[i] = 0;
        }
        solid[i] = now;
      }
    }
  };

  // Pull one population: from the upstream neighbor, the inlet, the
  // outlet copy, or bounced back off the cylinder.
  const pull = (q: number, sx: number, sy: number, i: number) => {
    if (sx < 0) return inlet[q];
    if (sx >= NX) return f[q * N + i];
    const s = sy * NX + sx;
    return solid[s] ? f[OPP[q] * N + i] : f[q * N + s];
  };

  const step = () => {
    const om = 1 / tau;
    for (let y = 0; y < NY; y++) {
      const yn = y === NY - 1 ? 0 : y + 1;
      const ys = y === 0 ? NY - 1 : y - 1;
      for (let x = 0; x < NX; x++) {
        const i = y * NX + x;
        if (solid[i]) continue;
        const xw = x - 1, xe = x + 1;
        const f0 = f[i];
        const f1 = pull(1, xw, y, i);
        const f2 = pull(2, x, ys, i);
        const f3 = pull(3, xe, y, i);
        const f4 = pull(4, x, yn, i);
        const f5 = pull(5, xw, ys, i);
        const f6 = pull(6, xe, ys, i);
        const f7 = pull(7, xe, yn, i);
        const f8 = pull(8, xw, yn, i);
        const rho = f0 + f1 + f2 + f3 + f4 + f5 + f6 + f7 + f8;
        const vx = (f1 - f3 + f5 - f6 - f7 + f8) / rho;
        const vy = (f2 - f4 + f5 + f6 - f7 - f8) / rho;
        ux[i] = vx;
        uy[i] = vy;
        const usq = 1.5 * (vx * vx + vy * vy);
        const r0 = W0 * rho, r1 = W1 * rho, r2 = W2 * rho;
        const a = vx + vy, b = vy - vx;
        g[i] = f0 + om * (r0 * (1 - usq) - f0);
        g[N + i] = f1 + om * (r1 * (1 + 3 * vx + 4.5 * vx * vx - usq) - f1);
        g[2 * N + i] = f2 + om * (r1 * (1 + 3 * vy + 4.5 * vy * vy - usq) - f2);
        g[3 * N + i] = f3 + om * (r1 * (1 - 3 * vx + 4.5 * vx * vx - usq) - f3);
        g[4 * N + i] = f4 + om * (r1 * (1 - 3 * vy + 4.5 * vy * vy - usq) - f4);
        g[5 * N + i] = f5 + om * (r2 * (1 + 3 * a + 4.5 * a * a - usq) - f5);
        g[6 * N + i] = f6 + om * (r2 * (1 + 3 * b + 4.5 * b * b - usq) - f6);
        g[7 * N + i] = f7 + om * (r2 * (1 - 3 * a + 4.5 * a * a - usq) - f7);
        g[8 * N + i] = f8 + om * (r2 * (1 - 3 * b + 4.5 * b * b - usq) - f8);
      }
    }
    [f, g] = [g, f];
  };

  // --- Tracers: massless particles advected through the lattice velocity.
  const px = new Float32Array(TRACERS), py = new Float32Array(TRACERS);
  const spawn = (k: number, anywhere: boolean) => {
    px[k] = anywhere ? Math.random() * (NX - 2) : Math.random() * 3;
    py[k] = Math.random() * (NY - 1);
  };
  for (let k = 0; k < TRACERS; k++) spawn(k, true);

  const velocity = (x: number, y: number): [number, number] => {
    const x0 = Math.floor(x), y0 = Math.floor(y);
    const tx = x - x0, ty = y - y0;
    const i00 = y0 * NX + x0, i10 = i00 + 1;
    const i01 = ((y0 + 1) % NY) * NX + x0, i11 = i01 + 1;
    const lerp = (A: Float32Array) =>
      (A[i00] * (1 - tx) + A[i10] * tx) * (1 - ty) + (A[i01] * (1 - tx) + A[i11] * tx) * ty;
    return [lerp(ux), lerp(uy)];
  };

  const advect = (n: number) => {
    for (let k = 0; k < TRACERS; k++) {
      const [vx, vy] = velocity(px[k], py[k]);
      px[k] += vx * n;
      py[k] += vy * n;
      if (py[k] < 0) py[k] += NY - 1; else if (py[k] >= NY - 1) py[k] -= NY - 1;
      if (px[k] >= NX - 2 || px[k] < 0 || solid[Math.floor(py[k]) * NX + Math.floor(px[k])]
          || Math.random() < 0.002) {
        spawn(k, false);
      }
    }
  };

  const off = document.createElement("canvas");
  off.width = NX;
  off.height = NY;
  const octx = off.getContext("2d")!;
  const img = octx.createImageData(NX, NY);

  return {
    step() {
      const n = steps < WARMUP ? WARMUP_PER_FRAME : STEPS_PER_FRAME;
      for (let k = 0; k < n; k++) step();
      steps += n;
      if (steps > WARMUP) advect(n);
    },
    ready() {
      return steps >= WARMUP;
    },
    set(name, v) {
      if (name === "tau") tau = v;
      if (name === "tracers") showTracers = v === 1;
    },
    readout() {
      const nu = (tau - 0.5) / 3;
      return `Re ≈ ${Math.round((U0 * 2 * R) / nu)} on this grid`;
    },
    pointer(p) {
      const gx = p.x * NX, gy = (1 - p.y) * NY;
      if (p.type === "down") {
        dragging = Math.hypot(gx - cx, gy - cy) < R * 1.8;
        return dragging;
      }
      if (p.type === "move" && dragging) moveTo(gx, gy);
      if (p.type === "up") dragging = false;
      return dragging;
    },
    cursor(x, y) {
      return Math.hypot(x * NX - cx, (1 - y) * NY - cy) < R * 1.8 ? "grab" : "default";
    },
    draw(ctx, p: Palette, w, h) {
      const d = img.data;
      for (let y = 0; y < NY; y++) {
        const yu = (y + 1) % NY, yd = (y - 1 + NY) % NY;
        for (let x = 0; x < NX; x++) {
          const i = y * NX + x;
          // Canvas rows run top-down; lattice y runs bottom-up.
          const o = ((NY - 1 - y) * NX + x) * 4;
          if (solid[i] || x === 0 || x === NX - 1) {
            d[o + 3] = 0;
            continue;
          }
          const curl = (uy[i + 1] - uy[i - 1]) - (ux[yu * NX + x] - ux[yd * NX + x]);
          const v = Math.max(-1, Math.min(1, curl * 28));
          const c = v > 0 ? p.accent : p.pencil;
          d[o] = c[0];
          d[o + 1] = c[1];
          d[o + 2] = c[2];
          d[o + 3] = Math.pow(Math.abs(v), 0.75) * 215;
        }
      }
      octx.putImageData(img, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(off, 0, 0, w, h);

      if (showTracers) {
        // Each tracer is a short streak along its velocity.
        const sx = w / NX, sy = h / NY;
        ctx.strokeStyle = rgba(p.ink, 0.5);
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let k = 0; k < TRACERS; k++) {
          const [vx, vy] = velocity(px[k], py[k]);
          const X = px[k] * sx, Y = h - py[k] * sy;
          ctx.moveTo(X, Y);
          ctx.lineTo(X - vx * 40 * sx, Y + vy * 40 * sy);
        }
        ctx.stroke();
      }

      ctx.fillStyle = rgba(p.ink);
      ctx.beginPath();
      ctx.arc((cx / NX) * w, (1 - cy / NY) * h, (R / NX) * w, 0, 2 * Math.PI);
      ctx.fill();
      if (dragging) {
        ctx.strokeStyle = rgba(p.pencil);
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    },
  };
};
