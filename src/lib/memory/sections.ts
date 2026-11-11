import { startOfWeek } from 'date-fns';
import type { Day, DaySignals, Piece, Recap, Ribbon } from '@shared/types';
import { db } from '../db/db';
import { dateKey, todayKey } from '../db/dates';
import { isDemoLoaded } from '../seed/demo';
import { computeReadiness, type ReadinessResult } from './readiness';
import { computeSalience } from './salience';
import { findThrowback, type Throwback } from './throwback';

export interface MemoriesData {
  pieces: Piece[];
  days: Day[];
  ribbons: Ribbon[];
  recaps: Recap[];
  signals: DaySignals[];
  readiness: ReadinessResult;
  demoLoaded: boolean;
  throwback: Throwback | null;
  weekStart: string;
  weekDays: Day[];
  topSignals: DaySignals[];
}

export interface SectionEligibility {
  throwback: boolean;
  week: boolean;
  marked: boolean;
  recap: boolean;
  pages: boolean;
}

export function throwbackLabel(throwback: Throwback): string {
  if (throwback.reason === 'nearby') {
    if (throwback.yearsAgo >= 1) return 'A day worth returning to';
    return 'From earlier this year';
  }
  if (throwback.yearsAgo <= 0) return 'A day worth returning to';
  if (throwback.yearsAgo === 1) return 'One year ago today';
  if (throwback.yearsAgo === 2) return 'Two years ago today';
  if (throwback.yearsAgo === 3) return 'Three years ago today';
  return `${throwback.yearsAgo} years ago today`;
}

export function sectionEligibility(data: MemoriesData): SectionEligibility {
  const storySignals = data.signals.filter((signal) => signal.storyBacked);
  const weekStart = data.weekStart;
  const hasWeek = data.weekDays.some(
    (day) => day.storyStatus === 'ready' && day.story && day.date >= weekStart,
  );
  return {
    throwback: Boolean(data.throwback),
    week: hasWeek,
    marked: data.ribbons.length > 0,
    recap: data.days.some((day) => day.storyStatus === 'ready' && Boolean(day.story)),
    pages: storySignals.length > 0,
  };
}

export function sortBySalience(signals: DaySignals[]): DaySignals[] {
  return [...signals].sort((a, b) => computeSalience(b) - computeSalience(a));
}

export async function loadMemoriesData(): Promise<MemoriesData> {
  const weekStartDate = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekStart = dateKey(weekStartDate);
  const today = todayKey();
  const [pieces, days, ribbons, recaps, signals, demoLoaded, throwback] = await Promise.all([
    db.pieces.toArray(),
    db.days.toArray(),
    db.ribbons.toArray(),
    db.recaps.toArray(),
    db.daySignals.toArray(),
    isDemoLoaded(),
    findThrowback(today),
  ]);
  const weekDays = days
    .filter((day) => day.date >= weekStart && day.date <= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const readiness = computeReadiness({
    pieces,
    days,
    ribbons,
    recaps,
    signals,
    demoLoaded,
  });
  const topSignals = sortBySalience(signals.filter((signal) => signal.storyBacked)).slice(0, 4);

  return {
    pieces,
    days,
    ribbons,
    recaps,
    signals,
    readiness,
    demoLoaded,
    throwback,
    weekStart,
    weekDays,
    topSignals,
  };
}

export function firstSentence(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';
  const match = trimmed.match(/^(.{0,180}?[.!?])(?:\s|$)/);
  return match ? match[1] : trimmed.slice(0, 180);
}
