// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

import { site } from './src/site.ts';

// https://astro.build/config
export default defineConfig({
  site: site.url,
  // /convert.html is served by Cloudflare Pages at /convert, matching links and canonical URLs.
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [react(), sitemap()],
  markdown: { syntaxHighlight: false },
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "connect-src 'self' https://cloudflareinsights.com",
        "img-src 'self' data: blob:",
        "worker-src 'self' blob:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'none'",
      ],
      scriptDirective: {
        resources: ["'self'", "'wasm-unsafe-eval'", 'https://static.cloudflareinsights.com'],
      },
    },
  },
  vite: {
    optimizeDeps: {
      exclude: ['heic-decode', 'libheif-js'],
    },
    worker: {
      format: 'es',
    },
  },
});
