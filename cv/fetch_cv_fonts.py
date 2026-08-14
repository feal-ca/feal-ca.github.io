#!/usr/bin/env python3
"""Download the TTFs the CV needs into cv/fonts/, subset to latin.

The site's webfonts are woff2, which XeLaTeX cannot read, so the CV keeps its
own copy of the same families as static TTF instances. Same reasoning as
scripts/fetch_fonts.py: run once, commit the output.

Newsreader and Inter are the site's display and body faces. Roboto Mono
stands in for the site's `ui-monospace` stack, which resolves to a different
face on every machine and so cannot be pinned inside a PDF.

    python3 cv/fetch_cv_fonts.py
"""

import pathlib
import re
import subprocess
import sys
import urllib.request

# The API serves woff2 to modern browsers and .eot to ancient ones. This old
# Android string is the one that gets plain static TTFs, which is what
# XeLaTeX can actually open.
UA = ("Mozilla/5.0 (Linux; U; Android 2.2; en-us; DROID2 GLOBAL "
      "Build/S273) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 "
      "Mobile Safari/533.1")

# (output stem, css2 family spec). One request per instance: the static-TTF
# endpoint returns a single face per request and silently drops the rest.
INSTANCES = [
    ("Newsreader-Regular", "Newsreader:ital,opsz,wght@0,6..72,400"),
    ("Newsreader-Medium",  "Newsreader:ital,opsz,wght@0,6..72,500"),
    ("Newsreader-Italic",  "Newsreader:ital,opsz,wght@1,6..72,400"),
    ("Inter-Regular",      "Inter:ital,wght@0,400"),
    ("Inter-Medium",       "Inter:ital,wght@0,500"),
    ("Inter-SemiBold",     "Inter:ital,wght@0,600"),
    ("Inter-Italic",       "Inter:ital,wght@1,400"),
    ("RobotoMono-Regular", "Roboto+Mono:wght@400"),
    ("RobotoMono-Medium",  "Roboto+Mono:wght@500"),
]

# Latin plus Latin Extended A/B, punctuation, currency, arrows, maths, Greek.
# Wide enough for Catalan, Spanish, "Kármán", "τ", "×", "≈" and "200M€".
UNICODES = ("U+0000-024F,U+0370-03FF,U+2000-206F,U+20A0-20BF,"
            "U+2190-21FF,U+2200-22FF,U+25A0-25FF")

FEATURES = "kern,liga,calt,onum,tnum,lnum,frac,sups"

OUT = pathlib.Path(__file__).resolve().parent / "fonts"


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    total = 0

    for stem, spec in INSTANCES:
        req = urllib.request.Request(
            f"https://fonts.googleapis.com/css2?family={spec}",
            headers={"User-Agent": UA})
        css = urllib.request.urlopen(req).read().decode()
        match = re.search(r"url\((https://[^)]+\.ttf)\)", css)
        if not match:
            print(f"  !! no TTF served for {spec}", file=sys.stderr)
            return 1

        raw = OUT / f"{stem}.raw.ttf"
        dest = OUT / f"{stem}.ttf"
        urllib.request.urlretrieve(match.group(1), raw)
        subprocess.run(
            ["pyftsubset", str(raw), f"--unicodes={UNICODES}",
             f"--layout-features={FEATURES}", f"--output-file={dest}"],
            check=True)
        raw.unlink()
        total += dest.stat().st_size
        print(f"  {dest.name:22s} {dest.stat().st_size // 1024:>4} kB")

    print(f"total {total // 1024} kB across {len(INSTANCES)} files")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
