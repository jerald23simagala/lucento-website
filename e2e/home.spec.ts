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

  test('below 1100px the showcase shows three phones and the description follows', async ({ page }) => {
    for (const width of [1099, 1024, 768]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      await expect(page.locator('[data-showcase]')).toHaveAttribute('data-mode', 'three');
      for (const amount of [0, 0.5, 1]) {
        await scrollPin(page, amount);
        const result = await page.evaluate(() => {
          const stage = document.querySelector('[data-stage]')?.getBoundingClientRect();
          const slides = [...document.querySelectorAll('[data-slide]')].map((node) => {
            const box = node.getBoundingClientRect();
            return {
              title: (node as HTMLElement).dataset.title ?? '',
              width: box.width,
              opacity: Number(getComputedStyle(node).opacity),
              left: box.left,
              right: box.right,
            };
          });
          const visible = !stage
            ? []
            : slides.filter((slide) => slide.opacity > 0.9 && slide.width > 40 && slide.left >= stage.left - 2 && slide.right <= stage.right + 2);
          const title = document.querySelector('[data-sync-title]')?.textContent ?? '';
          const widest = visible.reduce((best, slide) => (slide.width > best.width ? slide : best), visible[0]);
          return {
            count: visible.length,
            min: visible.length ? Math.min(...visible.map((slide) => slide.width)) : 0,
            widest: widest?.title ?? '',
            title,
          };
        });
        expect(result.count, `${width}px at ${amount}`).toBe(3);
        expect(result.min, `${width}px at ${amount} side width`).toBeGreaterThanOrEqual(110);
        expect(result.widest, `${width}px at ${amount} description`).toBe(result.title);
      }
    }
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
    for (const width of [1440, 1280, 1100]) {
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
    const fallback = page.locator('#check .phone-fallback');
    await expect(fallback).toBeVisible();
    await expect(fallback).toContainText('One incomplete row');
  });
});

test('feature strip can be scrolled from the keyboard', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const strip = page.locator('.lx-feature-row');
  await expect(strip).toHaveAttribute('tabindex', '0');
  await expect(strip).toHaveAttribute('role', 'region');
  await expect(strip).toHaveAttribute('aria-label', 'Feature screens');
  await strip.focus();
  await expect(strip).toBeFocused();
  const before = await strip.evaluate((el) => el.scrollLeft);
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => strip.evaluate((el) => el.scrollLeft)).toBeGreaterThan(before + 20);
});

