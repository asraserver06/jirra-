import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 60000,
    hookTimeout: 120000,
    globals: true,
    environment: 'node',
    setupFiles: ['./src/__tests__/setup.ts'],
    // Run test files sequentially so MongoMemoryServer is shared
    fileParallelism: false,
  },
});
