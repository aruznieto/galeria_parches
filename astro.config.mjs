import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import image from '@astrojs/image';

export default defineConfig({
  site: 'https://parches.anrn.dev',
  base: "galeria_parches",
  integrations: [image()],
  vite: {
    plugins: [tailwindcss()],
  },
});
