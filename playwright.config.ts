import { defineConfig } from '@playwright/test';

const port = 4477;
const baseURL = `http://127.0.0.1:${port}`;
// The built site with vercel.json's headers (scripts/serve-static.mjs; run `npm run build` first).
const builtPort = 4478;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    channel: 'chrome',
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    { name: 'site', testIgnore: /security\.spec\.ts/, use: { baseURL } },
    { name: 'built', testMatch: /security\.spec\.ts/, use: { baseURL: `http://127.0.0.1:${builtPort}` } },
  ],
  webServer: [
    {
      command: `npm run dev -- --host 127.0.0.1 --port ${port}`,
      url: baseURL,
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      command: `node scripts/serve-static.mjs ${builtPort}`,
      url: `http://127.0.0.1:${builtPort}`,
      reuseExistingServer: false,
      timeout: 30_000,
    },
  ],
});
