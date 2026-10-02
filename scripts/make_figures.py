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
PLATE = "#ff0005"      # the plate behind the drawing, for hollow markers

SENTINELS = {
    "#ff0001": "var(--fig-accent)",
    "#ff0002": "var(--fig-ink)",
    "#ff0003": "var(--fig-muted)",
    "#ff0004": "var(--fig-faint)",
    "#ff0005": "var(--bg-sunk)",
}

# The same four roles, resolved against each theme in global.css. The CV
# ships in both, so the drawings do too.
#           (--fig-accent, --fig-ink, --fig-muted, --fig-faint, --bg, --bg-sunk)
THEMES = {
    "light": ("#1d4e9e", "#18212d", "#93a39a", "#dce5df", "#f6f8f6", "#eaf0ec"),
    "dark":  ("#8ec5ff", "#e8eef4", "#56769a", "#1c3650", "#0e2236", "#132b42"),
}

PAPER = "#f6f8f6"      # --bg,      rebound per theme
SUNK = "#eaf0ec"       # --bg-sunk, rebound per theme

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
    # Artists tagged with a gid starting "anim-" are marked for hover motion
    # in Figure.astro/ProjectCard.astro. `gid` maps to an `id` attribute in
    # matplotlib's SVG backend, but several artists share one concept (every
    # streamline in a flow field), so ids collide; rewrite them to a class
    # instead, which CSS can target the same way without needing uniqueness.
    # A gid can carry more than one space-separated class (an artist that is
    # both "a flow line" and "the one that also sways").
    svg = re.sub(r'<g id="(anim-[a-zA-Z0-9_ -]+)"', r'<g class="\1"', svg)
    # Parameter tokens from `tag` become custom properties on the group:
    # "i-3" -> --i:3 (a stagger index), "ox-216" -> --ox:216px, and so on.
    def params(m):
        classes, props = [], []
        for tok in m.group(1).split():
            v = re.fullmatch(r"(i|ox|oy|dy)-(m?)(\d+)", tok)
            if v:
                unit = "" if v.group(1) == "i" else "px"
                props.append(f"--{v.group(1)}:{'-' if v.group(2) else ''}{v.group(3)}{unit}")
            else:
                classes.append(tok)
        out = f'<g class="{" ".join(classes)}"'
        return out + (f' style="{";".join(props)}"' if props else "")
    svg = re.sub(r'<g class="(anim-[^"]*)"', params, svg)
    # Draw-on animations need every path's length normalised to 1.
    svg = re.sub(r'(<g class="[^"]*\banim-draw\b[^"]*"[^>]*>\s*<path )',
                 r'\1pathLength="1" ', svg)
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


def karman(name, w, h, n_lines, lw, pinn=False):
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
                solid_capstyle="round",
                gid="anim-flow-line anim-wake-sway")

    if pinn:
        # Where the loss looks: sparse OpenFOAM samples (squares) and a grid
        # of collocation points where the Navier-Stokes residual is checked
        # (crosses), swept column by column on hover.
        for k, cx in enumerate(np.linspace(0.35, 4.9, 15)):
            cy = np.linspace(-0.88, 0.88, 7)
            sc = ax.scatter(np.full_like(cy, cx), cy, s=12, marker="+",
                            color=INK, linewidths=0.6, alpha=0.55, zorder=3)
            tag(sc, "anim-colloc", i=k)
        data = np.column_stack([rng.uniform(0.5, 4.8, 16), rng.uniform(-0.6, 0.6, 16)])
        ax.scatter(data[:, 0], data[:, 1], s=14, marker="s", facecolor=PLATE,
                   edgecolor=INK, linewidths=0.9, zorder=4)

    ax.add_patch(plt.Circle((0.0, 0.0), 0.2, facecolor=INK, edgecolor="none", zorder=5))
    ax.set_xlim(-0.55, 5.1)
    ax.set_ylim(-1.05, 1.05)
    save(fig, name)


# --------------------------------------------------------------------------
# Shared pieces for the project drawings below
#
# Every drawing uses data coordinates 0..8 by 0..5 on the default 8x5 inch
# canvas, so one data unit is 72 SVG units and CSS transforms (orbits,
# drifting vortices, the CTG pen) can be written in the same numbers.
# --------------------------------------------------------------------------
PX = 72


