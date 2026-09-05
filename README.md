# 🏥 MindCare Clinic — Psychological Clinic Landing Page

> A modern, production-ready frontend for a psychological clinic featuring appointment booking and WhatsApp notifications, built with **React**, **TypeScript**, **Vite**, **Tailwind CSS**, and following the **React Developer Framework (RDF)** methodology.

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
  - Clean form with Full Name, Phone / WhatsApp, Session Type, Preferred Date (picker restricted to future dates), Preferred Time Slot, and optional message.
  - Zero sign-up / login barrier for patients.
  - Client-side validation powered by **React Hook Form** + **Zod**.
- **WhatsApp Notification Integration**:
  - Automatically notifies the clinic owner's WhatsApp upon appointment submission via the **CallMeBot API**.
  - Formatted message includes patient name, phone number, session type, date, time slot, and patient notes.
  - **Development Mode**: Mocked API with configurable network delays and full RDF logging (no actual messages sent).
  - **Production Mode**: Direct HTTP GET call to CallMeBot WhatsApp gateway using environment variables.
- **RDF (React Developer Framework) Architecture**:
  - **DataFactory**: Schema-driven test data generation with deterministic seeding and relationship support.
  - **Structured Logger**: Hierarchical namespaced logging (`api:*`, `component:*`, `booking:*`), colored console output, and automatic `localStorage` persistence.
  - **DevToolkit**: Network delay simulator (`ApiSimulator`), error injection, and boolean feature flags (`FeatureToggle`).
  - **Console Diagnostics (`window.__DEV__`)**: Real-time access in developer console to query logs, test slow networks, and generate mock schemas.
  - **Shared Layer**: Reusable `useApi`, `useLocalStorage`, `useAsync` hooks, response wrappers, and validators.
- **Resilience & UX**:
  - React **ErrorBoundary** logging critical errors to RDF logger.
  - Self-contained **Toast notification** system for feedback.
  - Fully responsive from mobile (375px) to ultra-wide displays.

---

## 🏗️ Project Architecture (RDF)

