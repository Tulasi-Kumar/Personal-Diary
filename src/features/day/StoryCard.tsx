import { Link } from 'react-router-dom';
import type { Day } from '@shared/types';
import { enqueueStory } from '../../lib/ai/queue';

export function StoryCard({ day, pieceCount }: { day: Day | undefined; pieceCount: number }) {
  if (!day) {
    if (pieceCount === 0) return null;
    return (
      <div className="story-card story-card--quiet">
        <p className="label label--bronze">The day</p>
        <p className="quiet-line">
          <span className="spinner" aria-hidden="true" />
          Gathering the day into a page.
        </p>
      </div>
    );
  }

  if (day.storyStatus === 'ready' && day.story) {
    const first = day.story.paragraphs[0]?.text ?? '';
    return (
      <article className="story-card">
        <p className="label label--bronze">The day</p>
        <Link to={`/day/${day.date}`} className="story-card__link">
          <h2 className="headline">{day.story.heading || day.heading || 'A page from this day'}</h2>
          <p className="body muted story-card__excerpt">{first}</p>
          <span className="story-card__more label">Read the day</span>
        </Link>
      </article>
    );
  }

  if (day.storyStatus === 'queued' || day.storyStatus === 'generating') {
    return (
      <div className="story-card story-card--quiet" aria-live="polite">
        <p className="label label--bronze">The day</p>
        <p className="quiet-line">
          <span className="spinner" aria-hidden="true" />
          Gathering the day into a page.
        </p>
      </div>
    );
  }

  if (day.storyStatus === 'error') {
    return (
      <div className="story-card story-card--quiet">
        <p className="label label--bronze">The day</p>
        <p className="body-sm muted">The story is resting. Your pieces are safe.</p>
        <button
          type="button"
          className="btn btn--ghost"
          style={{ paddingLeft: 0, marginTop: '0.25rem' }}
          onClick={() => void enqueueStory(day.date, { force: true })}
        >
          Try again
        </button>
      </div>
    );
  }

  if (pieceCount > 0) {
    return (
      <div className="story-card story-card--quiet">
        <p className="label label--bronze">The day</p>
        <p className="body-sm muted">The page will form as the day fills.</p>
      </div>
    );
  }

  return null;
}
