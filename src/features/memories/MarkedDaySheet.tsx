import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import type { Ribbon } from '@shared/types';
import { Sheet } from '../../components/Sheet';
import { formatLongDate } from '../../lib/db/dates';
import { getDay, listPieces, listRibbons } from '../../lib/db/repositories';

function sentenceContaining(text: string, quote: string): string | null {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  const index = cleaned.indexOf(quote);
  if (index < 0) return null;
  const start = Math.max(0, cleaned.lastIndexOf('.', index) + 1);
  const end = cleaned.indexOf('.', index + quote.length);
  const sentence = cleaned.slice(start, end >= 0 ? end + 1 : undefined).trim();
  return sentence || null;
}

export function MarkedDaySheet({
  ribbon,
  onClose,
}: {
  ribbon: Ribbon | null;
  onClose: () => void;
}) {
  const day = useLiveQuery(
    () => (ribbon ? getDay(ribbon.date) : Promise.resolve(undefined)),
    [ribbon?.date],
  );
  const pieces = useLiveQuery(
    () => (ribbon ? listPieces(ribbon.date) : Promise.resolve([])),
    [ribbon?.date],
  );
  const dayRibbons = useLiveQuery(
    () => (ribbon ? listRibbons(ribbon.date) : Promise.resolve([])),
    [ribbon?.date],
  );

  if (!ribbon) return null;

  const quotes = new Set<string>([ribbon.quote]);
  for (const other of dayRibbons ?? []) quotes.add(other.quote);
  const source = (pieces ?? []).find((piece) => piece.id === ribbon.pieceId);
  if (source) {
    const sentence = sentenceContaining(source.text, ribbon.quote);
    if (sentence) quotes.add(sentence);
  }
  const evidence = Array.from(quotes).filter(Boolean).slice(0, 3);
  const heading = day?.heading ?? day?.story?.heading ?? 'A marked day';

  return (
    <Sheet open onClose={onClose} title={ribbon.label}>
      <div className="stack stack-4">
        <div>
          <p className="label label--bronze">Marked day</p>
          <h3 className="headline" style={{ marginTop: '0.35rem' }}>
            {heading}
          </h3>
          <p className="meta" style={{ marginTop: '0.3rem' }}>
            {formatLongDate(ribbon.date)}
          </p>
        </div>

        <div className="stack stack-3">
          {evidence.map((quote) => (
            <blockquote key={quote} className="quote marked-quote">
              “{quote}”
            </blockquote>
          ))}
        </div>

        <div className="row row--wrap" style={{ gap: '0.75rem' }}>
          <Link to={`/day/${ribbon.date}`} className="btn btn--primary" onClick={onClose}>
            Read the day
          </Link>
          <Link to={`/day/${ribbon.date}/replay`} className="btn btn--secondary" onClick={onClose}>
            Replay this day
          </Link>
        </div>
      </div>
    </Sheet>
  );
}
