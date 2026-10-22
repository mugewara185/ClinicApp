/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WHATSAPP_ENABLED?: string;
  readonly VITE_MOCK_BOOKING?: string;
  readonly VITE_CLINIC_WHATSAPP_NUMBER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

