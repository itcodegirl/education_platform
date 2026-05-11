import { useMemo } from 'react';
import { useAuth } from '../providers';
import { getLearnerStorageKey, getLegacyStorageKey } from '../utils/learnerStorageKeys';
import { useLocalStorage } from './useLocalStorage';

export function useLearnerLocalStorage(baseKey, initialValue) {
  const { user } = useAuth();
  const userId = user?.id || '';
  const scopedKey = useMemo(
    () => getLearnerStorageKey(baseKey, userId),
    [baseKey, userId],
  );

  return useLocalStorage(scopedKey, initialValue, {
    fallbackKey: getLegacyStorageKey(baseKey),
    migrateFallback: true,
    removeFallbackAfterMigration: Boolean(userId),
  });
}

