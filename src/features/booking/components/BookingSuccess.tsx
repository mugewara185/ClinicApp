/**
 * Booking Success Component
 * Shown after a booking notification is accepted by the provider (or simulated in mock mode).
 * Accurately distinguishes provider acceptance vs simulated mode and notes that bookings are not persisted in a database.
 */

import { CheckCircle, Calendar, Phone, ArrowLeft, ShieldAlert } from 'lucide-react';
import type { BookingResult } from '../services/BookingService';
import { formatDate, formatTime } from '../../../shared/utils/formatters';
import type { BookingFormData } from '../schemas/booking.schema';

interface Props {
  result: BookingResult;
  formData: BookingFormData;
  onReset: () => void;
}

export const BookingSuccess = ({ result, formData, onReset }: Props) => {
  const isSimulated = result.mode === 'mock' || result.deliveryStatus === 'simulated';

  return (
    <div className="text-center py-10 px-4">
      {/* Status icon */}
      <div
        className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce ${
          isSimulated ? 'bg-amber-100' : 'bg-emerald-100'
        }`}
      >
        {isSimulated ? (
          <ShieldAlert className="w-10 h-10 text-amber-600" />
        ) : (
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        )}
      </div>

      {isSimulated && (
        <span className="inline-block px-3 py-1 mb-3 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
          Simulated Mode — No Real WhatsApp Sent
        </span>
      )}

      <h2 className="text-2xl font-bold text-slate-800 mb-2">
        {isSimulated ? 'Appointment Request Simulated' : 'Appointment Request Submitted!'}
      </h2>
      <p className="text-slate-500 mb-8 max-w-md mx-auto leading-relaxed">
        {result.message}
      </p>

      {/* Booking details card */}
      <div className="bg-slate-50 rounded-2xl p-6 text-left max-w-sm mx-auto mb-6 space-y-3">
        <div className="flex items-center gap-3 text-sm">
          <Calendar className="w-4 h-4 text-teal-500 shrink-0" />
          <div>
            <span className="text-slate-400">Requested Date & Time</span>
            <p className="font-semibold text-slate-700">
              {formatDate(formData.preferredDate)} · {formatTime(formData.preferredTime)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Phone className="w-4 h-4 text-teal-500 shrink-0" />
          <div>
            <span className="text-slate-400">Patient contact number</span>
            <p className="font-semibold text-slate-700">{formData.phone}</p>
          </div>
        </div>
        <div className="pt-2 border-t border-slate-200 space-y-1">
          <p className="text-xs text-slate-500">
            Notification Status:{' '}
            <span className={isSimulated ? 'font-semibold text-amber-700' : 'font-semibold text-emerald-700'}>
              {isSimulated
                ? 'Simulated (mock mode)'
                : 'Accepted by WhatsApp provider (queued)'}
            </span>
          </p>
          <p className="text-xs text-slate-400">
            Booking ID: <span className="font-mono text-teal-600">{result.bookingId}</span>
          </p>
        </div>
      </div>

      {/* Persistence & confirmation clarification */}
      <p className="text-xs text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
        {isSimulated
          ? '🛠️ This request was simulated locally in mock mode; no message was sent to the clinic and no booking record is stored.'
          : '📱 Provider acceptance means your notification was queued for the clinic (not yet read or confirmed, and not stored in a database). Please keep your Booking ID until the clinic contacts you within 24 hours.'}
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
};
