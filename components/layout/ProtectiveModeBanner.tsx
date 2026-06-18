"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ShieldAlert } from "lucide-react";
import { useSuiShieldStore } from "@/stores/suishield";

export function ProtectiveModeBanner() {
  const mode = useSuiShieldStore((s) => s.currentMode);
  const queuedCount = useSuiShieldStore((s) => s.queuedIntents.length);

  return (
    <AnimatePresence>
      {mode === "protective" && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-center gap-3 border-b border-red-500/20 bg-red-500/8 px-5 py-2.5 text-sm">
            <ShieldAlert className="size-4 shrink-0 text-red-400" aria-hidden="true" />
            <span className="font-medium text-red-300">
              Protective Mode active — gasless sponsorship paused.
            </span>
            <span className="text-red-400/70">
              {queuedCount > 0
                ? `${queuedCount} intent${queuedCount === 1 ? "" : "s"} queued for replay.`
                : "New intents are being queued until the network stabilizes."}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
