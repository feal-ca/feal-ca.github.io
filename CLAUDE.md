# Ferran Alía — personal site

Astro 7, zero UI frameworks, plain CSS with design tokens. Static output,
deployed to GitHub Pages at `https://georgiou1226.github.io`.

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and
`astro dev logs`. Build with `npm run build`, preview with `npm run preview`.

---

## What this site is for

A portfolio serving three overlapping audiences at once — industry
recruiters, research groups (PhD/Master's admissions), and readers arriving
from Towards Data Science. Design decisions resolve in that order when they
conflict, but nothing should read as aimed at only one of them.

Assume a visitor gives the homepage **30 seconds**. In that window they must
learn: who he is, what he works on, that he writes publicly, and where to go
next. Everything else is a second-click concern.

---

## Design principles

These are the rules the current design follows. Follow them when extending it.

### 1. Content before decoration

Every visual element must carry information. The previous version of this site
used empty grey boxes as project "images" — placeholders read as broken, not
as restraint. If there is no real figure for a project, use the generated
schematic (see *Project figures* below) or no image at all. Never ship an
empty frame.

### 2. Two visual languages, kept apart

The site mixes technical figures (flow fields, particle plots, benchmark
charts) with travel photography. These must never sit in the same grid or
share a section — they compete and both lose.

- **Technical figures** live in `/work`, on project pages, and in the
  homepage hero. Palette-locked to the site accent colours, flat, diagrammatic.
- **Photography** lives on `/photography`, in the single homepage banner that
  links to it, and in the `/about` portrait band. Full-bleed or near-full-bleed,
  never cropped into small cards, never adjacent to a plot.

The seam between them is always a full-width section break, never a column gap.

### 3. Banner-and-column rhythm

The page structure alternates deliberately:

```
full-bleed banner  →  two-column content  →  full-bleed banner  →  ...
```

Two-column sections use an asymmetric grid (label column + content column) so
the eye has a fixed left edge to return to. The label column carries dates,
categories, and index numbers in mono type; the content column carries prose.
Collapse to a single column below 720px.

### 4. Typography

- Display/headings: a serif with real optical sizing. Body: a clean sans.
  Metadata, dates, categories, figures: mono. Three families, no more.
- Type scale is a defined ramp in `global.css` (`--step--1` … `--step-5`),
  fluid via `clamp()`. Do not hardcode `font-size` in px in components.
- Body line-height 1.6–1.7; headings 1.1–1.25. Measure capped at ~68ch for
  prose — long unbroken lines are the single most common failure on personal
  academic sites.

### 5. Accessibility is a build requirement, not a polish pass

Target **WCAG 2.2 AA**, and prefer to exceed it.

- All text ≥ 4.5:1 against its background (≥ 3:1 for text ≥ 24px). Both
  themes. Check before committing a colour change.
- Every image needs a real `alt`. Decorative banners get `alt=""` plus
  `role="presentation"`; never leave a meaningful photo undescribed.
- Visible `:focus-visible` ring on every interactive element. Never remove
  outlines without replacing them.
- Honour `prefers-reduced-motion` — all transitions and any parallax or
  reveal effect must be gated behind it.
- The lightbox must be keyboard-operable (Esc, arrows), trap focus while
  open, and return focus to the trigger on close.
- Semantic landmarks: one `<h1>` per page, `<nav>`/`<main>/`<footer>`, skip
  link before the nav.

### 6. Performance

Source photos are 3–5 MB straight off the camera. They must never reach a
browser at that size.

- Always import photos from `src/assets/` and render through `astro:assets`
  (`<Image>` / `<Picture>`), never from `public/`. This gives content-hashed,
  responsive, AVIF/WebP output for free.
- Set `widths` and `sizes` on every image so the browser downloads the right
  variant. Get `loading="eager"` + `fetchpriority="high"` on the hero image
  only; everything else is `loading="lazy"` with explicit dimensions to
  prevent layout shift.
- No client-side JS unless it earns its place. Right now only the lightbox
  and the theme toggle ship JS, both as small inline modules.
- No webfont CDN. Fonts are self-hosted and preloaded (176 kB of variable
  woff2, latin subset only).
- The project figures are inlined SVG, which is what lets them follow the
  theme — but it puts their bytes in the HTML. The homepage carries six of
  them: ~396 kB raw, ~69 kB brotli, and zero extra requests. That is the
  ceiling. If a new figure pushes it further, cut vertices in
  `scripts/make_figures.py` (decimate polylines, coarsen contour grids,
  round to 1 decimal) rather than accepting the weight.

Measure before and after any change here:

```
npm run build && brotli -q 11 -c dist/index.html | wc -c
```

### 7. Honesty

This is a real person's public record. Nothing goes on a page unless it is
true and sourced from the CV, the TDS profile, or something the user stated
directly.

- Never invent a job title, date, institution, metric, or result.
- The generated project figures are **schematic illustrations**, not results.
  Never caption one as if it were output from the project. When a real figure
  exists, swap it in.
- Anything unverified gets a `TODO(ferran):` comment in the source rather
  than a plausible-sounding guess on the page.

### 8. Ageing well

Out-of-date personal sites are the norm and they are worse than no site.
Structure so updates are cheap:

- All content lives in `src/content/` and `src/data/`. Adding a project or an
  article means adding one file or one array entry, never touching a layout.
- Dates in data files are ISO strings; formatting happens at render.
- The "now" line on the homepage is a single field in `src/data/profile.js`.

### 9. Voice

The prose is Ferran's, in American English, and it should read like a person
wrote it rather than a model.

**No em-dashes. Anywhere.** Not in page copy, not in `alt` text, not in
frontmatter, not in code comments. The em-dash is the single clearest tell of
machine-written prose, and a page full of them reads as generated no matter
how good the content is. There is always a better option:

| Instead of an em-dash | Use |
| --- | --- |
| Introducing a list or an explanation | a colon |
| A parenthetical aside | commas, or real parentheses |
| Two joined independent clauses | a semicolon, or two sentences |
| A pivot (`… fast — but it's memory-bound`) | full stop, then `But …` |

Splitting into two sentences is usually the best of these, because the habit
the em-dash encourages is one long breathless clause. En-dashes in numeric
ranges (`2022–2023`) are fine; they are typography, not punctuation.

#### Banned constructions

These are the documented tells of machine-written prose. They are banned here
whether or not a human could have written them, because on a page whose whole
job is to sound like one person, the suspicion costs more than the phrasing
gains.

- **Negative parallelism.** "Not just X, but Y." "It isn't a mirror, it's a
  portal." "A PINN doesn't only fit data, it carries the equations." Say the
  positive thing and stop.
- **Copula avoidance.** "serves as", "stands as", "functions as",
  "represents", "marks a". Use *is*.
- **Participial closers.** A sentence ending in a trailing `-ing` clause:
  "…on a shared cluster, underscoring the scheduling problem." Cut it or make
  it its own sentence.
- **The rule of three.** Tidy triplets ("efficient, scalable and reliable")
  manufacture false comprehensiveness. Two items, or four, or a real list.
- **Significance-claiming.** "testament to", "pivotal", "crucial",
  "underscores", "highlights", "marks a turning point". Show the result and
  let the reader decide it matters.
- **Meta-commentary.** "Worth noting that", "It's important to say",
  "The point is". If it's worth saying, just say it.
- **Trailing aphorism clauses.** ", which is the correct outcome when…",
  ", which turns out to matter more than…". A neat moral on the end of every
  paragraph is the most recognizable rhythm of generated text.
- **AI vocabulary.** delve, tapestry, realm, landscape, testament,
  underscore, pivotal, intricate, meticulous, robust, seamless, leverage,
  harness, unlock, elevate, foster, showcase, crucial, vibrant, compelling,
  multifaceted, "in today's fast-paced…".
- **Filler intensifiers.** "actually", "genuinely", "considerably",
  "remarkably", "truly". Almost always deletable with no loss. (The one
  exception on this site is the real TDS article title *What It Actually
  Takes…*, which does not get edited.)

#### Rhythm

The subtlest tell is not a phrase, it is uniformity, and it is invisible when
you read one page at a time. Read all eight project pages in a row instead.

Every page having the same skeleton (short setup, long middle, tidy 20-word
coda) reads as generated even when every individual sentence is fine. So does
every sentence landing between 17 and 28 words. Vary both **across files**,
not just within one:

- Paragraph counts should differ. Two paragraphs is a legitimate page.
- Vary where the short paragraph sits. Not always last.
- Vary the entry point. Some pages open on the result, some on the problem,
  some on a question, some on a plain fact.
- Put short sentences next to long ones. "The geometry is a bird's wing."
- Don't bold more than two or three things per page.

#### Everything else

- Use contractions. "doesn't", "isn't", "I'm".
- Lead with the result, not the method. A project page that explains what a
  PINN is before saying what happened is written for the wrong reader.
- State numbers. "33× on 112 threads" beats "scales well".
- No confessional first person. "I spent two weeks stuck on…" is out;
  "I modeled the wing in Blender" is fine.

Check before committing:

```
grep -rn "—" src/                                    # must return nothing
grep -rniE "not just|not only|serves as|stands as|testament|delve|underscore|pivotal|worth noting|genuinely|considerably" src/content src/data src/pages
```

The second command is a prompt to reread, not an absolute ban on every hit.
Then measure the rhythm, which is the part greps miss:

```
python3 scripts/prose_stats.py     # paragraph and sentence-length spread
```

---

## Structure

```
src/
  content/
    projects/*.md      one file per project; frontmatter + optional long-form body
    config.ts          collection schemas (zod) — the source of truth for fields
  data/
    profile.js         name, current status, links, timeline, skills
    writing.js         Towards Data Science articles
    photos.js          photo metadata; images imported from src/assets/photography
  assets/
    photography/       processed photos (auto-oriented, max 2400px) — NOT public/
    figures/           generated project figures (SVG)
  components/          presentational only, no data fetching
  layouts/Layout.astro shared shell: skip link, nav, footer, meta, JSON-LD
  pages/               routes
  styles/global.css    design tokens + resets + shared primitives
public/
  cv.pdf               downloadable CV
```

### Adding things

- **A project** → new `.md` in `src/content/projects/`. Frontmatter is
  validated by the zod schema in `src/content/config.ts`; the build fails
  loudly on a bad field, which is intended.
- **A TDS article** → prepend an entry to the array in `src/data/writing.js`.
  Newest first.
- **Photos** → run the processing step (below), then add an entry to
  `src/data/photos.js`.

### Processing new photos

Source photos carry EXIF orientation tags — several are stored landscape but
display portrait. **Always `-auto-orient` before resizing**, or the gallery
will show sideways images and the aspect ratios in `photos.js` will be wrong.

```
magick input.JPG -auto-orient -resize 2400x2400\> -quality 88 src/assets/photography/name.jpg
```

## Documentation

Full documentation: https://docs.astro.build

- [Images and `astro:assets`](https://docs.astro.build/en/guides/images/)
- [Content collections](https://docs.astro.build/en/guides/content-collections/)
- [Routing and dynamic routes](https://docs.astro.build/en/guides/routing/)
- [Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Styling](https://docs.astro.build/en/guides/styling/)
