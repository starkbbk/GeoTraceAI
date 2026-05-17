import { AppShell } from "@/components/app-shell";
import { VehicleSearchView } from "@/components/vehicle-search-view";

export default function VehicleInfoPage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-4 pb-28 pt-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">Vehicle Intelligence Portal</h1>
          <p className="mt-2 text-sm text-slate-400 sm:text-base">
            Dedicated portal for public vehicle registration intelligence. Search and inspect RTO records, specifications, and important compliance dates.
          </p>
        </div>
        <VehicleSearchView />
      </main>
    </AppShell>
  );
}
