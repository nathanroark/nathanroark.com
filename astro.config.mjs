// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  site: process.env.CI ? "https://nathanroark.com" : "http://localhost:4321",
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      external: ["@resvg/resvg-js", "sharp"],
    },
  },
  adapter: cloudflare({
    imageService: "cloudflare",
  }),
});
