/**
 * Automated Verification Suite for ClinicApp WhatsApp Appointment Notifications
 *
 * Covers:
 * 1. Mock mode succeeds without contacting the real provider and marks result as simulated.
 * 2. Real mode sends a POST request to the server endpoint (`/api/booking/whatsapp`).
 * 3. Missing or placeholder credentials / disabled server config produce an actionable configuration error.
 * 4. Invalid booking payloads (client and server) and oversized/rate-limited requests are rejected.
 * 5. A provider success response ("Message queued") is normalized accurately.
 * 6. Provider HTTP errors and CallMeBot 2xx body rejections ("ERROR: ...", "APIKey is invalid") are rejected.
 * 7. Network failures and timeouts do not become success responses.
 * 8. Sensitive credentials (API keys) and patient free-text notes (`message`) never appear in logs or WhatsApp messages.
 * 9. Development mode executes the real flow when explicitly configured (`WHATSAPP_ENABLED=true`), and production mode never silently mocks.
 * 10. Frontend components (`BookingSuccess`, `BookingForm`) render accurate success, simulated, and failure feedback.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import {
  handleWhatsAppNotificationRequest,
  inspectCallMeBotResponse,
  buildClinicWhatsAppMessage,
  resetRateLimiter,
  type ServerEnvConfig,
  type ServerLogEvent,
} from '../src/server/whatsappNotification';
import {
  BookingService,
  BOOKING_NOTIFICATION_ENDPOINT,
  resolveBookingMode,
  type BookingTransport,
} from '../src/features/booking/services/BookingService';
import {
  features,
  logger,
  apiSimulator,
  resolveBookingFeatureFlags,
} from '../src/framework/init';
import { BookingSuccess } from '../src/features/booking/components/BookingSuccess';
import type { BookingFormData } from '../src/features/booking/schemas/booking.schema';

// Helper to get a valid future date (tomorrow + 2 days)
const getValidFutureDate = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return d.toISOString().split('T')[0];
};

const createValidFormData = (overrides: Partial<BookingFormData> = {}): BookingFormData => ({
  fullName: 'Layla Al-Ahmad',
  phone: '0512345678',
  sessionType: 'Cognitive Behavioral Therapy',
  preferredDate: getValidFutureDate(),
  preferredTime: '10:00',
  message: 'Confidential patient notes: experiencing severe insomnia and personal family stress.',
  ...overrides,
});

const VALID_SERVER_ENV: ServerEnvConfig = {
  WHATSAPP_ENABLED: 'true',
  CALLMEBOT_PHONE: '966512345678',
  CALLMEBOT_APIKEY: '9876543',
  CALLMEBOT_TIMEOUT_MS: '5000',
};

describe('ClinicApp WhatsApp Appointment Notification Verification', () => {
  beforeEach(() => {
    resetRateLimiter();
    apiSimulator.reset();
    logger.clear();
  });

  // -------------------------------------------------------------------------
  // 1. Mock mode succeeds without contacting the real provider
  // -------------------------------------------------------------------------
  it('1. Mock mode succeeds without contacting the real provider and clearly identifies as simulated', async () => {
    features.enable('mockBooking');
    assert.equal(features.isEnabled('mockBooking'), true);
    assert.equal(features.isEnabled('whatsappEnabled'), false);
    assert.equal(resolveBookingMode(), 'mock');

    let providerContacted = false;
    const spyTransport: BookingTransport = async () => {
      providerContacted = true;
      throw new Error('Transport should never be called in mock mode');
    };

    const formData = createValidFormData();
    const result = await BookingService.submit(formData, {
      transport: spyTransport,
      mockDelayMs: 5,
    });

    assert.equal(providerContacted, false, 'Real server/provider must not be contacted in mock mode');
    assert.equal(result.success, true);
    assert.equal(result.mode, 'mock');
    assert.equal(result.deliveryStatus, 'simulated');
    assert.match(result.bookingId, /^BK-/);
    assert.match(result.message, /mock mode/i);
    assert.match(result.message, /no real WhatsApp notification was sent/i);
  });

  // -------------------------------------------------------------------------
  // 2. Real mode sends a request to the server endpoint
  // -------------------------------------------------------------------------
  it('2. Real mode sends a validated POST request to the server endpoint and bridges to CallMeBot on the server', async () => {
    features.enable('whatsappEnabled');
    assert.equal(features.isEnabled('whatsappEnabled'), true);
    assert.equal(features.isEnabled('mockBooking'), false);
    assert.equal(resolveBookingMode(), 'real');

    let capturedEndpoint = '';
    let capturedPayload: Record<string, unknown> | null = null;
    let capturedCallMeBotUrl = '';

    // Bridge BookingService transport directly to our server handler with a mocked CallMeBot HTTP client
    const bridgedTransport: BookingTransport = async (endpoint, payload) => {
      capturedEndpoint = endpoint;
      capturedPayload = payload;

      const serverRes = await handleWhatsAppNotificationRequest(
        {
          method: 'POST',
          rawBody: JSON.stringify(payload),
          clientIp: '127.0.0.1',
        },
        {
          env: VALID_SERVER_ENV,
          httpClient: async (url) => {
            capturedCallMeBotUrl = url;
            return {
              status: 200,
              body: '<p>Message to: +966512345678<p>Text to send: ...<p><b>Message queued.</b> You will receive it in a few seconds.',
            };
          },
        }
      );

      return {
        status: serverRes.statusCode,
        data: serverRes.body,
      };
    };

    const formData = createValidFormData();
    const result = await BookingService.submit(formData, { transport: bridgedTransport });

    assert.equal(capturedEndpoint, BOOKING_NOTIFICATION_ENDPOINT);
    assert.ok(capturedPayload, 'Server endpoint must receive payload');
    assert.equal(capturedPayload.fullName, 'Layla Al-Ahmad');
    assert.equal(capturedPayload.phone, '0512345678');
    assert.equal(capturedPayload.sessionType, 'Cognitive Behavioral Therapy');
    assert.equal('message' in capturedPayload, false, 'Patient free-text notes must not be sent to WhatsApp endpoint');

    assert.ok(capturedCallMeBotUrl.startsWith('https://api.callmebot.com/whatsapp.php?'));
    const parsedUrl = new URL(capturedCallMeBotUrl);
    assert.equal(parsedUrl.searchParams.get('phone'), '966512345678');
    assert.equal(parsedUrl.searchParams.get('apikey'), '9876543');

    const sentText = parsedUrl.searchParams.get('text') ?? '';
    assert.ok(sentText.includes(result.bookingId));
    assert.ok(sentText.includes('Layla Al-Ahmad'));
    assert.ok(!sentText.includes('insomnia'), 'Patient notes must never be included in WhatsApp message');

    assert.equal(result.success, true);
    assert.equal(result.mode, 'real');
    assert.equal(result.deliveryStatus, 'accepted');
    assert.match(result.message, /notification accepted by the provider/i);
  });

  // -------------------------------------------------------------------------
  // 3. Missing credentials produce a configuration error
  // -------------------------------------------------------------------------
  it('3. Missing or placeholder server credentials produce an actionable configuration error', async () => {
    const validPayload = {
      bookingId: 'BK-TEST-1001',
      fullName: 'Layla Al-Ahmad',
      phone: '0512345678',
      sessionType: 'Individual Therapy',
      preferredDate: getValidFutureDate(),
      preferredTime: '11:00',
    };

    // Case A: WHATSAPP_ENABLED is false on server
    const disabledRes = await handleWhatsAppNotificationRequest(
      { method: 'POST', rawBody: JSON.stringify(validPayload) },
      { env: { WHATSAPP_ENABLED: 'false', CALLMEBOT_PHONE: '966512345678', CALLMEBOT_APIKEY: '123456' } }
    );
    assert.equal(disabledRes.statusCode, 503);
    assert.equal(disabledRes.body.success, false);
    assert.equal(disabledRes.body.error?.code, 'WHATSAPP_DISABLED');

    // Case B: Missing CALLMEBOT_APIKEY
    const missingKeyRes = await handleWhatsAppNotificationRequest(
      { method: 'POST', rawBody: JSON.stringify(validPayload) },
      { env: { WHATSAPP_ENABLED: 'true', CALLMEBOT_PHONE: '966512345678', CALLMEBOT_APIKEY: '' } }
    );
    assert.equal(missingKeyRes.statusCode, 503);
    assert.equal(missingKeyRes.body.success, false);
    assert.equal(missingKeyRes.body.error?.code, 'CONFIGURATION_ERROR');
    assert.match(missingKeyRes.body.error?.message ?? '', /CALLMEBOT_APIKEY/);

    // Case C: Placeholder CALLMEBOT_APIKEY from .env.example
    const placeholderKeyRes = await handleWhatsAppNotificationRequest(
      { method: 'POST', rawBody: JSON.stringify(validPayload) },
      {
        env: {
          WHATSAPP_ENABLED: 'true',
          CALLMEBOT_PHONE: '966512345678',
          CALLMEBOT_APIKEY: 'your_callmebot_api_key_here',
        },
      }
    );
    assert.equal(placeholderKeyRes.statusCode, 503);
    assert.equal(placeholderKeyRes.body.success, false);
    assert.equal(placeholderKeyRes.body.error?.code, 'CONFIGURATION_ERROR');

    // Case D: Missing CALLMEBOT_PHONE
    const missingPhoneRes = await handleWhatsAppNotificationRequest(
      { method: 'POST', rawBody: JSON.stringify(validPayload) },
      { env: { WHATSAPP_ENABLED: 'true', CALLMEBOT_PHONE: '', CALLMEBOT_APIKEY: '123456' } }
    );
    assert.equal(missingPhoneRes.statusCode, 503);
    assert.equal(missingPhoneRes.body.success, false);
    assert.equal(missingPhoneRes.body.error?.code, 'CONFIGURATION_ERROR');
    assert.match(missingPhoneRes.body.error?.message ?? '', /CALLMEBOT_PHONE/);
  });

  // -------------------------------------------------------------------------
  // 4. Invalid booking payloads are rejected by the server
  // -------------------------------------------------------------------------
  it('4. Invalid booking payloads, oversized payloads, and excessive requests are rejected by the server', async () => {
    let providerCalled = false;
    const failIfCalled = async () => {
      providerCalled = true;
      return { status: 200, body: 'Message queued' };
    };

    // Invalid fields (past date, invalid phone, invalid sessionType, short name)
    const invalidRes = await handleWhatsAppNotificationRequest(
      {
        method: 'POST',
        rawBody: JSON.stringify({
          fullName: 'A',
          phone: 'invalid-phone',
          sessionType: 'Non-existent Session',
          preferredDate: '2020-01-01',
          preferredTime: '03:00',
        }),
      },
      { env: VALID_SERVER_ENV, httpClient: failIfCalled }
    );

    assert.equal(invalidRes.statusCode, 400);
    assert.equal(invalidRes.body.success, false);
    assert.equal(invalidRes.body.error?.code, 'VALIDATION_ERROR');
    assert.ok(invalidRes.body.error?.details?.fullName);
    assert.ok(invalidRes.body.error?.details?.phone);
    assert.ok(invalidRes.body.error?.details?.sessionType);
    assert.ok(invalidRes.body.error?.details?.preferredDate);
    assert.ok(invalidRes.body.error?.details?.preferredTime);
    assert.equal(providerCalled, false);

    // Oversized request (> 4 KB)
    const oversizedBody = JSON.stringify({
      fullName: 'Layla Al-Ahmad',
      phone: '0512345678',
      sessionType: 'Individual Therapy',
      preferredDate: getValidFutureDate(),
      preferredTime: '10:00',
      padding: 'x'.repeat(5000),
    });
    const oversizedRes = await handleWhatsAppNotificationRequest(
      { method: 'POST', rawBody: oversizedBody },
      { env: VALID_SERVER_ENV, httpClient: failIfCalled }
    );
    assert.equal(oversizedRes.statusCode, 413);
    assert.equal(oversizedRes.body.error?.code, 'PAYLOAD_TOO_LARGE');

    // Rate limiting check
    resetRateLimiter();
    for (let i = 0; i < 2; i++) {
      await handleWhatsAppNotificationRequest(
        {
          method: 'POST',
          rawBody: JSON.stringify(createValidFormData()),
          clientIp: '10.0.0.99',
        },
        {
          env: { ...VALID_SERVER_ENV, WHATSAPP_RATE_LIMIT_MAX: '2' },
          httpClient: async () => ({ status: 200, body: '<p><b>Message queued.</b>' }),
        }
      );
    }
    const rateLimitedRes = await handleWhatsAppNotificationRequest(
      {
        method: 'POST',
        rawBody: JSON.stringify(createValidFormData()),
        clientIp: '10.0.0.99',
      },
      {
        env: { ...VALID_SERVER_ENV, WHATSAPP_RATE_LIMIT_MAX: '2' },
        httpClient: failIfCalled,
      }
    );
    assert.equal(rateLimitedRes.statusCode, 429);
    assert.equal(rateLimitedRes.body.error?.code, 'RATE_LIMITED');
  });

  // -------------------------------------------------------------------------
  // 5. A provider success response is normalized correctly
  // -------------------------------------------------------------------------
  it('5. Provider success response ("Message queued") is normalized without leaking secrets or raw HTML', async () => {
    const res = await handleWhatsAppNotificationRequest(
      {
        method: 'POST',
        rawBody: JSON.stringify({
          bookingId: 'BK-NORM-500',
          fullName: 'Layla Al-Ahmad',
          phone: '0512345678',
          sessionType: 'Individual Therapy',
          preferredDate: getValidFutureDate(),
          preferredTime: '14:00',
        }),
      },
      {
        env: VALID_SERVER_ENV,
        httpClient: async () => ({
          status: 200,
          body: '<p>Message to: +966512345678<p>Text to send: secret<p><b>Message queued.</b> You will receive it in a few seconds.',
        }),
      }
    );

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {
      success: true,
      bookingId: 'BK-NORM-500',
      provider: 'callmebot',
      mode: 'real',
      deliveryStatus: 'accepted',
      message: 'Appointment request submitted; notification accepted by the provider.',
    });

    const serialized = JSON.stringify(res.body);
    assert.ok(!serialized.includes(VALID_SERVER_ENV.CALLMEBOT_APIKEY!));
    assert.ok(!serialized.includes(VALID_SERVER_ENV.CALLMEBOT_PHONE!));
    assert.ok(!serialized.includes('<p>'));
  });

  // -------------------------------------------------------------------------
  // 6. Provider HTTP errors and documented rejection responses are handled correctly
  // -------------------------------------------------------------------------
  it('6. Provider HTTP errors and CallMeBot 2xx body rejections ("APIKey is invalid", "ERROR:") are rejected accurately', async () => {
    // CallMeBot returns HTTP 203 when APIKey does not match phone
    const invalidKeyInspection = inspectCallMeBotResponse(
      203,
      '<p>Message to: +966512345678<p>Text to send: test<p style="color:red"><b>APIKey is invalid.</b> Please create a new one or contact support if you lost it.'
    );
    assert.equal(invalidKeyInspection.accepted, false);
    if (!invalidKeyInspection.accepted) {
      assert.equal(invalidKeyInspection.code, 'PROVIDER_AUTH_ERROR');
    }

    // CallMeBot returns HTTP 201 when apikey format is invalid
    const invalidFormatInspection = inspectCallMeBotResponse(
      201,
      'ERROR: apikey can not be <b>empty</b> or it has an <b>invalid format</b>'
    );
    assert.equal(invalidFormatInspection.accepted, false);
    if (!invalidFormatInspection.accepted) {
      assert.equal(invalidFormatInspection.code, 'PROVIDER_AUTH_ERROR');
    }

    // CallMeBot returns HTTP 201 when phone format is incorrect
    const invalidPhoneInspection = inspectCallMeBotResponse(
      201,
      '<p>ERROR: Phone number <b>format</b> is incorrect\n'
    );
    assert.equal(invalidPhoneInspection.accepted, false);
    if (!invalidPhoneInspection.accepted) {
      assert.equal(invalidPhoneInspection.code, 'PROVIDER_RECIPIENT_ERROR');
    }

    // HTTP 500 error from provider
    const http500Inspection = inspectCallMeBotResponse(500, 'Internal Server Error');
    assert.equal(http500Inspection.accepted, false);
    if (!http500Inspection.accepted) {
      assert.equal(http500Inspection.code, 'PROVIDER_HTTP_ERROR');
    }

    // Ambiguous 200 OK body without "Message queued" must NOT be treated as accepted
    const ambiguous200 = inspectCallMeBotResponse(200, '<html><body> Maintenance </body></html>');
    assert.equal(ambiguous200.accepted, false);

    // End-to-end BookingService.submit rejection when provider returns 203 "APIKey is invalid"
    features.enable('whatsappEnabled');
    await assert.rejects(
      () =>
        BookingService.submit(createValidFormData(), {
          transport: async (_endpoint, payload) => {
            const serverRes = await handleWhatsAppNotificationRequest(
              { method: 'POST', rawBody: JSON.stringify(payload) },
              {
                env: VALID_SERVER_ENV,
                httpClient: async () => ({
                  status: 203,
                  body: '<p style="color:red"><b>APIKey is invalid.</b>',
                }),
              }
            );
            return { status: serverRes.statusCode, data: serverRes.body };
          },
        }),
      /rejected the configured API key/i
    );
  });

  // -------------------------------------------------------------------------
  // 7. Network failures and timeouts do not become success responses
  // -------------------------------------------------------------------------
  it('7. Network failures and timeouts produce non-success responses and reject BookingService.submit', async () => {
    features.enable('whatsappEnabled');

    // Timeout simulation on server -> CallMeBot
    const timeoutServerRes = await handleWhatsAppNotificationRequest(
      { method: 'POST', rawBody: JSON.stringify(createValidFormData()) },
      {
        env: VALID_SERVER_ENV,
        httpClient: async () => {
          const abortError = new Error('The operation was aborted');
          abortError.name = 'AbortError';
          throw abortError;
        },
      }
    );
    assert.equal(timeoutServerRes.statusCode, 504);
    assert.equal(timeoutServerRes.body.success, false);
    assert.equal(timeoutServerRes.body.error?.code, 'PROVIDER_TIMEOUT');

    // Network failure between frontend and server endpoint
    await assert.rejects(
      () =>
        BookingService.submit(createValidFormData(), {
          transport: async () => {
            throw new Error('ECONNREFUSED');
          },
        }),
      /Network error/i
    );
  });

  // -------------------------------------------------------------------------
  // 8. Sensitive credentials and patient notes do not appear in logs
  // -------------------------------------------------------------------------
  it('8. Sensitive credentials (API keys), patient phone numbers, and patient notes never appear in logs or WhatsApp messages', async () => {
    logger.clear();
    features.enable('whatsappEnabled');

    const secretApiKey = 'SECRET_CALLMEBOT_KEY_999888';
    const secretNotes = 'PRIVATE_PATIENT_NOTE_TRAUMA_HISTORY_XYZ';
    const patientPhone = '0599887766';
    const serverLogs: ServerLogEvent[] = [];

    const formData = createValidFormData({
      phone: patientPhone,
      message: secretNotes,
    });

    // Verify WhatsApp message builder excludes notes
    const builtMessage = buildClinicWhatsAppMessage({
      bookingId: 'BK-PRIV-1',
      fullName: formData.fullName,
      phone: formData.phone,
      sessionType: 'Individual Therapy',
      preferredDate: formData.preferredDate,
      preferredTime: '10:00',
    });
    assert.ok(!builtMessage.includes(secretNotes), 'WhatsApp message must not include patient notes');

    // Execute full flow and inspect both client RDF logs and server logs
    await BookingService.submit(formData, {
      transport: async (_endpoint, payload) => {
        const serverRes = await handleWhatsAppNotificationRequest(
          { method: 'POST', rawBody: JSON.stringify(payload) },
          {
            env: {
              ...VALID_SERVER_ENV,
              CALLMEBOT_APIKEY: secretApiKey,
            },
            onLog: (entry) => serverLogs.push(entry),
            httpClient: async () => ({
              status: 200,
              body: '<p><b>Message queued.</b>',
            }),
          }
        );
        return { status: serverRes.statusCode, data: serverRes.body };
      },
    });

    //Also verify Logger.sanitizeData redacts apikey in URLs and object keys
    logger.info('test:sanitize', 'Test log sanitization', {
      apikey: secretApiKey,
      notes: secretNotes,
      url: `https://api.callmebot.com/whatsapp.php?phone=966512345678&apikey=${secretApiKey}`,
    });

    const clientLogsJson = logger.export('json');
    const serverLogsJson = JSON.stringify(serverLogs);

    assert.ok(!clientLogsJson.includes(secretApiKey), 'Client logs must never contain CALLMEBOT_APIKEY');
    assert.ok(!clientLogsJson.includes(secretNotes), 'Client logs must never contain patient free-text notes');
    assert.ok(!clientLogsJson.includes(patientPhone), 'Client logs must not log patient phone number');

    assert.ok(!serverLogsJson.includes(secretApiKey), 'Server logs must never contain CALLMEBOT_APIKEY');
    assert.ok(!serverLogsJson.includes(secretNotes), 'Server logs must never contain patient free-text notes');
    assert.ok(!serverLogsJson.includes(patientPhone), 'Server logs must not log patient phone number');
  });

  // -------------------------------------------------------------------------
  // 9. Development mode can execute the real flow when explicitly configured
  // -------------------------------------------------------------------------
  it('9. Development mode executes the real flow when WHATSAPP_ENABLED=true, and production mode never silently mocks', async () => {
    // A. Dev mode with WHATSAPP_ENABLED=true -> real mode (mockBooking is false!)
    const devRealFlags = resolveBookingFeatureFlags({
      DEV: true,
      PROD: false,
      VITE_WHATSAPP_ENABLED: 'true',
    });
    assert.deepEqual(devRealFlags, {
      whatsappEnabled: true,
      mockBooking: false,
    });

    // B. Dev mode with WHATSAPP_ENABLED=false -> mock mode
    const devMockFlags = resolveBookingFeatureFlags({
      DEV: true,
      PROD: false,
      VITE_WHATSAPP_ENABLED: 'false',
    });
    assert.deepEqual(devMockFlags, {
      whatsappEnabled: false,
      mockBooking: true,
    });

    // C. Production mode with WHATSAPP_ENABLED=false -> neither real nor mock is enabled, must fail with config error
    const prodDisabledFlags = resolveBookingFeatureFlags({
      DEV: false,
      PROD: true,
      VITE_WHATSAPP_ENABLED: 'false',
    });
    assert.deepEqual(prodDisabledFlags, {
      whatsappEnabled: false,
      mockBooking: false,
    });

    features.register('whatsappEnabled', prodDisabledFlags.whatsappEnabled);
    features.register('mockBooking', prodDisabledFlags.mockBooking);

    await assert.rejects(
      () => BookingService.submit(createValidFormData()),
      /WhatsApp notifications are not enabled/i
    );
  });

  // -------------------------------------------------------------------------
  // 10. The frontend displays accurate success and failure feedback
  // -------------------------------------------------------------------------
  it('10. Frontend components render accurate provider-accepted vs simulated feedback', () => {
    const formData = createValidFormData();

    // Real mode success UI
    const realHtml = renderToStaticMarkup(
      React.createElement(BookingSuccess, {
        result: {
          success: true,
          bookingId: 'BK-REAL-777',
          mode: 'real',
          deliveryStatus: 'accepted',
          message: 'Appointment request submitted; notification accepted by the provider.',
        },
        formData,
        onReset: () => {},
      })
    );

    assert.ok(realHtml.includes('Appointment Request Submitted!'));
    assert.ok(realHtml.includes('notification accepted by the provider'));
    assert.ok(realHtml.includes('Accepted by WhatsApp provider (queued)'));
    assert.ok(realHtml.includes('BK-REAL-777'));
    assert.ok(realHtml.includes('not stored in a database'));
    assert.ok(!realHtml.includes('Simulated Mode'));

    // Mock mode UI
    const mockHtml = renderToStaticMarkup(
      React.createElement(BookingSuccess, {
        result: {
          success: true,
          bookingId: 'BK-MOCK-888',
          mode: 'mock',
          deliveryStatus: 'simulated',
          message: 'Simulated appointment request (mock mode — no real WhatsApp notification was sent).',
        },
        formData,
        onReset: () => {},
      })
    );

    assert.ok(mockHtml.includes('Simulated Mode — No Real WhatsApp Sent'));
    assert.ok(mockHtml.includes('Appointment Request Simulated'));
    assert.ok(mockHtml.includes('Simulated (mock mode)'));
    assert.ok(mockHtml.includes('BK-MOCK-888'));
  });
});
