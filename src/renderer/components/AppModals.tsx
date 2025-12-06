import React from 'react';
import NewTabModal from './Tabs/NewTabModal';
import ImportDialog from './Import/ImportDialog';
import TabSearch from './Tabs/TabSearch';
import { Toast } from './Notifications/Toast';
import { Workspace, HistoryEntry } from '../types';

interface AppModalsProps {
  showNewTabModal: boolean;
  setShowNewTabModal: (show: boolean) => void;
  showImportDialog: boolean;
  setShowImportDialog: React.Dispatch<React.SetStateAction<boolean>>;
  showTabSearch: boolean;
  setShowTabSearch: (show: boolean) => void;
  toastMessage: string | null;
  setToastMessage: (message: string | null) => void;
  recentSearches: string[];
  workspaces: Workspace[];
  activeWorkspaceId: string;
  createNewTab: (query: string) => void;
  handleImportFromBrowser: (
    browser: 'chrome' | 'firefox' | 'edge' | 'zen',
    history: HistoryEntry[],
    setHistory: React.Dispatch<React.SetStateAction<HistoryEntry[]>>,
    setShowImportDialog: React.Dispatch<React.SetStateAction<boolean>>
  ) => Promise<void>;
  history: HistoryEntry[];
  setHistory: React.Dispatch<React.SetStateAction<HistoryEntry[]>>;
  selectTabFromSearch: (workspaceId: string, tabId: string) => void;
}

const AppModals: React.FC<AppModalsProps> = ({
  showNewTabModal,
  setShowNewTabModal,
  showImportDialog,
  setShowImportDialog,
  showTabSearch,
  setShowTabSearch,
  toastMessage,
  setToastMessage,
  recentSearches,
  workspaces,
  activeWorkspaceId,
  createNewTab,
  handleImportFromBrowser,
  history,
  setHistory,
  selectTabFromSearch,
}) => {
  return (
    <>
      {showNewTabModal && (
        <NewTabModal
          recentQueries={recentSearches}
          onSubmit={(q) => {
            createNewTab(q);
            setShowNewTabModal(false);
          }}
          onClose={() => setShowNewTabModal(false)}
        />
      )}
      
      {showImportDialog && (
        <ImportDialog
          onClose={() => setShowImportDialog(false)}
          onImport={(browser) => handleImportFromBrowser(browser, history, setHistory, setShowImportDialog)}
        />
      )}
      
      {showTabSearch && (
        <TabSearch
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspaceId}
          onSelectTab={selectTabFromSearch}
          onClose={() => setShowTabSearch(false)}
        />
      )}
      
      {toastMessage && (
        <Toast
          message={toastMessage}
          type="info"
          onClose={() => setToastMessage(null)}
        />
      )}
    </>
  );
};

export default AppModals;
