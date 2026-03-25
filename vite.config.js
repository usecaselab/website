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
          const cleanPaths = ['/commerce', '/verifiable-cities'];
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
      },
    },
  },
});
