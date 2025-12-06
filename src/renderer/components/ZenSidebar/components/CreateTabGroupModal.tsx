import React, { useState, useRef, useEffect } from 'react';
import { TAB_GROUP_COLORS, TabGroupColorId } from '../../../types';
import { useTranslation } from '../../../hooks/useTranslation';

interface CreateTabGroupModalProps {
  onClose: () => void;
  onCreate: (name: string, colorId: TabGroupColorId) => void;
  language: 'ru' | 'en' | 'es' | 'fr' | 'de' | 'zh-CN';
}

export const CreateTabGroupModal: React.FC<CreateTabGroupModalProps> = ({
  onClose,
  onCreate,
  language,
}) => {
  const t = useTranslation(language);
  const [name, setName] = useState('');
  const [colorId, setColorId] = useState<TabGroupColorId>('blue');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleCreate = () => {
    if (name.trim()) {
      onCreate(name.trim(), colorId);
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && name.trim()) {
      handleCreate();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <>
      <div className="tab-group-modal__overlay" onClick={onClose} />
      <div className="tab-group-modal">
        <div className="tab-group-modal__title">
          {t.tabGroups.createGroup}
        </div>
        
        <input
          ref={inputRef}
          className="tab-group-modal__input"
          placeholder={t.tabGroups.groupName}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        
        <div className="tab-group-modal__colors">
          {TAB_GROUP_COLORS.map(color => (
            <div
              key={color.id}
              className={`tab-group-modal__color ${color.id === colorId ? 'tab-group-modal__color--selected' : ''}`}
              style={{ backgroundColor: color.color }}
              onClick={() => setColorId(color.id)}
              title={color.name}
            />
          ))}
        </div>
        
        <div className="tab-group-modal__actions">
          <button
            className="tab-group-modal__btn tab-group-modal__btn--cancel"
            onClick={onClose}
          >
            {t.common.cancel}
          </button>
          <button
            className="tab-group-modal__btn tab-group-modal__btn--create"
            onClick={handleCreate}
            disabled={!name.trim()}
          >
            {t.tabGroups.createGroup}
          </button>
        </div>
      </div>
    </>
  );
};
