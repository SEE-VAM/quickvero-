import React from 'react';
import { GUIDES } from '../data/guides';
import { BookOpen, Clock, Calendar, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import { AdBanner } from '../components/common/AdBanner';

interface GuidesPageProps {
  onNavigate: (path: string) => void;
}

export const GuidesPage: React.FC<GuidesPageProps> = ({ onNavigate }) => {
  return (
    <div className="py-10 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header Section */}
        <header className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 text-xs sm:text-sm font-semibold border border-brand-200/60 dark:border-brand-800/60">
            <BookOpen className="w-4 h-4" />
            <span>Knowledge Base &amp; Editorial Guides</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Guides, Tutorials &amp; Technical Manuals
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            In-depth engineering breakdowns, official recruitment exam specifications, and expert optimization strategies for images, documents, and digital workflows.
          </p>
        </header>

        {/* Guides Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {GUIDES.map((guide) => (
            <article
              key={guide.slug}
              onClick={() => onNavigate(`/guides/${guide.slug}`)}
              className="group cursor-pointer rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 sm:p-7 shadow-subtle hover:shadow-card hover:border-brand-500/50 dark:hover:border-brand-500/50 transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                    {guide.category}
                  </span>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{guide.readingTime}</span>
                  </div>
                </div>

                <h2 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-2 leading-snug">
                  {guide.title}
                </h2>

                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                  {guide.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-brand-600 dark:text-brand-400">
                <div className="flex items-center gap-1.5 text-slate-400 font-normal">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{guide.publishDate}</span>
                </div>
                <div className="inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Read Full Guide</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Compliant Ad Placement Below Substantial Content */}
        <div className="pt-8">
          <AdBanner format="leaderboard" />
        </div>
      </div>
    </div>
  );
};
