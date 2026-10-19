import React, { useState, useEffect } from 'react';
import { Cookie, X, Check, Shield } from 'lucide-react';

interface CookieConsentProps {
  onNavigate?: (path: string) => void;
}

export const CookieConsent: React.FC<CookieConsentProps> = ({ onNavigate }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if consent has already been stored
    const consent = localStorage.getItem('quickvero_cookie_consent');
    if (!consent) {
      // Small delay for smooth entry
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('quickvero_cookie_consent', 'accepted');
    setVisible(false);
    window.dispatchEvent(new Event('cookie_consent_updated'));
  };

  const handleEssentialOnly = () => {
    localStorage.setItem('quickvero_cookie_consent', 'essential');
    setVisible(false);
    window.dispatchEvent(new Event('cookie_consent_updated'));
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie Consent Banner"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="p-5 sm:p-6 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
              <Cookie className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Cookie &amp; Privacy Preferences
            </h3>
          </div>
          <button
            onClick={handleEssentialOnly}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
            aria-label="Close cookie consent banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          QuickVero uses cookies and local storage to preserve your settings (like dark mode) and support our free tools via advertising partners (Google AdSense). Your files are always processed in-browser. Learn more in our{' '}
          {onNavigate ? (
            <button
              onClick={() => onNavigate('/privacy-policy')}
              className="text-brand-600 dark:text-brand-400 underline font-semibold hover:text-brand-700"
            >
              Privacy Policy
            </button>
          ) : (
            <a
              href="/privacy-policy"
              className="text-brand-600 dark:text-brand-400 underline font-semibold hover:text-brand-700"
            >
              Privacy Policy
            </a>
          )}
          .
        </p>

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleAcceptAll}
            className="flex-1 py-2 px-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Accept All</span>
          </button>
          <button
            onClick={handleEssentialOnly}
            className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 transition-all"
          >
            Essential Only
          </button>
        </div>
      </div>
    </div>
  );
};
