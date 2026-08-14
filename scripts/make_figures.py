#!/usr/bin/env python3
"""Generate the schematic project figures in src/assets/figures/.

These are ILLUSTRATIONS, not results. They exist so every project card has a
piece of real information-carrying artwork instead of an empty grey box. When
a genuine figure exists for a project, replace the SVG and delete the entry
here.

Colours are emitted as sentinel hex values and rewritten to CSS custom
properties on the way out, so the SVGs can be inlined in Astro and inherit the
light/dark theme. See `src/components/Figure.astro`.

    python3 scripts/make_figures.py
"""

from pathlib import Path
import re

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "assets" / "figures"
OUT.mkdir(parents=True, exist_ok=True)

# The CV cannot use CSS variables, so it gets a second pass of the same
# drawings with the light-theme values baked in. See cv/cvstyle.sty.
CV_OUT = ROOT / "cv" / "figures"
CV_OUT.mkdir(parents=True, exist_ok=True)

# Sentinels -> CSS variables. Any colour used below must come from this map.
ACCENT = "#ff0001"
INK = "#ff0002"
MUTED = "#ff0003"
FAINT = "#ff0004"

SENTINELS = {
    "#ff0001": "var(--fig-accent)",
    "#ff0002": "var(--fig-ink)",
    "#ff0003": "var(--fig-muted)",
    "#ff0004": "var(--fig-faint)",
}

# The same four roles, resolved against each theme in global.css. The CV
# ships in both, so the drawings do too.
#           (--fig-accent, --fig-ink, --fig-muted, --fig-faint, --bg, --bg-sunk)
THEMES = {
    "light": ("#97213c", "#17171b", "#a9a294", "#e9e3d8", "#fbfaf7", "#f2efe8"),
    "dark":  ("#f08ba1", "#eeece7", "#6b675e", "#26262e", "#131317", "#1a1a20"),
}

PAPER = "#fbfaf7"      # --bg,      rebound per theme
SUNK = "#f2efe8"       # --bg-sunk, rebound per theme

MODE = "svg"           # flipped to "pdf" for the CV passes
CV_DEST = None         # set per theme
SEED = 20260805

rng = np.random.default_rng(SEED)


def canvas(w=8.0, h=5.0):
    fig, ax = plt.subplots(figsize=(w, h))
    ax.set_axis_off()
    ax.set_position([0, 0, 1, 1])
    fig.patch.set_alpha(0)
    ax.patch.set_alpha(0)
    return fig, ax


def _round_numbers(svg, places=1):
    """Trim coordinate precision. matplotlib emits ~6 decimals everywhere,
    which roughly doubles the file size for no visible benefit.

    The XML prolog and DOCTYPE are left alone — rounding there rewrites
    `version="1.0"` to `version="1"` and the document stops parsing.
    """
    def repl(m):
        return f"{round(float(m.group(0)), places):g}"

    split = svg.index("<svg ")
    prolog, body = svg[:split], svg[split:]
    return prolog + re.sub(r"-?\d+\.\d+", repl, body)


def save(fig, name):
    if MODE == "pdf":
        # Vector, colours already literal, so nothing to rewrite afterwards.
        path = CV_DEST / f"{name}.pdf"
        fig.savefig(path, format="pdf", transparent=True,
                    bbox_inches="tight", pad_inches=0)
        plt.close(fig)
        print(f"  {name}.pdf  ({path.stat().st_size // 1024} kB)")
        return

    path = OUT / f"{name}.svg"
    fig.savefig(path, format="svg", transparent=True, bbox_inches="tight", pad_inches=0)
    plt.close(fig)

    svg = path.read_text()
    # matplotlib emits colours lowercase in style attrs; normalise then map.
    for sentinel, var in SENTINELS.items():
        svg = re.sub(sentinel, var, svg, flags=re.IGNORECASE)
    svg = _round_numbers(svg)
    # Metadata block is a third of the file and serves nothing here.
    svg = re.sub(r"<metadata>.*?</metadata>", "", svg, flags=re.DOTALL)
    # Strip the fixed pixel size so CSS can scale it; keep the viewBox.
    svg = re.sub(r'(<svg[^>]*?)\swidth="[^"]*"', r"\1", svg, count=1)
    svg = re.sub(r'(<svg[^>]*?)\sheight="[^"]*"', r"\1", svg, count=1)
    svg = svg.replace("<svg ", '<svg preserveAspectRatio="xMidYMid slice" ', 1)
    path.write_text(svg)
    print(f"  {name}.svg  ({len(svg) // 1024} kB)")


