import type { Day, Piece } from '@shared/types';

export type ReplaySlide =
  | {
      id: string;
      kind: 'media';
      mediaId: string;
      mediaKind: 'photo' | 'video';
      caption?: string;
    }
  | {
      id: string;
      kind: 'text';
      text: string;
    };

const MAX_SLIDES = 12;

function trimCaption(text: string): string {
  const cleaned = text.trim().replace(/\s+/g, ' ');
  if (cleaned.length <= 190) return cleaned;
  const cut = cleaned.slice(0, 190);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 80 ? lastSpace : 190).trim()}…`;
}

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function nearestStorySentence(day: Day | undefined, piece: Piece): string | null {
  if (!day?.story) return null;
  const paragraph = day.story.paragraphs.find((item) =>
    item.sourcePieceIds.includes(piece.id),
  );
  if (!paragraph) return null;
  const first = sentences(paragraph.text)[0];
  return first ? trimCaption(first) : null;
}

function cap<T>(items: T[]): T[] {
  if (items.length <= MAX_SLIDES) return items;
  const head = items.slice(0, MAX_SLIDES - 1);
  return [...head, items[items.length - 1]];
}

export function buildReplaySlides(
  day: Day | undefined,
  pieces: Piece[],
  availableMedia: Set<string>,
): ReplaySlide[] {
  const mediaSlides: ReplaySlide[] = [];
  const ordered = [...pieces].sort((a, b) => a.createdAt - b.createdAt);

  for (const piece of ordered) {
    if (!piece.mediaId || !availableMedia.has(piece.mediaId)) continue;
    const kind = piece.kind === 'video' ? 'video' : 'photo';
    const ownCaption = trimCaption(piece.originalText || piece.text);
    const caption = ownCaption || nearestStorySentence(day, piece) || undefined;
    mediaSlides.push({
      id: `media-${piece.id}`,
      kind: 'media',
      mediaId: piece.mediaId,
      mediaKind: kind,
      caption,
    });
  }

  if (mediaSlides.length > 0) return cap(mediaSlides);

  if (!day?.story) return [];
  const textSlides: ReplaySlide[] = [];
  for (const paragraph of day.story.paragraphs) {
    for (const sentence of sentences(paragraph.text)) {
      textSlides.push({
        id: `text-${textSlides.length}`,
        kind: 'text',
        text: trimCaption(sentence),
      });
    }
  }
  return cap(textSlides);
}
