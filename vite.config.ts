import path from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { createGeminiMiddleware } from './server/geminiMiddleware';

function geminiApiPlugin(apiKey: string): Plugin {
  return {
    name: 'hikaru-gemini-api',
    configureServer(server) {
      server.middlewares.use(createGeminiMiddleware(apiKey));
    },
    configurePreviewServer(server) {
      server.middlewares.use(createGeminiMiddleware(apiKey));
    },
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const apiKey = env.GEMINI_API_KEY ?? '';
    return {
      server: {
        port: 3000,
        host: '127.0.0.1',
      },
      preview: {
        port: 3000,
        host: '127.0.0.1',
      },
      plugins: [geminiApiPlugin(apiKey), react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
