/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_APP_ENV?: string;
  /** See the SECURITY note in src/services/cryptoUtils.ts. */
  readonly VITE_ENCRYPTION_PASSWORD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
