import { dateKey, monthKey } from '../db/dates';
import { kvGet, kvSet } from '../db/repositories';
import { AiClientError } from './client';

export const AI_DAILY_LIMIT = 40;
export const AI_MONTHLY_LIMIT = 2000;

interface Usage {
  day: string;
  dayCount: number;
  month: string;
  monthCount: number;
}

const KEY = 'daybook:ai-usage';

async function readUsage(): Promise<Usage> {
  const today = dateKey();
  const month = monthKey();
  const stored = await kvGet<Usage>(KEY);
  if (!stored || stored.day !== today || stored.month !== month) {
    return {
      day: today,
      dayCount: stored?.day === today ? stored.dayCount : 0,
      month,
      monthCount: stored?.month === month ? stored.monthCount : 0,
    };
  }
  return stored;
}

export async function getAiUsage(): Promise<Usage> {
  return readUsage();
}

export async function recordAiCall(): Promise<Usage> {
  const usage = await readUsage();
  const next = {
    ...usage,
    dayCount: usage.dayCount + 1,
    monthCount: usage.monthCount + 1,
  };
  await kvSet(KEY, next);
  return next;
}

export function hasQuota(usage: Usage): boolean {
  return usage.dayCount < AI_DAILY_LIMIT && usage.monthCount < AI_MONTHLY_LIMIT;
}

export async function assertQuota(): Promise<void> {
  const usage = await readUsage();
  if (!hasQuota(usage)) {
    throw new AiClientError(
      'AI_RATE_LIMITED',
      'The writing room is resting for today. Your words are safe.',
      429,
    );
  }
}
