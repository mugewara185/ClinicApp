/**
 * BookingService
 * Validates booking data and dispatches WhatsApp notifications via the server-side endpoint.
 *
 * Mode selection:
 * - Mock mode (`mockBooking` enabled, `whatsappEnabled` disabled): Simulates notification in dev
 *   and clearly marks the result as `mode: 'mock'`, `deliveryStatus: 'simulated'`.
 * - Real mode (`whatsappEnabled` enabled, `mockBooking` disabled): Sends POST request to
 *   `/api/booking/whatsapp`, which validates fields and calls CallMeBot from the server using
 *   server-only credentials (`CALLMEBOT_PHONE`, `CALLMEBOT_APIKEY`, `WHATSAPP_ENABLED`).
 * - Disabled (`whatsappEnabled` and `mockBooking` both false, e.g. unconfigured production):
 *   Fails with an actionable configuration error instead of silently mocking.
 *
 * Privacy:
 * - Never logs API keys, phone numbers, patient names, or appointment notes.
 * - Never includes patient free-text notes (`message`) in the WhatsApp notification payload.
 */

import axios from 'axios';
import { logger } from '../../../framework/logging/core/Logger';
import { apiLogger } from '../../../framework/logging/domains/api';
import { features, apiSimulator } from '../../../framework/init';
import { createResponse, createErrorResponse } from '../../../shared/utils/response';
import { formatDate, formatTime } from '../../../shared/utils/formatters';
import { ERRORS } from '../../../shared/constants/errors';
import { bookingSchema, type BookingFormData } from '../schemas/booking.schema';
import type { NormalizedBookingNotificationResponse } from '../../../server/whatsappNotification';

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

export const BOOKING_NOTIFICATION_ENDPOINT = '/api/booking/whatsapp';
const CLIENT_TIMEOUT_MS = 12_000;

export interface BookingResult {
  success: boolean;
  bookingId: string;
  message: string;
  mode?: 'real' | 'mock';
  deliveryStatus?: 'accepted' | 'simulated';
}

export interface BookingTransportResponse {
  status: number;
  data: NormalizedBookingNotificationResponse;
}

export type BookingTransport = (
  endpoint: string,
  payload: {
    bookingId: string;
    fullName: string;
    phone: string;
    sessionType: string;
    preferredDate: string;
    preferredTime: string;
  },
  options: { timeoutMs: number }
) => Promise<BookingTransportResponse>;

export interface BookingSubmitOptions {
  transport?: BookingTransport;
  mockDelayMs?: number;
}

// ---------------------------------------------------------------------------
// Default HTTP Transport (calls server endpoint, never CallMeBot directly)
// ---------------------------------------------------------------------------

const defaultBookingTransport: BookingTransport = async (endpoint, payload, { timeoutMs }) => {
  const response = await axios.post<NormalizedBookingNotificationResponse>(endpoint, payload, {
    timeout: timeoutMs,
    headers: { 'Content-Type': 'application/json' },
    validateStatus: () => true,
  });

  return {
    status: response.status,
    data: response.data,
  };
};

// ---------------------------------------------------------------------------
// Mode Resolution
// ---------------------------------------------------------------------------

export const resolveBookingMode = (): 'real' | 'mock' => {
  const whatsappEnabled = features.isEnabled('whatsappEnabled');
  const mockBooking = features.isEnabled('mockBooking');

  if (whatsappEnabled && !mockBooking) {
    return 'real';
  }

  if (mockBooking) {
    return 'mock';
  }

  throw new Error(
    'WhatsApp notifications are not enabled. Configure WHATSAPP_ENABLED=true with server credentials, or enable mockBooking for local testing.'
  );
};

// ---------------------------------------------------------------------------
// Server-Backed WhatsApp Notification (Real Mode)
// ---------------------------------------------------------------------------

