/**
 * Method handling for the API routes (security audit F-08): a method a route doesn't implement used to reach Astro with
 * no handler and crash the function (`OPTIONS` answered 500 FUNCTION_INVOCATION_FAILED). Each route now exports
 * `ALL = methodGuard([...])`, which Astro calls for every method the route has no handler of its own for.
 *
 * `OPTIONS` answers 204 with `Allow` and nothing else: no `Access-Control-*` header, so a cross-origin browser preflight
 * still fails (the app is a native client and never needs CORS). Every other method answers 405 with `Allow`.
 */

import type { APIRoute } from 'astro';

export function methodGuard(allowed: readonly string[]): APIRoute {
  const allow = [...allowed, 'OPTIONS'].join(', ');
  return ({ request }) =>
    request.method === 'OPTIONS'
      ? new Response(null, { status: 204, headers: { Allow: allow, 'Cache-Control': 'no-store' } })
      : new Response(JSON.stringify({ error: 'method_not_allowed' }), {
          status: 405,
          headers: { Allow: allow, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        });
}
