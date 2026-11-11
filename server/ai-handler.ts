import {
  AiRequestSchema,
  resultForTask,
  type AiErrorCode,
  type AiRequest,
} from '../shared/ai-contracts.js';
import { jsonShapeFor, promptFor } from '../shared/prompts.js';

interface HandleResult {
  status: number;
  body: unknown;
}

interface RateBucket {
  windowStart: number;
  count: number;
}

const RATE_WINDOW_MS = 60_000;
const RATE_MAX_PER_WINDOW = 30;
const FETCH_TIMEOUT_MS = 25_000;
const REQUEST_BUDGET_MS = 55_000;
const DEFAULT_MODEL = 'gemini-3.5-flash-lite';
const DEFAULT_FALLBACK_MODEL = 'gemini-3.1-flash-lite';
const MODEL_FALLBACK_STATUSES = new Set([404, 429, 500, 502, 503, 504]);
const MODEL_RETRY_STATUSES = new Set([500, 502, 503, 504]);

const rateBuckets = new Map<string, RateBucket>();
const monthlyCounters = new Map<string, number>();

function errorBody(code: AiErrorCode, message: string) {
  return { error: { code, message } };
}

function takeRate(clientId: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(clientId);
  if (!bucket || now - bucket.windowStart > RATE_WINDOW_MS) {
    rateBuckets.set(clientId, { windowStart: now, count: 1 });
    return true;
  }
  if (bucket.count >= RATE_MAX_PER_WINDOW) return false;
  bucket.count += 1;
  return true;
}

function monthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

function stripFences(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith('```')) {
    return trimmed
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();
  }
  return trimmed;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(stripFences(text));
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

function maxOutputTokens(task: AiRequest['task']): number {
  return task === 'story' || task === 'recap' ? 8192 : 4096;
}

function modelCandidates(env: Record<string, string | undefined>): string[] {
  const primary = (env.GEMINI_FLASH_MODEL || DEFAULT_MODEL).trim();
  const fallback = (env.GEMINI_FLASH_FALLBACK_MODEL || DEFAULT_FALLBACK_MODEL).trim();
  return [...new Set([primary, fallback].filter(Boolean))];
}

function rateLimitMessage(body: string): string {
  let seconds = Number.NaN;
  try {
    const parsed = JSON.parse(body) as {
      error?: { details?: Array<{ retryDelay?: string }> };
    };
    const delay = parsed.error?.details?.find(
      (detail) => typeof detail.retryDelay === 'string',
    )?.retryDelay;
    seconds = delay ? Number.parseInt(delay, 10) : Number.NaN;
  } catch {
    seconds = Number.NaN;
  }
  return Number.isFinite(seconds) && seconds >= 3600
    ? 'The free AI allowance for today is used up. Your words are safe; it resets at midnight Pacific.'
    : 'A little too much at once. Try again in a minute.';
}

async function postGemini(url: string, body: unknown, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify(body),
    });
  } finally {
    clearTimeout(timer);
  }
}

function buildContents(request: AiRequest) {
  const prompt = promptFor(request);
  const parts: Array<Record<string, unknown>> = [];
  if (request.task === 'vision') {
    parts.push({
      inlineData: {
        mimeType: request.input.mimeType,
        data: request.input.imageBase64,
      },
    });
  }
  parts.push({ text: prompt.user });
  return {
    systemInstruction: { parts: [{ text: prompt.system }] },
    contents: [{ role: 'user', parts }],
  };
}

