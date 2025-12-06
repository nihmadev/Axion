import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { DownloadFileIcon, FolderIcon, FolderOpenIcon, PauseIcon, CheckIcon } from '../ZenSidebar/icons';
import '../../styles/components/downloads-page.css';

export interface Download {
  id: string;
  filename: string;
  url: string;
  totalBytes: number;
  receivedBytes: number;
  state: 'progressing' | 'completed' | 'cancelled' | 'interrupted';
  startTime: number;
  savePath?: string;
  speed?: number;
  mimeType?: string;
}

interface DownloadsPageProps {
  language: 'ru' | 'en';
}

const DownloadsPage: React.FC<DownloadsPageProps> = ({ language }) => {
  const [downloads, setDownloads] = useState<Download[]>([]);
  const t = useTranslation(language);

  useEffect(() => {
    const loadDownloads = async () => {
      const saved = await window.electronAPI.getDownloads();
      setDownloads(saved);
    };
    loadDownloads();

    const handleDownloadUpdate = (download: Download) => {
      setDownloads(prev => {
        const index = prev.findIndex(d => d.id === download.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = download;
          return updated;
        }
        return [download, ...prev];
      });
    };

    const cleanup = window.electronAPI.onDownloadUpdate(handleDownloadUpdate);
    return () => cleanup();
  }, []);

  const cancelDownload = (id: string) => window.electronAPI.cancelDownload(id);
  const openDownload = (savePath: string) => window.electronAPI.openDownload(savePath);
  const showInFolder = (savePath: string) => window.electronAPI.showDownloadInFolder(savePath);

  const clearCompleted = () => {
    setDownloads(prev => prev.filter(d => d.state === 'progressing'));
    window.electronAPI.clearCompletedDownloads();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="downloads-page">
      <div className="downloads-page-header">
        <h1>{t.common.downloads}</h1>
        <div className="downloads-page-actions">
          <button className="downloads-clear-btn" onClick={clearCompleted}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            {t.common.clearCompleted}
          </button>
        </div>
      </div>

      <div className="downloads-page-content">
        {downloads.length === 0 ? (
          <div className="downloads-empty">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <p>{t.common.downloadsEmpty}</p>
          </div>
        ) : (
          <div className="downloads-list">
            {downloads.map(download => {
              const progress = download.totalBytes > 0 
                ? (download.receivedBytes / download.totalBytes) * 100 
                : 0;
              
              return (
                <div key={download.id} className={`download-page-item download-${download.state}`}>
                  <div className="download-page-icon"><DownloadFileIcon size={20} /></div>
                  <div className="download-page-info">
                    <div className="download-page-filename">{download.filename}</div>
                    <div className="download-page-details">
                      {download.state === 'progressing' && (
                        <>
                          <span>{formatBytes(download.receivedBytes)} / {formatBytes(download.totalBytes)}</span>
                          <div className="download-page-progress">
                            <div className="download-page-progress-fill" style={{ width: `${progress}%` }} />
                          </div>
                        </>
                      )}
                      {download.state === 'completed' && (
                        <span className="download-status-completed"><CheckIcon size={14} /> {t.common.completed} - {formatBytes(download.totalBytes)}</span>
                      )}
                      {download.state === 'cancelled' && <span className="download-status-cancelled">{t.common.cancelled}</span>}
                      {download.state === 'interrupted' && <span className="download-status-interrupted">{t.common.interrupted}</span>}
                    </div>
                  </div>
                  <div className="download-page-controls">
                    {download.state === 'progressing' && (
                      <button onClick={() => cancelDownload(download.id)} title={t.common.cancel}><PauseIcon size={16} /></button>
                    )}
                    {download.state === 'completed' && download.savePath && (
                      <>
                        <button onClick={() => openDownload(download.savePath!)} title={t.common.open}><FolderOpenIcon size={16} /></button>
                        <button onClick={() => showInFolder(download.savePath!)} title={t.common.showInFolder}><FolderIcon size={16} /></button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DownloadsPage;
