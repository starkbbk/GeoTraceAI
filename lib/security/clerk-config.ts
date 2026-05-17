/**
 * Clerk runtime configuration.
 *
 * Returns whether Clerk is configured and provides safe accessors. When
 * Clerk environment variables are absent, the app continues to run with
 * authentication disabled (open-mode for local development).
 */

export const clerkConfig = {
  publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY,
  signInUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/sign-in",
  signUpUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? "/sign-up",
  afterSignInUrl:
    process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL ?? "/dashboard",
  afterSignUpUrl:
    process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL ?? "/dashboard"
};

export const isClerkConfigured = Boolean(
  clerkConfig.publishableKey && clerkConfig.secretKey
);
