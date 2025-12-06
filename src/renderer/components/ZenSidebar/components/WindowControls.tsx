import React from 'react';

export const WindowControls: React.FC = () => {
  return (
    <div className="zen-sidebar__window-controls">
      <button 
        className="zen-window-btn zen-window-btn--close" 
        onClick={() => window.electronAPI.close()} 
        title="Закрыть" 
      />
      <button 
        className="zen-window-btn zen-window-btn--minimize" 
        onClick={() => window.electronAPI.minimize()} 
        title="Свернуть" 
      />
      <button 
        className="zen-window-btn zen-window-btn--maximize" 
        onClick={() => window.electronAPI.maximize()} 
        title="Развернуть" 
      />
    </div>
  );
};
