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

const CHANGE_INTERVAL = 10 * 60 * 1000; // 10 минут в миллисекундах

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
    // При первой загрузке проверяем, нужно ли менять обои
    const lastWallpaper = localStorage.getItem('lastWallpaper');
    const lastChange = localStorage.getItem('lastWallpaperChange');
    const now = Date.now();

    if (!lastWallpaper || !lastChange || now - parseInt(lastChange) > CHANGE_INTERVAL) {
      // Если обоев нет или прошло больше 10 минут - меняем
      changeWallpaper();
    } else {
      // Используем сохраненные обои
      setCurrentWallpaper(lastWallpaper);
    }

    // Устанавливаем интервал для автоматической смены
    const interval = setInterval(changeWallpaper, CHANGE_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return currentWallpaper;
};
