import { useLiveQuery } from 'dexie-react-hooks';
import { isDemoLoaded } from '../lib/seed/demo';

export function useDemoLoaded(): boolean {
  return useLiveQuery(() => isDemoLoaded(), [], false) ?? false;
}