export async function handleAiRequest(
  rawBody: unknown,
  env: Record<string, string | undefined>,
  clientId = 'local',
): Promise<HandleResult> {
  const parsed = AiRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return {
      status: 400,
      body: errorBody('AI_INVALID_REQUEST', 'That request could not be read.'),
    };
  }
  const request = parsed.data;

  if (!takeRate(clientId)) {
    return {
      status: 429,
      body: errorBody('AI_RATE_LIMITED', 'A little too much at once. Try again in a minute.'),
    };
  }

  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      status: 503,
      body: errorBody(
        'AI_UNAVAILABLE',
        'The writing room is not available right now. Keep writing; your words are safe.',
      ),
    };
  }

  const models = modelCandidates(env);
  const monthlyLimit = Number(env.DAYBOOK_AI_MONTHLY_LIMIT || 2000);
  const key = monthKey();
  const used = monthlyCounters.get(key) ?? 0;
  if (used >= monthlyLimit) {
    return {
      status: 429,
      body: errorBody('AI_RATE_LIMITED', 'The writing room is resting for now. Your words are safe.'),
    };
  }
  monthlyCounters.set(key, used + 1);

  const payload = {
    ...buildContents(request),
    generationConfig: {
      temperature: request.task === 'polish' ? 0.35 : 0.3,
      topP: 0.9,
      maxOutputTokens: maxOutputTokens(request.task),
      responseMimeType: 'application/json',
      responseSchema: jsonShapeFor(request),
    },
  };

  try {
    let response: Response | undefined;
    let failureBody = '';
    const deadline = Date.now() + REQUEST_BUDGET_MS;
    const urlFor = (model: string) =>
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    for (let index = 0; index < models.length; index += 1) {
      const model = models[index];
      const remaining = deadline - Date.now();
      if (remaining < 1_000) break;
      try {
        response = await postGemini(
          urlFor(model),
          payload,
          Math.min(FETCH_TIMEOUT_MS, remaining),
        );
      } catch (error) {
        console.warn(
          `[daybook-ai] ${request.task} model=${model} request failed: ${
            error instanceof Error ? error.message : 'unknown'
          }`,
        );
        if (index === models.length - 1 || Date.now() >= deadline) throw error;
        continue;
      }
      if (response.ok) break;

      failureBody = await response.text().catch(() => '');
      console.warn(
        `[daybook-ai] ${request.task} model=${model} upstream status=${response.status} body=${failureBody.slice(0, 500)}`,
      );
      if (index === models.length - 1 || !MODEL_FALLBACK_STATUSES.has(response.status)) break;
    }

    const remaining = deadline - Date.now();
    if (
      response &&
      !response.ok &&
      MODEL_RETRY_STATUSES.has(response.status) &&
      remaining > 1_000
    ) {
      const model = models[0];
      try {
        const retry = await postGemini(
          urlFor(model),
          payload,
          Math.min(FETCH_TIMEOUT_MS, remaining),
        );
        response = retry;
        if (!retry.ok) failureBody = await retry.text().catch(() => '');
        console.warn(
          `[daybook-ai] ${request.task} model=${model} retry status=${retry.status}`,
        );
      } catch (error) {
        console.warn(
          `[daybook-ai] ${request.task} model=${model} retry failed: ${
            error instanceof Error ? error.message : 'unknown'
          }`,
        );
      }
    }

    if (!response) throw new Error('The writing room could not be reached.');

    if (!response.ok) {
      if (response.status === 429) {
        return {
          status: 429,
          body: errorBody('AI_RATE_LIMITED', rateLimitMessage(failureBody)),
        };
      }
      return {
        status: 502,
        body: errorBody('AI_UPSTREAM', 'The writing room could not be reached. Keep writing; nothing is lost.'),
      };
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        finishReason?: string;
        content?: { parts?: Array<{ text?: string; thought?: boolean }> };
      }>;
    };

    const candidate = data.candidates?.[0];
    if (!candidate || candidate.finishReason === 'SAFETY' || candidate.finishReason === 'BLOCKLIST') {
      return {
        status: 502,
        body: errorBody('AI_INVALID_RESPONSE', 'That one could not be shaped. Your original words are unchanged.'),
      };
    }

    const text = (candidate.content?.parts ?? [])
      .filter((part) => !part.thought && typeof part.text === 'string')
      .map((part) => part.text)
      .join('');

    const json = parseJson(text);
    if (!json) {
      console.warn(
        `[daybook-ai] ${request.task} unparseable response finish=${candidate.finishReason ?? 'none'} length=${text.length}`,
      );
      return {
        status: 502,
        body: errorBody('AI_INVALID_RESPONSE', 'That one could not be shaped. Your original words are unchanged.'),
      };
    }

    try {
      const result = resultForTask(request, json);
      return { status: 200, body: result };
    } catch (error) {
      console.warn(
        `[daybook-ai] ${request.task} schema mismatch finish=${candidate.finishReason ?? 'none'}: ${
          error instanceof Error ? error.message : 'unknown'
        }`,
      );
      return {
        status: 502,
        body: errorBody('AI_INVALID_RESPONSE', 'That one could not be shaped. Your original words are unchanged.'),
      };
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return {
        status: 504,
        body: errorBody('AI_TIMEOUT', 'The writing room took too long. Your original words are unchanged.'),
      };
    }
    return {
      status: 502,
      body: errorBody('AI_UPSTREAM', 'The writing room could not be reached. Keep writing; nothing is lost.'),
    };
  }
}
