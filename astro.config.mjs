// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import rehypeRaw from 'rehype-raw';
import { rehypeOptimizeBlogImages } from './src/lib/rehype-optimize-blog-images.ts';
import { rehypeNormalizeInternalLinks } from './src/lib/rehype-normalize-internal-links.ts';
import { rehypeEnsureHrBeforeH2 } from './src/lib/rehype-ensure-hr-before-h2.ts';

// https://astro.build/config
export default defineConfig({
  site: 'https://intolibya.com',
  trailingSlash: 'never',
  output: 'static',
  adapter: vercel({
    imageService: true,
    imagesConfig: {
      sizes: [320, 400, 640, 768, 1024, 1280, 1600, 1920],
      domains: [
        'cdn.intolibya.com',
        'cdn.intoLibya.com',
        'intolibya.com',
        'www.intolibya.com',
      ],
      formats: ['image/avif', 'image/webp'],
      minimumCacheTTL: 60 * 60 * 24 * 30,
    },
    devImageService: 'sharp',
  }),
  image: {
    layout: 'constrained',
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.intolibya.com' },
      { protocol: 'https', hostname: 'cdn.intoLibya.com' },
      { protocol: 'https', hostname: 'intolibya.com' },
      { protocol: 'https', hostname: 'www.intolibya.com' },
    ],
  },
  integrations: [sitemap()],
  markdown: {
    rehypePlugins: [
      rehypeRaw,
      rehypeEnsureHrBeforeH2,
      rehypeOptimizeBlogImages,
      rehypeNormalizeInternalLinks,
    ],
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
