import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './tauri-api'; // Инициализация Tauri API
// Стили импортируются через App.tsx -> App.css

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
