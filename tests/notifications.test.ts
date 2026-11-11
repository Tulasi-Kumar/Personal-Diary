import { beforeEach, describe, expect, it } from 'vitest';
import type { Day, DaySignals, Piece, Ribbon, Settings } from '@shared/types';
import { db, resetDatabaseForTests } from '../src/lib/db/db';
import { dateKey } from '../src/lib/db/dates';
import {
  consumeNotification,
  nextNotification,
  resetSessionDismissals,
} from '../src/lib/notifications';

function settings(overrides: Partial<Settings> = {}): Settings {
  return {
    id: 'settings',
    bookName: 'My DayBook',
    reminderEnabled: false,
    reminderTime: '20:00',
    memoryNotifications: true,
    writingStyle: 'polished',
    schemaVersion: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

function piece(date: string): Piece {
  return {
    id: `piece-${date}`,
    date,
    kind: 'text',
    text: 'A quiet day.',
    originalText: 'A quiet day.',
    polishStatus: 'polished',
    isFavorite: false,
    source: 'typed',
    addedLater: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    capturedAt: Date.now(),
  };
}

function day(date: string): Day {
  return {
    date,
    heading: 'A quiet day',
    story: {
      heading: 'A quiet day',
      paragraphs: [{ text: 'A quiet day.', sourcePieceIds: [`piece-${date}`] }],
      generatedAt: Date.now(),
    },
    storyStatus: 'ready',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function signal(date: string): DaySignals {
  return {
    date,
    hint: 'A quiet day.',
    people: [],
    places: [],
    winningRibbon: null,
    winningRibbonStrength: 0,
    interactionScore: 0,
    storyBacked: true,
    pieceCount: 1,
    mediaCount: 0,
    updatedAt: Date.now(),
  };
}

describe('notifications', () => {
  beforeEach(async () => {
    await resetDatabaseForTests();
    resetSessionDismissals();
  });

  it('shows one quiet reminder after the time when today is empty', async () => {
    const now = new Date();
    now.setHours(21, 0, 0, 0);
    const event = await nextNotification(
      settings({ reminderEnabled: true, memoryNotifications: false }),
      now,
    );

    expect(event).toMatchObject({
      kind: 'reminder',
      id: `reminder:${dateKey(now)}`,
      to: '/',
    });
  });

  it('does not remind after the time when today already has a piece', async () => {
    const now = new Date();
    now.setHours(21, 0, 0, 0);
    await db.pieces.put(piece(dateKey(now)));

    expect(
      await nextNotification(
        settings({ reminderEnabled: true, memoryNotifications: false }),
        now,
      ),
    ).toBeNull();
  });

  it('suppresses memory banners when the toggle is off', async () => {
    const today = dateKey(new Date());
    await db.days.put(day(today));
    await db.ribbons.put({
      id: 'ribbon-1',
      date: today,
      label: 'Tender',
      quote: 'A quiet day.',
      pieceId: `piece-${today}`,
      sourcePieceIds: [`piece-${today}`],
      awardedAt: Date.now(),
      source: 'ai',
    });

    expect(
      await nextNotification(
        settings({ memoryNotifications: false, demoLoaded: true }),
      ),
    ).toBeNull();
  });

  it('does not show a throwback while the diary is still forming', async () => {
    const now = new Date();
    const today = dateKey(now);
    const lastYear = `${now.getFullYear() - 1}${today.slice(4)}`;
    await db.pieces.put(piece(lastYear));
    await db.days.put(day(lastYear));
    await db.daySignals.put(signal(lastYear));

    expect(await nextNotification(settings(), now)).toBeNull();
  });

  it('shows a ribbon once and remembers it', async () => {
    const today = dateKey(new Date());
    await db.days.put(day(today));
    const ribbon: Ribbon = {
      id: 'ribbon-1',
      date: today,
      label: 'Tender',
      quote: 'A quiet day.',
      pieceId: `piece-${today}`,
      sourcePieceIds: [`piece-${today}`],
      awardedAt: Date.now(),
      source: 'ai',
    };
    await db.ribbons.put(ribbon);

    const event = await nextNotification(settings({ demoLoaded: true }));
    expect(event).toMatchObject({
      kind: 'ribbon',
      ribbonId: ribbon.id,
      to: `/memories?mark=${encodeURIComponent(ribbon.id)}`,
    });

    await consumeNotification(event!);
    expect(await nextNotification(settings({ demoLoaded: true }))).toBeNull();
  });
});
