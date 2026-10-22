/**
 * Application Error Messages
 */

export const ERRORS = {
  NETWORK:          'Network error. Please check your connection and try again.',
  SERVER:           'Server error. Please try again later.',
  VALIDATION:       'Please check the form fields and try again.',
  BOOKING_FAILED:   'Booking submission failed. Please try again or contact the clinic directly.',
  WHATSAPP_FAILED:  'Could not send the WhatsApp notification to the clinic. Your appointment request was not delivered — please try again or contact us directly.',
  WHATSAPP_SUCCESS: 'Appointment request submitted; notification accepted by the provider.',
  UNKNOWN:          'An unexpected error occurred.',
} as const;

