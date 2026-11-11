import {
  addDays,
  addMonths,
  addYears,
  differenceInCalendarDays,
  format,
  isSameDay,
  parse,
  startOfMonth,
  subDays,
  subMonths,
  subYears,
} from 'date-fns';

export function dateKey(date = new Date()): string {
  return format(date, 'yyyy-MM-dd');
}

export function monthKey(date = new Date()): string {
  return format(date, 'yyyy-MM');
}

export function parseDateKey(key: string): Date {
  return parse(key, 'yyyy-MM-dd', new Date());
}

export function parseMonthKey(key: string): Date {
  return parse(key, 'yyyy-MM', new Date());
}

export function todayKey(): string {
  return dateKey(new Date());
}

export function isToday(key: string): boolean {
  return key === todayKey();
}

export function isPast(key: string): boolean {
  return key < todayKey();
}

export function formatLongDate(key: string): string {
  return format(parseDateKey(key), 'EEEE, d MMMM yyyy');
}

export function formatShortDate(key: string): string {
  return format(parseDateKey(key), 'd MMM');
}

export function formatMonth(key: string): string {
  return format(parseMonthKey(key), 'MMMM yyyy');
}

export function formatTime(ts: number): string {
  return format(new Date(ts), 'HH:mm');
}

export function humanDayDistance(fromKey: string, toKey: string): string {
  const days = differenceInCalendarDays(parseDateKey(toKey), parseDateKey(fromKey));
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days === -1) return 'yesterday';
  if (days > 1 && days < 7) return `in ${days} days`;
  if (days < -1 && days > -7) return `${Math.abs(days)} days ago`;
  if (days > 0) return formatLongDate(toKey);
  return formatLongDate(toKey);
}

export function sameYearMonthDay(a: string, b: string): boolean {
  return a.slice(5) === b.slice(5);
}

export function yearsBack(key: string, years: number): string {
  return dateKey(subYears(parseDateKey(key), years));
}

export function previousMonth(key: string): string {
  return monthKey(subMonths(parseMonthKey(key), 1));
}

export function nextMonth(key: string): string {
  return monthKey(addMonths(parseMonthKey(key), 1));
}

export function monthDays(key: string): string[] {
  const start = startOfMonth(parseMonthKey(key));
  const result: string[] = [];
  for (let i = 0; i < 31; i += 1) {
    const date = addDays(start, i);
    if (date.getMonth() !== start.getMonth()) break;
    result.push(dateKey(date));
  }
  return result;
}

export function relativeToTodayLabel(key: string): string {
  if (isToday(key)) return 'Today';
  const yesterday = dateKey(subDays(new Date(), 1));
  if (key === yesterday) return 'Yesterday';
  return formatLongDate(key);
}

export function dateWithinDays(a: string, b: string, days: number): boolean {
  return Math.abs(differenceInCalendarDays(parseDateKey(a), parseDateKey(b))) <= days;
}

export function copyDate(date: Date): Date {
  return new Date(date.getTime());
}

export function oneYearAgo(key: string): string {
  return dateKey(addYears(parseDateKey(key), -1));
}

export function sameDay(a: Date, b: Date): boolean {
  return isSameDay(a, b);
}
