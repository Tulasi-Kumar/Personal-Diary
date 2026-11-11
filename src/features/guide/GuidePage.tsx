import { Link } from 'react-router-dom';

const GUIDE_SECTIONS: Array<{ id: string; title: string; paragraphs: string[] }> = [
  {
    id: 'capture',
    title: 'Capture in seconds',
    paragraphs: [
      'Open the app, tap the writing box, and type a few words. That is a piece. A sentence is enough.',
      'You can also speak instead of typing. Your words appear on screen first, so you can fix anything before saving. If your browser cannot listen, typing always works.',
      'Photos and short videos can be attached too. When you are online, DayBook writes a short description of each one, so the moment stays findable in words.',
      'Forgot to write something? Open that day on the Calendar page and add to it there. Old days are not closed.',
    ],
  },
  {
    id: 'polish',
    title: 'The polish',
    paragraphs: [
      'Every piece you save gets lightly polished: small fixes to spelling, grammar, and flow. Your words and your meaning never change.',
      'The original wording is kept underneath. You can undo the polish, run it again, or see the raw words any time. Nothing you wrote is ever lost.',
    ],
  },
  {
    id: 'story',
    title: 'The day’s story',
    paragraphs: [
      'At the end of the day\u2019s page, DayBook writes the story of your day in the first person, like a diary entry.',
      'While the day is still going, the story stays short and crisp — just enough to hold the day so far. Once the day is over, it is rewritten as the full page of the finished day, using everything you wrote.',
      'Two promises about every story: it only says what you wrote (no invented events, names, or feelings), and you can tap the sources of any paragraph to see exactly which pieces it came from.',
      'A short day gets a shorter, truthful page. The length follows what you actually lived and wrote.',
    ],
  },
  {
    id: 'calendar',
    title: 'Calendar and marked days',
    paragraphs: [
      'The Calendar page shows every month and year of your book. Days with writing are marked. Open any day to read it or add to it.',
      'Mark a day to keep it special — a birthday, a trip, a hard day. Marked days come back later in Memories.',
      'Keep a piece you love with the keep mark, so you can find it again easily.',
    ],
  },
  {
    id: 'memories',
    title: 'Memories that grow',
    paragraphs: [
      'The Memories page fills in slowly as you write. Not on day one.',
      'Throwbacks bring an old day back when it means something now. Insights are gentle observations about your days, and they stay inside Memories — never on your daily pages. Each finished month gets its own recap page.',
      'Replay turns a day into a slideshow of your pieces, photos, and music. Days without photos simply play as text.',
      'There are no streaks or scores. The app just quietly remembers more as there is more to remember.',
    ],
  },
  {
    id: 'reminders',
    title: 'Gentle reminders',
    paragraphs: [
      'You can turn on an evening reminder in the You tab. If the day is ending with nothing written, DayBook shows one quiet nudge while the app is open. No push notifications, nothing outside the app.',
    ],
  },
  {
    id: 'data',
    title: 'Your data and your privacy',
    paragraphs: [
      'Your diary lives only on this device. There is no account, no server copy, and no tracking. It also works offline — write anywhere, and the AI parts catch up when you are back online.',
      'You can install DayBook like a normal app on your phone or computer from the browser menu.',
      'In the You tab you can export a backup at any time, clear everything, or load a demo diary with years of finished entries to explore. The demo can be removed whenever you like.',
    ],
  },
  {
    id: 'ai',
    title: 'What happens when AI is used',
    paragraphs: [
      'When you are online, DayBook sends a piece of writing to its AI helper to polish it or to write the day’s story. It only sends the words needed for that one job, keeps nothing on the server, and the API key stays hidden on the server side.',
      'Offline, everything still works — just without the AI parts until you reconnect.',
    ],
  },
];

export function GuidePage() {
  return (
    <div className="page--narrow stack stack-6">
      <header className="stack stack-3">
        <div className="row row--between">
          <p className="label label--bronze">Guide</p>
          <Link to="/profile" className="label" style={{ letterSpacing: '0.08em' }}>
            Your book
          </Link>
        </div>
        <h1 className="display">How DayBook works.</h1>
        <p className="body-sm muted">
          You do not have to write a diary every night. Save small pieces whenever something
          happens, and DayBook turns them into the day’s page — in your voice, built only
          from what you actually wrote.
        </p>
      </header>

      <div className="hairline-list">
        {GUIDE_SECTIONS.map((section) => (
          <article key={section.id} className="guide-section" aria-labelledby={`guide-${section.id}`}>
            <h2 id={`guide-${section.id}`} className="headline-sm">
              {section.title}
            </h2>
            {section.paragraphs.map((paragraph, index) => (
              <p key={index} className="body-sm muted guide-section__text">
                {paragraph}
              </p>
            ))}
          </article>
        ))}
      </div>
    </div>
  );
}
