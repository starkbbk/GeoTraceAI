"use client";

import dynamic from "next/dynamic";
import { LocationIntelligence } from "@/lib/osint/types";

const LeafletMap = dynamic(() => import("./leaflet-map").then((mod) => mod.LeafletMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-[330px] items-center justify-center rounded-lg bg-white/[0.04] text-sm text-slate-400">
      Loading map
    </div>
  )
});

export function MapPanel({ location }: { location: LocationIntelligence }) {
  return <LeafletMap location={location} />;
}
