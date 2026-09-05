/**
 * Application Error Messages
 */

export const ERRORS = {
  NETWORK:          'Network error. Please check your connection.',
  SERVER:           'Server error. Please try again later.',
  VALIDATION:       'Please check the form fields and try again.',
  BOOKING_FAILED:   'Booking submission failed. Please try again or call us directly.',
  WHATSAPP_FAILED:  'Could not send WhatsApp notification. Booking was still received.',
  WHATSAPP_SUCCESS: 'WhatsApp notification sent successfully.',
  UNKNOWN:          'An unexpected error occurred.',
} as const;
