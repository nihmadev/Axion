export const GoogleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export const DuckDuckGoIcon = () => (
  <img 
    src="/duckduckgo.svg" 
    alt="DuckDuckGo" 
    width="24" 
    height="24"
    style={{
      display: 'block',
      objectFit: 'contain'
    }}
  />
);

export const BingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 35 50" fill="#fff">
  <path d="M35 24.25l-22.177-7.761 4.338 10.82 6.923 3.225H35V24.25z" opacity=".7"/>
  <path d="M10 38.642V3.5L0 0v44.4L10 50l25-14.382V24.25z"/>
    <defs>
      <linearGradient id="bingGrad" x1="5" y1="3" x2="17" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#37BDFF"/>
        <stop offset="1" stopColor="#12D1E5"/>
      </linearGradient>
    </defs>
  </svg>
);
