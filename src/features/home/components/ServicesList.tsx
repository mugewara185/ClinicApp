/**
 * Services List Component
 * Grid of psychological services using DataFactory mock data.
 */

import { useEffect } from 'react';
import {
  Brain, Lightbulb, Wind, Shield, Heart, Star, ArrowRight,
} from 'lucide-react';
import { componentLogger } from '../../../framework/logging/domains/component';
import { logger } from '../../../framework/logging/core/Logger';
import { STATIC_SERVICES, type ClinicService } from '../../../framework/schemas/service';

// Map icon name strings to Lucide components
const ICON_MAP: Record<string, React.ElementType> = {
  Brain, Lightbulb, Wind, Shield, Heart, Star,
};

const COLOR_MAP: Record<string, { bg: string; text: string; badge: string }> = {
  teal:   { bg: 'bg-teal-50',   text: 'text-teal-600',   badge: 'bg-teal-100 text-teal-700' },
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-600',   badge: 'bg-blue-100 text-blue-700' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', badge: 'bg-purple-100 text-purple-700' },
  rose:   { bg: 'bg-rose-50',   text: 'text-rose-600',   badge: 'bg-rose-100 text-rose-700' },
  pink:   { bg: 'bg-pink-50',   text: 'text-pink-600',   badge: 'bg-pink-100 text-pink-700' },
  amber:  { bg: 'bg-amber-50',  text: 'text-amber-600',  badge: 'bg-amber-100 text-amber-700' },
};

const ServiceCard = ({ service }: { service: ClinicService }) => {
  const Icon = ICON_MAP[service.icon] ?? Brain;
  const colors = COLOR_MAP[service.color] ?? COLOR_MAP.teal;

  return (
    <div
      className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md border border-slate-100
                 hover:border-slate-200 transition-all group cursor-default"
    >
      {/* Icon */}
      <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center mb-4`}>
        <Icon className={`w-6 h-6 ${colors.text}`} />
      </div>

      {/* Content */}
      <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-teal-600 transition-colors">
        {service.title}
      </h3>
      <p className="text-slate-500 text-sm leading-relaxed mb-4">{service.description}</p>

      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${colors.badge}`}>
          {service.duration}
        </span>
        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600">
          From {service.price}
        </span>
      </div>
    </div>
  );
};

export const ServicesList = () => {
  useEffect(() => {
    componentLogger.mount('ServicesList');
    logger.info('home:services', 'ServicesList rendered', { count: STATIC_SERVICES.length });
    return () => componentLogger.unmount('ServicesList');
  }, []);

  return (
    <section id="services" className="py-24 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-teal-600 font-semibold text-sm uppercase tracking-widest">
            Our Services
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mt-2 mb-4">
            Evidence-Based Therapeutic Services
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto">
            We offer a range of specialized psychological therapies tailored to your unique needs,
            delivered by a certified and compassionate clinician.
          </p>
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {STATIC_SERVICES.map((service: ClinicService) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-14">
          <p className="text-slate-500 mb-4">Not sure which service is right for you?</p>
          <button
            onClick={() =>
              document.querySelector('#booking')?.scrollIntoView({ behavior: 'smooth' })
            }
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white
                       px-7 py-3.5 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
          >
            Book a Free Consultation
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
