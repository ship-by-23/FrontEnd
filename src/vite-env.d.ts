/// <reference types="vite/client" />

interface Window {
  /** Runtime configuration injected by the container without rebuilding the static artifact. */
  __SIMPANDULU_CONFIG__?: {
    apiUrl?: string;
    appEnv?: string;
    appVersion?: string;
  };
}

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_APP_ENV?: string;
  readonly VITE_APP_VERSION?: string;
}
