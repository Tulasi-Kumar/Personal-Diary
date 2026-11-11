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

  it(
    'writes the full end-of-day page for a finished day',
    { timeout: 150_000 },
    async () => {
      const pieces = [
        {
          id: 'piece-a',
          text: 'woke before the alarm again, third time this week. made strong coffee and sat by the window while the street was still dark. the neighbour was already pruning roses, she always is, no matter the cold. we waved. i did not go out to talk.',
          kind: 'text' as const,
          createdAt: Date.parse('2026-11-11T06:30:00Z'),
        },
        {
          id: 'piece-b',
          text: 'long walk at noon, nearly an hour. took the path behind the old mill because the main road was loud with lunch traffic. the river was high from the rain on monday. saw two geese on the water near the second bend and stayed a while watching them not move. my boots are not waterproof. noted for next time.',
          kind: 'text' as const,
          createdAt: Date.parse('2026-11-11T12:15:00Z'),
        },
        {
          id: 'piece-c',
          text: 'afternoon at the desk. wrote three letters, only sent one. the ink ran low near the end of the second page and the last paragraph looks thin. answered the electricity bill. put the lighthouse book back on the shelf and took it down again.',
          kind: 'text' as const,
          createdAt: Date.parse('2026-11-11T16:00:00Z'),
        },
        {
          id: 'piece-d',
          text: 'meera called while i was cooking. we talked about her sister moving to pune and whether the train is better than the flight. i burnt the onions a little. dinner was still good. the kitchen smelled like burnt onions and cumin until nine.',
          kind: 'text' as const,
          createdAt: Date.parse('2026-11-11T19:40:00Z'),
        },
        {
          id: 'piece-e',
          text: 'evening. finished the book about lighthouses, the one meera lent me in september. the last chapter was about a keeper who stayed forty years on the same rock. felt quiet after, the good kind. called home for ten minutes. mother said the mango tree flowered early this year.',
          kind: 'text' as const,
          createdAt: Date.parse('2026-11-11T21:00:00Z'),
        },
      ];
      const result = await handleAiRequest(
        {
          task: 'story',
          input: { date: '2026-11-11', bookName: 'DayBook', form: 'full', pieces },
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
      const text = story.paragraphs.map((p) => p.text).join(' ');
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      expect(wordCount).toBeGreaterThan(200);
      const cited = new Set(story.paragraphs.flatMap((p) => p.sourcePieceIds));
      for (const id of cited) expect(['piece-a', 'piece-b', 'piece-c', 'piece-d', 'piece-e']).toContain(id);
    },
  );
});
