import React from 'react';

interface UpdateBannerProps {
  updateAvailable: boolean;
  updateDownloaded: boolean;
}

const UpdateBanner: React.FC<UpdateBannerProps> = ({ updateAvailable, updateDownloaded }) => {
  if (updateDownloaded) {
    return (
      <div 
        className="update-banner update-ready" 
        onClick={() => window.electronAPI.installUpdate()} 
      />
    );
  }

  if (updateAvailable) {
    return <div className="update-banner" />;
  }

  return null;
};

export default UpdateBanner;
