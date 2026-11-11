import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatLongDate, todayKey } from '../../lib/db/dates';
import { useOnline } from '../../hooks/useOnline';
import { useSettings } from '../../hooks/useSettings';
import { Composer } from '../day/Composer';
import { PieceCard } from '../day/PieceCard';
import { StoryCard } from '../day/StoryCard';
import { useDayData } from '../day/useDayData';
import { QuickActions } from './QuickActions';
import { VoiceSheet } from '../voice/VoiceSheet';
import { MediaSheet } from '../media/MediaSheet';

export function HomePage() {
  const date = todayKey();
  const { day, pieces, loading } = useDayData(date);
  const settings = useSettings();
  const online = useOnline();
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [mediaKind, setMediaKind] = useState<'photo' | 'video' | null>(null);

  const bookName = settings?.bookName ?? 'My DayBook';

  return (
    <div className="page--narrow stack stack-5">
      <header className="home-header">
        <div>
          <p className="label label--bronze">{bookName}</p>
          <h1 className="display" style={{ marginTop: '0.35rem' }}>
            Today
          </h1>
          <p className="meta" style={{ marginTop: '0.35rem' }}>
            {formatLongDate(date)}
          </p>
        </div>
        <div className="home-header__ornament" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </header>

      {!online ? (
        <p className="offline-note" role="status">
          Offline. Writing and reading still work; the writing room will wait.
        </p>
      ) : null}

      <Composer date={date} isToday onSaved={() => undefined} />

      <QuickActions
        onSpeak={() => setVoiceOpen(true)}
        onPhoto={() => setMediaKind('photo')}
        onVideo={() => setMediaKind('video')}
      />

      {loading ? (
        <div className="stack stack-3" aria-label="Loading today">
          <div className="skeleton" style={{ height: '1rem', width: '38%' }} />
          <div className="skeleton" style={{ height: '4rem', width: '100%' }} />
        </div>
      ) : (
        <>
          <StoryCard day={day} pieceCount={pieces.length} />

          {pieces.length > 0 ? (
            <section className="section" aria-labelledby="today-pieces">
              <h2 id="today-pieces" className="section-title">
                Written today
              </h2>
              <div className="hairline-list">
                {pieces.map((piece) => (
                  <PieceCard key={piece.id} piece={piece} />
                ))}
              </div>
            </section>
          ) : (
            <div className="empty empty--soft">
              <div className="empty__mark" />
              <p className="body muted">A sentence is enough. The page can grow later.</p>
              <Link to="/profile#demo" className="quiet-link">
                See a finished diary
              </Link>
            </div>
          )}
        </>
      )}

      <VoiceSheet
        open={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        date={date}
        onSaved={() => undefined}
      />
      <MediaSheet
        open={mediaKind !== null}
        kind={mediaKind}
        date={date}
        onClose={() => setMediaKind(null)}
        onSaved={() => undefined}
      />
    </div>
  );
}
