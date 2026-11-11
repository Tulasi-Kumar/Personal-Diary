import type { DaySignals } from '@shared/types';
import { db } from '../db/db';
import { parseDateKey, sameYearMonthDay, todayKey } from '../db/dates';
import { computeSalience } from './salience';

export interface Throwback {
  date: string;
  yearsAgo: number;
  reason: 'anniversary' | 'nearby';
  salience: number;
}

function yearsBetween(from: string, to: string): number {
  return Math.max(0, to.slice(0, 4) ? Number(to.slice(0, 4)) - Number(from.slice(0, 4)) : 0);
}

function differenceInDays(a: string, b: string): number {
  const da = parseDateKey(a).getTime();
  const dbt = parseDateKey(b).getTime();
  return Math.abs(da - dbt) / 86_400_000;
}

export async function findThrowback(today = todayKey()): Promise<Throwback | null> {
  const signals = await db.daySignals.toArray();
  const candidates = signals.filter(
    (signal) => signal.storyBacked && signal.date < today,
  );
  if (candidates.length === 0) return null;

  const anniversary = candidates
    .filter((signal) => sameYearMonthDay(signal.date, today))
    .sort((a, b) => b.date.localeCompare(a.date))[0];

  if (anniversary) {
    return {
      date: anniversary.date,
      yearsAgo: yearsBetween(anniversary.date, today),
      reason: 'anniversary',
      salience: computeSalience(anniversary),
    };
  }

  const nearby = candidates
    .filter((signal) => differenceInDays(signal.date, today) <= 90)
    .sort((a, b) => {
      const salienceDelta = computeSalience(b) - computeSalience(a);
      if (Math.abs(salienceDelta) > 0.02) return salienceDelta;
      return differenceInDays(a.date, today) - differenceInDays(b.date, today);
    })[0];

  if (!nearby) return null;
  return {
    date: nearby.date,
    yearsAgo: yearsBetween(nearby.date, today),
    reason: 'nearby',
    salience: computeSalience(nearby),
  };
}

export async function findAnniversary(date: string): Promise<string | null> {
  const signals = await db.daySignals.toArray();
  const matches = signals
    .filter(
      (signal) =>
        signal.storyBacked && signal.date < date && sameYearMonthDay(signal.date, date),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  return matches[0]?.date ?? null;
}

export function bestBySalience(signals: DaySignals[]): DaySignals | null {
  if (signals.length === 0) return null;
  return [...signals].sort((a, b) => computeSalience(b) - computeSalience(a))[0];
}
