# feal-ca.github.io

Personal site — work, writing and photography. Built with
[Astro](https://astro.build), no UI framework, plain CSS with design tokens.
Static output, deployed to GitHub Pages.

Design rules and the reasoning behind them live in [CLAUDE.md](./CLAUDE.md).
Read that before making changes to the layout or palette.

## Everyday edits

Almost everything is data. You should rarely need to touch a layout.

| I want to… | Edit |
| --- | --- |
| Change the "Now" line, links, timeline, skills, awards | `src/data/profile.js` |
| Add a Towards Data Science article | `src/data/writing.js` (newest first) |
| Add or edit a project | a `.md` file in `src/content/projects/` |
| Add a photo | process it (below), then add to `src/data/photos.js` |
| Restyle the whole site | the tokens at the top of `src/styles/global.css` |
| Update the CV | `cv/cv.tex`, then `./cv/build.sh` |

### Adding a project

Create `src/content/projects/my-project.md`:

```markdown
---
title: "What it is"
summary: "One sentence for the card and the page description."
year: 2026
categories: ["HPC", "Physics"]     # 1–3 tags
tier: "standard"                    # or "flagship" for the large treatment
figure: "n-body"                    # basename of an SVG in src/assets/figures
figureAlt: "Describe what the figure shows."
stack: ["C++", "OpenMP"]
featured: false                     # show on the homepage
order: 9                            # lower sorts first
---

Body copy in Markdown. This becomes the project page at /work/my-project/.
```

The frontmatter is validated against a schema in `src/content.config.ts`, so
a typo fails the build rather than shipping a half-empty page.

### Adding a photo

Source files off the camera are 3–5 MB and several carry EXIF rotation.
Always `-auto-orient`, or the gallery shows them sideways:

```bash
magick ~/Pictures/mine.JPG -auto-orient -resize '2400x2400>' -quality 86 -strip \
  src/assets/photography/my-photo.jpg
```

Then add an entry to `src/data/photos.js` with a real `alt` description.
Astro generates the responsive AVIF/WebP variants at build time.

## Generated figures

Each project card carries a schematic SVG rather than a placeholder box.
They are **illustrations, not results** — the project pages say so.

```bash
python3 scripts/make_figures.py     # regenerate src/assets/figures/*.svg
```

They are inlined into the page so their colours follow the light/dark theme.
When you have a real figure for a project, drop it in and delete the
corresponding function from the script.

One run writes both `src/assets/figures/*.svg` for the site and
`cv/figures/*.pdf` for the CV. Rebuild the CV after regenerating, or the two
drift apart. Re-running churns matplotlib's random element IDs in the SVGs
with no visual change; `git checkout -- src/assets/figures/` if that is all
the diff shows.

## The CV

`cv/` holds the LaTeX source for `public/Ferran_Alia_CV.pdf`. It uses the
site's own palette, type and label/content grid, so the two read as one
object.

```bash
./cv/build.sh       # xelatex, then copies both PDFs into public/
```

It writes two: `Ferran_Alia_CV.pdf` on the light theme, for printing and for
sending to people, and `Ferran_Alia_CV_dark.pdf` on the dark one, for reading
on a screen. Same `cv.tex`; the dark cut is built with
`\PassOptionsToPackage{dark}{cvstyle}` on the command line. Do not print the
dark one.

- `cv/cv.tex` is content only. Add an entry, rebuild, commit both.
- `cv/cvstyle.sty` is the print counterpart of `src/styles/global.css`.
  Colours and sizes change there, never in `cv.tex`. Each kind of list has
  its own macro, and the point of having several is that no two sections read
  alike: `\cvitem` for a dated entry, `\cvproject` for one with its
  schematic, `\cvchiprow` for the bordered skill chips, `\cvlistrow` for a
  plain list, `\cvblock` for prose with no date beside it. A section
  boundary is a heavier rule across the full measure; an entry boundary is a
  hairline over the content column only.
- `cv/fonts/` holds static TTF cuts of Newsreader and Inter, plus Roboto Mono
  standing in for the site's `ui-monospace` stack. XeLaTeX cannot read the
  woff2 files in `public/fonts/`, hence the second copy. Regenerate with
  `python3 cv/fetch_cv_fonts.py`.
- `cv/figures/` holds the project schematics as PDF, plus the two wake bands
  behind the masthead and the last page's foot, with `dark/` alongside it
  carrying the same drawings in the dark palette. `scripts/make_figures.py`
  writes both in extra passes with the colours baked in, since a PDF cannot
  resolve `var(--fig-accent)`. Every pass is seeded identically, so the CV
  shows the same n-body run as the site and both themes agree with each
  other.

XeLaTeX is required (`fontspec` loads the TTFs). The facts in `cv.tex` are
the same ones in `src/data/profile.js`, `src/data/writing.js` and
`src/content/projects/`. Change one, change the other.

## Fonts

Self-hosted, not loaded from a CDN. Regenerate with:

```bash
python3 scripts/fetch_fonts.py      # writes public/fonts/
```

## Local development

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # static output into dist/
npm run preview    # serve the built site
```

## Deploying

`.github/workflows/deploy.yml` builds and deploys on every push to `main`.
One-time setup: in **Settings → Pages → Build and deployment → Source**,
choose **GitHub Actions** (not "Deploy from a branch"). The site then goes
live at `https://feal-ca.github.io`.

## Still to do

- Close the three open `TODO(ferran)` markers in
  `src/content/projects/` (`bird-flight.md`, `vortex-pinn.md`,
  `llm-persona.md`) with the missing quantitative results.
- Add repo links to the projects that have public code (`links` in the
  frontmatter).
- Consider a portrait of yourself for the About page.