test('hero composer reviews rows and saves explicitly', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const hintClearance = await page.evaluate(() => {
    const hint = document.querySelector('.cmp-hint')?.getBoundingClientRect();
    const input = document.querySelector('.cmp-input')?.getBoundingClientRect();
    if (!hint || !input || hint.height === 0) return -1;
    return input.top - hint.bottom;
  });
  expect(hintClearance).toBeGreaterThanOrEqual(0);
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

test('narrow demo dock keeps the Transactions label off the add button', async ({ page }) => {
  await page.setViewportSize({ width: 315, height: 700 });
  await page.goto('/#try');
  const gap = await page.locator('#try .ls-dock').evaluate((dock) => {
    const plus = dock.querySelector('.ls-plus')?.getBoundingClientRect();
    const labels = [...dock.querySelectorAll('.ls-tab small')].map((label) => {
      const range = document.createRange();
      range.selectNodeContents(label);
      const box = range.getBoundingClientRect();
      const clipped = label.scrollWidth - label.clientWidth > 1;
      return { text: label.textContent ?? '', right: box.right, left: box.left, clipped };
    });
    return {
      plusLeft: plus?.left ?? 0,
      plusRight: plus?.right ?? 0,
      labels,
    };
  });
  const transactions = gap.labels.find((label) => label.text === 'Transactions');
  expect(transactions).toBeTruthy();
  expect(transactions!.clipped).toBe(false);
  expect(gap.plusLeft - transactions!.right).toBeGreaterThanOrEqual(4);
  for (const label of gap.labels) {
    const overlapsPlus = label.right > gap.plusLeft + 0.5 && label.left < gap.plusRight - 0.5;
    expect(overlapsPlus, label.text).toBe(false);
    expect(label.clipped, label.text).toBe(false);
  }
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

test('hero, showcase, and demo phones share one frame', async ({ page }) => {
  for (const [width, height] of [[1440, 900], [768, 900], [360, 740]] as const) {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const measure = () => page.evaluate(() => {
      const box = (selector: string) => {
        const node = document.querySelector(selector);
        if (!node) return null;
        const rect = node.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      };
      const hero = box('.lx-front .phone');
      const demo = box('.ld-phone-wrap .phone');
      const showcase = [...document.querySelectorAll('.lx-slide .phone')].reduce<{ width: number; height: number } | null>((best, node) => {
        const rect = node.getBoundingClientRect();
        if (!best || rect.width > best.width) return { width: rect.width, height: rect.height };
        return best;
      }, null);
      const sample = document.querySelector('.cmp-static-title, .ld-screen');
      const fontSize = sample ? Number.parseFloat(getComputedStyle(sample).fontSize) : 0;
      return { hero, demo, showcase, fontSize };
    });
    if (width >= 768) await scrollPin(page, 0);
    const sizes = await measure();
    expect(sizes.hero, `${width} hero`).not.toBeNull();
    expect(sizes.demo, `${width} demo`).not.toBeNull();
    expect(sizes.showcase, `${width} showcase`).not.toBeNull();
    const hero = sizes.hero!;
    const demo = sizes.demo!;
    const showcase = sizes.showcase!;
    expect(Math.abs(hero.width - demo.width), `${width} hero/demo width`).toBeLessThanOrEqual(2);
    expect(Math.abs(hero.width - showcase.width), `${width} hero/showcase width`).toBeLessThanOrEqual(2);
    const ratio = (item: { width: number; height: number }) => item.width / item.height;
    expect(Math.abs(ratio(hero) - 9 / 16), `${width} hero ratio`).toBeLessThan(0.02);
    expect(Math.abs(ratio(demo) - ratio(hero)), `${width} demo ratio`).toBeLessThan(0.02);
    expect(Math.abs(ratio(showcase) - ratio(hero)), `${width} showcase ratio`).toBeLessThan(0.02);
    if (width === 360) expect(sizes.fontSize).toBeGreaterThanOrEqual(12);
    const bezel = await page.locator('.lx-front .phone').evaluate((phone) => {
      const box = phone.getBoundingClientRect();
      const screen = phone.querySelector('.phone-screen')?.getBoundingClientRect();
      if (!screen) return null;
      return {
        left: screen.left - box.left,
        right: box.right - screen.right,
        top: screen.top - box.top,
        bottom: box.bottom - screen.bottom,
        ratio: screen.width / screen.height,
      };
    });
    expect(bezel, `${width} bezel`).not.toBeNull();
    expect(Math.abs(bezel!.left - bezel!.right), `${width} side bezel`).toBeLessThan(0.75);
    expect(Math.abs(bezel!.top - bezel!.bottom), `${width} end bezel`).toBeLessThan(0.75);
    expect(Math.abs(bezel!.left - bezel!.top), `${width} even bezel`).toBeLessThan(0.75);
    expect(Math.abs(bezel!.ratio - 9 / 16), `${width} screen ratio`).toBeLessThan(0.01);
    if (width === 1440) {
      const shots = await page.locator('.lx-back .phone, .phone.is-mini').evaluateAll((nodes) => nodes.map((node) => {
        const screen = node.querySelector('.phone-screen')?.getBoundingClientRect();
        const image = node.querySelector('img');
        const imageBox = image?.getBoundingClientRect();
        const fit = image ? getComputedStyle(image).objectFit : '';
        return {
          fit,
          screenRatio: screen ? screen.width / screen.height : 0,
          widthDelta: screen && imageBox ? Math.abs(imageBox.width - screen.width) : 99,
          heightDelta: screen && imageBox ? Math.abs(imageBox.height - screen.height) : 99,
        };
      }));
      expect(shots.length).toBeGreaterThan(0);
      for (const shot of shots) {
        expect(shot.fit).toBe('contain');
        expect(Math.abs(shot.screenRatio - 9 / 16), 'screenshot screen ratio').toBeLessThan(0.01);
        expect(shot.widthDelta, 'screenshot width').toBeLessThan(2);
        expect(shot.heightDelta, 'screenshot height').toBeLessThan(2);
      }
    }
  }
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
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => {
    (window as Window & { __cls?: number }).__cls = 0;
  });
  await scrollPin(page, 0);
  await scrollPin(page, 0.5);
  await scrollPin(page, 1);
  await scrollPin(page, 0);
  const cls = await page.evaluate(() => (window as Window & { __cls?: number }).__cls ?? 0);
  expect(cls).toBeLessThan(0.05);
});
