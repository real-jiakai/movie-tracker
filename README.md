# Jiakai 的观影记录 · Personal Movie Journal

A dark, cinematic personal movie & TV journal, live at
[media.gujiakai.top](https://media.gujiakai.top/).

## Tech Stack

- [Astro 7](https://astro.build/) — pure static output, content collections
- [Tailwind CSS 4](https://tailwindcss.com/) — via `@tailwindcss/vite`
- Vanilla client-side JS for title search, rating filters and sorting

## Commands

| Command        | Action                                       |
| -------------- | -------------------------------------------- |
| `pnpm install` | Install dependencies                         |
| `pnpm dev`     | Local dev server at `localhost:4321`         |
| `pnpm build`   | Production build to `./dist/`                |
| `pnpm check`   | Type-check `.astro` files with `astro check` |
| `pnpm lint`    | Lint TypeScript and Astro source             |
| `pnpm test`    | Run focused regression tests                 |
| `pnpm preview` | Preview the production build locally         |

The site deploys automatically when `main` is pushed.

## Adding an entry

Create `src/content/movies/movie-<n>.md` — data is entered manually from
[Douban](https://movie.douban.com/):

```yaml
---
title: "片名"
date: "2026-01-31 21:00:00" # values over 24 hours ahead fail validation
rating: 4.5 # 0–5 in 0.5 steps (Douban half-star scale)
status: "看过"
review: "一句话短评。"
# reviewLang: "en" # optional; use when the whole review is English
url: "https://movie.douban.com/subject/1234567/"
type: "movie" # or "tv"
year: 2026 # must match the year in date
isPublic: true
cover: "https://…" # https-only poster URL
---
```

The schema in `src/content.config.ts` is strict — typos in field names or
invalid values fail the build rather than publishing silently. Dates are
strictly validated and interpreted as `Asia/Shanghai` civil time, including
date-only values; impossible dates such as `2025-02-30` are rejected. This is
a watched journal, so `status` may only be `"看过"`. A deliberate 24-hour
allowance prevents minor clock or timezone skew from rejecting a new entry.

## License

[MIT](./LICENSE)
