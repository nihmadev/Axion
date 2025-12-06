import React from 'react';

interface ResizeHandleProps {
  onStartResize: () => void;
}

export const ResizeHandle: React.FC<ResizeHandleProps> = ({ onStartResize }) => {
  return (
    <div 
      className="zen-sidebar__resize-handle"
      onMouseDown={onStartResize}
      title="Перетащите для изменения ширины"
    />
  );
};
