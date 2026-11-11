import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  addMonths,
  format,
  getDaysInMonth,
  subMonths,
} from 'date-fns';
import { db } from '../../lib/db/db';
import {
  formatLongDate,
  formatMonth,
  monthDays,
  monthKey,
  parseMonthKey,
  todayKey,
} from '../../lib/db/dates';

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function CalendarPage() {
  const [params, setParams] = useSearchParams();
  const requested = params.get('month') ?? monthKey();
  const month = /^\d{4}-\d{2}$/.test(requested) ? requested : monthKey();
  const monthDate = parseMonthKey(month);
  const currentMonth = monthKey();

  const data = useLiveQuery(async () => {
    const keys = monthDays(month);
    if (keys.length === 0) return { pieceCounts: new Map<string, number>(), days: new Map(), anniversary: new Set<string>() };
    const [days, pieces, allSignals] = await Promise.all([
      db.days.where('date').anyOf(keys).toArray(),
      db.pieces.where('date').anyOf(keys).toArray(),
      db.daySignals.toArray(),
    ]);
    const pieceCounts = new Map<string, number>();
    for (const piece of pieces) {
      pieceCounts.set(piece.date, (pieceCounts.get(piece.date) ?? 0) + 1);
    }
    const dayMap = new Map(days.map((day) => [day.date, day]));
    const byMonthDay = new Map<string, string[]>();
    for (const signal of allSignals) {
      if (!signal.storyBacked) continue;
      const key = signal.date.slice(5);
      const list = byMonthDay.get(key) ?? [];
      list.push(signal.date);
      byMonthDay.set(key, list);
    }
    const anniversary = new Set(
      Array.from(byMonthDay.entries())
        .filter(([, dates]) => dates.length > 1)
        .map(([key]) => key),
    );
    const earliestYear = allSignals.reduce(
      (earliest, signal) => Math.min(earliest, Number(signal.date.slice(0, 4))),
      new Date().getFullYear(),
    );
    return { pieceCounts, days: dayMap, anniversary, earliestYear };
  }, [month]);

  const leadingBlanks = (monthDate.getDay() + 6) % 7;
  const daysInMonth = getDaysInMonth(monthDate);
  const years = yearOptions(data?.earliestYear ?? new Date().getFullYear());
  const today = todayKey();

  function setMonth(nextMonth: string) {
    const next = nextMonth > currentMonth ? currentMonth : nextMonth;
    setParams({ month: next });
  }

  function onYearChange(year: number) {
    const monthNumber = monthDate.getMonth() + 1;
    const next = `${year}-${String(monthNumber).padStart(2, '0')}`;
    setMonth(next);
  }

  function onMonthNumberChange(monthNumber: number) {
    const next = `${monthDate.getFullYear()}-${String(monthNumber).padStart(2, '0')}`;
    setMonth(next);
  }

  const previous = format(subMonths(monthDate, 1), 'yyyy-MM');
  const next = format(addMonths(monthDate, 1), 'yyyy-MM');
  const canGoNext = next <= currentMonth;

  return (
    <div className="page--narrow stack stack-5">
      <header className="calendar-header">
        <div>
          <p className="label label--bronze">Calendar</p>
          <h1 className="display" style={{ marginTop: '0.3rem' }}>
            {formatMonth(month)}
          </h1>
        </div>
        <Link to="/" className="label label--bronze" style={{ letterSpacing: '0.08em' }}>
          Today
        </Link>
      </header>

      <div className="calendar-controls">
        <div className="row" style={{ gap: '0.25rem' }}>
          <button
            type="button"
            className="btn-icon"
            onClick={() => setMonth(previous)}
            aria-label="Previous month"
          >
            <ChevronLeft />
          </button>
          <button
            type="button"
            className="btn-icon"
            onClick={() => setMonth(next)}
            aria-label="Next month"
            disabled={!canGoNext}
          >
            <ChevronRight />
          </button>
        </div>

        <div className="calendar-pickers">
          <label className="sr-only" htmlFor="calendar-month">
            Month
          </label>
          <select
            id="calendar-month"
            className="calendar-select"
            value={monthDate.getMonth() + 1}
            onChange={(event) => onMonthNumberChange(Number(event.target.value))}
          >
            {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => (
              <option key={value} value={value}>
                {format(new Date(2020, value - 1, 1), 'MMMM')}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="calendar-year">
            Year
          </label>
          <select
            id="calendar-year"
            className="calendar-select"
            value={monthDate.getFullYear()}
            onChange={(event) => onYearChange(Number(event.target.value))}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="calendar-grid" role="group" aria-label={`Calendar for ${formatMonth(month)}`}>
        <div className="calendar-weekdays" aria-hidden="true">
          {weekdays.map((day) => (
            <span key={day} className="calendar-weekday">
              {day}
            </span>
          ))}
        </div>

        <div className="calendar-cells">
          {Array.from({ length: leadingBlanks }).map((_, index) => (
            <span key={`blank-${index}`} className="calendar-cell calendar-cell--blank" aria-hidden="true" />
          ))}
          {Array.from({ length: daysInMonth }, (_, index) => {
            const date = `${month}-${String(index + 1).padStart(2, '0')}`;
            const count = data?.pieceCounts.get(date) ?? 0;
            const day = data?.days.get(date);
            const hasStory = day?.storyStatus === 'ready' && Boolean(day.story);
            const anniversary = data?.anniversary.has(date.slice(5)) ?? false;
            const isToday = date === today;
            const isFuture = date > today;
            return (
              <Link
                key={date}
                to={`/day/${date}`}
                className={`calendar-cell${isToday ? ' is-today' : ''}${isFuture ? ' is-future' : ''}`}
                aria-label={`${formatLongDate(date)}${count > 0 || hasStory ? ', has writing' : ''}${anniversary ? ', remembered in another year' : ''}`}
                aria-current={isToday ? 'date' : undefined}
              >
                <span className="calendar-day">{index + 1}</span>
                {count > 0 || hasStory ? <span className="calendar-dot" aria-hidden="true" /> : null}
                {anniversary ? <span className="calendar-ring" aria-hidden="true" /> : null}
              </Link>
            );
          })}
        </div>
      </div>

      {data && data.pieceCounts.size === 0 && data.days.size === 0 ? (
        <p className="empty body-sm muted" style={{ paddingTop: 0 }}>
          No pages in this month yet. The first mark can be small.
        </p>
      ) : null}

      <div className="calendar-legend">
        <span className="quiet-line"><span className="calendar-dot" aria-hidden="true" /> Writing</span>
        {data && data.anniversary.size > 0 ? (
          <span className="quiet-line"><span className="calendar-ring" aria-hidden="true" /> Remembered</span>
        ) : null}
      </div>
    </div>
  );
}

function yearOptions(earliestYear: number): number[] {
  const current = new Date().getFullYear();
  const start = Math.min(current - 5, earliestYear);
  return Array.from({ length: current - start + 1 }, (_, index) => current - index);
}
