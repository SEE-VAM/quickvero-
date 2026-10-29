import React from 'react';
import { FOOTER_LINKS } from '../../data/navigation';
import { ShieldCheck, Heart, ArrowUpRight, Instagram } from 'lucide-react';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-surface-dark transition-colors duration-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Col */}
          <div className="col-span-2 lg:col-span-2 space-y-4">
            <button
              onClick={() => onNavigate('/')}
              className="flex items-center gap-2.5 group text-left focus:outline-none"
            >
              <img
                src="/logo.png"
                alt="QuickVero Logo"
                className="w-8 h-8 object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-150"
              />
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                QuickVero
              </span>
            </button>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed">
              Powerful online tools for everyday file tasks. Compress images, convert formats, and optimize documents securely in your browser.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800 max-w-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Privacy First: Files processed locally in your browser when supported.</span>
            </div>

            {/* Official Instagram Badge */}
            <div className="pt-1">
              <a
                href="https://www.instagram.com/quickvero.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-amber-500/10 border border-pink-500/20 text-slate-800 dark:text-slate-200 hover:border-pink-500/40 hover:scale-[1.02] transition-all text-xs font-semibold group"
                aria-label="Follow QuickVero on Instagram"
              >
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                  <Instagram className="w-3.5 h-3.5" />
                </div>
                <span>Follow <strong className="text-pink-600 dark:text-pink-400">@quickvero.in</strong> on Instagram</span>
              </a>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-200 uppercase tracking-wider mb-4">
              Categories
            </h3>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.tools.map((item) => (
                <li key={item.href}>
                  <button
                    onClick={() => onNavigate(item.href)}
                    className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Popular Tools */}
          <div>
            <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-200 uppercase tracking-wider mb-4">
              Popular Tools
            </h3>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.popular.map((item) => (
                <li key={item.href}>
                  {item.href.startsWith('http') ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 transition-colors inline-flex items-center gap-1"
                    >
                      <span>{item.label}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <button
                      onClick={() => onNavigate(item.href)}
                      className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
                    >
                      {item.label}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Company & Legal */}
          <div>
            <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-200 uppercase tracking-wider mb-4">
              Company & Legal
            </h3>
            <ul className="space-y-2.5">
              {[...FOOTER_LINKS.company, ...FOOTER_LINKS.legal].map((item) => (
                <li key={item.href}>
                  {item.href.startsWith('http') ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-pink-600 hover:text-pink-700 dark:text-pink-400 transition-colors inline-flex items-center gap-1"
                    >
                      <span>{item.label}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <button
                      onClick={() => onNavigate(item.href)}
                      className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
                    >
                      {item.label}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>© 2026 QuickVero. All rights reserved. Built for speed and privacy.</p>
          <div className="flex items-center gap-6">
            <button onClick={() => onNavigate('/privacy-policy')} className="hover:text-slate-900 dark:hover:text-slate-200">
              Privacy Policy
            </button>
            <button onClick={() => onNavigate('/terms')} className="hover:text-slate-900 dark:hover:text-slate-200">
              Terms of Service
            </button>
            <button onClick={() => onNavigate('/disclaimer')} className="hover:text-slate-900 dark:hover:text-slate-200">
              Disclaimer
            </button>
            <a
              href="https://www.instagram.com/quickvero.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-pink-600 dark:hover:text-pink-400 flex items-center gap-1.5 transition-colors font-medium text-slate-600 dark:text-slate-300"
            >
              <Instagram className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400" />
              <span>@quickvero.in</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
