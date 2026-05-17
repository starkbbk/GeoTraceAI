"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { LocationIntelligence } from "@/lib/osint/types";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

export function LeafletMap({ location }: { location: LocationIntelligence }) {
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    const center = location.coordinates ?? { lat: 20, lng: 0, confidenceRadiusKm: 2500 };
    const map = L.map(mapRef.current, {
      center: [center.lat, center.lng],
      zoom: location.countryCode === "GLOBAL" ? 2 : 10,
      scrollWheelZoom: false,
      zoomControl: true
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    L.marker([center.lat, center.lng], { icon: markerIcon })
      .addTo(map)
      .bindPopup(
        `${location.approximateArea ?? location.city ?? "Approximate region"}<br />Confidence radius: ${center.confidenceRadiusKm} km`
      );

    L.circle([center.lat, center.lng], {
      radius: center.confidenceRadiusKm * 1000,
      color: "#4caeff",
      fillColor: "#4caeff",
      fillOpacity: 0.12,
      weight: 1
    }).addTo(map);

    return () => {
      map.remove();
    };
  }, [location]);

  return <div ref={mapRef} className="h-[330px] w-full rounded-lg" />;
}
