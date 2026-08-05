#!/usr/bin/env python3
"""Download the site's webfonts into public/fonts/ and write fonts.css.

The site does not load fonts from a CDN — see CLAUDE.md, "Performance". Run
this once; the output is committed. Both families are SIL Open Font License
1.1, which permits redistribution.

Two things matter here:

- Request the weights as a *range* (`400..600`). Asking for discrete weights
  makes the API return one static instance per weight, which came to 1 MB;
  the range returns a single variable file per family.
- Take the `latin` subset only. The site's content is English, Catalan and
  Spanish, all of which fit in it.

    python3 scripts/fetch_fonts.py
"""

import pathlib
import re
import urllib.request

API = (
    "https://fonts.googleapis.com/css2"
    "?family=Newsreader:opsz,wght@6..72,400..600"
    "&family=Inter:wght@400..600"
    "&display=swap"
)
# The API serves woff2 variable fonts only to browsers it recognises.
UA = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

OUT = pathlib.Path(__file__).resolve().parent.parent / "public" / "fonts"


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for stale in OUT.glob("*.woff2"):
        stale.unlink()

    req = urllib.request.Request(API, headers={"User-Agent": UA})
    css = urllib.request.urlopen(req).read().decode()

    rules, total = [], 0
    for subset, block in re.findall(r"/\* ([\w-]+) \*/\s*(@font-face \{.*?\})", css, re.DOTALL):
        if subset != "latin":
            continue
        family = re.search(r"font-family: '([^']+)'", block).group(1)
        url = re.search(r"url\((https://[^)]+)\)", block).group(1)
        name = f"{family.lower()}-var.woff2"
        dest = OUT / name
        urllib.request.urlretrieve(url, dest)
        total += dest.stat().st_size
        print(f"  {name:26s} {dest.stat().st_size // 1024:>4} kB")
        rules.append(block.replace(url, f"/fonts/{name}"))

    header = (
        "/* Self-hosted variable subsets of Newsreader and Inter.\n"
        "   SIL Open Font License 1.1. Latin subset only.\n"
        "   Regenerate with: python3 scripts/fetch_fonts.py */\n\n"
    )
    (OUT / "fonts.css").write_text(header + "\n".join(rules) + "\n")
    print(f"total {total // 1024} kB across {len(rules)} files")


if __name__ == "__main__":
    main()
