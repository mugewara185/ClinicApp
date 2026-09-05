/**
 * FAQ Section
 * Accordion-style FAQ for common questions about therapy.
 */

import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { componentLogger } from '../../../framework/logging/domains/component';
import { logger } from '../../../framework/logging/core/Logger';

const FAQS = [
  {
    q: 'What happens in the first session?',
    a: "The first session is a 50-minute consultation where we discuss your goals, concerns, and history. It's a safe space to share at your own pace. We will collaboratively create a personalized treatment plan together.",
  },
  {
    q: 'Is therapy confidential?',
    a: 'Absolutely. Everything discussed in sessions is strictly confidential, in compliance with professional ethics and Saudi healthcare privacy regulations. The only exceptions are situations involving serious harm to yourself or others.',
  },
  {
    q: 'How many sessions will I need?',
    a: 'It varies depending on your goals and situation. Some clients see significant progress in 6–10 sessions; others prefer ongoing support. We will regularly review progress and adjust the plan together.',
  },
  {
    q: 'Do you offer online sessions?',
    a: 'Yes! We offer secure video sessions for clients who prefer remote therapy. Online sessions are equally effective for many conditions and offer greater flexibility.',
  },
  {
    q: 'What is CBT and how does it work?',
    a: 'Cognitive Behavioral Therapy (CBT) is a structured, evidence-based approach that helps you identify and change unhelpful thoughts and behaviors. Sessions involve practical exercises and homework to practice skills between appointments.',
  },
  {
    q: 'How do I book an appointment?',
    a: 'Simply fill out our booking form below — no account needed. Select your preferred date, time, and session type. We will confirm your appointment within 24 hours via WhatsApp.',
  },
];

const FAQItem = ({ q, a, isOpen, onToggle }: {
  q: string; a: string; isOpen: boolean; onToggle: () => void;
}) => (
  <div className="border border-slate-200 rounded-2xl overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between gap-4 p-6 text-left
                 hover:bg-slate-50 transition-colors"
      aria-expanded={isOpen}
    >
      <span className="font-semibold text-slate-800">{q}</span>
      <ChevronDown
        className={clsx(
          'w-5 h-5 text-teal-600 shrink-0 transition-transform duration-300',
          isOpen && 'rotate-180'
        )}
      />
    </button>
    <div
      className={clsx(
        'overflow-hidden transition-all duration-300',
        isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      )}
    >
      <p className="px-6 pb-6 text-slate-500 leading-relaxed text-sm">{a}</p>
    </div>
  </div>
);

export const FAQSection = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  useEffect(() => {
    componentLogger.mount('FAQSection');
    return () => componentLogger.unmount('FAQSection');
  }, []);

  const toggle = (i: number) => {
    const newIdx = openIdx === i ? null : i;
    setOpenIdx(newIdx);
    logger.debug('home:faq', `FAQ ${newIdx !== null ? 'opened' : 'closed'} item ${i}`);
  };

  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-teal-600 font-semibold text-sm uppercase tracking-widest">
            Common Questions
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mt-2">
            Frequently Asked Questions
          </h2>
        </div>

        {/* Accordion */}
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <FAQItem
              key={i}
              q={faq.q}
              a={faq.a}
              isOpen={openIdx === i}
              onToggle={() => toggle(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
