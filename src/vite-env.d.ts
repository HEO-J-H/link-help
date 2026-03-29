/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_VAPID_PUBLIC_KEY?: string;
  /** Optional default Link-Help API origin for new sessions (e.g. http://localhost:8787) */
  readonly VITE_LINK_HELP_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
