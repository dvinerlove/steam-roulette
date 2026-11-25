import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'redirect-to-base',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/steam-roulette' || req.url === '/') {
            res.writeHead(301, { Location: '/steam-roulette/' });
            res.end();
            return;
          }
          next();
        });
      }
    }
  ],
  server: {
    host: '0.0.0.0',
    port: 5173
  },
  base: '/steam-roulette/', // Change this to your repo name
  build: {
    outDir: 'dist'
  }
})
