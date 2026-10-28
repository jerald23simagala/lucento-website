import { expect, test, type Page } from '@playwright/test';

async function frames(page: Page): Promise<void> {
  await page.evaluate(() => new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve(undefined)));
  }));
}

async function scrollPin(page: Page, progress: number): Promise<void> {
  await page.evaluate((amount) => {
    const pin = document.querySelector('[data-pin]');
    if (!pin) return;
    const scrollable = pin.getBoundingClientRect().height > 0
      ? (pin as HTMLElement).offsetHeight - window.innerHeight
      : 0;
    const top = window.scrollY + pin.getBoundingClientRect().top + scrollable * amount;
    window.scrollTo(0, top);
  }, progress);
  await frames(page);
}

test.describe('app showcase', () => {
  test('desktop keeps five phones in order and the description in sync', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await scrollPin(page, 0.5);
    await expect(page.locator('[data-sync-title]')).toHaveText('The month, and its light');
    await expect(page.locator('[data-live]')).toContainText('Screen 3 of 5');

    const slides = await page.locator('[data-slide]').evaluateAll((nodes) => nodes.map((node) => {
      const box = node.getBoundingClientRect();
      return { x: box.x, width: box.width, opacity: Number(getComputedStyle(node).opacity) };
    }));
    expect(slides).toHaveLength(5);
    expect(slides.every((slide) => slide.opacity > 0.9)).toBe(true);
    const ordered = [...slides].sort((a, b) => a.x - b.x);
    expect(ordered[2].width).toBeGreaterThan(ordered[1].width);
    expect(ordered[2].width).toBeGreaterThan(ordered[3].width);
    expect(ordered[1].width).toBeGreaterThan(ordered[0].width);
    expect(ordered[3].width).toBeGreaterThan(ordered[4].width);

    await scrollPin(page, 0);
    await expect(page.locator('[data-sync-title]')).toHaveText('Check the rows, then save');
    await scrollPin(page, 1);
    await expect(page.locator('[data-sync-title]')).toHaveText('Assets minus debts');
    for (const amount of [0, 1]) {
      await scrollPin(page, amount);
      const fitted = await page.evaluate(() => {
        const stage = document.querySelector('[data-stage]');
        if (!stage) return false;
        const bounds = stage.getBoundingClientRect();
        return [...document.querySelectorAll('[data-slide]')].every((node) => {
          const box = node.getBoundingClientRect();
          const opacity = Number(getComputedStyle(node).opacity);
          return opacity > 0.9 && box.width > 48 && box.left >= bounds.left - 2 && box.right <= bounds.right + 2;
        });
      });
      expect(fitted).toBe(true);
    }
    expect(errors).toEqual([]);
  });

  test('page down and space scroll the page and the caption follows', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await scrollPin(page, 0);
    await page.evaluate(() => document.querySelector('main')?.focus({ preventScroll: true }));
    const start = await page.evaluate(() => window.scrollY);
    await page.keyboard.press('PageDown');
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(start + 400);
    const afterPage = await page.evaluate(() => window.scrollY);
    await page.keyboard.press('Space');
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(afterPage + 200);
    await expect(page.locator('[data-sync-title]')).not.toHaveText('Check the rows, then save');
  });

  test('tablet and desktop keep five phones visible at the ends of the scroll', async ({ page }) => {
    for (const width of [1280, 1024, 768]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      for (const amount of [0, 0.5, 1]) {
        await scrollPin(page, amount);
        await expect(page.locator('[data-showcase]')).toHaveAttribute('data-mode', 'five');
        const visible = await page.locator('[data-slide]').evaluateAll((nodes) => {
          const stage = document.querySelector('[data-stage]')?.getBoundingClientRect();
          if (!stage) return 0;
          return nodes.filter((node) => {
            const box = node.getBoundingClientRect();
            return Number(getComputedStyle(node).opacity) > 0.9 && box.width > 40 && box.left >= stage.left - 2 && box.right <= stage.right + 2;
          }).length;
        });
        expect(visible, `${width}px at ${amount}`).toBe(5);
      }
    }
  });

  test('360px uses a horizontal snap scroller without page overflow', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('/');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await expect(page.locator('[data-showcase]')).toHaveAttribute('data-mode', 'snap');
    const touch = await page.locator('[data-track]').evaluate((el) => getComputedStyle(el).touchAction);
    expect(touch).toContain('pan-y');
    await expect(page.locator('.lx-copy h3').first()).toBeVisible();
    const before = await page.evaluate(() => window.scrollY);
    await page.locator('[data-track]').hover();
    await page.mouse.wheel(0, 400);
    await frames(page);
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(before + 50);
  });

  test('a missing screenshot still leaves the description', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      const shot = document.querySelector('#check [data-shot]');
      const image = shot?.querySelector('img');
      if (!shot || !image) return;
      shot.querySelectorAll('source').forEach((source) => source.remove());
      image.srcset = '';
      image.src = '/screens/missing-check.webp';
    });
    const fallback = page.locator('#check .device-fallback');
    await expect(fallback).toBeVisible();
    await expect(fallback).toContainText('One incomplete row');
  });
});

