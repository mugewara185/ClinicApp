/**
 * Booking Success Component
 * Shown after a booking is submitted successfully.
 */

import { CheckCircle, Calendar, Phone, ArrowLeft } from 'lucide-react';
import type { BookingResult } from '../services/BookingService';
import { formatDate, formatTime } from '../../../shared/utils/formatters';
import type { BookingFormData } from '../schemas/booking.schema';

interface Props {
  result: BookingResult;
  formData: BookingFormData;
  onReset: () => void;
}

export const BookingSuccess = ({ result, formData, onReset }: Props) => (
  <div className="text-center py-10 px-4">
    {/* Check icon */}
    <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center
                    mx-auto mb-6 animate-bounce">
      <CheckCircle className="w-10 h-10 text-emerald-600" />
    </div>

    <h2 className="text-2xl font-bold text-slate-800 mb-2">Appointment Requested!</h2>
    <p className="text-slate-500 mb-8 max-w-sm mx-auto leading-relaxed">
      {result.message}
    </p>

    {/* Booking details card */}
    <div className="bg-slate-50 rounded-2xl p-6 text-left max-w-sm mx-auto mb-8 space-y-3">
      <div className="flex items-center gap-3 text-sm">
        <Calendar className="w-4 h-4 text-teal-500 shrink-0" />
        <div>
          <span className="text-slate-400">Date & Time</span>
          <p className="font-semibold text-slate-700">
            {formatDate(formData.preferredDate)} · {formatTime(formData.preferredTime)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <Phone className="w-4 h-4 text-teal-500 shrink-0" />
        <div>
          <span className="text-slate-400">Confirmation sent to</span>
          <p className="font-semibold text-slate-700">{formData.phone}</p>
        </div>
      </div>
      <div className="pt-2 border-t border-slate-200">
        <p className="text-xs text-slate-400">
          Booking ID: <span className="font-mono text-teal-600">{result.bookingId}</span>
        </p>
      </div>
    </div>

    {/* Note */}
    <p className="text-sm text-slate-400 mb-8">
      📱 A confirmation message will be sent to your WhatsApp within 24 hours.
    </p>

    <button
      onClick={onReset}
      className="inline-flex items-center gap-2 text-teal-600 font-semibold
                 hover:text-teal-700 transition-colors"
    >
      <ArrowLeft className="w-4 h-4" />
      Book Another Appointment
    </button>
  </div>
);
