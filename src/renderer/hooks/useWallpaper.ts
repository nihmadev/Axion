import { useState, useEffect } from 'react';

const WALLPAPERS = [
  'walpaper1.jpg',
  'walpaper2.jpg',
  'walpaper3.jpg',
  'walpaper4.jpg',
  'walpaper5.jpg',
  'walpaper6.jpg',
  'walpaper7.jpg',
  'walpaper8.jpg',
];

const CHANGE_INTERVAL = 10 * 60 * 1000;

export const useWallpaper = () => {
  const [currentWallpaper, setCurrentWallpaper] = useState<string>('');

  const getRandomWallpaper = () => {
    const randomIndex = Math.floor(Math.random() * WALLPAPERS.length);
    return `/${WALLPAPERS[randomIndex]}`;
  };

  const changeWallpaper = () => {
    const wallpaper = getRandomWallpaper();
    setCurrentWallpaper(wallpaper);
    localStorage.setItem('lastWallpaper', wallpaper);
    localStorage.setItem('lastWallpaperChange', Date.now().toString());
  };

  useEffect(() => {
    const lastWallpaper = localStorage.getItem('lastWallpaper');
    const lastChange = localStorage.getItem('lastWallpaperChange');
    const now = Date.now();

    if (!lastWallpaper || !lastChange || now - parseInt(lastChange) > CHANGE_INTERVAL) {
      changeWallpaper();
    } else {
      setCurrentWallpaper(lastWallpaper);
    }

    const interval = setInterval(changeWallpaper, CHANGE_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return currentWallpaper;
};
