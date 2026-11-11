import { describe, expect, it } from 'vitest';
import type { Day, DaySignals, Piece, Recap, Ribbon } from '@shared/types';
import { computeReadiness, READY_FORMING, READY_FULL } from '../src/lib/memory/readiness';
import { computeSalience } from '../src/lib/memory/salience';
import { buildWeekLetter } from '../src/lib/memory/weekly';
import { firstSentence, sortBySalience, throwbackLabel } from '../src/lib/memory/sections';
import { decayedInteractionScore } from '../src/lib/memory/interactions';
import type { Throwback } from '../src/lib/memory/throwback';

const DAY_MS = 86_400_000;

function piece(overrides: Partial<Piece> = {}): Piece {
  return {
    id: `piece-${Math.random()}`,
    date: '2026-01-01',
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
    ...overrides,
  };
}

function day(overrides: Partial<Day> = {}): Day {
  return {
    date: '2026-01-01',
    heading: 'A quiet day',
    story: {
      heading: 'A quiet day',
      paragraphs: [
        {
          text: 'A quiet day. The rain stayed until noon.',
          sourcePieceIds: ['piece-1'],
        },
      ],
      generatedAt: Date.now(),
    },
    storyStatus: 'ready',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

function signal(overrides: Partial<DaySignals> = {}): DaySignals {
  return {
    date: '2026-01-01',
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
    ...overrides,
  };
}

describe('readiness', () => {
  it('stays quiet with a single new page', () => {
    const result = computeReadiness({
      pieces: [piece({ date: '2026-01-01' })],
      days: [],
      ribbons: [],
      recaps: [],
      signals: [],
      now: new Date('2026-01-01T12:00:00'),
    });

    expect(result.level).toBe('forming');
    expect(result.score).toBeLessThan(READY_FORMING);
    expect(result.activeDays).toBe(1);
  });

  it('forces full readiness while the demo is loaded', () => {
    const result = computeReadiness({
      pieces: [piece({ date: '2026-01-01' })],
      days: [],
      ribbons: [],
      recaps: [],
      signals: [],
      now: new Date('2026-01-01T12:00:00'),
      demoLoaded: true,
    });

    expect(result.score).toBeGreaterThanOrEqual(0.72);
    expect(result.level).toBe('full');
  });

  it('reaches full readiness with a long, dense, engaged history', () => {
    const now = new Date('2026-06-01T12:00:00');
    const pieces: Piece[] = [];
    const ribbons: Ribbon[] = [];
    for (let dayIndex = 0; dayIndex < 300; dayIndex += 1) {
      const date = new Date(now.getTime() - dayIndex * DAY_MS);
      const key = date.toISOString().slice(0, 10);
      for (let entry = 0; entry < 3; entry += 1) {
        const index = dayIndex * 3 + entry;
        pieces.push(piece({ id: `p-${index}`, date: key, isFavorite: true }));
      }
      if (dayIndex % 5 === 0) {
        ribbons.push({
          id: `r-${dayIndex}`,
          date: key,
          label: 'Tender',
          quote: 'A quiet day.',
          pieceId: `p-${dayIndex * 3}`,
          sourcePieceIds: [`p-${dayIndex * 3}`],
          awardedAt: date.getTime(),
          source: 'ai',
        });
      }
    }

    const result = computeReadiness({
      pieces,
      days: [],
      ribbons,
      recaps: [],
      signals: [],
      now,
    });

    expect(result.score).toBeGreaterThanOrEqual(READY_FULL);
    expect(result.level).toBe('full');
  });
});

describe('salience', () => {
  it('weights interaction, ribbon strength, and richness', () => {
    const score = computeSalience({
      interactionScore: 0.5,
      winningRibbonStrength: 0.6,
      pieceCount: 3,
      mediaCount: 1,
    });

    expect(score).toBeCloseTo(0.535, 5);
  });

  it('orders signals by salience without mutating the input', () => {
    const low = signal({ date: '2026-01-01', interactionScore: 0.1, pieceCount: 1 });
    const high = signal({
      date: '2026-01-02',
      interactionScore: 1,
      winningRibbonStrength: 1,
      pieceCount: 6,
      mediaCount: 2,
    });

    const ordered = sortBySalience([low, high]);

    expect(ordered[0].date).toBe('2026-01-02');
    expect([low, high][0].date).toBe('2026-01-01');
  });
});

describe('interaction decay', () => {
  it('halves the weight after thirty days', () => {
    const now = Date.now();
    const recent = decayedInteractionScore([{ kind: 'story-read', at: now }], now);
    const old = decayedInteractionScore(
      [{ kind: 'story-read', at: now - 30 * DAY_MS }],
      now,
    );

    expect(recent).toBeCloseTo(1 / 3, 4);
    expect(old).toBeCloseTo(1 / 6, 4);
  });
});

describe('weekly letter', () => {
  it('builds a quiet letter from ready pages only', () => {
    const letter = buildWeekLetter(
      [
        day({ date: '2026-01-05' }),
        day({
          date: '2026-01-06',
          story: {
            heading: 'Another day',
            paragraphs: [
              {
                text: 'We walked to the water and back. The wind made my eyes water.',
                sourcePieceIds: ['piece-2'],
              },
            ],
            generatedAt: Date.now(),
          },
        }),
        day({ date: '2026-01-07', storyStatus: 'queued', story: undefined }),
      ],
      '2026-01-05',
    );

    expect(letter.hasMaterial).toBe(true);
    expect(letter.highlights.length).toBeGreaterThan(0);
    expect(letter.highlights.length).toBeLessThanOrEqual(3);
    expect(letter.paragraphs[0]).toContain('The rain stayed');
  });

  it('returns no material for an empty week', () => {
    expect(buildWeekLetter([], '2026-01-05').hasMaterial).toBe(false);
  });
});

describe('memory labels', () => {
  it('takes the first sentence without inventing text', () => {
    expect(firstSentence('  The rain stayed. Then it left.  ')).toBe('The rain stayed.');
    expect(firstSentence('No punctuation here')).toBe('No punctuation here');
  });

  it('labels throwbacks by distance', () => {
    const base: Throwback = {
      date: '2025-01-01',
      reason: 'anniversary',
      yearsAgo: 1,
      salience: 0.5,
    };
    expect(throwbackLabel(base)).toBe('One year ago today');
    expect(throwbackLabel({ ...base, yearsAgo: 3 })).toBe('Three years ago today');
    expect(throwbackLabel({ ...base, yearsAgo: 6 })).toBe('6 years ago today');
    expect(throwbackLabel({ ...base, reason: 'nearby', yearsAgo: 0 })).toBe(
      'From earlier this year',
    );
  });
});
