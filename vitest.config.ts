import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/server/**/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/server/**/*.ts', 'src/shared/**/*.ts'],
      exclude: [
        'src/server/**/__tests__/**',
        'src/server/index.ts',
        'src/shared/types.ts',
        'src/server/app.ts',
        'src/server/routes/events.ts',
      ],
      // app.ts and events.ts are excluded because they contain framework
      // wiring (Hono middleware, SSE streaming) that is integration-tested
      // via E2E tests rather than unit tests.
      thresholds: {
        lines: 100,
        branches: 100,
        functions: 100,
        statements: 100,
      },
    },
  },
});
