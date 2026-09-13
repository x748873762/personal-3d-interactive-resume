import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', fullyParallel: false, reporter: 'list',
  outputDir: '/tmp/paper-template-test-results',
  use: { channel: process.env.PW_CHANNEL || undefined, baseURL: 'http://127.0.0.1:5187', viewport: { width: 1700, height: 1000 } },
  webServer: { command: 'pnpm dev', url: 'http://127.0.0.1:5187', reuseExistingServer: !process.env.CI },
});
