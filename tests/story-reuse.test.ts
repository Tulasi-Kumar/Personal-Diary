import { beforeEach, describe, expect, it } from 'vitest';
import { subDays } from 'date-fns';
import { db, resetDatabaseForTests } from '../src/lib/db/db';
import {
  addPiece,
  getDay,
  listPieces,
  setDayStory,
  setStoryStatus,
} from '../src/lib/db/repositories';
import { piecesHash } from '../src/lib/ai/hash';
import { enqueueStory, wrapUpPastDays } from '../src/lib/ai/queue';
import { dateKey, todayKey } from '../src/lib/db/dates';

const DATE = '2026-01-01';

async function waitForQueueIdle(): Promise<void> {
  for (let i = 0; i < 100; i += 1) {
    const queued = await db.aiJobs.where('status').equals('queued').count();
    const running = await db.aiJobs.where('status').equals('running').count();
    if (queued + running === 0) break;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  await new Promise((resolve) => setTimeout(resolve, 50));
}

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
        form: 'full',
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

  it('requeues a finished full page when a past day only has a crisp story', async () => {
    const piece = await addPiece({ date: DATE, text: 'I stayed in and read.', kind: 'text' });
    const sourceHash = piecesHash(await listPieces(DATE));
    await setDayStory(
      DATE,
      {
        heading: 'A quiet day',
        paragraphs: [{ text: 'I stayed in and read.', sourcePieceIds: [piece.id] }],
        form: 'crisp',
        generatedAt: 1,
      },
      sourceHash,
    );

    await enqueueStory(DATE, { force: true });
    await waitForQueueIdle();

    const jobs = await db.aiJobs.toArray();
    expect(jobs).toHaveLength(1);
    expect(jobs[0]?.inputHash.startsWith('story:full:')).toBe(true);
    expect((jobs[0]?.payload as { form?: string }).form).toBe('full');
  });

  it('requests the crisp form for today and the full form for a past day', async () => {
    await addPiece({ date: todayKey(), text: 'I went out.', kind: 'text' });
    await enqueueStory(todayKey());
    await waitForQueueIdle();
    const todayJob = (await db.aiJobs.toArray()).find(
      (job) => (job.payload as { date?: string }).date === todayKey(),
    );
    expect(todayJob?.inputHash.startsWith('story:crisp:')).toBe(true);

    await addPiece({ date: DATE, text: 'I stayed in.', kind: 'text' });
    await enqueueStory(DATE);
    await waitForQueueIdle();
    const pastJob = (await db.aiJobs.toArray()).find(
      (job) => (job.payload as { date?: string }).date === DATE,
    );
    expect(pastJob?.inputHash.startsWith('story:full:')).toBe(true);
  });

  it('skips demo-only days and days without writing in the end-of-day sweep', async () => {
    const yesterday = dateKey(subDays(new Date(), 1));
    await addPiece({
      date: yesterday,
      text: 'A demo fixture day.',
      kind: 'text',
      source: 'demo',
    });
    await wrapUpPastDays();
    const jobs = await db.aiJobs.toArray();
    expect(jobs.filter((job) => job.task === 'story')).toHaveLength(0);

    await addPiece({ date: yesterday, text: 'A real day.', kind: 'text' });
    await wrapUpPastDays();
    await waitForQueueIdle();
    const storyJobs = (await db.aiJobs.toArray()).filter((job) => job.task === 'story');
    expect(storyJobs).toHaveLength(1);
    expect(storyJobs[0]?.inputHash.startsWith('story:full:')).toBe(true);
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
