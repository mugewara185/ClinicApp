/**
 * Server-Side WhatsApp Notification Endpoint Handler (CallMeBot)
 *
 * Security & Privacy Guarantees:
 * - Reads CALLMEBOT_PHONE, CALLMEBOT_APIKEY, and WHATSAPP_ENABLED exclusively from server-only env vars.
 * - Validates and normalizes all booking fields on the server.
 * - Explicitly excludes free-text patient notes (`message`) from the WhatsApp message and logs.
 * - Enforces request size limits (4 KB) and per-IP sliding-window rate limiting.
 * - Applies a strict request timeout when calling CallMeBot.
 * - Inspects both HTTP status and CallMeBot HTML/text response body to detect provider-level rejections
 *   (e.g. HTTP 200/201/203 with "ERROR:" or "APIKey is invalid" vs "Message queued").
 * - Never returns or logs API keys, complete provider URLs, recipient phone numbers, or raw provider HTML.
 */

import { SESSION_TYPES, TIME_SLOTS } from '../features/booking/schemas/booking.schema';
import { CLINIC_INFO } from '../framework/schemas/clinic';
import { formatDate, formatTime } from '../shared/utils/formatters';
import { isValidPhone } from '../shared/utils/validators';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WhatsAppNotificationErrorCode =
  | 'METHOD_NOT_ALLOWED'
  | 'PAYLOAD_TOO_LARGE'
  | 'INVALID_JSON'
  | 'RATE_LIMITED'
  | 'WHATSAPP_DISABLED'
  | 'CONFIGURATION_ERROR'
  | 'VALIDATION_ERROR'
  | 'PROVIDER_AUTH_ERROR'
  | 'PROVIDER_RECIPIENT_ERROR'
  | 'PROVIDER_RATE_LIMIT'
  | 'PROVIDER_REJECTED'
  | 'PROVIDER_HTTP_ERROR'
  | 'PROVIDER_TIMEOUT'
  | 'PROVIDER_NETWORK_ERROR';

export interface BookingNotificationPayload {
  bookingId?: string;
  fullName?: unknown;
  phone?: unknown;
  sessionType?: unknown;
  preferredDate?: unknown;
  preferredTime?: unknown;
  message?: unknown;
}

export interface ValidatedBookingNotification {
  bookingId: string;
  fullName: string;
  phone: string;
  sessionType: (typeof SESSION_TYPES)[number];
  preferredDate: string;
  preferredTime: (typeof TIME_SLOTS)[number];
}

export interface NormalizedBookingNotificationResponse {
  success: boolean;
  bookingId?: string;
  provider: 'callmebot';
  mode: 'real';
  deliveryStatus: 'accepted' | 'failed';
  message?: string;
  error?: {
    code: WhatsAppNotificationErrorCode;
    message: string;
    details?: Record<string, string>;
  };
}

export interface WhatsAppHandlerResult {
  statusCode: number;
  headers?: Record<string, string>;
  body: NormalizedBookingNotificationResponse;
}

export interface ServerEnvConfig {
  WHATSAPP_ENABLED?: string;
  CALLMEBOT_PHONE?: string;
  CALLMEBOT_APIKEY?: string;
  CALLMEBOT_TIMEOUT_MS?: string;
  WHATSAPP_RATE_LIMIT_MAX?: string;
  WHATSAPP_RATE_LIMIT_WINDOW_MS?: string;
}

export interface CallMeBotHttpResponse {
  status: number;
  body: string;
}

export type CallMeBotHttpClient = (
  url: string,
  options: { timeoutMs: number }
) => Promise<CallMeBotHttpResponse>;

export interface ServerLogEvent {
  level: 'info' | 'warn' | 'error';
  event: string;
  meta: Record<string, unknown>;
}

export interface WhatsAppHandlerOptions {
  env?: ServerEnvConfig;
  httpClient?: CallMeBotHttpClient;
  onLog?: (entry: ServerLogEvent) => void;
  now?: () => number;
}

// ---------------------------------------------------------------------------
// Constants & Rate Limiting
// ---------------------------------------------------------------------------

