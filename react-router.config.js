/** @type {import('@react-router/dev/config').Config} */
export default {
  // SPA mode — pre-render the UI shell at build time, no per-request SSR.
  // API routes are resource routes that still run server-side.
  ssr: true,
  routes: './app/routes.js',
};
