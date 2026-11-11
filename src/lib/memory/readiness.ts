import type { Day, DaySignals, Piece, Recap, Ribbon } from '@shared/types';
import { parseDateKey } from '../db/dates';
import { kvGet, kvSet } from '../db/repositories';

export const READINESS_VERSION = 1;
const READINESS_CACHE_KEY = 'readiness:cache';

export interface ReadinessInput {
  pieces: Piece[];
  days: Day[];
  ribbons: Ribbon[];
  recaps: Recap[];
  signals: DaySignals[];
  now?: Date;
  demoLoaded?: boolean;
}

export interface ReadinessResult {
  score: number;
  level: 'forming' | 'partial' | 'full';
  span: number;
  density: number;
  volume: number;
  engagement: number;
  consistency: number;
  activeDays: number;
  totalEntries: number;
  historyStart: string | null;
}

export const READY_FORMING = 0.35;
export const READY_FULL = 0.65;
export const SPAN_TARGET_DAYS = 365 * 5;

export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function localDayStart(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function computeReadiness(input: ReadinessInput): ReadinessResult {
  const activeDates = new Set(input.pieces.map((piece) => piece.date));
  const activeDays = activeDates.size;
  const totalEntries = input.pieces.length;

  const sortedDates = Array.from(activeDates).sort();
  const historyStart = sortedDates[0] ?? null;
  const now = input.now ?? new Date();

  let span = 0;
  if (historyStart) {
    const start = localDayStart(parseDateKey(historyStart));
    const elapsedDays = Math.max(0, (now.getTime() - start) / 86_400_000);
    span = clamp01(elapsedDays / SPAN_TARGET_DAYS);
  }

  const density = activeDays === 0 ? 0 : clamp01(totalEntries / activeDays / 3);

  const volume = clamp01(totalEntries / 300);

  const favoritePieces = input.pieces.filter((piece) => piece.isFavorite).length;
  const ribbonDays = new Set(input.ribbons.map((ribbon) => ribbon.date)).size;
  const engagement =
    activeDays === 0 ? 0 : clamp01((favoritePieces + ribbonDays) / activeDays / 2);

  const last30 = new Date(now.getTime() - 30 * 86_400_000);
  const recentActive = Array.from(activeDates).filter(
    (date) => parseDateKey(date).getTime() >= localDayStart(last30),
  ).length;
  const consistency = clamp01(recentActive / 14);

  let score =
    0.3 * span + 0.25 * density + 0.15 * volume + 0.2 * engagement + 0.1 * consistency;

  if (input.demoLoaded) score = Math.max(score, 0.72);

  score = clamp01(score);
  const level = score < READY_FORMING ? 'forming' : score < READY_FULL ? 'partial' : 'full';

  return {
    score,
    level,
    span,
    density,
    volume,
    engagement,
    consistency,
    activeDays,
    totalEntries,
    historyStart,
  };
}

export function historyYears(historyStart: string | null, now = new Date()): number {
  if (!historyStart) return 0;
  return (now.getTime() - parseDateKey(historyStart).getTime()) / (365.25 * 86_400_000);
}

function latest(values: number[]): number {
  return values.reduce((max, value) => Math.max(max, value), 0);
}

export function readinessInputHash(input: ReadinessInput): string {
  return [
    input.pieces.length,
    input.days.length,
    input.ribbons.length,
    input.recaps.length,
    input.signals.length,
    latest(input.pieces.map((piece) => piece.updatedAt)),
    latest(input.days.map((day) => day.updatedAt)),
    latest(input.ribbons.map((ribbon) => ribbon.awardedAt)),
    latest(input.recaps.map((recap) => recap.generatedAt)),
    latest(input.signals.map((signal) => signal.updatedAt)),
    input.demoLoaded ? 1 : 0,
    new Date().toISOString().slice(0, 10),
  ].join('|');
}

interface ReadinessCacheEntry {
  version: number;
  hash: string;
  result: ReadinessResult;
}

export async function computeReadinessCached(input: ReadinessInput): Promise<ReadinessResult> {
  const hash = readinessInputHash(input);
  const cached = await kvGet<ReadinessCacheEntry>(READINESS_CACHE_KEY);
  if (cached?.version === READINESS_VERSION && cached.hash === hash) {
    return cached.result;
  }
  const result = computeReadiness(input);
  await kvSet(READINESS_CACHE_KEY, {
    version: READINESS_VERSION,
    hash,
    result,
  } satisfies ReadinessCacheEntry);
  return result;
}
