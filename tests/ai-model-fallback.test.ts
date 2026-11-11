import { afterEach, describe, expect, it, vi } from 'vitest';
import { handleAiRequest } from '../server/ai-handler';

function fakeResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response;
}

describe('AI model fallback', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('falls back when the primary model is out of daily quota', async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: unknown) => {
        const url = String(input);
        calls.push(url);
        if (url.includes('gemini-3.6-flash')) {
          return fakeResponse(429, {
            error: {
              code: 429,
              status: 'RESOURCE_EXHAUSTED',
              details: [{ retryDelay: '67973s' }],
            },
          });
        }
        return fakeResponse(200, {
          candidates: [
            {
              finishReason: 'STOP',
              content: { parts: [{ text: JSON.stringify({ polishedText: 'It rained.' }) }] },
            },
          ],
        });
      }),
    );

    const result = await handleAiRequest(
      {
        task: 'polish',
        input: { date: '2026-01-01', text: 'It rained.', kind: 'text' },
      },
      {
        GEMINI_API_KEY: 'test-key',
        GEMINI_FLASH_MODEL: 'gemini-3.6-flash',
        GEMINI_FLASH_FALLBACK_MODEL: 'gemini-3.5-flash-lite',
      },
      'fallback-test',
    );

    expect(result.status).toBe(200);
    expect(result.body).toEqual({ task: 'polish', polishedText: 'It rained.' });
    expect(calls).toHaveLength(2);
    expect(calls[0]).toContain('gemini-3.6-flash');
    expect(calls[1]).toContain('gemini-3.5-flash-lite');
  });

  it('retries a high-demand model within the request budget', async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: unknown) => {
        const url = String(input);
        calls.push(url);
        if (calls.length <= 2) {
          return fakeResponse(503, {
            error: { code: 503, status: 'UNAVAILABLE', message: 'High demand.' },
          });
        }
        return fakeResponse(200, {
          candidates: [
            {
              finishReason: 'STOP',
              content: { parts: [{ text: JSON.stringify({ polishedText: 'It rained.' }) }] },
            },
          ],
        });
      }),
    );

    const result = await handleAiRequest(
      {
        task: 'polish',
        input: { date: '2026-01-01', text: 'It rained.', kind: 'text' },
      },
      {
        GEMINI_API_KEY: 'test-key',
        GEMINI_FLASH_MODEL: 'gemini-3.5-flash-lite',
        GEMINI_FLASH_FALLBACK_MODEL: 'gemini-3.1-flash-lite',
      },
      'retry-test',
    );

    expect(result.status).toBe(200);
    expect(result.body).toEqual({ task: 'polish', polishedText: 'It rained.' });
    expect(calls).toHaveLength(3);
    expect(calls[2]).toContain('gemini-3.5-flash-lite');
  });
});
