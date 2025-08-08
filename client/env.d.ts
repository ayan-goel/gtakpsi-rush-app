/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BROADCASTER_API_PREFIX: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
