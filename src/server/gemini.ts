/**
 * Gemini calls for Lucento's proxies (/api/interpret, /api/ask), without depending on one model Google may retire or
 * run out of capacity for.
 *
 * Candidates: GEMINI_MODEL when set, then this key's Flash models from Gemini's models list (cached per function
 * instance) — the newest stable "gemini-X.Y-flash" first, then older ones, the "gemini-flash-latest" alias, other Flash
 * text models, and Flash-Lite last. A call that fails with 404 (retired), 429, 500, 503 or 504 (no capacity right now)
 * moves to the next candidate, within the caller's time budget (the app gives up after 15–30 s). A model that just had
 * no capacity is tried last for the next two minutes (per function instance), so later requests start with one that
 * answers instead of spending seconds on the same busy models (owner round 9: Ask Lucento answers failed while the
 * newest Flash models answered 429/503). Each call has a hard timeout, so one slow model can't outlast the app's wait.
 * Owner test round 2 (2026-11-09): during a capacity spell every Flash model answered 503 or ran out the clock, the
 * first slow one using the whole wait. So each call except the last now gets at most CALL_CAP_MS, leaving time for
 * another model; the newest Flash-Lite (lighter, usually with room) is tried third; and a model that answered 404 is
 * skipped for this function instance instead of costing every request a call.
 * Thinking is kept low: Gemini 2.x takes a thinking budget, later models a thinking level; if a model refuses the
 * setting (400) the call is retried once without it. Nothing here logs prompts or answers — only statuses and model
 * names.
 */

declare const process: { env: Record<string, string | undefined> };

const API = 'https://generativelanguage.googleapis.com/v1beta';
const CACHE_MS = 6 * 60 * 60 * 1000;
const FALLBACK_MODEL = 'gemini-flash-latest';
/** Statuses that mean "try another model", not "this request is wrong". */
const TRY_NEXT = new Set([404, 429, 500, 503, 504]);
/** Statuses that mean "no capacity right now" (504 also stands for a call that timed out here). */
const BUSY = new Set([429, 500, 503, 504]);
const MAX_MODELS = 4;
/** How long a model that had no capacity is tried last. */
const BUSY_MS = 2 * 60 * 1000;
/** A call may run this long past the caller's budget for trying new models, and never less than MIN_CALL_MS. */
const CALL_GRACE_MS = 4_000;
const MIN_CALL_MS = 3_000;
/** The longest a call may take while another model could still be tried in time. */
export const CALL_CAP_MS = 11_000;

let cached: { models: string[]; at: number } | null = null;
/** Model → until when it is tried last. Per function instance, like the models list. */
const busyUntil = new Map<string, number>();
/** Models that answered 404 (retired or not offered to this key), skipped until the function instance is recycled. */
const retired = new Set<string>();

/** [models] with the ones that had no capacity in the last two minutes moved to the end, each group in its own order. */
export function preferAvailable(models: string[], now: number, busy: Map<string, number> = busyUntil): string[] {
  const isBusy = (m: string) => (busy.get(m) ?? 0) > now;
  return [...models.filter((m) => !isBusy(m)), ...models.filter(isBusy)];
}

function markBusy(model: string): void {
  busyUntil.set(model, Date.now() + BUSY_MS);
}

/** "3.10" → [3, 10]: versions compare number by number, so 3.10 is newer than 3.8. */
function version(v: string): number[] {
  return v.split('.').map((n) => Number.parseInt(n, 10) || 0);
}

function compareVersions(a: string, b: string): number {
  const x = version(a);
  const y = version(b);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) - (y[i] ?? 0);
  }
  return 0;
}

const SPECIAL = /image|audio|live|tts|preview|exp|embedding|thinking/;

/**
 * This list's Flash text models in the order to try them ("models/…" names allowed): stable "gemini-X.Y-flash" newest
 * first; the "gemini-flash-latest" alias; other Flash models (dated or suffixed, not preview or special-purpose);
 * stable Flash-Lite newest first; the "gemini-flash-lite-latest" alias.
 */
