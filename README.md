# 🏥 MindCare Clinic — Psychological Clinic Landing Page

> A modern frontend and serverless notification integration for a psychological clinic featuring appointment booking and server-side WhatsApp notifications, built with **React**, **TypeScript**, **Vite**, **Tailwind CSS**, and following the **React Developer Framework (RDF)** methodology.

---

## 🌟 Features

- **Attractive Landing Page**:
  - **Hero Section**: Calming gradient visuals, trust badges, clear CTA for consultation.
  - **Animated Impact Stats**: Live counters displaying patients helped, rating, and years of clinical experience.
  - **Doctor Profile Card**: Board-certified psychologist bio, verified credentials, spoken languages, and ratings powered by RDF `DataFactory`.
  - **Specialized Services Grid**: Individual therapy, CBT, anxiety/stress management, EMDR trauma recovery, couples therapy, and child psychology.
  - **Patient Testimonials Carousel**: Auto-scrolling verified patient feedback generated via `DataFactory`.
  - **Interactive FAQ Accordion**: Frequently asked questions addressing confidentiality, first session expectations, and online therapy options.
- **Frictionless Appointment Booking**:
  - Clean form with Full Name, Phone / WhatsApp, Session Type, Preferred Date (picker restricted to future dates), Preferred Time Slot, and optional private notes.
  - Zero sign-up / login barrier for patients.
  - Client-side validation powered by **React Hook Form** + **Zod**, reinforced by server-side validation and normalization.
- **Server-Side WhatsApp Notification Integration**:
  - Dispatches appointment notifications to the clinic owner's WhatsApp via a server-side endpoint (`POST /api/booking/whatsapp`) backed by **CallMeBot**.
  - Keeps `CALLMEBOT_APIKEY` and `CALLMEBOT_PHONE` strictly on the server (never exposed in client-side `VITE_` variables).
  - Inspects both the HTTP status code and the CallMeBot response body to distinguish true provider acceptance (`Message queued`) from provider-level rejections (`APIKey is invalid`, `ERROR: ...`).
  - Protects patient privacy by excluding free-text clinical notes from WhatsApp messages and redacting sensitive data from logs.
  - **Mock Mode**: Simulates notifications locally when `WHATSAPP_ENABLED=false` in development and clearly labels the result as simulated.
  - **Real Mode**: Executes the real server-to-CallMeBot flow in both development and production whenever `WHATSAPP_ENABLED=true`.
- **RDF (React Developer Framework) Architecture**:
  - **DataFactory**: Schema-driven test data generation with deterministic seeding and relationship support.
  - **Structured Logger**: Hierarchical namespaced logging (`api:*`, `component:*`, `booking:*`), colored console output, automatic sanitization, and `localStorage` persistence.
  - **DevToolkit**: Network delay simulator (`ApiSimulator`), error injection, and boolean feature flags (`FeatureToggle`).
  - **Console Diagnostics (`window.__DEV__`)**: Real-time access in developer console to query logs, test slow networks, and toggle feature flags.
- **Resilience & UX**:
  - React **ErrorBoundary** logging critical errors to RDF logger.
  - Accessible inline error banners and **Toast notifications** for submission feedback.
  - Fully responsive from mobile (375px) to ultra-wide displays.

---

## 🏗️ Project Architecture

```
clinic-app/
├── api/
│   └── booking/
│       └── whatsapp.ts                 # Vercel Serverless Function (POST /api/booking/whatsapp)
├── public/
├── scripts/
│   ├── ts-hooks.mjs                    # Node ESM TypeScript/TSX loader hooks for tests
│   └── ts-loader.mjs                   # Node test runner loader entry
├── src/
│   ├── server/
│   │   └── whatsappNotification.ts     # Core server validation, rate limiting & CallMeBot client
│   ├── framework/                      # RDF Core Layer
│   │   ├── data-factory/               # Schema-driven mock data generator
│   │   ├── dev-toolkit/                # ApiSimulator & FeatureToggle
│   │   ├── logging/                    # Structured logging with secret/note redaction
│   │   ├── schemas/                    # Clinic, doctor, service & testimonial schemas
│   │   └── init.ts                     # Framework bootstrap & deterministic mode resolution
│   ├── features/
│   │   ├── home/                       # Landing Page Feature
│   │   └── booking/                    # Appointment Booking Feature
│   │       ├── components/
│   │       │   ├── BookingForm.tsx     # RHF + Zod booking form with inline error state
│   │       │   └── BookingSuccess.tsx  # Confirmation card distinguishing real vs mock mode
│   │       ├── schemas/
│   │       │   └── booking.schema.ts   # Zod validation schema & time slots
│   │       ├── services/
│   │       │   └── BookingService.ts   # Client service calling /api/booking/whatsapp
│   │       └── index.tsx
│   ├── shared/                         # Shared constants, hooks, types & utilities
│   ├── components/                     # App Shell (ErrorBoundary, Navbar, Footer, Toast)
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── tests/
│   └── whatsapp-booking.test.tsx       # Automated verification suite
├── .env.example                        # Template for server & client environment variables
├── package.json
└── vite.config.ts                      # Vite config + local /api/booking/whatsapp server middleware
```

