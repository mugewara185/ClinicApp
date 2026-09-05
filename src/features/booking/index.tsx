/**
 * Booking Feature Page
 * Full booking section with form, success state, and sidebar info.
 */

import { useEffect, useState } from 'react';
import { Phone, Mail, MapPin, Clock, MessageCircle } from 'lucide-react';
import { componentLogger } from '../../framework/logging/domains/component';
import { logger } from '../../framework/logging/core/Logger';
import { CLINIC_INFO } from '../../framework/schemas/clinic';
import { useToast } from '../../components/Toast';
import { BookingForm } from './components/BookingForm';
import { BookingSuccess } from './components/BookingSuccess';
import type { BookingResult } from './services/BookingService';
import type { BookingFormData } from './schemas/booking.schema';

export const BookingPage = () => {
  const [submitted, setSubmitted] = useState(false);
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);
  const [lastFormData, setLastFormData] = useState<BookingFormData | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    componentLogger.mount('BookingPage');
    return () => componentLogger.unmount('BookingPage');
  }, []);

  const handleSuccess = (result: BookingResult, formData: BookingFormData) => {
    logger.info('booking:page', 'Booking completed', { bookingId: result.bookingId });
    setBookingResult(result);
    setLastFormData(formData);
    setSubmitted(true);
    showToast('Appointment request sent! We\'ll confirm within 24 hours.', 'success', 6000);
    // Scroll to top of booking section
    document.querySelector('#booking')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleReset = () => {
    setSubmitted(false);
    setBookingResult(null);
    setLastFormData(null);
    logger.debug('booking:page', 'Form reset for new booking');
  };

  return (
    <section id="booking" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-teal-600 font-semibold text-sm uppercase tracking-widest">
            Book an Appointment
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mt-2 mb-4">
            Take the First Step
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto">
            Fill out the form below — no account needed. We'll confirm your appointment
            within 24 hours via WhatsApp or phone.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-10">
          {/* Form column */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
              {submitted && bookingResult && lastFormData ? (
                <BookingSuccess
                  result={bookingResult}
                  formData={lastFormData}
                  onReset={handleReset}
                />
              ) : (
                <BookingForm onSuccess={handleSuccess} />
              )}
            </div>
          </div>

          {/* Info sidebar */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact card */}
            <div className="bg-gradient-to-br from-teal-600 to-cyan-700 rounded-3xl p-7 text-white">
              <h3 className="font-bold text-xl mb-5">Get in Touch</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-cyan-200 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-white/60 mb-0.5">Phone</p>
                    <a href={`tel:${CLINIC_INFO.phone}`} className="font-semibold hover:underline">
                      {CLINIC_INFO.phone}
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <MessageCircle className="w-5 h-5 text-cyan-200 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-white/60 mb-0.5">WhatsApp</p>
                    <a
                      href={`https://wa.me/${CLINIC_INFO.whatsappNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold hover:underline"
                    >
                      Chat on WhatsApp
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-cyan-200 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-white/60 mb-0.5">Email</p>
                    <a href={`mailto:${CLINIC_INFO.email}`} className="font-semibold hover:underline">
                      {CLINIC_INFO.email}
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-cyan-200 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-white/60 mb-0.5">Location</p>
                    <p className="font-semibold">{CLINIC_INFO.address}</p>
                    <p className="text-sm text-white/70">{CLINIC_INFO.city}</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Hours card */}
            <div className="bg-slate-50 rounded-3xl p-7 border border-slate-100">
              <div className="flex items-center gap-2 mb-5">
                <Clock className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-800">Office Hours</h3>
              </div>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex justify-between">
                  <span>Sun – Thu</span>
                  <span className="font-semibold text-slate-800">9:00 AM – 8:00 PM</span>
                </li>
                <li className="flex justify-between">
                  <span>Saturday</span>
                  <span className="font-semibold text-slate-800">10:00 AM – 4:00 PM</span>
                </li>
                <li className="flex justify-between">
                  <span>Friday</span>
                  <span className="font-semibold text-red-400">Closed</span>
                </li>
              </ul>
              <p className="text-xs text-slate-400 mt-4">
                Online sessions available outside office hours by special arrangement.
              </p>
            </div>

            {/* Trust note */}
            <div className="text-center p-5 rounded-2xl border border-teal-100 bg-teal-50">
              <p className="text-sm text-teal-700 font-medium">
                🔒 All communications are strictly confidential. No account required.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
