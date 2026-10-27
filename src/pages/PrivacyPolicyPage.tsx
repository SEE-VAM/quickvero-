import React, { useEffect } from 'react';
import { ShieldCheck, Lock, EyeOff, Server, Cookie } from 'lucide-react';
import { updatePageMeta } from '../utils/seoHelpers';

export const PrivacyPolicyPage: React.FC = () => {
  useEffect(() => {
    updatePageMeta({
      title: 'Privacy Policy — QuickVero Security & Data Protection',
      description: 'Review the QuickVero privacy policy. Learn how in-browser processing protects your files, and how cookies and Google AdSense are managed.',
      canonicalUrl: 'https://www.quickvero.in/privacy-policy',
    });
  }, []);

  return (
    <div className="py-12 md:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Last Updated: October 2026 &bull; Effective Immediately
          </p>
        </div>

        {/* Highlight Box */}
        <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 flex items-start gap-4">
          <ShieldCheck className="w-7 h-7 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-base font-bold">100% In-Browser Zero-Retention Architecture</h2>
            <p className="text-sm text-emerald-800 dark:text-emerald-200 leading-relaxed">
              QuickVero processes your images, documents, and media directly inside your web browser using HTML5 Canvas, Web Audio, and WebAssembly. Your files are never uploaded to, stored on, or harvested by any remote server.
            </p>
          </div>
        </div>

        <div className="prose dark:prose-invert max-w-none space-y-8 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">1. How Files Are Handled (Client-Side In-Browser Execution)</h2>
            <p>
              Unlike legacy conversion websites that require uploading your private files to cloud servers, QuickVero is engineered with a strict <strong>client-side architecture</strong>.
            </p>
            <p>
              When you use tools such as the Image Compressor, Compress Image to 20KB/50KB, PDF Compressor, JPG to PDF, Video Trimmer, MP4 to MP3, or Digital QR Menu Maker, the computations are executed directly inside your computer or mobile device&apos;s volatile RAM. Your documents, photos, resumes, and signatures never leave your device and are never transmitted across our network.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">2. Data Retention Policy</h2>
            <p>
              Because processing takes place locally in your web browser, <strong>QuickVero maintains zero server retention of your uploaded or generated files</strong>. Once you close your browser tab or navigate away, the file buffers in memory are automatically cleared by your operating system. We do not operate databases storing user files, personal identities, or document history.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">3. Cookies, Local Storage &amp; Web Beacons</h2>
            <p>
              QuickVero uses cookies and browser <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">localStorage</code> for essential website operations, including remembering your dark/light mode preference, preserving your recent tool history, and recording your cookie consent preferences.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">4. Google AdSense &amp; Third-Party Advertising Cookies</h2>
            <p>
              We use Google AdSense to serve advertisements when you visit our website. Google, as a third-party vendor, uses cookies to serve ads on QuickVero.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>DoubleClick DART Cookie:</strong> Google&apos;s use of the DART cookie enables it to serve personalized ads to our users based on previous visits to QuickVero and other sites on the Internet.
              </li>
              <li>
                <strong>Opt-Out of Personalized Ads:</strong> Users may opt out of personalized advertising by visiting Google&apos;s <a href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer" className="text-brand-600 dark:text-brand-400 underline font-semibold">Ads Settings</a>. Alternatively, you can opt out of third-party vendor cookies for personalized advertising by visiting <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" className="text-brand-600 dark:text-brand-400 underline font-semibold">aboutads.info</a>.
              </li>
              <li>
                <strong>Google Partner Policy:</strong> To learn how Google uses data when you use our site, review the official policy at <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-brand-600 dark:text-brand-400 underline font-semibold">How Google uses information from sites or apps that use our services</a>.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">5. Non-Personal Aggregated Telemetry</h2>
            <p>
              We may collect standard, non-personally identifiable server access logs (such as HTTP response codes, browser user-agent types, and general referrers) to detect technical errors, prevent denial-of-service abuse, and optimize platform reliability.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">6. Children&apos;s Privacy</h2>
            <p>
              QuickVero does not knowingly collect or solicit any personally identifiable information from children under the age of 13.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">7. Privacy Inquiries &amp; Contact Information</h2>
            <p>
              If you have any questions or concerns regarding our privacy practices, please contact our designated privacy officer directly at:
            </p>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <p className="font-semibold text-slate-900 dark:text-white">QuickVero Privacy &amp; Data Security</p>
              <p>Inquiries: <a href="/contact" className="text-brand-600 dark:text-brand-400 font-semibold underline">Contact &amp; Support Form</a></p>
              <p className="text-xs text-slate-400 mt-1">Website: https://www.quickvero.in</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
