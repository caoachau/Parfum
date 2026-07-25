import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    // PF-43: nap bien moi truong toi thieu truoc khi import config/env.ts
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      // Loai tru script/seed/type khoi do phu.
      exclude: ['tests/**', 'src/scripts/**', 'src/types/**', '**/*.d.ts', 'src/config/swagger.ts'],
      // Nguong toi thieu -> CI fail neu tut duoi muc nay.
      thresholds: {
        lines: 45,
        functions: 45,
        branches: 35,
        statements: 45,
      },
    },
  },
});
