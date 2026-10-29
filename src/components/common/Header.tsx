import React, { useState } from 'react';
import { Search, Sun, Moon, Menu, X } from 'lucide-react';
import { HEADER_NAV_ITEMS } from '../../data/navigation';
import { Theme } from '../../types/theme';

interface HeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenSearch: () => void;
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPath,
  onNavigate,
  onOpenSearch,
  resolvedTheme,
  onToggleTheme,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLinkClick = (href: string) => {
    onNavigate(href);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 dark:bg-surface-darker/80 border-b border-slate-200/80 dark:border-slate-800 transition-colors duration-200">
      <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 lg:gap-4">
        {/* Brand Logo */}
        <button
          onClick={() => handleLinkClick('/')}
          className="flex items-center gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg py-1 px-1 shrink-0"
          aria-label="QuickVero Homepage"
        >
          <img
            src="/logo.png"
            alt="QuickVero Logo"
            className="w-9 h-9 object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-150"
          />
          <div className="flex flex-col text-left">
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              QuickVero
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                PRO
              </span>
            </span>
          </div>
        </button>

        {/* Desktop Navigation - Always in a single clean horizontal line without wrapping */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-1.5 shrink-0 overflow-x-auto no-scrollbar">
          {HEADER_NAV_ITEMS.map((item) => {
            const isActive = currentPath === item.href;
            return (
              <button
                key={item.href}
                onClick={() => handleLinkClick(item.href)}
                className={`whitespace-nowrap shrink-0 px-2.5 xl:px-3 py-1.5 text-xs xl:text-sm font-medium rounded-lg transition-colors duration-150 ${
                  isActive
                    ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/50'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                {item.label}
              </button>
            );
          })}

          {/* Sarkari Tools Direct Link */}
          <a
            href="https://sarkariframe.quickvero.in"
            target="_blank"
            rel="noopener noreferrer"
            className="whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60 transition-colors cursor-pointer ml-1"
            title="Sarkari Photo & Signature Resizer for SSC, UPSC & Govt Exams"
          >
            <span>🇮🇳 Sarkari Tools</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
          </a>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Search Button */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors duration-150"
            aria-label="Search tools"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded shadow-xs">
              Ctrl K
            </kbd>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors focus:outline-none"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-surface-darker/95 backdrop-blur-lg px-4 pt-2 pb-4 space-y-1">
          {HEADER_NAV_ITEMS.map((item) => (
            <button
              key={item.href}
              onClick={() => handleLinkClick(item.href)}
              className={`block w-full text-left px-3 py-2 text-base font-medium rounded-lg ${
                currentPath === item.href
                  ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/50'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}

          <a
            href="https://sarkariframe.quickvero.in"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold rounded-lg bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40 my-1 transition-colors"
          >
            <span className="flex items-center gap-2">
              <span>🇮🇳</span>
              <span>Sarkari Exam Tools</span>
            </span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
              Free
            </span>
          </a>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => {
                onOpenSearch();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm font-medium"
            >
              <Search className="w-4 h-4" />
              Quick Tool Search (Ctrl+K)
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
