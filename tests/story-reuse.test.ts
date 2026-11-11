import { beforeEach, describe, expect, it } from 'vitest';
import { db, resetDatabaseForTests } from '../src/lib/db/db';
import {
  addPiece,
  getDay,
  listPieces,
  setDayStory,
  setStoryStatus,
} from '../src/lib/db/repositories';
import { piecesHash } from '../src/lib/ai/hash';
import { enqueueStory } from '../src/lib/ai/queue';

const DATE = '2026-01-01';

describe('story reuse', () => {
  beforeEach(async () => {
    await resetDatabaseForTests();
  });

  it('restores a matching saved story without creating an AI job', async () => {
    const piece = await addPiece({ date: DATE, text: 'I stayed in and read.', kind: 'text' });
    const sourceHash = piecesHash(await listPieces(DATE));
    await setDayStory(
      DATE,
      {
        heading: 'A quiet day',
        paragraphs: [{ text: 'I stayed in and read.', sourcePieceIds: [piece.id] }],
        generatedAt: 1,
      },
      sourceHash,
    );
    await setStoryStatus(DATE, 'error', '502');

    await enqueueStory(DATE, { force: true });

    const day = await getDay(DATE);
    expect(day?.storyStatus).toBe('ready');
    expect(day?.story?.heading).toBe('A quiet day');
    expect(await db.aiJobs.count()).toBe(0);
  });

  it('hashes content, not timestamps', () => {
    const before = { id: 'piece-1', text: 'I stayed in and read.', updatedAt: 1 };
    const after = { ...before, updatedAt: 2 };
    expect(piecesHash([before])).toBe(piecesHash([after]));
    expect(piecesHash([before])).not.toBe(
      piecesHash([{ id: 'piece-1', text: 'I went out.' }]),
    );
  });
});
