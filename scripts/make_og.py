#!/usr/bin/env python3
"""Generate the Open Graph share cards in public/og/.

Every link to this site pasted into LinkedIn, Slack, Bluesky or a comment box
renders as a card. Without an image that card is a grey rectangle, which is
the sharing equivalent of the empty project boxes this site got rid of.

The cards reuse the project schematics from make_figures.py rather than
redrawing anything: this script imports that module, swaps its colour globals
for the literal light-theme values, and captures each figure as a PNG on the
way past. Run make_figures.py first if the drawings have changed; the two are
independent, but a stale card is worse than an ugly one.

Copy is read out of the real sources (the page files and profile.js) so the
cards cannot drift from the pages they advertise. A source that stops parsing
raises rather than silently shipping the wrong words.

    python3 scripts/make_og.py
"""

from pathlib import Path
import json
import re
import shutil
import sys
import tempfile

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import yaml
from matplotlib import font_manager
from matplotlib.font_manager import FontProperties
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

import make_figures as mf  # noqa: E402  (path has to be set first)

OUT = ROOT / "public" / "og"
PROJECTS = ROOT / "src" / "content" / "projects"
PAGES = ROOT / "src" / "pages"
PHOTOS = ROOT / "src" / "assets" / "photography"
MANIFEST = ROOT / "src" / "data" / "og.json"

# Facebook and LinkedIn both want 1.91:1. 1200x630 is the size everything
# downscales from, so it is the only one worth generating.
W, H = 1200, 630
DPI = 100

# Light theme only. A share card has no way to know the reader's theme, and
# the paper background is the one people recognise as this site.
PAPER = "#fbfaf7"
INK = "#17171b"
INK_2 = "#4b4b53"
INK_3 = "#686871"
ACCENT = "#97213c"
RULE = "#ddd7cb"

MARGIN = 76           # px, matches the page gutter at desktop width


def site_host():
    """The domain, read from astro.config.mjs so the cards cannot outlive a
    move to a different one."""
    src = (ROOT / "astro.config.mjs").read_text()
    match = re.search(r"site:\s*'([^']*)'", src)
    if not match:
        raise SystemExit("astro.config.mjs: could not read `site`")
    return match.group(1).split("://", 1)[-1].rstrip("/")


FOOT = site_host()


# --------------------------------------------------------------------------
# Fonts. The same cuts the CV uses; matplotlib cannot read the woff2s.
# --------------------------------------------------------------------------
for ttf in sorted((ROOT / "cv" / "fonts").glob("*.ttf")):
    font_manager.fontManager.addfont(str(ttf))

DISPLAY = FontProperties(family="Newsreader", weight=500)
BODY = FontProperties(family="Inter", weight=400)
MONO = FontProperties(family="Roboto Mono", weight=500)


# --------------------------------------------------------------------------
# Schematics, captured from make_figures.py at light-theme literal colours
# --------------------------------------------------------------------------
def capture_figures(dest):
    """Run every drawing in make_figures and keep the raster, not the SVG."""
    accent, ink, muted, faint, paper, sunk = mf.THEMES["light"]
    mf.ACCENT, mf.INK, mf.MUTED, mf.FAINT = accent, ink, muted, faint
    mf.PAPER, mf.SUNK = paper, sunk
    # The particle clouds are random; reseeding keeps the card and the page
    # showing the same run.
    mf.rng = np.random.default_rng(mf.SEED)

    original = mf.save

    def capture(fig, name):
        fig.savefig(dest / f"{name}.png", format="png", dpi=200,
                    transparent=True, bbox_inches="tight", pad_inches=0)
        plt.close(fig)

    mf.save = capture
    try:
        mf.render_all()
    finally:
        mf.save = original

    return {p.stem: p for p in dest.glob("*.png")}


def cover(path, box_w, box_h):
    """Scale to fill the box and crop the overflow, like CSS object-fit."""
    img = Image.open(path).convert("RGBA")
    scale = max(box_w / img.width, box_h / img.height)
    img = img.resize((max(1, round(img.width * scale)),
                      max(1, round(img.height * scale))), Image.LANCZOS)
    left = (img.width - box_w) // 2
    top = (img.height - box_h) // 2
    return img.crop((left, top, left + box_w, top + box_h))


