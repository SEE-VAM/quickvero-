import React, { useState, useEffect } from 'react';
import { Mail, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { updatePageMeta } from '../utils/seoHelpers';

export const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    updatePageMeta({
      title: 'Contact QuickVero — Support & Feedback',
      description: 'Have a suggestion for a new tool or need help? Contact the QuickVero engineering and support team.',
      canonicalUrl: 'https://www.quickvero.in/contact',
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          access_key: 'c1f414cf-4672-4ca1-8663-fe765c047a0b',
          name: name,
          email: email,
          subject: subject || 'New Contact & Feedback Message from QuickVero',
          message: message,
          from_name: 'QuickVero Contact Form',
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSubmitted(true);
      } else {
        setErrorMessage(result.message || 'Failed to send message. Please try again.');
      }
    } catch (err) {
      setErrorMessage('Network error. Please check your internet connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-12 md:py-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Get in Touch
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Have questions, feedback, or a feature request for a new online tool? We would love to hear from you.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-card">
          {submitted ? (
            <div className="text-center py-8 space-y-4 animate-in fade-in">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Message Sent!
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                Thank you for contacting QuickVero. Your message has been delivered to our inbox, and our team will review it promptly.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setName('');
                  setEmail('');
                  setSubject('');
                  setMessage('');
                  setErrorMessage('');
                }}
                className="mt-4 px-5 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    disabled={isSubmitting}
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@example.com"
                    disabled={isSubmitting}
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Tool suggestion / Feature feedback"
                  disabled={isSubmitting}
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Message *
                </label>
                <textarea
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what you think or how we can improve..."
                  disabled={isSubmitting}
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-sm bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white shadow-md shadow-brand-500/20 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending Message...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Message</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Direct Support Information */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Mail className="w-4 h-4 text-brand-600" />
              <span>Direct Support Email:</span>
              <a
                href="mailto:contact@quickvero.in"
                className="text-brand-600 dark:text-brand-400 hover:underline font-mono"
              >
                contact@quickvero.in
              </a>
            </div>
            <p className="text-[11px] text-slate-400">
              Operating Hours: Monday – Saturday (9:00 AM – 7:00 PM IST) • Average Response Time: 24–48 Hours
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
