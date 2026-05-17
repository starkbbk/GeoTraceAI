import { config } from "./config";

export async function verifyTurnstile(token?: string, remoteip?: string) {
  if (!config.turnstileSecretKey) {
    return { ok: true, skipped: true, reason: "TURNSTILE_SECRET_KEY is not configured." };
  }

  if (!token) return { ok: false, skipped: false, reason: "Missing Turnstile token." };

  const body = new FormData();
  body.append("secret", config.turnstileSecretKey);
  body.append("response", token);
  if (remoteip) body.append("remoteip", remoteip);

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body
  });
  const payload = (await response.json()) as { success?: boolean; "error-codes"?: string[] };

  return {
    ok: Boolean(payload.success),
    skipped: false,
    reason: payload.success ? "Verified" : payload["error-codes"]?.join(", ") ?? "Turnstile verification failed."
  };
}
