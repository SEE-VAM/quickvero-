import React, { useState } from 'react';
import { Unlock, Eye, EyeOff, Sparkles, KeyRound, AlertCircle } from 'lucide-react';

interface UnlockPdfControlsProps {
  onUnlock: (options: { password?: string }) => void;
  isProcessing: boolean;
}

export const UnlockPdfControls: React.FC<UnlockPdfControlsProps> = ({ onUnlock, isProcessing }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUnlock({ password });
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-subtle space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white">
        <div className="flex items-center gap-2">
          <Unlock className="w-4 h-4 text-amber-500" />
          <span>Unlock & Decrypt PDF</span>
        </div>
        <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
          Remove Password
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            PDF Password (if known)
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password to unlock restrictions..."
              className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <KeyRound className="w-3.5 h-3.5" />
            <span>Enter the password to remove encryption and save a completely unlocked, open PDF.</span>
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300">
          After unlocking, you can freely view, print, edit, and share this PDF without ever entering the password again.
        </div>
      </div>

      <button
        type="submit"
        disabled={isProcessing}
        className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-sm bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all cursor-pointer"
      >
        <Sparkles className="w-4 h-4" />
        <span>Unlock PDF & Download</span>
      </button>
    </form>
  );
};
