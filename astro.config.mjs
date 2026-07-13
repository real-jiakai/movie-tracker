// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: "https://media.gujiakai.top",
  image: {
    domains: ["cdn.sa.net", "i.see.you"],
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
