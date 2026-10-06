import React from 'react';
import { Heart, Sparkles, ArrowRight } from 'lucide-react';
import { TOOLS } from '../../data/tools';
import { ToolDefinition } from '../../types/tool';
import { ToolCard } from '../common/ToolCard';

interface FavoriteToolsProps {
  onSelectTool: (tool: ToolDefinition) => void;
  favorites: string[];
  onToggleFavorite: (toolId: string) => void;
  onExploreAll?: () => void;
}

export const FavoriteTools: React.FC<FavoriteToolsProps> = ({
  onSelectTool,
  favorites,
  onToggleFavorite,
  onExploreAll,
}) => {
  const favoriteTools = TOOLS.filter((tool) => favorites.includes(tool.id));

  return (
    <section id="favorite-tools" className="py-8 md:py-12 bg-white dark:bg-surface-darker">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 pb-4 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-500">
                <Heart className="w-4 h-4 fill-rose-500" />
              </span>
              <span className="text-xs font-semibold tracking-wider uppercase text-rose-600 dark:text-rose-400">
                Quick Access
              </span>
              {favoriteTools.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/60">
                  {favoriteTools.length} {favoriteTools.length === 1 ? 'tool' : 'tools'}
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Favorite Tools
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {favoriteTools.length > 0
                ? 'Your pinned tools for fast, one-click access directly from your homepage.'
                : 'Click the heart icon on any tool card across QuickVero to pin your daily tools here.'}
            </p>
          </div>

          {onExploreAll && favoriteTools.length > 0 && (
            <button
              onClick={onExploreAll}
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline shrink-0"
            >
              <span>Explore all tools</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Content */}
        {favoriteTools.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {favoriteTools.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                onSelect={onSelectTool}
                isFavorite={true}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 p-8 sm:p-10 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center">
              <Heart className="w-6 h-6 stroke-[1.75]" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              No Favorite Tools Pinned Yet
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Click the heart (<span className="text-rose-500 font-bold">♥</span>) on any tool card below to pin your most-used converters, compressors, or utilities here for instant access anytime.
            </p>
            {onExploreAll && (
              <button
                onClick={onExploreAll}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Browse All Tools</span>
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
