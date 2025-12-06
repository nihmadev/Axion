import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { HistoryEntry } from '../types';

export const useHistory = () => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const addToHistory = useCallback((entry: Omit<HistoryEntry, 'id' | 'visitedAt'>) => {
    const historyEntry: HistoryEntry = { 
      ...entry, 
      id: uuidv4(), 
      visitedAt: Date.now() 
    };
    window.electronAPI.addHistory(historyEntry);
    setHistory(prev => [historyEntry, ...prev.slice(0, 499)]);
  }, []);

  const clearHistory = useCallback(() => {
    window.electronAPI.clearHistory();
    setHistory([]);
  }, []);

  return {
    history,
    setHistory,
    addToHistory,
    clearHistory,
  };
};
