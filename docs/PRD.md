# DayBook — Product Requirements Document

| Field | Value |
|---|---|
| Version | 1.0 |
| Status | Approved for implementation |
| Date | 2026-11-08 |
| Product | DayBook |
| Sources | `problemStatement.txt`, `idea.txt`, `ARCHITECTURE.md`, `Stitch Screens/DESIGN.md` |
| Build target | Local-first PWA on free tiers |
| Owner | Portfolio / learning project |

---

## 1. Product summary

DayBook is a calm, local-first daily diary. People capture moments as they happen — by typing, speaking, or attaching a photo or video — and the app quietly turns the day into a polished page and a one-page story in their own voice.

Everything is stored on the device. The AI runs through one server route so the API key never ships to the browser. The app is installable, works offline for writing and reading, and shows AI-free fallbacks when the network or the model is unavailable.

**One line:** write or speak whenever something happens; each day becomes a polished page with a heading and a one-page story.

---

## 2. Problem, hypothesis, and bet

### Problem

People who want to keep a diary cannot recall the day's moments by night. Entries end up thin, the habit feels pointless, and they quit. When they remember something later, they cannot easily add it back to the right day.

### Hypothesis (unvalidated)

People remember things at the moment they happen. If they can add to the day's page in pieces, and the app turns long, messy writing into a polished page and a short story, they will keep a diary longer.

### The bet

Capture must be immediate, assembly must be automatic, and the raw words must remain trustworthy. The project is a learning and portfolio exercise; there is no launch, no real-user research, and no privacy or security claim.

### Evidence status

No user research has been conducted. The hypothesis is stated openly, and "Real user research" appears on the What's Next screen.

---

## 3. Target user and jobs to be done

### Primary user

People who tried a diary, could not recall the day's details when they sat down to write, saw entries thin out, and quit.

### Jobs to be done

1. When something happens, let me capture it in seconds without choosing fields.
2. When I open a past day, show me a readable story first and let me verify it against my words.
3. When I remember something late, let me add it to the correct day.
4. When I look back, give me meaningful memories without turning my diary into a dashboard.

### Out of scope users

Teams, social sharing, public profiles, coaching, therapy, medical use, and multi-user collaboration.

---

## 4. Goals and non-goals

### Product goals

| ID | Goal |
|---|---|
| G-01 | Capture a piece in under five seconds from opening the app. |
| G-02 | Never block writing or reading on AI or the network. |
| G-03 | Keep the user's raw words unchanged and recoverable. |
| G-04 | Make every AI story sentence traceable to source pieces. |
| G-05 | Keep insights inside Memories only. |
| G-06 | Ship as a free, installable PWA on free tiers. |
| G-07 | Make long-range memory possible: any past date, with years of history supported. |

### Non-goals (v1)

Semantic search, generative video, GPS-based travel badges, true push notifications, encryption, app lock, cloud sync, login, video understanding, multi-language, home-screen widgets, pinned passages, writing-style options, and real user research. These are listed on What's Next.

---

## 5. Product principles

1. **A diary, not a dashboard.** No stats, streaks, mood pickers, tag chips, or metric cards on writing and reading screens.
2. **Premium and calm.** Ivory paper, ink serif text, one bronze accent, generous whitespace, hairline dividers, almost no shadows.
3. **Never ask the user to fill in fields.** The user writes or speaks; the AI does the rest.
4. **The raw words are the source of truth.** Everything the AI produces points back to what the user wrote.
5. **Insights live in Memories only.** Moods, ribbons, throwbacks, and recaps never appear on Home, Calendar, or a day page.
6. **The AI never invents facts.** Polishing and summarizing may reword and condense. They may not add.
7. **If in doubt, remove an element.**
8. **Memories are earned, not scheduled.** Readiness comes from accumulated history, writing frequency, and interaction, not a single fixed day count.

---

## 6. User journey (locked)

