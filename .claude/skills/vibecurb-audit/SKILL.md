---
name: vibecurb-audit
description: Run a VibeCurb-style design audit on this site (Audit -> Extract -> Prescribe -> Verify), adapted to this project's own design system in CLAUDE.md instead of generic Bootstrap-teardown fixes. Use when the user wants a fresh, structured pass to find real polish opportunities, not a fake-premium reskin.
---

# VibeCurb Audit, adapted to this project

This skill borrows VibeCurb's audit discipline (see `upstream-visual-redesign.md`
in this folder for the original) but drops its prescriptions. The upstream
skill assumes it is rescuing an undesigned Bootstrap/Tailwind-default
codebase: swap in a display font, warm off-white background, grain texture,
pill buttons, generic motion curves. None of that applies here. This site
already has a considered, documented design system in `/CLAUDE.md`:
locked accent palette and type ramp in `global.css`, a specific three-family
type system, a banner-and-column layout rhythm, a strict two-visual-languages
rule, an accessibility bar (WCAG 2.2 AA), a performance budget on the inlined
SVG figures, and a prose voice guide.

**The rule this skill exists to enforce: propose nothing that contradicts
`/CLAUDE.md`.** If a fix requires a new accent color, a new font family, a
generic "Awwwards" texture, or breaks the performance/accessibility budget,
it is out of scope, no matter how much it would help elsewhere.

## Before starting

Read, in order:
1. `/CLAUDE.md` in full, especially "Design principles" and "Voice."
2. `src/styles/global.css` for the actual token values (colors, `--step-*`
   type scale, spacing).
3. `src/layouts/Layout.astro` and two or three representative pages
   (homepage, one project page, `/photography`) to see the system in use.

Do not read the upstream VibeCurb prescriptions as things to apply. They are
reference only, for the *shape* of an audit table and the *kind* of crime to
look for (inconsistent spacing, dead hover states, cramped padding, weak
hierarchy), not for the specific hex codes, fonts, or textures it proposes.

## Audit layers

Walk the same seven layers VibeCurb uses, but each check is "is this
consistent with and fully executed per CLAUDE.md," not "does this match a
generic premium template":

1. **Tokens** - are `global.css` custom properties actually used everywhere,
   or do any components hardcode a color/px value that drifts from them?
2. **Typography** - does every heading/body/mono use pulls from the defined
   `--step-*` ramp? Any hardcoded `font-size` in px? Measure over ~68ch
   anywhere prose runs wider?
3. **Spacing** - is the banner/two-column rhythm consistent page to page? Any
   section with cramped or inconsistent padding relative to its siblings?
4. **Color/contrast** - spot-check text/background pairs in both themes
   against 4.5:1 (3:1 for 24px+). Flag anything close to the line.
5. **Components** - do buttons, cards, nav links have real hover/focus
   states? Is `:focus-visible` present and visible on every interactive
   element?
6. **The two-visual-languages rule** - anywhere a technical figure and a
   photograph could be read as sharing a section or grid?
7. **Motion** - are transitions gated behind `prefers-reduced-motion`? Is
   the lightbox keyboard-operable, focus-trapped, focus-returning?

## Output

Produce a punch list, not a rewrite. For each finding: what's inconsistent,
where (file:line), which CLAUDE.md principle it violates or falls short of,
and a proposed fix stated in terms of *this site's* existing tokens (e.g.
"use `var(--space-section)` instead of the hardcoded `4rem`"), never a new
palette or font. Rank by how visible the inconsistency is to a 30-second
homepage visitor first, then by how many pages it recurs on.

Do not write code until the user picks which findings to act on.
