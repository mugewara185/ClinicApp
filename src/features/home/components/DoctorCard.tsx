/**
 * Doctor Card Component
 * Showcases the doctor's profile using DataFactory-generated data.
 */

import { useEffect } from 'react';
import { Award, Globe, Star, Users, BookOpen } from 'lucide-react';
import { componentLogger } from '../../../framework/logging/domains/component';
import { factory, logger } from '../../../framework/init';
import type { Doctor } from '../../../framework/schemas/doctor';

export const DoctorCard = () => {
  useEffect(() => {
    componentLogger.mount('DoctorCard');
    componentLogger.effect('DoctorCard', 'loadDoctorData');
    return () => componentLogger.unmount('DoctorCard');
  }, []);

  // Generate doctor data from RDF DataFactory
  const doctor = factory.create<Doctor>('doctor') as Doctor;
  logger.debug('home:doctor', 'Doctor data loaded from factory', { name: doctor.name });

  return (
    <section id="doctor" className="py-24 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="text-teal-600 font-semibold text-sm uppercase tracking-widest">
            Meet Your Therapist
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mt-2">
            Compassionate Care, Expert Guidance
          </h2>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden lg:flex">
          {/* Photo side */}
          <div className="lg:w-2/5 relative">
            <div className="h-80 lg:h-full bg-gradient-to-br from-teal-500 to-cyan-600 relative">
              <img
                src={doctor.avatar}
                alt={`Portrait of ${doctor.name}`}
                className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-80"
              />
              {/* Stats overlay */}
              <div className="absolute bottom-6 left-6 right-6 flex gap-4">
                <div className="flex-1 bg-white/90 backdrop-blur-sm rounded-2xl p-4 text-center shadow-lg">
                  <div className="text-2xl font-bold text-teal-700">{doctor.experience}+</div>
                  <div className="text-xs text-slate-500 font-medium">Years Experience</div>
                </div>
                <div className="flex-1 bg-white/90 backdrop-blur-sm rounded-2xl p-4 text-center shadow-lg">
                  <div className="text-2xl font-bold text-teal-700">{doctor.patientsHelped}+</div>
                  <div className="text-xs text-slate-500 font-medium">Patients Helped</div>
                </div>
                <div className="flex-1 bg-white/90 backdrop-blur-sm rounded-2xl p-4 text-center shadow-lg">
                  <div className="text-2xl font-bold text-teal-700">{doctor.rating}</div>
                  <div className="text-xs text-slate-500 font-medium">Star Rating</div>
                </div>
              </div>
            </div>
          </div>

          {/* Info side */}
          <div className="lg:w-3/5 p-8 lg:p-12 flex flex-col justify-center">
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-800">{doctor.name}</h3>
            <p className="text-teal-600 font-semibold mt-1">{doctor.title}</p>
            <p className="text-slate-500 text-sm mt-0.5">{doctor.specialization}</p>

            <p className="mt-6 text-slate-600 leading-relaxed">{doctor.bio}</p>

            {/* Credentials */}
            <div className="mt-8">
              <div className="flex items-center gap-2 text-slate-700 font-semibold mb-3">
                <Award className="w-4 h-4 text-teal-500" />
                Credentials
              </div>
              <ul className="space-y-2">
                {doctor.credentials.map((c: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <BookOpen className="w-3.5 h-3.5 text-teal-500 mt-0.5 shrink-0" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>

            {/* Languages & Rating */}
            <div className="mt-6 flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Globe className="w-4 h-4 text-teal-500" />
                <span>{doctor.languages.join(' · ')}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>{doctor.rating} / 5 ({doctor.patientsHelped}+ reviews)</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <Users className="w-4 h-4 text-teal-500" />
                <span>Online & In-Person Sessions Available</span>
              </div>
            </div>

            <button
              onClick={() =>
                document.querySelector('#booking')?.scrollIntoView({ behavior: 'smooth' })
              }
              className="mt-8 self-start bg-teal-600 hover:bg-teal-700 text-white px-7 py-3.5
                         rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
            >
              Book a Session
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
