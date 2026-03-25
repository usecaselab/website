import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  appType: 'mpa',
  server: {
    open: true,
  },
  plugins: [
    {
      name: 'clean-urls',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Redirect /foo to /foo/ for directory-based pages
          const cleanPaths = ['/commerce', '/verifiable-cities', '/verifiable-cities/pilot-concepts', '/verifiable-cities/use-case-landscape'];
          if (cleanPaths.includes(req.url?.split('?')[0])) {
            res.writeHead(301, { Location: req.url + '/' });
            res.end();
            return;
          }
          next();
        });
      },
    },
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        'verifiable-cities': resolve(__dirname, 'verifiable-cities/index.html'),
        'commerce': resolve(__dirname, 'commerce/index.html'),
        'pilot-concepts': resolve(__dirname, 'verifiable-cities/pilot-concepts/index.html'),
        'use-case-landscape': resolve(__dirname, 'verifiable-cities/use-case-landscape/index.html'),
      },
    },
  },
});
