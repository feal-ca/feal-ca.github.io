#!/usr/bin/env python3
"""Download the site's webfonts into public/fonts/ and write fonts.css, then
fetch static TTF cuts of the same families into cv/fonts/ for XeLaTeX.

The site does not load fonts from a CDN; see CLAUDE.md, "Performance". Run
this once; the output is committed. Both families are SIL Open Font License
1.1, which permits redistribution.

- Source Serif 4: headings and prose. Variable in weight and optical size, so
  one file per style covers the 9pt caption and the 60pt name. Request the
  ranges (`400..600`), or the API returns one static file per weight.
- Barlow Semi Condensed: captions, navigation, dates. Only ships static
  weights, so it costs one file per weight; two is enough.
- Latin subset only. The content is English, Catalan and Spanish.

XeLaTeX cannot read woff2 and handles variable TTFs badly (it takes the
default instance), so the CV gets static cuts. The API serves plain TTF to a
client it does not recognise, which is what the second pass relies on.

    python3 scripts/fetch_fonts.py
"""

import pathlib
import re
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
WEB_OUT = ROOT / "public" / "fonts"
CV_OUT = ROOT / "cv" / "fonts"

# Two requests because the API will not mix axes within one family: the
# roman keeps optical size (119 kB, worth it for the name at 60pt), the
# italic is a single static cut (19 kB) used only for publication names.
WEB_APIS = [
    "https://fonts.googleapis.com/css2"
    "?family=Source+Serif+4:opsz,wght@8..60,400..600"
    "&family=Barlow+Semi+Condensed:wght@400;500"
    "&display=swap",
    "https://fonts.googleapis.com/css2"
    "?family=Source+Serif+4:ital,wght@1,400"
    "&display=swap",
]
# The API serves woff2 only to browsers it recognises.
BROWSER_UA = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
              "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

# Static cuts for the CV: (family, italic, weight, file name).
CV_CUTS = [
    ("Source Serif 4", 0, 400, "SourceSerif4-Regular.ttf"),
    ("Source Serif 4", 1, 400, "SourceSerif4-Italic.ttf"),
    ("Source Serif 4", 0, 600, "SourceSerif4-SemiBold.ttf"),
    ("Barlow Semi Condensed", 0, 400, "BarlowSemiCondensed-Regular.ttf"),
    ("Barlow Semi Condensed", 0, 500, "BarlowSemiCondensed-Medium.ttf"),
]


def get(url, ua=None):
    headers = {"User-Agent": ua} if ua else {}
    return urllib.request.urlopen(urllib.request.Request(url, headers=headers)).read()


def slug(family):
    return re.sub(r"[^a-z0-9]+", "-", family.lower()).strip("-")


def web():
    WEB_OUT.mkdir(parents=True, exist_ok=True)
    for stale in WEB_OUT.glob("*.woff2"):
        stale.unlink()

    css = "".join(get(api, BROWSER_UA).decode() for api in WEB_APIS)
    rules, total = [], 0
    for subset, block in re.findall(r"/\* ([\w-]+) \*/\s*(@font-face \{.*?\})", css, re.DOTALL):
        if subset != "latin":
            continue
        family = re.search(r"font-family: '([^']+)'", block).group(1)
        style = re.search(r"font-style: (\w+)", block).group(1)
        weight = re.search(r"font-weight: ([\d ]+);", block).group(1).replace(" ", "-")
        url = re.search(r"url\((https://[^)]+)\)", block).group(1)
        name = f"{slug(family)}-{style}-{weight}.woff2"
        dest = WEB_OUT / name
        dest.write_bytes(get(url))
        total += dest.stat().st_size
        print(f"  {name:42s} {dest.stat().st_size // 1024:>4} kB")
        rules.append(block.replace(url, f"/fonts/{name}"))

    header = (
        "/* Self-hosted Source Serif 4 (variable) and Barlow Semi Condensed.\n"
        "   SIL Open Font License 1.1. Latin subset only.\n"
        "   Regenerate with: python3 scripts/fetch_fonts.py */\n\n"
    )
    (WEB_OUT / "fonts.css").write_text(header + "\n".join(rules) + "\n")
    print(f"web: {total // 1024} kB across {len(rules)} files")


def cv():
    CV_OUT.mkdir(parents=True, exist_ok=True)
    for stale in CV_OUT.glob("*.ttf"):
        stale.unlink()
    for family, italic, weight, name in CV_CUTS:
        api = ("https://fonts.googleapis.com/css2?family="
               f"{family.replace(' ', '+')}:ital,wght@{italic},{weight}")
        css = get(api).decode()
        url = re.search(r"url\((https://[^)]+\.ttf)\)", css).group(1)
        dest = CV_OUT / name
        dest.write_bytes(get(url))
        print(f"  cv/fonts/{name:36s} {dest.stat().st_size // 1024:>4} kB")


if __name__ == "__main__":
    web()
    cv()
