import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import inject from "@rollup/plugin-inject";
import path from "path";
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import nodePolyfills from 'rollup-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': process.env ?? {},
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      stream: 'rollup-plugin-node-polyfills/polyfills/stream',
      events: 'rollup-plugin-node-polyfills/polyfills/events',
      assert: 'assert',
      crypto: 'crypto-browserify',
      util: 'util',
      'near-api-js': 'near-api-js/dist/near-api-js.js',
    },
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      plugins: [
        inject({ Buffer: ["buffer", "Buffer"] }),
        nodePolyfills({ crypto: true }),
      ],
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      plugins: [
        NodeGlobalsPolyfillPlugin({ buffer: true }),
      ],
    }
  },
});
