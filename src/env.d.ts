/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_CMS_BACKEND?: string;
  readonly PUBLIC_GITHUB_APP_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
