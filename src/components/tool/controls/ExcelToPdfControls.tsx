import React from 'react';
import { Table, Sparkles, Info } from 'lucide-react';

interface ExcelToPdfControlsProps {
  onConvert: () => void;
  isProcessing: boolean;
}

export const ExcelToPdfControls: React.FC<ExcelToPdfControlsProps> = ({ onConvert, isProcessing }) => {
  return (
    <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-subtle space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white">
        <Table className="w-4 h-4 text-emerald-600" />
        <span>Excel to PDF Conversion</span>
      </div>

      <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
        <Info className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-emerald-700 dark:text-emerald-300 space-y-1">
          <p className="font-semibold">Supported: .xlsx and .xls files</p>
          <p>All sheets are converted to table format and packed into a clean PDF. Your spreadsheet data never leaves your device — 100% private, in-browser processing.</p>
        </div>
      </div>

      <button
        onClick={onConvert}
        disabled={isProcessing}
        className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all cursor-pointer"
      >
        <Sparkles className="w-4 h-4" />
        <span>Convert Excel to PDF</span>
      </button>
    </div>
  );
};
