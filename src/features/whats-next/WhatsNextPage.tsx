import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { listFeatureVotes, toggleFeatureVote } from '../../lib/db/repositories';
import { NEXT_FEATURES } from './features';

export function WhatsNextPage() {
  const votes = useLiveQuery(() => listFeatureVotes(), []);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const voted = new Set((votes ?? []).map((vote) => vote.featureId));

  async function toggle(featureId: string) {
    setError(null);
    setPending(featureId);
    try {
      await toggleFeatureVote(featureId);
    } catch {
      setError('That tap did not stick. Try once more.');
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="page--narrow stack stack-6">
      <header className="stack stack-3">
        <div className="row row--between">
          <p className="label label--bronze">What’s next</p>
          <Link to="/profile" className="label" style={{ letterSpacing: '0.08em' }}>
            Your book
          </Link>
        </div>
        <h1 className="display">Things we are thinking about next.</h1>
        <p className="body-sm muted">
          None of these are in this version. Tap the ones you want; the count stays on this
          device.
        </p>
      </header>

      {error ? (
        <p className="body-sm danger" role="status">
          {error}
        </p>
      ) : null}

      <div className="hairline-list next-list">
        {NEXT_FEATURES.map((feature) => {
          const isVoted = voted.has(feature.id);
          return (
            <article key={feature.id} className="next-row">
              <div className="next-row__text">
                <h2 className="headline-sm">{feature.name}</h2>
                <p className="body-sm muted" style={{ marginTop: '0.3rem' }}>
                  {feature.reason}
                </p>
                <span className="label label--bronze next-row__status">{feature.status}</span>
              </div>
              <div className="next-row__vote">
                <button
                  type="button"
                  className={`next-vote${isVoted ? ' is-voted' : ''}`}
                  aria-pressed={isVoted}
                  aria-label={
                    isVoted
                      ? `Remove your interest in ${feature.name}`
                      : `I want ${feature.name}`
                  }
                  onClick={() => void toggle(feature.id)}
                  disabled={pending === feature.id}
                >
                  {isVoted ? 'Wanted' : 'I want this'}
                </button>
                <span className="next-row__count">
                  {isVoted ? '1 on this device' : 'Local to this device'}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
