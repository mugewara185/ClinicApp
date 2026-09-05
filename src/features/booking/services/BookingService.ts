/**
 * BookingService
 * Validates booking data and sends WhatsApp notification via CallMeBot.
 *
 * In DEV mode (VITE_WHATSAPP_ENABLED !== 'true'): mocks the API call with logging.
 * In PROD mode: sends real GET request to CallMeBot WhatsApp API.
 *
 * CallMeBot Setup (clinic owner):
 *   1. Save +34 644 59 77 39 in WhatsApp contacts as "CallMeBot"
 *   2. Send: "I allow callmebot to send me messages"
 *   3. You receive an API key — put it in VITE_CALLMEBOT_APIKEY
 *
 * API: GET https://api.callmebot.com/whatsapp.php?phone=PHONE&text=MSG&apikey=KEY
 */

import axios from 'axios';
import { logger } from '../../../framework/logging/core/Logger';
import { apiLogger } from '../../../framework/logging/domains/api';
import { features } from '../../../framework/init';
import { apiSimulator } from '../../../framework/init';
import { createResponse, createErrorResponse } from '../../../shared/utils/response';
import { formatDate, formatTime } from '../../../shared/utils/formatters';
import { CLINIC_INFO } from '../../../framework/schemas/clinic';
import type { BookingFormData } from '../schemas/booking.schema';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface BookingResult {
  success: boolean;
  bookingId: string;
  message: string;
}

// ---------------------------------------------------------------------------
// WhatsApp message builder
// ---------------------------------------------------------------------------
const buildWhatsAppMessage = (data: BookingFormData): string => {
  const formattedDate = formatDate(data.preferredDate);
  const formattedTime = formatTime(data.preferredTime);

  const lines = [
    `🏥 *New Appointment Request — ${CLINIC_INFO.name}*`,
    ``,
    `👤 *Patient:* ${data.fullName}`,
    `📱 *Phone:* ${data.phone}`,
    `💆 *Session:* ${data.sessionType}`,
    `📅 *Date:* ${formattedDate}`,
    `⏰ *Time:* ${formattedTime}`,
    data.message ? `💬 *Notes:* ${data.message}` : '',
    ``,
    `📌 Reply to confirm or reschedule.`,
  ].filter(Boolean);

  return lines.join('\n');
};

// ---------------------------------------------------------------------------
// CallMeBot WhatsApp notification
// ---------------------------------------------------------------------------
const sendWhatsAppNotification = async (message: string): Promise<void> => {

  logger.info('----------->booking:whatsapp', 'Sending WhatsApp notification via CallMeBot', {
    to: CLINIC_INFO.whatsappNumber,
    messagePreview: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
  });

  const phone  = import.meta.env.VITE_CALLMEBOT_PHONE ?? CLINIC_INFO.whatsappNumber;
  const apikey = import.meta.env.VITE_CALLMEBOT_APIKEY ?? '';
  const endpoint = 'https://api.callmebot.com/whatsapp.php';

  const params = new URLSearchParams({
    phone,
    text: message,
    apikey,
  });

  const url = `${endpoint}?${params.toString()}`;

  apiLogger.request('GET', endpoint, { phone: '***', apikey: '***' });

  const span = logger.startSpan('booking:whatsapp:send');

  await apiSimulator.simulateFetch('booking:whatsapp', async () => {
    const response = await axios.get(url, { timeout: 10_000 });
    span.end({ status: response.status });
    apiLogger.response('GET', endpoint, response.status, { ok: true });
  });
};

// ---------------------------------------------------------------------------
// Mock for development
// ---------------------------------------------------------------------------
const mockSendWhatsApp = async (data: BookingFormData): Promise<void> => {
  const span = logger.startSpan('booking:whatsapp:mock');

  logger.info('booking:whatsapp:mock', 'DEV MODE — WhatsApp notification mocked', {
    to: CLINIC_INFO.whatsappNumber,
    patient: data.fullName,
    date: data.preferredDate,
    time: data.preferredTime,
  });

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  span.end({ mocked: true });
  logger.info('booking:whatsapp:mock', '✅ Mock WhatsApp notification sent successfully');
};

// ---------------------------------------------------------------------------
// Public BookingService
// ---------------------------------------------------------------------------
export const BookingService = {
  /**
   * Submit a booking: validate, log, and send WhatsApp notification.
   */
  async submit(data: BookingFormData): Promise<BookingResult> {
    const bookingId = `BK-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

    logger.info('booking:submit', 'Processing booking request', {
      bookingId,
      patient: data.fullName,
      session: data.sessionType,
      date: data.preferredDate,
      time: data.preferredTime,
    });

    try {
      const whatsappEnabled = features.isEnabled('whatsappEnabled');
      const isMockMode = features.isEnabled('mockBooking') || !whatsappEnabled;

      const message = buildWhatsAppMessage(data);

      if (isMockMode) {
        logger.debug('booking:mode', 'Using mock mode (dev)', { whatsappEnabled });
        await mockSendWhatsApp(data);
      } else {
        logger.info('booking:mode', 'Using real WhatsApp API (prod)');
        await sendWhatsAppNotification(message);
      }

      logger.info('booking:success', '✅ Booking completed', { bookingId });

      const response = createResponse<BookingResult>({
        success: true,
        bookingId,
        message: `Your appointment has been requested for ${formatDate(data.preferredDate)} at ${formatTime(data.preferredTime)}. We will confirm within 24 hours.`,
      });

      return response.data!;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));

      logger.error('booking:error', 'Booking failed', {
        bookingId,
        error: error.message,
      });

      const errResponse = createErrorResponse(error.message, 'BOOKING_FAILED');
      throw new Error(errResponse.error?.message ?? 'Booking failed');
    }
  },
};
