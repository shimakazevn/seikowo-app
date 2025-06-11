/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BLOG_TITLE?: string;
  readonly VITE_BLOG_DESCRIPTION?: string;
  readonly VITE_BLOG_AUTHOR?: string;
  readonly VITE_SOCIAL_TWITTER?: string;
  readonly VITE_SOCIAL_GITHUB?: string;
  readonly VITE_SOCIAL_LINKEDIN?: string;
  readonly VITE_BLOG_ID?: string;
  readonly VITE_GOOGLE_API_KEY?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_GOOGLE_CLIENT_SECRET?: string;
  readonly VITE_GOOGLE_REDIRECT_URI?: string;
  readonly VITE_ENCRYPTION_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 