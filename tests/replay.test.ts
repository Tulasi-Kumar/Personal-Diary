import { describe, expect, it } from 'vitest';
import type { Day, Piece } from '@shared/types';
import { buildReplaySlides } from '../src/lib/replay/slides';

function mediaPiece(index: number, kind: 'photo' | 'video' = 'photo'): Piece {
  return {
    id: `piece-${index}`,
    date: '2026-01-01',
    kind,
    text: `Caption ${index}`,
    originalText: `Caption ${index}`,
    polishStatus: 'polished',
    isFavorite: false,
    source: 'typed',
    addedLater: false,
    createdAt: 1_000 + index,
    updatedAt: 1_000 + index,
    capturedAt: 1_000 + index,
    mediaId: `media-${index}`,
  };
}

function textPiece(index: number): Piece {
  return {
    ...mediaPiece(index),
    kind: 'text',
    mediaId: undefined,
  };
}

const day: Day = {
  date: '2026-01-01',
  heading: 'A quiet day',
  story: {
    heading: 'A quiet day',
    paragraphs: [
      {
        text: 'The rain stayed until noon. Then the street went quiet.',
        sourcePieceIds: ['piece-0'],
      },
    ],
    generatedAt: Date.now(),
  },
  storyStatus: 'ready',
  createdAt: 1_000,
  updatedAt: 1_000,
};

describe('replay slides', () => {
  it('puts media first and keeps captions from the piece itself', () => {
    const slides = buildReplaySlides(
      day,
      [mediaPiece(0), textPiece(1), mediaPiece(2, 'video')],
      new Set(['media-0', 'media-2']),
    );

    expect(slides).toHaveLength(2);
    expect(slides[0]).toMatchObject({
      kind: 'media',
      mediaId: 'media-0',
      mediaKind: 'photo',
      caption: 'Caption 0',
    });
    expect(slides[1]).toMatchObject({ kind: 'media', mediaKind: 'video' });
  });

  it('falls back to story sentences when a day has no media', () => {
    const slides = buildReplaySlides(day, [textPiece(0)], new Set());

    expect(slides).toEqual([
      { id: 'text-0', kind: 'text', text: 'The rain stayed until noon.' },
      { id: 'text-1', kind: 'text', text: 'Then the street went quiet.' },
    ]);
  });

  it('returns nothing when there is no media and no story', () => {
    expect(
      buildReplaySlides(undefined, [textPiece(0)], new Set()),
    ).toEqual([]);
  });

  it('caps long days at twelve slides and keeps the last moment', () => {
    const pieces = Array.from({ length: 16 }, (_, index) => mediaPiece(index));
    const available = new Set(pieces.map((item) => item.mediaId!));
    const slides = buildReplaySlides(day, pieces, available);

    expect(slides).toHaveLength(12);
    expect(slides[0].id).toBe('media-piece-0');
    expect(slides[11].id).toBe('media-piece-15');
  });

  it('ignores media that is not stored', () => {
    const slides = buildReplaySlides(day, [mediaPiece(0)], new Set());
    expect(slides[0].kind).toBe('text');
  });
});
