/**
 * Gemini calls for Lucento's proxies (/api/interpret, /api/ask), without pinning a model Google may retire.
 *
 * The model is GEMINI_MODEL when set; otherwise the newest stable Flash model this key can use, from Gemini's models
 * list (cached per function instance). When Google answers 404 — the model was retired, as gemini-2.5-flash was in
 * 2026 — the list is read again and the call retried once with what it offers now. Thinking is kept low (answers are
 * short and the app waits 15–30 s): Gemini 2.x takes a thinking budget, later models a thinking level; if a model
 * refuses the setting (400) the call is retried once without it. Nothing here logs prompts or answers.
 */

declare const process: { env: Record<string, string | undefined> };

const API = 'https://generativelanguage.googleapis.com/v1beta';
const CACHE_MS = 6 * 60 * 60 * 1000;
const FALLBACK_MODEL = 'gemini-flash-latest';

let cached: { model: string; at: number } | null = null;

/** "3.10" → [3, 10]: versions compare number by number, so 3.10 is newer than 3.8. */
function version(v: string): number[] {
  return v.split('.').map((n) => Number.parseInt(n, 10) || 0);
}

function newer(a: string, b: string): boolean {
  const x = version(a);
  const y = version(b);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) > (y[i] ?? 0);
  }
  return false;
}

/**
 * The model to use from a models list ("models/…" names allowed): the newest stable "gemini-X.Y-flash"; else the
 * hot-swapped "gemini-flash-latest" alias; else the newest other Flash text model that isn't a lite, preview or
 * special-purpose (image, audio, live, TTS) variant. Null when the list has none.
 */
export function pickFlashModel(names: string[]): string | null {
  const plain = names.map((n) => n.replace(/^models\//, ''));
  let best: { name: string; v: string } | null = null;
  for (const name of plain) {
    const m = /^gemini-(\d+(?:\.\d+)*)-flash$/.exec(name);
    if (m && (!best || newer(m[1], best.v))) best = { name, v: m[1] };
  }
  if (best) return best.name;
  if (plain.includes(FALLBACK_MODEL)) return FALLBACK_MODEL;
  for (const name of plain) {
    const m = /^gemini-(\d+(?:\.\d+)*)-flash(?:-[\w.-]+)?$/.exec(name);
    if (!m || /lite|image|audio|live|tts|preview|exp|embedding/.test(name)) continue;
    if (!best || newer(m[1], best.v)) best = { name, v: m[1] };
  }
  return best?.name ?? null;
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

async function resolveModel(key: string, refresh: boolean): Promise<string> {
  const configured = process.env.GEMINI_MODEL?.trim();
  if (configured && !refresh) return configured;
  if (cached && !refresh && Date.now() - cached.at < CACHE_MS) return cached.model;
  const picked = pickFlashModel(await listModels(key).catch(() => []));
  if (picked) {
    cached = { model: picked, at: Date.now() };
    console.log(`gemini: using ${picked}`);
    return picked;
  }
  return configured || FALLBACK_MODEL;
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

/** generateContent with the resolved model; [label] prefixes the status-only log lines ("ask", "interpret"). */
export async function generate(key: string, request: GenerateRequest, label: string): Promise<GenerateResult> {
  let model = await resolveModel(key, false);
  let thinking = true;
  let refreshed = false;
  for (let attempt = 0; attempt < 3; attempt++) {
    const legacy = /^gemini-2\./.test(model);
    const { temperature, ...rest } = request.generationConfig;
    const generationConfig = {
      ...rest,
      ...(legacy && temperature !== undefined ? { temperature } : {}),
      ...(thinking ? { thinkingConfig: lowThinking(model) } : {}),
    };
    const res = await fetch(`${API}/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({ systemInstruction: request.systemInstruction, contents: request.contents, generationConfig }),
    });
    if (res.ok) {
      const reply = (await res.json()) as { candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[] };
      const text = reply.candidates?.[0]?.content?.parts?.find((p) => typeof p.text === 'string' && !p.thought)?.text;
      return { ok: true, text, model };
    }
    // Status only — never the request or response body, which carry the user's words or figures.
    console.error(`${label}: Gemini answered HTTP ${res.status} for model ${model}`);
    if (res.status === 404 && !refreshed) {
      refreshed = true;
      cached = null;
      const next = await resolveModel(key, true);
      if (next === model) return { ok: false, status: res.status, model };
      model = next;
    } else if (res.status === 400 && thinking) {
      thinking = false;
    } else {
      return { ok: false, status: res.status, model };
    }
  }
  return { ok: false, status: 502, model };
}