# --------------------------------------------------------------------------
# 1. Kármán vortex street — PINN for fluid modeling, and the site hero
# --------------------------------------------------------------------------
def vortex_field(w, h, nx, ny, n_pairs=4):
    x = np.linspace(-0.6, 5.2, nx)
    y = np.linspace(-1.1, 1.1, ny)
    X, Y = np.meshgrid(x, y)
    U = np.ones_like(X)
    V = np.zeros_like(X)
    for k in range(n_pairs):
        for sign, y0 in ((1, 0.26), (-1, -0.26)):
            x0 = 0.85 + k * 1.05 + (0.52 if sign < 0 else 0.0)
            dx, dy = X - x0, Y - y0
            r2 = dx**2 + dy**2 + 0.035
            decay = np.exp(-0.28 * max(x0 - 0.85, 0))
            g = sign * 0.42 * decay
            U += -g * dy / r2
            V += g * dx / r2
    return X, Y, U, V


def trace(X, Y, U, V, x0, y0, steps=900, dt=0.006):
    """Integrate one streamline with RK4.

    matplotlib's streamplot splits every line into one <path> per segment when
    it is colour-mapped, which produced a 1.6 MB hero image. Tracing them here
    means one path per streamline and a file two orders of magnitude smaller.
    """
    xs, ys = X[0], Y[:, 0]

    def sample(x, y):
        if not (xs[0] <= x <= xs[-1] and ys[0] <= y <= ys[-1]):
            return None
        i = np.clip(np.searchsorted(xs, x) - 1, 0, len(xs) - 2)
        j = np.clip(np.searchsorted(ys, y) - 1, 0, len(ys) - 2)
        tx = (x - xs[i]) / (xs[i + 1] - xs[i])
        ty = (y - ys[j]) / (ys[j + 1] - ys[j])
        def bilerp(F):
            return ((1 - tx) * (1 - ty) * F[j, i] + tx * (1 - ty) * F[j, i + 1]
                    + (1 - tx) * ty * F[j + 1, i] + tx * ty * F[j + 1, i + 1])
        return bilerp(U), bilerp(V)

    px, py = [x0], [y0]
    x, y = x0, y0
    for _ in range(steps):
        k1 = sample(x, y)
        if k1 is None:
            break
        k2 = sample(x + 0.5 * dt * k1[0], y + 0.5 * dt * k1[1])
        k3 = sample(x + 0.5 * dt * k2[0], y + 0.5 * dt * k2[1]) if k2 else None
        k4 = sample(x + dt * k3[0], y + dt * k3[1]) if k3 else None
        if k4 is None:
            break
        x += dt / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0])
        y += dt / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])
        px.append(x)
        py.append(y)
    return np.array(px), np.array(py)


def karman(name, w, h, n_lines, lw):
    fig, ax = canvas(w, h)
    X, Y, U, V = vortex_field(w, h, 260, 130)

    # Seed upstream of the cylinder and let the wake do the work. Colour is
    # picked per line from how far off the centreline it sits, so the wake
    # reads accent-warm and the free stream stays quiet.
    for y0 in np.linspace(-1.0, 1.0, n_lines):
        if abs(y0) < 0.055:
            continue
        px, py = trace(X, Y, U, V, -0.58, y0)
        if len(px) < 20:
            continue
        # The integrator produces far more vertices than the display needs.
        # Keeping every 4th (plus the endpoint) is visually identical and
        # cuts the inlined SVG by roughly three quarters.
        px = np.append(px[::4], px[-1])
        py = np.append(py[::4], py[-1])
        near = abs(y0) < 0.55
        ax.plot(px, py,
                color=ACCENT if near else MUTED,
                lw=lw * (1.0 if near else 0.75),
                alpha=0.92 if near else 0.6,
                solid_capstyle="round")

    ax.add_patch(plt.Circle((0.0, 0.0), 0.2, facecolor=INK, edgecolor="none", zorder=5))
    ax.set_xlim(-0.55, 5.1)
    ax.set_ylim(-1.05, 1.05)
    save(fig, name)


