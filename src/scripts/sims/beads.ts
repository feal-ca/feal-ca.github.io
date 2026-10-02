// Beads under a plane wave travelling down the field of view.
//
// The background is the single-scattering intensity: the incident wave plus
// one 2D cylindrical wave from each bead, |E|^2, at low resolution. On top,
// beads within a few wavelengths of each other are joined, edge weight
// falling off as 1/sqrt(k d): the kind of graph a GNN for multiple scattering
// works on. Messages pulse along the edges. Beads can be dragged.

import { clamp, rgba, type Create, type Palette } from "./types";

const WORLD_W = 16, WORLD_H = 7;        // 16:7, world units
const GX = 192, GY = 84;                // intensity grid
const BEADS = 13;
const RADIUS = 0.28;                    // world units
const SCATTER = 0.55;                   // scattering amplitude

export const create: Create = (params) => {
  let lambda = params.lambda ?? 1;
  const bx: number[] = [], by: number[] = [];
  // A loose packing, kept clear of the edges.
  let guard = 0;
  while (bx.length < BEADS && guard++ < 5000) {
    const x = 1.2 + Math.random() * (WORLD_W - 2.4);
    const y = 1 + Math.random() * (WORLD_H - 2);
    if (bx.every((_, i) => Math.hypot(bx[i] - x, by[i] - y) > 1.5)) { bx.push(x); by.push(y); }
  }
  let dirty = true;
  let held = -1;
  let time = 0;

  const off = document.createElement("canvas");
  off.width = GX;
  off.height = GY;
  const octx = off.getContext("2d")!;
  const img = octx.createImageData(GX, GY);
  const intensity = new Float32Array(GX * GY);

  const field = () => {
    const k = (2 * Math.PI) / lambda;
    for (let j = 0; j < GY; j++) {
      // Grid rows top-down; world y is up, and the wave travels downward.
      const y = WORLD_H * (1 - (j + 0.5) / GY);
      for (let i = 0; i < GX; i++) {
        const x = WORLD_W * ((i + 0.5) / GX);
        let re = Math.cos(-k * y), im = Math.sin(-k * y);
        for (let b = 0; b < bx.length; b++) {
          const r = Math.hypot(x - bx[b], y - by[b]);
          if (r < RADIUS) continue;
          // Incident phase at the bead, then an outgoing cylindrical wave.
          const ph = -k * by[b] + k * r;
          const amp = SCATTER / Math.sqrt(k * r + 1);
          re += amp * Math.cos(ph);
          im += amp * Math.sin(ph);
        }
        intensity[j * GX + i] = re * re + im * im;
      }
    }
    dirty = false;
  };

  const edges = () => {
    const out: [number, number, number][] = [];
    const k = (2 * Math.PI) / lambda;
    const range = 3.2 * lambda;
    for (let a = 0; a < bx.length; a++) {
      for (let b = a + 1; b < bx.length; b++) {
        const d = Math.hypot(bx[a] - bx[b], by[a] - by[b]);
        if (d < range) out.push([a, b, 1 / Math.sqrt(k * d)]);
      }
    }
    return out;
  };

  const hit = (x: number, y: number) => {
    const wx = x * WORLD_W, wy = (1 - y) * WORLD_H;
    let best = -1, bd = RADIUS * 2.2;
    for (let b = 0; b < bx.length; b++) {
      const d = Math.hypot(bx[b] - wx, by[b] - wy);
      if (d < bd) { bd = d; best = b; }
    }
    return best;
  };

  return {
    step() {
      time += 1;
    },
    set(name, v) {
      if (name === "lambda") { lambda = v; dirty = true; }
    },
    readout() {
      return `${bx.length} beads, ${edges().length} couplings within range`;
    },
    pointer(p) {
      if (p.type === "down") {
        held = hit(p.x, p.y);
        return held >= 0;
      }
      if (p.type === "move" && held >= 0) {
        bx[held] = clamp(p.x * WORLD_W, RADIUS, WORLD_W - RADIUS);
        by[held] = clamp((1 - p.y) * WORLD_H, RADIUS, WORLD_H - RADIUS);
        dirty = true;
        return true;
      }
      if (p.type === "up") held = -1;
      return false;
    },
    cursor(x, y) {
      return hit(x, y) >= 0 ? "grab" : "default";
    },
    draw(ctx, p: Palette, w, h) {
      if (dirty) field();
      const d = img.data;
      for (let c = 0; c < GX * GY; c++) {
        const bright = intensity[c] - 1;
        const o = c * 4;
        d[o] = p.accent[0]; d[o + 1] = p.accent[1]; d[o + 2] = p.accent[2];
        d[o + 3] = bright > 0 ? Math.min(1, bright * 0.9) ** 0.8 * 105 : 0;
      }
      octx.putImageData(img, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(off, 0, 0, w, h);

      const X = (x: number) => (x / WORLD_W) * w;
      const Y = (y: number) => (1 - y / WORLD_H) * h;
      const es = edges();
      const strongest = Math.max(...es.map((e) => e[2]), 1e-9);

      // Edges, then a message pulse travelling along each one.
      for (const [a, b, wgt] of es) {
        const s = wgt / strongest;
        ctx.strokeStyle = rgba(p.pencil, 0.25 + 0.6 * s);
        ctx.lineWidth = 0.6 + 2.2 * s;
        ctx.beginPath();
        ctx.moveTo(X(bx[a]), Y(by[a]));
        ctx.lineTo(X(bx[b]), Y(by[b]));
        ctx.stroke();
        const t = ((time / 90 + (a * 7 + b * 3) / 23) % 1);
        ctx.fillStyle = rgba(p.pencil, 0.9);
        ctx.beginPath();
        ctx.arc(X(bx[a] + (bx[b] - bx[a]) * t), Y(by[a] + (by[b] - by[a]) * t), 2.2, 0, 2 * Math.PI);
        ctx.fill();
      }

      const r = (RADIUS / WORLD_W) * w;
      for (let b = 0; b < bx.length; b++) {
        ctx.beginPath();
        ctx.arc(X(bx[b]), Y(by[b]), r, 0, 2 * Math.PI);
        ctx.fillStyle = rgba(p.plate);
        ctx.fill();
        ctx.strokeStyle = rgba(b === held ? p.pencil : p.ink);
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(X(bx[b]), Y(by[b]), r * 0.3, 0, 2 * Math.PI);
        ctx.fillStyle = rgba(p.ink);
        ctx.fill();
      }
    },
  };
};