# --------------------------------------------------------------------------
# Copy, read out of the real sources
# --------------------------------------------------------------------------
def read_profile():
    src = (ROOT / "src" / "data" / "profile.js").read_text()

    role = re.search(r'role:\s*"([^"]*)"', src)
    # The tagline is written as adjacent string literals joined with +.
    tagline = re.search(r"tagline:\s*\n?\s*((?:\"[^\"]*\"\s*\+?\s*)+),", src)
    if not (role and tagline):
        raise SystemExit("profile.js: could not read role/tagline")

    parts = re.findall(r'"([^"]*)"', tagline.group(1))
    return role.group(1), "".join(parts)


def read_page(filename):
    """Pull title and description off a page's <Layout ...> invocation."""
    src = (PAGES / filename).read_text()
    tag = re.search(r"<Layout\b(.*?)>", src, re.DOTALL)
    if not tag:
        raise SystemExit(f"{filename}: no <Layout> tag")

    title = re.search(r'title="([^"]*)"', tag.group(1))
    description = re.search(r'description="([^"]*)"', tag.group(1))
    if not (title and description):
        raise SystemExit(f"{filename}: no title/description on <Layout>")
    return title.group(1), description.group(1)


def read_projects():
    out = []
    for path in sorted(PROJECTS.glob("*.md")):
        raw = path.read_text().split("---", 2)
        if len(raw) < 3:
            raise SystemExit(f"{path.name}: no frontmatter")
        data = yaml.safe_load(raw[1])
        out.append({
            "slug": path.stem,
            "kicker": " · ".join([str(data["year"]), *data["categories"]]),
            "title": data["title"],
            "blurb": data["summary"],
            "figure": data.get("figure"),
            "foot": f"Ferran Alía · {FOOT}",
        })
    return out


# --------------------------------------------------------------------------
# Layout
# --------------------------------------------------------------------------
def wrap(fig, text, props, size, max_px, max_lines):
    """Greedy wrap, measured against the real renderer rather than guessed."""
    renderer = fig.canvas.get_renderer()
    lines, current = [], ""

    def width_of(s):
        probe = fig.text(0, 0, s, fontproperties=props, size=size)
        w = probe.get_window_extent(renderer).width
        probe.remove()
        return w

    for word in text.split():
        trial = f"{current} {word}".strip()
        if current and width_of(trial) > max_px:
            lines.append(current)
            current = word
        else:
            current = trial
    if current:
        lines.append(current)

    if len(lines) > max_lines:
        lines = lines[:max_lines]
        lines[-1] = lines[-1].rstrip(".,;:") + "…"
    return lines


def compress(path, photographic):
    """Line art quantises to a small palette with no visible loss and saves
    about 80% of the bytes. A photograph does not, so that one card stays
    full colour and goes out as JPEG instead."""
    img = Image.open(path).convert("RGB")
    if photographic:
        out = path.with_suffix(".jpg")
        img.save(out, format="JPEG", quality=88, optimize=True,
                 progressive=True)
        path.unlink()
        return out

    img.quantize(colors=128, method=Image.MEDIANCUT, dither=Image.NONE) \
       .save(path, format="PNG", optimize=True)
    return path


def draw_block(fig, lines, props, size, color, x, y, leading):
    """Draw wrapped lines downward from y (figure coords). Returns the next y."""
    for line in lines:
        fig.text(x, y, line, fontproperties=props, size=size, color=color,
                 va="top", ha="left")
        y -= leading / H
    return y


