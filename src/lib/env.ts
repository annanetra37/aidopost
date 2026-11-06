// Central, typed access to environment configuration. Server-only.
function opt(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

export const env = {
  appUrl: opt("APP_URL", "http://localhost:3000"),
  redisUrl: opt("REDIS_URL"),
  anthropicKey: opt("ANTHROPIC_API_KEY"),
  claudeFastModel: opt("CLAUDE_FAST_MODEL", "claude-haiku-5-5"),
  claudePromptModel: opt("CLAUDE_PROMPT_MODEL", "claude-sonnet-5-5"),
  geminiKey: opt("GEMINI_API_KEY"),
  geminiImageModel: opt("GEMINI_IMAGE_MODEL", "gemini-2.5-flash-image"),
  geminiImageModelPro: opt("GEMINI_IMAGE_MODEL_PRO", "gemini-3-pro-image-preview"),
  fidelityCheck: opt("FEATURE_FIDELITY_CHECK") === "true",
  braveKey: opt("BRAVE_SEARCH_API_KEY"),
  resendKey: opt("RESEND_API_KEY"),
  emailFrom: opt("EMAIL_FROM", "AidoPost <hello@aidopost.com>"),
  storageDriver: opt("STORAGE_DRIVER", "local") as "local" | "azure" | "s3",
  azure: {
    connectionString: opt("AZURE_STORAGE_CONNECTION_STRING"),
    container: opt("AZURE_STORAGE_CONTAINER", "aidopost"),
  },
  localStorageDir: opt("LOCAL_STORAGE_DIR", "./storage"),
  s3: {
    bucket: opt("S3_BUCKET"),
    region: opt("S3_REGION", "auto"),
    endpoint: opt("S3_ENDPOINT"),
    accessKeyId: opt("S3_ACCESS_KEY_ID"),
    secretAccessKey: opt("S3_SECRET_ACCESS_KEY"),
  },
};
