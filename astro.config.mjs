// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import preact from '@astrojs/preact';

// https://astro.build/config
export default defineConfig({
  site: 'https://example.com', // Replace with your site URL
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/admin'),
    }),
    preact(),
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-light',
      wrap: true
    }
  },
  vite: {
    optimizeDeps: {
      include: ['decap-cms-app', 'react', 'react-dom'],
    },
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
  },
});