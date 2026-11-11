import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useSearchParams } from 'react-router-dom';
import type { Ribbon } from '@shared/types';
import { useMemoriesData } from '../../hooks/useMemoriesData';
import { formatLongDate, formatMonth, monthKey } from '../../lib/db/dates';
import { loadWeekLetter } from '../../lib/memory/weekly';
import { firstSentence, sectionEligibility, throwbackLabel } from '../../lib/memory/sections';
import { MarkedDaySheet } from './MarkedDaySheet';

export function MemoriesPage() {
  const data = useMemoriesData();
  const weekLetter = useLiveQuery(() => loadWeekLetter(), []);
  const [params, setParams] = useSearchParams();
  const [markedRibbon, setMarkedRibbon] = useState<Ribbon | null>(null);

  useEffect(() => {
    const markId = params.get('mark');
    if (!markId || !data) return;
    const ribbon = data.ribbons.find((item) => item.id === markId);
    if (ribbon) setMarkedRibbon(ribbon);
  }, [params, data]);

  function closeMarked() {
    setMarkedRibbon(null);
    if (params.get('mark')) {
      const next = new URLSearchParams(params);
      next.delete('mark');
      setParams(next, { replace: true });
    }
  }

  if (!data) {
    return (
      <div className="page--narrow stack stack-4">
        <p className="label label--bronze">Memories</p>
        <div className="skeleton" style={{ height: '7rem', width: '100%' }} />
      </div>
    );
  }

  const { readiness, throwback, demoLoaded } = data;
  const eligible = sectionEligibility(data);
  const anySection =
    eligible.throwback || eligible.week || eligible.marked || eligible.recap || eligible.pages;

  const dayByDate = new Map(data.days.map((day) => [day.date, day]));
  const markedDays = [...data.ribbons]
    .sort((a, b) => b.awardedAt - a.awardedAt)
    .slice(0, 8)
    .map((ribbon) => ({ ribbon, day: dayByDate.get(ribbon.date) }))
    .filter((item) => Boolean(item.day));

  const monthCounts = new Map<string, number>();
  for (const day of data.days) {
    if (day.storyStatus !== 'ready' || !day.story) continue;
    const month = day.date.slice(0, 7);
    monthCounts.set(month, (monthCounts.get(month) ?? 0) + 1);
  }
  const months = Array.from(monthCounts.entries())
    .filter(([, count]) => count > 0)
    .map(([month]) => month)
    .sort()
    .reverse()
    .slice(0, 3);

  const topPages = data.topSignals
    .map((signal) => {
      const day = dayByDate.get(signal.date);
      if (!day) return null;
      const quote =
        firstSentence(day.story?.paragraphs[0]?.text ?? '') || signal.hint;
      if (!quote) return null;
      return { signal, day, quote };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  if (!anySection) {
    return (
      <div className="page--narrow stack stack-5">
        <MemoriesHeader demoLoaded={demoLoaded} />
        <section className="empty memories-forming">
          <div className="empty__mark" />
          <p className="body muted">Your memories are forming.</p>
          <p className="body-sm faint" style={{ marginTop: '0.5rem' }}>
            Keep writing. The pages will begin to find each other.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="page--narrow stack stack-6">
      <MemoriesHeader demoLoaded={demoLoaded} />

      {readiness.level !== 'forming' ? (
        <p className="body-sm muted memories-intro">
          The days are beginning to gather. Nothing here is a score.
        </p>
      ) : null}

      {eligible.throwback && throwback ? (
        <section className="section" aria-labelledby="throwback-title">
          <h2 id="throwback-title" className="section-title">
            {throwbackLabel(throwback)}
          </h2>
          {(() => {
            const day = dayByDate.get(throwback.date);
            const excerpt = firstSentence(day?.story?.paragraphs[0]?.text ?? '');
            return (
              <Link to={`/day/${throwback.date}`} className="memory-feature">
                <h3 className="headline">{day?.heading ?? day?.story?.heading ?? 'A day worth returning to'}</h3>
                <p className="meta" style={{ marginTop: '0.3rem' }}>
                  {formatLongDate(throwback.date)}
                </p>
                {excerpt ? <p className="body muted memory-feature__excerpt">{excerpt}</p> : null}
                <span className="quiet-link">Return to this day</span>
              </Link>
            );
          })()}
        </section>
      ) : null}

      {eligible.week && weekLetter?.hasMaterial ? (
        <section className="section" aria-labelledby="week-title">
          <h2 id="week-title" className="section-title">
            This week
          </h2>
          <div className="week-letter stack stack-3">
            {weekLetter.paragraphs.map((paragraph, index) => (
              <p key={paragraph.slice(0, 24)} className={index === 0 ? 'body' : 'body-sm muted'}>
                {paragraph}
              </p>
            ))}
          </div>
          <div className="week-highlights">
            {weekLetter.highlights.map((highlight) => {
              const day = dayByDate.get(highlight.date);
              return (
                <Link key={`${highlight.date}-${highlight.quote.slice(0, 16)}`} to={`/day/${highlight.date}`} className="week-highlight">
                  <span className="label label--bronze">{day?.heading ?? formatLongDate(highlight.date)}</span>
                  <span className="body-sm muted">“{highlight.quote}”</span>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {eligible.pages && topPages.length > 0 ? (
        <section className="section" aria-labelledby="pages-title">
          <h2 id="pages-title" className="section-title">
            Pages worth returning to
          </h2>
          <div className="hairline-list">
            {topPages.map(({ day, quote }) => (
              <Link key={day.date} to={`/day/${day.date}`} className="return-page">
                <span className="return-page__date">{formatLongDate(day.date)}</span>
                <span className="return-page__quote">“{quote}”</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {eligible.marked && markedDays.length > 0 ? (
        <section className="section" aria-labelledby="marked-title">
          <h2 id="marked-title" className="section-title">
            Marked days
          </h2>
          <div className="marked-row hide-scrollbar">
            {markedDays.map(({ ribbon, day }) => (
              <button
                key={ribbon.id}
                type="button"
                className="marked-card"
                onClick={() => setMarkedRibbon(ribbon)}
              >
                <span className="label label--bronze">{ribbon.label}</span>
                <span className="marked-card__heading">{day?.heading ?? day?.story?.heading ?? 'A marked day'}</span>
                <span className="marked-card__date">{formatLongDate(ribbon.date)}</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {eligible.recap && months.length > 0 ? (
        <section className="section" aria-labelledby="recap-title">
          <h2 id="recap-title" className="section-title">
            Month in review
          </h2>
          <div className="hairline-list">
            {months.map((month) => (
              <Link key={month} to={`/memories/month/${month}`} className="memory-row">
                <span className="body">{month === monthKey() ? 'This month' : formatMonth(month)}</span>
                <span className="label label--muted">Open</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <MarkedDaySheet ribbon={markedRibbon} onClose={closeMarked} />
    </div>
  );
}

function MemoriesHeader({ demoLoaded }: { demoLoaded: boolean }) {
  return (
    <header className="page-header" style={{ marginBottom: 0 }}>
      <div>
        <p className="label label--bronze">Memories</p>
        <h1 className="display" style={{ marginTop: '0.3rem' }}>
          What the days remember
        </h1>
        {demoLoaded ? (
          <span className="badge badge--demo" style={{ marginTop: '0.6rem' }}>
            Demo pages
          </span>
        ) : null}
      </div>
      <Link to="/calendar" className="label label--bronze" style={{ letterSpacing: '0.08em' }}>
        Calendar
      </Link>
    </header>
  );
}
