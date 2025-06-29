import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import image from '@astrojs/image';

export default defineConfig({
  integrations: [image()],
  vite: {
    plugins: [tailwindcss()],
  },
});
