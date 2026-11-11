import type { Day, ExportBundle, Piece } from '@shared/types';
import { dateKey, formatLongDate, formatTime } from '../db/dates';
import { exportRawData } from '../db/repositories';

type RawExport = Awaited<ReturnType<typeof exportRawData>>;

function sortedDays(days: Day[]): Day[] {
  return [...days].sort((a, b) => a.date.localeCompare(b.date));
}

function sortedPieces(pieces: Piece[]): Piece[] {
  return [...pieces].sort((a, b) => {
    const byDate = a.date.localeCompare(b.date);
    return byDate !== 0 ? byDate : a.createdAt - b.createdAt;
  });
}

export function buildReadableText(data: RawExport): string {
  const days = sortedDays(data.days);
  const pieces = sortedPieces(data.pieces);
  const lines: string[] = [];
  const title = data.settings.bookName || 'My DayBook';

  lines.push(title);
  lines.push('='.repeat(Math.max(title.length, 12)));
  lines.push(`Exported ${formatLongDate(dateKey(new Date()))}`);
  lines.push('');

  if (days.length === 0) {
    lines.push('This diary is still empty.');
    lines.push('');
  }

  for (const day of days) {
    const dayPieces = pieces.filter((piece) => piece.date === day.date);
    lines.push(formatLongDate(day.date));
    if (day.heading || day.story?.heading) {
      lines.push(day.heading ?? day.story?.heading ?? '');
    }
    lines.push('-'.repeat(24));
    lines.push('');

    if (day.story) {
      for (const paragraph of day.story.paragraphs) {
        lines.push(paragraph.text);
        lines.push('');
      }
    }

    for (const piece of dayPieces) {
      const notes: string[] = [];
      if (piece.kind === 'voice') notes.push('spoken');
      if (piece.kind === 'photo') notes.push('photo');
      if (piece.kind === 'video') notes.push('video');
      if (piece.addedLater) notes.push('added later');
      if (piece.isFavorite) notes.push('kept');
      const suffix = notes.length > 0 ? ` · ${notes.join(' · ')}` : '';
      lines.push(`— ${formatTime(piece.createdAt)}${suffix}`);
      lines.push(piece.text);
      lines.push('');
    }

    lines.push('');
  }

  return lines.join('\n');
}

export function buildJsonBackup(data: RawExport): ExportBundle {
  const days = sortedDays(data.days).map((day) => {
    const { story, ...rest } = day;
    return {
      ...rest,
      story: story
        ? {
            heading: story.heading,
            paragraphs: story.paragraphs,
          }
        : undefined,
    };
  });

  const { id: _settingsId, ...settings } = data.settings;

  return {
    app: 'DayBook',
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    bookName: data.settings.bookName || 'My DayBook',
    note: 'Media blobs are not included in this backup. Only media metadata is stored.',
    settings,
    days,
    pieces: sortedPieces(data.pieces).map((piece) => ({
      id: piece.id,
      date: piece.date,
      kind: piece.kind,
      text: piece.text,
      originalText: piece.originalText,
      polishedText: piece.polishedText,
      polishStatus: piece.polishStatus,
      source: piece.source,
      createdAt: piece.createdAt,
      updatedAt: piece.updatedAt,
      capturedAt: piece.capturedAt,
      addedLater: piece.addedLater,
      isFavorite: piece.isFavorite,
      mediaId: piece.mediaId,
    })),
    recaps: data.recaps,
    ribbons: data.ribbons,
    daySignals: data.daySignals,
    votes: data.featureVotes,
    media: data.media.map((item) => {
      const { blob: _blob, ...metadata } = item;
      return { ...metadata, blobStored: false as const };
    }),
  };
}

function slug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'daybook'
  );
}

export function downloadTextFile(name: string, content: string): void {
  downloadBlob(name, new Blob([content], { type: 'text/plain;charset=utf-8' }));
}

export function downloadJsonFile(name: string, value: unknown): void {
  downloadBlob(
    name,
    new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }),
  );
}

function downloadBlob(name: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function readableExportName(bookName: string): string {
  return `${slug(bookName)}-${dateKey(new Date())}.txt`;
}

export function jsonExportName(bookName: string): string {
  return `${slug(bookName)}-${dateKey(new Date())}.json`;
}
