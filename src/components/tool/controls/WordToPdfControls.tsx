import React from 'react';
import { FileText, Sparkles, Info } from 'lucide-react';

interface WordToPdfControlsProps {
  onConvert: () => void;
  isProcessing: boolean;
}

export const WordToPdfControls: React.FC<WordToPdfControlsProps> = ({ onConvert, isProcessing }) => {
  return (
    <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-subtle space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white">
        <FileText className="w-4 h-4 text-blue-600" />
        <span>Word to PDF Conversion</span>
      </div>

      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
        <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
          <p className="font-semibold">Supported: .docx files</p>
          <p>Your document is rendered 100% locally in your browser — it is never uploaded to any server. Text, headings, tables, and basic formatting are preserved.</p>
        </div>
      </div>

      <button
        onClick={onConvert}
        disabled={isProcessing}
        className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer"
      >
        <Sparkles className="w-4 h-4" />
        <span>Convert Word to PDF</span>
      </button>
    </div>
  );
};
