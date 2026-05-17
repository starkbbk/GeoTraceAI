import { SignIn } from "@clerk/nextjs";
import { isClerkConfigured } from "@/lib/security/clerk-config";

export default function SignInPage() {
  if (!isClerkConfigured) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-2xl font-semibold text-white">Authentication is not configured</h1>
        <p className="text-sm text-slate-400">
          Set <code className="rounded bg-white/10 px-1.5 py-0.5">CLERK_SECRET_KEY</code> and{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> in your environment to
          enable Clerk sign-in.
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <SignIn appearance={{ variables: { colorPrimary: "#0d7ef2" } }} />
    </main>
  );
}
