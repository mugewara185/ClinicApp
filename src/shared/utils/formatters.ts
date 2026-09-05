/**
 * Shared Formatters
 * Date, phone, and text formatting utilities.
 */

/** Format a Date to a human-readable locale string */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year:    'numeric',
    month:   'long',
    day:     'numeric',
  });
};

/** Format time to 12-hour AM/PM */
export const formatTime = (time: string): string => {
  const [hourStr, minute] = time.split(':');
  const hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute} ${ampm}`;
};

/** Format a phone number to E.164 (strip non-digits then add +) */
export const formatPhoneE164 = (phone: string, countryCode = '966'): string => {
  const digits = phone.replace(/\D/g, '');
  // If already starts with country code, keep it
  if (digits.startsWith(countryCode)) return `+${digits}`;
  // Remove leading 0 if present (Saudi mobile: 05xxxxxxxx)
  const cleaned = digits.startsWith('0') ? digits.slice(1) : digits;
  return `+${countryCode}${cleaned}`;
};

/** Truncate text to a max length with ellipsis */
export const truncate = (text: string, maxLength: number): string =>
  text.length <= maxLength ? text : `${text.slice(0, maxLength)}…`;

/** Capitalize first letter */
export const capitalize = (text: string): string =>
  text.charAt(0).toUpperCase() + text.slice(1);
