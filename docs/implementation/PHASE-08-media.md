# Phase 8 — Photos and Videos

| Field | Value |
|---|---|
| Status | Implemented |
| Depends on | Phase 7 |
| Unlocks | Phase 9 |
| PRD | HOME-04, DAY-02, ALL-04, AI-14, NFR-14 |
| Architecture | §8.3, §9, §13 |
| Design | Inline media, capture bar photo/video |

## Goal

Let the user attach a photo or video to a day, store it on the device, show it inline, and give the story a short factual description for images that have no caption.

**Phase gate:** a photo or video can be added, persists across reload, renders inline, and an uncaptioned image gets one factual description that feeds the story prompt.

## In scope

- Photo and video pickers in the capture bar.
- Image compression and thumbnail generation.
- Media blob storage in Dexie.
- Piece creation with `mediaId` and optional caption.
- Inline media in Day and Everything views.
- One optional inline photo in the story presentation.
- Vision description job for uncaptioned images.
- Media limits, error states, and cleanup.
- Tests for storage, object URLs, and mocked vision.

## Out of scope

- Video understanding.
- Audio preservation for voice notes.
- Cloud upload or media export.
- Video editing or transcoding.

## Deliverables

1. Media service for compression, thumbnails, and validation.
2. Capture bar handlers for photo and video.
3. `useObjectUrl` hook.
4. Inline media components.
5. Vision job and prompt.
6. Media description integration into story input.
7. Tests and manual verification steps.

## Tasks

### 8.1 Media service

- [ ] Accept common image types: JPEG, PNG, WebP, HEIC where the browser supports it.
- [ ] Downscale the longest image edge to about 1600 px.
- [ ] Encode images at about 0.8 quality in WebP or JPEG.
- [ ] Generate a thumbnail blob for lists and replay.
- [ ] Accept video types the browser can play.
- [ ] Enforce a video size cap (default 50 MB); show a quiet error if exceeded.
- [ ] Reject unsupported or corrupt files with a clear message.
- [ ] Preserve the original file name only as metadata if needed; do not show it prominently.

### 8.2 Save flow

- [ ] On photo or video selection, create a `Media` row.
- [ ] Create a `Piece` with `type: 'photo' | 'video'`, `mediaId`, and optional caption text from the editor.
- [ ] Use a single transaction for media and piece.
- [ ] Set `addedLater` when the day is not today.
- [ ] Render the piece immediately.
- [ ] If the piece has caption text, polish it; if not, keep `rawText` empty.
- [ ] Add a media-only piece to the day's story input through its description.

### 8.3 Inline display

- [ ] Show images inline at the page measure, with a hairline or quiet frame.
- [ ] Show videos with native controls, muted by default, no autoplay with sound.
- [ ] Use thumbnails in lists; use the full blob in the day view.
- [ ] Reserve a single optional inline photo slot in the Day story.
- [ ] Do not add cards, shadows, or rounded pills.
- [ ] Provide alt text from the caption or description.
- [ ] Revoke object URLs on unmount.

### 8.4 Vision description

- [ ] If an image has no caption, enqueue a vision job.
- [ ] Send the image bytes and mime type to `/api/ai`; the key stays server-side.
- [ ] Enforce a server payload size limit.
- [ ] Ask for one factual sentence about what is visible.
- [ ] Forbid identity, relationship, motive, or location guesses.
- [ ] Store the result in `Piece.mediaDescription`.
- [ ] Cache by image hash and prompt version.
- [ ] Include the description in the story input.
- [ ] If vision fails, the media still displays; retry quietly later.

### 8.5 Limits and errors

- [ ] Show a quiet inline message for unsupported files.
- [ ] Show a quiet inline message for oversized videos.
- [ ] Handle `QuotaExceededError` without crashing.
- [ ] Keep the day and existing pieces readable if a media write fails.
- [ ] Clean up orphaned media when a piece is deleted.
- [ ] Do not delete media still referenced by another piece.

### 8.6 Accessibility

- [ ] Media buttons have accessible names.
- [ ] Images have alt text derived from caption or description.
- [ ] Video controls are keyboard accessible via the browser.
- [ ] File selection is reachable by keyboard.

### 8.7 Tests

- [ ] Unit: image dimension calculation and thumbnail creation with a canvas mock.
- [ ] Unit: size and type validation.
- [ ] Integration: media and piece persist together; object URLs revoke.
- [ ] Contract: vision request and response validation.
- [ ] Integration: vision failure leaves the media visible.
- [ ] Component: inline image and video render with alt text.
- [ ] E2E: attach a fixture image, reload, confirm it persists and shows.
- [ ] E2E: uncaptioned image gets a mocked description and appears in the story input.

## Technical notes

- Store blobs in IndexedDB, not in localStorage and not as base64 in text fields.
- Use `createImageBitmap` and `canvas.toBlob` for compression where available.
- For HEIC, rely on browser decoding; otherwise show a clear unsupported message.
- Generate thumbnails once at save time.
- Keep media descriptions factual and short; they are AI input, not user-facing prose.
- Do not send videos to the vision model in v1.

## States and edge cases

| State | Behavior |
|---|---|
| Image saved | Inline image and optional caption. |
| Video saved | Inline video with controls. |
| Uncaptioned image | Vision job queued; image visible immediately. |
| Vision fails | Image remains; quiet retry. |
| Oversized video | Quiet error; no partial piece. |
| Unsupported type | Quiet error; no partial piece. |
| Quota exceeded | Quiet error; existing data remains readable. |
| Piece deleted | Orphaned media removed. |

## Acceptance criteria

- [ ] A photo can be added to today or a past day and persists.
- [ ] A video can be added and plays inline.
- [ ] Media renders in Day and Everything views.
- [ ] An uncaptioned image receives one factual description.
- [ ] Vision never guesses identity, relationship, motive, or location.
- [ ] Media descriptions are included in the story input.
- [ ] Failures degrade quietly without losing text.
- [ ] Object URLs are revoked and orphaned media is cleaned up.
- [ ] Tests pass with mocked vision.

## Tests

- **Unit:** compression, thumbnails, validation.
- **Integration:** media/piece transaction and cleanup.
- **Contract:** vision schema and error handling.
- **E2E:** attach image, reload, inline display, story inclusion.

## Manual verification

1. Add a photo with a caption; confirm inline display and polish.
2. Add a photo without a caption; confirm the description job and story inclusion.
3. Add a video; confirm inline playback and no autoplay sound.
4. Reload; confirm all media persists.
5. Delete a piece; confirm orphaned media is removed.
6. Try an oversized video and an unsupported file; confirm quiet errors.
7. Check alt text and keyboard access.

## Handoff

Phase 9 seeds demo media as generated placeholder blobs. Phase 12 reuses the thumbnail and blob access patterns for Replay.
