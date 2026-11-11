// @vitest-environment node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { handleAiRequest } from '../server/ai-handler';

const ENABLED = process.env.LIVE_AI_SMOKE === '1';

function loadEnvLocal(): Record<string, string> {
  const env: Record<string, string> = {};
  const raw = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match) env[match[1]] = match[2].trim();
  }
  return env;
}

describe.skipIf(!ENABLED)('live AI smoke (real Gemini, uses free-tier quota)', () => {
  let env: Record<string, string>;

  beforeAll(() => {
    env = loadEnvLocal();
    if (!env.GEMINI_API_KEY) throw new Error('LIVE_AI_SMOKE=1 requires GEMINI_API_KEY in .env.local');
  });

  it(
    'polishes a short piece',
    { timeout: 60_000 },
    async () => {
      const raw = 'walked to the lake with meera this morning. cold wind. two geese on the water.';
      const result = await handleAiRequest(
        { task: 'polish', input: { date: '2026-11-11', text: raw, kind: 'text' } },
        env,
        'live-smoke',
      );
      expect(result.status).toBe(200);
      const polished = (result.body as { polishedText: string }).polishedText;
      expect(polished).toBeTruthy();
      expect(polished.toLowerCase()).toContain('meera');
      expect(polished.toLowerCase()).toContain('lake');
    },
  );

  it(
    'writes a grounded story with citations',
    { timeout: 90_000 },
    async () => {
      const pieces = [
        {
          id: 'piece-a',
          text: 'morning coffee on the balcony. the neighbour was pruning roses again.',
          kind: 'text' as const,
          createdAt: Date.parse('2026-11-11T08:00:00Z'),
        },
        {
          id: 'piece-b',
          text: 'finished the book about lighthouses in the evening. felt quiet after.',
          kind: 'text' as const,
          createdAt: Date.parse('2026-11-11T19:00:00Z'),
        },
      ];
      const result = await handleAiRequest(
        {
          task: 'story',
          input: { date: '2026-11-11', bookName: 'DayBook', pieces },
        },
        env,
        'live-smoke',
      );
      expect(result.status).toBe(200);
      const story = result.body as {
        heading: string;
        paragraphs: Array<{ text: string; sourcePieceIds: string[] }>;
      };
      expect(story.heading).toBeTruthy();
      expect(story.paragraphs.length).toBeGreaterThan(0);
      const cited = new Set(story.paragraphs.flatMap((p) => p.sourcePieceIds));
      for (const id of cited) expect(['piece-a', 'piece-b']).toContain(id);
    },
  );
});
