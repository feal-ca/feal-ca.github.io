# georgiou1226.github.io

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
| Replace the CV | `public/Ferran_Alia_CV.pdf` |

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
live at `https://georgiou1226.github.io`.

## Still to do

- `src/data/profile.js` — fill in the group and description for the TU
  Dresden internship (marked `TODO(ferran)`).
- `src/data/photos.js` — add locations if you want them shown; they were
  deliberately left out rather than guessed.
- Add repo links to the projects that have public code (`links` in the
  frontmatter).
- Consider a portrait of yourself for the About page.
