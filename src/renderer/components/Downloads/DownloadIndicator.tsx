import React, { useState, useEffect, useRef } from 'react';
import {
  ImageFileIcon,
  VideoFileIcon,
  AudioFileIcon,
  DocumentFileIcon,
  ArchiveFileIcon,
  ExecutableFileIcon,
  CodeFileIcon,
  SpreadsheetFileIcon,
  PresentationFileIcon,
  DownloadFileIcon,
} from '../ZenSidebar/icons';
import '../../styles/components/download-indicator.css';

export interface ActiveDownload {
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

interface DownloadIndicatorProps {
  language?: 'ru' | 'en' | 'fr' | 'de' | 'es'
}

const DownloadIndicator: React.FC<DownloadIndicatorProps> = () => {
  const [downloads, setDownloads] = useState<ActiveDownload[]>([]);
  const [animatingDownload, setAnimatingDownload] = useState<ActiveDownload | null>(null);
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'flying' | 'landing'>('idle');
  const indicatorRef = useRef<HTMLDivElement>(null);

  
  useEffect(() => {
    const loadDownloads = async () => {
      try {
        const saved = await window.electronAPI.getDownloads() as ActiveDownload[];
        
        const recent = saved.filter(d => 
          d.state === 'progressing' || 
          (d.state === 'completed' && Date.now() - d.startTime < 60000)
        );
        setDownloads(recent);
      } catch (e) {
        console.error('Failed to load downloads:', e);
      }
    };
    loadDownloads();
  }, []);

  
  useEffect(() => {
    const handleDownloadStarted = (download: ActiveDownload) => {
      setDownloads(prev => {
        const exists = prev.find(d => d.id === download.id);
        if (exists) return prev;
        return [download, ...prev];
      });
      
      
      setAnimatingDownload(download);
      setAnimationPhase('flying');
      
      
      setTimeout(() => {
        setAnimationPhase('landing');
        setTimeout(() => {
          setAnimatingDownload(null);
          setAnimationPhase('idle');
        }, 300);
      }, 800);
    };

    const handleDownloadUpdate = (update: Partial<ActiveDownload> & { id: string }) => {
      setDownloads(prev => {
        const index = prev.findIndex(d => d.id === update.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = { ...updated[index], ...update };
          return updated;
        }
        return prev;
      });
    };

    const handleDownloadCompleted = (download: ActiveDownload) => {
      setDownloads(prev => {
        const index = prev.findIndex(d => d.id === download.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = { ...updated[index], ...download, state: 'completed' };
          return updated;
        }
        return prev;
      });
      
      
      setTimeout(() => {
        setDownloads(prev => prev.filter(d => d.id !== download.id || d.state === 'progressing'));
      }, 5000);
    };

    
    const handleDownloadProgress = handleDownloadUpdate;

    const cleanup1 = window.electronAPI.onDownloadStarted(handleDownloadStarted);
    const cleanup2 = window.electronAPI.onDownloadUpdate(handleDownloadUpdate);
    const cleanup3 = window.electronAPI.onDownloadCompleted(handleDownloadCompleted);
    const cleanup4 = window.electronAPI.onDownloadProgress(handleDownloadProgress);

    return () => {
      cleanup1();
      cleanup2();
      cleanup3();
      cleanup4();
    };
  }, []);

  const activeDownloads = downloads.filter(d => d.state === 'progressing');
  const completedDownloads = downloads.filter(d => d.state === 'completed');
  
  const totalProgress = activeDownloads.length > 0
    ? activeDownloads.reduce((acc, d) => {
        if (d.totalBytes > 0) {
          return acc + (d.receivedBytes / d.totalBytes);
        }
        return acc;
      }, 0) / activeDownloads.length * 100
    : 0;

  
  const getFileIcon = (filename: string, mimeType?: string): React.ReactNode => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    
    
    if (mimeType) {
      if (mimeType.startsWith('image/')) return <ImageFileIcon size={20} />;
      if (mimeType.startsWith('video/')) return <VideoFileIcon size={20} />;
      if (mimeType.startsWith('audio/')) return <AudioFileIcon size={20} />;
      if (mimeType.includes('pdf')) return <DocumentFileIcon size={20} />;
      if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return <ArchiveFileIcon size={20} />;
      if (mimeType.includes('executable') || mimeType.includes('x-msdownload')) return <ExecutableFileIcon size={20} />;
    }
    
    
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
    const videoExts = ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'webm'];
    const audioExts = ['mp3', 'wav', 'flac', 'ogg', 'm4a', 'aac'];
    const docExts = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'md'];
    const spreadsheetExts = ['xls', 'xlsx'];
    const presentationExts = ['ppt', 'pptx'];
    const archiveExts = ['zip', 'rar', '7z', 'tar', 'gz'];
    const executableExts = ['exe', 'msi', 'dmg', 'deb', 'rpm'];
    const codeExts = ['js', 'ts', 'py', 'java', 'cpp', 'c', 'html', 'css'];
    
    if (imageExts.includes(ext)) return <ImageFileIcon size={20} />;
    if (videoExts.includes(ext)) return <VideoFileIcon size={20} />;
    if (audioExts.includes(ext)) return <AudioFileIcon size={20} />;
    if (docExts.includes(ext)) return <DocumentFileIcon size={20} />;
    if (spreadsheetExts.includes(ext)) return <SpreadsheetFileIcon size={20} />;
    if (presentationExts.includes(ext)) return <PresentationFileIcon size={20} />;
    if (archiveExts.includes(ext)) return <ArchiveFileIcon size={20} />;
    if (executableExts.includes(ext)) return <ExecutableFileIcon size={20} />;
    if (codeExts.includes(ext)) return <CodeFileIcon size={20} />;
    
    return <DownloadFileIcon size={20} />;
  };

  
  const showIndicator = true;

  return (
    <>
      {}
      {animatingDownload && animationPhase !== 'idle' && (
        <div 
          className={`download-flying-icon ${animationPhase}`}
          style={{
            '--target-x': indicatorRef.current 
              ? `${indicatorRef.current.getBoundingClientRect().left + 20}px` 
              : '50px',
            '--target-y': indicatorRef.current 
              ? `${indicatorRef.current.getBoundingClientRect().top + 20}px` 
              : '50px',
          } as React.CSSProperties}
        >
          <div className="flying-icon-content">
            {getFileIcon(animatingDownload.filename, animatingDownload.mimeType)}
          </div>
          <div className="flying-icon-trail"></div>
        </div>
      )}

      {}
      {showIndicator && (
        <div 
          ref={indicatorRef}
          className={`download-indicator ${activeDownloads.length > 0 ? 'has-active' : ''} ${animationPhase === 'landing' ? 'pulse' : ''}`}
        >
          <div className="download-indicator-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            
            {}
            {activeDownloads.length > 0 && (
              <svg className="download-progress-ring" viewBox="0 0 36 36">
                <circle
                  className="progress-ring-bg"
                  cx="18" cy="18" r="16"
                  fill="none"
                  strokeWidth="3"
                />
                <circle
                  className="progress-ring-fill"
                  cx="18" cy="18" r="16"
                  fill="none"
                  strokeWidth="3"
                  strokeDasharray={`${totalProgress} 100`}
                  transform="rotate(-90 18 18)"
                />
              </svg>
            )}
          </div>
          
          {}
          {activeDownloads.length > 0 && (
            <span className="download-count">{activeDownloads.length}</span>
          )}
          
          {}
          {completedDownloads.length > 0 && activeDownloads.length === 0 && (
            <span className="download-complete-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </span>
          )}
        </div>
      )}
    </>
  );
};

export default DownloadIndicator;
