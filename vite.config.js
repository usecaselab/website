import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    open: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        pilots: resolve(__dirname, 'pilots.html'),
        'verifiable-cities': resolve(__dirname, 'verifiable-cities.html'),
      },
    },
  },
});
