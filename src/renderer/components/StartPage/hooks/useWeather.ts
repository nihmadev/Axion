import { useState, useEffect } from 'react';
import { Language, translations } from '../../../i18n';
import { languageToLocale } from '../constants';
import { WeatherData } from '../types';
import {
  SunIcon,
  CloudSunIcon,
  CloudIcon,
  CloudFogIcon,
  CloudDrizzleIcon,
  CloudRainIcon,
  CloudSnowIcon,
  CloudLightningIcon,
} from '../../ZenSidebar/icons';

export const useWeather = (language: Language = 'ru') => {
  const locale = languageToLocale[language];
  const t = translations[language];
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const fetchWeather = async () => {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 300000
          });
        });

        if (!mounted) return;

        const { latitude, longitude } = position.coords;

        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=auto`
        );

        if (!mounted) return;

        if (response.ok) {
          const data = await response.json();
          const weatherCode = data.current_weather.weathercode;
          
          const weatherIconMap: Record<number, React.ReactNode> = {
            0: SunIcon({ size: 32 }),
            1: CloudSunIcon({ size: 32 }),
            2: CloudSunIcon({ size: 32 }),
            3: CloudIcon({ size: 32 }),
            45: CloudFogIcon({ size: 32 }),
            48: CloudFogIcon({ size: 32 }),
            51: CloudDrizzleIcon({ size: 32 }),
            61: CloudRainIcon({ size: 32 }),
            71: CloudSnowIcon({ size: 32 }),
            95: CloudLightningIcon({ size: 32 }),
          };
          
          const icon = weatherIconMap[weatherCode] || weatherIconMap[0];
          
          const geoResponse = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=${locale}`
          );
          
          if (!mounted) return;
          
          const geoData = await geoResponse.json();
          const location = geoData.address?.city || geoData.address?.town || geoData.address?.village || t.common.unknown;

          setWeather({
            temp: Math.round(data.current_weather.temperature),
            weatherCode: weatherCode,
            icon: icon,
            location: location,
          });
        }
      } catch (error) {
        if (mounted) {
          console.debug('Weather unavailable:', error instanceof GeolocationPositionError ? 'Location denied' : 'Network error');
        }
      }
    };

    fetchWeather();
    
    return () => {
      mounted = false;
    };
  }, [locale, t.common.unknown]);

  return weather;
};
