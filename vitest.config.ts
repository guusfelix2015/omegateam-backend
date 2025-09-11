import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', 'dist'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/modules': resolve(__dirname, './src/modules'),
      '@/libs': resolve(__dirname, './src/libs'),
      '@/plugins': resolve(__dirname, './src/plugins'),
      '@/routes': resolve(__dirname, './src/routes'),
      '@/types': resolve(__dirname, './src/types'),
    },
  },
});