```
clinic-app/
├── public/
├── src/
│   ├── framework/                      # RDF Core Layer
│   │   ├── data-factory/               # Schema-driven mock data generator
│   │   │   ├── core/
│   │   │   │   ├── FactoryBuilder.ts   # Core builder & field generator resolver
│   │   │   │   ├── FactoryRegistry.ts  # Registry storing schemas & records
│   │   │   │   └── types.ts            # SchemaDef, FieldDef, GeneratorContext
│   │   │   ├── hooks/
│   │   │   │   └── useFactory.ts       # React hook for data generation
│   │   │   └── index.ts
│   │   ├── dev-toolkit/                # Developer utilities & simulators
│   │   │   ├── simulators/
│   │   │   │   ├── ApiSimulator.ts     # Delays, random delays, error injection
│   │   │   │   └── FeatureToggle.ts    # Dynamic feature flags
│   │   │   └── index.ts
│   │   ├── logging/                    # Structured logging system
│   │   │   ├── core/
│   │   │   │   ├── Logger.ts           # Core logger with localStorage persistence
│   │   │   │   └── types.ts            # LogEntry, LogLevel, LoggerConfig, LogStats
│   │   │   ├── domains/
│   │   │   │   ├── api.ts              # apiLogger (request, response, error, cached)
│   │   │   │   └── component.ts        # componentLogger (mount, unmount, render, effect)
│   │   │   └── index.ts
│   │   ├── schemas/                    # RDF Entity Schemas
│   │   │   ├── clinic.ts               # Clinic profile & operating hours
│   │   │   ├── doctor.ts               # Doctor schema (qualifications, bio, ratings)
│   │   │   ├── service.ts              # Psychological services schema & static list
│   │   │   └── testimonial.ts          # Patient feedback schema
│   │   └── init.ts                     # Framework bootstrap & window.__DEV__ export
│   │
│   ├── features/                       # Modular Feature Layer
│   │   ├── home/                       # Landing Page Feature
│   │   │   ├── components/
│   │   │   │   ├── DoctorCard.tsx
│   │   │   │   ├── FAQSection.tsx
│   │   │   │   ├── HeroSection.tsx
│   │   │   │   ├── ServicesList.tsx
│   │   │   │   ├── StatsSection.tsx
│   │   │   │   └── TestimonialsCarousel.tsx
│   │   │   └── index.tsx
│   │   └── booking/                    # Appointment Booking Feature
│   │       ├── components/
│   │       │   ├── BookingForm.tsx     # RHF + Zod booking form
│   │       │   └── BookingSuccess.tsx  # Confirmation card with booking reference
│   │       ├── schemas/
│   │       │   └── booking.schema.ts   # Zod validation schema & time slots
│   │       ├── services/
│   │       │   └── BookingService.ts   # WhatsApp notification handler & logger
│   │       └── index.tsx
│   │
│   ├── shared/                         # Shared Reusable Layer
│   │   ├── constants/
│   │   │   ├── errors.ts               # Standard error messages
│   │   │   └── http.ts                 # HTTP status constants
│   │   ├── hooks/
│   │   │   ├── useApi.ts               # Generic API hook with retry & RDF logging
│   │   │   ├── useAsync.ts             # Promise lifecycle state hook
│   │   │   ├── useLocalStorage.ts      # Typed localStorage hook with cross-tab sync
│   │   │   └── index.ts
│   │   ├── types/
│   │   │   └── index.ts                # Common response, toast, and async types
│   │   └── utils/
│   │       ├── formatters.ts           # Date, 12h time, and phone formatters
│   │       ├── response.ts             # ResponseShape envelope helpers
│   │       └── validators.ts           # Phone & date validation helpers
│   │
│   ├── components/                     # App Shell Components
│   │   ├── ErrorBoundary.tsx           # React class error boundary with RDF logging
│   │   ├── Footer.tsx                  # Clinic contact info & operating hours
│   │   ├── Navbar.tsx                  # Sticky navbar with mobile drawer
│   │   └── Toast.tsx                   # Toast notification context & alerts
│   │
│   ├── App.tsx                         # Root app orchestrator
│   ├── index.css                       # Tailwind CSS directives & animations
│   ├── main.tsx                        # Entry point (initializes RDF before React mount)
│   └── vite-env.d.ts                   # Vite environment variable types
│
├── .env.example                        # Template for environment configuration
├── .env                                # Local development configuration
├── package.json
├── postcss.config.js                   # PostCSS configuration for Tailwind CSS
├── tailwind.config.js                  # Tailwind theme and custom clinic color palette
├── tsconfig.json                       # TypeScript configuration
└── vite.config.ts                      # Vite bundler configuration
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: version `18.0.0` or higher
- **npm**: version `9.0.0` or higher

### 2. Installation
```bash
# Navigate to project directory
cd clinic-app

# Install dependencies
npm install
```

### 3. Environment Setup
Copy the example environment file:
```bash
cp .env.example .env
```

Open `.env` and set your configuration:
```env
# The clinic owner's WhatsApp number WITH country code (no + sign or spaces)
# Example for Saudi Arabia (+966 51 234 5678):
VITE_CALLMEBOT_PHONE=966512345678

# Your CallMeBot API key
VITE_CALLMEBOT_APIKEY=your_callmebot_api_key_here

# Keep false during development (mocks WhatsApp calls & logs to console)
# Set to true in production
VITE_WHATSAPP_ENABLED=false
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📱 WhatsApp Setup (CallMeBot)

The app uses **CallMeBot**, a free, serverless API that sends WhatsApp messages directly from web applications without requiring a backend server.

### How the Clinic Owner Sets Up CallMeBot (One-time, 2 minutes):
1. Add the CallMeBot phone number to your WhatsApp contacts:
   - Phone number: `+34 644 59 77 39`
   - Name: `CallMeBot`
2. Open WhatsApp and send the following message to that contact:
   ```text
   I allow callmebot to send me messages
   ```
