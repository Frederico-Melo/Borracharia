import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: 'frontend',
  // Caminhos relativos são necessários quando o Electron abre a interface por file:// no Windows.
  base: './',
  plugins: [react()],
  build: { outDir: '../dist/frontend', emptyOutDir: true },
  server: { port: 5173, strictPort: true },
});