# --------------------------------------------------------------------------
# 2. Surrogate optimisation response surface — F1 frontwing
# --------------------------------------------------------------------------
def surrogate():
    fig, ax = canvas()
    # Coarse grid on purpose: contourf polygon detail dominates the file size.
    x = np.linspace(0, 1, 80)
    y = np.linspace(0, 1, 65)
    X, Y = np.meshgrid(x, y)
    Z = (
        np.exp(-((X - 0.68) ** 2 + (Y - 0.58) ** 2) / 0.055) * 1.0
        + np.exp(-((X - 0.26) ** 2 + (Y - 0.30) ** 2) / 0.10) * 0.62
        + np.exp(-((X - 0.80) ** 2 + (Y - 0.18) ** 2) / 0.07) * 0.45
    )
    # Fill one band at a time with a rising alpha. Interpolating a colormap
    # between the faint and accent sentinels runs through muddy mid-tones and
    # the surface reads as an ink blot; stacked translucent bands of the one
    # accent colour stay clean and still show the gradient.
    levels = np.linspace(0.04, Z.max(), 9)
    for i in range(len(levels) - 1):
        ax.contourf(X, Y, Z, levels=[levels[i], levels[i + 1]],
                    colors=[ACCENT], alpha=0.06 + 0.035 * i)
    ax.contour(X, Y, Z, levels=levels, colors=[ACCENT], linewidths=0.55, alpha=0.5)

    # Sampled design points, densifying near the optimum.
    pts = np.vstack([
        rng.uniform(0.05, 0.95, (26, 2)),
        rng.normal([0.68, 0.58], 0.09, (16, 2)),
    ])
    pts = np.clip(pts, 0.03, 0.97)
    ax.scatter(pts[:, 0], pts[:, 1], s=13, facecolor="none", edgecolor=INK, linewidths=0.85)
    ax.scatter([0.68], [0.58], s=95, marker="+", color=INK, linewidths=1.7, zorder=6)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    save(fig, "f1-frontwing")


# --------------------------------------------------------------------------
# 3. Barnes-Hut quadtree over a particle cloud — parallel N-body
# --------------------------------------------------------------------------
def nbody():
    fig, ax = canvas()
    n = 500
    # Tight clusters against a sparse halo, so the tree subdivides visibly
    # unevenly — an even spread just yields a uniform grid, which reads as
    # graph paper rather than as an adaptive decomposition.
    p = np.vstack([
        rng.normal([0.32, 0.60], [0.055, 0.055], (170, 2)),
        rng.normal([0.68, 0.34], [0.040, 0.040], (150, 2)),
        rng.normal([0.78, 0.74], [0.025, 0.025], (60, 2)),
        rng.uniform(0.02, 0.98, (n - 380, 2)),
    ])
    p = p[(p[:, 0] > 0.01) & (p[:, 0] < 0.99) & (p[:, 1] > 0.01) & (p[:, 1] < 0.99)]

    def subdivide(x0, y0, s, depth):
        inside = p[(p[:, 0] >= x0) & (p[:, 0] < x0 + s) & (p[:, 1] >= y0) & (p[:, 1] < y0 + s)]
        if len(inside) > 5 and depth < 6:
            h = s / 2
            # Deeper cells draw lighter, so the nesting is legible at a glance.
            lw = max(0.85 - depth * 0.12, 0.28)
            alpha = max(0.85 - depth * 0.09, 0.35)
            ax.plot([x0, x0 + s], [y0 + h, y0 + h], color=MUTED, lw=lw, alpha=alpha)
            ax.plot([x0 + h, x0 + h], [y0, y0 + s], color=MUTED, lw=lw, alpha=alpha)
            for ox, oy in ((0, 0), (h, 0), (0, h), (h, h)):
                subdivide(x0 + ox, y0 + oy, h, depth + 1)

    ax.add_patch(plt.Rectangle((0, 0), 1, 1, fill=False, edgecolor=INK, lw=0.9))
    subdivide(0, 0, 1, 0)
    # Quantise the marker sizes into a few buckets: a continuous size array
    # makes matplotlib emit a separate <defs> path per point.
    mass = rng.gamma(2.0, 1.0, len(p))
    buckets = np.digitize(mass, [0.8, 1.8, 3.2])
    for b, size in enumerate((2.0, 3.4, 5.2, 8.0)):
        sel = buckets == b
        ax.scatter(p[sel, 0], p[sel, 1], s=size, color=ACCENT, alpha=0.85, linewidths=0)
    ax.set_xlim(-0.01, 1.01)
    ax.set_ylim(-0.01, 1.01)
    save(fig, "n-body")


