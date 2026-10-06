import React from 'react';
import { ChevronRight } from 'lucide-react';
import { ToolDefinition } from '../../types/tool';
import { DynamicIcon } from '../common/DynamicIcon';
import { getToolTheme } from '../../utils/toolColors';

interface ToolHeaderProps {
  tool: ToolDefinition;
  onNavigate: (path: string) => void;
}

export const ToolHeader: React.FC<ToolHeaderProps> = ({
  tool,
  onNavigate,
}) => {
  const theme = getToolTheme(tool.id, tool.category);

  return (
    <div className="mb-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-4" aria-label="Breadcrumb">
        <button onClick={() => onNavigate('/')} className="hover:text-brand-600 transition-colors">
          Home
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <button onClick={() => onNavigate('/tools')} className="hover:text-brand-600 transition-colors">
          Tools
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <button onClick={() => onNavigate(`/${tool.category}-tools`)} className="capitalize hover:text-brand-600 transition-colors">
          {tool.category} Tools
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 dark:text-slate-200 font-medium truncate">
          {tool.name}
        </span>
      </nav>

      {/* Header Container */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 rounded-2xl ${theme.bg} ${theme.text} ${theme.border} border flex items-center justify-center shrink-0 shadow-xs`}>
            <DynamicIcon name={tool.icon} className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {tool.name}
              </h1>
            </div>
            <p className="mt-1.5 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              {tool.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
