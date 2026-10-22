/**
 * Vercel Serverless Function — POST /api/booking/whatsapp
 *
 * Delegates booking WhatsApp notification requests to the shared server handler.
 * Reads server-only environment variables (CALLMEBOT_PHONE, CALLMEBOT_APIKEY, WHATSAPP_ENABLED).
 */

import {
  handleNodeHttpRequest,
  type NodeRequestLike,
  type NodeResponseLike,
} from '../../src/server/whatsappNotification';

export default async function handler(req: NodeRequestLike, res: NodeResponseLike): Promise<void> {
  await handleNodeHttpRequest(req, res, {
    onLog: ({ level, event, meta }) => {
      const logFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.info;
      logFn(`[${event}]`, JSON.stringify(meta));
    },
  });
}
