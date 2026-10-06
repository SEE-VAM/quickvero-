import React, { useState, useEffect } from 'react';
import { Trash2, FileText, Sparkles, HelpCircle, AlertCircle } from 'lucide-react';
import { getPdfPageCount } from '../../../services/pdfProcessor';

interface RemovePdfPagesControlsProps {
  file: File;
  onRemovePages: (options: { pagesToRemove: string }) => void;
  isProcessing: boolean;
}

export const RemovePdfPagesControls: React.FC<RemovePdfPagesControlsProps> = ({
  file,
  onRemovePages,
  isProcessing,
}) => {
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [pagesToRemove, setPagesToRemove] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    getPdfPageCount(file).then((count) => {
      if (isMounted) {
        setTotalPages(count);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [file]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pagesToRemove.trim()) {
      setError('Please specify at least one page number to remove');
      return;
    }
    setError(null);
    onRemovePages({ pagesToRemove: pagesToRemove.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-subtle space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white">
        <div className="flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-rose-500" />
          <span>Remove Pages from PDF</span>
        </div>
        {totalPages !== null && (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            {totalPages} Total {totalPages === 1 ? 'Page' : 'Pages'}
          </span>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Page Numbers to Delete
          </label>
          <div className="relative">
            <input
              type="text"
              value={pagesToRemove}
              onChange={(e) => {
                setPagesToRemove(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. 1, 3, 5-7"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Enter single pages or ranges separated by commas (e.g. "1", "2, 4", "5-8").</span>
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {totalPages !== null && totalPages > 1 && (
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="text-xs text-slate-500 self-center mr-1">Quick Select:</span>
            <button
              type="button"
              onClick={() => setPagesToRemove('1')}
              className="py-1 px-2.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
            >
              Delete First Page (1)
            </button>
            <button
              type="button"
              onClick={() => setPagesToRemove(`${totalPages}`)}
              className="py-1 px-2.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
            >
              Delete Last Page ({totalPages})
            </button>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isProcessing || !pagesToRemove.trim()}
        className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-sm bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20 disabled:opacity-50 transition-all cursor-pointer"
      >
        <Sparkles className="w-4 h-4" />
        <span>Remove Pages & Download</span>
      </button>
    </form>
  );
};
