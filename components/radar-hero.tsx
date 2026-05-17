"use client";

import { motion } from "framer-motion";
import { Crosshair, Fingerprint, Network, Radar } from "lucide-react";

export function RadarHero() {
  return (
    <div className="relative min-h-[420px] overflow-hidden rounded-lg border border-white/10 bg-radar-grid bg-[length:240px_240px,36px_36px,36px_36px] p-6 shadow-glow scan-line">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(21,128,230,0.18),transparent_56%)]" />
      <div className="absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent-300/20">
        <span className="radar-ring inset-8" />
        <span className="radar-ring inset-20 [animation-delay:800ms]" />
        <span className="radar-ring inset-32 [animation-delay:1600ms]" />
      </div>
      <motion.div
        className="absolute left-1/2 top-1/2 h-44 w-1 origin-bottom rounded-full bg-gradient-to-t from-accent-300/70 to-transparent"
        animate={{ rotate: 360 }}
        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
      />
      <div className="relative z-10 grid h-full min-h-[360px] content-between">
        <div className="flex items-center justify-between">
          <div className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
            PUBLIC SOURCES ONLY
          </div>
          <Radar className="h-6 w-6 text-accent-100" />
        </div>
        <div className="mx-auto grid w-full max-w-sm grid-cols-2 gap-3">
          {[
            { label: "Identity", icon: Fingerprint, value: "87%" },
            { label: "Geo", icon: Crosshair, value: "12 km" },
            { label: "Graph", icon: Network, value: "18 links" },
            { label: "Risk", icon: Radar, value: "Watch" }
          ].map((item) => (
            <motion.div
              key={item.label}
              className="rounded-lg border border-white/10 bg-black/25 p-4 backdrop-blur-md"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <item.icon className="mb-3 h-5 w-5 text-accent-200" />
              <p className="text-xs text-slate-400">{item.label}</p>
              <p className="mt-1 text-lg font-semibold text-white">{item.value}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
