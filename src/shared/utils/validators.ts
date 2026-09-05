/**
 * Shared Validators
 * Pure validation functions used by Zod schemas and utilities.
 */

/** Validate Saudi or international phone number */
export const isValidPhone = (phone: string): boolean => {
  // Accept: 05xxxxxxxx, +966xxxxxxxxx, 00966xxxxxxxxx
  const cleaned = phone.replace(/[\s\-().]/g, '');
  return /^(\+966|00966|0)?[5][0-9]{8}$/.test(cleaned) || /^\+?\d{8,15}$/.test(cleaned);
};

/** Basic email validation */
export const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/** Check date is not in the past */
export const isNotPastDate = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
};

/** Check date is within the next N months */
export const isWithinMonths = (dateStr: string, months: number): boolean => {
  const date = new Date(dateStr);
  const limit = new Date();
  limit.setMonth(limit.getMonth() + months);
  return date <= limit;
};
