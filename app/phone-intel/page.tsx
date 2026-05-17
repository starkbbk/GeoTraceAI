import { AppShell } from "@/components/app-shell";
import { PhoneSearchView } from "@/components/phone-search-view";

export default function PhoneIntelPage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-4 pb-28 pt-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">Phone & Truecaller Intelligence Portal</h1>
          <p className="mt-2 text-sm text-slate-400 sm:text-base">
            Dedicated portal for real-time mobile numbering intelligence. Verify Truecaller Caller ID names, telecom circles, exact carriers, spam scores, and digital messaging presence.
          </p>
        </div>
        <PhoneSearchView />
      </main>
    </AppShell>
  );
}
