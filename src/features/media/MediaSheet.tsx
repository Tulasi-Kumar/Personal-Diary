import { useEffect, useRef, useState } from 'react';
import { Camera, Film, Upload } from 'lucide-react';
import { Sheet } from '../../components/Sheet';
import { useObjectUrl } from '../../hooks/useObjectUrl';
import { useToast } from '../../components/Toast';
import { addMedia, addPiece, updateDay } from '../../lib/db/repositories';
import { db } from '../../lib/db/db';
import { enqueueVision } from '../../lib/ai/queue';

const MAX_BYTES = 100 * 1024 * 1024;
const MAX_AI_BYTES = 12 * 1024 * 1024;

function describeSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaSheet({
  open,
  kind,
  date,
  onClose,
  onSaved,
}: {
  open: boolean;
  kind: 'photo' | 'video' | null;
  date: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const previewUrl = useObjectUrl(file);
  const toast = useToast();

  useEffect(() => {
    if (!open) {
      setFile(null);
      setCaption('');
      setError(null);
      setSaving(false);
    }
  }, [open]);

  if (!kind) return null;

  function choose(next: File | null) {
    setError(null);
    if (!next) return;
    const expected = kind === 'photo' ? 'image/' : 'video/';
    if (!next.type.startsWith(expected)) {
      setError(kind === 'photo' ? 'That file is not a photo.' : 'That file is not a video.');
      return;
    }
    if (next.size > MAX_BYTES) {
      setError('That file is larger than 100 MB. Choose a smaller one.');
      return;
    }
    setFile(next);
  }

  async function save() {
    if (!file || !kind || saving) return;
    setSaving(true);
    try {
      const media = await addMedia({
        kind,
        mimeType: file.type || (kind === 'photo' ? 'image/jpeg' : 'video/mp4'),
        blob: file,
        fileName: file.name,
      });
      const canDescribe = file.size <= MAX_AI_BYTES;
      const fallbackText = caption.trim() || (kind === 'photo' ? 'A photo from this day.' : 'A video from this day.');
      const piece = await addPiece({
        date,
        kind,
        text: caption.trim(),
        source: 'typed',
        mediaId: media.id,
        polishStatus: 'queued',
      });
      if (!canDescribe) {
        await updateDay(date, { storyStatus: 'queued' });
        await db.pieces.update(piece.id, {
          text: fallbackText,
          originalText: fallbackText,
          polishStatus: 'skipped',
          updatedAt: Date.now(),
        });
      } else {
        await updateDay(date, { storyStatus: 'queued' });
        void enqueueVision(piece.id);
      }
      toast.show(kind === 'photo' ? 'Photo added to today.' : 'Video added to today.');
      onSaved();
      onClose();
    } catch {
      toast.show('That file could not be saved. Try once more.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={kind === 'photo' ? 'Add a photo' : 'Add a video'}
    >
      <div className="stack stack-5">
        <input
          ref={input}
          type="file"
          accept={kind === 'photo' ? 'image/*' : 'video/*'}
          className="sr-only"
          onChange={(event) => choose(event.target.files?.[0] ?? null)}
          aria-label={kind === 'photo' ? 'Choose a photo' : 'Choose a video'}
        />

        {file && previewUrl ? (
          <div className="media-preview">
            {kind === 'photo' ? (
              <img src={previewUrl} alt="Selected photo" />
            ) : (
              <video src={previewUrl} controls playsInline aria-label="Selected video" />
            )}
            <div className="media-preview__meta">
              <span className="meta">{file.name}</span>
              <span className="meta">{describeSize(file.size)}</span>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="media-drop"
            onClick={() => input.current?.click()}
          >
            <span className="media-drop__icon" aria-hidden="true">
              {kind === 'photo' ? <Camera /> : <Film />}
            </span>
            <span className="body">{kind === 'photo' ? 'Choose a photo' : 'Choose a video'}</span>
            <span className="meta">Up to 100 MB. It stays on this device.</span>
          </button>
        )}

        {file ? (
          <button type="button" className="btn btn--ghost" onClick={() => input.current?.click()}>
            <Upload aria-hidden="true" style={{ width: 14, height: 14 }} />
            Choose another
          </button>
        ) : null}

        <div className="stack stack-2">
          <label className="label" htmlFor="media-caption">
            A few words (optional)
          </label>
          <textarea
            id="media-caption"
            className="editor"
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            placeholder="Where were you? What do you want to remember?"
            rows={3}
          />
        </div>

        {error ? <p className="meta danger">{error}</p> : null}

        {file && file.size > MAX_AI_BYTES ? (
          <p className="meta">
            This file is large, so it will be kept without an automatic description. Your own words are still saved.
          </p>
        ) : null}

        <div className="row row--wrap">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => void save()}
            disabled={!file || saving}
          >
            {saving ? 'Saving' : 'Add to today'}
          </button>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
        </div>

        <p className="meta">
          Files are stored in this browser. They are not uploaded except for a brief AI description when available.
        </p>
      </div>
    </Sheet>
  );
}
