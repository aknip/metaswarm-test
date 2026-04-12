import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'tsx src/server/index.ts',
      port: 3000,
      reuseExistingServer: !process.env.CI,
      env: {
        NODE_ENV: 'test',
        PORT: '3000',
      },
    },
    {
      command: 'npx vite --port 5173',
      port: 5173,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
