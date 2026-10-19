import React from 'react';
import { ToolDefinition } from '../../types/tool';
import { CheckCircle2, ShieldCheck, Zap, HelpCircle, BookOpen, Table, AlertCircle, Info, Lightbulb } from 'lucide-react';
import { FaqAccordion } from '../common/FaqAccordion';

interface ToolContentProps {
  tool: ToolDefinition;
}

export const ToolContent: React.FC<ToolContentProps> = ({ tool }) => {
  return (
    <div className="mt-16 pt-12 border-t border-slate-200 dark:border-slate-800 space-y-16">
      {/* What is this tool? */}
      <section aria-labelledby="about-tool-heading">
        <h2 id="about-tool-heading" className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
          What is the {tool.name}?
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed max-w-3xl">
          {tool.description}
        </p>

        {tool.features && tool.features.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Key Capabilities &amp; Highlights
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tool.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* How to use */}
      <section aria-labelledby="how-to-use-heading">
        <h2 id="how-to-use-heading" className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
          How to Use the {tool.name}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-8">
          Follow these 4 simple steps to optimize your files in seconds.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {tool.howToSteps.map((step) => (
            <div
              key={step.step}
              className="relative p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-subtle flex flex-col justify-between"
            >
              <div>
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 font-bold text-sm mb-4 border border-brand-200/60 dark:border-brand-800/60">
                  {step.step}
                </span>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* In-Depth Publisher Editorial Guide & Technical Breakdown */}
      {tool.editorial && (
        <article className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-6 sm:p-10 space-y-10">
          <header className="border-b border-slate-200 dark:border-slate-800 pb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 text-xs font-semibold mb-3 border border-brand-200/60 dark:border-brand-800/60">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Technical &amp; Practical Guide</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {tool.editorial.title}
            </h2>
            <p className="mt-3 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              {tool.editorial.leadParagraph}
            </p>
          </header>

          {/* Guide Sections */}
          <div className="space-y-8">
            {tool.editorial.sections.map((sec, sIdx) => (
              <section key={sIdx} className="space-y-3">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {sec.heading}
                </h3>
                {sec.subheading && (
                  <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                    {sec.subheading}
                  </p>
                )}

                {sec.paragraphs.map((para, pIdx) => (
                  <p key={pIdx} className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                    {para}
                  </p>
                ))}

                {sec.bulletPoints && sec.bulletPoints.length > 0 && (
                  <ul className="list-disc pl-5 space-y-1.5 text-sm sm:text-base text-slate-600 dark:text-slate-400">
                    {sec.bulletPoints.map((bp, bIdx) => (
                      <li key={bIdx} className="leading-relaxed">
                        {bp}
                      </li>
                    ))}
                  </ul>
                )}

                {sec.callout && (
                  <div
                    className={`mt-4 p-4 rounded-xl text-sm flex items-start gap-3 border ${
                      sec.callout.type === 'tip'
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                        : sec.callout.type === 'warning'
                        ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800'
                        : 'bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800'
                    }`}
                  >
                    {sec.callout.type === 'tip' ? (
                      <Lightbulb className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
                    ) : sec.callout.type === 'warning' ? (
                      <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
                    ) : (
                      <Info className="w-5 h-5 shrink-0 text-blue-600 mt-0.5" />
                    )}
                    <div className="leading-relaxed font-medium">{sec.callout.text}</div>
                  </div>
                )}
              </section>
            ))}
          </div>

          {/* Comparison Table */}
          {tool.editorial.comparisonTable && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                <Table className="w-4 h-4 text-brand-600" />
                <span>{tool.editorial.comparisonTable.title}</span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 uppercase tracking-wider font-semibold text-[11px]">
                    <tr>
                      {tool.editorial.comparisonTable.headers.map((h, i) => (
                        <th key={i} className="py-3 px-4 border-b border-slate-200 dark:border-slate-700">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                    {tool.editorial.comparisonTable.rows.map((row, rIdx) => (
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
              {tool.editorial.comparisonTable.caption && (
                <p className="text-xs text-slate-400 italic">
                  {tool.editorial.comparisonTable.caption}
                </p>
              )}
            </div>
          )}

          {/* Exam Specs Table */}
          {tool.editorial.examSpecsTable && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                <Table className="w-4 h-4 text-emerald-600" />
                <span>{tool.editorial.examSpecsTable.title}</span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 uppercase tracking-wider font-semibold text-[11px]">
                    <tr>
                      {tool.editorial.examSpecsTable.headers.map((h, i) => (
                        <th key={i} className="py-3 px-4 border-b border-slate-200 dark:border-slate-700">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                    {tool.editorial.examSpecsTable.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="py-3 px-4 font-mono text-xs">
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
        </article>
      )}

      {/* Privacy, Performance & Security Highlights */}
      <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          Why Use QuickVero's {tool.name}?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              🔒 100% Client-Side Privacy
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              All processing executes strictly in your device local volatile memory using HTML5 Canvas and modern WebAssembly. Your photos, certificates, videos, and confidential documents are never uploaded to remote servers, completely eliminating data leaks.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              ⚡ Instant Hardware Acceleration
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              By leveraging your computer or smartphone local GPU and multi-core CPU, QuickVero bypasses cloud queue waiting times, delivering instantaneous conversions and exports with zero network transfer lag.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              📱 Universal Device Compatibility
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              QuickVero works seamlessly across all platforms—Windows, macOS, iOS (iPhone &amp; iPad), Android, and Linux. No software installations, browser extensions, or account signups are ever required.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              🛡️ Zero Watermarks &amp; Restrictions
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              QuickVero utilities produce completely clean, unwatermarked files with no daily quotas, hidden paywalls, or feature locks. Enjoy fast, professional utility conversions without restrictive usage barriers.
            </p>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <FaqAccordion
        items={tool.faqs}
        title={`${tool.name} FAQs`}
        subtitle="Common questions regarding file formats, privacy, quality retention, and limits."
      />
    </div>
  );
};
