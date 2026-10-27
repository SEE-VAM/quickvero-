import React, { useEffect } from 'react';
import { ShieldCheck, Zap, Lock, Globe, Users, Heart, Code2, ServerOff, Mail } from 'lucide-react';
import { updatePageMeta } from '../utils/seoHelpers';

export const AboutPage: React.FC = () => {
  useEffect(() => {
    updatePageMeta({
      title: 'About QuickVero — Powerful Online Tools. Simple & Fast.',
      description: 'Learn about QuickVero, who runs it, how files are processed 100% in-browser, and our mission to provide private, high-speed utilities for everyone.',
      canonicalUrl: 'https://www.quickvero.in/about',
    });
  }, []);

  return (
    <div className="py-12 md:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            About <span className="text-brand-600 dark:text-brand-400">QuickVero</span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Building the next generation of web utilities: fast, private, accessible, and completely free of spam.
          </p>
        </div>

        {/* Mission Card */}
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-card space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Our Mission &amp; Philosophy
          </h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm sm:text-base">
            Most online converters and utility websites today are bogged down by intrusive pop-up ads, slow server queues, forced email registrations, and sketchy privacy practices that harvest personal files.
          </p>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm sm:text-base">
            <strong>QuickVero</strong> was founded to provide a clean, dignified alternative. By leveraging modern browser APIs (such as HTML5 Canvas, Web Audio, and WebAssembly), we process images, audio, documents, and media directly on your device. Your confidential files never touch our servers, guaranteeing 100% privacy, zero data leaks, and instantaneous conversion speed.
          </p>
        </div>

        {/* Who Runs QuickVero Card */}
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-card space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Who Runs QuickVero?
            </h2>
          </div>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm sm:text-base">
            QuickVero is developed and maintained by a dedicated independent engineering team specializing in web performance, browser cryptography, and digital utility architecture based in India.
          </p>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm sm:text-base">
            Our team creates specialized tool suites for students preparing for national recruitment exams (such as SSC, UPSC, and IBPS), digital creators compressing media for social platforms, and restaurant owners transitioning to modern contactless digital QR menus.
          </p>
          <div className="pt-2 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Mail className="w-4 h-4 text-brand-600" />
            <span>Have questions or suggestions? Reach out directly via our</span>
            <a href="/contact" className="text-brand-600 dark:text-brand-400 font-medium hover:underline">
              Contact &amp; Feedback Form
            </a>
          </div>
        </div>

        {/* How Files Are Handled Technical Deep Dive */}
        <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ServerOff className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              How Files Are Handled (100% In-Browser Execution)
            </h2>
          </div>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm sm:text-base">
            Unlike traditional cloud converters that upload your sensitive documents to remote servers, QuickVero executes file operations <strong>locally inside your web browser</strong>:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base text-slate-600 dark:text-slate-400">
            <li><strong>Images:</strong> Decoded and compressed using native HTML5 Canvas 2D contexts and discrete cosine quantization directly on your GPU/CPU.</li>
            <li><strong>PDF Documents:</strong> Parsed, compressed, and manipulated using client-side WebAssembly and <code className="text-xs bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">pdf-lib</code> in volatile device RAM.</li>
            <li><strong>Audio &amp; Video:</strong> Processed using HTML5 Web Audio API buffers and browser timeline slicing without sending video data over the internet.</li>
            <li><strong>Restaurant QR Menus:</strong> Compressed into URL hash payloads rendered dynamically on the client with zero cloud database dependency.</li>
          </ul>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-500 mx-auto flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white">Privacy First</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Files are processed in local memory and never logged, retained, or mined for advertising.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-500 mx-auto flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white">Instant Speed</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              No server upload wait times. Instant client-side computation renders results in milliseconds.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-500 mx-auto flex items-center justify-center">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white">Universal Access</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Optimized for mobile smartphones, tablets, laptops, and desktop computers worldwide.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
