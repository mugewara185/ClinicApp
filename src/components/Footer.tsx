/**
 * Footer Component
 * Site footer with clinic info, links, and contact details.
 */

import { Brain, MapPin, Phone, Mail, Share2, Heart } from 'lucide-react';
import { CLINIC_INFO } from '../framework/schemas/clinic';
import { componentLogger } from '../framework/logging/domains/component';
import { useEffect } from 'react';

export const Footer = () => {
  useEffect(() => {
    componentLogger.mount('Footer');
    return () => componentLogger.unmount('Footer');
  }, []);

  return (
    <footer id="contact" className="bg-slate-900 text-slate-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-bold text-xl">{CLINIC_INFO.name}</span>
            </div>
            <p className="text-slate-400 leading-relaxed mb-5 max-w-sm">
              {CLINIC_INFO.tagline}. Providing compassionate, evidence-based psychological care
              in a safe and confidential environment.
            </p>
            {/* Social links */}
            <div className="flex gap-3">
              {CLINIC_INFO.social.instagram && (
                <a
                  href={CLINIC_INFO.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-teal-600 flex items-center
                             justify-center transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                </a>
              )}
              {CLINIC_INFO.social.twitter && (
                <a
                  href={CLINIC_INFO.social.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter"
                  className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-teal-600 flex items-center
                             justify-center transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                </a>
              )}
              {CLINIC_INFO.social.facebook && (
                <a
                  href={CLINIC_INFO.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-teal-600 flex items-center
                             justify-center transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
                <span>{CLINIC_INFO.address}, {CLINIC_INFO.city}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-teal-400 shrink-0" />
                <a href={`tel:${CLINIC_INFO.phone}`} className="hover:text-white transition-colors">
                  {CLINIC_INFO.phone}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-teal-400 shrink-0" />
                <a href={`mailto:${CLINIC_INFO.email}`} className="hover:text-white transition-colors">
                  {CLINIC_INFO.email}
                </a>
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h3 className="text-white font-semibold mb-4">Office Hours</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>{CLINIC_INFO.hours.weekdays}</li>
              <li>{CLINIC_INFO.hours.saturday}</li>
              <li>{CLINIC_INFO.hours.sunday}</li>
            </ul>
            <div className="mt-5">
              <button
                onClick={() =>
                  document.querySelector('#booking')?.scrollIntoView({ behavior: 'smooth' })
                }
                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl
                           text-sm font-semibold transition-colors"
              >
                Book Now
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col sm:flex-row
                        items-center justify-between gap-4 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} {CLINIC_INFO.name}. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="w-3.5 h-3.5 text-rose-400 mx-0.5" /> for mental wellness
          </p>
        </div>
      </div>
    </footer>
  );
};
