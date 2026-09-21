import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'public',
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'public/index.html'),
        login: resolve(__dirname, 'public/login.html'),
        conditions: resolve(__dirname, 'public/conditions.html'),
        createaccount: resolve(__dirname, 'public/createaccount.html'),
        game: resolve(__dirname, 'public/game.html'),
        // ajoute chaque page ici
      },
    },
  },
});