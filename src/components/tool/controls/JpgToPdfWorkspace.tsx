import React, { useState, useRef, useEffect } from 'react';
import { 
  Images, 
  Upload, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  FileText, 
  CheckCircle2, 
  Download, 
  RefreshCw, 
  Sparkles, 
  Layers,
  Image as ImageIcon
} from 'lucide-react';
import { convertImagesToPdf } from '../../../services/fileProcessor';
import { formatBytes } from '../../../utils/fileHelpers';
import { ProcessResult } from '../../../types/tool';
import { ProgressBar } from '../ProgressBar';
import { ToastMessage } from '../../common/Toast';
import confetti from 'canvas-confetti';

interface JpgToPdfWorkspaceProps {
  onShowToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

interface ImageItem {
  file: File;
  previewUrl: string;
}

export const JpgToPdfWorkspace: React.FC<JpgToPdfWorkspaceProps> = ({ onShowToast }) => {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [orientation, setOrientation] = useState<'auto' | 'p' | 'l'>('auto');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ProcessResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const appendInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URLs when component unmounts or items change
  useEffect(() => {
    return () => {
      items.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, []);

  const handleFilesAdded = (newFileList: FileList | null) => {
    if (!newFileList || newFileList.length === 0) return;

    const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const validItems: ImageItem[] = [];

    for (let i = 0; i < newFileList.length; i++) {
      const file = newFileList[i];
      const ext = file.name.split('.').pop()?.toLowerCase();
      const isValidExt = ext === 'jpg' || ext === 'jpeg' || ext === 'png' || ext === 'webp';

      if (acceptedTypes.includes(file.type) || isValidExt) {
        validItems.push({
          file,
          previewUrl: URL.createObjectURL(file),
        });
      }
    }

    if (validItems.length === 0) {
      onShowToast({
        type: 'error',
        message: 'Please select valid image files (.jpg, .jpeg, .png, .webp)',
      });
      return;
    }

    setItems((prev) => [...prev, ...validItems]);
    onShowToast({
      type: 'info',
      message: `Added ${validItems.length} image${validItems.length > 1 ? 's' : ''}`,
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFilesAdded(e.dataTransfer.files);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setItems((prev) => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const moveDown = (index: number) => {
    if (index === items.length - 1) return;
    setItems((prev) => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const removeItem = (index: number) => {
    setItems((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const clearAll = () => {
    items.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setItems([]);
  };

  const handleConvert = async () => {
    if (items.length === 0) {
      onShowToast({
        type: 'error',
        message: 'Please add at least 1 image to convert to PDF.',
      });
      return;
    }

    setIsProcessing(true);
    setProgress(5);

    try {
      const files = items.map((it) => it.file);
      const res = await convertImagesToPdf(files, orientation, (p) => setProgress(p));
      setResult(res);
      setIsProcessing(false);

      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.7 },
          colors: ['#3b82f6', '#10b981', '#f59e0b'],
        });
      } catch {}

      onShowToast({
        type: 'success',
        message: `Successfully generated ${items.length}-page PDF document!`,
      });
    } catch (err: any) {
      setIsProcessing(false);
      onShowToast({
        type: 'error',
        message: err.message || 'Failed to convert images to PDF. Please try again.',
      });
    }
  };

  const handleReset = () => {
    if (result?.downloadUrl) {
      URL.revokeObjectURL(result.downloadUrl);
    }
    clearAll();
    setResult(null);
    setProgress(0);
    setIsProcessing(false);
  };

  // If result is ready, show download screen
  if (result) {
    return (
      <div className="p-8 rounded-3xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-card space-y-6 animate-in fade-in duration-200">
        <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-8 h-8 shrink-0" />
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              PDF Document Created Successfully!
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Combined {items.length} {items.length === 1 ? 'image' : 'images'} into a clean {items.length}-page PDF document.
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                {result.filename}
              </p>
              <p className="text-xs text-slate-500">
                Size: {formatBytes(result.processedSize)} &bull; {result.metadata?.totalPages || items.length} Pages
              </p>
            </div>
          </div>

          <a
            href={result.downloadUrl}
            download={result.filename}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-sm bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-500/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF Document</span>
          </a>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Convert More Images</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Drop Area */}
      {items.length === 0 ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-10 sm:p-14 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/40 scale-[1.01]'
              : 'border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40 hover:border-brand-400 hover:bg-brand-50/20'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            onChange={(e) => handleFilesAdded(e.target.files)}
            className="hidden"
          />
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 flex items-center justify-center shadow-sm">
            <Images className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Select JPG, PNG or WebP Images
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Choose a single photo or select multiple images (5, 10, 20+ files) to convert into a multi-page PDF
          </p>
          <div className="mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-500/20 transition-all">
            <Upload className="w-4 h-4" />
            <span>Choose Images from Device</span>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            JPG, PNG, WebP supported &bull; 100% In-browser &bull; Zero server uploads
          </p>
        </div>
      ) : (
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-card space-y-6">
          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Images className="w-5 h-5 text-amber-500" />
                <span>Selected Images ({items.length})</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-semibold border border-brand-200/50">
                  {items.length} {items.length === 1 ? 'Page' : 'Pages'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Rearrange pages with arrows to control the exact sequence in your PDF
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                ref={appendInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                onChange={(e) => handleFilesAdded(e.target.files)}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => appendInputRef.current?.click()}
                disabled={isProcessing}
                className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add More Images</span>
              </button>
              <button
                type="button"
                onClick={clearAll}
                disabled={isProcessing}
                className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            </div>
          </div>

          {/* Files List / Grid */}
          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {items.map((item, idx) => (
              <div
                key={`${item.file.name}-${idx}`}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 gap-3 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>

                  {/* Thumbnail Image */}
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0 border border-slate-200 dark:border-slate-700">
                    <img
                      src={item.previewUrl}
                      alt={item.file.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                      {item.file.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      Page {idx + 1} &bull; {formatBytes(item.file.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => moveUp(idx)}
                    disabled={idx === 0 || isProcessing}
                    title="Move Up"
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors cursor-pointer"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(idx)}
                    disabled={idx === items.length - 1 || isProcessing}
                    title="Move Down"
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors cursor-pointer"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    disabled={isProcessing}
                    title="Remove"
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Settings: Page Orientation */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Page Orientation
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'auto', label: 'Auto (Match Photo)' },
                { id: 'p', label: 'Portrait (A4 Vertical)' },
                { id: 'l', label: 'Landscape (A4 Horizontal)' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setOrientation(item.id as any)}
                  disabled={isProcessing}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    orientation === item.id
                      ? 'border-brand-600 bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Progress */}
          {isProcessing && (
            <div className="pt-2">
              <ProgressBar progress={progress} label={`Assembling ${items.length}-page PDF document...`} />
            </div>
          )}

          {/* Action Button */}
          {!isProcessing && (
            <button
              onClick={handleConvert}
              disabled={items.length === 0}
              className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-bold text-sm bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-500/25 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Sparkles className="w-5 h-5" />
              <span>
                {items.length === 1
                  ? 'Convert 1 Image to PDF Document'
                  : `Convert ${items.length} Images to Single PDF Document (${items.length} Pages)`}
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
