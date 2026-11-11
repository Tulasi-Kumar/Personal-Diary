import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useParams } from 'react-router-dom';
import { db } from '../../lib/db/db';
import { formatLongDate, formatMonth, monthDays } from '../../lib/db/dates';
import { enqueueRecap } from '../../lib/ai/queue';
import { useOnline } from '../../hooks/useOnline';
import { useToast } from '../../components/Toast';
import { computeSalience } from '../../lib/memory/salience';
import { firstSentence } from '../../lib/memory/sections';
import { NotFoundPage } from '../not-found/NotFoundPage';

function buildFallback(days: Array<{ date: string; story?: { paragraphs: Array<{ text: string }> }; heading?: string }>) {
  const sentences = days
    .filter((day) => day.story)
    .map((day) => firstSentence(day.story?.paragraphs[0]?.text ?? ''))
    .filter(Boolean);
  if (sentences.length === 0) return '';
  const opening = sentences.slice(0, 3).join(' ');
  const closing =
    'I want to keep the ordinary ones close. A month is mostly made of them.';
  return `${opening}\n\n${closing}`;
}

export function MonthlyRecapPage() {
  const { month = '' } = useParams();
  const online = useOnline();
  const toast = useToast();
  const valid = /^\d{4}-\d{2}$/.test(month);

  const data = useLiveQuery(
    async () => {
      if (!valid) return null;
      const keys = monthDays(month);
      const [recap, days, signals] = await Promise.all([
        db.recaps.where('month').equals(month).first(),
        db.days.where('date').anyOf(keys).toArray(),
        db.daySignals.where('date').anyOf(keys).toArray(),
      ]);
      return { recap, days, signals };
    },
    [month, valid],
  );

  if (!valid) return <NotFoundPage />;

  if (!data) {
    return (
      <div className="page--narrow stack stack-4">
        <div className="skeleton" style={{ height: '8rem', width: '100%' }} />
      </div>
    );
  }

  const readyDays = data.days
    .filter((day) => day.storyStatus === 'ready' && day.story)
    .sort((a, b) => a.date.localeCompare(b.date));
  const fallback = buildFallback(readyDays);
  const recapText = data.recap?.text ?? fallback;
  const paragraphs = recapText ? recapText.split(/\n{2,}/) : [];
  const dayByDate = new Map(data.days.map((day) => [day.date, day]));
  const highlightDays = (data.recap?.highlights ?? []).map((highlight) => {
    const day = readyDays.find((item) =>
      item.story?.paragraphs.some((paragraph) => paragraph.text.includes(highlight)),
    );
    return { highlight, day };
  });

  const pages = (data.signals.length > 0
    ? [...data.signals].sort((a, b) => computeSalience(b) - computeSalience(a))
    : readyDays.map((day) => ({
        date: day.date,
        hint: firstSentence(day.story?.paragraphs[0]?.text ?? ''),
      }))
  )
    .slice(0, 4)
    .map((signal) => ({
      date: signal.date,
      quote:
        firstSentence(dayByDate.get(signal.date)?.story?.paragraphs[0]?.text ?? '') ||
        signal.hint ||
        '',
    }))
    .filter((item) => Boolean(item.quote));

  async function generate() {
    if (!online) {
      toast.show('Offline. The month’s pages are still here.');
      return;
    }
    await enqueueRecap(month, { force: true });
    toast.show('The writing room is gathering this month.');
  }

  return (
    <div className="page--narrow stack stack-6">
      <header className="stack stack-3">
        <div className="row row--between">
          <p className="label label--bronze">Month in review</p>
          <Link to="/memories" className="label" style={{ letterSpacing: '0.08em' }}>
            Memories
          </Link>
        </div>
        <h1 className="display">{formatMonth(month)}</h1>
      </header>

      {paragraphs.length > 0 ? (
        <article className="stack stack-4">
          {paragraphs.map((paragraph, index) => (
            <p key={paragraph.slice(0, 20)} className={`body-lg${index === 0 ? ' drop-cap' : ''}`}>
              {paragraph}
            </p>
          ))}
        </article>
      ) : (
        <div className="empty empty--soft">
          <div className="empty__mark" />
          <p className="body muted">This month is still quiet.</p>
        </div>
      )}

      {highlightDays.length > 0 ? (
        <section className="section" aria-labelledby="highlights-title">
          <h2 id="highlights-title" className="section-title">
            Lines from the month
          </h2>
          <div className="hairline-list">
            {highlightDays.map(({ highlight, day }) =>
              day ? (
                <Link key={highlight} to={`/day/${day.date}`} className="return-page">
                  <span className="return-page__date">{formatLongDate(day.date)}</span>
                  <span className="return-page__quote">“{highlight}”</span>
                </Link>
              ) : (
                <p key={highlight} className="quote return-page__quote">
                  “{highlight}”
                </p>
              ),
            )}
          </div>
        </section>
      ) : null}

      {pages.length > 0 ? (
        <section className="section" aria-labelledby="pages-title">
          <h2 id="pages-title" className="section-title">
            Pages worth returning to
          </h2>
          <div className="hairline-list">
            {pages.map((page) => (
              <Link key={page.date} to={`/day/${page.date}`} className="return-page">
                <span className="return-page__date">{formatLongDate(page.date)}</span>
                <span className="return-page__quote">“{page.quote}”</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {!data.recap ? (
        <section className="section stack stack-3">
          <p className="body-sm muted">
            {fallback
              ? 'These are the month’s story lines. A written recap can gather them further.'
              : 'A recap will form once there are a few stories in this month.'}
          </p>
          <button type="button" className="btn btn--secondary" onClick={() => void generate()}>
            Write the recap
          </button>
        </section>
      ) : null}
    </div>
  );
}
