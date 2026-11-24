import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const engine = path.resolve(here, '../shared/engine');

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@engine': engine } },
  server: {
    port: 3000,
    fs: { allow: [path.resolve(here, '..')] },
    proxy: { '/api': 'http://127.0.0.1:4000' }
  },
  preview: { host: '0.0.0.0' }
});
