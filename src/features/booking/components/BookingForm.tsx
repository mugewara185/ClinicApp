/**
 * BookingForm Component
 * React Hook Form + Zod form for clinic appointment booking.
 * Submits via BookingService which sends WhatsApp notification.
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  User, Phone, Calendar, Clock, MessageSquare, Send, Loader2, ChevronDown, AlertCircle,
} from 'lucide-react';
import { clsx } from 'clsx';
import { componentLogger } from '../../../framework/logging/domains/component';
import { logger } from '../../../framework/logging/core/Logger';
import { bookingSchema, SESSION_TYPES, TIME_SLOTS, type BookingFormData } from '../schemas/booking.schema';
import type { BookingResult } from '../services/BookingService';

// ---------------------------------------------------------------------------
// Field wrapper
// ---------------------------------------------------------------------------
const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="text-red-500 text-xs mt-1.5">{message}</p> : null;

// Minimum selectable date (tomorrow)
const getMinDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

const getMaxDate = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + 3);
  return d.toISOString().split('T')[0];
};

interface Props {
  onSuccess: (result: BookingResult, formData: BookingFormData) => void;
  onError?: (errorMessage: string) => void;
}

export const BookingForm = ({ onSuccess, onError }: Props) => {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    mode: 'onChange',
  });

  useEffect(() => {
    componentLogger.mount('BookingForm');
    logger.info('booking:form', 'Booking form initialized');
    return () => componentLogger.unmount('BookingForm');
  }, []);

  const onSubmit = async (data: BookingFormData) => {
    setSubmitError(null);
    logger.info('booking:form:submit', 'Form submitted', {
      session: data.sessionType,
      date: data.preferredDate,
      time: data.preferredTime,
      hasNotes: Boolean(data.message?.trim()),
    });

    try {
      // Dynamic import of BookingService to keep initial bundle lean
      const { BookingService } = await import('../services/BookingService');
      const result = await BookingService.submit(data);
      onSuccess(result, data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('booking:form:error', 'Booking submission failed', {
        error: error.message,
      });
      setSubmitError(error.message);
      onError?.(error.message);
    }
  };

  const inputClass = (hasError?: boolean) =>
    clsx(
      'w-full px-4 py-3 rounded-xl border text-slate-700 text-sm',
      'focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent',
      'transition-colors placeholder:text-slate-400',
      hasError
        ? 'border-red-300 bg-red-50'
        : 'border-slate-200 bg-white hover:border-slate-300'
    );

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label="Appointment booking form"
      className="space-y-5"
    >
      {/* Row 1: Name + Phone */}
      <div className="grid sm:grid-cols-2 gap-5">
        {/* Full Name */}
        <div>
          <label htmlFor="fullName" className="block text-sm font-semibold text-slate-700 mb-1.5">
            Full Name <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              {...register('fullName')}
              id="fullName"
              type="text"
              placeholder="e.g. Layla Al-Ahmad"
              autoComplete="name"
              className={clsx(inputClass(!!errors.fullName), 'pl-10')}
            />
          </div>
          <FieldError message={errors.fullName?.message} />
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 mb-1.5">
            Phone / WhatsApp <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              {...register('phone')}
              id="phone"
              type="tel"
              placeholder="05xxxxxxxx or +966xxxxxxxxx"
              autoComplete="tel"
              className={clsx(inputClass(!!errors.phone), 'pl-10')}
            />
          </div>
          <FieldError message={errors.phone?.message} />
        </div>
      </div>

      {/* Session Type */}
      <div>
        <label htmlFor="sessionType" className="block text-sm font-semibold text-slate-700 mb-1.5">
          Session Type <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <select
            {...register('sessionType')}
            id="sessionType"
            className={clsx(inputClass(!!errors.sessionType), 'appearance-none pr-10')}
            defaultValue=""
          >
            <option value="" disabled>Select a session type…</option>
            {SESSION_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
        <FieldError message={errors.sessionType?.message} />
      </div>

      {/* Row 2: Date + Time */}
      <div className="grid sm:grid-cols-2 gap-5">
        {/* Date */}
        <div>
          <label htmlFor="preferredDate" className="block text-sm font-semibold text-slate-700 mb-1.5">
            Preferred Date <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              {...register('preferredDate')}
              id="preferredDate"
              type="date"
              min={getMinDate()}
              max={getMaxDate()}
              className={clsx(inputClass(!!errors.preferredDate), 'pl-10')}
            />
          </div>
          <FieldError message={errors.preferredDate?.message} />
        </div>

        {/* Time */}
        <div>
          <label htmlFor="preferredTime" className="block text-sm font-semibold text-slate-700 mb-1.5">
            Preferred Time <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              {...register('preferredTime')}
              id="preferredTime"
              defaultValue=""
              className={clsx(inputClass(!!errors.preferredTime), 'pl-10 appearance-none pr-10')}
            >
              <option value="" disabled>Select time…</option>
              {TIME_SLOTS.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <FieldError message={errors.preferredTime?.message} />
        </div>
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className="block text-sm font-semibold text-slate-700 mb-1.5">
          Additional Notes{' '}
          <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <div className="relative">
          <MessageSquare className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
          <textarea
            {...register('message')}
            id="message"
            rows={3}
            maxLength={500}
            placeholder="Any specific concerns, goals, or questions you'd like to share…"
            className={clsx(inputClass(!!errors.message), 'pl-10 resize-none')}
          />
        </div>
        <FieldError message={errors.message?.message} />
      </div>

      {/* Submission Error Banner */}
      {submitError && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-3 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm"
        >
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Unable to send appointment notification</p>
            <p className="text-red-600 leading-relaxed">{submitError}</p>
            <p className="text-xs text-red-500">
              Your appointment request has not been saved or delivered yet. Please try again or contact the clinic directly by phone or WhatsApp.
            </p>
          </div>
        </div>
      )}

      {/* Privacy note */}
      <p className="text-xs text-slate-400 flex items-start gap-1.5">
        <span>🔒</span>
        Your information is confidential and used only to notify the clinic of your appointment request.
        Additional notes are kept private and excluded from WhatsApp notifications.
      </p>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting || !isValid}
        className={clsx(
          'w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-lg',
          'transition-all shadow-md hover:shadow-lg',
          isSubmitting || !isValid
            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
            : 'bg-teal-600 hover:bg-teal-700 text-white hover:scale-[1.01]'
        )}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Sending Request…
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Request Appointment
          </>
        )}
      </button>
    </form>
  );
};
