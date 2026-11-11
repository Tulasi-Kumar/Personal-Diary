import { useLiveQuery } from 'dexie-react-hooks';
import { loadMemoriesData } from '../lib/memory/sections';

export function useMemoriesData() {
  return useLiveQuery(() => loadMemoriesData(), []);
}