# --------------------------------------------------------------------------
# 4. D2Q9 lattice stencil — lattice Boltzmann solver
# --------------------------------------------------------------------------
def lattice():
    fig, ax = canvas()
    # Lattice rules first, so the stencil clearly sits on a repeating grid.
    for i in range(9):
        ax.plot([i, i], [0, 5], color=FAINT, lw=0.6, zorder=0)
    for j in range(6):
        ax.plot([0, 8], [j, j], color=FAINT, lw=0.6, zorder=0)
    for i in range(9):
        for j in range(6):
            ax.plot(i, j, marker="o", ms=2.4, color=MUTED, alpha=0.7, zorder=1)
    cx, cy = 4, 3
    dirs = [(1, 0), (0, 1), (-1, 0), (0, -1), (1, 1), (-1, 1), (-1, -1), (1, -1)]
    for k, (dx, dy) in enumerate(dirs):
        w = 1.9 if k < 4 else 1.15
        ax.annotate(
            "", xy=(cx + dx, cy + dy), xytext=(cx, cy),
            arrowprops=dict(arrowstyle="-|>", color=ACCENT, lw=w, shrinkA=5, shrinkB=3,
                            mutation_scale=11),
            zorder=4,
        )
    ax.plot(cx, cy, marker="o", ms=7.5, color=INK, zorder=5)
    # Neighbouring stencil, faint, to show the lattice repeats.
    for gx, gy in ((1, 1), (7, 4)):
        for dx, dy in dirs:
            ax.plot([gx, gx + dx * 0.72], [gy, gy + dy * 0.72], color=MUTED, lw=0.5, alpha=0.6)
        ax.plot(gx, gy, marker="o", ms=3.6, color=MUTED)
    ax.set_xlim(-0.6, 8.6)
    ax.set_ylim(-0.7, 5.7)
    ax.set_aspect("equal")
    save(fig, "lattice-boltzmann")


# --------------------------------------------------------------------------
# 5. Fermi-Dirac occupancy with MCMC scatter
# --------------------------------------------------------------------------
def fermi_dirac():
    fig, ax = canvas()
    e = np.linspace(-3.2, 3.2, 400)
    for i, t in enumerate([0.08, 0.28, 0.62, 1.1]):
        f = 1 / (1 + np.exp(e / t))
        ax.plot(e, f, color=ACCENT, lw=2.4 - i * 0.42, alpha=1.0 - i * 0.17)
    # Monte Carlo samples scattered around the warmest curve.
    es = rng.uniform(-3.1, 3.1, 90)
    fs = 1 / (1 + np.exp(es / 0.62)) + rng.normal(0, 0.035, 90)
    ax.scatter(es, np.clip(fs, -0.02, 1.02), s=9, facecolor="none", edgecolor=INK, linewidths=0.8)
    ax.axhline(0.5, color=MUTED, lw=0.6, ls=(0, (4, 4)))
    ax.axvline(0.0, color=MUTED, lw=0.6, ls=(0, (4, 4)))
    ax.set_xlim(-3.2, 3.2)
    ax.set_ylim(-0.08, 1.08)
    save(fig, "fermi-dirac")


