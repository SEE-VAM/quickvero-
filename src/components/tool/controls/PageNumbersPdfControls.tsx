import React, { useState } from 'react';
import { Hash, Sparkles, Layout } from 'lucide-react';

interface PageNumbersPdfControlsProps {
  onAddPageNumbers: (options: {
    position: 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-right' | 'top-center';
    format: 'Page X of Y' | 'X of Y' | 'Page X' | 'X';
    fontSize: number;
    margin: number;
  }) => void;
  isProcessing: boolean;
}

export const PageNumbersPdfControls: React.FC<PageNumbersPdfControlsProps> = ({
  onAddPageNumbers,
  isProcessing,
}) => {
  const [position, setPosition] = useState<'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-right' | 'top-center'>('bottom-center');
  const [format, setFormat] = useState<'Page X of Y' | 'X of Y' | 'Page X' | 'X'>('Page X of Y');
  const [fontSize, setFontSize] = useState<number>(11);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddPageNumbers({
      position,
      format,
      fontSize,
      margin: 24,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-subtle space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white">
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-sky-500" />
          <span>Add Page Numbers to PDF</span>
        </div>
        <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
          Clean Pagination
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Page Number Position
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'bottom-center', label: 'Bottom Center' },
              { id: 'bottom-right', label: 'Bottom Right' },
              { id: 'bottom-left', label: 'Bottom Left' },
              { id: 'top-center', label: 'Top Center' },
              { id: 'top-right', label: 'Top Right' },
            ].map((pos) => (
              <button
                key={pos.id}
                type="button"
                onClick={() => setPosition(pos.id as any)}
                className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                  position === pos.id
                    ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 ring-2 ring-sky-500/20'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {pos.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Numbering Style
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
            >
              <option value="Page X of Y">Page 1 of 12 (Recommended)</option>
              <option value="X of Y">1 of 12</option>
              <option value="Page X">Page 1</option>
              <option value="X">1</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              <span>Font Size</span>
              <span>{fontSize}pt</span>
            </div>
            <input
              type="range"
              min="8"
              max="16"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full accent-sky-600 cursor-pointer"
            />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-400">
          Page numbers are automatically rendered on every page of your PDF without modifying existing text or margins.
        </div>
      </div>

      <button
        type="submit"
        disabled={isProcessing}
        className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-sm bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-500/20 disabled:opacity-50 transition-all cursor-pointer"
      >
        <Sparkles className="w-4 h-4" />
        <span>Add Page Numbers & Download</span>
      </button>
    </form>
  );
};
