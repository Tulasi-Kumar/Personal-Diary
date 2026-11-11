import type { DaySignals } from '@shared/types';
import { db } from '../db/db';
import { parseDateKey } from '../db/dates';
import { decayedInteractionScore, interactionEvents } from './interactions';

function firstSentence(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';
  const match = trimmed.match(/^(.{0,160}?[.!?])(?:\s|$)/);
  return match ? match[1] : trimmed.slice(0, 160);
}

export function interactionScoreFor(date: string, timestamps: number[]): number {
  if (timestamps.length === 0) return 0;
  const day = parseDateKey(date);
  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
  const end = start + 86_400_000;
  const latest = Math.max(...timestamps);
  return Math.max(0, Math.min(1, (latest - start) / (end - start)));
}

export async function computeDaySignals(date: string): Promise<DaySignals> {
  const [day, pieces, ribbons, events] = await Promise.all([
    db.days.get(date),
    db.pieces.where('date').equals(date).toArray(),
    db.ribbons.where('date').equals(date).toArray(),
    interactionEvents(date),
  ]);
  const sortedPieces = pieces.sort((a, b) => a.createdAt - b.createdAt);
  const mediaCount = sortedPieces.filter((piece) => Boolean(piece.mediaId)).length;
  const winning = [...ribbons].sort((a, b) => b.awardedAt - a.awardedAt)[0] ?? null;
  const storyBacked = day?.storyStatus === 'ready' && Boolean(day.story);
  const hint =
    firstSentence(day?.story?.paragraphs[0]?.text ?? '') ||
    firstSentence(sortedPieces[0]?.polishedText ?? sortedPieces[0]?.text ?? '');
  const pieceInteraction = interactionScoreFor(
    date,
    sortedPieces.map((piece) => piece.createdAt),
  );
  const recordedInteraction = decayedInteractionScore(events);

  return {
    date,
    hint,
    people: [],
    places: [],
    winningRibbon: winning?.label ?? null,
    winningRibbonStrength: winning ? 0.6 : 0,
    interactionScore: Math.max(pieceInteraction, recordedInteraction),
    storyBacked,
    pieceCount: sortedPieces.length,
    mediaCount,
    updatedAt: Date.now(),
  };
}

export async function refreshDaySignals(date: string): Promise<DaySignals> {
  const existing = await db.daySignals.get(date);
  const computed = await computeDaySignals(date);
  const merged: DaySignals = {
    ...computed,
    people: existing?.people.length ? existing.people : computed.people,
    places: existing?.places.length ? existing.places : computed.places,
    winningRibbonStrength: Math.max(
      existing?.winningRibbonStrength ?? 0,
      computed.winningRibbonStrength,
    ),
    updatedAt: Date.now(),
  };
  await db.daySignals.put(merged);
  return merged;
}

export async function refreshSignalsForAllDates(): Promise<void> {
  const pieces = await db.pieces.toArray();
  const dates = Array.from(new Set(pieces.map((piece) => piece.date)));
  await Promise.all(dates.map((date) => refreshDaySignals(date)));
}
