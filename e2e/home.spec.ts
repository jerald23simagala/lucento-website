import { expect, test, type Page } from '@playwright/test';
import { faq, foreignWallets, looks, netWorthWithForeign, screens } from '../src/data/content';
import { compareGroups, planCards } from '../src/data/plans';

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

/**
 * Things that must stay inside their own section (owner review, 2026-11-08: "images overflow to some sections"):
 * every phone, card and drawing, both ways (the hero's cropped phones are checked as their stage). Dialogs are
 * checked while open, against the dialog's own box.
 */
const spills = (page: Page) =>
  page.evaluate(() => {
    const out: string[] = [];
    const name = (el: Element) => `${el.tagName.toLowerCase()}.${(el.getAttribute('class') ?? '').split(' ')[0]}`;
    const check = (box: DOMRect, el: Element, label: string, sideways: boolean) => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const across = sideways;
      if (r.top < box.top - 1 || r.bottom > box.bottom + 1 || (across && (r.left < box.left - 1 || r.right > box.right + 1))) {
        out.push(`${label}: ${name(el)} ${Math.round(r.top)}–${Math.round(r.bottom)} / ${Math.round(r.left)}–${Math.round(r.right)} outside ${Math.round(box.top)}–${Math.round(box.bottom)} / ${Math.round(box.left)}–${Math.round(box.right)}`);
      }
    };
    const open = document.querySelector('dialog.sheet[open]');
    if (open) {
      const box = open.getBoundingClientRect();
      const body = open.querySelector('.sheet-body')!;
      // inside a dialog, content scrolls vertically, so only the sides are checked
      open.querySelectorAll('.device, svg, table, .fx-ledger, .lanes').forEach((el) => {
        // The composer replica clips its own off-screen panes (the Transactions screen waiting to slide in).
        if (el.closest('.sim')) return;
        const r = el.getBoundingClientRect();
        if (r.width && (r.left < box.left - 1 || r.right > box.right + 1)) out.push(`${open.id}: ${name(el)} ${Math.round(r.left)}–${Math.round(r.right)} outside ${Math.round(box.left)}–${Math.round(box.right)}`);
      });
      if (body.scrollWidth > body.clientWidth + 1) out.push(`${open.id}: scrolls sideways`);
      return out;
    }
    document.querySelectorAll('main > section').forEach((section) => {
      const box = section.getBoundingClientRect();
      // The hero's phones are cropped by their stage on purpose; the stage itself must stay inside the hero.
      section.querySelectorAll('.stage, .device, .fcard, .type-demo, .plan').forEach((el) => {
        if (!el.closest('dialog') && !el.closest('.stage-layer')) check(box, el, section.id || name(section), true);
      });
    });
    document.querySelectorAll('.fcard').forEach((card) => {
      const box = card.getBoundingClientRect();
      card.querySelectorAll('.ficon, .fcard-title, .fcard-line, .fcard-go').forEach((el) => check(box, el, card.parentElement!.id, true));
    });
    return out;
  });