test('hero composer reviews rows and saves explicitly', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.cmp-wallets').getByRole('radio')).toHaveText([/Everyday bank/, 'Cash', 'Visa card']);
  const heroBank = page.locator('.cmp-wallets').getByRole('radio', { name: /Everyday bank/ });
  await heroBank.focus();
  await page.keyboard.press('ArrowRight');
  const heroCash = page.locator('.cmp-wallets').getByRole('radio', { name: 'Cash' });
  await expect(heroCash).toBeFocused();
  await expect(heroCash).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('button', { name: /Lunch 250, groceries 800/ }).click();
  await expect(page.getByRole('button', { name: 'Save 3 transactions' })).toBeVisible();
  await expect(page.locator('[data-view="lunch"] li')).toHaveCount(3);
  await page.getByRole('button', { name: 'Save 3 transactions' }).click();
  await expect(page.locator('[data-composer-live]')).toHaveText('Saved all 3.');
});

test('full demo still logs a day and stays quiet in the console', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('/#try');
  await page.getByRole('button', { name: 'Add transaction' }).click();
  await expect(page.locator('#try .ls-walletbar').getByRole('radio')).toHaveText([/Everyday bank/, 'Cash', 'Visa card']);
  await page.locator('#ls-text').fill('Lunch 45');
  await page.locator('#ls-text').press('Enter');
  await expect(page.locator('#try .ld-step.is-now')).toContainText('Check the rows');
  await page.getByRole('button', { name: 'Start this guide again' }).click();
  await page.getByRole('button', { name: 'Add transaction' }).click();
  await page.getByRole('button', { name: 'Lunch 45, groceries 120, parking 15' }).click();
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.locator('#try .ld-step.is-now')).toContainText('Check the rows');
  const cash = page.locator('#try').getByRole('radio', { name: 'Cash' });
  await cash.click();
  await expect(cash).toHaveAttribute('aria-checked', 'true');
  await page.getByLabel('Category for Parking').selectOption({ label: 'Transport' });
  await page.getByRole('button', { name: 'Save 3 transactions' }).click();
  await expect(page.locator('.ld-step.is-finale')).toContainText('Home updated at once');
  expect(errors).toEqual([]);
});

test('guides and privacy pages still respond', async ({ page }) => {
  for (const path of ['/how-to', '/privacy', '/auth/confirmed']) {
    const response = await page.goto(path);
    expect(response?.status()).toBeLessThan(400);
  }
});

test('without JavaScript the five screens stay a readable list', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 360, height: 740 } });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('.lx-copy h3')).toHaveCount(5);
  await expect(page.locator('.lx-copy h3').nth(4)).toHaveText('Assets minus debts');
  await expect(page.locator('.cmp-static')).toContainText('Found 3 transactions. Review anything that looks wrong.');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await context.close();
});

test('reduced motion does not build the scrolling stage', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.locator('html')).not.toHaveClass(/js-motion/);
  await expect(page.locator('.lx-copy h3')).toHaveCount(5);
  const height = await page.locator('[data-pin]').evaluate((el) => el.getBoundingClientRect().height);
  const viewport = page.viewportSize()?.height ?? 900;
  expect(height).toBeLessThan(viewport * 4);
});

test('scrolling the showcase barely shifts layout', async ({ page }) => {
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
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  await scrollPin(page, 0);
  await scrollPin(page, 0.5);
  await scrollPin(page, 1);
  await scrollPin(page, 0);
  const cls = await page.evaluate(() => (window as Window & { __cls?: number }).__cls ?? 0);
  expect(cls).toBeLessThan(0.05);
});
