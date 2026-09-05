/**
 * Hero Section
 * Full-screen hero with animated gradient background and CTA.
 */

import { useEffect } from 'react';
import { ArrowRight, Shield, Star, Clock } from 'lucide-react';
import { componentLogger } from '../../../framework/logging/domains/component';
import { logger } from '../../../framework/logging/core/Logger';

const TRUST_BADGES = [
  { icon: Shield, label: '100% Confidential' },
  { icon: Star,   label: '4.9 / 5 Rating' },
  { icon: Clock,  label: 'Same-Week Appointments' },
];

export const HeroSection = () => {
  useEffect(() => {
    componentLogger.mount('HeroSection');
    logger.info('home:hero', 'HeroSection rendered');
    return () => componentLogger.unmount('HeroSection');
  }, []);

  const scrollToBooking = () => {
    logger.info('home:hero:cta', 'User clicked Book Appointment CTA');
    document.querySelector('#booking')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      aria-label="Welcome to MindCare Clinic"
    >
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-700 via-teal-600 to-cyan-700" />

      {/* Decorative blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-teal-400/20 blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-cyan-400/15 blur-3xl" />
      <div className="absolute top-1/3 right-1/4 w-48 h-48 rounded-full bg-white/5 blur-2xl" />

      {/* Wave bottom */}
      <div className="absolute bottom-0 inset-x-0">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 80L48 72C96 64 192 48 288 42.7C384 37.3 480 42.7 576 53.3C672 64 768 80 864 80H1440V80H1152H864H576H288H0V80Z"
                fill="rgb(248 250 252)" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 text-center text-white pt-24 pb-32">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full
                        px-4 py-1.5 text-sm font-medium mb-8 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Accepting New Patients — Book Within 24 Hours
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 tracking-tight">
          Your Journey to{' '}
          <span className="text-cyan-200">Mental Wellness</span>
          <br />
          Starts Here
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed">
          Evidence-based psychological therapy in a safe, confidential, and compassionate
          environment. Licensed therapists ready to support you every step of the way.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button
            onClick={scrollToBooking}
            className="group flex items-center gap-2 bg-white text-teal-700 px-8 py-4 rounded-2xl
                       font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
          >
            Book Free Consultation
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => document.querySelector('#services')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex items-center gap-2 border-2 border-white/40 text-white px-8 py-4
                       rounded-2xl font-semibold text-lg hover:border-white hover:bg-white/10
                       transition-all"
          >
            Explore Services
          </button>
        </div>

        {/* Trust badges */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
          {TRUST_BADGES.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-white/80 text-sm font-medium">
              <Icon className="w-4 h-4 text-cyan-200" />
              {label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
