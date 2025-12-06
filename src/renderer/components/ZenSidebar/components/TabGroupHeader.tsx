import React, { useState, useRef, useEffect } from 'react';
import { TabGroup, TAB_GROUP_COLORS, TabGroupColorId } from '../../../types';
import { useTranslation } from '../../../hooks/useTranslation';
import { ChevronDownIcon } from '../icons';

interface TabGroupHeaderProps {
  group: TabGroup;
  tabCount: number;
  onToggleCollapse: () => void;
  onRename: (name: string) => void;
  onChangeColor: (colorId: TabGroupColorId) => void;
  onDelete: () => void;
  onCloseAll: () => void;
  language: 'ru' | 'en' | 'es' | 'fr' | 'de' | 'zh-CN';
}

export const TabGroupHeader: React.FC<TabGroupHeaderProps> = ({
  group,
  tabCount,
  onToggleCollapse,
  onRename,
  onChangeColor,
  onDelete,
  onCloseAll,
  language,
}) => {
  const t = useTranslation(language);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(group.name);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const groupColor = TAB_GROUP_COLORS.find(c => c.id === group.colorId)?.color || '#5f6368';

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPosition({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleFinishEdit = () => {
    if (editName.trim() && editName !== group.name) {
      onRename(editName.trim());
    } else {
      setEditName(group.name);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFinishEdit();
    } else if (e.key === 'Escape') {
      setEditName(group.name);
      setIsEditing(false);
    }
  };

  return (
    <>
      <div
        className={`tab-group__header ${group.collapsed ? 'tab-group--collapsed' : ''}`}
        onClick={onToggleCollapse}
        onContextMenu={handleContextMenu}
        onDoubleClick={handleDoubleClick}
      >
        <div
          className="tab-group__color-dot"
          style={{ backgroundColor: groupColor }}
        />
        
        {isEditing ? (
          <input
            ref={inputRef}
            className="tab-group__name-input"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleFinishEdit}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="tab-group__name">{group.name}</span>
        )}
        
        <span className="tab-group__count">{tabCount}</span>
        
        <ChevronDownIcon className="tab-group__chevron" />
      </div>

      {showMenu && (
        <div
          ref={menuRef}
          className="tab-group__menu"
          style={{ left: menuPosition.x, top: menuPosition.y }}
        >
          <div
            className="tab-group__menu-item"
            onClick={() => { setIsEditing(true); setShowMenu(false); }}
          >
            {t.tabGroups?.rename || 'Переименовать'}
          </div>
          
          <div className="tab-group__colors">
            {TAB_GROUP_COLORS.map(color => (
              <div
                key={color.id}
                className={`tab-group__color-option ${color.id === group.colorId ? 'tab-group__color-option--selected' : ''}`}
                style={{ backgroundColor: color.color }}
                onClick={() => { onChangeColor(color.id); setShowMenu(false); }}
                title={color.name}
              />
            ))}
          </div>
          
          <div className="tab-group__menu-separator" />
          
          <div
            className="tab-group__menu-item"
            onClick={() => { onDelete(); setShowMenu(false); }}
          >
            {t.tabGroups?.ungroup || 'Разгруппировать'}
          </div>
          
          <div
            className="tab-group__menu-item tab-group__menu-item--danger"
            onClick={() => { onCloseAll(); setShowMenu(false); }}
          >
            {t.tabGroups?.closeAll || 'Закрыть все вкладки'}
          </div>
        </div>
      )}
    </>
  );
};
