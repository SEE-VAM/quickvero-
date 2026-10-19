import React, { useEffect, useRef } from 'react';

interface AdBannerProps {
  format?: 'leaderboard' | 'rectangle' | 'responsive';
  slot?: string;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle?: any[];
  }
}

export const AdBanner: React.FC<AdBannerProps> = ({ 
  format = 'responsive', 
  slot = '1234567890',
  className = '' 
}) => {
  const adRef = useRef<HTMLModElement>(null);
  const isLoaded = useRef(false);

  // Checks for environment variable or configured ID
  const clientId = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_ADSENSE_CLIENT_ID) 
    ? (import.meta as any).env.VITE_ADSENSE_CLIENT_ID 
    : 'ca-pub-8043431725904194';

  const isRealSlot = Boolean(slot && slot !== '1234567890');
  const isConfigured = Boolean(clientId && !clientId.includes('XXXX') && isRealSlot);

  // Never allow ads on /menu or tool canvases without content
  const isExcludedRoute = typeof window !== 'undefined' && (
    window.location.pathname.startsWith('/menu') ||
    window.location.pathname.includes('/menu/')
  );

  useEffect(() => {
    if (isConfigured && !isLoaded.current && typeof window !== 'undefined' && !isExcludedRoute) {
      // Ensure AdSense script is loaded dynamically on content routes
      const scriptId = 'google-adsense-script';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
        script.async = true;
        script.crossOrigin = 'anonymous';
        document.head.appendChild(script);
      }

      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        isLoaded.current = true;
      } catch (e) {
        console.warn('AdSense slot initialization:', e);
      }
    }
  }, [isConfigured, clientId, isExcludedRoute]);

  // If no dedicated ad unit slot is configured or route is excluded, return null to avoid empty ad containers
  if (!isConfigured || isExcludedRoute) {
    return null;
  }

  return (
    <aside
      aria-label="Advertisement"
      className={`relative overflow-hidden rounded-2xl border border-dashed border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30 p-3 text-center my-4 ${className}`}
    >
      <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 flex items-center justify-center gap-1.5">
        <span>Advertisement</span>
        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
        <span className="text-[9px] text-slate-400 font-normal">Google AdSense Partner</span>
      </div>

      <div className="flex items-center justify-center min-h-[90px] w-full overflow-hidden">
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: 'block', width: '100%', minHeight: '90px' }}
          data-ad-client={clientId}
          data-ad-slot={slot}
          data-ad-format={format === 'leaderboard' ? 'horizontal' : format === 'rectangle' ? 'rectangle' : 'auto'}
          data-full-width-responsive="true"
        />
      </div>
    </aside>
  );
};

