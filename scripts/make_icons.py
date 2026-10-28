#!/usr/bin/env python3
"""Generate the favicon set in public/.

An ink square with a paper-coloured F in Source Serif 4 SemiBold, the face
the site's headings are set in. The square is solid so the mark reads on
light and dark browser tabs alike, with no media query inside the SVG.

    python3 scripts/make_icons.py

Writes favicon.svg, favicon.ico (16, 32 and 48 px) and apple-touch-icon.png
(180 px, square corners, since iOS rounds them itself).
"""

from io import BytesIO
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.font_manager import FontProperties
from matplotlib.patches import FancyBboxPatch, PathPatch
from matplotlib.path import Path as MplPath
from matplotlib.textpath import TextPath
from matplotlib.transforms import Affine2D
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
FONT = FontProperties(fname=ROOT / "cv" / "fonts" / "SourceSerif4-SemiBold.ttf")

INK = "#18212d"      # --ink, light theme
PAPER = "#f6f8f6"    # --bg, light theme

BOX = 64             # icon units
RADIUS = 9           # rounded corners on the tab icon only
CAP = 38             # height of the F in icon units


def glyph(cap):
    """The F as a path, centred in the box, y pointing up."""
    tp = TextPath((0, 0), "F", size=100, prop=FONT)
    ext = tp.get_extents()
    k = cap / (ext.y1 - ext.y0)
    return tp.transformed(
        Affine2D()
        .translate(-(ext.x0 + ext.x1) / 2, -(ext.y0 + ext.y1) / 2)
        .scale(k)
        .translate(BOX / 2, BOX / 2)
    )


def svg():
    # SVG's y axis points down, so flip as we write.
    fmt = lambda x, y: f"{x:.1f} {BOX - y:.1f}"
    d = []
    for v, code in glyph(CAP).iter_segments(curves=True, simplify=False):
        if code == MplPath.MOVETO:
            d.append("M" + fmt(*v))
        elif code == MplPath.LINETO:
            d.append("L" + fmt(*v))
        elif code == MplPath.CURVE3:
            d.append("Q" + fmt(*v[:2]) + " " + fmt(*v[2:]))
        elif code == MplPath.CURVE4:
            d.append("C" + fmt(*v[:2]) + " " + fmt(*v[2:4]) + " " + fmt(*v[4:]))
        elif code == MplPath.CLOSEPOLY:
            d.append("Z")
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {BOX} {BOX}">'
        f'<rect width="{BOX}" height="{BOX}" rx="{RADIUS}" fill="{INK}"/>'
        f'<path fill="{PAPER}" d="{"".join(d)}"/></svg>\n'
    )


def raster(px, rounded=True, cap=CAP):
    fig = plt.figure(figsize=(1, 1), dpi=px)
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_axis_off()
    ax.set_xlim(0, BOX)
    ax.set_ylim(0, BOX)
    fig.patch.set_alpha(0)
    if rounded:
        ax.add_patch(FancyBboxPatch((RADIUS, RADIUS), BOX - 2 * RADIUS,
                                    BOX - 2 * RADIUS, facecolor=INK, lw=0,
                                    boxstyle=f"round,pad={RADIUS}"))
    else:
        ax.add_patch(plt.Rectangle((0, 0), BOX, BOX, facecolor=INK, lw=0))
    ax.add_patch(PathPatch(glyph(cap), facecolor=PAPER, lw=0))
    buf = BytesIO()
    fig.savefig(buf, format="png", dpi=px, transparent=True)
    plt.close(fig)
    return Image.open(buf).convert("RGBA")


def main():
    (PUBLIC / "favicon.svg").write_text(svg())

    sizes = (16, 32, 48)
    images = [raster(s) for s in sizes]
    images[-1].save(PUBLIC / "favicon.ico", format="ICO",
                    sizes=[(s, s) for s in sizes], append_images=images[:-1])

    # A home-screen icon fills its square; the F gets a little more margin.
    raster(180, rounded=False, cap=CAP * 0.8).convert("RGB").save(
        PUBLIC / "apple-touch-icon.png", optimize=True)

    for name in ("favicon.svg", "favicon.ico", "apple-touch-icon.png"):
        print(f"  {name}  ({(PUBLIC / name).stat().st_size} bytes)")


if __name__ == "__main__":
    main()
