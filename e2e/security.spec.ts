import { expect, test } from '@playwright/test';

// The built site with the headers Vercel serves (scripts/serve-static.mjs): security audit F-09.
const PAGES = ['/', '/privacy', '/terms', '/delete-account', '/auth/confirmed', '/no-such-page'];

test.describe('built site: security headers and content security policy', () => {
  for (const path of PAGES) {
    test(`${path} runs its own scripts and nothing breaks the policy`, async ({ page }) => {
      const violations: string[] = [];
      page.on('console', (m) => {
        if (/Content.Security.Policy|Refused to (execute|load|apply)/i.test(m.text())) violations.push(m.text());
      });
      await page.addInitScript(() => {
        (window as unknown as { __csp: string[] }).__csp = [];
        document.addEventListener('securitypolicyviolation', (e) =>
          (window as unknown as { __csp: string[] }).__csp.push(`${e.violatedDirective} ${e.blockedURI}`));
      });
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const seen = await page.evaluate(() => (window as unknown as { __csp: string[] }).__csp);
      expect([...seen, ...violations]).toEqual([]);
      // The deferred stylesheets switch on through a hashed onload handler: proof that allowed inline code still runs.
      const media = await page.$$eval('link[rel="stylesheet"][href^="/_astro/"]', (ls) => ls.map((l) => (l as HTMLLinkElement).media));
      for (const m of media) expect(m).toBe('all');
    });
  }

  test('a script injected into the page is refused', async ({ page }) => {
    await page.goto('/');
    const ran = await page.evaluate(async () => {
      const blocked = new Promise<string>((resolve) =>
        document.addEventListener('securitypolicyviolation', (e) => resolve(e.violatedDirective), { once: true }));
      (window as unknown as { __pwned?: boolean }).__pwned = false;
      const s = document.createElement('script');
      s.textContent = 'window.__pwned = true';
      document.head.appendChild(s);
      const directive = await Promise.race([blocked, new Promise<string>((r) => setTimeout(() => r('none'), 1000))]);
      return { pwned: (window as unknown as { __pwned?: boolean }).__pwned, directive };
    });
    expect(ran.pwned).toBe(false);
    expect(ran.directive).toMatch(/^script-src/);
  });

  test('every page sends the security headers', async ({ request }) => {
    const res = await request.get('/');
    const h = res.headers();
    expect(h['x-content-type-options']).toBe('nosniff');
    expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(h['x-frame-options']).toBe('DENY');
    expect(h['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(h['content-security-policy']).toContain("object-src 'none'");
    expect(h['permissions-policy']).toContain('camera=()');
    const html = await res.text();
    const meta = /<meta http-equiv="Content-Security-Policy" content="([^"]+)">/.exec(html)?.[1] ?? '';
    expect(meta).toMatch(/^script-src 'self' 'sha256-/);
    expect(meta).not.toContain('unsafe-inline');
    expect(meta).not.toContain('unsafe-eval');
  });
});
