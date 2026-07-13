import type { APIRoute } from "astro";

import { getViewingData } from "../lib/movies";
import { getCanonicalYearPaths } from "../lib/route-paths";

export const prerender = true;

export const GET: APIRoute = async ({ site }) => {
  if (!site)
    throw new Error("The `site` option is required to build the sitemap.");

  const { years } = await getViewingData();
  const urls = getCanonicalYearPaths(years)
    .map((path) => `  <url><loc>${new URL(path, site).href}</loc></url>`)
    .join("\n");

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
      },
    },
  );
};
