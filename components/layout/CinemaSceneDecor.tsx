"use client";

import { motion } from "framer-motion";

/** Login / auth loading scene — rings and soft glows over BackgroundFx */
export function CinemaSceneDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.03] via-transparent to-ember-500/[0.03]" />
      <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-blue-500/[0.02] to-transparent lg:w-[42%]" />

      <div className="absolute left-1/2 top-1/2 size-[min(92vw,520px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-400/10" />
      <div className="absolute left-1/2 top-1/2 size-[min(78vw,440px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-400/8" />
      <div className="absolute left-1/2 top-1/2 size-[min(64vw,360px)] -translate-x-1/2 -translate-y-1/2">
        <motion.div
          className="size-full rounded-full border border-ember-400/12"
          animate={{ scale: [1, 1.03, 1], opacity: [0.45, 0.75, 0.45] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="absolute -left-20 top-1/4 h-72 w-72 rounded-full bg-gradient-to-br from-blue-500/8 to-transparent blur-[100px] lg:left-[8%]" />
      <div className="absolute bottom-1/4 right-0 h-80 w-80 rounded-full bg-gradient-to-tl from-ember-500/6 to-transparent blur-[110px] lg:right-[6%]" />
      <div className="absolute left-1/2 top-12 h-48 w-48 -translate-x-1/2 rounded-full bg-violet-500/4 blur-[90px] lg:left-[30%] lg:translate-x-0" />
    </div>
  );
}