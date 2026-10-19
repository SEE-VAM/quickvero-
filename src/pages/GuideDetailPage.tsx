import React, { useEffect } from 'react';
import { GuideArticle } from '../data/guides';
import { BookOpen, Clock, Calendar, ArrowLeft, ArrowRight, Table, AlertCircle, Info, Lightbulb, CheckCircle2, AlertTriangle, Wrench, HelpCircle } from 'lucide-react';
import { AdBanner } from '../components/common/AdBanner';
import { FaqAccordion } from '../components/common/FaqAccordion';

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
              <span>Published {guide.publishDate} • Last Updated {guide.lastUpdated}</span>
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
                {guide.author.role} &bull; Editorial Review Verified
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

          {/* Worked Example Section */}
          {guide.workedExample && (
            <section id="worked-example" className="p-6 sm:p-8 rounded-3xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 space-y-6 scroll-mt-24">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                  ✓
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                    {guide.workedExample.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    {guide.workedExample.description}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {guide.workedExample.steps.map((st, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                        {st.step}
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 mt-0.5">
                        {st.detail}
                      </p>
                    </div>
                    {st.resultSize && (
                      <span className="shrink-0 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-mono font-bold self-start sm:self-center">
                        {st.resultSize}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <p className="text-sm font-medium text-blue-950 dark:text-blue-200 leading-relaxed border-t border-blue-200/60 dark:border-blue-900/60 pt-4">
                {guide.workedExample.conclusion}
              </p>
            </section>
          )}

          {/* Common Mistakes Section */}
          {guide.commonMistakes && (
            <section id="common-mistakes" className="space-y-6 scroll-mt-24">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 text-xs font-semibold mb-2 border border-amber-200/60 dark:border-amber-800/60">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Quality Assurance Checklist</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {guide.commonMistakes.title}
                </h2>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1">
                  {guide.commonMistakes.description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {guide.commonMistakes.mistakes.map((m, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle space-y-2.5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{m.mistake}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                        <strong className="text-slate-700 dark:text-slate-300">Impact: </strong>
                        {m.impact}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed font-medium">
                      ✓ <strong>Solution: </strong>{m.solution}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Step-by-Step Tool Walkthrough */}
          {guide.toolWalkthrough && (
            <section id="tool-walkthrough" className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white space-y-6 scroll-mt-24">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-xs text-brand-400 font-semibold uppercase tracking-wider">
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Free Browser Tool</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold">
                    {guide.toolWalkthrough.title}
                  </h2>
                </div>
                <button
                  onClick={() => onNavigate(guide.toolWalkthrough.toolRoute)}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm shadow-md transition-all inline-flex items-center gap-2"
                >
                  <span>Open {guide.toolWalkthrough.toolName}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <ol className="grid grid-cols-1 sm:grid-cols-2 gap-4 list-decimal pl-5 text-sm text-slate-300">
                {guide.toolWalkthrough.instructions.map((ins, i) => (
                  <li key={i} className="leading-relaxed pl-1">
                    {ins}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* FAQs Section */}
          {guide.faqs && guide.faqs.length > 0 && (
            <section id="faqs" className="pt-4 scroll-mt-24">
              <FaqAccordion
                items={guide.faqs}
                title={`${guide.title.split(':')[0]} — FAQs`}
                subtitle="Frequently asked questions with verified answers regarding file rules and optimization."
              />
            </section>
          )}
        </article>

        {/* Related QuickVero Tools */}
        {guide.relatedToolRoutes && guide.relatedToolRoutes.length > 0 && (
          <div className="p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Related Free QuickVero Tools:
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

        {/* Ad Placement: Fully compliant below the 1,400+ words article */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
          <AdBanner format="leaderboard" />
        </div>
      </div>
    </div>
  );
};
