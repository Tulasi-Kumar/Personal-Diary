import { useState } from 'react';
import {
  ChevronDown,
  Pencil,
  RotateCcw,
  Star,
  Trash2,
  Wand2,
} from 'lucide-react';
import type { Piece } from '@shared/types';
import { formatTime } from '../../lib/db/dates';
import {
  deletePiece,
  editPieceText,
  logMetric,
  toggleFavorite,
  undoPolish,
} from '../../lib/db/repositories';
import { afterPieceChange, enqueuePolish, enqueueStory } from '../../lib/ai/queue';
import { MediaPreview } from '../../components/MediaPreview';
import { useToast } from '../../components/Toast';

const kindLabel: Record<Piece['kind'], string> = {
  text: 'Written',
  voice: 'Spoken',
  photo: 'Photo',
  video: 'Video',
};

function previewOf(piece: Piece): string {
  const text = piece.text.trim().replace(/\s+/g, ' ');
  if (!text) return piece.kind === 'photo' ? 'A photo' : piece.kind === 'video' ? 'A video' : '';
  return text.length > 92 ? `${text.slice(0, 92)}…` : text;
}

export function PieceCard({ piece }: { piece: Piece }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(piece.text);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const toast = useToast();

  const hasMedia = Boolean(piece.mediaId);
  const polished = piece.polishStatus === 'polished' && Boolean(piece.polishedText);
  const canPolish = piece.kind === 'text' || piece.kind === 'voice';

  async function retryPolish() {
    await enqueuePolish(piece.id, { force: true });
    toast.show('Polishing again. Your original words are safe.');
  }

  async function handleUndo() {
    await undoPolish(piece.id);
    await logMetric('polish_undo', piece.date);
    await enqueueStory(piece.date, { force: true });
    toast.show('Restored your exact words.');
  }

  async function handleFavorite() {
    const next = await toggleFavorite(piece.id);
    toast.show(next?.isFavorite ? 'Kept close.' : 'No longer marked.');
  }

  async function startEdit() {
    setDraft(piece.text);
    setEditing(true);
    setExpanded(true);
  }

  async function saveEdit() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    const mode = polished || hasMedia ? 'polished' : 'raw';
    await editPieceText(piece.id, trimmed, mode);
    setEditing(false);
    if (mode === 'raw'
      && (piece.kind === 'text' || piece.kind === 'voice')) {
      await enqueuePolish(piece.id, { force: true });
      toast.show('Saved. Polishing again.');
    } else {
      await afterPieceChange(piece.date);
      toast.show('Saved.');
    }
  }

  async function handleDelete() {
    await deletePiece(piece.id);
    await afterPieceChange(piece.date);
    toast.show('Piece removed.');
  }

  return (
    <article className="piece">
      <button
        type="button"
        className="piece__summary"
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
      >
        <span className="piece__time">{formatTime(piece.createdAt)}</span>
        <span className="piece__kind">{kindLabel[piece.kind]}</span>
        {hasMedia && piece.mediaId ? (
          <span className="piece__thumb">
            <MediaPreview mediaId={piece.mediaId} kind={piece.kind === 'video' ? 'video' : 'photo'} />
          </span>
        ) : null}
        <span className="piece__preview">{previewOf(piece) || 'A quiet piece'}</span>
        <ChevronDown
          aria-hidden="true"
          className={`piece__chevron${expanded ? ' is-open' : ''}`}
        />
      </button>

      {expanded ? (
        <div className="piece__body">
          {hasMedia && piece.mediaId ? (
            <div style={{ marginBottom: '1rem' }}>
              <MediaPreview
                mediaId={piece.mediaId}
                kind={piece.kind === 'video' ? 'video' : 'photo'}
                expanded
              />
            </div>
          ) : null}

          {editing ? (
            <div className="stack stack-3">
              <textarea
                className="editor piece__edit"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                aria-label="Edit this piece"
                rows={6}
              />
              <div className="row">
                <button type="button" className="btn btn--primary" onClick={() => void saveEdit()} disabled={!draft.trim()}>
                  Save
                </button>
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => {
                    setEditing(false);
                    setDraft(piece.text);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="body piece__text">
              {piece.text || (hasMedia ? 'The image will be described shortly.' : 'This piece is still being shaped.')}
            </p>
          )}

          <div className="piece__meta-line">
            {piece.addedLater ? <span className="badge">Added later</span> : null}
            {polished ? <span className="badge badge--bronze">Polished</span> : null}
            {piece.polishStatus === 'queued' ? (
              <span className="quiet-line">
                <span className="spinner" aria-hidden="true" />
                {piece.kind === 'photo' || piece.kind === 'video' ? 'Reading the image' : 'Polishing'}
              </span>
            ) : null}
            {piece.polishStatus === 'error' ? (
              <span className="meta danger">Polishing is resting.</span>
            ) : null}
            {piece.isFavorite ? <span className="badge badge--bronze">Kept</span> : null}
          </div>

          {piece.polishError ? <p className="meta danger" style={{ marginTop: '0.35rem' }}>{piece.polishError}</p> : null}

          <div className="piece__actions" aria-label="Piece actions">
            {!editing ? (
              <button type="button" className="btn-icon" onClick={() => void startEdit()} aria-label="Edit this piece" title="Edit">
                <Pencil />
              </button>
            ) : null}
            {canPolish && (piece.polishStatus === 'raw' || piece.polishStatus === 'error') ? (
              <button type="button" className="btn-icon" onClick={() => void retryPolish()} aria-label="Polish this piece" title="Polish">
                <Wand2 />
              </button>
            ) : null}
            {canPolish && polished ? (
              <button type="button" className="btn-icon" onClick={() => void handleUndo()} aria-label="Undo polish" title="Undo">
                <RotateCcw />
              </button>
            ) : null}
            <button type="button" className="btn-icon" onClick={() => void handleFavorite()} aria-label={piece.isFavorite ? 'Remove keep mark' : 'Keep this piece'} title={piece.isFavorite ? 'Unkeep' : 'Keep'}>
              <Star fill={piece.isFavorite ? 'currentColor' : 'none'} />
            </button>
            {confirmDelete ? (
              <span className="row" style={{ marginLeft: 'auto' }}>
                <span className="meta">Remove this piece?</span>
                <button type="button" className="btn btn--danger" onClick={() => void handleDelete()}>
                  Remove
                </button>
                <button type="button" className="btn btn--ghost" onClick={() => setConfirmDelete(false)}>
                  Keep
                </button>
              </span>
            ) : (
              <button type="button" className="btn-icon" onClick={() => setConfirmDelete(true)} aria-label="Delete this piece" title="Delete" style={{ marginLeft: 'auto' }}>
                <Trash2 />
              </button>
            )}
          </div>
        </div>
      ) : null}
    </article>
  );
}
