#!/usr/bin/env python3
"""Measure the rhythm of the site's prose.

The phrase-level tells of machine-written text are greppable (see CLAUDE.md
§9). Uniformity is not. A set of pages can pass every word-level check and
still read as generated because every page has the same shape and every
sentence is the same length.

This prints paragraph counts, paragraph lengths and sentence-length spread so
that shape is visible across all pages at once. There is no pass/fail: read
the columns and look for a template repeating down the page.

    python3 scripts/prose_stats.py
"""

import glob
import pathlib
import re
import statistics

PROJECTS = "src/content/projects/*.md"


def body_of(path: pathlib.Path) -> str:
    """Strip YAML frontmatter, which is metadata rather than prose."""
    text = path.read_text()
    return text.split("---", 2)[2] if text.startswith("---") else text


def paragraphs(body: str) -> list[str]:
    # Bullet blocks are structural, not prose paragraphs.
    return [
        p.strip()
        for p in body.strip().split("\n\n")
        if p.strip() and not p.lstrip().startswith(("-", "<!--", "|"))
    ]


def sentences(body: str) -> list[str]:
    flat = re.sub(r"\s+", " ", body)
    # Don't split on the dot in "0.78", "τ = 0.55" or "Re ≈ 96."
    parts = re.split(r"(?<=[.!?])\s+(?=[A-Z\"'])", flat)
    return [s for s in parts if len(s.split()) > 2]


def main() -> None:
    rows = []
    for path in sorted(pathlib.Path().glob(PROJECTS)):
        body = body_of(path)
        paras = [len(p.split()) for p in paragraphs(body)]
        sent = [len(s.split()) for s in sentences(body)]
        rows.append((path.stem, paras, sent))

    print(f"{'page':<22}{'paras':>6}{'paragraph words':>26}{'sent sd':>9}{'range':>10}")
    print("-" * 73)
    for name, paras, sent in rows:
        sd = statistics.pstdev(sent) if len(sent) > 1 else 0.0
        rng = f"{min(sent)}-{max(sent)}" if sent else "-"
        print(f"{name:<22}{len(paras):>6}{str(paras):>26}{sd:>9.1f}{rng:>10}")

    opens = [p[0] for _, p, _ in rows if p]
    counts = [len(p) for _, p, _ in rows]
    print()
    print(f"opening paragraph lengths : {sorted(opens)}")
    print(f"paragraph counts per page : {sorted(counts)}")
    print()
    print("Look for: opening lengths clustered in a narrow band, every page")
    print("with the same paragraph count, or a sentence sd under ~5 (which")
    print("means every sentence is nearly the same length).")


if __name__ == "__main__":
    main()
