import { SignUp } from "@clerk/nextjs";
import { isClerkConfigured } from "@/lib/security/clerk-config";

export default function SignUpPage() {
  if (!isClerkConfigured) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-2xl font-semibold text-white">Authentication is not configured</h1>
        <p className="text-sm text-slate-400">
          Set Clerk environment variables in <code className="rounded bg-white/10 px-1.5 py-0.5">.env.local</code> to enable
          sign-up.
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <SignUp appearance={{ variables: { colorPrimary: "#0d7ef2" } }} />
    </main>
  );
}
