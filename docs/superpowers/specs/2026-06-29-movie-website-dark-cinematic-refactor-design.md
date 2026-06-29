# Movie Website — Dark Cinematic Refactor & Package Upgrade

- **Date:** 2026-06-29
- **Author:** Jiakai (with Claude Code)
- **Status:** Approved to implement
- **Project:** `movie-website` — a personal viewing log (movies & TV) built with Astro + Tailwind v4

---

## 1. Goal

Refactor the existing viewing-log site to be more aesthetically pleasing, keep a strong
responsive layout, implement smooth lazy image loading (no all-at-once decode stutter), and
upgrade all packages to their latest versions following current official techniques.

This is a visual + structural refresh of an existing, working static site — not a rewrite.
Existing content (49 markdown entries) and the year-based navigation model are preserved.

## 2. Current State

- **Stack:** Astro `5.16.11`, Tailwind CSS `4.1.18` via `@tailwindcss/vite`, pnpm, Node `22.17.1`.
- **Content:** 49 markdown files in `src/content/movies/`, frontmatter fields:
  `title, date, rating (1–5), status ("看过"), review, url, type ("movie"), year, isPublic, cover`.
  All entries are currently `type: "movie"`, `status: "看过"`, `isPublic: true`. Covers are
  remote images on `cdn.sa.net` (`.webp`).
- **Pages:** `index.astro` (latest year) and `[year].astro` (per-year). Both duplicate the
  same year/count/query logic.
- **Components:** `Layout`, `Navigation` (year pills), `MovieCard`, `Footer`.
- **Known issues to fix while here:**
  1. `@astrojs/tailwind@6.0.2` is an unused/deprecated dependency (not referenced in
     `astro.config.mjs`; Tailwind v4 uses the Vite plugin).
  2. `src/styles/global.css` mixes Tailwind v4 (`@import "tailwindcss"`) with redundant v3
     directives (`@tailwind base/components/utilities`).
  3. No content collection config — `getCollection('movies')` relies on legacy implicit
     collections, which are **removed in Astro v6**. This will break the upgrade unless fixed.
  4. Query logic duplicated across `index.astro` and `[year].astro`.
  5. `MovieCard` has `loading="lazy"` but no placeholder, no `decoding`, and no fade-in, so a
     fast scroll can still stutter and there's no graceful loading state.

## 3. Decisions (from brainstorming)

| Topic | Decision |
|---|---|
| **Theme** | Dark cinematic — deep slate background, poster-forward, glassy cards, amber stars (Letterboxd/Plex feel) |
| **Scope** | Polish **+ light features**: a stats band (count, average rating, this-year count) and client-side search + sort + rating filter, on the existing pages |
| **Lazy loading** | Skeleton shimmer placeholder + smooth fade-in, native `loading="lazy"` + `decoding="async"`, fixed aspect ratio (zero layout shift) |

## 4. Package Upgrade Plan

Researched against official Astro/Tailwind docs and the v6 + v7 upgrade guides.

| Package | From | To | Action |
|---|---|---|---|
| `astro` | 5.16.11 | **7.0.3** | Upgrade (major, through v6 + v7) |
| `tailwindcss` | 4.1.18 | 4.3.1 | Upgrade (minor) |
| `@tailwindcss/vite` | 4.1.18 | 4.3.1 | Upgrade (minor) |
| `@astrojs/tailwind` | 6.0.2 | — | **Remove** (dead/deprecated under Tailwind v4) |

**Breaking changes that affect this project (and how we handle them):**

