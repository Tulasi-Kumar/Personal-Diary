import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, ChevronRight } from 'lucide-react';
import { Sheet } from '../../components/Sheet';
import { useToast } from '../../components/Toast';
import { useDemoLoaded } from '../../hooks/useDemoLoaded';
import { useSettings } from '../../hooks/useSettings';
import { dateKey } from '../../lib/db/dates';
import {
  clearAllData,
  exportRawData,
  logMetric,
  updateSettings,
} from '../../lib/db/repositories';
import {
  buildJsonBackup,
  buildReadableText,
  downloadJsonFile,
  downloadTextFile,
  jsonExportName,
  readableExportName,
} from '../../lib/export/exports';
import { loadDemoDiary, removeDemoDiary } from '../../lib/seed/demo';

type ConfirmAction = 'clear' | 'remove-demo' | null;

export function ProfilePage() {
  const settings = useSettings();
  const demoLoaded = useDemoLoaded();
  const toast = useToast();
  const navigate = useNavigate();
  const [bookDraft, setBookDraft] = useState('');
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [busy, setBusy] = useState(false);
  const [storageNote, setStorageNote] = useState<string | null>(null);

  useEffect(() => {
    if (settings) setBookDraft(settings.bookName);
  }, [settings?.bookName]);

  if (!settings) {
    return (
      <div className="page--narrow stack stack-4">
        <p className="label label--bronze">You</p>
        <div className="skeleton" style={{ height: '9rem', width: '100%' }} />
      </div>
    );
  }

  const reminderOn = settings.reminderEnabled && Boolean(settings.reminderTime);

  async function saveBookName() {
    const next = bookDraft.trim() || 'My DayBook';
    setBookDraft(next);
    if (next !== settings?.bookName) {
      await updateSettings({ bookName: next });
      toast.show('The book has a new name.');
    }
  }

  async function setReminder(enabled: boolean) {
    await updateSettings({
      reminderEnabled: enabled,
      reminderTime: enabled ? settings?.reminderTime || '20:00' : null,
    });
  }

  async function setReminderTime(value: string) {
    if (!/^\d{2}:\d{2}$/.test(value)) return;
    await updateSettings({ reminderTime: value, reminderEnabled: true });
  }

  async function toggleMemoryNotifications() {
    if (!settings) return;
    await updateSettings({ memoryNotifications: !settings.memoryNotifications });
  }

  async function loadDemo() {
    setBusy(true);
    setStorageNote(null);
    try {
      const result = await loadDemoDiary();
      if (result.days === 0) {
        toast.show('The demo diary is already here.');
      } else {
        await logMetric('demo_loaded', dateKey());
        toast.show('The demo diary is ready. No writing was spent.');
      }
    } catch {
      setStorageNote('The demo diary could not be loaded. Try once more.');
    } finally {
      setBusy(false);
    }
  }

  async function confirmRemoveDemo() {
    setBusy(true);
    try {
      await removeDemoDiary();
      await logMetric('demo_removed', dateKey());
      toast.show('Demo pages removed. Your own pages are untouched.');
      setConfirmAction(null);
    } catch {
      setStorageNote('The demo pages could not be removed. Try once more.');
    } finally {
      setBusy(false);
    }
  }

  async function confirmClear() {
    setBusy(true);
    try {
      await clearAllData();
      try {
        for (const key of Object.keys(localStorage)) {
          if (key.startsWith('daybook:')) localStorage.removeItem(key);
        }
      } catch {
        // Storage may be unavailable; the database is already clear.
      }
      setConfirmAction(null);
      toast.show('The book is empty again.');
      navigate('/');
    } catch {
      setStorageNote('The book could not be cleared. Try once more.');
    } finally {
      setBusy(false);
    }
  }

  async function exportText() {
    try {
      const data = await exportRawData();
      downloadTextFile(readableExportName(settings?.bookName ?? 'My DayBook'), buildReadableText(data));
      toast.show('Your readable book is downloading.');
    } catch {
      toast.show('The export could not be prepared. Try once more.');
    }
  }

  async function exportJson() {
    try {
      const data = await exportRawData();
      downloadJsonFile(jsonExportName(settings?.bookName ?? 'My DayBook'), buildJsonBackup(data));
      toast.show('Your backup is downloading.');
    } catch {
      toast.show('The backup could not be prepared. Try once more.');
    }
  }

  return (
    <div className="page--narrow stack stack-6">
      <header className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <p className="label label--bronze">You</p>
          <h1 className="display" style={{ marginTop: '0.3rem' }}>
            Your book
          </h1>
          {demoLoaded ? (
            <span className="badge badge--demo" style={{ marginTop: '0.6rem' }}>
              Demo pages loaded
            </span>
          ) : null}
        </div>
      </header>

      <section className="profile-section" aria-labelledby="book-title">
        <h2 id="book-title" className="section-title">
          Book
        </h2>
        <label className="settings-label" htmlFor="book-name">
          Name
        </label>
        <div className="row">
          <input
            id="book-name"
            className="input"
            value={bookDraft}
            onChange={(event) => setBookDraft(event.target.value)}
            onBlur={() => void saveBookName()}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                (event.currentTarget as HTMLInputElement).blur();
              }
            }}
            placeholder="My DayBook"
            maxLength={80}
          />
          <button
            type="button"
            className="btn-icon"
            onClick={() => void saveBookName()}
            aria-label="Save book name"
          >
            <Check aria-hidden="true" />
          </button>
        </div>

        <div className="settings-row">
          <div>
            <p className="body">Writing style</p>
            <p className="meta">The only style in this version.</p>
          </div>
          <span className="label label--bronze">Polished</span>
        </div>
      </section>

      <section className="profile-section" aria-labelledby="reminders-title">
        <h2 id="reminders-title" className="section-title">
          Reminders
        </h2>

        <div className="settings-row">
          <div>
            <p className="body">Evening reminder</p>
            <p className="meta">A quiet nudge while the app is open. No push notifications.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={reminderOn}
            aria-label="Evening reminder"
            className={`settings-switch${reminderOn ? ' is-on' : ''}`}
            onClick={() => void setReminder(!reminderOn)}
          >
            <span />
          </button>
        </div>

        {reminderOn ? (
          <div className="settings-row settings-row--sub">
            <label className="settings-label" htmlFor="reminder-time">
              Time
            </label>
            <input
              id="reminder-time"
              type="time"
              className="settings-time"
              value={settings.reminderTime ?? '20:00'}
              onChange={(event) => void setReminderTime(event.target.value)}
            />
          </div>
        ) : null}

        <div className="settings-row">
          <div>
            <p className="body">Memory notifications</p>
            <p className="meta">Quiet banners for throwbacks and marked days.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.memoryNotifications}
            aria-label="Memory notifications"
            className={`settings-switch${settings.memoryNotifications ? ' is-on' : ''}`}
            onClick={() => void toggleMemoryNotifications()}
          >
            <span />
          </button>
        </div>
      </section>

      <section className="profile-section" aria-labelledby="data-title">
        <h2 id="data-title" className="section-title">
          Data
        </h2>

        <button type="button" className="settings-row settings-row--button" onClick={() => void exportText()}>
          <div>
            <p className="body">Readable text</p>
            <p className="meta">A .txt book with days, stories, and pieces.</p>
          </div>
          <span className="label label--bronze">Export</span>
        </button>

        <button type="button" className="settings-row settings-row--button" onClick={() => void exportJson()}>
          <div>
            <p className="body">JSON backup</p>
            <p className="meta">Everything except media blobs.</p>
          </div>
          <span className="label label--bronze">Export</span>
        </button>

        <div className="settings-row">
          <div>
            <p className="body">Demo diary</p>
            <p className="meta">
              {demoLoaded
                ? 'A finished diary is loaded alongside your pages.'
                : 'See a finished diary without spending AI writing.'}
            </p>
          </div>
          {demoLoaded ? (
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => setConfirmAction('remove-demo')}
              disabled={busy}
            >
              Remove
            </button>
          ) : (
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => void loadDemo()}
              disabled={busy}
            >
              {busy ? 'Loading' : 'Load'}
            </button>
          )}
        </div>

        {storageNote ? (
          <p className="body-sm danger" role="status">
            {storageNote}
          </p>
        ) : null}

        <button
          type="button"
          className="settings-row settings-row--button settings-row--danger"
          onClick={() => setConfirmAction('clear')}
        >
          <div>
            <p className="body">Clear all data</p>
            <p className="meta">Remove every page, demo page, and setting.</p>
          </div>
          <ChevronRight aria-hidden="true" />
        </button>
      </section>

      <section className="profile-section" aria-labelledby="about-title">
        <h2 id="about-title" className="section-title">
          About
        </h2>
        <div className="settings-row">
          <div>
            <p className="body">DayBook</p>
            <p className="meta">A quiet place for the days. Version 0.1.0.</p>
          </div>
        </div>
        <Link to="/whats-next" className="settings-row settings-row--button">
          <div>
            <p className="body">What’s next</p>
            <p className="meta">What is not in this version, and why.</p>
          </div>
          <ChevronRight aria-hidden="true" />
        </Link>
      </section>

      <Sheet
        open={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        title={confirmAction === 'clear' ? 'Clear the book?' : 'Remove the demo pages?'}
      >
        <div className="stack stack-4">
          <p className="body">
            {confirmAction === 'clear'
              ? 'This removes every page, every demo page, all marks, recaps, signals, and settings. It cannot be undone.'
              : 'This removes only the demo pages. Your own writing stays exactly where it is.'}
          </p>
          <div className="row row--wrap" style={{ gap: '0.75rem' }}>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => setConfirmAction(null)}
              disabled={busy}
            >
              Keep everything
            </button>
            <button
              type="button"
              className="btn btn--danger"
              onClick={() => void (confirmAction === 'clear' ? confirmClear() : confirmRemoveDemo())}
              disabled={busy}
            >
              {busy ? 'Working' : confirmAction === 'clear' ? 'Clear everything' : 'Remove demo'}
            </button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
