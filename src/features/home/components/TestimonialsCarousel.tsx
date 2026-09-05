/**
 * Testimonials Carousel
 * Auto-scrolling patient testimonials using DataFactory-generated mock data.
 */

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react';
import { componentLogger } from '../../../framework/logging/domains/component';
import { factory, logger } from '../../../framework/init';
import type { Testimonial } from '../../../framework/schemas/testimonial';

export const TestimonialsCarousel = () => {
  const [active, setActive] = useState(0);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    componentLogger.mount('TestimonialsCarousel');
    return () => componentLogger.unmount('TestimonialsCarousel');
  }, []);

  // Generate testimonials from factory
  const testimonials = factory.create<Testimonial>('testimonial', { count: 6 }) as Testimonial[];
  logger.debug('home:testimonials', 'Testimonials loaded', { count: testimonials.length });

  const total = testimonials.length;

  // Auto-advance
  useEffect(() => {
    autoPlayRef.current = setInterval(() => {
      setActive(prev => (prev + 1) % total);
    }, 5000);
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [total]);

  const resetTimer = () => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    autoPlayRef.current = setInterval(() => {
      setActive(prev => (prev + 1) % total);
    }, 5000);
  };

  const prev = () => {
    setActive(p => (p - 1 + total) % total);
    resetTimer();
  };

  const next = () => {
    setActive(p => (p + 1) % total);
    resetTimer();
  };

  const t = testimonials[active];

  return (
    <section id="testimonials" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-teal-600 font-semibold text-sm uppercase tracking-widest">
            Patient Stories
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mt-2">
            What Our Patients Say
          </h2>
        </div>

        {/* Carousel */}
        <div className="relative max-w-4xl mx-auto">
          {/* Card */}
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-3xl p-8 sm:p-12
                          border border-teal-100 shadow-sm min-h-[280px]">
            <Quote className="w-10 h-10 text-teal-200 mb-6" />

            <p className="text-slate-700 text-lg leading-relaxed mb-8 italic">
              "{t.text}"
            </p>

            {/* Author */}
            <div className="flex items-center gap-4">
              <img
                src={t.avatar}
                alt={t.patientName}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-teal-200"
              />
              <div>
                <div className="font-bold text-slate-800">{t.patientName}</div>
                <div className="text-sm text-teal-600">{t.sessionType}</div>
              </div>
              <div className="ml-auto flex flex-col items-end gap-1">
                <div className="flex">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <span className="text-xs text-slate-400">{t.date}</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={prev}
              aria-label="Previous testimonial"
              className="w-10 h-10 rounded-full border-2 border-teal-200 text-teal-600
                         hover:bg-teal-600 hover:text-white hover:border-teal-600
                         flex items-center justify-center transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Dots */}
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setActive(i); resetTimer(); }}
                  aria-label={`Go to testimonial ${i + 1}`}
                  className={`rounded-full transition-all ${
                    i === active
                      ? 'w-6 h-2.5 bg-teal-600'
                      : 'w-2.5 h-2.5 bg-slate-300 hover:bg-slate-400'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={next}
              aria-label="Next testimonial"
              className="w-10 h-10 rounded-full border-2 border-teal-200 text-teal-600
                         hover:bg-teal-600 hover:text-white hover:border-teal-600
                         flex items-center justify-center transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
