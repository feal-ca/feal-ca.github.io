// Tracer particles in the homepage hero.
//
// They ride the same analytic Kármán field that scripts/make_figures.py
// (vortex_field) uses to draw the hero's streamlines, so they follow the
// drawn lines. The pointer is a second, small cylinder: a potential-flow
// doublet, so the stream parts around it. Off under reduced motion, paused
// off screen and in background tabs.

// The hero SVG's data window (karman("hero-flow", ...) in make_figures.py).
const X0 = -0.55, X1 = 5.1, Y0 = -1.05, Y1 = 1.05;
const COUNT = 420;
const DT = 0.011;
const POINTER_R = 0.16;

const VORTICES: { x: number; y: number; g: number }[] = [];
for (let k = 0; k < 4; k++) {
  for (const [sign, y0] of [[1, 0.26], [-1, -0.26]] as const) {
    const x0 = 0.85 + k * 1.05 + (sign < 0 ? 0.52 : 0);
    VORTICES.push({ x: x0, y: y0, g: sign * 0.42 * Math.exp(-0.28 * Math.max(x0 - 0.85, 0)) });
  }
}

export function hero(stage: HTMLElement) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const canvas = document.createElement("canvas");
  canvas.className = "hero__tracers";
  canvas.setAttribute("aria-hidden", "true");
  stage.append(canvas);
  const ctx = canvas.getContext("2d")!;

  let w = 0, h = 0;
  let pointer: { x: number; y: number } | null = null;
  let visible = false;
  let raf = 0;
  let color = "";

  const px = new Float32Array(COUNT), py = new Float32Array(COUNT), age = new Float32Array(COUNT);
  const spawn = (k: number, anywhere: boolean) => {
    px[k] = anywhere ? X0 + Math.random() * (X1 - X0) : X0 + Math.random() * 0.1;
    py[k] = Y0 + Math.random() * (Y1 - Y0);
    age[k] = 0;
  };
  for (let k = 0; k < COUNT; k++) spawn(k, true);

  const velocity = (x: number, y: number): [number, number] => {
    let u = 1, v = 0;
    for (const { x: vx, y: vy, g } of VORTICES) {
      const dx = x - vx, dy = y - vy, r2 = dx * dx + dy * dy + 0.035;
      u += (-g * dy) / r2;
      v += (g * dx) / r2;
    }
    if (pointer) {
      // Uniform flow past a cylinder: subtract the doublet's velocity.
      const dx = x - pointer.x, dy = y - pointer.y;
      const r2 = dx * dx + dy * dy, a2 = POINTER_R * POINTER_R;
      if (r2 > a2 * 0.5) {
        u -= (a2 * (dx * dx - dy * dy)) / (r2 * r2);
        v -= (a2 * 2 * dx * dy) / (r2 * r2);
      }
    }
    return [u, v];
  };

  const toPx = (x: number, y: number): [number, number] => [
    ((x - X0) / (X1 - X0)) * w,
    ((Y1 - y) / (Y1 - Y0)) * h,
  ];

  const size = () => {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = r.width; h = r.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    color = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
  };

  const frame = () => {
    raf = 0;
    if (!visible || document.hidden) return;
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = 1.3;
    ctx.lineCap = "round";
    ctx.beginPath();
    for (let k = 0; k < COUNT; k++) {
      const [u, v] = velocity(px[k], py[k]);
      const [ax, ay] = toPx(px[k], py[k]);
      px[k] += u * DT;
      py[k] += v * DT;
      age[k]++;
      const [bx, by] = toPx(px[k] + u * DT * 3, py[k] + v * DT * 3);
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      const inCylinder = px[k] * px[k] + py[k] * py[k] < 0.04;
      if (px[k] > X1 || py[k] < Y0 || py[k] > Y1 || inCylinder || age[k] > 900) spawn(k, false);
    }
    ctx.stroke();
    raf = requestAnimationFrame(frame);
  };

  const start = () => {
    if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame);
  };

  stage.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    pointer = {
      x: X0 + ((e.clientX - r.left) / r.width) * (X1 - X0),
      y: Y1 - ((e.clientY - r.top) / r.height) * (Y1 - Y0),
    };
  });
  stage.addEventListener("pointerleave", () => (pointer = null));
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    start();
  }).observe(canvas);
  document.addEventListener("visibilitychange", start);
  new ResizeObserver(size).observe(canvas);
  new MutationObserver(size).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  size();
}
