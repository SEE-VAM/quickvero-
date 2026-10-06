import React from 'react';
import { ArrowRight } from 'lucide-react';
import { ToolDefinition } from '../../types/tool';
import { DynamicIcon } from './DynamicIcon';
import { getToolTheme } from '../../utils/toolColors';

interface ToolCardProps {
  tool: ToolDefinition;
  onSelect: (tool: ToolDefinition) => void;
}

export const ToolCard: React.FC<ToolCardProps> = ({
  tool,
  onSelect,
}) => {
  const theme = getToolTheme(tool.id, tool.category);

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-surface-cardDark p-5 sm:p-6 shadow-subtle hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5">
      <div>
        {/* Header row: colorful icon */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className={`w-12 h-12 rounded-2xl ${theme.bg} ${theme.text} ${theme.border} border flex items-center justify-center group-hover:scale-110 shadow-xs transition-all duration-200`}>
            <DynamicIcon name={tool.icon} className="w-6 h-6" />
          </div>
        </div>

        {/* Name & description */}
        <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight mb-1.5">
          {tool.name}
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-6">
          {tool.shortDescription}
        </p>
      </div>

      {/* CTA Button */}
      <button
        onClick={() => onSelect(tool)}
        className="w-full inline-flex items-center justify-between px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium bg-slate-100 hover:bg-brand-600 text-slate-800 hover:text-white dark:bg-slate-800 dark:hover:bg-brand-600 dark:text-slate-200 dark:hover:text-white transition-colors duration-150 group/btn"
      >
        <span>Use Tool</span>
        <ArrowRight className="w-3.5 h-3.5 transform group-hover/btn:translate-x-1 transition-transform" />
      </button>
    </div>
  );
};