export function rankFlashModels(names: string[]): string[] {
  const plain = [...new Set(names.map((n) => n.replace(/^models\//, '')))];
  const byVersion = (re: RegExp, filter: (n: string) => boolean = () => true) =>
    plain
      .map((name) => ({ name, m: re.exec(name) }))
      .filter((x): x is { name: string; m: RegExpExecArray } => x.m !== null && filter(x.name))
      .sort((a, b) => compareVersions(b.m[1], a.m[1]))
      .map((x) => x.name);
  const stable = byVersion(/^gemini-(\d+(?:\.\d+)*)-flash$/);
  const other = byVersion(/^gemini-(\d+(?:\.\d+)*)-flash-[\w.-]+$/, (n) => !n.includes('lite') && !SPECIAL.test(n));
  const lite = byVersion(/^gemini-(\d+(?:\.\d+)*)-flash-lite$/);
  // The newest Flash-Lite comes third: when the Flash models have no capacity, a lighter model usually still answers.
  return [
    ...stable.slice(0, 2),
    ...lite.slice(0, 1),
    ...stable.slice(2),
    ...(plain.includes(FALLBACK_MODEL) ? [FALLBACK_MODEL] : []),
    ...other,
    ...lite.slice(1),
    ...(plain.includes('gemini-flash-lite-latest') ? ['gemini-flash-lite-latest'] : []),
  ];
}

/** The first model to try from a models list, or null when it has no Flash text model. */
export function pickFlashModel(names: string[]): string | null {
  return rankFlashModels(names)[0] ?? null;
}

async function listModels(key: string): Promise<string[]> {
  const res = await fetch(`${API}/models?pageSize=1000`, { headers: { 'x-goog-api-key': key } });
  if (!res.ok) {
    console.error(`gemini: models list answered HTTP ${res.status}`);
    return [];
  }
  const body = (await res.json()) as { models?: { name?: string; supportedGenerationMethods?: string[] }[] };
  return (body.models ?? [])
    .filter((m) => typeof m.name === 'string' && (m.supportedGenerationMethods ?? []).includes('generateContent'))
    .map((m) => m.name as string);
}

/** The models to try, in order: GEMINI_MODEL, then the ranked list (cached; [refresh] reads it again). */
async function candidates(key: string, refresh: boolean): Promise<string[]> {
  if (refresh || !cached || Date.now() - cached.at >= CACHE_MS) {
    const ranked = rankFlashModels(await listModels(key).catch(() => []));
    if (ranked.length > 0) {
      cached = { models: ranked, at: Date.now() };
      console.log(`gemini: candidates ${ranked.slice(0, MAX_MODELS).join(', ')}`);
    }
  }
  const configured = process.env.GEMINI_MODEL?.trim();
  const list = [...(configured ? [configured] : []), ...(cached?.models ?? [FALLBACK_MODEL])];
  return [...new Set(list)].filter((m) => !retired.has(m));
}

/** How long one call may run: up to the deadline for the last try, otherwise at most CALL_CAP_MS (never under MIN_CALL_MS). */
export function callTimeout(deadline: number, now: number, last: boolean): number {
  const left = deadline - now;
  return Math.max(MIN_CALL_MS, last ? left : Math.min(left, CALL_CAP_MS));
}

/** Gemini 2.x: no thinking pass at all. Later models: the lowest standard level. */
export function lowThinking(model: string): Record<string, unknown> {
  return /^gemini-2\./.test(model) ? { thinkingBudget: 0 } : { thinkingLevel: 'low' };
}

export interface GenerateRequest {
  systemInstruction: unknown;
  contents: unknown;
  /** Without thinkingConfig — added here per model. A temperature is kept for Gemini 2.x only (later models are tuned for their default). */
  generationConfig: Record<string, unknown>;
}

export type GenerateResult = { ok: true; text: string | undefined; model: string } | { ok: false; status: number; model: string };

/**
 * generateContent, moving through the candidate models as described above. [label] prefixes the status-only log lines
 * ("ask", "interpret"); no new model is tried once [budgetMs] has passed, so the caller can still answer in time.
 */
export async function generate(key: string, request: GenerateRequest, label: string, budgetMs = 20_000): Promise<GenerateResult> {
  const started = Date.now();
  // Past this no call may still be running: the app stops waiting soon after.
  const deadline = started + budgetMs + CALL_GRACE_MS;
  let models = preferAvailable(await candidates(key, false), started);
  let refreshed = false;
  let last: GenerateResult = { ok: false, status: 502, model: models[0] ?? FALLBACK_MODEL };
  let tried = 0;
  for (let i = 0; i < models.length && tried < MAX_MODELS; i++) {
    if (tried > 0 && Date.now() - started > budgetMs) break;
    const model = models[i];
    tried++;
    let thinking = true;
    for (;;) {
      const legacy = /^gemini-2\./.test(model);
      const { temperature, ...rest } = request.generationConfig;
      const generationConfig = {
        ...rest,
        ...(legacy && temperature !== undefined ? { temperature } : {}),
        ...(thinking ? { thinkingConfig: lowThinking(model) } : {}),
      };
      let res: Response;
      try {
        res = await fetch(`${API}/models/${encodeURIComponent(model)}:generateContent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
          body: JSON.stringify({ systemInstruction: request.systemInstruction, contents: request.contents, generationConfig }),
          signal: AbortSignal.timeout(callTimeout(deadline, Date.now(), tried >= MAX_MODELS || i === models.length - 1)),
        });
      } catch {
        // Timed out here, or the connection failed: no answer from this model in time.
        console.error(`${label}: Gemini call timed out or failed for model ${model}`);
        last = { ok: false, status: 504, model };
        markBusy(model);
        break;
      }
      if (res.ok) {
        const reply = (await res.json()) as { candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[] };
        const text = reply.candidates?.[0]?.content?.parts?.find((p) => typeof p.text === 'string' && !p.thought)?.text;
        if (tried > 1) console.log(`${label}: answered by ${model}`);
        return { ok: true, text, model };
      }
      // Status only — never the request or response body, which carry the user's words or figures.
      console.error(`${label}: Gemini answered HTTP ${res.status} for model ${model}`);
      last = { ok: false, status: res.status, model };
      if (BUSY.has(res.status)) markBusy(model);
      if (res.status === 404) retired.add(model);
      if (res.status === 400 && thinking) {
        thinking = false;
        continue;
      }
      break;
    }
    if (!TRY_NEXT.has(last.status)) return last;
    // A retired model may mean the cached list is stale: read it again once and carry on with what it offers now.
    if (last.status === 404 && !refreshed) {
      refreshed = true;
      const done = new Set(models.slice(0, i + 1));
      models = [...models.slice(0, i + 1), ...preferAvailable((await candidates(key, true)).filter((m) => !done.has(m)), Date.now())];
    }
  }
  return last;
}
