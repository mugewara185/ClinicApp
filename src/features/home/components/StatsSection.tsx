/**
 * Stats Section
 * Animated numbers showcasing clinic impact.
 */

import { useEffect, useRef, useState } from 'react';
import { Users, Star, Calendar, Award } from 'lucide-react';
import { componentLogger } from '../../../framework/logging/domains/component';

interface Stat {
  icon: React.ElementType;
  value: number;
  suffix: string;
  label: string;
  color: string;
}

const STATS: Stat[] = [
  { icon: Users,    value: 850,  suffix: '+', label: 'Patients Helped',       color: 'text-teal-600' },
  { icon: Star,     value: 4.9,  suffix: '',  label: 'Average Rating',        color: 'text-amber-500' },
  { icon: Calendar, value: 15,   suffix: '+', label: 'Years of Experience',   color: 'text-blue-600' },
  { icon: Award,    value: 98,   suffix: '%', label: 'Patient Satisfaction',  color: 'text-rose-500' },
];

const AnimatedNumber = ({ target, suffix }: { target: number; suffix: string }) => {
  const [current, setCurrent] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true;
          const steps = 60;
          const increment = target / steps;
          let step = 0;
          const timer = setInterval(() => {
            step++;
            setCurrent(prev => {
              const next = Math.min(prev + increment, target);
              if (step >= steps) clearInterval(timer);
              return next;
            });
          }, 20);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref}>
      {target % 1 !== 0 ? current.toFixed(1) : Math.round(current)}
      {suffix}
    </span>
  );
};

export const StatsSection = () => {
  useEffect(() => {
    componentLogger.mount('StatsSection');
    return () => componentLogger.unmount('StatsSection');
  }, []);

  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map(({ icon: Icon, value, suffix, label, color }) => (
            <div
              key={label}
              className="text-center p-6 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className={`text-3xl sm:text-4xl font-bold ${color} mb-1`}>
                <AnimatedNumber target={value} suffix={suffix} />
              </div>
              <div className="flex items-center justify-center gap-1.5 mt-2">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-sm text-slate-500 font-medium">{label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