---

## 🚀 Quick Start & Local Development

### 1. Prerequisites
- **Node.js**: version `18.0.0` or higher (`v22+` recommended)
- **npm**: version `9.0.0` or higher

### 2. Installation
```bash
cd ClinicApp
npm install
```

### 3. Environment Setup
Copy the example environment file:
```bash
cp .env.example .env
```

Open `.env` and configure the server-side variables:
```env
# Server-only CallMeBot recipient phone (with country code, no + or spaces)
CALLMEBOT_PHONE=966512345678

# Server-only CallMeBot API key (never prefix with VITE_)
CALLMEBOT_APIKEY=your_callmebot_api_key_here

# Set to 'false' for local simulated mock mode, or 'true' to send real WhatsApp notifications
WHATSAPP_ENABLED=false
```

### 4. Run Local Development Server (Frontend + Local Backend Endpoint)
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

> **How the local server endpoint works:** `vite.config.ts` mounts the Node.js handler (`src/server/whatsappNotification.ts`) directly onto Vite's HTTP server at `POST /api/booking/whatsapp` during both `npm run dev` and `npm run preview`. You do not need to run a separate backend process locally. Alternatively, if using the Vercel CLI, you can run `npx vercel dev`.

### 5. Run Tests & Type-Check
```bash
# Run automated test suite
npm test

# Run TypeScript type-check
npm run typecheck

# Build for production
npm run build
```

---

## 📱 WhatsApp Provider Setup (CallMeBot)

The server endpoint (`POST /api/booking/whatsapp`) uses **CallMeBot** (`https://api.callmebot.com/whatsapp.php`) to send a WhatsApp notification from the server to the clinic owner's phone number.