def card(spec, figures, wide=False):
    fig = plt.figure(figsize=(W / DPI, H / DPI), dpi=DPI)
    fig.patch.set_facecolor(PAPER)

    # --- schematic -------------------------------------------------------
    # `wide` is the homepage treatment: the hero runs the full width under
    # the type, the way it does on the site. Everything else gets a panel on
    # the right, so the type keeps a hard left edge.
    panel_x = 0.0 if wide else 0.54
    text_right = 0.72 if wide else 0.50

    photo = spec.get("photo")
    src = PHOTOS / photo if photo else figures.get(spec.get("figure"))
    if src:
        box_w = round(W * (1 - panel_x))
        img = cover(src, box_w, H)

        ax = fig.add_axes([panel_x, 0.0, 1 - panel_x, 1.0], zorder=0)
        ax.set_axis_off()
        ax.imshow(np.asarray(img), extent=(0, 1, 0, 1), aspect="auto",
                  interpolation="antialiased")

        # Paper scrim, opaque at the left edge of the panel and clear at the
        # right, so the drawing dissolves into the page instead of sitting in
        # a box. Mirrors .hero__scrim in src/pages/index.astro.
        stops = [[0.0, 1.0], [0.38, 0.86], [0.74, 0.30], [1.0, 0.0]] if wide \
                else [[0.0, 1.0], [0.30, 0.35], [1.0, 0.0]]
        stops = np.array(stops)
        cols = 256
        alpha = np.interp(np.linspace(0, 1, cols), stops[:, 0], stops[:, 1])
        r, g, b = (int(PAPER[i:i + 2], 16) / 255 for i in (1, 3, 5))
        scrim = np.zeros((1, cols, 4))
        scrim[..., 0], scrim[..., 1], scrim[..., 2] = r, g, b
        scrim[..., 3] = alpha[None, :]
        ax.imshow(scrim, extent=(0, 1, 0, 1), aspect="auto",
                  interpolation="bilinear", zorder=2)
        ax.set_xlim(0, 1)
        ax.set_ylim(0, 1)

    x = MARGIN / W
    max_px = text_right * W - MARGIN
    y = 1 - MARGIN / H

    # --- kicker ----------------------------------------------------------
    if spec.get("kicker"):
        fig.text(x, y, spec["kicker"].upper(), fontproperties=MONO, size=15,
                 color=ACCENT, va="top", ha="left")
        y -= 58 / H

    # --- title -----------------------------------------------------------
    size = spec.get("title_size", 52)
    lines = wrap(fig, spec["title"], DISPLAY, size, max_px, 3)
    y = draw_block(fig, lines, DISPLAY, size, INK, x, y, size * 1.22)

    # --- blurb -----------------------------------------------------------
    if spec.get("blurb"):
        y -= 20 / H
        lines = wrap(fig, spec["blurb"], BODY, 21, max_px, 5)
        draw_block(fig, lines, BODY, 21, INK_2, x, y, 21 * 1.62)

    # --- foot ------------------------------------------------------------
    rule_y = MARGIN / H + 46 / H
    fig.add_artist(plt.Line2D([x, x + 46 / W], [rule_y, rule_y],
                              color=ACCENT, lw=2.4,
                              transform=fig.transFigure))
    fig.text(x, MARGIN / H, spec.get("foot", FOOT), fontproperties=MONO,
             size=16, color=INK_3, va="bottom", ha="left")

    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"{spec['slug']}.png"
    fig.savefig(path, format="png", dpi=DPI, facecolor=PAPER)
    plt.close(fig)

    path = compress(path, photographic=bool(photo))
    print(f"  {path.name}  ({path.stat().st_size // 1024} kB)")
    return f"/og/{path.name}"


def main():
    role, tagline = read_profile()
    manifest = {}

    tmp = Path(tempfile.mkdtemp(prefix="og-figures-"))
    try:
        print("Rendering schematics")
        figures = capture_figures(tmp)

        print("Writing cards to", OUT)

        # The homepage card doubles as the fallback for anything without one.
        manifest["default"] = card({
            "slug": "default",
            "kicker": role,
            "title": "Ferran Alía",
            "title_size": 82,
            "blurb": tagline,
            "figure": "hero-flow",
            "foot": FOOT,
        }, figures, wide=True)

        sections = [
            ("work", "work/index.astro", {"figure": "vortex-pinn"}),
            ("writing", "writing.astro", {"figure": "lattice-boltzmann"}),
            # A schematic would break the two-language rule here (see the
            # design principles in CLAUDE.md), so this card gets the gallery's
            # feature photo instead, alone in the frame.
            ("photography", "photography.astro", {"photo": "shoreline.jpg"}),
            ("about", "about.astro", {"figure": "n-body"}),
        ]
        for slug, page, art in sections:
            title, description = read_page(page)
            manifest[slug] = card({
                "slug": slug,
                "kicker": "Ferran Alía",
                "title": title,
                "title_size": 68,
                "blurb": description,
                "foot": FOOT,
                **art,
            }, figures)

        for project in read_projects():
            manifest[project["slug"]] = card(project, figures)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

    MANIFEST.write_text(
        json.dumps(dict(sorted(manifest.items())), indent=2) + "\n"
    )
    print("Wrote", MANIFEST.relative_to(ROOT))
    print("done")


if __name__ == "__main__":
    main()