# --------------------------------------------------------------------------
# 6. Aerofoil with pressure-side streamlines — fixed-wing bird flight
# --------------------------------------------------------------------------
def aerofoil():
    fig, ax = canvas()
    # NACA-style camberd section, rotated to a small angle of attack.
    t, m, pp = 0.13, 0.055, 0.42
    xc = np.linspace(0, 1, 220)
    yt = 5 * t * (0.2969 * np.sqrt(xc) - 0.1260 * xc - 0.3516 * xc**2
                  + 0.2843 * xc**3 - 0.1015 * xc**4)
    yc = np.where(xc < pp, m / pp**2 * (2 * pp * xc - xc**2),
                  m / (1 - pp) ** 2 * ((1 - 2 * pp) + 2 * pp * xc - xc**2))
    upper = np.column_stack([xc, yc + yt])
    lower = np.column_stack([xc[::-1], (yc - yt)[::-1]])
    foil = np.vstack([upper, lower])
    a = np.deg2rad(-9)
    R = np.array([[np.cos(a), -np.sin(a)], [np.sin(a), np.cos(a)]])
    foil = (foil - [0.35, 0]) @ R.T

    ax.fill(foil[:, 0], foil[:, 1], facecolor=INK, edgecolor="none", zorder=4)

    # Streamlines deflected around the section, tighter above than below.
    for i, y0 in enumerate(np.linspace(-0.62, 0.62, 17)):
        x = np.linspace(-1.05, 1.35, 300)
        bump = np.exp(-((x - 0.06) ** 2) / 0.22)
        lift = 0.20 * bump * np.exp(-abs(y0) * 2.3) * (1 if y0 >= 0 else -0.55)
        y = y0 + lift + 0.055 * bump * np.sign(y0 or 1)
        ax.plot(x, y, color=ACCENT if abs(y0) < 0.35 else MUTED,
                lw=1.15 if abs(y0) < 0.35 else 0.8, alpha=0.9, zorder=2)
    ax.set_xlim(-1.0, 1.3)
    ax.set_ylim(-0.72, 0.72)
    save(fig, "bird-flight")


# --------------------------------------------------------------------------
# 7. Three adaptation routes converging — LLM persona research
# --------------------------------------------------------------------------
def persona():
    fig, ax = canvas()
    base = (0.08, 0.5)
    # One base model on the left, three adaptation routes fanning out to three
    # adapted models on the right. The route differs in how many update steps
    # it takes: prompting is a couple of hops, RL is many small ones.
    routes = [(0.84, 3), (0.50, 6), (0.16, 11)]

    for lane_y, steps in routes:
        # Ease out of the base node, then run flat along the lane.
        t = np.linspace(0, 1, 200)
        x = base[0] + (0.88 - base[0]) * t
        blend = np.clip(t / 0.32, 0, 1) ** 2 * (3 - 2 * np.clip(t / 0.32, 0, 1))
        y = base[1] + (lane_y - base[1]) * blend
        ax.plot(x, y, color=ACCENT, lw=1.4, alpha=0.85, zorder=2,
                solid_capstyle="round")

        # Step markers spaced along the flat part of the lane.
        sx = np.linspace(0.34, 0.84, steps)
        sy = np.full(steps, lane_y)
        ax.scatter(sx, sy, s=30, facecolor=FAINT, edgecolor=ACCENT,
                   linewidths=1.2, zorder=3)
        ax.scatter([0.92], [lane_y], s=115, color=ACCENT, zorder=4)

    ax.scatter([base[0]], [base[1]], s=260, color=INK, zorder=5)
    ax.set_xlim(0.0, 1.0)
    ax.set_ylim(0.04, 0.96)
    save(fig, "llm-persona")


# --------------------------------------------------------------------------
# 8. Cardiotocography-style traces — AI for assisted birth
# --------------------------------------------------------------------------
def ctg():
    fig, ax = canvas()
    t = np.linspace(0, 12, 1400)

    # Fetal heart rate: baseline + variability + two decelerations.
    fhr = (0.72
           + 0.030 * np.sin(t * 5.5)
           + 0.014 * np.sin(t * 17.0)
           + rng.normal(0, 0.004, t.size))
    for c in (4.4, 8.6):
        fhr -= 0.085 * np.exp(-((t - c) ** 2) / 0.10)
    # Uterine contractions, offset below.
    toco = 0.30 + 0.115 * sum(np.exp(-((t - c) ** 2) / 0.28) for c in (1.4, 4.2, 7.0, 8.4, 11.2))

    ax.plot(t, fhr, color=ACCENT, lw=1.35)
    ax.plot(t, toco, color=MUTED, lw=1.15)
    ax.axhline(0.72, color=MUTED, lw=0.55, ls=(0, (4, 4)), alpha=0.8)

    # Flag the two decelerations as the model would.
    for c in (4.4, 8.6):
        ax.add_patch(plt.Rectangle((c - 0.62, 0.60), 1.24, 0.16, facecolor=INK,
                                   alpha=0.12, edgecolor=INK, linewidth=0.7))
    ax.set_xlim(0, 12)
    ax.set_ylim(0.14, 0.84)
    save(fig, "assisted-birth")


