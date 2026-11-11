import type { DaySignals, Ribbon, RibbonLabel } from '@shared/types';
import { db } from '../db/db';
import { parseDateKey } from '../db/dates';
import { computeSalience } from './salience';

const RARITY_MIN_DAYS = 14;
const SPACING_DAYS = 7;
const DAY_MS = 86_400_000;

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: number[], average: number): number {
  if (values.length < 2) return 0;
  const variance =
    values.reduce((sum, value) => sum + (value - average) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export async function recomputeRibbonRarity(): Promise<void> {
  const [signals, ribbons] = await Promise.all([db.daySignals.toArray(), db.ribbons.toArray()]);
  const storySignals = signals.filter((signal) => signal.storyBacked);
  if (storySignals.length < RARITY_MIN_DAYS) return;

  const signalByDate = new Map<string, DaySignals>(
    storySignals.map((signal) => [signal.date, signal]),
  );
  const labels = Array.from(
    new Set(
      ribbons
        .filter((ribbon) => ribbon.source === 'ai')
        .map((ribbon) => ribbon.label as RibbonLabel),
    ),
  );

  const toDelete: string[] = [];

  for (const label of labels) {
    const candidates = ribbons
      .filter((ribbon) => ribbon.source === 'ai' && ribbon.label === label)
      .map((ribbon) => {
        const signal = signalByDate.get(ribbon.date);
        return {
          ribbon,
          score: signal ? computeSalience(signal) : 0,
        };
      })
      .sort((a, b) => b.score - a.score);

    if (candidates.length === 0) continue;
    const scores = candidates.map((candidate) => candidate.score);
    const average = mean(scores);
    const deviation = standardDeviation(scores, average);
    const threshold = Math.max(average + deviation * 0.35, 0.34);
    const kept: Array<{ ribbon: Ribbon; score: number }> = [];

    for (const candidate of candidates) {
      if (candidate.score < threshold) continue;
      const candidateTime = parseDateKey(candidate.ribbon.date).getTime();
      const tooClose = kept.some(
        (awarded) =>
          Math.abs(parseDateKey(awarded.ribbon.date).getTime() - candidateTime) <
          SPACING_DAYS * DAY_MS,
      );
      if (tooClose) continue;
      kept.push(candidate);
    }

    for (const candidate of candidates) {
      if (!kept.includes(candidate)) toDelete.push(candidate.ribbon.id);
    }
  }

  if (toDelete.length > 0) {
    await db.ribbons.bulkDelete(toDelete);
  }
}
