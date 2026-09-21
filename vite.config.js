import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'public',
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
});