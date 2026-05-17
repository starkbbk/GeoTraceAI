"use client";

import { motion } from "framer-motion";
import { Loader2, RadioTower } from "lucide-react";

const steps = ["Parsing identifiers", "Checking regional formats", "Querying public APIs", "Linking entities", "Scoring risk"];

export function ScanLoader() {
  return (
    <div className="rounded-lg border border-accent-300/20 bg-accent-400/10 p-4">
      <div className="mb-4 flex items-center gap-3 text-accent-100">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm font-medium">Investigation running</span>
      </div>
      <div className="space-y-2">
        {steps.map((step, index) => (
          <motion.div
            key={step}
            className="flex items-center gap-3 rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-300"
            initial={{ opacity: 0.35 }}
            animate={{ opacity: [0.35, 1, 0.35] }}
            transition={{ duration: 1.6, repeat: Infinity, delay: index * 0.18 }}
          >
            <RadioTower className="h-4 w-4 text-accent-200" />
            {step}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
