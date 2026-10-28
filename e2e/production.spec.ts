import { expect, test } from '@playwright/test';
import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { readFileSync } from 'node:fs';

const origin = 'https://www.lucentoapp.com';
const port = 4499;
let server: ChildProcess | undefined;

async function waitForServer(): Promise<void> {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/`);
      if (response.ok) return;
    } catch {
      /* the static server is still starting */
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('static server did not start');
}

test.beforeAll(async () => {
  execFileSync('npm', ['run', 'build'], {
    env: { ...process.env, SITE_URL: origin },
    stdio: 'inherit',
  });
  server = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], {
    cwd: '.vercel/output/static',
    stdio: 'ignore',
  });
  await waitForServer();
});

test.afterAll(() => {
  server?.kill();
});

test('SITE_URL emits canonical, og:url, sitemap, and robots', () => {
  const home = readFileSync('.vercel/output/static/index.html', 'utf8');
  const privacy = readFileSync('.vercel/output/static/privacy/index.html', 'utf8');
  const robots = readFileSync('.vercel/output/static/robots.txt', 'utf8');
  const index = readFileSync('.vercel/output/static/sitemap-index.xml', 'utf8');
  const urls = readFileSync('.vercel/output/static/sitemap-0.xml', 'utf8');

  expect(home).toContain(`rel="canonical" href="${origin}/"`);
  expect(home).toContain(`property="og:url" content="${origin}/"`);
  expect(privacy).toContain(`rel="canonical" href="${origin}/privacy/"`);
  expect(privacy).toContain(`property="og:url" content="${origin}/privacy/"`);
  expect(robots).toContain(`Sitemap: ${origin}/sitemap-index.xml`);
  expect(index).toContain(`${origin}/sitemap-0.xml`);
  for (const path of ['/', '/how-to/', '/privacy/', '/auth/confirmed/']) {
    expect(urls).toContain(`${origin}${path}`);
  }
  expect(urls).not.toContain(`${origin}/404`);
  expect(urls).not.toContain('https://lucentoapp.com/');
});

test('deferred CSS keeps desktop CLS under 0.05', async ({ page }) => {
  await page.route('**/*.css', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    await route.continue();
  });
  await page.addInitScript(() => {
    const record = window as Window & { __cls?: number };
    record.__cls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const shift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean };
        if (!shift.hadRecentInput) record.__cls = (record.__cls ?? 0) + shift.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
  const cls = await page.evaluate(() => (window as Window & { __cls?: number }).__cls ?? 0);
  expect(cls).toBeLessThan(0.05);
});
