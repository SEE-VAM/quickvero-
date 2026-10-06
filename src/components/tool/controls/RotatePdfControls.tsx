import React, { useState } from 'react';
import { RotateCw, RotateCcw, RefreshCw, Sparkles, HelpCircle } from 'lucide-react';

interface RotatePdfControlsProps {
  onRotate: (options: { angle: number; allPages?: boolean }) => void;
  isProcessing: boolean;
}

export const RotatePdfControls: React.FC<RotatePdfControlsProps> = ({ onRotate, isProcessing }) => {
  const [angle, setAngle] = useState<number>(90);

  return (
    <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-subtle space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white">
        <div className="flex items-center gap-2">
          <RotateCw className="w-4 h-4 text-brand-500" />
          <span>Rotate PDF Document</span>
        </div>
        <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
          Client-side • Instant
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Select Rotation Angle
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setAngle(90)}
              className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border text-sm font-semibold transition-all ${
                angle === 90
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 ring-2 ring-brand-500/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
              }`}
            >
              <RotateCw className="w-5 h-5 text-brand-500" />
              <span>90° Right</span>
              <span className="text-[11px] font-normal text-slate-500">Clockwise</span>
            </button>

            <button
              type="button"
              onClick={() => setAngle(180)}
              className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border text-sm font-semibold transition-all ${
                angle === 180
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 ring-2 ring-brand-500/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
              }`}
            >
              <RefreshCw className="w-5 h-5 text-brand-500" />
              <span>180° Flip</span>
              <span className="text-[11px] font-normal text-slate-500">Upside down</span>
            </button>

            <button
              type="button"
              onClick={() => setAngle(270)}
              className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border text-sm font-semibold transition-all ${
                angle === 270
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 ring-2 ring-brand-500/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
              }`}
            >
              <RotateCcw className="w-5 h-5 text-brand-500" />
              <span>90° Left</span>
              <span className="text-[11px] font-normal text-slate-500">270° Counter</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-1">
          <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Rotates all pages in the document permanently without degrading text or image quality.</span>
        </p>
      </div>

      <button
        type="button"
        onClick={() => onRotate({ angle, allPages: true })}
        disabled={isProcessing}
        className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-sm bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-500/20 disabled:opacity-50 transition-all cursor-pointer"
      >
        <Sparkles className="w-4 h-4" />
        <span>Rotate PDF & Download</span>
      </button>
    </div>
  );
};
