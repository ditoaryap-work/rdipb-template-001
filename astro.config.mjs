// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  site: 'https://template-001.rumahdekatipb.com',
  output: 'server',
  adapter: vercel({
    // Enable image optimization
    imageService: true,
    // Disable dev mode for production builds
    devImageService: 'sharp',
  }),

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [
    sitemap(),
    react(),
  ],

  // Performance optimizations
  build: {
    // Enable inlining of small assets
    inlineStylesheets: 'auto',
  },

  // Image optimization
  image: {
    // Use Vercel's image optimization
    domains: ['res.cloudinary.com'],
  },
});