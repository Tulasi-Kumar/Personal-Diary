import { Camera, Mic, PenLine, Video } from 'lucide-react';

export function QuickActions({
  onSpeak,
  onPhoto,
  onVideo,
  disabled,
}: {
  onSpeak?: () => void;
  onPhoto?: () => void;
  onVideo?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="quick-actions" aria-label="Ways to add to today">
      <span className="quick-action is-active" aria-current="true">
        <PenLine aria-hidden="true" />
        <span>Type</span>
      </span>
      <button type="button" className="quick-action" onClick={onSpeak} disabled={disabled || !onSpeak}>
        <Mic aria-hidden="true" />
        <span>Speak</span>
      </button>
      <button type="button" className="quick-action" onClick={onPhoto} disabled={disabled || !onPhoto}>
        <Camera aria-hidden="true" />
        <span>Photo</span>
      </button>
      <button type="button" className="quick-action" onClick={onVideo} disabled={disabled || !onVideo}>
        <Video aria-hidden="true" />
        <span>Video</span>
      </button>
    </div>
  );
}
