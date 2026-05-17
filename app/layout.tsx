import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { clerkConfig, isClerkConfigured } from "@/lib/security/clerk-config";

export const metadata: Metadata = {
  title: "GeoTrace AI",
  description: "Authorized public-source intelligence dashboard for entity research.",
  metadataBase: new URL("https://geotrace-ai.local")
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const body = (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );

  // Only mount the ClerkProvider when keys are configured. This keeps the
  // dev experience (and the build) functional when Clerk credentials are
  // absent.
  if (!isClerkConfigured) return body;

  return (
    <ClerkProvider
      publishableKey={clerkConfig.publishableKey}
      signInUrl={clerkConfig.signInUrl}
      signUpUrl={clerkConfig.signUpUrl}
      signInFallbackRedirectUrl={clerkConfig.afterSignInUrl}
      signUpFallbackRedirectUrl={clerkConfig.afterSignUpUrl}
      appearance={{ variables: { colorPrimary: "#0d7ef2" } }}
    >
      {body}
    </ClerkProvider>
  );
}