def tag(artist, *classes, **params):
    """Mark an artist for hover/autoplay motion. Extra keyword params become
    CSS custom properties on its group (see `save`): i= is the stagger index,
    ox/oy a transform origin in SVG units, dy a hop distance."""
    toks = list(classes)
    for key, val in params.items():
        toks.append(f"{key}-{'m' if val < 0 else ''}{abs(int(round(val)))}")
    artist.set_gid(" ".join(toks))
    return artist


def svg_xy(x, y):
    """Data coordinates on the 8x5 canvas to SVG user units."""
    return x * PX, (5 - y) * PX


def naca(t, m, p, n=70):
    """A NACA four-digit section, unit chord, leading edge at the origin.
    Cosine spacing so the nose stays round with few vertices."""
    xc = (1 - np.cos(np.linspace(0, np.pi, n))) / 2
    yt = 5 * t * (0.2969 * np.sqrt(xc) - 0.1260 * xc - 0.3516 * xc**2
                  + 0.2843 * xc**3 - 0.1015 * xc**4)
    yc = np.where(xc < p, m / p**2 * (2 * p * xc - xc**2),
                  m / (1 - p) ** 2 * ((1 - 2 * p) + 2 * p * xc - xc**2))
    upper = np.column_stack([xc, yc + yt])
    lower = np.column_stack([xc[::-1], (yc - yt)[::-1]])
    return np.vstack([upper, lower])


def place(foil, chord, angle, x, y, invert=False):
    """Scale, rotate (degrees, positive lifts the trailing edge) and move."""
    f = foil.copy()
    if invert:
        f[:, 1] = -f[:, 1]
    a = np.deg2rad(angle)
    R = np.array([[np.cos(a), -np.sin(a)], [np.sin(a), np.cos(a)]])
    return (f * chord) @ R.T + [x, y]


