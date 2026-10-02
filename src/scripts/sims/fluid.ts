// A 2D incompressible Navier-Stokes solver after Stam's "Stable Fluids":
// semi-Lagrangian advection, then a pressure projection (Jacobi) that makes
// the velocity divergence-free. A wing section sits in a uniform stream at
// an adjustable angle of attack. Smoke enters in lines at the inlet;
// dragging the pointer paints a second dye and pushes the flow.

import { clamp, rgba, type Create, type Palette } from "./types";

const NX = 176;
const NY = 77;                  // 16:7
const N = NX * NY;
const U = 0.9;                  // free stream, cells per step
const JACOBI = 30;
const CHORD = 52;               // cells
const LE_X = 46, LE_Y = 40;     // leading edge
const SMOKE_EVERY = 7;          // rows between smoke lines

export const create: Create = (params) => {
  let aoa = params.aoa ?? 8;
  let u = new Float32Array(N), v = new Float32Array(N);
  let u2 = new Float32Array(N), v2 = new Float32Array(N);
  let smoke = new Float32Array(N), paint = new Float32Array(N);
  let tmp = new Float32Array(N);
  const p = new Float32Array(N), pn = new Float32Array(N), div = new Float32Array(N);
  const solid = new Uint8Array(N);
  let outline: [number, number][] = [];
  let pointer: { x: number; y: number } | null = null;

  // NACA 2412-like section, nose up by the angle of attack, rasterized.
  const shape = () => {
    const pts: [number, number][] = [];
    const t = 0.12, m = 0.03, pp = 0.4;
    const surf = (s: number, sign: number) => {
      const xc = (1 - Math.cos(s * Math.PI)) / 2;
      const yt = 5 * t * (0.2969 * Math.sqrt(xc) - 0.126 * xc - 0.3516 * xc ** 2 + 0.2843 * xc ** 3 - 0.1015 * xc ** 4);
      const yc = xc < pp ? (m / pp ** 2) * (2 * pp * xc - xc ** 2) : (m / (1 - pp) ** 2) * (1 - 2 * pp + 2 * pp * xc - xc ** 2);
      return [xc, yc + sign * yt];
    };
    for (let k = 0; k <= 40; k++) pts.push(surf(k / 40, 1) as [number, number]);
    for (let k = 40; k >= 0; k--) pts.push(surf(k / 40, -1) as [number, number]);
    const a = (-aoa * Math.PI) / 180;
    outline = pts.map(([x, y]) => [
      LE_X + CHORD * (x * Math.cos(a) - y * Math.sin(a)),
      LE_Y + CHORD * (x * Math.sin(a) + y * Math.cos(a)),
    ]);
    // Even-odd fill test against the outline.
    for (let j = 0; j < NY; j++) {
      for (let i = 0; i < NX; i++) {
        let inside = false;
        for (let k = 0, l = outline.length - 1; k < outline.length; l = k++) {
          const [xk, yk] = outline[k], [xl, yl] = outline[l];
          if ((yk > j + 0.5) !== (yl > j + 0.5)
              && i + 0.5 < ((xl - xk) * (j + 0.5 - yk)) / (yl - yk) + xk) inside = !inside;
        }
        const c = j * NX + i;
        solid[c] = inside ? 1 : 0;
        if (inside) { u[c] = 0; v[c] = 0; smoke[c] = 0; paint[c] = 0; }
      }
    }
  };

  for (let c = 0; c < N; c++) u[c] = U;
  shape();

  const sample = (F: Float32Array, x: number, y: number) => {
    x = clamp(x, 0, NX - 1.001);
    y = clamp(y, 0, NY - 1.001);
    const i = x | 0, j = y | 0, tx = x - i, ty = y - j, c = j * NX + i;
    return (F[c] * (1 - tx) + F[c + 1] * tx) * (1 - ty) + (F[c + NX] * (1 - tx) + F[c + NX + 1] * tx) * ty;
  };

  // Semi-Lagrangian: trace each cell back along the velocity and sample.
  const advect = (out: Float32Array, F: Float32Array) => {
    for (let j = 0; j < NY; j++) {
      for (let i = 0; i < NX; i++) {
        const c = j * NX + i;
        out[c] = solid[c] ? 0 : sample(F, i - u[c], j - v[c]);
      }
    }
  };

  const boundaries = () => {
    for (let j = 0; j < NY; j++) {
      const l = j * NX, r = l + NX - 1;
      u[l] = U; v[l] = 0;                     // inlet
      u[r] = u[r - 1]; v[r] = v[r - 1];       // outlet
    }
    for (let i = 0; i < NX; i++) {            // free-slip top and bottom
      v[i] = 0; v[(NY - 1) * NX + i] = 0;
      u[i] = u[NX + i]; u[(NY - 1) * NX + i] = u[(NY - 2) * NX + i];
    }
    for (let c = 0; c < N; c++) if (solid[c]) { u[c] = 0; v[c] = 0; }
  };

  // Projection: solve for pressure, subtract its gradient. Solid and wall
  // neighbors mirror the center value (zero normal gradient).
  const project = () => {
    for (let j = 1; j < NY - 1; j++) {
      for (let i = 1; i < NX - 1; i++) {
        const c = j * NX + i;
        div[c] = solid[c] ? 0 : -0.5 * (u[c + 1] - u[c - 1] + v[c + NX] - v[c - NX]);
      }
    }
    p.fill(0);
    for (let it = 0; it < JACOBI; it++) {
      for (let j = 1; j < NY - 1; j++) {
        for (let i = 1; i < NX - 1; i++) {
          const c = j * NX + i;
          if (solid[c]) { pn[c] = 0; continue; }
          const pc = p[c];
          const e = solid[c + 1] ? pc : p[c + 1];
          const w = solid[c - 1] ? pc : p[c - 1];
          const n = solid[c + NX] ? pc : p[c + NX];
          const s = solid[c - NX] ? pc : p[c - NX];
          pn[c] = (div[c] + e + w + n + s) / 4;
        }
      }
      for (let j = 0; j < NY; j++) { pn[j * NX + NX - 1] = 0; }   // outlet: p = 0
      p.set(pn);
    }
    for (let j = 1; j < NY - 1; j++) {
      for (let i = 1; i < NX - 1; i++) {
        const c = j * NX + i;
        if (solid[c]) continue;
        u[c] -= 0.5 * (p[c + 1] - p[c - 1]);
        v[c] -= 0.5 * (p[c + NX] - p[c - NX]);
      }
    }
  };

  const step = () => {
    // Smoke enters as thin lines at the inlet.
    for (let j = 3; j < NY - 3; j += SMOKE_EVERY) {
      smoke[j * NX] = 1; smoke[j * NX + 1] = 1;
    }
    if (pointer) {
      const { x, y } = pointer;
      for (let j = Math.max(1, (y - 4) | 0); j < Math.min(NY - 1, y + 4); j++) {
        for (let i = Math.max(1, (x - 4) | 0); i < Math.min(NX - 1, x + 4); i++) {
          const c = j * NX + i;
          const fall = Math.exp(-((i - x) ** 2 + (j - y) ** 2) / 6);
          paint[c] = Math.min(1, paint[c] + 0.6 * fall);
        }
      }
    }
    advect(u2, u); advect(v2, v);
    [u, u2] = [u2, u]; [v, v2] = [v2, v];
    boundaries();
    project();
    boundaries();
    advect(tmp, smoke); [smoke, tmp] = [tmp, smoke];
    advect(tmp, paint); [paint, tmp] = [tmp, paint];
    for (let c = 0; c < N; c++) { smoke[c] *= 0.9995; paint[c] *= 0.996; }
  };

  // Settle the flow around the wing before the first frame.
  for (let k = 0; k < 120; k++) step();

  const off = document.createElement("canvas");
  off.width = NX;
  off.height = NY;
  const octx = off.getContext("2d")!;
  const img = octx.createImageData(NX, NY);
  let last: { x: number; y: number } | null = null;

  return {
    step() {
      step();
      step();
    },
    set(name, val) {
      if (name === "aoa") { aoa = val; shape(); }
    },
    readout() {
      return `Angle of attack ${aoa}°`;
    },
    pointer(ev) {
      const x = ev.x * NX, y = (1 - ev.y) * NY;
      if (ev.type === "down") { pointer = { x, y }; last = { x, y }; return true; }
      if (ev.type === "move" && pointer) {
        // Push the flow along the drag.
        const dx = x - (last?.x ?? x), dy = y - (last?.y ?? y);
        for (let j = Math.max(1, (y - 5) | 0); j < Math.min(NY - 1, y + 5); j++) {
          for (let i = Math.max(1, (x - 5) | 0); i < Math.min(NX - 1, x + 5); i++) {
            const c = j * NX + i;
            if (solid[c]) continue;
            const fall = Math.exp(-((i - x) ** 2 + (j - y) ** 2) / 10);
            u[c] += clamp(dx, -3, 3) * 0.4 * fall;
            v[c] += clamp(dy, -3, 3) * 0.4 * fall;
          }
        }
        pointer = { x, y };
        last = { x, y };
        return true;
      }
      if (ev.type === "up") { pointer = null; last = null; }
      return false;
    },
    cursor() {
      return "crosshair";
    },
    draw(ctx, pal: Palette, w, h) {
      const d = img.data;
      for (let j = 0; j < NY; j++) {
        for (let i = 0; i < NX; i++) {
          const c = j * NX + i;
          const o = ((NY - 1 - j) * NX + i) * 4;
          const s = Math.min(1, smoke[c]), q = Math.min(1, paint[c]);
          const a = Math.max(s, q);
          const col = q > s ? pal.pencil : pal.accent;
          d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2];
          d[o + 3] = Math.pow(a, 0.7) * 230;
        }
      }
      octx.putImageData(img, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(off, 0, 0, w, h);

      ctx.fillStyle = rgba(pal.ink);
      ctx.beginPath();
      outline.forEach(([x, y], k) => {
        const X = (x / NX) * w, Y = (1 - y / NY) * h;
        if (k) ctx.lineTo(X, Y); else ctx.moveTo(X, Y);
      });
      ctx.closePath();
      ctx.fill();
    },
  };
};
