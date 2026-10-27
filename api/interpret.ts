/**
 * Smarter reading for the Lucento app (opt-in; see lucento-android docs/CAPTURE.md).
 *
 * POST /api/interpret with the signed-in user's Supabase access token. The body carries one composer message, today's
 * date, the main currency and the user's category and wallet names with their app-local ids. This function:
 *   1. checks the token with Supabase Auth (no service key: the user's own token and the publishable key),
 *   2. counts the request against the user's daily allowance (public.consume_ai_quota, migration 20261027090000),
 *   3. asks Gemini for structured rows and returns them. The app validates every row again and the user reviews it.
 * Nothing is stored here; request bodies are never logged.
 *
 * Environment (Vercel → Project → Settings → Environment Variables; see .env.example):
 *   GEMINI_API_KEY            secret, from Google AI Studio
 *   SUPABASE_URL              https://<project>.supabase.co
 *   SUPABASE_PUBLISHABLE_KEY  the same publishable key the app ships with
 *   AI_DAILY_LIMIT            optional, requests per user per UTC day (default 50)
 *   GEMINI_MODEL              optional (default gemini-2.5-flash)
 */

declare const process: { env: Record<string, string | undefined> };

interface NamedRef {
  id: number;
  name: string;
  kind: string;
  currency?: string | null;
}

interface InterpretRequest {
  text: string;
  today: string;
  currency: string;
  categories: NamedRef[];
  wallets: NamedRef[];
  defaultWalletId?: number | null;
  typeHint?: string | null;
}

const MAX_TEXT = 2000;
const MAX_REFS = 300;

const json = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

const SYSTEM = `You read short notes about personal money movements and return transactions as JSON.
Rules:
- One item per transaction the note describes. Ignore chatter.
- type: EXPENSE (money spent), INCOME (money received) or TRANSFER (between two of the user's own wallets).
- amount: a positive decimal string in major units exactly as written ("4.50", "1200"); omit it if no amount is given. Never invent amounts.
- walletId / toWalletId / categoryId: only ids from the lists provided; omit when unsure. Expense items use EXPENSE categories, income items INCOME categories.
- date: ISO yyyy-mm-dd, resolved against "today" for words like yesterday or last friday; omit if no date is mentioned.
- description: 2-6 words naming what it was, in the note's language.
- currency: an ISO code only if the note names a currency other than the main one.`;

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    items: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          description: { type: 'STRING' },
          type: { type: 'STRING', enum: ['EXPENSE', 'INCOME', 'TRANSFER'] },
          amount: { type: 'STRING' },
          walletId: { type: 'INTEGER' },
          toWalletId: { type: 'INTEGER' },
          categoryId: { type: 'INTEGER' },
          date: { type: 'STRING' },
          currency: { type: 'STRING' },
        },
        required: ['description', 'type'],
      },
    },
  },
  required: ['items'],
};

function parseRequest(body: unknown): InterpretRequest | null {
  if (typeof body !== 'object' || body === null) return null;
  const b = body as Record<string, unknown>;
  if (typeof b.text !== 'string' || b.text.trim() === '' || b.text.length > MAX_TEXT) return null;
  if (typeof b.today !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(b.today)) return null;
  if (typeof b.currency !== 'string' || !/^[A-Z]{3}$/.test(b.currency)) return null;
  const refs = (v: unknown): NamedRef[] | null => {
    if (!Array.isArray(v) || v.length > MAX_REFS) return null;
    const out: NamedRef[] = [];
    for (const r of v) {
      if (typeof r !== 'object' || r === null) return null;
      const o = r as Record<string, unknown>;
      if (typeof o.id !== 'number' || typeof o.name !== 'string' || typeof o.kind !== 'string') return null;
      out.push({ id: o.id, name: o.name.slice(0, 60), kind: o.kind.slice(0, 20), currency: typeof o.currency === 'string' ? o.currency.slice(0, 3) : null });
    }
    return out;
  };
  const categories = refs(b.categories);
  const wallets = refs(b.wallets);
  if (!categories || !wallets) return null;
  return {
    text: b.text,
    today: b.today,
    currency: b.currency,
    categories,
    wallets,
    defaultWalletId: typeof b.defaultWalletId === 'number' ? b.defaultWalletId : null,
    typeHint: typeof b.typeHint === 'string' ? b.typeHint.slice(0, 20) : null,
  };
}

export async function POST(request: Request): Promise<Response> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!geminiKey || !supabaseUrl || !publishableKey) return json(503, { error: 'not_configured' });

  const auth = request.headers.get('authorization') ?? '';
  if (!/^Bearer\s+\S+$/.test(auth)) return json(401, { error: 'sign_in_required' });

  // 1. Who is asking: Supabase checks the token.
  const user = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { apikey: publishableKey, Authorization: auth } });
  if (!user.ok) return json(401, { error: 'sign_in_required' });

  let parsed: InterpretRequest | null = null;
  try {
    parsed = parseRequest(await request.json());
  } catch {
    parsed = null;
  }
  if (!parsed) return json(400, { error: 'bad_request' });

  // 2. Today's allowance, counted in the user's own row by a database function they can't use to lower it.
  const limit = Number.parseInt(process.env.AI_DAILY_LIMIT ?? '', 10) || 50;
  const quota = await fetch(`${supabaseUrl}/rest/v1/rpc/consume_ai_quota`, {
    method: 'POST',
    headers: { apikey: publishableKey, Authorization: auth, 'Content-Type': 'application/json' },
    body: '{}',
  });
  if (!quota.ok) return json(502, { error: 'quota_unavailable' });
  const used = Number(await quota.json());
  if (!Number.isFinite(used)) return json(502, { error: 'quota_unavailable' });
  if (used > limit) return json(429, { error: 'daily_limit', limit });

  // 3. Gemini reads the note into structured rows.
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const prompt = JSON.stringify({
    note: parsed.text,
    today: parsed.today,
    mainCurrency: parsed.currency,
    defaultWalletId: parsed.defaultWalletId,
    typeHint: parsed.typeHint,
    categories: parsed.categories,
    wallets: parsed.wallets,
  });
  const gemini = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0, responseMimeType: 'application/json', responseSchema: SCHEMA },
    }),
  });
  if (!gemini.ok) return json(502, { error: 'model_unavailable' });
  const reply = (await gemini.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = reply.candidates?.[0]?.content?.parts?.[0]?.text;
  let items: unknown[] = [];
  try {
    const out = JSON.parse(text ?? '{}') as { items?: unknown };
    items = Array.isArray(out.items) ? out.items.slice(0, 30) : [];
  } catch {
    return json(502, { error: 'model_unreadable' });
  }
  return json(200, { items, remaining: Math.max(0, limit - used) });
}

export function GET(): Response {
  return json(405, { error: 'method_not_allowed' });
}
