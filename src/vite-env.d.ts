/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CALLMEBOT_PHONE: string;
  readonly VITE_CALLMEBOT_APIKEY: string;
  readonly VITE_WHATSAPP_ENABLED: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
