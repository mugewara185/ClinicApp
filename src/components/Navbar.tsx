/**
 * Navbar Component
 * Sticky, responsive navigation with smooth scroll and mobile menu.
 */

import { useEffect, useState } from 'react';
import { Brain, Menu, X, Phone } from 'lucide-react';
import { clsx } from 'clsx';
import { componentLogger } from '../framework/logging/domains/component';
import { CLINIC_INFO } from '../framework/schemas/clinic';

const NAV_LINKS = [
  { label: 'Home',         href: '#home' },
  { label: 'About',        href: '#doctor' },
  { label: 'Services',     href: '#services' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'Contact',      href: '#contact' },
];

export const Navbar = () => {
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);

  useEffect(() => {
    componentLogger.mount('Navbar');

    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      componentLogger.unmount('Navbar');
    };
  }, []);

  const handleNavClick = (href: string) => {
    setMenuOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header
      className={clsx(
        'fixed top-0 inset-x-0 z-40 transition-all duration-300',
        scrolled
          ? 'bg-white/95 backdrop-blur-sm shadow-md py-3'
          : 'bg-transparent py-5'
      )}
    >
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => handleNavClick('#home')}
          className="flex items-center gap-2 group"
          aria-label="MindCare Clinic Home"
        >
          <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center
                          group-hover:bg-teal-700 transition-colors">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className={clsx(
            'font-bold text-xl transition-colors',
            scrolled ? 'text-slate-800' : 'text-white'
          )}>
            {CLINIC_INFO.name}
          </span>
        </button>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(link => (
            <li key={link.href}>
              <button
                onClick={() => handleNavClick(link.href)}
                className={clsx(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  scrolled
                    ? 'text-slate-600 hover:text-teal-600 hover:bg-teal-50'
                    : 'text-white/90 hover:text-white hover:bg-white/10'
                )}
              >
                {link.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href={`tel:${CLINIC_INFO.phone}`}
            className={clsx(
              'flex items-center gap-1.5 text-sm font-medium transition-colors',
              scrolled ? 'text-slate-600 hover:text-teal-600' : 'text-white/90 hover:text-white'
            )}
          >
            <Phone className="w-4 h-4" />
            {CLINIC_INFO.phone}
          </a>
          <button
            onClick={() => handleNavClick('#booking')}
            className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl
                       text-sm font-semibold transition-all shadow-sm hover:shadow-md"
          >
            Book Appointment
          </button>
        </div>

        {/* Mobile menu button */}
        <button
          className={clsx(
            'md:hidden p-2 rounded-lg transition-colors',
            scrolled ? 'text-slate-700 hover:bg-slate-100' : 'text-white hover:bg-white/10'
          )}
          onClick={() => setMenuOpen(v => !v)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 shadow-lg">
          <ul className="px-4 py-4 space-y-1">
            {NAV_LINKS.map(link => (
              <li key={link.href}>
                <button
                  onClick={() => handleNavClick(link.href)}
                  className="w-full text-left px-4 py-3 text-slate-700 hover:text-teal-600
                             hover:bg-teal-50 rounded-lg transition-colors text-sm font-medium"
                >
                  {link.label}
                </button>
              </li>
            ))}
            <li className="pt-2">
              <button
                onClick={() => handleNavClick('#booking')}
                className="w-full bg-teal-600 text-white py-3 rounded-xl font-semibold
                           hover:bg-teal-700 transition-colors"
              >
                Book Appointment
              </button>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
};
