import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { crx } from '@crxjs/vite-plugin';
import path from 'path';
import baseManifest from './manifest.json';

// 스토어 빌드(VITE_TARGET=store)일 때 key 필드 제거
const isStore = process.env.VITE_TARGET === 'store';
const { key: _key, ...manifestWithoutKey } = baseManifest;
const manifest = isStore ? manifestWithoutKey : baseManifest;

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    crx({ manifest: manifest as typeof baseManifest }),
  ],
  resolve: {
    dedupe: ['react', 'react-dom', 'react/jsx-runtime', 'react-router-dom'],
    alias: {
      '@ext': path.resolve(__dirname, './src'),
      '@': path.resolve(__dirname, './src'),
      '@styles': path.resolve(__dirname, './src/styles'),
      react: path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
      'react/jsx-runtime': path.resolve(
        __dirname,
        './node_modules/react/jsx-runtime'
      ),
    },
  },
  server: {
    cors: {
      origin: '*',
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