const scrollThrough = async (page: Page) => {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 40));
    }
    window.scrollTo(0, 0);
  });
};

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
    await expect(page.locator('#how')).toHaveCount(0);
    for (const id of ['features', 'record', 'themes', 'pricing', 'faq', 'multicurrency', 'shared', 'privacy']) {
      await expect(page.locator(`#${id}`), id).toHaveCount(1);
    }
    // Owner review 3: currencies and Shared are features, so the navigation names only the sections.
    await expect(page.locator('.nav a')).toHaveText(['Themes', 'Features', 'Pricing', 'FAQ']);
    await expect(page.locator('section#privacy')).toHaveCount(0);
    await page.locator('.nav').getByRole('link', { name: 'Pricing' }).click();
    await expect(page).toHaveURL(/#pricing$/);
    await expect(page.getByRole('heading', { level: 2, name: 'Free to start. Pro when you want more.' })).toBeInViewport();
    expect(errors).toEqual([]);
  });

  test('the hero stage shows the Dashboard in focus, Budget and Wallets beside it, and no more', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const stage = page.locator('[data-stage]');
    const centre = stage.locator('.sp-centre img');
    await expect(centre).toHaveAttribute('alt', screens.find((s) => s.id === 'dashboard')!.alt);
    await expect(centre).toHaveAttribute('src', /s-dashboard/);
    await expect(centre).toBeInViewport();
    // Sharp: no blur on the Dashboard or its two companions; the peripheral pair is out of focus and silent.
    for (const sel of ['.sp-centre', '.sp-side.is-left', '.sp-side.is-right']) {
      expect(await stage.locator(sel).evaluate((el) => getComputedStyle(el).filter), sel).toBe('none');
    }
    await expect(stage.locator('.sp-side.is-left img')).toHaveAttribute('src', /s-budget/);
    await expect(stage.locator('.sp-side.is-right img')).toHaveAttribute('src', /s-wallets/);
    for (const far of await stage.locator('.sp-far').all()) {
      await expect(far).toHaveAttribute('aria-hidden', 'true');
      expect(await far.evaluate((el) => getComputedStyle(el).filter)).toContain('blur');
    }
    // Five phones at most, and no tabs, arrows or captions that enumerate the app.
    await expect(stage.locator('.device')).toHaveCount(5);
    await expect(page.locator('.hero [data-tab], .hero [data-prev], .hero [data-next]')).toHaveCount(0);
    // The supporting phones are cropped: about two thirds of each is on show.
    await page.waitForTimeout(1600); // after the entrance
    const shown = await stage.evaluate((el) => {
      const box = el.getBoundingClientRect();
      const centre = el.querySelector('.sp-centre .device')!.getBoundingClientRect();
      return [...el.querySelectorAll('.sp-side .device')].map((d) => {
        const r = d.getBoundingClientRect();
        const w = Math.max(0, Math.min(r.right, box.right) - Math.max(r.left, box.left)) - Math.max(0, Math.min(r.right, centre.right) - Math.max(r.left, centre.left));
        const h = Math.max(0, Math.min(r.bottom, box.bottom) - Math.max(r.top, box.top));
        return (w * h) / (r.width * r.height);
      });
    });
    for (const share of shown) {
      expect(share).toBeGreaterThan(0.55);
      expect(share).toBeLessThan(0.75);
    }
  });

  test('on a phone the hero leads with the Dashboard and stays short', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.locator('.sp-centre .device')).toBeVisible();
    await expect(page.locator('.sp-far').first()).toBeHidden();
    const [hero, cta] = await page.evaluate(() => [
      document.querySelector('.hero')!.getBoundingClientRect().height,
      document.querySelector('.hero .play')!.getBoundingClientRect().bottom,
    ]);
    expect(cta).toBeLessThan(844); // the call to action is on the first screen
    expect(hero).toBeLessThan(844 * 1.35);
    expect(await overflow(page)).toBeLessThanOrEqual(1);
  });

  test('screens kept back from the site are not published anywhere on it', async ({ page, request }) => {
    await page.goto('/');
    const html = await page.content();
    for (const file of ['s-ask', 's-scheduled', 'f-card', 'f-report', 'f-presets', 'f-composer', 'f-categories', 'mc-usd']) {
      expect(html, file).not.toContain(`/screens/${file}-`);
      expect((await request.get(`/screens/${file}-560.webp`)).status(), file).toBe(404);
    }
    for (const file of ['f-shown-720.webp', 'f-hidden-720.webp']) expect((await request.get(`/screens/${file}`)).status(), file).toBe(404);
    await expect(page.locator('.matrix')).toHaveCount(0);
  });

  test('no feature dialog shows a screen flat and whole', async ({ page }) => {
    await page.goto('/');
    // Screenshots only: the composer replica (Type your way) is a working copy of the app, not a capture.
    const phones = page.locator('dialog .device:not(.type-phone .device)');
    expect(await phones.count()).toBeGreaterThan(5);
    for (const phone of await phones.all()) {
      await expect(phone).toHaveClass(/is-(window|focus|angle|lift)/);
      // Dialog screens stop at 560 px files: less detail to trace.
      expect(await phone.locator('img').first().getAttribute('srcset')).not.toContain('-720.');
    }
    await expect(page.locator('#themes .device')).toHaveClass(/is-angle/);
    // The screens are dark, so every phone frame is light (owner review 3).
    const frames = await page.locator('.device').evaluateAll((els) => els.map((el) => {
      const [r, g, b] = getComputedStyle(el).backgroundColor.match(/\d+/g)!.map(Number);
      return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    }));
    for (const lum of frames) expect(lum).toBeGreaterThan(0.8);
    await expect(page.locator('footer')).toContainText('App screens © Lucento');
    // The closing band's buttons keep clear of the footer (owner, 2026-11-08).
    const gap = await page.evaluate(() => {
      const band = document.querySelector('.finale')!.getBoundingClientRect();
      const play = document.querySelector('.finale .play')!.getBoundingClientRect();
      return band.bottom - play.bottom;
    });
    expect(gap).toBeGreaterThanOrEqual(96);
  });

  test('every phone uses the one template, with a mock status bar', async ({ page }) => {
    await page.goto('/');
    // One read, so the carousel's loop copies (added after load) can't arrive in between.
    const [devices, bars] = await page.evaluate(() => [
      document.querySelectorAll('main .device').length,
      document.querySelectorAll('main .device .statusbar').length,
    ]);
    expect(devices).toBeGreaterThan(10);
    expect(bars).toBe(devices);
    const time = await page.locator('main .device .statusbar .sb-time').first().evaluate((el) => getComputedStyle(el, '::before').content);
    expect(time).toBe('"9:41"');
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

  test('security and privacy opens as a feature: hide amounts swaps to the app’s own hidden view', async ({ page }) => {
    await page.goto('/');
    await page.locator('#privacy .fcard-link').click();
    const sheet = page.locator('dialog#about-privacy');
    await expect(sheet).toBeVisible();
    // Every send path from the policy's short version is still listed, with the link to the policy.
    await expect(sheet.locator('.ledger > div')).toHaveCount(8);
    await expect(sheet.getByRole('link', { name: 'privacy policy' })).toHaveAttribute('href', '/privacy');
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

  test('type your way: send, give the shampoo a category, save, and Transactions adds up', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    // Owner review 3: Type your way is a feature card; the working replica opens in its dialog.
    await page.locator('#record .fcard-link').click();
    await expect(page.locator('dialog#about-record')).toBeVisible();
    const demo = page.locator('dialog#about-record [data-type-demo]');
    const sim = demo.locator('[data-sim]');
    await expect(sim.locator('.sim-typed')).toHaveText('Lunch 250Groceries 1,200Shampoo 180');
    await demo.getByRole('button', { name: 'Send it' }).click();
    await expect(sim.locator('.sim-reply-line .when-open')).toHaveText('Here are 3 transactions — 1 needs a look:');
    // The button that was pressed goes away; focus moves on to the next thing to do.
    await expect(demo.locator('.demo-cat').first()).toBeFocused();
    await expect(sim.locator('.sim-bar-title .when-open')).toBeVisible();
    await expect(sim.locator('.sim-bar-title .when-open')).toHaveText('1 transaction is incomplete');
    const shownTotals = () => sim.locator('.sim-bar small').evaluate((el) => (el as HTMLElement).innerText);
    await expect.poll(shownTotals).toBe(`Expenses ${MINUS}₱1,450.00`);
    await expect(sim.locator('.sim-save')).toBeDisabled();
    await expect.poll(() => sim.locator('.sim-save').evaluate((el) => (el as HTMLElement).innerText)).toBe('Fix 1 highlighted to save');
    // The phone's own category menu
    await sim.getByRole('button', { name: 'Choose category' }).click();
    await sim.getByRole('menuitem', { name: 'Personal care' }).click();
    await expect(sim.locator('.sim-bar-title .when-ready')).toBeVisible();
    await expect(sim.locator('.sim-bar-title .when-ready')).toHaveText('3 transactions ready');
    await expect.poll(shownTotals).toBe(`Expenses ${MINUS}₱1,630.00`);
    await expect(demo.locator('.demo-cat[data-cat="personal"]')).toHaveAttribute('aria-pressed', 'true');
    await demo.locator('.demo-action[data-act="save"]').click();
    await expect(demo).toHaveAttribute('data-state', 'saved');
    const list = sim.locator('[data-screen="list"]');
    await expect(list).not.toHaveAttribute('aria-hidden', 'true');
    await expect(list.locator('.sim-snack')).toHaveText('3 transactions saved');
    // The demo month (11 transactions, expenses −₱22,979.90) with the three rows added.
    await expect(list.locator('.sim-count')).toContainText('14 transactions');
    await expect(list.locator('.sim-sums')).toContainText(`${MINUS}₱24,609.90`);
    await expect(list.locator('.sim-sums')).toContainText('+₱17,390.10');
    await expect(list.locator('.sim-dayhead')).toContainText(`${MINUS}₱3,995.90`);
    await expect(list.locator('.sim-tx').first()).toContainText('Shampoo');
    await expect(list.locator('.sim-tx').first()).toContainText('Personal care');
    // And again, from the start.
    await demo.getByRole('button', { name: 'Try it again' }).click();
    await expect(demo).toHaveAttribute('data-state', 'ready');
    await expect(list.locator('.sim-count')).toContainText('11 transactions');
    await expect(demo.getByRole('button', { name: 'Send it' })).toBeFocused();
  });

  test('each feature card opens its details in a dialog that closes and returns focus', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 860 });
    await page.goto('/');
    const links = page.locator('.fcard-link');
    await expect(links).toHaveCount(12);
    // Identical cards, one line each: icon, name and a single line; the details only on click (owner review 3).
    const boxes = await page.locator('.fcard').evaluateAll((cards) => cards.map((c) => {
      const r = c.getBoundingClientRect();
      const line = c.querySelector('.fcard-line')!;
      return { w: Math.round(r.width), h: Math.round(r.height), lines: Math.round(line.getBoundingClientRect().height / parseFloat(getComputedStyle(line).lineHeight)), icon: !!c.querySelector('.ficon svg') };
    }));
    expect(new Set(boxes.map((b) => `${b.w}x${b.h}`)).size).toBe(1);
    for (const b of boxes) expect(b).toMatchObject({ lines: 1, icon: true });
    await expect(page.locator('.fcard img, .fcard .device, .fcard .ticks')).toHaveCount(0);
    for (const link of await links.all()) {
      const id = (await link.getAttribute('data-dialog'))!;
      const dialog = page.locator(`dialog#${id}`);
      await link.scrollIntoViewIfNeeded();
      await link.click();
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole('heading', { level: 2 })).toBeVisible();
      await page.waitForTimeout(350);
      expect(await spills(page), id).toEqual([]);
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
      await expect(link).toBeFocused();
    }
    // The close button and a click on the backdrop close it too.
    await links.first().click();
    await page.getByRole('button', { name: /^Close / }).first().click();
    await expect(page.locator('dialog[open]')).toHaveCount(0);
    await links.first().click();
    await page.mouse.click(8, 8);
    await expect(page.locator('dialog[open]')).toHaveCount(0);
  });

  test('the offline dialog points to every send path and the policy, and its link swaps dialogs', async ({ page }) => {
    await page.goto('/');
    await page.locator('#offline .fcard-link').click();
    const offline = page.locator('dialog#about-offline');
    await expect(offline).toContainText('billing component');
    await expect(offline).toContainText('Crash reports and usage counts stay off');
    await expect(offline.getByRole('link', { name: 'privacy policy' })).toHaveAttribute('href', '/privacy');
    await offline.getByRole('link', { name: 'What leaves your phone' }).click();
    await expect(page.locator('dialog#about-privacy')).toBeVisible();
    await expect(page.locator('dialog[open]')).toHaveCount(1);
  });

  test('on a phone the composer dialog scrolls its body, never its own box', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.locator('#record .fcard-link').click();
    const dialog = page.locator('dialog#about-record');
    await dialog.getByRole('button', { name: 'Send it' }).click();
    await page.waitForTimeout(1500);
    expect(await dialog.evaluate((d) => d.scrollTop)).toBe(0);
    await expect(dialog.getByRole('button', { name: /^Close / })).toBeInViewport({ ratio: 1 });
  });

  test('deep links open their dialog', async ({ page }) => {
    await page.goto('/#about-privacy');
    await expect(page.locator('dialog#about-privacy')).toBeVisible();
    await expect.poll(() => page.locator('dialog#about-privacy').evaluate((d) => d.matches(':modal'))).toBe(true);
    // Closing leaves no copy of it in the page, drops the hash and focuses the card that opens it.
    await page.keyboard.press('Escape');
    await expect(page.locator('dialog#about-privacy')).toBeHidden();
    // The dialog's close event (which drops the hash) is dispatched as a task after the dialog hides: wait for it.
    await expect.poll(() => new URL(page.url()).hash).toBe('');
    await expect(page.locator('#privacy .fcard-link')).toBeFocused();
  });

  test('a link to a dialog opens it', async ({ page }) => {
    await page.goto('/#about-shared');
    await expect(page.locator('dialog#about-shared')).toBeVisible();
    await expect.poll(() => page.locator('dialog#about-shared').evaluate((d) => d.matches(':modal'))).toBe(true);
    await expect(page.locator('dialog#about-shared .ticks')).toBeVisible();
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
    // Pro opens on yearly billing, with its saving; monthly is one tap away.
    const pro = page.locator('.plan-pro');
    await pro.scrollIntoViewIfNeeded();
    await expect(pro.getByRole('radio', { name: /Yearly/ })).toBeChecked();
    await expect(pro.locator('.price-yearly')).toBeVisible();
    await expect(pro.locator('.price-yearly .plan-price')).toHaveText(/₱1,190\s*a year/);
    await expect(pro.locator('.save-pill')).toHaveText('Save 33%');
    await expect(pro.locator('.price-yearly .saving')).toHaveText('₱598 less than paying monthly for a year');
    await pro.locator('label', { hasText: 'Monthly' }).click();
    await expect(pro.locator('.price-monthly .plan-price')).toHaveText(/₱149\s*a month/);
    await expect(pro.locator('.price-yearly')).toBeHidden();
    await expect(page.locator('.plan-lifetime .plan-price')).toHaveText(/₱3,490\s*once/);
    // Nothing promises a free plan without ads (owner, 2026-11-08: ads may come to Free).
    await expect(page.locator('main')).not.toContainText(/no ads/i);
    // The comparison opens in a dialog, not inline.
    const compare = page.locator('dialog#compare');
    await expect(compare).toBeHidden();
    await page.getByRole('link', { name: 'Compare the plans' }).first().click();
    await expect(compare).toBeVisible();
    await expect(compare.locator('tbody tr:not(:has(th[scope="rowgroup"]))')).toHaveCount(compareGroups.reduce((n, g) => n + g.rows.length, 0));
    await page.keyboard.press('Escape');
    await expect(compare).toBeHidden();
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

  test('nothing spills out of its section, card or dialog', async ({ page }) => {
    for (const [width, height] of [[360, 760], [768, 1000], [1024, 768], [1440, 900]]) {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      await scrollThrough(page);
      expect(await spills(page), `${width}px`).toEqual([]);
    }
    // Dialogs on a phone
    await page.setViewportSize({ width: 360, height: 760 });
    await page.goto('/');
    for (const id of ['about-multicurrency', 'about-shared', 'about-intelligence', 'about-goals', 'about-offline', 'compare']) {
      await page.evaluate((d) => (document.getElementById(d) as HTMLDialogElement).showModal(), id);
      await page.waitForTimeout(300);
      expect(await spills(page), `${id} at 360px`).toEqual([]);
      await page.keyboard.press('Escape');
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
    await expect(page.locator('.sp-centre img')).toBeVisible();
    await page.locator('#themes label.look', { hasText: 'Aurora' }).click();
    expect(await visibleVariant(page)).toEqual(['aurora-light']);
    expect(await overflow(page)).toBeLessThanOrEqual(1);
    // A card's details are a link: without the dialog script it shows the details in place.
    await page.locator('#wallets .fcard-link').click();
    await expect(page.locator('#about-wallets')).toBeVisible();
    await context.close();
  });

  test('reduced motion: nothing on the page animates', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.mouse.wheel(0, 3000);
    // Try the composer too: its steps must not animate either.
    await page.locator('#record .fcard-link').click();
    await page.locator('[data-type-demo]').getByRole('button', { name: 'Send it' }).click();
    await page.waitForTimeout(400);
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

test('nothing on the site promises no ads (owner, 2026-11-08: ads may come to Free)', async ({ page }) => {
  for (const path of ['/', '/privacy', '/terms']) {
    await page.goto(path);
    const text = (await page.locator('body').textContent()) ?? '';
    expect(text, path).not.toMatch(/no ads|ad-free|never shows ads|without ads/i);
  }
});

test('privacy, terms, deletion and confirmation pages respond', async ({ page }) => {
  for (const path of ['/privacy', '/terms', '/delete-account', '/auth/confirmed']) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBeLessThan(400);
  }
});

test('old addresses lead to their new places', async ({ page }) => {
  for (const old of ['/how-to', '/demo']) {
    await page.goto(old);
    await expect(page).toHaveURL(/\/$/);
  }
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
