import { describe, expect, it } from 'vitest';
import type { Day, Media, Piece, Settings } from '@shared/types';
import { buildJsonBackup, buildReadableText } from '../src/lib/export/exports';

const settings: Settings = {
  id: 'settings',
  bookName: 'A Quiet Book',
  reminderEnabled: false,
  reminderTime: null,
  memoryNotifications: true,
  writingStyle: 'polished',
  schemaVersion: 1,
  createdAt: 1,
  updatedAt: 1,
};

const day: Day = {
  date: '2026-01-02',
  heading: 'The rain',
  story: {
    heading: 'The rain',
    paragraphs: [
      { text: 'The rain stayed until noon.', sourcePieceIds: ['piece-1'] },
    ],
    generatedAt: 1,
  },
  storyStatus: 'ready',
  createdAt: 1,
  updatedAt: 1,
};

const piece: Piece = {
  id: 'piece-1',
  date: '2026-01-02',
  kind: 'voice',
  text: 'I stayed in and read.',
  originalText: 'I stayed in and read.',
  polishedText: 'I stayed in and read.',
  polishStatus: 'polished',
  isFavorite: false,
  source: 'spoken',
  addedLater: true,
  createdAt: new Date('2026-01-02T20:15:00').getTime(),
  updatedAt: 1,
  capturedAt: 1,
};

const media: Media = {
  id: 'media-1',
  kind: 'photo',
  mimeType: 'image/jpeg',
  blob: new Blob(['not-exported']),
  fileName: 'rain.jpg',
  createdAt: 1,
};

const data = {
  days: [day],
  pieces: [piece],
  recaps: [],
  ribbons: [],
  media: [media],
  settings,
  daySignals: [],
  featureVotes: [],
  metrics: [],
} as Parameters<typeof buildReadableText>[0];

describe('readable export', () => {
  it('includes the title, day, story, and piece notes in stable order', () => {
    const text = buildReadableText(data);

    expect(text).toContain('A Quiet Book');
    expect(text.indexOf('Friday, 2 January 2026')).toBeGreaterThan(-1);
    expect(text).toContain('The rain stayed until noon.');
    expect(text).toContain('I stayed in and read.');
    expect(text).toContain('spoken');
    expect(text).toContain('added later');
  });
});

describe('JSON backup', () => {
  it('keeps a restorable shape and excludes media blobs', () => {
    const backup = buildJsonBackup(data);

    expect(backup.app).toBe('DayBook');
    expect(backup.schemaVersion).toBe(1);
    expect(backup.bookName).toBe('A Quiet Book');
    expect(backup.note).toContain('Media blobs are not included');
    expect(backup.pieces[0]).toMatchObject({
      id: 'piece-1',
      date: '2026-01-02',
      source: 'spoken',
      polishStatus: 'polished',
      addedLater: true,
    });
    expect(backup.media[0]).toMatchObject({
      id: 'media-1',
      fileName: 'rain.jpg',
      blobStored: false,
    });
    expect('blob' in backup.media[0]).toBe(false);
  });
});
