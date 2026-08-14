// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// `site` is the single source of truth for the domain. It builds the canonical
// tags, the sitemap and the absolute og:image URLs, and scripts/make_og.py
// reads it back out of this file for the footer on the share cards. Changing
// it here is enough; rerun `python3 scripts/make_og.py` afterwards.
export default defineConfig({
  site: 'https://feal-ca.github.io',
  integrations: [sitemap()],
});
