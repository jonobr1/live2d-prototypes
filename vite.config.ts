import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@live2d/framework': path.resolve(__dirname, './Live2D/Framework/src'),
      '@live2d/core': path.resolve(__dirname, './Live2D/Core'),
    },
  },
});