# --------------------------------------------------------------------------
# 2. Multi-element front wing and the optimisation history — F1 frontwing
# --------------------------------------------------------------------------
def front_wing(flap1, flap2, gap=0.0):
    """Main plane plus two flaps, inverted for downforce."""
    main = place(naca(0.11, 0.05, 0.4), 2.4, 4, 0.6, 2.2, invert=True)
    f1 = place(naca(0.10, 0.06, 0.4), 1.3, flap1, 2.72, 2.52 + gap, invert=True)
    te1 = f1[len(f1) // 2]
    f2 = place(naca(0.09, 0.06, 0.4), 0.95, flap2, te1[0] - 0.22, te1[1] + 0.14 + gap,
               invert=True)
    return main, f1, f2


def surrogate():
    fig, ax = canvas()

    # Ground plane: a front wing works in ground effect.
    ax.plot([0.2, 5.3], [1.45, 1.45], color=MUTED, lw=0.9)
    for x in np.arange(0.3, 5.3, 0.28):
        ax.plot([x, x - 0.16], [1.45, 1.29], color=MUTED, lw=0.5, alpha=0.6)

    # Flow under and over the wing, accelerating beneath it.
    xs = np.linspace(0.0, 5.3, 160)
    for y0 in (1.72, 1.92, 3.95, 4.25):
        bump = np.exp(-((xs - 2.6) / 1.3) ** 2)
        y = y0 - 0.16 * bump if y0 < 3 else y0 + 0.22 * np.exp(-((xs - 3.9) / 1.0) ** 2)
        line, = ax.plot(xs, y, color=ACCENT, lw=0.9, alpha=0.55,
                        solid_capstyle="round")
        tag(line, "anim-flow-dots")

    # Earlier candidates the surrogate proposed, faint, in run order.
    cands = [(10, 22, 0.06), (13, 27, -0.04), (21, 36, 0.05), (16, 25, 0.0),
             (19, 34, -0.05), (15, 30, 0.03)]
    for k, (a1, a2, gap) in enumerate(cands):
        for el in front_wing(a1, a2, gap):
            ln, = ax.plot(el[:, 0], el[:, 1], color=MUTED, lw=0.7, alpha=0.8)
            tag(ln, "anim-cand", i=k)

    # The design it settled on.
    for el in front_wing(18, 31):
        ax.fill(el[:, 0], el[:, 1], facecolor=INK, edgecolor="none", zorder=4)

    # Lift-to-drag against solver run: the fixed budget of real CFD runs.
    x0, x1, y0, y1 = 5.85, 7.75, 1.15, 4.1
    ax.plot([x0, x0, x1], [y1, y0, y0], color=INK, lw=0.8)
    base, best = 1.75, 3.45                  # baseline and ~15% better
    ax.plot([x0, x1], [base, base], color=MUTED, lw=0.7, ls=(0, (3, 3)))
    ax.plot([x0, x1], [best, best], color=ACCENT, lw=0.8, ls=(0, (3, 3)))

    runs = np.linspace(x0 + 0.12, x1 - 0.1, 14)
    gains = np.array([0.0, 0.05, 0.02, 0.22, 0.18, 0.41, 0.36, 0.58, 0.55,
                      0.74, 0.70, 0.86, 0.95, 1.0])
    vals = base + gains * (best - base) - rng.uniform(0, 0.25, 14) * (gains < 0.99)
    vals[0] = base
    so_far = np.maximum.accumulate(vals)
    step = ax.step(runs, so_far, where="post", color=ACCENT, lw=1.4)[0]
    tag(step, "anim-draw")
    for k, (rx, v) in enumerate(zip(runs, vals)):
        pt = ax.scatter([rx], [v], s=16, facecolor=PLATE, edgecolor=INK,
                        linewidths=0.9, zorder=5)
        tag(pt, "anim-pop", i=k)

    ax.set_xlim(0, 8)
    ax.set_ylim(0, 5)
    save(fig, "f1-frontwing")


# --------------------------------------------------------------------------
# 3. Disc galaxy and companion under a Barnes-Hut quadtree — parallel N-body
# --------------------------------------------------------------------------
def nbody():
    fig, ax = canvas()
    gx, gy, gr = 2.1, 2.5, 1.6
    # Two trailing arms plus a bulge. Arms wind counterclockwise outward and
    # the CSS rotation is clockwise, so the tips trail as they should.
    per_arm = 230
    parts, radii = [], []
    for arm in (0, 1):
        t = rng.uniform(0, 1, per_arm) ** 0.8
        theta = t * 2.6 * np.pi + arm * np.pi
        rr = 0.2 + (gr - 0.2) * t
        jitter = rng.normal(0, 1, (per_arm, 2)) * (0.03 + 0.06 * rr[:, None])
        parts.append(np.column_stack([gx + rr * np.cos(theta), gy + rr * np.sin(theta)]) + jitter)
        radii.append(rr)
    bulge = rng.normal([gx, gy], 0.17, (90, 2))
    gal = np.vstack(parts + [bulge])
    r = np.concatenate(radii + [np.hypot(*(bulge - [gx, gy]).T)])

    cx, cy = 6.35, 3.05
    comp = rng.normal([cx, cy], 0.28, (110, 2))
    pts = np.vstack([gal, comp])

    # The tree is built over everything, in two square roots side by side.
    segs = {}

    def subdivide(x0, y0, s, depth):
        inside = pts[(pts[:, 0] >= x0) & (pts[:, 0] < x0 + s)
                     & (pts[:, 1] >= y0) & (pts[:, 1] < y0 + s)]
        if len(inside) > 8 and depth < 5:
            h = s / 2
            segs.setdefault(depth, []).extend([
                [(x0, y0 + h), (x0 + s, y0 + h)],
                [(x0 + h, y0), (x0 + h, y0 + s)],
            ])
            for ox, oy in ((0, 0), (h, 0), (0, h), (h, h)):
                subdivide(x0 + ox, y0 + oy, h, depth + 1)

    for root in (0.2, 4.0):
        ax.add_patch(plt.Rectangle((root, 0.6), 3.8, 3.8, fill=False,
                                   edgecolor=MUTED, lw=0.9))
        subdivide(root, 0.6, 3.8, 0)
    from matplotlib.collections import LineCollection
    for depth, lines in sorted(segs.items()):
        lc = LineCollection(lines, colors=[MUTED], linewidths=max(1.0 - depth * 0.14, 0.4),
                            alpha=max(1.0 - depth * 0.12, 0.5))
        ax.add_collection(lc)
        tag(lc, "anim-qt", i=depth)

    # The disc turns as one. Spiral arms are density waves that keep their
    # shape, so rotating rings at different rates would only smear them.
    # Sizes still fall off with radius.
    ox, oy = svg_xy(gx, gy)
    ring = np.digitize(r, [0.35, 0.8, 1.3])
    for k, size in enumerate((6, 5, 4, 3.5)):
        sel = ring == k
        sc = ax.scatter(gal[sel, 0], gal[sel, 1], s=size, color=ACCENT,
                        alpha=0.9, linewidths=0, clip_on=False)
        tag(sc, "anim-orbit", i=0, ox=ox, oy=oy)
    ax.scatter([gx], [gy], s=30, color=INK, zorder=5)

    cox, coy = svg_xy(cx, cy)
    sc = ax.scatter(comp[:, 0], comp[:, 1], s=4, color=INK, alpha=0.8,
                    linewidths=0, clip_on=False)
    tag(sc, "anim-orbit", i=2, ox=cox, oy=coy)

    ax.set_xlim(0, 8)
    ax.set_ylim(0, 5)
    save(fig, "n-body")


# --------------------------------------------------------------------------
# 4. Lattice, cylinder and a drifting vortex street — lattice Boltzmann
# --------------------------------------------------------------------------
LBM_WAVE = 1.5          # vortex street wavelength, data units


def lattice():
    fig, ax = canvas()
    gxs, gys = np.meshgrid(np.arange(0.2, 8.0, 0.4), np.arange(0.1, 5.0, 0.4))
    ax.scatter(gxs.ravel(), gys.ravel(), s=2.2, color=MUTED, alpha=0.7, linewidths=0)

    # Wake streamlines threading the street: a sine of the street's own
    # wavelength, growing out of the cylinder, so the rings read as a wake.
    xw = np.linspace(1.3, 8.2, 220)
    grow = 1 - np.exp(-(xw - 1.3) / 0.8)
    for y0, amp in ((3.55, 0.18), (3.2, 0.3), (2.5, 0.42), (1.8, 0.3), (1.45, 0.18)):
        yw = y0 + amp * grow * np.sin(2 * np.pi * (xw - 2.35) / LBM_WAVE + np.pi / 2)
        if y0 != 2.5:
            yw = y0 + (yw - y0) * 0.6
        line, = ax.plot(xw, yw, color=MUTED, lw=0.8, alpha=0.7, solid_capstyle="round")
        tag(line, "anim-flow-line")
    for y0 in (0.45, 4.55):
        line, = ax.plot([0, 8], [y0, y0], color=MUTED, lw=0.7, alpha=0.6)
        tag(line, "anim-flow-line")

    # Two rows of vortices, offset by half a wavelength, each drifting one
    # wavelength per cycle so the loop is seamless. The first in each row
    # fades in, which reads as the vortex forming behind the cylinder.
    for row, (yv, col, x_start) in enumerate(((2.86, ACCENT, 2.35),
                                              (2.14, INK, 2.35 + LBM_WAVE / 2))):
        for k in range(5):
            xv = x_start + k * LBM_WAVE
            classes = ["anim-vdrift"] + (["anim-vfirst"] if k == 0 else [])
            for j, rad in enumerate((0.11, 0.22, 0.33)):
                c = plt.Circle((xv, yv), rad, fill=False, edgecolor=col,
                               lw=1.1 - 0.25 * j, alpha=0.85 - 0.2 * j, clip_on=False)
                ax.add_patch(c)
                tag(c, *classes)

    ax.add_patch(plt.Circle((1.3, 2.5), 0.38, facecolor=INK, edgecolor="none", zorder=5))

    # D2Q9 stencils on a few free-stream nodes: eight links and a rest
    # population, firing together the way streaming moves them.
    dirs = [(1, 0), (0, 1), (-1, 0), (0, -1), (1, 1), (-1, 1), (-1, -1), (1, -1)]
    # Below the wake, clear of its lowest streamline and inside the 16:7
    # crop used on the project page.
    for nx_, ny_ in ((1.8, 1.0), (4.6, 1.0), (7.0, 1.0)):
        for k, (dx, dy) in enumerate(dirs):
            arrow = ax.annotate(
                "", xy=(nx_ + dx * 0.32, ny_ + dy * 0.32), xytext=(nx_, ny_),
                arrowprops=dict(arrowstyle="-|>", color=ACCENT,
                                lw=1.3 if k < 4 else 0.9, shrinkA=2, shrinkB=0,
                                mutation_scale=7))
            arrow.arrow_patch.set_gid("anim-lattice-arrow")
        node, = ax.plot(nx_, ny_, marker="o", ms=4.5, color=INK)
        tag(node, "anim-lattice-node")

    ax.set_xlim(0, 8)
    ax.set_ylim(0, 5)
    save(fig, "lattice-boltzmann")


# --------------------------------------------------------------------------
# 5. Energy ladder with hopping fermions beside the occupancy curve
# --------------------------------------------------------------------------
def fermi_dirac():
    fig, ax = canvas()
    ef = 2.6
    levels = 0.65 + 0.3 * np.arange(13)

    ax.plot([0.4, 7.7], [ef, ef], color=MUTED, lw=0.8, ls=(0, (4, 4)))
    for y in levels:
        ax.plot([0.7, 2.2], [y, y], color=INK, lw=1.0, alpha=0.75)

    # Ground state: both spin slots filled below the Fermi level.
    xs = (1.15, 1.75)
    hops = {(5, 1): 3, (5, 0): 1, (4, 1): 3}   # (level, slot) -> levels up
    for k, y in enumerate(levels):
        if y > ef:
            continue
        for s, x in enumerate(xs):
            key = (k, s)
            if key in hops:
                # The hole sits under the fermion and only shows once it
                # has hopped, so the static drawing is the ground state.
                ax.scatter([x], [y], s=30, facecolor=PLATE, edgecolor=ACCENT,
                           linewidths=1.0, zorder=3)
                dot = ax.scatter([x], [y], s=30, color=ACCENT, zorder=4,
                                 linewidths=0, clip_on=False)
                n_up = hops[key]
                tag(dot, "anim-hop", i=list(hops).index(key), dy=-n_up * 0.3 * PX)
            else:
                ax.scatter([x], [y], s=30, color=ACCENT, zorder=4, linewidths=0)

    # Occupancy f(E) drawn sideways so it shares the ladder's energy axis.
    fx0, fw = 3.3, 4.2
    ax.plot([fx0, fx0], [0.5, 4.6], color=MUTED, lw=0.7)
    ax.plot([fx0 + fw, fx0 + fw], [0.5, 4.6], color=MUTED, lw=0.7, ls=(0, (2, 3)))
    e = np.linspace(0.5, 4.6, 220)
    for i, t in enumerate([0.05, 0.16, 0.34, 0.6]):
        f = 1 / (1 + np.exp((e - ef) / t))
        ax.plot(fx0 + fw * f, e, color=ACCENT, lw=2.2 - i * 0.4,
                alpha=1.0 - i * 0.17, gid=f"anim-fermi-t{i}")
    es = rng.uniform(0.6, 4.5, 70)
    fs = 1 / (1 + np.exp((es - ef) / 0.34)) + rng.normal(0, 0.035, 70)
    ax.scatter(fx0 + fw * np.clip(fs, -0.02, 1.02), es, s=9, facecolor="none",
               edgecolor=INK, linewidths=0.8, gid="anim-jitter")

    ax.set_xlim(0, 8)
    ax.set_ylim(0, 5)
    save(fig, "fermi-dirac")


# --------------------------------------------------------------------------
# 6. Wing section on the solver's Cartesian grid — fixed-wing bird flight
# --------------------------------------------------------------------------
def aerofoil():
    from matplotlib.path import Path as MPath
    from matplotlib.collections import LineCollection, PolyCollection

    fig, ax = canvas()
    foil = place(naca(0.12, 0.06, 0.4, n=90), 3.9, -8, 1.9, 2.75)

    # Streamlines first, so the wing sits on top of them.
    xs = np.linspace(0.0, 8.0, 260)
    mid = 3.85
    for y0 in np.linspace(1.0, 4.0, 15):
        bump = np.exp(-((xs - mid) ** 2) / 2.2)
        off = y0 - 2.5
        lift = (0.42 if off >= 0 else -0.22) * bump * np.exp(-abs(off) * 1.1)
        y = y0 + lift + 0.12 * bump * np.sign(off or 1)
        near = abs(off) < 0.9
        line, = ax.plot(xs, y, color=ACCENT if near else MUTED,
                        lw=1.1 if near else 0.75, alpha=0.9, zorder=2,
                        solid_capstyle="round")
        tag(line, "anim-flow-dots")

    # The solver's grid around the wing, and the cells it counts as solid:
    # the staircase a NumPy finite-difference code actually sees.
    h = 0.16
    gx = np.arange(1.4, 6.4 + h / 2, h)
    gy = np.arange(1.75, 3.35 + h / 2, h)
    lines = [[(x, gy[0]), (x, gy[-1])] for x in gx] + [[(gx[0], y), (gx[-1], y)] for y in gy]
    ax.add_collection(LineCollection(lines, colors=[MUTED], linewidths=0.4,
                                     alpha=0.6, zorder=3))
    ax.fill(foil[:, 0], foil[:, 1], facecolor=PLATE, edgecolor="none", zorder=3.5)
    path = MPath(foil)
    cells = []
    for x in gx[:-1]:
        for y in gy[:-1]:
            if path.contains_point((x + h / 2, y + h / 2)):
                cells.append([(x, y), (x + h, y), (x + h, y + h), (x, y + h)])
    ax.add_collection(PolyCollection(cells, facecolors=[MUTED], edgecolors="none",
                                     alpha=0.55, zorder=4))
    ax.plot(foil[:, 0], foil[:, 1], color=INK, lw=1.5, zorder=5)

    ax.set_xlim(0, 8)
    ax.set_ylim(0, 5)
    save(fig, "bird-flight")


# --------------------------------------------------------------------------
# 7. Four routes from one base model — LLM persona research
# --------------------------------------------------------------------------
def persona():
    fig, ax = canvas()
    base = (0.8, 2.5)
    # Top to bottom: system prompt, demonstrations, first-person
    # statements, synthetic documents. The system prompt is one short hop;
    # the three data formats are trained, so they carry update steps.
    routes = [
        dict(y=4.05, end=3.0, steps=0, color=MUTED, lw=1.2, win=False, dashed=True),
        dict(y=3.0, end=7.0, steps=7, color=MUTED, lw=1.2, win=False),
        dict(y=2.0, end=7.0, steps=7, color=ACCENT, lw=2.0, win=True),
        dict(y=0.95, end=7.0, steps=7, color=MUTED, lw=1.2, win=False),
    ]
    with plt.rc_context({"lines.scale_dashes": False}):
        for k, rt in enumerate(routes):
            t = np.linspace(0, 1, 160)
            x = base[0] + (rt["end"] - base[0]) * t
            s = np.clip(t / 0.3, 0, 1)
            y = base[1] + (rt["y"] - base[1]) * s * s * (3 - 2 * s)
            ax.plot(x, y, color=rt["color"], lw=rt["lw"], alpha=0.9,
                    ls=(0, (4, 3)) if rt.get("dashed") else "-",
                    solid_capstyle="round", zorder=2)
            # Tokens travelling the route: round dots on the same path.
            tok, = ax.plot(x, y, color=rt["color"], lw=rt["lw"] + 2.4,
                           ls=(0, (0.001, 9)), dash_capstyle="round", zorder=3)
            tag(tok, "anim-tokens", i=k)
            if rt["steps"]:
                sx = np.linspace(3.1, rt["end"] - 0.6, rt["steps"])
                ax.scatter(sx, np.full_like(sx, rt["y"]), s=22, facecolor=PLATE,
                           edgecolor=rt["color"], linewidths=1.0, zorder=4)
            if rt["win"]:
                ax.scatter([rt["end"]], [rt["y"]], s=190, color=ACCENT, zorder=5)
                ring = plt.Circle((rt["end"], rt["y"]), 0.36, fill=False,
                                  edgecolor=ACCENT, lw=1.6, zorder=5)
                ax.add_patch(ring)
                tag(ring, "anim-draw")
            else:
                ax.scatter([rt["end"]], [rt["y"]], s=90,
                           facecolor=PLATE if rt.get("dashed") else MUTED,
                           edgecolor=MUTED, linewidths=1.2, zorder=5)

    ax.scatter([base[0]], [base[1]], s=280, color=INK, zorder=6)
    ax.set_xlim(0, 8)
    ax.set_ylim(0, 5)
    save(fig, "llm-persona")


# --------------------------------------------------------------------------
# 8. Cardiotocograph strip with a moving pen — AI for assisted birth
# --------------------------------------------------------------------------
def ctg():
    fig, ax = canvas()
    t = np.linspace(0, 8, 900)

    fhr = (3.55
           + 0.20 * np.sin(t * 8.2)
           + 0.09 * np.sin(t * 25.0)
           + rng.normal(0, 0.025, t.size))
    decels = (2.95, 5.75)
    for c in decels:
        fhr -= 0.62 * np.exp(-((t - c) ** 2) / 0.045)
    toco = 1.0 + 0.85 * sum(np.exp(-((t - c) ** 2) / 0.11)
                            for c in (0.9, 2.8, 4.6, 5.6, 7.4))

    ax.axhline(3.55, color=MUTED, lw=0.6, ls=(0, (4, 4)), alpha=0.8)
    fhr_line, = ax.plot(t, fhr, color=ACCENT, lw=1.4)
    tag(fhr_line, "anim-draw", "anim-ctg")
    toco_line, = ax.plot(t, toco, color=MUTED, lw=1.2)
    tag(toco_line, "anim-draw", "anim-ctg")

    # The two decelerations, flagged as the model would. Each appears when
    # the pen passes it; see the matching delays in global.css.
    for k, c in enumerate(decels):
        box = plt.Rectangle((c - 0.38, 2.65), 0.76, 1.25, facecolor=INK,
                            alpha=0.12, edgecolor=INK, linewidth=0.8)
        ax.add_patch(box)
        tag(box, f"anim-flag-{'ab'[k]}")

    pen, = ax.plot([0, 0], [0.55, 4.45], color=INK, lw=1.0, clip_on=False)
    tag(pen, "anim-pen")

    ax.set_xlim(0, 8)
    ax.set_ylim(0, 5)
    save(fig, "assisted-birth")


# --------------------------------------------------------------------------
# 9. Beads joined as a graph under Köhler illumination — GNN multiscattering
# --------------------------------------------------------------------------
def gnn():
    fig, ax = canvas()
    # Köhler illumination is uniform across the field: parallel rays from
    # above, drawn faint so the graph reads first. Everything stays between
    # y = 0.8 and 4.2, the band that survives the 16:7 crop on project pages.
    for x in np.linspace(0.2, 7.8, 20):
        ax.plot([x, x], [3.85, 4.25], color=MUTED, lw=0.6, alpha=0.7, zorder=0)
        ax.annotate("", xy=(x, 3.7), xytext=(x, 3.9),
                    arrowprops=dict(arrowstyle="-|>", color=MUTED, lw=0.6,
                                    mutation_scale=6, alpha=0.7))

    beads = []
    while len(beads) < 17:
        p = rng.uniform([0.6, 1.05], [7.4, 3.3])
        if all(np.hypot(*(p - q)) > 0.8 for q in beads):
            beads.append(p)
    beads = np.array(beads)

    drawn = set()
    for i, p in enumerate(beads):
        d = np.hypot(*(beads - p).T)
        for j in np.argsort(d)[1:4]:
            key = tuple(sorted((i, j)))
            if key in drawn or d[j] > 2.2:
                continue
            drawn.add(key)
            q = beads[j]
            line, = ax.plot([p[0], q[0]], [p[1], q[1]], color=ACCENT,
                            lw=2.4 / d[j], alpha=0.85, zorder=2,
                            solid_capstyle="round")
            tag(line, "anim-flow-line")

    # Scattered wavefronts: a ring per bead, expanding on a stagger.
    for k, (x, y) in enumerate(beads):
        ring = plt.Circle((x, y), 0.3, fill=False, edgecolor=ACCENT, lw=0.8,
                          alpha=0.35, zorder=1, clip_on=False)
        ax.add_patch(ring)
        tag(ring, "anim-wave", i=k % 6)

    ax.scatter(beads[:, 0], beads[:, 1], s=150, facecolor=FAINT,
               edgecolor=INK, linewidths=1.3, zorder=3)
    ax.scatter(beads[:, 0], beads[:, 1], s=14, color=INK, zorder=4)
    ax.set_xlim(0, 8)
    ax.set_ylim(0, 5)
    save(fig, "gnn-multiscattering")


def render_all():
    karman("vortex-pinn", 8.0, 5.0, 46, 1.0, pinn=True)
    karman("hero-flow", 16.0, 4.6, 64, 0.85)
    surrogate()
    nbody()
    lattice()
    fermi_dirac()
    aerofoil()
    persona()
    ctg()
    gnn()


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
    global ACCENT, INK, MUTED, FAINT, PAPER, SUNK, PLATE, MODE, CV_DEST, rng

    print("Writing figures to", OUT)
    render_all()

    # Then once per theme for the CV. Reseeding matters: the particle clouds
    # and the noise have to come out identical every time, or the CV would
    # show a different n-body run from the website, and its two themes would
    # disagree with each other.
    MODE = "pdf"
    for theme, values in THEMES.items():
        ACCENT, INK, MUTED, FAINT, PAPER, SUNK = values
        PLATE = SUNK
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
