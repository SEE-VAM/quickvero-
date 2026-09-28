import React, { useState } from 'react';
import { 
  Zap, 
  Feather, 
  ShieldCheck, 
  Gift, 
  Smartphone, 
  Lock, 
  Cpu, 
  FileCheck, 
  Layers, 
  Sparkles,
  ChevronDown 
} from 'lucide-react';

export const TrustSection: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const values = [
    {
      icon: Zap,
      title: 'Ultra-Fast Performance',
      description: 'Instant client-side execution powered by your browser CPU. No waiting in remote cloud queues.',
      color: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-950/60',
    },
    {
      icon: Feather,
      title: 'Lightweight & Clean',
      description: 'Zero bloated software installations or browser extensions needed. Works instantly in your tab.',
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-950/60',
    },
    {
      icon: ShieldCheck,
      title: '100% Privacy First',
      description: 'Files are processed strictly in your local device memory. Zero bytes are uploaded to remote servers.',
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-950/60',
    },
    {
      icon: Gift,
      title: 'Completely Free',
      description: 'Access core image, PDF, audio, and developer utilities without hidden subscriptions or paywalls.',
      color: 'text-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-950/60',
    },
    {
      icon: Smartphone,
      title: 'Cross-Device Ready',
      description: 'Fully responsive and optimized for mobile smartphones, tablets, laptops, and desktop browsers.',
      color: 'text-rose-500',
      bg: 'bg-rose-50 dark:bg-rose-950/60',
    },
  ];

  const guides = [
    {
      icon: Lock,
      title: 'Why Client-Side Privacy Matters for File Processing',
      content:
        'Most traditional online converters upload your personal photos, official documents, and sensitive spreadsheets to third-party cloud servers. This exposes you to data leaks, unauthorized storage, and slow upload speeds. QuickVero uses modern HTML5 File API and client-side processing, meaning your files stay strictly within your browser. Once you close the tab, all temporary data is instantly cleared from RAM.',
    },
    {
      icon: Cpu,
      title: 'Understanding Lossy vs. Lossless Image Compression',
      content:
        'Lossless compression reduces file sizes by identifying and removing redundant metadata (like EXIF camera data) without modifying a single pixel of the image. In contrast, intelligent lossy compression slightly modifies color patterns that the human eye cannot discern, reducing image weight by up to 80%. This drastic reduction dramatically improves website loading speeds and Core Web Vitals (LCP & CLS).',
    },
    {
      icon: FileCheck,
      title: 'Modern Image Formats: Why WebP Outperforms JPG & PNG',
      content:
        'WebP is a modern image format developed by Google that provides superior lossless and lossy compression for images on the web. WebP images are typically 26% to 34% smaller than comparable PNGs and JPEGs while retaining identical visual fidelity. QuickVero allows you to seamlessly convert legacy JPG and PNG images to WebP with a single click.',
    },
    {
      icon: Layers,
      title: 'Best Practices for Merging and Compressing PDF Documents',
      content:
        'Whether preparing legal contracts, academic coursework, or official government applications, managing PDF file sizes is critical. QuickVero combines client-side stream compression with precision page re-ordering. Documents can be merged, split, or compressed down to email-friendly thresholds (under 2MB) without blurring critical text or legal signatures.',
    },
  ];

  const faqs = [
    {
      q: 'Are my files or images uploaded to any server?',
      a: 'No. QuickVero is designed as a browser-first utility suite. All image compression, PDF manipulation, audio extraction, and format conversions happen locally inside your browser using HTML5 Canvas, WebAssembly, and local JavaScript workers. Your files never leave your device.',
    },
    {
      q: 'Is QuickVero free for personal and commercial projects?',
      a: 'Yes, QuickVero is 100% free to use for both personal and commercial purposes. There are no subscriptions, limits on daily basic usage, or forced watermarks added to your exported files.',
    },
    {
      q: 'Will compressing my images ruin their visual quality?',
      a: 'Not at all. QuickVero uses perceptual quality algorithms that target redundant color data that human eyes cannot perceive. You can preview and fine-tune your compression quality slider from 1% to 100% to find the perfect balance between file size and crystal-clear clarity.',
    },
    {
      q: 'Which browsers and operating systems are supported?',
      a: 'QuickVero works seamlessly across all modern evergreen browsers including Google Chrome, Mozilla Firefox, Apple Safari, Microsoft Edge, and Brave. It runs smoothly on Windows, macOS, Linux, iOS, and Android devices.',
    },
    {
      q: 'How does QuickVero convert MP4 video to MP3 audio?',
      a: 'Our audio extraction tool decodes the audio track directly from the MP4 video container in browser memory, re-encoding it into a high-bitrate MP3 or WAV audio stream ready for immediate download without requiring bulky desktop software.',
    },
  ];

  return (
    <div className="py-16 md:py-24 space-y-20" aria-labelledby="why-quickvero-heading">
      {/* 5 Core Value Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 border border-brand-200/60 dark:border-brand-800/60 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Built for Modern Web Standards</span>
          </div>
          <h2 id="why-quickvero-heading" className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Why Millions Choose QuickVero
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Engineered from the ground up for strict user privacy, lightning-fast client execution, and zero bloat.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {values.map((val) => {
            const Icon = val.icon;
            return (
              <div
                key={val.title}
                className="flex flex-col items-center text-center p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-surface-cardDark shadow-subtle hover:shadow-card transition-all"
              >
                <div className={`w-12 h-12 rounded-xl ${val.bg} ${val.color} flex items-center justify-center mb-4 shadow-sm`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">
                  {val.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {val.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Deep-Dive Educational Publisher Guides */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-labelledby="editorial-guides-heading">
        <div className="bg-slate-50/80 dark:bg-slate-900/40 rounded-3xl p-8 sm:p-12 border border-slate-200/80 dark:border-slate-800">
          <div className="max-w-3xl mb-10">
            <h2 id="editorial-guides-heading" className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              The Technology Behind QuickVero
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              Explore how client-side computing, next-generation image encoding, and secure memory pipelines deliver professional-grade file optimization directly in your browser.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {guides.map((guide, idx) => {
              const Icon = guide.icon;
              return (
                <article
                  key={idx}
                  className="bg-white dark:bg-surface-cardDark p-6 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-subtle hover:border-brand-500/30 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-4 border border-brand-200/50 dark:border-brand-800/50">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 leading-snug">
                      {guide.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {guide.content}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interactive Platform FAQs */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8" aria-labelledby="platform-faqs-heading">
        <div className="text-center mb-10">
          <h2 id="platform-faqs-heading" className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Have questions about privacy, file size limits, or format compatibility? Find your answers below.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-surface-cardDark overflow-hidden transition-all shadow-subtle"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left font-semibold text-sm sm:text-base text-slate-800 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400 focus:outline-none transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="pr-4">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'transform rotate-180 text-brand-500' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
