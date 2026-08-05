# Agent instructions

The full guidance for this project — design principles, accessibility and
performance requirements, structure, and how to add content — is in
[CLAUDE.md](./CLAUDE.md). Read it before changing anything.

Quick reference:

```
astro dev --background     # dev server (stop / status / logs to manage it)
npm run build              # static build into dist/
python3 scripts/make_figures.py   # regenerate project figures
python3 scripts/fetch_fonts.py    # re-download self-hosted fonts
```

Three rules that are easy to get wrong here:

1. Photography and technical figures never share a grid or a section.
2. Photos are imported from `src/assets/` and rendered with `astro:assets` —
   never referenced from `public/`, and always `-auto-orient` when processing.
3. Nothing goes on a page unless it is true. Unverified details get a
   `TODO(ferran):` comment in the source, not a plausible guess on the page.