export const CALLMEBOT_ENDPOINT = 'https://api.callmebot.com/whatsapp.php';
export const MAX_REQUEST_BODY_BYTES = 4096; // 4 KB max payload
export const DEFAULT_TIMEOUT_MS = 10_000;
export const DEFAULT_RATE_LIMIT_MAX = 5;
export const DEFAULT_RATE_LIMIT_WINDOW_MS = 60_000;

const PLACEHOLDER_VALUES = new Set([
  'your_callmebot_api_key_here',
  'your_api_key_here',
  'your_phone_here',
  'changeme',
  'replace_me',
  'todo',
  'placeholder',
]);

const rateLimitStore = new Map<string, number[]>();

export const resetRateLimiter = (): void => {
  rateLimitStore.clear();
};

const checkRateLimit = (
  clientKey: string,
  nowMs: number,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfterSeconds: number } => {
  const key = clientKey || 'anonymous';
  const cutoff = nowMs - windowMs;
  const recent = (rateLimitStore.get(key) ?? []).filter(ts => ts > cutoff);

  if (recent.length >= maxRequests) {
    const oldest = recent[0] ?? nowMs;
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - nowMs) / 1000));
    rateLimitStore.set(key, recent);
    return { allowed: false, retryAfterSeconds };
  }

  recent.push(nowMs);
  rateLimitStore.set(key, recent);
  return { allowed: true, retryAfterSeconds: 0 };
};

// ---------------------------------------------------------------------------
// Environment Resolution
// ---------------------------------------------------------------------------

