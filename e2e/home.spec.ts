import { expect, test, type Page } from '@playwright/test';
import { faq, foreignWallets, looks, netWorthWithForeign, screens } from '../src/data/content';
import { planCards } from '../src/data/plans';

// The one-page site (2026-11-08). Screens and figures are the app's own (src/data/content.ts names the sources);
// negative amounts carry U+2212, never a hyphen.
const MINUS = '−';

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

const visibleVariant = (page: Page) =>
  page.locator('.studio-stage picture').evaluateAll((nodes) =>
    nodes.filter((n) => getComputedStyle(n).display !== 'none').map((n) => (n as HTMLElement).dataset.v),
  );

test.describe('homepage', () => {
  test('loads quietly, and every section the navigation names exists', async ({ page }) => {
    const errors = collectErrors(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Everything about your money, in one clear view.');
    for (const id of ['features', 'how', 'themes', 'pricing', 'faq', 'multicurrency', 'shared', 'privacy']) {
      await expect(page.locator(`#${id}`), id).toHaveCount(1);
    }
    await page.locator('.nav').getByRole('link', { name: 'Pricing' }).click();
    await expect(page).toHaveURL(/#pricing$/);
    await expect(page.getByRole('heading', { level: 2, name: 'Free to start. Pro when you want more.' })).toBeInViewport();
    expect(errors).toEqual([]);
  });

  test('the hero shows six real screens and the tabs move between them', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(page.locator('[data-slide]')).toHaveCount(screens.length);
    await expect(page.locator('[data-tab]')).toHaveText(screens.map((s) => s.label));
    const budgets = page.locator('[data-tab="budgets"]');
    await budgets.click();
    await expect(budgets).toHaveAttribute('aria-current', 'true');
    await expect(page.locator('[data-slide="budgets"]')).toHaveClass(/is-active/);
    await expect(page.locator('[data-caption]')).toContainText(screens[1].title);
    // The arrow keys move along the track.
    await page.locator('[data-track]').focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('[data-tab="wallets"]')).toHaveAttribute('aria-current', 'true');
    // Every screen describes its figures.
    for (const screen of screens) {
      await expect(page.locator(`[data-slide="${screen.id}"] img`)).toHaveAttribute('alt', screen.alt);
    }
  });

  test('a phone swipes through the screens', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const track = page.locator('[data-track]');
    await track.evaluate((el) => el.scrollTo({ left: el.scrollWidth, behavior: 'instant' as ScrollBehavior }));
    await expect(page.locator(`[data-tab="${screens[screens.length - 1].id}"]`)).toHaveAttribute('aria-current', 'true');
  });

  test('the theme switcher shows the real Wallets screen in each theme and mode', async ({ page }) => {
    await page.goto('/');
    const studio = page.locator('#themes');
    await studio.scrollIntoViewIfNeeded();
    expect(await visibleVariant(page)).toEqual(['sunrise-light']);
    await studio.locator('label.look', { hasText: 'Grove' }).click();
    expect(await visibleVariant(page)).toEqual(['grove-light']);
    await studio.locator('label.mode', { hasText: 'Dark' }).click();
    expect(await visibleVariant(page)).toEqual(['grove-dark']);
    const groveDark = looks.find((l) => l.id === 'grove')!.modes.find((m) => m.mode === 'dark')!;
    const hex = groveDark.bg.slice(1);
    const expected = `rgb(${parseInt(hex.slice(0, 2), 16)}, ${parseInt(hex.slice(2, 4), 16)}, ${parseInt(hex.slice(4, 6), 16)})`;
    await expect.poll(() => studio.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(expected);
    // Midnight is always dark, whatever the mode says.
    await studio.locator('label.look', { hasText: 'Midnight' }).click();
    expect(await visibleVariant(page)).toEqual(['midnight-dark']);
    await expect(studio.locator('.mode-note')).toBeVisible();
    // The chosen screen loads.
    await expect
      .poll(() => studio.locator('[data-v="midnight-dark"] img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
      .toBe(true);
  });

  test('hide amounts swaps to the app’s own hidden view', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByRole('switch', { name: 'Hide amounts' });
    const shown = page.locator('.reveal-toggle picture.is-shown');
    const hidden = page.locator('.reveal-toggle picture.is-hidden-view');
    await toggle.scrollIntoViewIfNeeded();
    await expect(shown).toBeVisible();
    await expect(hidden).toBeHidden();
    await toggle.check();
    await expect(shown).toBeHidden();
    await expect(hidden).toBeVisible();
  });

  test('multicurrency figures are the app’s conversions and add up', async ({ page }) => {
    await page.goto('/');
    const rows = page.locator('.fx-ledger li');
    await expect(rows).toHaveCount(foreignWallets.length);
    await expect(rows.nth(0)).toContainText('$1,850.00');
    await expect(rows.nth(0)).toContainText('₱106,930.00');
    await expect(rows.nth(1)).toContainText('₱66,108.00');
    await expect(rows.nth(2)).toContainText('¥60,000');
    await expect(rows.nth(2)).toContainText('₱22,950.00');
    // The demo month's net worth (₱62,120.10) plus the three conversions.
    expect(6_212_010 + foreignWallets.reduce((sum, w) => sum + w.pesoMinor, 0)).toBe(netWorthWithForeign);
    await expect(page.locator('.fx-total b')).toHaveText('₱258,108.10');
    // Signed amounts use U+2212.
    const money = await page.locator('.money').allTextContents();
    expect(money.some((t) => t.startsWith(MINUS))).toBe(true);
    for (const text of money) expect(text, text).not.toContain('-');
  });

  test('pricing shows every plan and names every comparison cell', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.plan h3')).toHaveText(planCards.map((p) => p.name));
    const marks = page.locator('.compare td.yes, .compare td.no');
    expect(await marks.count()).toBeGreaterThan(10);
    for (const cell of await marks.all()) {
      await expect(cell.locator('.sr-only')).toHaveText(/^(Included|Not included)$/);
    }
    await expect(page.locator('#pricing')).toContainText('Up to 3');
    await expect(page.locator('#pricing')).toContainText('50 a day');
  });

  test('the FAQ opens, and its structured data matches it', async ({ page }) => {
    await page.goto('/');
    const first = page.locator('.faq details').first();
    await first.locator('summary').click();
    await expect(first).toHaveAttribute('open', '');
    await expect(first.locator('p')).toBeVisible();
    const total = faq.reduce((n, g) => n + g.items.length, 0);
    await expect(page.locator('.faq details')).toHaveCount(total);
    const data = await page.locator('script[type="application/ld+json"]').allTextContents();
    const parsed = data.map((d) => JSON.parse(d));
    const faqPage = parsed.find((d) => d['@type'] === 'FAQPage');
    expect(faqPage.mainEntity).toHaveLength(total);
    expect(parsed.find((d) => d['@type'] === 'SoftwareApplication')?.name).toBe('Lucento');
  });

  test('no sideways scrolling on small phones, even with text at 200%', async ({ page }) => {
    for (const width of [320, 360, 390]) {
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

  test('the first Tab reaches the skip link, which moves to the content', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#main$/);
  });

  test('without JavaScript the page still reads, and themes still switch', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 360, height: 740 } });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('[data-slide] img').first()).toBeVisible();
    await page.locator('#themes label.look', { hasText: 'Aurora' }).click();
    expect(await visibleVariant(page)).toEqual(['aurora-light']);
    expect(await overflow(page)).toBeLessThanOrEqual(1);
    await context.close();
  });

  test('reduced motion: nothing on the page animates', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.mouse.wheel(0, 3000);
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

test('the interactive demo’s phone renders and starts without errors', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/demo');
  await expect(page.locator('[data-sim="steps"] li').first()).toBeVisible();
  const width = await page.locator('.ld-phone-wrap .phone').evaluate((el) => el.getBoundingClientRect().width);
  expect(width).toBeGreaterThan(200);
  expect(errors).toEqual([]);
});

test('privacy, terms, deletion and confirmation pages respond', async ({ page }) => {
  for (const path of ['/demo', '/privacy', '/terms', '/delete-account', '/auth/confirmed']) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBeLessThan(400);
  }
});

test('old addresses lead to their new places', async ({ page }) => {
  await page.goto('/how-to');
  await expect(page).toHaveURL(/\/demo\/?$/);
  await page.goto('/pricing');
  await expect(page).toHaveURL(/\/#pricing$/);
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