const sendWhatsAppNotification = async (
  bookingId: string,
  data: BookingFormData,
  transport: BookingTransport = defaultBookingTransport
): Promise<NormalizedBookingNotificationResponse> => {
  // Minimize payload sent to server & WhatsApp: exclude free-text `message` (patient notes)
  const payload = {
    bookingId,
    fullName: data.fullName.trim(),
    phone: data.phone.trim(),
    sessionType: data.sessionType,
    preferredDate: data.preferredDate,
    preferredTime: data.preferredTime,
  };

  logger.info('booking:whatsapp', 'Dispatching booking notification to server endpoint', {
    bookingId,
    endpoint: BOOKING_NOTIFICATION_ENDPOINT,
    session: data.sessionType,
    date: data.preferredDate,
    time: data.preferredTime,
  });

  apiLogger.request('POST', BOOKING_NOTIFICATION_ENDPOINT, {
    bookingId,
    sessionType: data.sessionType,
  });

  const span = logger.startSpan('booking:whatsapp:send');

  return apiSimulator.simulateFetch('booking:whatsapp', async () => {
    let response: BookingTransportResponse;
    try {
      response = await transport(BOOKING_NOTIFICATION_ENDPOINT, payload, {
        timeoutMs: CLIENT_TIMEOUT_MS,
      });
    } catch (err) {
      const isTimeout =
        axios.isAxiosError(err) &&
        (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT' || /timeout/i.test(err.message));
      const netMessage = isTimeout
        ? 'Request to the booking notification server timed out. Please try again.'
        : ERRORS.NETWORK;

      apiLogger.error(BOOKING_NOTIFICATION_ENDPOINT, {
        bookingId,
        reason: isTimeout ? 'timeout' : 'network_error',
      });
      throw new Error(netMessage);
    }

    span.end({ status: response.status, bookingId });
    apiLogger.response('POST', BOOKING_NOTIFICATION_ENDPOINT, response.status, {
      bookingId,
      success: Boolean(response.data?.success),
      deliveryStatus: response.data?.deliveryStatus ?? 'failed',
    });

    if (
      response.status < 200 ||
      response.status >= 300 ||
      !response.data?.success ||
      response.data?.deliveryStatus !== 'accepted'
    ) {
      const serverErrorMsg =
        response.data?.error?.message ||
        (response.status >= 500 ? ERRORS.SERVER : ERRORS.WHATSAPP_FAILED);

      apiLogger.error(BOOKING_NOTIFICATION_ENDPOINT, {
        bookingId,
        status: response.status,
        code: response.data?.error?.code ?? 'UNKNOWN_ERROR',
      });

      throw new Error(serverErrorMsg);
    }

    return response.data;
  });
};

// ---------------------------------------------------------------------------
// Mock Mode (Development / Explicit Simulation Only)
// ---------------------------------------------------------------------------

const mockSendWhatsApp = async (
  bookingId: string,
  data: BookingFormData,
  delayMs = 400
): Promise<void> => {
  const span = logger.startSpan('booking:whatsapp:mock');

  logger.info('booking:whatsapp:mock', 'SIMULATED — WhatsApp notification mocked (no real message sent)', {
    bookingId,
    session: data.sessionType,
    date: data.preferredDate,
    time: data.preferredTime,
    simulated: true,
  });

  await apiSimulator.simulateFetch('booking:whatsapp', async () => {
    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  });

  span.end({ bookingId, mocked: true });
  logger.info('booking:whatsapp:mock', 'Simulated WhatsApp notification completed', {
    bookingId,
    simulated: true,
  });
};

// ---------------------------------------------------------------------------
// Public BookingService
// ---------------------------------------------------------------------------

export const BookingService = {
  /**
   * Submit a booking: validate, determine mode, and send or simulate WhatsApp notification.
   */
  async submit(
    data: BookingFormData,
    options: BookingSubmitOptions = {}
  ): Promise<BookingResult> {
    const bookingId = `BK-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

    // Validate on client before sending (defense-in-depth; server validates again)
    const parsed = bookingSchema.safeParse(data);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message ?? ERRORS.VALIDATION;
      logger.warn('booking:validation', 'Client-side booking validation failed', {
        bookingId,
      });
      throw new Error(firstIssue);
    }

    const validData = parsed.data;

    logger.info('booking:submit', 'Processing booking request', {
      bookingId,
      session: validData.sessionType,
      date: validData.preferredDate,
      time: validData.preferredTime,
      hasNotes: Boolean(validData.message?.trim()),
    });

    try {
      const mode = resolveBookingMode();

      if (mode === 'mock') {
        logger.debug('booking:mode', 'Executing in simulated mock mode', {
          bookingId,
          mode: 'mock',
        });
        await mockSendWhatsApp(bookingId, validData, options.mockDelayMs ?? 400);

        logger.info('booking:success', 'Booking request simulated (mock mode)', {
          bookingId,
          mode: 'mock',
          deliveryStatus: 'simulated',
        });

        const response = createResponse<BookingResult>({
          success: true,
          bookingId,
          mode: 'mock',
          deliveryStatus: 'simulated',
          message: `Simulated appointment request for ${formatDate(validData.preferredDate)} at ${formatTime(validData.preferredTime)} (mock mode — no real WhatsApp notification was sent).`,
        });

        return response.data!;
      }

      logger.info('booking:mode', 'Executing in real WhatsApp notification mode', {
        bookingId,
        mode: 'real',
      });

      const serverResult = await sendWhatsAppNotification(
        bookingId,
        validData,
        options.transport
      );

      const finalBookingId = serverResult.bookingId || bookingId;

      logger.info('booking:success', 'Booking notification accepted by provider', {
        bookingId: finalBookingId,
        mode: 'real',
        deliveryStatus: 'accepted',
      });

      const response = createResponse<BookingResult>({
        success: true,
        bookingId: finalBookingId,
        mode: 'real',
        deliveryStatus: 'accepted',
        message: `Appointment request submitted for ${formatDate(validData.preferredDate)} at ${formatTime(validData.preferredTime)}; notification accepted by the provider. The clinic will contact you within 24 hours to confirm.`,
      });

      return response.data!;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));

      logger.error('booking:error', 'Booking notification failed', {
        bookingId,
        error: error.message,
      });

      const errResponse = createErrorResponse(error.message, 'BOOKING_FAILED');
      throw new Error(errResponse.error?.message ?? ERRORS.BOOKING_FAILED);
    }
  },
};
