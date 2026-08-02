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
      include: ['src/**/*.ts'],
      // Loai tru script/seed/type khoi do phu.
      exclude: [
        'tests/**',
        'dist/**',
        'src/scripts/**',
        'src/migrations/**',
        'src/index.ts',
        'src/types/**',
        '**/*.d.ts',
        'src/config/swagger.ts',
        // Dac ta OpenAPI la du lieu mo ta thuan, khong chua logic nghiep vu.
        'src/docs/**',
      ],
      // Nguong toi thieu -> CI fail neu tut duoi muc nay.
      thresholds: {
        // Baseline thuc te cua toan bo src; tang dan khi bo sung integration test cho service.
        lines: 23,
        functions: 9,
        branches: 50,
        statements: 23,
      },
    },
  },
});