export const getServerEnv = (): ServerEnvConfig => {
  const proc = (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process;
  return proc?.env ?? {};
};

export interface ResolvedProviderConfig {
  ok: true;
  phone: string;
  apiKey: string;
  timeoutMs: number;
}

export interface FailedProviderConfig {
  ok: false;
  statusCode: number;
  code: 'WHATSAPP_DISABLED' | 'CONFIGURATION_ERROR';
  message: string;
}

export const resolveServerWhatsAppConfig = (
  env: ServerEnvConfig = getServerEnv()
): ResolvedProviderConfig | FailedProviderConfig => {
  const enabledRaw = (env.WHATSAPP_ENABLED ?? '').trim().toLowerCase();
  if (enabledRaw !== 'true') {
    return {
      ok: false,
      statusCode: 503,
      code: 'WHATSAPP_DISABLED',
      message:
        'Real WhatsApp notifications are not enabled on the server. Set WHATSAPP_ENABLED=true and configure server credentials.',
    };
  }

  const rawPhone = (env.CALLMEBOT_PHONE ?? '').trim();
  const rawApiKey = (env.CALLMEBOT_APIKEY ?? '').trim();

  if (!rawPhone || PLACEHOLDER_VALUES.has(rawPhone.toLowerCase())) {
    return {
      ok: false,
      statusCode: 503,
      code: 'CONFIGURATION_ERROR',
      message:
        'Missing server configuration: CALLMEBOT_PHONE must be set to the clinic owner WhatsApp number with country code.',
    };
  }

  // Normalize recipient phone: strip spaces/dashes/parens and optional leading + or 00
  const normalizedPhoneDigits = rawPhone
    .replace(/[\s\-().]/g, '')
    .replace(/^(\+|00)/, '');

  if (!/^[1-9]\d{7,14}$/.test(normalizedPhoneDigits)) {
    return {
      ok: false,
      statusCode: 503,
      code: 'CONFIGURATION_ERROR',
      message:
        'Invalid server configuration: CALLMEBOT_PHONE must be an international phone number with country code (8–15 digits).',
    };
  }

  if (!rawApiKey || PLACEHOLDER_VALUES.has(rawApiKey.toLowerCase())) {
    return {
      ok: false,
      statusCode: 503,
      code: 'CONFIGURATION_ERROR',
      message:
        'Missing server configuration: CALLMEBOT_APIKEY must be set to a valid CallMeBot API key on the server.',
    };
  }

  if (!/^[A-Za-z0-9_-]{4,64}$/.test(rawApiKey)) {
    return {
      ok: false,
      statusCode: 503,
      code: 'CONFIGURATION_ERROR',
      message: 'Invalid server configuration: CALLMEBOT_APIKEY has an invalid format.',
    };
  }

  const parsedTimeout = Number(env.CALLMEBOT_TIMEOUT_MS);
  const timeoutMs =
    Number.isFinite(parsedTimeout) && parsedTimeout >= 1000 && parsedTimeout <= 30_000
      ? Math.floor(parsedTimeout)
      : DEFAULT_TIMEOUT_MS;

  return {
    ok: true,
    phone: normalizedPhoneDigits,
    apiKey: rawApiKey,
    timeoutMs,
  };
};

// ---------------------------------------------------------------------------
// Payload Validation & Normalization
// ---------------------------------------------------------------------------

const stripControlChars = (value: string): string =>
  value.replace(/[\x00-\x1F\x7F]/g, '').trim();

const generateServerBookingId = (nowMs = Date.now()): string =>
  `BK-${nowMs}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

export const validateAndNormalizeBookingPayload = (
  input: unknown,
  nowMs = Date.now()
):
  | { ok: true; data: ValidatedBookingNotification }
  | { ok: false; bookingId?: string; details: Record<string, string>; message: string } => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {
      ok: false,
      details: { payload: 'Request body must be a JSON object' },
      message: 'Invalid booking notification payload.',
    };
  }

  const raw = input as BookingNotificationPayload;
  const details: Record<string, string> = {};

  // 1. Booking ID
  let bookingId = generateServerBookingId(nowMs);
  if (raw.bookingId !== undefined && raw.bookingId !== null && raw.bookingId !== '') {
    if (typeof raw.bookingId !== 'string') {
      details.bookingId = 'Booking ID must be a string';
    } else {
      const cleanedId = stripControlChars(raw.bookingId);
      if (!/^BK-[A-Za-z0-9_-]{3,40}$/.test(cleanedId)) {
        details.bookingId = 'Booking ID format is invalid';
      } else {
        bookingId = cleanedId;
      }
    }
  }

  // 2. Full Name
  let fullName = '';
  if (typeof raw.fullName !== 'string') {
    details.fullName = 'Full name is required';
  } else {
    fullName = stripControlChars(raw.fullName).replace(/\s+/g, ' ');
    if (fullName.length < 2) {
      details.fullName = 'Please enter your full name (at least 2 characters)';
    } else if (fullName.length > 80) {
      details.fullName = 'Name is too long (max 80 characters)';
    }
  }

  // 3. Phone
  let phone = '';
  if (typeof raw.phone !== 'string') {
    details.phone = 'Phone number is required';
  } else {
    phone = stripControlChars(raw.phone).replace(/\s+/g, ' ');
    const phoneRegex = /^(\+966|00966|0)?[0-9\s\-().]{7,16}$/;
    if (phone.length < 9) {
      details.phone = 'Phone number is too short';
    } else if (phone.length > 20) {
      details.phone = 'Phone number is too long';
    } else if (!phoneRegex.test(phone) || !isValidPhone(phone)) {
      details.phone = 'Please enter a valid phone number';
    }
  }

  // 4. Session Type
  let sessionType = '' as (typeof SESSION_TYPES)[number];
  if (typeof raw.sessionType !== 'string') {
    details.sessionType = 'Session type is required';
  } else {
    const cleanedSession = stripControlChars(raw.sessionType);
    if (!(SESSION_TYPES as readonly string[]).includes(cleanedSession)) {
      details.sessionType = 'Please select a valid session type';
    } else {
      sessionType = cleanedSession as (typeof SESSION_TYPES)[number];
    }
  }

  // 5. Preferred Date (YYYY-MM-DD, starting from tomorrow up to 3 months)
  let preferredDate = '';
  if (typeof raw.preferredDate !== 'string' || !raw.preferredDate.trim()) {
    details.preferredDate = 'Please select a date';
  } else {
    const cleanedDate = stripControlChars(raw.preferredDate);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanedDate)) {
      details.preferredDate = 'Date must be in YYYY-MM-DD format';
    } else {
      const parsedDate = new Date(`${cleanedDate}T00:00:00.000Z`);
      if (Number.isNaN(parsedDate.getTime())) {
        details.preferredDate = 'Invalid calendar date';
      } else {
        const tomorrow = new Date(nowMs);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const minDateStr = tomorrow.toISOString().split('T')[0];
        const minDate = new Date(`${minDateStr}T00:00:00.000Z`);

        const maxLimit = new Date(nowMs);
        maxLimit.setMonth(maxLimit.getMonth() + 3);
        maxLimit.setDate(maxLimit.getDate() + 1);
        const maxDateStr = maxLimit.toISOString().split('T')[0];
        const maxDate = new Date(`${maxDateStr}T00:00:00.000Z`);

        if (parsedDate < minDate) {
          details.preferredDate = 'Please select a date starting from tomorrow';
        } else if (parsedDate > maxDate) {
          details.preferredDate = 'Preferred date must be within the next 3 months';
        } else {
          preferredDate = cleanedDate;
        }
      }
    }
  }

  // 6. Preferred Time
  let preferredTime = '' as (typeof TIME_SLOTS)[number];
  if (typeof raw.preferredTime !== 'string') {
    details.preferredTime = 'Preferred time is required';
  } else {
    const cleanedTime = stripControlChars(raw.preferredTime);
    if (!(TIME_SLOTS as readonly string[]).includes(cleanedTime)) {
      details.preferredTime = 'Please select a valid time slot';
    } else {
      preferredTime = cleanedTime as (typeof TIME_SLOTS)[number];
    }
  }

  // 7. Optional message/notes validation (validated if present, never forwarded to WhatsApp)
  if (raw.message !== undefined && raw.message !== null) {
    if (typeof raw.message !== 'string') {
      details.message = 'Additional notes must be a string';
    } else if (raw.message.length > 500) {
      details.message = 'Message is too long (max 500 characters)';
    }
  }

  if (Object.keys(details).length > 0) {
    const firstIssue = Object.values(details)[0] ?? 'Invalid booking notification payload.';
    return {
      ok: false,
      bookingId,
      details,
      message: `Validation failed: ${firstIssue}`,
    };
  }

  return {
    ok: true,
    data: {
      bookingId,
      fullName,
      phone,
      sessionType,
      preferredDate,
      preferredTime,
    },
  };
};

// ---------------------------------------------------------------------------
// Minimal Privacy-Safe WhatsApp Message Builder
// ---------------------------------------------------------------------------

/**
 * Builds the WhatsApp message sent to the clinic owner.
 * Deliberately excludes patient free-text notes (`message`) to protect sensitive clinical data.
 */
export const buildClinicWhatsAppMessage = (data: ValidatedBookingNotification): string => {
  const formattedDate = formatDate(data.preferredDate);
  const formattedTime = formatTime(data.preferredTime);

  return [
    `🏥 *New Appointment Request — ${CLINIC_INFO.name}*`,
    ``,
    `🔖 *Booking ID:* ${data.bookingId}`,
    `👤 *Patient:* ${data.fullName}`,
    `📱 *Phone:* ${data.phone}`,
    `💆 *Session:* ${data.sessionType}`,
    `📅 *Date:* ${formattedDate}`,
    `⏰ *Time:* ${formattedTime}`,
    ``,
    `📌 Reply to the patient to confirm or reschedule.`,
  ].join('\n');
};

// ---------------------------------------------------------------------------
// CallMeBot Response Verification
// ---------------------------------------------------------------------------

export type CallMeBotInspectionResult =
  | { accepted: true }
  | { accepted: false; code: WhatsAppNotificationErrorCode; message: string };

/**
 * Inspects both HTTP status and CallMeBot's HTML/text body.
 * CallMeBot frequently returns HTTP 200/201/203 with HTML containing "ERROR: ..." or "APIKey is invalid."
 * Only responses with 2xx status, no error markers, and explicit queue acceptance ("Message queued")
 * are treated as accepted.
 */
export const inspectCallMeBotResponse = (
  httpStatus: number,
  rawBody: string
): CallMeBotInspectionResult => {
  const cleanText = String(rawBody ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Check body for explicit CallMeBot rejection patterns first (since CallMeBot uses 201/203 for errors)
  if (/apikey is invalid|apikey can not be empty|invalid apikey|api key is invalid|invalid format/i.test(cleanText)) {
    return {
      accepted: false,
      code: 'PROVIDER_AUTH_ERROR',
      message:
        'WhatsApp provider rejected the configured API key. Verify CALLMEBOT_APIKEY matches the key issued for CALLMEBOT_PHONE.',
    };
  }

  if (
    /phone number format is incorrect|phone.*incorrect|not activated|user not found|not authorized/i.test(
      cleanText
    )
  ) {
    return {
      accepted: false,
      code: 'PROVIDER_RECIPIENT_ERROR',
      message:
        'WhatsApp provider rejected the clinic phone number. Verify CALLMEBOT_PHONE includes country code and has activated CallMeBot.',
    };
  }

  if (/too many requests|rate limit|quota|spam|blocked|paused/i.test(cleanText)) {
    return {
      accepted: false,
      code: 'PROVIDER_RATE_LIMIT',
      message: 'WhatsApp provider rate limit or quota exceeded. Please try again later.',
    };
  }

  if (/\berror\b\s*:|^error\b/i.test(cleanText)) {
    return {
      accepted: false,
      code: 'PROVIDER_REJECTED',
      message: 'WhatsApp provider rejected the notification request.',
    };
  }

  // Check HTTP status codes
  if (httpStatus === 401 || httpStatus === 403) {
    return {
      accepted: false,
      code: 'PROVIDER_AUTH_ERROR',
      message: `WhatsApp provider authentication failed (HTTP ${httpStatus}).`,
    };
  }

  if (httpStatus === 429) {
    return {
      accepted: false,
      code: 'PROVIDER_RATE_LIMIT',
      message: 'WhatsApp provider rate limit exceeded (HTTP 429).',
    };
  }

  if (httpStatus < 200 || httpStatus >= 300) {
    return {
      accepted: false,
      code: 'PROVIDER_HTTP_ERROR',
      message: `WhatsApp provider returned an unexpected HTTP status (${httpStatus}).`,
    };
  }

  // Require positive confirmation that CallMeBot queued/accepted the message
  if (!/message queued|message sent/i.test(cleanText)) {
    return {
      accepted: false,
      code: 'PROVIDER_REJECTED',
      message: 'WhatsApp provider did not confirm message acceptance.',
    };
  }

  return { accepted: true };
};

// ---------------------------------------------------------------------------
// Default Server HTTP Client (with Timeout)
// ---------------------------------------------------------------------------

export const defaultCallMeBotHttpClient: CallMeBotHttpClient = async (url, { timeoutMs }) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Accept: 'text/html, text/plain, */*',
      },
    });
    const body = await response.text();
    return { status: response.status, body };
  } finally {
    clearTimeout(timer);
  }
};

// ---------------------------------------------------------------------------
// Core Server Endpoint Request Processor
// ---------------------------------------------------------------------------

export interface IncomingNotificationRequest {
  method?: string;
  rawBody?: string | unknown;
  clientIp?: string;
}

export const handleWhatsAppNotificationRequest = async (
  req: IncomingNotificationRequest,
  options: WhatsAppHandlerOptions = {}
): Promise<WhatsAppHandlerResult> => {
  const env = options.env ?? getServerEnv();
  const httpClient = options.httpClient ?? defaultCallMeBotHttpClient;
  const nowMs = options.now ? options.now() : Date.now();
  const log = (level: ServerLogEvent['level'], event: string, meta: Record<string, unknown>) => {
    options.onLog?.({ level, event, meta });
  };

  // 1. Verify HTTP Method
  const method = (req.method ?? 'POST').toUpperCase();
  if (method !== 'POST') {
    return {
      statusCode: 405,
      headers: { Allow: 'POST' },
      body: {
        success: false,
        provider: 'callmebot',
        mode: 'real',
        deliveryStatus: 'failed',
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Only POST requests are supported for booking notifications.',
        },
      },
    };
  }

  // 2. Enforce Request Size Limit & JSON Parsing
  let parsedBody: unknown;
  if (typeof req.rawBody === 'string') {
    const byteLength = new TextEncoder().encode(req.rawBody).byteLength;
    if (byteLength > MAX_REQUEST_BODY_BYTES) {
      log('warn', 'booking:server:payload_too_large', { byteLength });
      return {
        statusCode: 413,
        body: {
          success: false,
          provider: 'callmebot',
          mode: 'real',
          deliveryStatus: 'failed',
          error: {
            code: 'PAYLOAD_TOO_LARGE',
            message: 'Booking notification request exceeds the maximum allowed size (4 KB).',
          },
        },
      };
    }

    try {
      parsedBody = JSON.parse(req.rawBody);
    } catch {
      return {
        statusCode: 400,
        body: {
          success: false,
          provider: 'callmebot',
          mode: 'real',
          deliveryStatus: 'failed',
          error: {
            code: 'INVALID_JSON',
            message: 'Request body must be valid JSON.',
          },
        },
      };
    }
  } else if (req.rawBody !== undefined) {
    const serialized = JSON.stringify(req.rawBody);
    if (serialized && new TextEncoder().encode(serialized).byteLength > MAX_REQUEST_BODY_BYTES) {
      return {
        statusCode: 413,
        body: {
          success: false,
          provider: 'callmebot',
          mode: 'real',
          deliveryStatus: 'failed',
          error: {
            code: 'PAYLOAD_TOO_LARGE',
            message: 'Booking notification request exceeds the maximum allowed size (4 KB).',
          },
        },
      };
    }
    parsedBody = req.rawBody;
  } else {
    return {
      statusCode: 400,
      body: {
        success: false,
        provider: 'callmebot',
        mode: 'real',
        deliveryStatus: 'failed',
        error: {
          code: 'INVALID_JSON',
          message: 'Request body is required.',
        },
      },
    };
  }

  // 3. Apply Per-IP Rate Limiting (Abuse Protection)
  const rateLimitMax = Number(env.WHATSAPP_RATE_LIMIT_MAX) || DEFAULT_RATE_LIMIT_MAX;
  const rateLimitWindowMs = Number(env.WHATSAPP_RATE_LIMIT_WINDOW_MS) || DEFAULT_RATE_LIMIT_WINDOW_MS;
  const rateCheck = checkRateLimit(
    req.clientIp ?? 'anonymous',
    nowMs,
    rateLimitMax,
    rateLimitWindowMs
  );

  if (!rateCheck.allowed) {
    log('warn', 'booking:server:rate_limited', { retryAfterSeconds: rateCheck.retryAfterSeconds });
    return {
      statusCode: 429,
      headers: { 'Retry-After': String(rateCheck.retryAfterSeconds) },
      body: {
        success: false,
        provider: 'callmebot',
        mode: 'real',
        deliveryStatus: 'failed',
        error: {
          code: 'RATE_LIMITED',
          message: `Too many appointment notification requests. Please wait ${rateCheck.retryAfterSeconds} seconds and try again.`,
        },
      },
    };
  }

  // 4. Validate and Normalize Booking Payload
  const validation = validateAndNormalizeBookingPayload(parsedBody, nowMs);
  if (!validation.ok) {
    log('warn', 'booking:server:validation_failed', {
      bookingId: validation.bookingId,
      invalidFields: Object.keys(validation.details),
    });
    return {
      statusCode: 400,
      body: {
        success: false,
        bookingId: validation.bookingId,
        provider: 'callmebot',
        mode: 'real',
        deliveryStatus: 'failed',
        error: {
          code: 'VALIDATION_ERROR',
          message: validation.message,
          details: validation.details,
        },
      },
    };
  }

  const booking = validation.data;

  // 5. Verify Server Credentials & Feature Configuration
  const config = resolveServerWhatsAppConfig(env);
  if (!config.ok) {
    log('error', 'booking:server:config_error', {
      bookingId: booking.bookingId,
      code: config.code,
    });
    return {
      statusCode: config.statusCode,
      body: {
        success: false,
        bookingId: booking.bookingId,
        provider: 'callmebot',
        mode: 'real',
        deliveryStatus: 'failed',
        error: {
          code: config.code,
          message: config.message,
        },
      },
    };
  }

  // 6. Build Minimal WhatsApp Message & Dispatch to CallMeBot
  const textMessage = buildClinicWhatsAppMessage(booking);
  const params = new URLSearchParams({
    phone: config.phone,
    text: textMessage,
    apikey: config.apiKey,
  });
  const providerUrl = `${CALLMEBOT_ENDPOINT}?${params.toString()}`;

  log('info', 'booking:server:provider_request', {
    bookingId: booking.bookingId,
    provider: 'callmebot',
    sessionType: booking.sessionType,
    preferredDate: booking.preferredDate,
    preferredTime: booking.preferredTime,
  });

  try {
    const providerResponse = await httpClient(providerUrl, { timeoutMs: config.timeoutMs });
    const inspection = inspectCallMeBotResponse(providerResponse.status, providerResponse.body);

    if (!inspection.accepted) {
      log('error', 'booking:server:provider_rejected', {
        bookingId: booking.bookingId,
        provider: 'callmebot',
        providerStatus: providerResponse.status,
        code: inspection.code,
      });

      return {
        statusCode: 502,
        body: {
          success: false,
          bookingId: booking.bookingId,
          provider: 'callmebot',
          mode: 'real',
          deliveryStatus: 'failed',
          error: {
            code: inspection.code,
            message: inspection.message,
          },
        },
      };
    }

    log('info', 'booking:server:provider_accepted', {
      bookingId: booking.bookingId,
      provider: 'callmebot',
      providerStatus: providerResponse.status,
      deliveryStatus: 'accepted',
    });

    return {
      statusCode: 200,
      body: {
        success: true,
        bookingId: booking.bookingId,
        provider: 'callmebot',
        mode: 'real',
        deliveryStatus: 'accepted',
        message: 'Appointment request submitted; notification accepted by the provider.',
      },
    };
  } catch (err) {
    const isAbortOrTimeout =
      err instanceof Error &&
      (err.name === 'AbortError' ||
        err.name === 'TimeoutError' ||
        /timeout|timed out|aborted|ETIMEDOUT|ECONNABORTED/i.test(err.message));

    const code: WhatsAppNotificationErrorCode = isAbortOrTimeout
      ? 'PROVIDER_TIMEOUT'
      : 'PROVIDER_NETWORK_ERROR';

    const statusCode = isAbortOrTimeout ? 504 : 502;
    const message = isAbortOrTimeout
      ? 'The WhatsApp notification provider timed out before confirming acceptance. Please try again.'
      : 'Could not reach the WhatsApp notification provider. Please try again later.';

    log('error', 'booking:server:provider_network_failure', {
      bookingId: booking.bookingId,
      provider: 'callmebot',
      code,
    });

    return {
      statusCode,
      body: {
        success: false,
        bookingId: booking.bookingId,
        provider: 'callmebot',
        mode: 'real',
        deliveryStatus: 'failed',
        error: {
          code,
          message,
        },
      },
    };
  }
};

// ---------------------------------------------------------------------------
// Node / Serverless HTTP Adapter (Used by Vite Dev/Preview & Vercel Functions)
// ---------------------------------------------------------------------------

export interface NodeRequestLike {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
  body?: unknown;
  on?: (event: string, listener: (chunk?: unknown) => void) => void;
}

export interface NodeResponseLike {
  statusCode: number;
  setHeader: (name: string, value: string) => void;
  end: (body?: string) => void;
}

const readNodeRequestBody = (req: NodeRequestLike): Promise<string> =>
  new Promise((resolve, reject) => {
    if (typeof req.body === 'string') {
      resolve(req.body);
      return;
    }
    if (req.body && typeof req.body === 'object') {
      resolve(JSON.stringify(req.body));
      return;
    }
    if (typeof req.on !== 'function') {
      resolve('');
      return;
    }

    const chunks: string[] = [];
    let totalBytes = 0;

    req.on('data', (chunk: unknown) => {
      const str = typeof chunk === 'string' ? chunk : new TextDecoder().decode(chunk as Uint8Array);
      totalBytes += new TextEncoder().encode(str).byteLength;
      if (totalBytes <= MAX_REQUEST_BODY_BYTES * 2) {
        chunks.push(str);
      }
    });

    req.on('end', () => resolve(chunks.join('')));
    req.on('error', (err: unknown) => reject(err));
  });

export const handleNodeHttpRequest = async (
  req: NodeRequestLike,
  res: NodeResponseLike,
  options: WhatsAppHandlerOptions = {}
): Promise<void> => {
  const forwardedFor = req.headers?.['x-forwarded-for'];
  const clientIp =
    (typeof forwardedFor === 'string' ? forwardedFor.split(',')[0]?.trim() : undefined) ||
    req.socket?.remoteAddress ||
    'anonymous';

  const rawBody = await readNodeRequestBody(req);
  const result = await handleWhatsAppNotificationRequest(
    {
      method: req.method,
      rawBody,
      clientIp,
    },
    options
  );

  res.statusCode = result.statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  if (result.headers) {
    for (const [k, v] of Object.entries(result.headers)) {
      res.setHeader(k, v);
    }
  }
  res.end(JSON.stringify(result.body));
};
