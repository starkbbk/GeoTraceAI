export const config = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  jwtSecret: process.env.JWT_SECRET ?? "development-only-secret-change-me",
  turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-5.1-mini",
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
  deepseekApiKey: process.env.DEEPSEEK_API_KEY,
  // DeepSeek's hosted API exposes `deepseek-chat` and `deepseek-reasoner`.
  // Set DEEPSEEK_MODEL=deepseek-v4-flash (or any model your account has access to)
  // to override. We default to `deepseek-chat` because it's the universally
  // available endpoint and avoids hard failures when the requested model
  // isn't enabled on the user's account.
  deepseekModel: process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
  githubToken: process.env.GITHUB_TOKEN,
  hibpApiKey: process.env.HIBP_API_KEY,
  leakLookupApiKey: process.env.LEAKLOOKUP_API_KEY,
  leakLookupApiUrl: process.env.LEAKLOOKUP_API_URL ?? "https://leak-lookup.com/api",
  publicApiContactEmail: process.env.PUBLIC_API_CONTACT_EMAIL ?? "osint@localhost.local",
  redisUrl: process.env.REDIS_URL,
  databaseUrl: process.env.DATABASE_URL
};
