# Phase 7 — Voice Capture

| Field | Value |
|---|---|
| Status | Implemented |
| Depends on | Phase 6 |
| Unlocks | Phase 8 |
| PRD | SPEAK-01..05, ALL-03, NFR-09 |
| Architecture | §8.2, §13 |
| Design | Speaking sheet, waveform, timer |

## Goal

Let the user speak a moment into today's page, with live words and a calm sheet, and still fall back cleanly to typing when speech is unavailable.

**Phase gate:** voice capture creates a normal piece with a transcript, the voice mark appears in the full writing view, and unsupported browsers get a clear path to typing.

## In scope

- Web Speech API wrapper with feature detection.
- Speaking sheet with waveform, timer, live transcript, Done, and Discard.
- Final transcript saved as a `voice` piece.
- Polish and story flow for voice pieces.
- Voice mark in "Everything I wrote."
- Fallback for unsupported, denied, or failed recognition.
- Accessibility and reduced-motion behavior.

## Out of scope

- Storing the original audio. Voice notes with audio are on What's Next.
- Multi-language recognition.
- Background recording.

## Deliverables

1. `src/lib/speech.ts` service wrapper.
2. `SpeakingSheet` component.
3. Capture bar integration for Speak.
4. Voice piece save flow.
5. Voice mark rendering.
6. Tests with a mocked `SpeechRecognition`.

## Tasks

### 7.1 Speech service

- [ ] Detect `SpeechRecognition` or `webkitSpeechRecognition`.
- [ ] Expose `isSupported()`.
- [ ] Start with `interimResults = true` and `continuous = true` where supported.
- [ ] Emit interim and final transcripts.
- [ ] Expose start, stop, abort, and reset.
- [ ] Handle `not-allowed`, `no-speech`, `network`, and `aborted` errors with typed results.
- [ ] Use the user's browser language by default.
- [ ] Never auto-submit a transcript.

### 7.2 Speaking sheet

- [ ] Dim the page behind the sheet.
- [ ] Show a minimal waveform that reacts to interim/final activity.
- [ ] Show a timer that starts on record and stops on Done or Discard.
- [ ] Show live words flowing into the page as they arrive.
- [ ] Provide Done and Discard.
- [ ] Done with an empty transcript is disabled.
- [ ] Discard leaves no piece and clears temporary text.
- [ ] Trap focus and close on Escape only after confirmation if text exists.
- [ ] Respect reduced motion: no pulsing animation.

### 7.3 Save and flow

- [ ] On Done, create a `Piece` with `type: 'voice'`, `rawText` from the final transcript, and today's or the selected day's id.
- [ ] Save immediately; render the piece.
- [ ] Enqueue polish and upsert the story job exactly as for text.
- [ ] If the user adds to a past day, set `addedLater`.
- [ ] Clear the sheet state after save.

### 7.4 Voice mark

- [ ] Add a small voice indicator to voice pieces in "Everything I wrote."
- [ ] Keep it quiet: a thin icon or label, not a badge.
- [ ] Do not add mood or stats.

### 7.5 Fallback

- [ ] If unsupported, show a calm message and focus the text editor.
- [ ] If permission is denied, explain and offer typing.
- [ ] If recognition fails mid-session, keep any final transcript already captured.
- [ ] If the network drops, preserve the transcript and allow manual completion.
- [ ] Never block the user from typing.

### 7.6 Accessibility

- [ ] Announce recording state to screen readers.
- [ ] Provide accessible names for Done and Discard.
- [ ] Ensure the timer is not the only indication that recording is active.
- [ ] Keep touch targets at least 44 px.

### 7.7 Tests

- [ ] Unit: feature detection returns false when absent.
- [ ] Unit: error mapping for denied, no-speech, network, and aborted.
- [ ] Component: sheet opens, shows interim text, Done saves, Discard does not.
- [ ] Integration: voice piece is polished and included in the story input.
- [ ] Component: voice mark renders only for voice pieces.
- [ ] E2E: mocked recognition creates a piece; unsupported state offers typing.

## Technical notes

- Do not request microphone access on page load; only after tapping Speak.
- Speech recognition is browser-provided; the app does not send audio to the AI route.
- Keep the transcript in component state until Done; do not create partial pieces.
- Use the same repository and job runner as text. Do not special-case polish.
- The voice mark is metadata only; it does not change the story prompt.

## States and edge cases

| State | Behavior |
|---|---|
| Unsupported browser | Calm message; typing remains available. |
| Permission denied | Calm message; typing remains available. |
| No speech detected | Stop cleanly; allow retry or typing. |
| Network error | Preserve final transcript; allow manual finish. |
| Empty Done | Disabled. |
| Discard with text | Confirm, then discard. |
| Past-day voice | Piece saved with `addedLater`. |

## Acceptance criteria

- [ ] Speaking opens a minimal sheet with waveform, timer, and live words.
- [ ] Done saves a voice piece; Discard saves nothing.
- [ ] Voice pieces are polished and included in the story.
- [ ] Voice pieces show a quiet voice mark in the full writing view.
- [ ] Unsupported or denied speech falls back to typing with a clear message.
- [ ] The app never blocks typing because speech failed.
- [ ] Tests pass with mocked speech.

## Tests

- **Unit:** speech support detection and error mapping.
- **Component:** speaking sheet states and actions.
- **Integration:** voice piece persistence and job enqueue.
- **E2E:** mocked recognition and unsupported fallback.

## Manual verification

1. On Chrome or Android Chrome, tap Speak and allow the microphone.
2. Speak a sentence; confirm live words appear.
3. Tap Done; confirm the piece saves and is polished.
4. Open "Everything I wrote"; confirm the voice mark.
5. Open Speaking again and tap Discard; confirm no piece is created.
6. Test in a browser without speech support; confirm the typing fallback.
7. Deny microphone permission; confirm the calm explanation.

## Handoff

Phase 8 adds photos and videos to the same capture flow. Voice pieces must continue to work unchanged.
