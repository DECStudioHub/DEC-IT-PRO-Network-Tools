import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  // Support GitHub Pages base path when building for GitHub repository
  // Automatically detects GITHUB_REPOSITORY (e.g. "DECStudioHub/DEC-IT-PRO-Network-Tools")
  let repoBase = './';
  if (process.env.BASE_PATH) {
    repoBase = process.env.BASE_PATH;
  } else if (process.env.GITHUB_REPOSITORY) {
    const repoName = process.env.GITHUB_REPOSITORY.split('/')[1];
    repoBase = repoName ? `/${repoName}/` : './';
  } else if (process.env.GITHUB_ACTIONS) {
    repoBase = '/DEC-IT-PRO-Network-Tools/';
  }
  const base = repoBase;

  return {
    base,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true as const,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
