import React from 'react';
import { WeatherData } from '../types';
import { weatherCodeToKey } from '../constants';
import type { Translations } from '../../../i18n';

interface WeatherWidgetProps {
  weather: WeatherData;
  t: Translations;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ weather, t }) => {
  return (
    <div className="weather-widget">
      <div className="weather-icon">{weather.icon}</div>
      <div className="weather-info">
        <div className="weather-temp">{weather.temp}°C</div>
        <div className="weather-desc">{t.weather[weatherCodeToKey[weather.weatherCode] || 'clear']}</div>
        <div className="weather-location">{weather.location}</div>
      </div>
    </div>
  );
};
