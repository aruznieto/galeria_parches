import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import image from '@astrojs/image';

export default defineConfig({
  site: 'https://parches.anrn.dev',
  integrations: [image()],
  vite: {
    plugins: [tailwindcss()],
  },
});
