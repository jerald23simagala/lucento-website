import { expect, test, type Page } from '@playwright/test';
import { planCards } from '../src/data/plans';
import { site } from '../src/data/site';

// The homepage is built on Horizon (src/layouts/HorizonLayout.astro). Its figures are the app's demo month
// (src/data/demo.ts) and must match the app's own screens; negative amounts carry U+2212, never a hyphen.
const MINUS = '−';

function minorOf(text: string): number {
  const value = Number(text.replace(/[^0-9]/g, ''));
  return text.includes(MINUS) ? -value : value;
}

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

const overflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test.describe('homepage', () => {
  test('loads quietly and leads from the promise to its proof', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Everything about your money, in one clear view.');
    await page.getByRole('link', { name: 'See the whole picture' }).click();
    await expect(page).toHaveURL(/#horizon$/);
    await expect(page.getByRole('heading', { level: 2, name: /One view of what you have and what you owe/ })).toBeInViewport();
    expect(errors).toEqual([]);
  });

  test('the demo month reconciles, and every amount carries its sign', async ({ page }) => {
    await page.goto('/');
    const rows = await page.locator('.legend li').evaluateAll((items) =>
      items.map((li) => ({
        kind: li.querySelector('i')?.getAttribute('class') ?? '',
        money: li.querySelector('.money')?.textContent?.trim() ?? '',
      })),
    );
    const have = rows.filter((row) => row.kind === 'have');
    const owe = rows.filter((row) => row.kind === 'owe');
    const total = rows.find((row) => row.kind === 'net');
    expect(have.length).toBeGreaterThan(0);
    expect(owe.length).toBeGreaterThan(0);
    expect(total).toBeDefined();
    for (const row of rows) expect(row.money, `${row.money} uses U+2212, not a hyphen`).not.toContain('-');
    for (const row of have) expect(row.money.startsWith(MINUS), row.money).toBe(false);
    for (const row of owe) expect(row.money.startsWith(MINUS), row.money).toBe(true);
    const sum = [...have, ...owe].reduce((acc, row) => acc + minorOf(row.money), 0);
    expect(minorOf(total!.money)).toBe(sum);

    // The same month as the app's screenshots (API 36 tour, peso mode).
    await expect(page.locator('.hc-have b')).toHaveText('₱176,520.10');
    await expect(page.locator('.hc-owe b')).toHaveText(`${MINUS}₱114,400.00`);
    await expect(page.locator('.hc-net-label b')).toHaveText('₱62,120.10');
    expect(total!.money).toBe('₱62,120.10');
    await expect(page.locator('#chart-cap')).toHaveText(/^Example figures from the app’s demo data\./);
    await expect(page.locator('.example-tag')).toContainText('Example figures');
  });

  test('the chart is drawn to one scale', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const up = await page.locator('.hc-up').evaluate((el) => el.getBoundingClientRect().height);
    const down = await page.locator('.hc-down').evaluate((el) => el.getBoundingClientRect().height);
    expect(up).toBeGreaterThan(0);
    expect(down).toBeGreaterThan(0);
    const expected = 176_520 / 114_400;
    expect(Math.abs(up / down / expected - 1), `have/owe bars ${up}:${down}`).toBeLessThan(0.03);
  });

  test('the privacy rows name each trigger and link to the policy', async ({ page }) => {
    await page.goto('/');
    const ledger = page.locator('#privacy .ledger');
    const terms = ledger.locator('dt');
    expect(await terms.count()).toBeGreaterThan(0);
    for (const term of await terms.all()) await expect(term.locator('span')).not.toBeEmpty();
    for (const name of ['Your account', 'Sync', 'Crash reports', 'Usage counts', 'AI features (Gemini)', 'Exchange rates', 'Google Play']) {
      await expect(ledger).toContainText(name);
    }
    await expect(page.getByRole('link', { name: 'Read the privacy policy' })).toHaveAttribute('href', '/privacy');
  });

  test('plans come from the pricing data and the page ends with routes onward', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#plans .plan h3')).toHaveText(planCards.map((plan) => plan.name));
    const plans = page.locator('#plans');
    await expect(plans.getByRole('link', { name: 'Compare plans' })).toHaveAttribute('href', '/pricing');
    await expect(plans.getByRole('link', { name: 'Read the guides' })).toHaveAttribute('href', '/how-to');
    if (site.playListed) {
      await expect(plans.getByRole('link', { name: 'Get it on Google Play' })).toHaveAttribute('href', site.playUrl);
    } else {
      await expect(plans.locator('.play-status')).toContainText('Coming soon to Google');
    }
  });

  test('no sideways scrolling on small phones, even with text at 200%', async ({ page }) => {
    for (const width of [320, 360]) {
      await page.setViewportSize({ width, height: 740 });
      await page.goto('/');
      for (const size of ['100%', '200%']) {
        await page.evaluate((value) => {
          document.documentElement.style.fontSize = value;
        }, size);
        await page.evaluate(() => document.fonts.ready);
        expect(await overflow(page), `${width}px, text ${size}`).toBeLessThanOrEqual(1);
      }
    }
  });

  test('short laptop windows keep the hero phone legible and in view', async ({ page }) => {
    for (const [width, height] of [[1280, 720], [1366, 768]] as const) {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      await page.evaluate(() => document.fonts.ready);
      const box = await page.locator('.hero .phone').boundingBox();
      expect(box, `${width}×${height}`).not.toBeNull();
      expect(box!.width, `${width}×${height} phone width`).toBeGreaterThanOrEqual(239);
      expect(box!.y + box!.height, `${width}×${height} phone bottom`).toBeLessThanOrEqual(height);
    }
  });

  test('screens follow the colour scheme and describe their figures', async ({ page }) => {
    for (const scheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto('/');
      const image = page.locator('.hero .phone img');
      await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.currentSrc)).toContain(`/screens/home-${scheme}-`);
      await expect(image).toHaveAttribute('alt', /₱62,120\.10/);
      await expect(page.locator('.hero figcaption')).toContainText('example figures');
    }
  });

  test('the first Tab reaches the skip link, which moves to the content', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#main$/);
  });

  test('without JavaScript the page reads the same', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 360, height: 740 } });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('.hc-net-label b')).toHaveText('₱62,120.10');
    await expect(page.locator('#privacy .ledger dt').first()).toBeVisible();
    expect(await overflow(page)).toBeLessThanOrEqual(1);
    await context.close();
  });

  test('reduced motion: nothing on the page animates', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const moving = await page.evaluate(() => {
      const main = document.querySelector('main');
      return document.getAnimations().filter((animation) => {
        const target = (animation.effect as KeyframeEffect | null)?.target;
        return target instanceof Element && !!main?.contains(target);
      }).length;
    });
    expect(moving).toBe(0);
  });

  test('desktop load barely shifts the hero', async ({ page }) => {
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
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    const cls = await page.evaluate(() => (window as Window & { __cls?: number }).__cls ?? 0);
    expect(cls).toBeLessThan(0.05);
  });
});

