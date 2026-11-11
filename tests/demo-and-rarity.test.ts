import { beforeEach, describe, expect, it } from 'vitest';
import type { DaySignals, Ribbon } from '@shared/types';
import { db, resetDatabaseForTests } from '../src/lib/db/db';
import { isDemoLoaded, loadDemoDiary, removeDemoDiary } from '../src/lib/seed/demo';
import { recomputeRibbonRarity } from '../src/lib/memory/ribbons';
import { recordInteraction, interactionEvents } from '../src/lib/memory/interactions';

function signal(date: string, overrides: Partial<DaySignals> = {}): DaySignals {
  return {
    date,
    hint: 'A day.',
    people: [],
    places: [],
    winningRibbon: null,
    winningRibbonStrength: 0,
    interactionScore: 0,
    storyBacked: true,
    pieceCount: 6,
    mediaCount: 0,
    updatedAt: Date.now(),
    ...overrides,
  };
}

function ribbon(date: string, index: number): Ribbon {
  return {
    id: `ribbon-${index}`,
    date,
    label: 'Tender',
    quote: 'A day.',
    pieceId: `piece-${index}`,
    sourcePieceIds: [`piece-${index}`],
    awardedAt: Date.now(),
    source: 'ai',
  };
}

describe('demo diary', () => {
  beforeEach(async () => {
    await resetDatabaseForTests();
  });

  it('loads a multi-year book with photos, a video, stories, and recaps', async () => {
    const result = await loadDemoDiary();

    expect(result.days).toBeGreaterThanOrEqual(40);
    expect(result.pieces).toBeGreaterThan(40);
    expect(await isDemoLoaded()).toBe(true);

    const pieces = await db.pieces.toArray();
    expect(pieces.every((piece) => piece.source === 'demo')).toBe(true);
    expect(pieces.some((piece) => piece.kind === 'photo')).toBe(true);
    expect(pieces.some((piece) => piece.kind === 'video')).toBe(true);

    const days = await db.days.toArray();
    expect(days.every((day) => day.storyStatus === 'ready' && day.story)).toBe(true);

    const ribbons = await db.ribbons.toArray();
    expect(ribbons.length).toBeGreaterThan(0);
    for (const item of ribbons) {
      const piece = pieces.find((candidate) => candidate.id === item.pieceId);
      expect(piece?.text).toContain(item.quote);
    }

    expect((await db.recaps.toArray()).length).toBeGreaterThan(0);
    const settings = await db.settings.get('settings');
    expect(settings?.demoLoaded).toBe(true);
  });

  it('is idempotent and removes cleanly', async () => {
    await loadDemoDiary();
    const before = await db.pieces.count();

    const second = await loadDemoDiary();
    expect(second).toEqual({ days: 0, pieces: 0 });
    expect(await db.pieces.count()).toBe(before);

    await removeDemoDiary();
    expect(await isDemoLoaded()).toBe(false);
    expect(await db.pieces.filter((piece) => piece.source === 'demo').count()).toBe(0);
    expect(await db.ribbons.filter((item) => item.source === 'demo').count()).toBe(0);
    expect(await db.recaps.count()).toBe(0);
    expect((await db.settings.get('settings'))?.demoLoaded).toBe(false);
  });
});

describe('ribbon rarity', () => {
  beforeEach(async () => {
    await resetDatabaseForTests();
  });

  it('keeps only standout days and spaces them a week apart', async () => {
    const signals: DaySignals[] = [];
    const ribbons: Ribbon[] = [];
    for (let index = 0; index < 16; index += 1) {
      const date = `2026-01-${String(index + 1).padStart(2, '0')}`;
      signals.push(
        signal(date, {
          interactionScore: index === 15 ? 1 : 0,
          winningRibbonStrength: 1,
        }),
      );
      ribbons.push(ribbon(date, index));
    }

    await db.daySignals.bulkPut(signals);
    await db.ribbons.bulkPut(ribbons);

    await recomputeRibbonRarity();

    const kept = await db.ribbons.toArray();
    expect(kept).toHaveLength(1);
    expect(kept[0].date).toBe('2026-01-16');
  });

  it('does nothing before fourteen story-backed days', async () => {
    for (let index = 0; index < 10; index += 1) {
      const date = `2026-01-${String(index + 1).padStart(2, '0')}`;
      await db.daySignals.put(signal(date, { interactionScore: index / 10 }));
      await db.ribbons.put(ribbon(date, index));
    }

    await recomputeRibbonRarity();
    expect(await db.ribbons.count()).toBe(10);
  });
});

describe('interaction events', () => {
  beforeEach(async () => {
    await resetDatabaseForTests();
  });

  it('records locally and clears cached signals', async () => {
    await db.daySignals.put(signal('2026-01-01'));
    await recordInteraction('2026-01-01', 'story-read');

    expect((await interactionEvents('2026-01-01')).map((event) => event.kind)).toEqual([
      'story-read',
    ]);
    expect(await db.daySignals.get('2026-01-01')).toBeUndefined();
  });
});
