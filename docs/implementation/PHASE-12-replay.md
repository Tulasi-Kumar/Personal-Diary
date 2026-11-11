# Phase 12 — Replay

| Field | Value |
|---|---|
| Status | Implemented |
| Depends on | Phase 11 |
| Unlocks | Phase 13 |
| PRD | REPLAY-01..04, MARK-02 |
| Architecture | §8.8, §13 |
| Design | Replay screen |

## Goal

Let the user replay any day as a slow, cinematic slideshow built from its media and story, with a calm text-only fallback when there are no photos.

**Phase gate:** Replay plays a day's photos with story-line captions, works with text-only slides, and closes cleanly without affecting data or AI quota.

## In scope

- `/day/:date/replay` route.
- Slide builder from media and story sentences.
- Caption selection.
- Full-screen slideshow with progress line.
- Close button, keyboard controls, and music toggle.
- Text-only fallback.
- Reduced motion behavior.
- Tests for slide building and fallback.

## Out of scope

- Video generation.
- AI calls.
- Transitions beyond a soft fade.
- Sharing or exporting the replay.

## Deliverables

1. Replay route and screen.
2. Slide builder service.
3. Caption mapping.
4. Progress and controls.
5. Music toggle.
6. Tests and manual verification.

## Tasks

### 12.1 Slide builder

- [ ] Load the day's media pieces in order.
- [ ] Build one slide per media item.
- [ ] Choose the nearest story sentence as the caption.
- [ ] If a piece has a caption or description, prefer it for that slide.
- [ ] If there are no media items, build text-only slides from story sentences.
- [ ] If there are neither media nor story, show a quiet empty replay state.
- [ ] Cap slide count for very long days without dropping the opening or closing lines.
- [ ] Keep slide order deterministic.

### 12.2 Slideshow UI

- [ ] Full-screen paper or dark fade per design; white serif captions.
- [ ] Slow cross-fade between slides.
- [ ] Progress line at the top or bottom.
- [ ] Close button with an accessible label.
- [ ] Tap or arrow keys advance; Escape closes.
- [ ] Pause on hold or focus where appropriate.
- [ ] Text-only slides use a quiet paper background and serif lines.
- [ ] Respect reduced motion: no cross-fade, instant slide changes.

### 12.3 Captions

- [ ] Use story sentences without surrounding quotes.
- [ ] Keep captions short; trim to a readable line if needed without changing meaning.
- [ ] Do not invent captions.
- [ ] If no story sentence exists, omit the caption rather than filling it.
- [ ] Show media descriptions only when they are the only text available and are grounded.

### 12.4 Music toggle

- [ ] Provide a music toggle.
- [ ] Use a bundled royalty-free audio asset or a quiet generated tone; no network required.
- [ ] Default to off.
- [ ] Remember the choice for the session only.
- [ ] Pause music on close.
- [ ] Never autoplay sound.

### 12.5 Accessibility and performance

- [ ] Provide a visible close control and keyboard support.
- [ ] Announce slide changes politely if needed.
- [ ] Do not rely on color alone for progress.
- [ ] Lazy-load full-size images; use thumbnails first.
- [ ] Revoke object URLs on unmount.
- [ ] Avoid layout shift when media loads.

### 12.6 Tests

- [ ] Unit: slide builder with media, without media, and empty day.
- [ ] Unit: caption selection prefers media caption then nearest story sentence.
- [ ] Component: progress, close, and navigation.
- [ ] Integration: object URLs revoke on unmount.
- [ ] E2E: open replay from a marked day, advance slides, close.
- [ ] E2E: text-only replay for a day without photos.
- [ ] Accessibility: Escape closes and focus returns to the trigger.

## Technical notes

- Replay makes no AI call.
- Use the same blob access and thumbnail patterns as Phase 8.
- Do not mutate the day or story.
- Keep transitions slow and calm; this is not a social-media reel.
- The music toggle must work offline; bundle the asset.
- If a media blob is missing, skip the slide rather than showing a broken image.

## States and edge cases

| State | Behavior |
|---|---|
| Day with photos | Photo slides with story captions. |
| Day without photos | Text-only slides. |
| Day with neither | Quiet empty replay. |
| Missing media blob | Skip the slide. |
| Reduced motion | Instant slide changes. |
| Music on and close | Music stops. |
| Long day | Cap slides while keeping opening and closing. |

## Acceptance criteria

- [ ] Replay plays a day's photos with story-line captions.
- [ ] A day with no photos uses text-only slides.
- [ ] Progress, close, keyboard navigation, and music toggle work.
- [ ] No AI call is made.
- [ ] Object URLs are revoked and missing media is skipped.
- [ ] Reduced motion is respected.
- [ ] Tests pass.

## Tests

- **Unit:** slide builder and caption selection.
- **Component:** controls and progress.
- **E2E:** media replay, text-only replay, close and focus return.

## Manual verification

1. Open a demo day with photos and start Replay.
2. Confirm slow fades, captions, and progress.
3. Advance with tap and arrow keys; close with Escape.
4. Toggle music on and off; confirm it stops on close.
5. Open a day without photos; confirm text-only slides.
6. Open an empty day; confirm a quiet empty state.
7. Enable reduced motion; confirm instant transitions.
8. Confirm no AI network call occurs.

## Handoff

Phase 13 adds the Profile settings, export, demo load, and clear data. Replay remains reachable from marked days and days.
