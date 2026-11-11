import { useEffect, useRef, useState } from 'react';
import { enqueuePolish } from '../../lib/ai/queue';
import { addPiece, logMetric, updateDay } from '../../lib/db/repositories';
import { useToast } from '../../components/Toast';

function draftKey(date: string): string {
  return `daybook:draft:${date}`;
}

export function Composer({
  date,
  isToday,
  onSaved,
}: {
  date: string;
  isToday: boolean;
  onSaved: () => void;
}) {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const openedAt = useRef(Date.now());
  const toast = useToast();

  useEffect(() => {
    try {
      setText(localStorage.getItem(draftKey(date)) ?? '');
    } catch {
      setText('');
    }
  }, [date]);

  useEffect(() => {
    try {
      if (text.trim()) localStorage.setItem(draftKey(date), text);
      else localStorage.removeItem(draftKey(date));
    } catch {
      // A private window may refuse storage; the editor still works.
    }
  }, [date, text]);

  async function save() {
    const trimmed = text.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      const piece = await addPiece({ date, kind: 'text', text: trimmed, source: 'typed' });
      await updateDay(date, { storyStatus: 'queued' });
      await logMetric('open_to_save_ms', date, Math.max(0, Date.now() - openedAt.current));
      openedAt.current = Date.now();
      setText('');
      try {
        localStorage.removeItem(draftKey(date));
      } catch {
        // Ignore storage cleanup failures.
      }
      toast.show(isToday ? 'Saved. The day is taking shape.' : 'Added to this day.');
      onSaved();
      void enqueuePolish(piece.id);
      textarea.current?.focus();
    } catch {
      toast.show('That piece could not be saved. Try once more.');
    } finally {
      setSaving(false);
    }
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      void save();
    }
  }

  return (
    <section className="composer" aria-label={isToday ? 'Write today' : 'Add to this day'}>
      {!isToday ? (
        <p className="label label--bronze" style={{ marginBottom: '0.75rem' }}>
          Add to this day
        </p>
      ) : null}
      <textarea
        ref={textarea}
        className="editor"
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder={isToday ? 'Begin anywhere. A sentence is enough.' : 'Something you remember from this day.'}
        aria-label={isToday ? "Today's entry" : 'Add to this day'}
        autoFocus={isToday}
        rows={5}
      />
      <div className="composer__foot">
        <span className="meta">Ctrl / ⌘ + Enter</span>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => void save()}
          disabled={!text.trim() || saving}
        >
          {saving ? 'Saving' : 'Save piece'}
        </button>
      </div>
    </section>
  );
}
