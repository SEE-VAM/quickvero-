import React, { useState } from 'react';
import { Archive, Sparkles, FolderArchive, ShieldCheck, FileCheck } from 'lucide-react';

interface ZipCreatorControlsProps {
  onProcess: (options: { archiveName: string; compression: 'DEFLATE' | 'STORE' }) => void;
  isProcessing: boolean;
  selectedFile?: File;
}

export const ZipCreatorControls: React.FC<ZipCreatorControlsProps> = ({
  onProcess,
  isProcessing,
  selectedFile,
}) => {
  const defaultName = selectedFile ? selectedFile.name.replace(/\.[^/.]+$/, '') : 'archive';
  const [archiveName, setArchiveName] = useState(defaultName);
  const [compression, setCompression] = useState<'DEFLATE' | 'STORE'>('DEFLATE');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onProcess({
      archiveName: archiveName.trim() || 'archive',
      compression,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-subtle space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white">
        <FolderArchive className="w-4 h-4 text-brand-600" />
        <span>ZIP Archive Settings</span>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Output Archive Name
          </label>
          <div className="relative">
            <input
              type="text"
              value={archiveName}
              onChange={(e) => setArchiveName(e.target.value)}
              placeholder="archive"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono pr-14"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
              .zip
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Compression Method
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setCompression('DEFLATE')}
              className={`p-3 rounded-xl border text-left transition-all ${
                compression === 'DEFLATE'
                  ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 text-brand-950 dark:text-brand-200 ring-1 ring-brand-500'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              <div className="font-semibold text-xs flex items-center justify-between">
                <span>Deflate (Recommended)</span>
                {compression === 'DEFLATE' && <FileCheck className="w-3.5 h-3.5 text-brand-600" />}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Standard ZIP compression for smaller file size.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setCompression('STORE')}
              className={`p-3 rounded-xl border text-left transition-all ${
                compression === 'STORE'
                  ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 text-brand-950 dark:text-brand-200 ring-1 ring-brand-500'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              <div className="font-semibold text-xs flex items-center justify-between">
                <span>Store (Uncompressed)</span>
                {compression === 'STORE' && <FileCheck className="w-3.5 h-3.5 text-brand-600" />}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Faster bundling without compression re-encoding.
              </p>
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <span>100% In-Browser Execution. Your files are packaged locally in memory and never uploaded to any server.</span>
      </div>

      <button
        type="submit"
        disabled={isProcessing}
        className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-sm bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-500/20 disabled:opacity-50 transition-all cursor-pointer"
      >
        <Archive className="w-4 h-4" />
        <span>Create &amp; Download ZIP Archive</span>
      </button>
    </form>
  );
};