1. Open DayBook. Today's blank page appears with the date and capture options. Bottom navigation: Home, Calendar, Memories, Profile.
2. Write in pieces through the day. Each piece is saved immediately, then polished automatically.
3. The day's story forms quietly. After each piece, the heading and one-page story update. There is no review or confirm step.
4. Read a day. Open a day from the Calendar to see the heading and story first. Tap a sentence to see its source passage. Tap "Read everything I wrote" for the full polished writing.
5. Add to any past day. Open a past day from the Calendar and add a piece. It is marked "added later."
6. Memories. Throwbacks across years, weekly and monthly recaps, and marked days live here. They also drive in-app banners such as "Two years ago today."
7. Replay. Any day can be played as a short recap reel made from its photos and story.
8. Profile. The book's name, an optional evening reminder, notification toggles, export, a Load demo diary button, and a What's Next screen.

---

## 7. Scope of v1

| Area | v1 behavior | Real or demo |
|---|---|---|
| Text capture | Type into today's page, add in pieces | Real |
| Voice capture | Browser speech recognition with live transcript | Real; Chrome/Android best, Safari limited |
| Photo and video attach | Add to a day, stored on device, shown inline | Real |
| Polish | Each piece corrected grammatically and improved, meaning unchanged | Real; free-tier LLM |
| Day heading and story | One short heading and a one-page first-person story with sentence-to-source links | Real; free-tier LLM |
| Raw layer | Original words kept hidden as the source of truth, used for undo | Real |
| Calendar | Month grid, dots, year navigation, open any day, add to past days | Real |
| Memories | Progressive readiness; multi-year throwbacks, this week, monthly recap, marked days with evidence quotes | Real; local model + LLM recaps |
| Notifications | In-app banners for throwbacks, ribbons, and the optional evening reminder | Real in-app; true push on What's Next |
| Replay | Slideshow of the day's photos with story lines as captions, optional music toggle | Real; simple slideshow |
| Demo diary | Loads about 45 days across multiple years so Memories works on day one | Real, clearly labeled |
| What's Next | Upcoming features with a local "I want this" tap | Real |
| Debug | Hidden local-only metrics page at `/debug` | Real, not user-facing |

---

## 8. Functional requirements

Requirement status legend: **V1** = must ship, **V1.1** = deferred, **WON'T** = explicitly out.

### 8.1 Global app shell and navigation

