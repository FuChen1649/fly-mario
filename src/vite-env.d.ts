/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FLY_LLM_URL?: string;
  readonly VITE_FLY_LLM_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
