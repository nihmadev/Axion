import { useState, useCallback } from 'react';

export const useStartPageData = () => {
  const [hiddenSites, setHiddenSites] = useState<string[]>(() => {
    const saved = localStorage.getItem('hiddenSites');
    return saved ? JSON.parse(saved) : [];
  });

  const [renamedSites, setRenamedSites] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('renamedSites');
    return saved ? JSON.parse(saved) : {};
  });

  const handleHideSite = useCallback((url: string) => {
    setHiddenSites(prev => {
      const updated = [...prev, url];
      localStorage.setItem('hiddenSites', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleDeleteSite = useCallback((url: string) => {
    // Удаление = скрытие + удаление из истории (история обрабатывается отдельно, но скрытие здесь)
    setHiddenSites(prev => {
      const updated = [...prev, url];
      localStorage.setItem('hiddenSites', JSON.stringify(updated));
      return updated;
    });
    // Также удаляем переименование если было
    setRenamedSites(prev => {
      const updated = { ...prev };
      delete updated[url];
      localStorage.setItem('renamedSites', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleRenameSite = useCallback((url: string, newName: string) => {
    setRenamedSites(prev => {
      const updated = { ...prev, [url]: newName };
      localStorage.setItem('renamedSites', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return {
    hiddenSites,
    renamedSites,
    handleHideSite,
    handleDeleteSite,
    handleRenameSite,
  };
};
