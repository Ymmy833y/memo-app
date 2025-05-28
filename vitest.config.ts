import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'istanbul',
      include: ['src/**/*.ts'],
      reporter: ['text', 'html']
    },
    setupFiles: './tests/vitest.setup.ts',
    include: ['tests/**/*.test.ts']
  }
});
