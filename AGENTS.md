# AGENTS.md

Guidance for AI coding agents working in this repository.

## What this repo is

"Jiakai 的观影记录" — a personal movie/TV watch journal with a dark, cinematic
UI (Chinese-language). Pure static output, no adapter, no backend. Data is
Markdown frontmatter entered by hand from Douban; there is no external API.
Deploys automatically on push to `main`, live at https://media.gujiakai.top
(`site` in astro.config.mjs). Stack: Astro ^7.0.6 (content collections),
Tailwind CSS 4 via `@tailwindcss/vite`, TypeScript (strict), vanilla
client-side JS for search/filter/sort. Package manager is
pnpm (pnpm-lock.yaml); Node >= 22.12.0 (`engines`).

## File map

- `astro.config.mjs` — site URL, responsive-image domains, Tailwind vite plugin
- `src/content.config.ts` — strict Zod schema for the `movies` collection
- `src/lib/movie-schema.ts` — testable movie-entry schema used by the content
  collection
- `src/lib/watch-date.ts` — strict Shanghai watch-date parsing, formatting,
  future-limit, and year helpers
- `src/content/movies/movie-<n>.md` — one entry per watched title (data lives
  here; frontmatter only, no body)
- `src/lib/movies.ts` — loads the collection, view-model mapping, year
  grouping/stats (`getViewingData`, `moviesForYear`, `statsForYear`)
- `src/pages/index.astro` — homepage, mirrors the newest year
- `src/pages/[year].astro` — one static page per year via `getStaticPaths`
- `src/pages/sitemap.xml.ts` — canonical-only sitemap derived from public years
- `src/pages/404.astro` — standalone (does not use Layout), `noindex`
- `src/components/YearView.astro` — shared page body for index and [year]
- `src/components/MovieGrid.astro` — card grid + all interactive client JS
  (search, rating filter, sort, poster lazy-load fade-in)
- `src/components/MovieCard.astro` — one poster card; sets the `data-*`
  attributes the grid script reads, renders the half-star rating
- `src/components/Toolbar.astro` — the controls MovieGrid's script reads by
  id (`mg-search`, `mg-sort`, `mg-rating`, `mg-count`)
- `src/components/Hero.astro`, `Navigation.astro`, `Footer.astro` — header
  stats, year-switcher links, footer; server-only, no scripts
- `src/layouts/Layout.astro` — head/SEO/OG tags and inline script that sets the
  `js` class before paint
- `src/styles/global.css` — Tailwind v4 `@theme` tokens (ink palette, glow
  shadow, CJK font stack), skeleton/poster animations
- `public/robots.txt` — points at `/sitemap.xml`

## Commands

From package.json scripts (use pnpm):

- `pnpm install` — install dependencies (no node_modules is checked out)
- `pnpm dev` — dev server at localhost:4321
- `pnpm build` — production build to `./dist/`
- `pnpm check` — `astro check` type-checks .astro files
- `pnpm lint` — ESLint checks TypeScript and Astro source
- `pnpm test` — Vitest regression suite
- `pnpm preview` — serve the production build locally

Focused unit tests live in `tests/`.

## Architecture & conventions

- Data flow: `content.config.ts` schema → `getViewingData()` (filters
  `isPublic`, sorts newest-first, derives years + per-year counts) →
  `YearView` → `MovieGrid`/`MovieCard`. Both pages render the same
  `YearView`; keep index and [year] in lockstep.
- Interactive client JS lives only in MovieGrid's `<script>` (Layout's tiny
  inline script just sets the `js` class); it reads state from card `data-*`
  attributes (`data-title`, `data-rating`, `data-date`) and the Toolbar's
  element ids. New interactive features should follow this pattern rather
  than adding a framework.
- Progressive enhancement: `Layout` sets `html.js` before paint; controls
  marked `[data-js-only]` are hidden without JS, posters stay visible.
- The search is IME-aware (composition events), debounced, and NFKC-folds
  titles; preserve this when touching it.
- Ratings use the Douban half-star scale; MovieCard renders true half stars.
- UI text is Chinese; English phrases get `lang="en"`.

## Validation

1. `pnpm lint` and `pnpm test` — catch static issues and focused regressions.
2. `pnpm check` — catches type errors in .astro/.ts.
3. `pnpm build` — content-schema violations fail the build (this is the data
   test suite); sitemap and static year pages are generated here.
4. `pnpm preview` and eyeball a year page: search, rating filter, sort, and
   the poster fade-in should all still work, and degrade sanely with JS off.

## Gotchas

- The schema used by `src/content.config.ts` is deliberately strict: unknown
  keys are rejected (`.strict()`), titles are trimmed and cannot be blank,
  `status` can only be `"看过"`, `date` must match
  `"YYYY-MM-DD[ HH:mm:ss]"` and must not be over 24 hours in the future, `url`
  must be a Douban subject link, `cover` must be https, and `year` (optional)
  must equal the Shanghai year in `date`.
- Watch dates are interpreted, formatted, and grouped in `Asia/Shanghai`, not
  the build machine timezone. Use the helpers in `src/lib/watch-date.ts`; do
  not use the built-in string parser or local `Date#getFullYear()` for them.
- Set optional `reviewLang: "en"` or `reviewLang: "es"` when the entire review
  uses that language so assistive technology can select the correct voice.
  Do not loosen it — failing the build is the intended behavior.
- Quote `date` in frontmatter YAML. Unquoted it parses as a YAML timestamp
  (a Date, not a string), fails the schema's `z.string()`, and the build
  errors.
- Poster sources are remote, but Astro downloads and emits responsive local
  variants during the static build. Authorize any new source host in
  `astro.config.mjs`; a cold build requires those sources to be reachable.
- The homepage duplicates the newest year's page on purpose; both
  canonicalize to `/` (see `canonicalPath` in YearView). Don't "fix" this.
- `package.json` name is `movie-website`, not movie-tracker.
- `entry.data.date` is a `Date` (transformed by the schema), not a string.
- `astro check` needs generated types (`.astro/` is gitignored); run it after
  install — it syncs content types itself, but a fresh clone must have run
  `pnpm install` first.