3. CallMeBot will reply within a few seconds with your personal **API key**:
   ```text
   CallMeBot API Activated for +966512345678. Your APIKey is: 123456
   ```
4. Put your phone number and API key in `.env`:
   ```env
   VITE_CALLMEBOT_PHONE=966512345678
   VITE_CALLMEBOT_APIKEY=123456
   VITE_WHATSAPP_ENABLED=true
   ```

### Message Format Received by Clinic Owner:
```
🏥 *New Appointment Request — MindCare Clinic*

👤 *Patient:* Layla Al-Ahmad
📱 *Phone:* 0512345678
💆 *Session:* Cognitive Behavioral Therapy
📅 *Date:* Monday, October 12, 2026
⏰ *Time:* 10:00 AM
💬 *Notes:* Experiencing chronic work stress and trouble sleeping.

📌 Reply to confirm or reschedule.
```

---

## 🛠️ Developer Console Diagnostics (`window.__DEV__`)

In development mode (`import.meta.env.DEV === true`), the RDF toolkit is mounted globally to `window.__DEV__`. Open Chrome DevTools (`F12`) and test:

```javascript
// 1. Inspect recent structured logs
window.__DEV__.logger.getLogs();

// 2. Filter logs by level or namespace
window.__DEV__.logger.getLogs({ level: 'ERROR' });
window.__DEV__.logger.getByNamespace('booking:.*');

// 3. View logging statistics summary
window.__DEV__.logger.stats();

// 4. Export all logs as JSON or CSV
console.log(window.__DEV__.logger.export('csv'));

// 5. Simulate slow network for booking (adds 2500ms delay)
window.__DEV__.api.setDelay('booking:whatsapp', 2500);

// 6. Simulate API failure on booking (test error handling)
window.__DEV__.api.setError('booking:whatsapp', 500, 'Simulated WhatsApp Gateway Error');

// 7. Clear simulated errors
window.__DEV__.api.clearError('booking:whatsapp');

// 8. Generate additional mock data on the fly
window.__DEV__.factory.create('testimonial', { count: 3 });

// 9. Inspect or toggle feature flags
window.__DEV__.features.getAll();
window.__DEV__.features.toggle('whatsappEnabled');

// 10. Reset all simulators and clear logs
window.__DEV__.resetAll();
```

---

## 🚢 Production Deployment

### Build for Production
```bash
npm run build
```
This produces an optimized, minified bundle in `/dist` with tree-shaken assets and compiled CSS.

### Preview Production Build Locally
```bash
npm run preview
```

### Deploy to Vercel
1. Push the code to GitHub/GitLab.
2. Import the repository into [Vercel](https://vercel.com).
3. Set **Root Directory** to `clinic-app`.
4. Under **Environment Variables**, add:
   - `VITE_CALLMEBOT_PHONE`: Your WhatsApp number (e.g. `966512345678`)
   - `VITE_CALLMEBOT_APIKEY`: Your CallMeBot API key
   - `VITE_WHATSAPP_ENABLED`: `true`
5. Click **Deploy**.

### Deploy to Netlify
1. Connect repository in [Netlify](https://netlify.com).
2. Set **Base directory**: `clinic-app`
3. Set **Build command**: `npm run build`
4. Set **Publish directory**: `dist`
5. In **Site Configuration > Environment Variables**, add:
   - `VITE_CALLMEBOT_PHONE`
   - `VITE_CALLMEBOT_APIKEY`
   - `VITE_WHATSAPP_ENABLED=true`
6. Click **Deploy site**.

---

## 🔒 Security & Privacy

- **No Passwords / Credentials in Logs**: RDF Logger includes automatic sanitization that redacts values for keys matching `password`, `secret`, `token`, `key`, `credential`, or `apikey`.
- **Form Privacy**: Form inputs are processed purely client-side and dispatched directly over encrypted HTTPS without intermediary storage.
- **Client-Side Data Sanitization**: Form values are validated against rigorous Zod schemas before being passed to the network layer.

---

## 📄 License

MIT License. Designed for MindCare Clinic. Built using the React Developer Framework (RDF).
