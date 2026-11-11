import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Music2, Pause, Play, X } from 'lucide-react';
import { db } from '../../lib/db/db';
import { parseDateKey } from '../../lib/db/dates';
import { buildReplaySlides } from '../../lib/replay/slides';
import { recordInteraction } from '../../lib/memory/interactions';
import { useDayData } from '../day/useDayData';
import { NotFoundPage } from '../not-found/NotFoundPage';

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return !Number.isNaN(parseDateKey(value).getTime());
}

export function ReplayPage() {
  const { date = '' } = useParams();
  if (!isValidDate(date)) return <NotFoundPage />;
  return <Replay date={date} />;
}

function Replay({ date }: { date: string }) {
  const navigate = useNavigate();
  const { day, pieces, loading } = useDayData(date);
  const media = useLiveQuery(async () => {
    const ids = pieces
      .map((piece) => piece.mediaId)
      .filter((id): id is string => Boolean(id));
    if (ids.length === 0) return [];
    const items = await db.media.bulkGet(ids);
    return items.filter((item): item is NonNullable<typeof item> => Boolean(item));
  }, [pieces]);

  const [urls, setUrls] = useState<Map<string, string>>(new Map());
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [musicOn, setMusicOn] = useState(false);
  const completed = useRef(false);
  const returnFocus = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const audio = useRef<{ context: AudioContext; oscillators: OscillatorNode[] } | null>(null);

  useEffect(() => {
    return () => {
      returnFocus.current?.focus?.();
    };
  }, []);

  useEffect(() => {
    const next = new Map<string, string>();
    for (const item of media ?? []) {
      next.set(item.id, URL.createObjectURL(item.blob));
    }
    setUrls(next);
    return () => {
      for (const url of next.values()) URL.revokeObjectURL(url);
    };
  }, [media]);

  const slides = useMemo(
    () => buildReplaySlides(day, pieces, new Set(urls.keys())),
    [day, pieces, urls],
  );

  useEffect(() => {
    if (loading || slides.length === 0) return;
    returnFocus.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
  }, [loading, slides.length]);

  useEffect(() => {
    setIndex(0);
    completed.current = false;
    void recordInteraction(date, 'replay-start');
  }, [date]);

  useEffect(() => {
    if (slides.length === 0) return;
    if (index >= slides.length) setIndex(slides.length - 1);
  }, [slides.length, index]);

  useEffect(() => {
    if (slides.length === 0 || paused) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 5200);
    return () => window.clearInterval(timer);
  }, [slides.length, paused]);

  useEffect(() => {
    if (slides.length === 0) return;
    if (index === slides.length - 1 && !completed.current) {
      completed.current = true;
      void recordInteraction(date, 'replay-complete');
    }
  }, [date, index, slides.length]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    return () => {
      stopMusic();
    };
  }, []);

  function stopMusic() {
    if (!audio.current) return;
    for (const oscillator of audio.current.oscillators) {
      try {
        oscillator.stop();
      } catch {
        // The oscillator may already be stopped.
      }
    }
    void audio.current.context.close();
    audio.current = null;
  }

  function toggleMusic() {
    if (musicOn) {
      stopMusic();
      setMusicOn(false);
      return;
    }
    const AudioContextClass = window.AudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const gain = context.createGain();
    gain.gain.value = 0.012;
    gain.connect(context.destination);
    const first = context.createOscillator();
    first.type = 'sine';
    first.frequency.value = 174;
    const second = context.createOscillator();
    second.type = 'sine';
    second.frequency.value = 261.63;
    second.detune.value = 5;
    const secondGain = context.createGain();
    secondGain.gain.value = 0.35;
    second.connect(secondGain);
    secondGain.connect(gain);
    first.connect(gain);
    first.start();
    second.start();
    audio.current = { context, oscillators: [first, second] };
    setMusicOn(true);
  }

  function close() {
    stopMusic();
    if (window.history.length > 1) navigate(-1);
    else navigate(`/day/${date}`);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Tab') {
        const root = dialogRef.current;
        if (!root) return;
        const items = Array.from(
          root.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], video[controls], [tabindex]:not([tabindex="-1"])',
          ),
        );
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      } else if (event.key === 'ArrowRight' || event.key === ' ') {
        event.preventDefault();
        setIndex((current) => (slides.length ? (current + 1) % slides.length : 0));
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setIndex((current) =>
          slides.length ? (current - 1 + slides.length) % slides.length : 0,
        );
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  if (loading) {
    return (
      <div className="page--narrow stack stack-4">
        <div className="skeleton" style={{ height: '16rem', width: '100%' }} />
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="page--narrow stack stack-5">
        <p className="label label--bronze">Replay</p>
        <div className="empty">
          <div className="empty__mark" />
          <p className="body muted">There is not enough here to replay yet.</p>
          <Link to={`/day/${date}`} className="quiet-link">
            Return to the day
          </Link>
        </div>
      </div>
    );
  }

  const current = slides[Math.min(index, slides.length - 1)];
  const hasMedia = slides.some((slide) => slide.kind === 'media');
  const currentUrl = current.kind === 'media' ? urls.get(current.mediaId) : undefined;
  const currentMedia =
    current.kind === 'media' ? media?.find((item) => item.id === current.mediaId) : undefined;
  const currentIsVideo =
    current.kind === 'media' &&
    current.mediaKind === 'video' &&
    !currentMedia?.mimeType.startsWith('image/');

  return createPortal(
    <div
      ref={dialogRef}
      className={`replay${hasMedia ? '' : ' replay--paper'}`}
      role="dialog"
      aria-modal="true"
      aria-label="Day replay"
    >
      <div className="replay__progress" aria-hidden="true">
        <span style={{ width: `${((index + 1) / slides.length) * 100}%` }} />
      </div>

      <div className="replay__top">
        <span className="replay__count">
          {index + 1} of {slides.length}
        </span>
        <button
          ref={closeRef}
          type="button"
          className="replay__close"
          onClick={close}
          aria-label="Close replay"
        >
          <X aria-hidden="true" />
        </button>
      </div>

      <div
        className="replay__stage"
        onClick={() => setIndex((value) => (value + 1) % slides.length)}
      >
        {current.kind === 'media' ? (
          currentIsVideo ? (
            <video
              key={current.id}
              className="replay__media"
              src={currentUrl}
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <img
              key={current.id}
              className="replay__media"
              src={currentUrl}
              alt={current.caption ?? 'A page from this day'}
              loading="lazy"
            />
          )
        ) : (
          <p key={current.id} className="replay__text">
            {current.text}
          </p>
        )}
        {current.kind === 'media' && current.caption ? (
          <p className="replay__caption">{current.caption}</p>
        ) : null}
      </div>

      <p className="sr-only" aria-live="polite">
        {current.kind === 'media'
          ? current.caption ?? `Slide ${index + 1} of ${slides.length}`
          : current.text}
      </p>

      <div className="replay__controls">
        <button
          type="button"
          className="replay__control"
          onClick={toggleMusic}
          aria-pressed={musicOn}
          aria-label={musicOn ? 'Turn music off' : 'Turn music on'}
        >
          {musicOn ? <Music2 aria-hidden="true" /> : <Music2 aria-hidden="true" />}
          <span>{musicOn ? 'Music on' : 'Music off'}</span>
        </button>

        <div className="row" style={{ gap: '0.25rem' }}>
          <button
            type="button"
            className="replay__control replay__control--icon"
            onClick={() =>
              setIndex((value) => (value - 1 + slides.length) % slides.length)
            }
            aria-label="Previous slide"
          >
            <ChevronLeft aria-hidden="true" />
          </button>
          <button
            type="button"
            className="replay__control replay__control--icon"
            onClick={() => setPaused((value) => !value)}
            aria-label={paused ? 'Play replay' : 'Pause replay'}
          >
            {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
          </button>
          <button
            type="button"
            className="replay__control replay__control--icon"
            onClick={() => setIndex((value) => (value + 1) % slides.length)}
            aria-label="Next slide"
          >
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
