/**
 * Clinic Info Schema
 * Static clinic information — not generated, just typed constants.
 */

export interface ClinicInfo {
  name: string;
  tagline: string;
  address: string;
  city: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  hours: {
    weekdays: string;
    saturday: string;
    sunday: string;
  };
  social: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
  };
}

export const CLINIC_INFO: ClinicInfo = {
  name:           'MindCare Clinic',
  tagline:        'Your Journey to Mental Wellness Starts Here',
  address:        'Al Olaya District, King Fahad Road',
  city:           'Riyadh, Saudi Arabia',
  phone:          '+966 11 234 5678',
  // Replace with the clinic owner's WhatsApp number (with country code, no +)
  whatsappNumber: import.meta.env.VITE_CALLMEBOT_PHONE ?? '8489347238',
  email:          'hello@mindcareclinic.sa',
  hours: {
    weekdays: 'Sunday – Thursday: 9:00 AM – 8:00 PM',
    saturday: 'Saturday: 10:00 AM – 4:00 PM',
    sunday:   'Friday: Closed',
  },
  social: {
    instagram: 'https://instagram.com/mindcareclinic',
    twitter:   'https://twitter.com/mindcareclinic',
    facebook:  'https://facebook.com/mindcareclinic',
  },
};
