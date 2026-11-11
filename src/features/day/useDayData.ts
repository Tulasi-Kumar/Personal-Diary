import { useLiveQuery } from 'dexie-react-hooks';
import { getDay, listPieces } from '../../lib/db/repositories';

export function useDayData(date: string) {
  const day = useLiveQuery(() => getDay(date), [date]);
  const pieces = useLiveQuery(() => listPieces(date), [date]);
  return {
    day,
    pieces: pieces ?? [],
    loading: pieces === undefined,
  };
}
