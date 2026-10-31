import { defineConfig } from '@playwright/test';

// Runs against the built site: pnpm build first. Visual tests only run in the Docker image of
// tooling/test-visual.sh, because fonts render differently from one system to another.
export default defineConfig({
  testDir: 'tests/browser',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'github' : 'line',
  snapshotPathTemplate: 'tests/browser/__screenshots__/{arg}{ext}',
  expect: { toHaveScreenshot: { maxDiffPixels: 20 } },
  use: { baseURL: 'http://localhost:4399', reducedMotion: 'reduce' },
  webServer: { command: 'pnpm --filter docs exec astro preview --port 4399', url: 'http://localhost:4399', reuseExistingServer: !process.env.CI },
  projects: [
    { name: 'browser', testIgnore: /visual/ },
    { name: 'visual', testMatch: /visual/ },
  ],
});
