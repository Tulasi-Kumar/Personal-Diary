import { useLiveQuery } from 'dexie-react-hooks';
import { Image as ImageIcon, Play } from 'lucide-react';
import { getMedia } from '../lib/db/repositories';
import { useObjectUrl } from '../hooks/useObjectUrl';

export function MediaPreview({
  mediaId,
  kind,
  expanded = false,
}: {
  mediaId?: string;
  kind: 'photo' | 'video';
  expanded?: boolean;
}) {
  const media = useLiveQuery(
    () => (mediaId ? getMedia(mediaId) : Promise.resolve(undefined)),
    [mediaId],
  );
  const url = useObjectUrl(media?.blob);

  if (!media || !url) {
    return (
      <div className={`media-thumb media-thumb--empty${expanded ? ' media-thumb--full' : ''}`}>
        <ImageIcon aria-hidden="true" />
        <span className="meta">{kind === 'photo' ? 'Photo' : 'Video'}</span>
      </div>
    );
  }

  if (kind === 'video' && !media.mimeType.startsWith('image/')) {
    return (
      <div className={expanded ? 'media-full' : 'media-thumb'}>
        <video
          src={url}
          controls={expanded}
          muted={!expanded}
          playsInline
          preload="metadata"
          aria-label="Video from this day"
        />
        {!expanded ? (
          <span className="media-thumb__play" aria-hidden="true">
            <Play />
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={media.fileName ? `Photo: ${media.fileName}` : 'Photo from this day'}
      className={expanded ? 'media-full' : 'media-thumb'}
      loading="lazy"
    />
  );
}