test('the guides page phone demo starts without errors', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/how-to');
  await expect(page.locator('[data-sim="steps"] li').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('guides, legal, pricing and deletion pages still respond', async ({ page }) => {
  for (const path of ['/how-to', '/privacy', '/terms', '/pricing', '/delete-account', '/auth/confirmed']) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBeLessThan(400);
  }
});

test('an unknown address answers 404 with a way home', async ({ page }) => {
  const response = await page.goto('/no-such-page');
  expect(response?.status()).toBe(404);
  expect(await page.locator('a[href="/"]').count()).toBeGreaterThan(0);
});

test('the deletion page works without the app: steps, an email request, and what is kept', async ({ page }) => {
  await page.goto('/delete-account');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Delete your Lucento account');
  await expect(page.getByRole('link', { name: 'Email a deletion request' })).toHaveAttribute('href', /^mailto:lucentoapp@gmail\.com/);
  await expect(page.getByRole('heading', { name: 'What is kept, and for how long' })).toBeVisible();
});

test('the pricing table names every cell for screen readers', async ({ page }) => {
  await page.goto('/pricing');
  const marks = page.locator('td.mark');
  expect(await marks.count()).toBeGreaterThan(10);
  for (const cell of await marks.all()) {
    await expect(cell.locator('.visually-hidden')).toHaveText(/^(Included|Not included)$/);
  }
});
