import { useCallback, useState } from 'react';
import { loadDeckSize, saveDeckSize } from '../utils/deck-size';

/** The user's card limit, loaded from and saved to browser storage. */
export function useCardLimit(): [number, (size: number) => void] {
  const [size, setSize] = useState(loadDeckSize);

  const changeSize = useCallback((newSize: number) => {
    setSize(newSize);
    saveDeckSize(newSize);
  }, []);

  return [size, changeSize];
}
