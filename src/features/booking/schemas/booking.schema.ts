/**
 * Booking Form Zod Schema
 * Validates all booking form fields. Compatible with Zod v3 and v4.
 */

import { z } from 'zod';

// Available time slots
export const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00',
  '14:00', '15:00', '16:00', '17:00', '18:00',
] as const;

export const SESSION_TYPES = [
  'Individual Therapy',
  'Cognitive Behavioral Therapy',
  'Anxiety & Stress Management',
  'Trauma & EMDR Therapy',
  'Couples Therapy',
  'Child & Adolescent Psychology',
  'Free Consultation',
] as const;

// Minimum date: tomorrow
const getTomorrowDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

export const bookingSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Please enter your full name (at least 2 characters)')
    .max(80, 'Name is too long'),

  phone: z
    .string()
    .min(9, 'Phone number is too short')
    .max(20, 'Phone number is too long')
    .regex(
      /^(\+966|00966|0)?[0-9\s\-().]{7,16}$/,
      'Please enter a valid phone number (e.g. 0512345678 or +966512345678)'
    ),

  sessionType: z
    .string()
    .refine(
      (val) => (SESSION_TYPES as readonly string[]).includes(val),
      { message: 'Please select a valid session type' }
    ),

  preferredDate: z
    .string()
    .min(1, 'Please select a date')
    .refine(
      (d) => new Date(d) >= new Date(getTomorrowDate()),
      'Please select a date starting from tomorrow'
    ),

  preferredTime: z
    .string()
    .refine(
      (val) => (TIME_SLOTS as readonly string[]).includes(val),
      { message: 'Please select a valid time slot' }
    ),

  message: z
    .string()
    .max(500, 'Message is too long (max 500 characters)')
    .optional(),
});

export type BookingFormData = z.infer<typeof bookingSchema>;
