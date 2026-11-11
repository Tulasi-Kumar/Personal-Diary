import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, Pencil } from 'lucide-react';
import type { Piece, Story } from '@shared/types';
import {
  formatLongDate,
  isPast,
  isToday,
  parseDateKey,
  todayKey,
} from '../../lib/db/dates';
import { setDayHeading } from '../../lib/db/repositories';
import { enqueueStory } from '../../lib/ai/queue';
import { recordInteraction } from '../../lib/memory/interactions';
import { useToast } from '../../components/Toast';
import { Composer } from './Composer';
import { PieceCard } from './PieceCard';
import { useDayData } from './useDayData';
import { NotFoundPage } from '../not-found/NotFoundPage';

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = parseDateKey(value);
  return !Number.isNaN(date.getTime());
}

export function DayPage() {
  const { date = '' } = useParams();
  if (!isValidDate(date)) return <NotFoundPage />;
  return <DayReader date={date} />;
}

function DayReader({ date }: { date: string }) {
  const { day, pieces, loading } = useDayData(date);
  const toast = useToast();
  const [editingHeading, setEditingHeading] = useState(false);
  const [headingDraft, setHeadingDraft] = useState('');

  const heading = day?.heading ?? day?.story?.heading ?? '';
  const today = isToday(date);

  useEffect(() => {
    void recordInteraction(date, 'day-open');
  }, [date]);

  useEffect(() => {
    if (day?.storyStatus !== 'ready' || !day.story) return;
    const timer = window.setTimeout(() => {
      void recordInteraction(date, 'story-read');
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [date, day?.storyStatus, day?.story]);

  const wrapTriggered = useRef(false);
  useEffect(() => {
    if (wrapTriggered.current) return;
    if (!isPast(date) || pieces.length === 0) return;
    if (day?.story?.form === 'full') {
      wrapTriggered.current = true;
      return;
    }
    const status = day?.storyStatus;
    if (status === 'queued' || status === 'generating' || status === 'error') return;
    wrapTriggered.current = true;
    void enqueueStory(date);
  }, [date, pieces.length, day?.story?.form, day?.storyStatus]);

  async function saveHeading() {
    await setDayHeading(date, headingDraft);
    setEditingHeading(false);
    toast.show('Heading saved.');
  }

  return (
    <div className="page--narrow stack stack-6">
      <header className="stack stack-3">
        <div className="row row--between">
          <p className="label label--bronze">{today ? 'Today' : 'A page from'}</p>
          <div className="row" style={{ gap: '0.75rem' }}>
            {day?.story || pieces.length > 0 ? (
              <Link to={`/day/${date}/replay`} className="label" style={{ letterSpacing: '0.08em' }}>
                Replay
              </Link>
            ) : null}
            <Link to="/calendar" className="label" style={{ letterSpacing: '0.08em' }}>
              Calendar
            </Link>
            {!today ? (
              <Link to="/" className="label" style={{ letterSpacing: '0.08em' }}>
                Today
              </Link>
            ) : null}
          </div>
        </div>

        {editingHeading ? (
          <div className="row">
            <input
              className="input"
              value={headingDraft}
              onChange={(event) => setHeadingDraft(event.target.value)}
              aria-label="Day heading"
              autoFocus
            />
            <button type="button" className="btn-icon" onClick={() => void saveHeading()} aria-label="Save heading">
              <Check />
            </button>
          </div>
        ) : (
          <div className="row row--between">
            <h1 className="display">{heading || 'This day'}</h1>
            <button
              type="button"
              className="btn-icon"
              onClick={() => {
                setHeadingDraft(heading);
                setEditingHeading(true);
              }}
              aria-label="Edit the day heading"
              title="Edit heading"
            >
              <Pencil />
            </button>
          </div>
        )}
        <p className="meta">{formatLongDate(date)}</p>
      </header>

      <hr className="rule" />

      {loading ? (
        <div className="stack stack-3" aria-label="Loading the day">
          <div className="skeleton" style={{ height: '1.5rem', width: '52%' }} />
          <div className="skeleton" style={{ height: '8rem', width: '100%' }} />
        </div>
      ) : (
        <>
          <StoryReader day={day} pieces={pieces} date={date} />

          {pieces.length > 0 ? (
            <section className="section" aria-labelledby="everything">
              <h2 id="everything" className="section-title">
                Everything I wrote
              </h2>
              <div className="hairline-list">
                {pieces.map((piece) => (
                  <PieceCard key={piece.id} piece={piece} />
                ))}
              </div>
            </section>
          ) : (
            <div className="empty">
              <div className="empty__mark" />
              <p className="body muted">Nothing was written on this day yet.</p>
            </div>
          )}

          <section className="section">
            <Composer date={date} isToday={today} onSaved={() => undefined} />
          </section>
        </>
      )}
    </div>
  );
}

function StoryReader({
  day,
  pieces,
  date,
}: {
  day: ReturnType<typeof useDayData>['day'];
  pieces: Piece[];
  date: string;
}) {
  const [sourcesOpen, setSourcesOpen] = useState<number | null>(null);

  if (!day || day.storyStatus === 'none') {
    if (pieces.length === 0) return null;
    return (
      <div className="story-card story-card--quiet">
        <p className="quiet-line">
          <span className="spinner" aria-hidden="true" />
          The story will form from these pieces.
        </p>
      </div>
    );
  }

  if (day.storyStatus === 'queued' || day.storyStatus === 'generating') {
    return (
      <div className="story-card story-card--quiet" aria-live="polite">
        <p className="quiet-line">
          <span className="spinner" aria-hidden="true" />
          {isPast(date) && day.story?.form !== 'full'
            ? 'Wrapping up the day into its full page.'
            : 'Gathering the day into a page.'}
        </p>
      </div>
    );
  }

  if (day.storyStatus === 'error') {
    return (
      <div className="story-card story-card--quiet">
        <p className="body-sm muted">The story is resting. Your pieces are safe.</p>
        <button
          type="button"
          className="btn btn--ghost"
          style={{ paddingLeft: 0 }}
          onClick={() => void enqueueStory(date, { force: true })}
        >
          Try again
        </button>
      </div>
    );
  }

  if (!day.story) return null;

  return (
    <article className="story-reader">
      {day.story.paragraphs.map((paragraph, index) => {
        const sources = paragraph.sourcePieceIds
          .map((id) => pieces.find((piece) => piece.id === id))
          .filter((piece): piece is Piece => Boolean(piece));
        return (
          <div key={`${index}-${paragraph.text.slice(0, 12)}`} className="story-paragraph">
            <p className={`body-lg${index === 0 ? ' drop-cap' : ''}`}>{paragraph.text}</p>
            {sources.length > 0 ? (
              <>
                <button
                  type="button"
                  className="story-source-link"
                  onClick={() => {
                    setSourcesOpen(sourcesOpen === index ? null : index);
                    void recordInteraction(date, 'source-tap');
                  }}
                  aria-expanded={sourcesOpen === index}
                >
                  From your words
                </button>
                {sourcesOpen === index ? (
                  <ul className="story-sources">
                    {sources.map((source) => (
                      <li key={source.id} className="body-sm muted">
                        {source.text.length > 180 ? `${source.text.slice(0, 180)}…` : source.text}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </>
            ) : null}
          </div>
        );
      })}
    </article>
  );
}
