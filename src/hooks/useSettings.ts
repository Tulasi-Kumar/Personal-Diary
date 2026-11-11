import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db/db';
import { ensureSettings } from '../lib/db/repositories';

export function useSettings() {
  const settings = useLiveQuery(() => db.settings.get('settings'), []);
  useEffect(() => {
    if (settings === undefined) {
      void ensureSettings();
    }
  }, [settings]);
  return settings;
}
