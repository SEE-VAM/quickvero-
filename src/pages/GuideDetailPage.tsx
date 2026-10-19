import React, { useEffect } from 'react';
import { GuideArticle } from '../data/guides';
import { BookOpen, Clock, Calendar, ArrowLeft, ArrowRight, Table, AlertCircle, Info, Lightbulb, CheckCircle2 } from 'lucide-react';
import { AdBanner } from '../components/common/AdBanner';

interface GuideDetailPageProps {
  guide: GuideArticle;
  onNavigate: (path: string) => void;
}

export const GuideDetailPage: React.FC<GuideDetailPageProps> = ({ guide, onNavigate }) => {
  useEffect(() => {
    document.title = guide.seoTitle;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', guide.seoDescription);
    }
  }, [guide]);

  return (
    <div className="py-8 sm:py-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
          <button
            onClick={() => onNavigate('/')}
            className="hover:text-brand-600 transition-colors"
          >
            Home
          </button>
          <span>&rarr;</span>
          <button
            onClick={() => onNavigate('/guides')}
            className="hover:text-brand-600 transition-colors"
          >
            Guides
          </button>
          <span>&rarr;</span>
          <span className="text-slate-900 dark:text-slate-200 font-semibold truncate max-w-[200px] sm:max-w-none">
            {guide.title}
          </span>
        </nav>

        {/* Back Link */}
        <div>
          <button
            onClick={() => onNavigate('/guides')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Guides</span>
          </button>
        </div>

        {/* Article Header */}
        <header className="space-y-4 border-b border-slate-200 dark:border-slate-800 pb-8">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 font-bold border border-brand-200/60 dark:border-brand-800/60">
              {guide.category}
            </span>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span>{guide.readingTime}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>Updated {guide.publishDate}</span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            {guide.title}
          </h1>

          <div className="flex items-center gap-3 pt-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              QV
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {guide.author.name}
              </div>
              <div className="text-xs text-slate-500">
                {guide.author.role}
              </div>
            </div>
          </div>

          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed pt-2">
            {guide.lead}
          </p>
        </header>

        {/* Table of Contents */}
        {guide.tableOfContents && guide.tableOfContents.length > 0 && (
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              <BookOpen className="w-4 h-4 text-brand-600" />
              <span>Table of Contents</span>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
              {guide.tableOfContents.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                  >
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Main Article Content */}
        <article className="space-y-12">
          {guide.sections.map((section) => (
            <section key={section.id} id={section.id} className="space-y-4 scroll-mt-24">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {section.title}
              </h2>

              {section.paragraphs.map((para, pIdx) => (
                <p key={pIdx} className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                  {para}
                </p>
              ))}

              {section.subsections && section.subsections.map((sub, sIdx) => (
                <div key={sIdx} className="space-y-2 pt-2">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                    {sub.title}
                  </h3>
                  {sub.paragraphs.map((p, i) => (
                    <p key={i} className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                      {p}
                    </p>
                  ))}
                  {sub.list && (
                    <ul className="list-disc pl-5 space-y-1 text-sm sm:text-base text-slate-600 dark:text-slate-400">
                      {sub.list.map((item, liIdx) => (
                        <li key={liIdx}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}

              {/* Table */}
              {section.table && (
                <div className="pt-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    <Table className="w-4 h-4 text-brand-600" />
                    <span>{section.table.title}</span>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 uppercase tracking-wider font-semibold text-[11px]">
                        <tr>
                          {section.table.headers.map((h, i) => (
                            <th key={i} className="py-3 px-4 border-b border-slate-200 dark:border-slate-700">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                        {section.table.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="py-3 px-4">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Callout */}
              {section.callout && (
                <div
                  className={`mt-4 p-5 rounded-2xl text-sm flex items-start gap-3 border ${
                    section.callout.type === 'tip'
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                      : section.callout.type === 'warning'
                      ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800'
                      : 'bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800'
                  }`}
                >
                  {section.callout.type === 'tip' ? (
                    <Lightbulb className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
                  ) : section.callout.type === 'warning' ? (
                    <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
                  ) : (
                    <Info className="w-5 h-5 shrink-0 text-blue-600 mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold mb-1">{section.callout.title}</div>
                    <div className="leading-relaxed">{section.callout.text}</div>
                  </div>
                </div>
              )}
            </section>
          ))}
        </article>

        {/* Related QuickVero Tools */}
        {guide.relatedToolRoutes && guide.relatedToolRoutes.length > 0 && (
          <div className="p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Use Recommended QuickVero Tools for Free
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Apply the techniques described in this guide with our 100% private, browser-based online tools:
            </p>
            <div className="flex flex-wrap gap-3">
              {guide.relatedToolRoutes.map((tool, idx) => (
                <button
                  key={idx}
                  onClick={() => onNavigate(tool.route)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/50 shadow-sm transition-all"
                >
                  <span>{tool.name}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Ad Placement: Fully compliant below the 1000+ words article */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
          <AdBanner format="leaderboard" />
        </div>
      </div>
    </div>
  );
};