### How the Clinic Owner Activates CallMeBot:
1. Check [CallMeBot's official WhatsApp API page](https://www.callmebot.com/blog/free-api-whatsapp-messages/) for the currently active bot phone number (historically `+34 644 59 77 39`) and save it in your phone contacts as `CallMeBot`.
   - *Note:* CallMeBot's free personal gateway periodically reaches capacity (`+34*********` shown when full). If you already have an activated number and lost your key, send `Recover APIKey` to your existing CallMeBot contact on WhatsApp.
2. Open WhatsApp and send the exact activation phrase to the contact:
   ```text
   I allow callmebot to send me messages
   ```
3. CallMeBot will reply on WhatsApp with your personal **API key**:
   ```text
   API Activated for your phone number. Your APIKEY is 123456
   ```
4. Set the credentials in your server `.env` (or hosting platform environment settings):
   ```env
   CALLMEBOT_PHONE=966512345678
   CALLMEBOT_APIKEY=123456
   WHATSAPP_ENABLED=true
   ```

### Alternative Providers (If CallMeBot Registration Is Unavailable)
If CallMeBot is at capacity for new registrations or you need multi-recipient commercial SLA guarantees:
- **Official Meta WhatsApp Cloud API**: Direct Graph API integration (`POST https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages`). Requires a Meta Developer App, verified Business Portfolio, system user access token, and approved message template. Lowest per-message cost and highest reliability, but higher initial verification complexity.
- **Twilio WhatsApp API**: REST endpoint (`POST https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json`) using `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`. Provides a pre-configured WhatsApp Sandbox for immediate developer testing and straightforward template approval for production, with per-message usage pricing.

### Message Format Sent to Clinic Owner
To protect patient privacy, **free-text clinical notes (`message`) are never transmitted over WhatsApp**. Only the minimum information required to identify and manage the booking is sent:
```text
🏥 *New Appointment Request — MindCare Clinic*

🔖 *Booking ID:* BK-1761088800000-A1B2C
👤 *Patient:* Layla Al-Ahmad
📱 *Phone:* 0512345678
💆 *Session:* Cognitive Behavioral Therapy
📅 *Date:* Saturday, October 24, 2026
⏰ *Time:* 10:00 AM

📌 Reply to the patient to confirm or reschedule.
```

---

## 🔀 Mock Mode vs. Real Sending & Precedence Rules

### Mode Resolution Precedence
1. **Server Enforcement Boundary (`/api/booking/whatsapp`)**:
   - The server endpoint always checks its own server-side environment variables (`WHATSAPP_ENABLED`, `CALLMEBOT_PHONE`, `CALLMEBOT_APIKEY`).
   - Browser feature flags **cannot** expose, override, or bypass server credentials. If the browser calls `/api/booking/whatsapp` while `WHATSAPP_ENABLED` is `false` or credentials are missing on the server, the server responds with HTTP `503` (`WHATSAPP_DISABLED` or `CONFIGURATION_ERROR`).
2. **Environment Configuration (`src/framework/init.ts`)**:
   - If `MOCK_BOOKING=true` is set in `.env`: `mockBooking = true`, `whatsappEnabled = false`.
   - Else if `WHATSAPP_ENABLED=true` is set in `.env`: `whatsappEnabled = true`, `mockBooking = false` (**even in `npm run dev`**, so development mode executes the real flow when configured).
   - Else (`WHATSAPP_ENABLED=false` or unset):
     - In **development** (`npm run dev`): defaults to `mockBooking = true`, `whatsappEnabled = false` (simulated mode).
     - In **production** (`npm run build`): defaults to `mockBooking = false`, `whatsappEnabled = false`. Submitting a booking in an unconfigured production deployment produces an explicit configuration error rather than silently claiming a mock notification was sent.
3. **Runtime Developer Feature Flags (`window.__DEV__.features`)**:
   - In development, enabling `whatsappEnabled` (`window.__DEV__.features.enable('whatsappEnabled')` or `toggle('whatsappEnabled')`) automatically disables `mockBooking` so the client sends requests to `/api/booking/whatsapp`.
   - Enabling `mockBooking` (`window.__DEV__.features.enable('mockBooking')`) automatically disables `whatsappEnabled` to test simulated mode.

### How to Safely Test a Real Notification
1. Configure valid `CALLMEBOT_PHONE` (your own authorized WhatsApp number), `CALLMEBOT_APIKEY`, and `WHATSAPP_ENABLED=true` in `.env`.
2. Start the server with `npm run dev`.
3. Submit a single booking on `http://localhost:5173/#booking` using test details, or test the server endpoint directly via `curl`:
   ```bash
   curl -i -X POST http://localhost:5173/api/booking/whatsapp \
     -H "Content-Type: application/json" \
     -d '{
       "bookingId": "BK-TEST-001",
       "fullName": "Test Patient",
       "phone": "0512345678",
       "sessionType": "Free Consultation",
       "preferredDate": "2026-11-15",
       "preferredTime": "10:00"
     }'
   ```
4. Verify that the endpoint returns HTTP `200` with `"deliveryStatus": "accepted"` and that the WhatsApp message arrives on the configured `CALLMEBOT_PHONE`.

---

## ⚠️ What "Success" Means & Data Persistence

- **No Persistent Database**: `ClinicApp` does **not** use a database or persistent backend storage for appointments.
- **Provider Acceptance vs. Final Delivery**:
  - In **Real Mode**, a successful response (`deliveryStatus: "accepted"`) means the server validated the booking request and **CallMeBot accepted and queued the notification** (`Message queued`). It does **not** prove the clinic owner has received or read the message on their device, nor does it mean the appointment is durably stored in a database.
  - In **Mock Mode**, a successful response (`deliveryStatus: "simulated"`) means the request was simulated locally in the browser; **no WhatsApp message was sent**.
  - If notification delivery fails in real mode, the booking submission fails with an inline error banner and toast alert so the patient knows their request was not delivered and can retry or contact the clinic directly.

---

## 🚢 Hosting & Production Deployment

Because real WhatsApp notifications require the server-side endpoint (`POST /api/booking/whatsapp`), deploy to a platform that supports Node.js serverless functions (such as **Vercel**) or run a Node server alongside the built assets. Static-only hosting of `/dist` without `/api/booking/whatsapp` will fail in real mode.

### Deploy to Vercel (Recommended)
1. Push the repository to GitHub/GitLab and import it into [Vercel](https://vercel.com).
2. Set **Root Directory** to `ClinicApp` (if deploying from a parent repo).
3. Vercel automatically detects Vite for the frontend build (`npm run build` -> `dist`) and mounts `api/booking/whatsapp.ts` as a Node.js Serverless Function at `/api/booking/whatsapp`.
4. Under **Project Settings > Environment Variables**, add the **server-only** variables:
   - `CALLMEBOT_PHONE`: Clinic owner's WhatsApp number with country code (e.g. `966512345678`)
   - `CALLMEBOT_APIKEY`: Clinic owner's CallMeBot API key
   - `WHATSAPP_ENABLED`: `true`
5. Redeploy the project.

### Preview Production Build Locally
```bash
npm run build
npm run preview
```
`npm run preview` serves the production bundle from `/dist` and attaches the `/api/booking/whatsapp` middleware on the preview server.

---

## 🔧 Troubleshooting

| Symptom / Error Code | Cause | Resolution |
| --- | --- | --- |
| `WHATSAPP_DISABLED` (HTTP 503) | `WHATSAPP_ENABLED` is `false` or unset in the server environment. | Set `WHATSAPP_ENABLED=true` in `.env` (local) or your hosting provider's Environment Variables, then restart/redeploy. |
| `CONFIGURATION_ERROR` (HTTP 503) | `CALLMEBOT_PHONE` or `CALLMEBOT_APIKEY` is missing, invalid, or still set to the `.env.example` placeholder (`your_callmebot_api_key_here`). | Set valid server-side `CALLMEBOT_PHONE` (8–15 digits with country code, no `+`) and `CALLMEBOT_APIKEY` in `.env`. Never use `VITE_CALLMEBOT_APIKEY`. |
| `PROVIDER_AUTH_ERROR` (HTTP 502) | CallMeBot returned `APIKey is invalid` or `invalid format` (often with HTTP 201/203). | Verify `CALLMEBOT_APIKEY` matches the key issued to `CALLMEBOT_PHONE`. Send `Recover APIKey` to the CallMeBot WhatsApp contact if needed. |
| `PROVIDER_RECIPIENT_ERROR` (HTTP 502) | CallMeBot rejected the phone number format or the number has not activated the bot. | Ensure `CALLMEBOT_PHONE` includes the country code (e.g. `966512345678`) and has sent `"I allow callmebot to send me messages"` to CallMeBot. |
| `PROVIDER_TIMEOUT` (HTTP 504) | CallMeBot did not respond within `CALLMEBOT_TIMEOUT_MS` (default 10s). | Check server outbound internet connectivity or increase `CALLMEBOT_TIMEOUT_MS` (up to `30000`). |
| `RATE_LIMITED` (HTTP 429) | More than 5 notification requests were sent from the same IP within 60 seconds. | Wait for the `Retry-After` window to elapse, or adjust `WHATSAPP_RATE_LIMIT_MAX` for testing. |
| `404 Not Found` on `/api/booking/whatsapp` in production | Deployed to a static-only host that does not execute `api/booking/whatsapp.ts`. | Deploy to Vercel (which runs `api/booking/whatsapp.ts`) or host behind a Node.js server mounting `handleNodeHttpRequest`. |

---

## 🔒 Security & Privacy

- **Server-Only Credentials**: `CALLMEBOT_APIKEY` and `CALLMEBOT_PHONE` are read exclusively on the server and are never exposed to the browser bundle, network tab, or error responses.
- **Clinical Note Privacy**: Free-text patient notes (`message`) are excluded from the WhatsApp notification payload and message text.
- **Log Redaction**: Neither client logs (`localStorage` / console) nor server logs record API keys, patient phone numbers, patient names, or clinical notes.
- **Abuse Protection**: `POST /api/booking/whatsapp` enforces a 4 KB payload limit, strict schema validation, and per-IP rate limiting.

---

## 📄 License

MIT License. Designed for MindCare Clinic. Built using the React Developer Framework (RDF).
