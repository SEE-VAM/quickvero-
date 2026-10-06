import React, { useState } from 'react';
import { Stamp, Sparkles, Sliders, Type } from 'lucide-react';

interface WatermarkPdfControlsProps {
  onWatermark: (options: {
    text: string;
    fontSize: number;
    opacity: number;
    rotation: number;
    color: string;
  }) => void;
  isProcessing: boolean;
}

export const WatermarkPdfControls: React.FC<WatermarkPdfControlsProps> = ({
  onWatermark,
  isProcessing,
}) => {
  const [text, setText] = useState('CONFIDENTIAL');
  const [fontSize, setFontSize] = useState<number>(48);
  const [opacity, setOpacity] = useState<number>(35);
  const [rotation, setRotation] = useState<number>(45);
  const [color, setColor] = useState('#ef4444');

  const presets = ['CONFIDENTIAL', 'SAMPLE', 'DO NOT COPY', 'DRAFT', 'APPROVED'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onWatermark({
      text: text.trim(),
      fontSize,
      opacity: opacity / 100,
      rotation,
      color,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-subtle space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white">
        <div className="flex items-center gap-2">
          <Stamp className="w-4 h-4 text-violet-500" />
          <span>Add Watermark to PDF</span>
        </div>
        <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
          Vector Stamp • All Pages
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Watermark Text
          </label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. CONFIDENTIAL, DRAFT, SAMPLE"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {presets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setText(preset)}
                className="py-1 px-2.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              <span>Font Size</span>
              <span>{fontSize}px</span>
            </div>
            <input
              type="range"
              min="20"
              max="90"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full accent-violet-600 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              <span>Opacity</span>
              <span>{opacity}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="90"
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="w-full accent-violet-600 cursor-pointer"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Rotation Angle
            </label>
            <select
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
            >
              <option value={45}>45° Diagonal (Standard)</option>
              <option value={0}>0° Horizontal</option>
              <option value={90}>90° Vertical</option>
              <option value={-45}>-45° Inverted Diagonal</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Stamp Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer bg-white"
              />
              <span className="text-xs font-mono text-slate-600 dark:text-slate-400">{color}</span>
            </div>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isProcessing || !text.trim()}
        className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-sm bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/20 disabled:opacity-50 transition-all cursor-pointer"
      >
        <Sparkles className="w-4 h-4" />
        <span>Apply Watermark & Download</span>
      </button>
    </form>
  );
};
