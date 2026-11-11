# Personal-Diary
DayBook helps you build a lasting journaling habit without the pressure of writing a diary every night. Capture moments through text, voice, or photos whenever they happen, and DayBook automatically turns them into polished daily journal pages and personal stories in your own voice. Private, offline-friendly, and stored entirely on your device.

Try it live: https://daybook-livid-eight.vercel.app — and read the same guide inside the app at https://daybook-livid-eight.vercel.app/guide

## Quick guide

### The idea

You do not have to write a diary every night. Just open DayBook whenever something happens and save it in a few seconds. Over the day, these little pieces add up. DayBook cleans up the wording and writes the day's page for you — in your voice, made only from things you actually wrote.

### The four tabs

- **Today** — write, speak, or attach photos and videos for the day, and see the day's page build up.
- **Calendar** — browse any month or year, open any past day, and add to it even now.
- **Memories** — see what this app remembers: throwbacks, marked days, monthly recaps.
- **You** — your settings, backup, demo diary, and feature requests.

### Capture in seconds

- **Write**: tap the writing box and type. Press save. Done.
- **Speak**: tap the voice button and talk. Your words appear as text so you can fix anything before saving. If your browser cannot listen, you can always type instead.
- **Photo or video**: attach a picture or a short video. DayBook keeps it on your device and, when online, writes a short description so the moment is searchable in words too.
- You can add pieces to **past days** too — open a day from the calendar and write there.

### The polish

Every piece you save gets lightly polished: small fixes to spelling, grammar, and flow. Your own words and meaning never change. You can see the original any time, undo the polish, or re-run it. Nothing you wrote is ever lost.

### The day's story

At the end of the day's page, DayBook writes a story of your day in the first person, like a diary entry.

- **While the day is still going**, the story stays short and crisp — around 100 words — just enough to hold the day so far.
- **After the day is over**, it is rewritten as the full page of the finished day — a long, complete entry that uses everything you wrote that day.

Two promises about every story:

- **It only says what you wrote.** No invented events, names, or feelings. The story is built strictly from your pieces.
- **You can check it.** Tap the sources of any paragraph to see exactly which of your pieces it came from.

A short day gets a shorter, truthful page — the length follows what you actually lived and wrote.

### Reminders and marks

- Turn on the **evening reminder** and DayBook will gently nudge you inside the app if the day is ending with nothing written.
- **Mark a day** to keep it special (a birthday, a trip, a hard day) — marked days surface later in Memories.
- **Keep a piece**: favourite individual pieces to find them again easily.

### Memories (earned over time)

Memories fill in slowly as you write, not on day one:

- **Throwbacks**: an old day resurfaces when it means something now.
- **Insights**: gentle observations about your writing and your days. They stay inside Memories and never appear on your daily pages.
- **Monthly recap**: a page for each finished month, with its highlights.
- **Replay**: a slideshow of a day — your pieces, photos, and music. On days with photos it shows them; otherwise it is text only.

There are no streaks or scores. The app just quietly remembers more as there is more to remember.

### Backup and your data

- **Your diary lives only on your device.** No account, no server copy, no tracking.
- It **works offline** — write anywhere, and the AI parts catch up when you are back online.
- You can **install it as an app** on your phone or computer from the browser.
- From the **You** tab you can **export a backup** (a readable text file or a full JSON file) or clear everything.
- Before you start writing your own, you can load a **demo diary** with years of example entries to explore every feature. You can remove it anytime.

### What happens to my words?

When you are online, DayBook sends a piece of writing to its AI helper to polish it or write the day's story. It only sends the words needed for that one job, keeps nothing on the server, and your API key stays on the server side. Offline, everything still works — just without the AI parts until you reconnect.

### Something missing?

The **What's Next** page (from the You tab) lists features that did not make v1. You can vote for what matters to you — votes stay on your device.

## Running it yourself

```bash
npm install
npm run dev        # start writing (AI needs GEMINI_API_KEY in .env.local, see .env.example)
npm test           # unit tests
npm run build      # production build
```

See `ARCHITECTURE.md` and `docs/` for the full design.