def render_all():
    karman("vortex-pinn", 8.0, 5.0, 46, 1.0)
    karman("hero-flow", 16.0, 4.6, 64, 0.85)
    surrogate()
    nbody()
    lattice()
    fermi_dirac()
    aerofoil()
    persona()
    ctg()


def wake_band(name, w, h, stops, x0=0.62, tint=True):
    """A strip of the site hero for the CV: the same Kármán wake on a
    --bg-sunk band, under a scrim that dissolves it into the paper.

    Baking the scrim in rather than drawing it in LaTeX keeps the .tex free of
    shading code, and it is the one place the two would drift apart.

    `stops` are (position, paper-alpha) pairs from the bottom of the band up,
    so the masthead version fades downward and the foot version upward.
    """
    fig, ax = canvas(w, h)
    if tint:
        ax.add_patch(plt.Rectangle((-1, -2), 10, 6, facecolor=SUNK,
                                   edgecolor="none", zorder=0))

    X, Y, U, V = vortex_field(16.0, 4.6, 260, 130)
    for y0 in np.linspace(-1.0, 1.0, 64):
        if abs(y0) < 0.055:
            continue
        px, py = trace(X, Y, U, V, -0.58, y0)
        if len(px) < 20:
            continue
        px = np.append(px[::4], px[-1])
        py = np.append(py[::4], py[-1])
        near = abs(y0) < 0.55
        ax.plot(px, py,
                color=ACCENT if near else MUTED,
                lw=0.85 * (1.0 if near else 0.75),
                alpha=0.92 if near else 0.6,
                solid_capstyle="round", zorder=2)
    # Mirrors the linear-gradient on .hero__scrim in src/pages/index.astro.
    stops = np.array(stops)
    rows = 256
    t = np.linspace(0, 1, rows)
    alpha = np.interp(t, stops[:, 0], stops[:, 1])[::-1]
    r, g, b = (int(PAPER[i:i + 2], 16) / 255 for i in (1, 3, 5))
    scrim = np.zeros((rows, 1, 4))
    scrim[..., 0], scrim[..., 1], scrim[..., 2] = r, g, b
    scrim[..., 3] = alpha[:, None]
    ax.imshow(scrim, extent=(x0, 5.1, -1.05, 1.05), aspect="auto",
              interpolation="bilinear", zorder=4)

    ax.set_xlim(x0, 5.1)
    ax.set_ylim(-1.05, 1.05)
    save(fig, name)


def main():
    global ACCENT, INK, MUTED, FAINT, PAPER, SUNK, MODE, CV_DEST, rng

    print("Writing figures to", OUT)
    render_all()

    # Then once per theme for the CV. Reseeding matters: the particle clouds
    # and the noise have to come out identical every time, or the CV would
    # show a different n-body run from the website, and its two themes would
    # disagree with each other.
    MODE = "pdf"
    for theme, values in THEMES.items():
        ACCENT, INK, MUTED, FAINT, PAPER, SUNK = values
        CV_DEST = CV_OUT if theme == "light" else CV_OUT / theme
        CV_DEST.mkdir(parents=True, exist_ok=True)
        print(f"Writing {theme} CV figures to", CV_DEST)

        rng = np.random.default_rng(SEED)
        render_all()
        # Masthead: opaque at the foot so the name stays legible, open above.
        wake_band("hero-band", 16.0, 4.6,
                  [[0.00, 1.00], [0.18, 0.94], [0.56, 0.62], [1.00, 0.28]])
        # Foot of the last page: a ribbon that clears the running foot below
        # it and the last line of text above it, taken from far enough
        # downstream that the wake has spread into something quiet.
        wake_band("tail-band", 16.0, 1.07,
                  [[0.00, 1.00], [0.30, 0.94], [0.68, 0.62], [1.00, 0.90]],
                  x0=2.4, tint=False)

    print("done")


if __name__ == "__main__":
    main()