| ID | Requirement | Status |
|---|---|---|
| GEN-01 | The app opens to Home (today's page). | V1 |
| GEN-02 | Four bottom tabs: Home, Calendar, Memories, Profile, with thin line icons. | V1 |
| GEN-03 | The product name is DayBook everywhere: manifest, title, profile, export header. | V1 |
| GEN-04 | No stats, streaks, mood pickers, tag chips, or metric cards appear on Home, Calendar, or Day screens. | V1 |
| GEN-05 | The app is installable as a PWA and works offline for writing and reading. | V1 |
| GEN-06 | AI-dependent UI shows quiet unavailable states; no blocking modals or spinners. | V1 |
| GEN-07 | All user content is stored locally on the device. | V1 |
| GEN-08 | The app uses local calendar dates (`YYYY-MM-DD`), not UTC strings. | V1 |
| GEN-09 | Any date in the past is addressable for reading and adding, with no hard five-year cap. | V1 |

### 8.2 Home — today's page

| ID | Requirement | Status |
|---|---|---|
| HOME-01 | Show today's date at the top in a quiet label style. | V1 |
| HOME-02 | Show a blank writing page with a soft cursor and the placeholder "What happened today?" | V1 |
| HOME-03 | Show a slim capture bar with type, speak, photo, video, and Add. | V1 |
| HOME-04 | Adding a text piece saves it immediately and renders it without a page reload. | V1 |
| HOME-05 | Earlier pieces from today appear as quiet collapsed entries with timestamps above the new text. | V1 |
| HOME-06 | Each piece is polished automatically after saving; the polished text replaces the visible raw text. | V1 |
| HOME-07 | "Undo polish" on any piece restores the raw words exactly. | V1 |
| HOME-08 | Tapping a collapsed piece expands it to show the current polished text. | V1 |
| HOME-09 | The day heading and story update quietly after new pieces; there is no review or confirm step. | V1 |
| HOME-10 | While AI is working, show a quiet line under the story; no spinner or modal. | V1 |
| HOME-11 | If AI is unavailable, show polished text if present, otherwise raw text, with a quiet retry. | V1 |
| HOME-12 | Empty today shows only the date, writing surface, and capture bar — no onboarding cards. | V1 |

### 8.3 Speaking

| ID | Requirement | Status |
|---|---|---|
| SPEAK-01 | The page dims and a minimal sheet shows a waveform, a timer, and live words flowing into the page. | V1 |
| SPEAK-02 | Done saves the final transcript as a voice piece; Discard leaves no piece. | V1 |
| SPEAK-03 | The saved piece is marked with a voice indicator in "Everything I wrote." | V1 |
| SPEAK-04 | If speech recognition is unsupported, explain the limit and fall back to typing. | V1 |
| SPEAK-05 | Voice pieces follow the same polish and story flow as text pieces. | V1 |

### 8.4 Calendar

| ID | Requirement | Status |
|---|---|---|
| CAL-01 | Show a month grid with days of the month. | V1 |
| CAL-02 | Days with entries show a tiny bronze dot. | V1 |
| CAL-03 | Today is gently circled. | V1 |
| CAL-04 | Month and year navigation allows reaching any past month, including years back. | V1 |
| CAL-05 | Tapping a day opens its Day screen. | V1 |
| CAL-06 | A past day can be opened for writing with the label "Adding to a past day." | V1 |
| CAL-07 | Empty Calendar shows a quiet empty state, not a dashboard. | V1 |
| CAL-08 | Selecting a day with no story shows a quiet empty day, not an error. | V1 |

### 8.5 Day story

| ID | Requirement | Status |
|---|---|---|
| DAY-01 | Show the date, a short heading under eight words, and a one-page first-person story. | V1 |
| DAY-02 | The story uses a drop cap and may show one inline photo. | V1 |
| DAY-03 | Tapping a story sentence opens a soft panel showing the source passage. | V1 |
| DAY-04 | Each sentence must cite at least one valid source piece. | V1 |
| DAY-05 | Links at the bottom: "Read everything I wrote" and "Add to this day." | V1 |
| DAY-06 | A short day produces one or two sentences, not padding. | V1 |
| DAY-07 | While updating, a quiet line appears under the story; the previous story remains readable. | V1 |
| DAY-08 | Pieces added later are labeled "added later" in the full writing view. | V1 |
| DAY-09 | No moods, ribbons, places, or people appear on the Day screen. | V1 |

### 8.6 Everything I wrote

| ID | Requirement | Status |
|---|---|---|
| ALL-01 | Show polished pieces in chronological order with timestamps. | V1 |
| ALL-02 | Use hairline dividers between pieces. | V1 |
| ALL-03 | Mark voice pieces with a voice indicator. | V1 |
| ALL-04 | Show media inline where attached. | V1 |
| ALL-05 | Show "added later" where applicable. | V1 |
| ALL-06 | Provide a "Back to the story" link. | V1 |

### 8.7 Add to a past day

| ID | Requirement | Status |
|---|---|---|
| PAST-01 | Use the same writing page as Home, with the selected day's date. | V1 |
| PAST-02 | Show a small label "Adding to a past day." | V1 |
| PAST-03 | Save the new piece with `addedLater = true`. | V1 |
| PAST-04 | Regenerate the day's story within the normal debounce window. | V1 |
| PAST-05 | Do not reorder or rewrite existing pieces. | V1 |

### 8.8 Memories

Memories are gated by a local readiness model, not a single fixed day count. The tab is always present; its content unlocks progressively.

| ID | Requirement | Status |
|---|---|---|
| MEM-01 | Compute readiness locally from span, recent density, volume, engagement, and consistency. | V1 |
| MEM-02 | Five years is the readiness normalization target; any past date remains valid. | V1 |
| MEM-03 | Unlock sections progressively: throwback, this week, monthly recap, marked days. | V1 |
| MEM-04 | Show a quiet "Your memories are forming" state when no section is eligible. Never show counts or progress bars. | V1 |
| MEM-05 | Track local interaction signals (opens, story reads, source taps, replays, recap highlights) in `daySignals`. | V1 |
| MEM-06 | Use salience only to choose or rank what surfaces; never to change facts, labels, or evidence. | V1 |
| MEM-07 | One year ago / N years ago: prefer the exact month-day in prior years, nearest first; fall back to the nearest earlier story-backed day. | V1 |
| MEM-08 | This week: show a short recap with quoted lines linking to days. | V1 |
| MEM-09 | Marked days: show a horizontal row of day cards with a small bronze label. | V1 |
| MEM-10 | Every marked day exposes two or three exact quotes from the user's writing. | V1 |
| MEM-11 | Monthly recap: a two-paragraph reflection with "Pages worth returning to." No numbers or charts. | V1 |
| MEM-12 | No insight, mood, or ribbon appears on Home, Calendar, or Day screens. | V1 |

### 8.9 Marked day detail

| ID | Requirement | Status |
|---|---|---|
| MARK-01 | Show a sheet with the ribbon name and two or three quoted lines as evidence. | V1 |
| MARK-02 | Provide "Read the day" and "Replay this day" links. | V1 |
| MARK-03 | Quotes must be exact substrings of the user's writing. | V1 |

### 8.10 Monthly recap

| ID | Requirement | Status |
|---|---|---|
| RECAP-01 | Show a two-paragraph reflection in a letter-like voice. | V1 |
| RECAP-02 | Show "Pages worth returning to" with four days and one quoted line each. | V1 |
| RECAP-03 | No numbers, charts, or statistics. | V1 |
| RECAP-04 | Cache the recap; regenerate only when the month's content changes. | V1 |

### 8.11 Replay

| ID | Requirement | Status |
|---|---|---|
| REPLAY-01 | Full-screen slow slideshow of the day's photos with story lines as captions. | V1 |
| REPLAY-02 | White serif captions over a soft fade, a progress line, a close button, and a music toggle. | V1 |
| REPLAY-03 | If no photos exist, use text-only slides built from story sentences. | V1 |
| REPLAY-04 | Replay makes no AI call. | V1 |

### 8.12 Profile

| ID | Requirement | Status |
|---|---|---|
| PROFILE-01 | Show the book's name and allow editing it. | V1 |
| PROFILE-02 | Optional evening reminder time. | V1 |
| PROFILE-03 | Memory notifications toggle. | V1 |
| PROFILE-04 | Show writing style as "Polished." | V1 |
| PROFILE-05 | Export my diary as a readable text file and a JSON backup. | V1 |
| PROFILE-06 | Load demo diary. | V1 |
| PROFILE-07 | Clear all data with confirmation. | V1 |
| PROFILE-08 | About and What's Next rows. | V1 |

### 8.13 What's Next

| ID | Requirement | Status |
|---|---|---|
| NEXT-01 | List the features from the problem statement with name, one-line reason, and status (Planned, Exploring, Needs research). | V1 |
| NEXT-02 | Each row has a quiet "I want this" tap that persists locally. | V1 |
| NEXT-03 | Show a small local count on the device. | V1 |
| NEXT-04 | Same quiet book style: vertical rows separated by hairlines, no cards. | V1 |
| NEXT-05 | No network call is required for votes. | V1 |

### 8.14 In-app notifications

| ID | Requirement | Status |
|---|---|---|
| NOTIF-01 | Show in-app banners for qualifying throwbacks, newly awarded ribbons, and the optional evening reminder. | V1 |
| NOTIF-02 | Throwbacks use the same multi-year selection as Memories and say "N years ago today." | V1 |
| NOTIF-03 | Banners can be dismissed and do not repeat in the same session. | V1 |
| NOTIF-04 | Reminder only appears while the app is open. | V1 |
| NOTIF-05 | True push notifications are not part of v1. | WON'T |

### 8.15 Hidden debug

| ID | Requirement | Status |
|---|---|---|
| DEBUG-01 | `/debug` is reachable only in development or with an explicit local flag. | V1 |
| DEBUG-02 | Show median open-to-save time, pieces per active day, undo-polish rate, AI failure rate, cache hit rate, job latency, readiness, and salience. | V1 |
| DEBUG-03 | No analytics service and no network reporting. | V1 |
| DEBUG-04 | Debug data clears with all data. | V1 |

---

## 9. AI requirements

| ID | Requirement | Status |
|---|---|---|
| AI-01 | All AI calls go through one server route (`POST /api/ai`); the API key never ships to the browser. | V1 |
| AI-02 | Every AI response is JSON and validated against a schema. | V1 |
| AI-03 | Invalid responses are retried once, then fall back gracefully. | V1 |
| AI-04 | Polish fixes spelling, grammar, and punctuation; improves clarity; keeps first-person voice, meaning, names, numbers, places, and order. | V1 |
| AI-05 | Polish must not add facts, feelings, or details, or make the writing more dramatic; length stays roughly the same. | V1 |
| AI-06 | The raw text is saved unchanged and used by Undo polish. | V1 |
| AI-07 | Day story output is `{ heading, story: [{ text, sourcePieceIds }] }`. | V1 |
| AI-08 | The heading is under eight words and describes the day's real content. | V1 |
| AI-09 | Every story sentence cites at least one valid piece id. Invalid sentences are dropped; if more than one third fail, keep the previous story and retry later. | V1 |
| AI-10 | A day with one short note gets one or two sentences, not padding. | V1 |
| AI-11 | Insights output includes open-ended moods, ribbons, places, and people; evidence quotes must be exact substrings. | V1 |
| AI-12 | Ribbons are awarded locally by rarity and spaced about one per label per seven days; the model does not decide awards. | V1 |
| AI-13 | Weekly and monthly recaps are generated on demand and cached; highlights link to days. | V1 |
| AI-14 | An image without caption gets one factual visible sentence; the model never guesses identity or motive. | V1 |
| AI-15 | Calls are queued, debounced, cached by content hash, and never block the UI. | V1 |
| AI-16 | The AI provider sits behind one interface and can be swapped. | V1 |

### AI task triggers

| Task | Trigger |
|---|---|
| Polish | After each piece is saved |
| Story | Debounced 8 seconds after the last piece on that day; again when a past day gets a piece |
| Insights | After a successful story update when content changed |
| Recap | On demand when a weekly or monthly recap is opened |
| Vision | When an image is attached without caption text |

---

## 10. Data and privacy requirements

| ID | Requirement | Status |
|---|---|---|
| DATA-01 | Use IndexedDB via Dexie as the system of record. | V1 |
| DATA-02 | Store text, media blobs, thumbnails, days, recaps, settings, votes, jobs, and interaction signals locally. | V1 |
| DATA-03 | `Piece.rawText` is immutable after creation. | V1 |
| DATA-04 | `Day.id` is a local calendar date string. | V1 |
| DATA-05 | Story sentences always reference existing piece ids. | V1 |
| DATA-06 | Media blobs are immutable; thumbnails are derived. | V1 |
| DATA-07 | No server database, no accounts, no cloud sync. | V1 |
| DATA-08 | AI request content is not stored server-side. | V1 |
| DATA-09 | Privacy, encryption, app lock, and cloud sync are out of scope and listed on What's Next. | WON'T |
| DATA-10 | Export and Clear all data are available from Profile. | V1 |
| DATA-11 | Demo content is clearly flagged and removable. | V1 |

---

## 11. Non-functional requirements

| ID | Requirement | Target |
|---|---|---|
| NFR-01 | Today's page is interactive within one second on a mid-range phone. | Performance |
| NFR-02 | A text piece can be saved in under five seconds from opening; expected under one second. | Performance |
| NFR-03 | AI never blocks writing, navigation, or reading. | Reliability |
| NFR-04 | Writing and reading work fully offline; AI shows a quiet unavailable state. | Offline |
| NFR-05 | The app installs as a PWA and precaches its shell, fonts, and icons. | PWA |
| NFR-06 | Sheets trap focus and close on Escape; controls are keyboard accessible. | Accessibility |
| NFR-07 | Touch targets are at least 44 px; meaning is never conveyed by color alone. | Accessibility |
| NFR-08 | Layout is mobile-first, readable at 320 px and above, with a comfortable desktop measure. | Responsive |
| NFR-09 | Primary support: current Chrome and Android Chrome. Safari is usable with known speech limits. | Browser support |
| NFR-10 | Production build runs on free tiers only. | Cost |
| NFR-11 | No shadows, one bronze accent, ivory paper, hairline dividers, serif prose. | Design |
| NFR-12 | Dates, labels, and navigation use Inter; prose and headings use EB Garamond. | Design |
| NFR-13 | Motion is limited to short opacity/color transitions and respects reduced motion. | Design |
| NFR-14 | The app requests persistent storage opportunistically and never loses raw text silently. | Durability |
| NFR-15 | Unit, integration, contract, component, and E2E tests exist for critical flows. | Quality |

---

## 12. States and edge cases

| State | Required behavior |
|---|---|
| Empty today | Date, writing surface, capture bar only. No cards. |
| Empty Calendar | Quiet empty state; no dashboard. |
| Empty day | Quiet empty page with an Add action. |
| Story updating | Quiet line under the story; previous story remains. |
| AI unavailable | Polished or raw text remains; quiet retry. |
| AI rate limited | Back off silently; no error dialog. |
| Polish invalid | Show raw text; quiet retry. |
| Story invalid | Keep previous story; retry later. |
| Insights invalid | Keep previous insights; no visible error. |
| Speech unsupported | Explain and offer typing. |
| No photos for Replay | Text-only slides. |
| Demo data loaded | Small unobtrusive label. |
| Offline | Capture and read; AI paused and queued. |
| Long day | Chunked grounded extraction; otherwise keep previous story. |
| Media too large | Compress or reject with a quiet clear message. |
| Storage pressure | Quiet failure handling; export remains available. |
| Memories forming | Quiet line; no counts, progress bars, or streaks. |

---

## 13. Demo diary requirements

| ID | Requirement |
|---|---|
| DEMO-01 | Load roughly 45 realistic days with varied tone, length, media, places, and people. |
| DEMO-02 | Spread days across recent months and prior years, including exact anniversaries at 1, 2, and 5 years back. |
| DEMO-03 | Include days that earn ribbons and days that do not. |
| DEMO-04 | Include precomputed polished text, stories, insights, and recaps so Memories is fully populated instantly. |
| DEMO-05 | Seed interaction signals so salience ranking is demonstrable. |
| DEMO-06 | Force full Memories readiness while demo data is loaded. |
| DEMO-07 | Flag demo rows and show a small label. |
| DEMO-08 | Loading twice does not duplicate data. |
| DEMO-09 | Clear all data removes demo content. |

---

## 14. Acceptance criteria

| ID | Criterion |
|---|---|
| AC-01 | Opening the app shows today's blank page and capture options within one second. |
| AC-02 | A text piece can be added in under five seconds from opening the app. |
| AC-03 | After a piece is added, polish appears within a few seconds, and Undo polish restores the raw words exactly. |
| AC-04 | Polished text keeps names, numbers, places, and meaning; on ten test pieces, none gains a fact the raw text lacked. |
| AC-05 | Every story sentence opens a source passage; on ten test days, none contains a fact absent from the pieces. |
| AC-06 | A day with one short note produces a one- or two-sentence story, not padding. |
| AC-07 | The Calendar shows a dot for each day with entries, and any past day can be added to and is marked added later. |
| AC-08 | Memories appears progressively after meaningful data exists, or instantly after Load demo diary. It is never gated by a single fixed day count. |
| AC-09 | No insight, mood, or ribbon appears on Home, Calendar, or Day screens. |
| AC-10 | Every ribbon shows exact quotes from the user's own writing. |
| AC-11 | With the network off, the user can still write and read. AI features show a quiet unavailable state. |
| AC-12 | The What's Next screen lists the required features, and "I want this" persists on the device. |
| AC-13 | The app installs as a PWA, and its production build runs on free tiers. |
| AC-14 | The Calendar can reach and open dates years back, and a multi-year throwback resolves to the nearest available anniversary. |
| AC-15 | The Memories tab remains calm while forming: no counts, progress bars, streaks, or dashboard elements. |
| AC-16 | Interaction signals are local-only and never alter story facts, ribbon labels, or evidence quotes. |

---

## 15. Measurement (portfolio)

| Metric | Definition |
|---|---|
| North star | Days per week with a saved diary page, per user. |
| Capture | Median time from opening the app to a saved piece; pieces per active day. |
| AI quality | Rate of Undo polish taps; rate of dismissed or incorrect ribbons. |
| Implementation | Hidden `/debug` view over demo and developer use. Not user-facing. |

No analytics service, no network reporting, and no user-facing dashboard.

---

## 16. Risks and mitigations

| Risk | Level | Mitigation |
|---|---|---|
| Polish changes meaning | High | Strict rules, raw field, Undo polish, test set |
| Story flattens what mattered | Medium | Source links, full text one tap away, no padding |
| Free-tier rate limits | Medium | Queue, debounce, cache, backoff, low concurrency |
| Speech support varies | Medium | Feature detection, clear fallback to typing |
| Cold start for Memories | Medium | Progressive readiness, demo diary with fixtures and seeded signals |
| Readiness feels arbitrary or gamified | Medium | No visible scores or streaks; section-level rules; tunable constants |
| Interaction tracking feels intrusive | Low | Local-only signals, no analytics, clearable with data |
| Long history slows Memories | Low | Indexed queries, cached readiness, salience over story-backed days only |
| Long days exceed context | Low/Medium | Chunked grounded extraction, otherwise keep previous story |
| Browser data eviction | Medium | Persistent storage request, export, clear-data confirmation |
| Unvalidated hypothesis | High (known) | Stated as a hypothesis; research on What's Next |

---

## 17. Dependencies and assumptions

### Dependencies

- Node.js and npm for local development.
- A Gemini API key held only in the server environment.
- Vercel (or equivalent) for the static app and one serverless function.
- Modern browser with IndexedDB; speech recognition is optional.
- Free-tier quotas are sufficient for portfolio-scale use.

### Assumptions

- The app is single-user and device-local.
- A day is defined by the user's local timezone.
- User text can be long, but a single day usually fits the model context.
- Media stays on the device; export can omit blobs.
- The Stitch screens are visual references, not binding layouts.

---

## 18. Release plan and phases

| Phase | Name | Outcome |
|---|---|---|
| 1 | Setup | Project, design tokens, fonts, PWA manifest, four-tab shell |
| 2 | Local data layer | Dexie schema, repositories, date helpers |
| 3 | Home | Blank page, capture bar, text pieces, collapsed earlier pieces |
| 4 | Server route and polish | One AI route, JSON validation, polish, raw field, undo |
| 5 | Day story | Heading, grounded story, debounce, Day screen, source panel, full writing |
| 6 | Calendar | Month grid, year navigation, dots, past-day writing |
| 7 | Voice | Speech recognition, speaking sheet, fallback |
| 8 | Photos and videos | Blob storage, inline media, vision descriptions |
| 9 | Demo diary | Multi-year seeded diary with fixtures and signals |
| 10 | Insights and Memories | Insights, ribbons, readiness, salience, multi-year throwbacks, recaps, marked days |
| 11 | Notifications | In-app banners and evening reminder |
| 12 | Replay | Slideshow with text-only fallback |
| 13 | Profile | Settings, export, clear data, demo load |
| 14 | What's Next | Feature list and local votes |
| 15 | Polish and QA | States, accessibility, performance, acceptance pass |

Detailed task breakdowns live in `docs/implementation/`.

---

## 19. Traceability

| Requirement area | Architecture reference | Phase docs |
|---|---|---|
| Shell, navigation, PWA | §1, §6, §14 | Phases 1, 15 |
| Data model | §7 | Phases 2, 8, 9, 10 |
| Capture and polish | §8.1, §9, §10 | Phases 3, 4, 7, 8 |
| Day story | §8.4, §8.5, §9 | Phase 5 |
| Calendar and past days | §6, §8 | Phase 6 |
| Memories and readiness | §8.6, §8.7 | Phases 9, 10 |
| Notifications | §8.9 | Phase 11 |
| Replay | §8.8 | Phase 12 |
| Profile and export | §16, §17 | Phase 13 |
| What's Next | §5, §6 | Phase 14 |
| Quality and acceptance | §19, §20 | Phase 15 |

---

## 20. Glossary

| Term | Meaning |
|---|---|
| Piece | One capture: text, voice, photo, or video, with raw and polished text |
| Raw text | The immutable words the user wrote or dictated |
| Polished text | The AI-corrected version shown to the user; undoable |
| Day | A local calendar date with a heading, story, and insights |
| Story | The one-page first-person summary made of cited sentences |
| Source passage | The piece text behind a story sentence |
| Ribbon | A local rarity award shown only in Memories |
| Marked day | A day with one or more ribbons |
| Readiness | Local score and section rules that decide what Memories shows |
| Salience | Local interaction-weighted measure used only for ranking memories |
| Throwback | A day from a prior year, preferred at the exact anniversary |
| Replay | A slideshow of a day's media and story lines |
| Demo diary | Seeded sample data that makes the app feel alive on day one |