1. **Legacy content collections removed (v6).** *Mandatory:* create `src/content.config.ts`
   using the Content Layer API (`glob()` loader + Zod schema). Queries stay on `getCollection`,
   entry id replaces slug (we don't use slugs). This is required for the build to pass.
2. **Zod 4 (v6).** Author the schema with current syntax (`z.coerce.date()`, etc.).
3. **Rust compiler strictness (v7).** All non-void tags must be closed and inline-element
   spacing is JSX-style. Audit every `.astro` template; ensure star-rating / inline spans keep
   intended spacing. (Current files look clean; verified during implementation.)
4. **Vite 8 (v7).** No custom Vite plugins beyond `@tailwindcss/vite`, which supports it — no action.

**Non-issues for this project (confirmed):** Node floor ≥22.12 already met (22.17.1); no
`@astrojs/db`; no `astro:transitions` internals; not using Astro `<Image>` today (decision in §7);
no `import.meta.env` coercion reliance; no `src/fetch.ts`.

## 5. Visual Design System

**Palette (dark):**
- Background: deep slate gradient (e.g. `#0b0f1a` → `#0f172a`), subtle.
- Surface/cards: translucent slate with a faint top highlight and 1px ring (`white/5–10`).
- Text: near-white primary, muted slate-400 for secondary.
- Accent: indigo/violet for interactive (active pill, focus rings, hover title).
- Rating: amber (`#f59e0b`) stars.

Tokens defined in `global.css` via a Tailwind v4 `@theme` block so they're usable as utilities.

**Typography:** system UI stack (good CJK rendering on macOS/Windows), tighter heading tracking,
clear hierarchy. Title gets a soft gradient + glow.

**Motion:** subtle, fast (150–300ms), respects `prefers-reduced-motion`. Hover lift + glow on
cards; poster zoom on hover; fade-in on image load.

## 6. Component Architecture

```
src/
  content.config.ts        # NEW — collection schema (glob loader + Zod)
  lib/movies.ts            # NEW — shared helpers (queries, years, counts, stats, view-model)
  layouts/Layout.astro     # REFRESH — dark theme, meta, fonts, header/hero + stats slot
  components/
    Hero.astro             # NEW (or inline) — title + stats band
    Navigation.astro       # REFRESH — glassy year pills, glowing active
    Toolbar.astro          # NEW — search + sort + rating filter (progressive enhancement)
    MovieCard.astro        # REDESIGN — poster-forward card, skeleton + fade-in
    MovieGrid.astro        # NEW (optional) — grid wrapper + empty state
    Footer.astro           # REFRESH
  pages/
    index.astro            # SLIM — uses lib/movies.ts
    [year].astro           # SLIM — uses lib/movies.ts
  styles/global.css        # CLEAN — @import "tailwindcss" + @theme tokens + keyframes
  scripts/
    gallery.ts             # NEW — client-side search/sort/filter + image fade-in observer
```

Each unit has one purpose and a clear interface:
- `lib/movies.ts`: pure data — given the collection, returns sorted view-models, the year list,
  per-year counts, and aggregate stats. No DOM, testable in isolation.
- `MovieCard.astro`: presents one entry; props are a flat view-model. Knows nothing about pages.
- `gallery.ts`: the only client JS; owns search/sort/filter + fade-in. Degrades gracefully
  (no JS → full grid still renders and is readable).

## 7. Data Flow & Image Handling

- Build-time: pages call `lib/movies.ts` which calls `getCollection('movies')`, filters by year,
  sorts by date desc, maps to a flat view-model, and computes stats. Static output, no runtime fetch.
- **Images:** keep raw `<img>` with the remote `cdn.sa.net` URLs (we do **not** adopt Astro
  `<Image>`/`<Picture>` because the covers are remote and we want zero build-time fetching and to
  keep the upgrade low-risk). Smoothness comes from: fixed `aspect-[2/3]` wrapper (no layout
  shift), shimmer skeleton behind, `loading="lazy"`, `decoding="async"`, and a fade+scale-in on
  the `load` event (via `gallery.ts`, with a CSS fallback so it works even before JS runs).

## 8. Client-Side Features (light)

All client-side, no framework, progressive enhancement in `gallery.ts`:
- **Search:** filters visible cards by title substring (case-insensitive).
- **Sort:** date (newest, default) / rating (high→low).
- **Filter:** minimum rating (All / 3+ / 4+ / 5).
- Live result count; an empty-state message when nothing matches.
- Cards carry `data-title`, `data-rating`, `data-date` for the script to read.

## 9. Stats Band

Computed in `lib/movies.ts` for the active year: total films, average rating (1 decimal), and a
small visual (e.g. star average). Shown under the title. Cheap, static, no extra data.

## 10. Responsive Strategy

- Mobile-first. Grid: `grid-cols-2` (phone) → `sm:3 → lg:4 → xl:5 → 2xl:6`, fluid gaps.
- Year nav and toolbar wrap/scroll on small screens; touch targets ≥40px.
- Hero/stats stack on mobile, inline on desktop.
- Verified at 375 / 768 / 1280 / 1536 px via real screenshots.

## 11. Verification Plan

1. `pnpm build` passes (the real correctness gate — compiles every page, validates the Zod
   schema against all 49 entries).
2. `pnpm astro check` — no type errors.
3. Run `pnpm dev`; screenshot at 375/768/1280/1536 px — confirm theme, responsiveness, nav,
   toolbar, and lazy-load fade-in (incl. fast-scroll smoothness).
4. Confirm graceful no-JS rendering (grid still shows).
5. **Multi-agent review (ultracode):** parallel reviewers for design critique, responsive/a11y,
   lazy-load correctness, and upgrade-correctness; fix confirmed findings.

## 12. Out of Scope (YAGNI)

- Per-movie detail pages (explicitly not chosen).
- Light/auto theme toggle (dark only).
- Adopting Astro `<Image>` optimization for remote covers.
- Backend, search index, pagination/infinite scroll (≤50 items; native lazy is enough).
- Reworking the content authoring workflow or adding real TV/movie type data (all entries are
  currently `type: "movie"`; the schema will still allow `"tv"` for the future).

## 13. Rollback

Work happens on a feature branch; `main` is untouched until verified. The spec and each step are
committed, so any step can be reverted independently. `pnpm-lock.yaml` is committed so the exact
upgraded dependency set is reproducible.
