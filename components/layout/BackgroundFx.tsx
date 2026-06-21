"use client";

import { ShapeBlur } from "@/components/effects/ShapeBlur";

export function BackgroundFx() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-cinema-radial" />
      <div className="absolute inset-0 bg-cinema-mesh opacity-90" />
      <ShapeBlur />

      {/* Diagonal color wash */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background:
            "linear-gradient(125deg, rgba(77,162,255,0.06) 0%, transparent 38%, rgba(155,89,255,0.05) 58%, transparent 72%, rgba(255,107,53,0.08) 100%)",
        }}
      />

      {/* Static cinematic anchors */}
      <div className="absolute -left-32 -top-32 h-[560px] w-[560px] rounded-full bg-blue-500/14 blur-[130px]" />
      <div className="absolute -right-40 top-1/4 h-[480px] w-[480px] rounded-full bg-violet-500/12 blur-[140px]" />
      <div className="absolute -bottom-48 -right-32 h-[680px] w-[680px] rounded-full bg-ember-500/16 blur-[150px]" />
      <div className="absolute bottom-0 left-1/2 h-[320px] w-[85%] -translate-x-1/2 rounded-full bg-gradient-to-t from-ember-600/14 via-ember-500/6 to-transparent blur-[90px]" />
      <div className="absolute left-1/3 top-1/2 h-[240px] w-[50%] -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-500/10 via-transparent to-violet-500/8 blur-[100px]" />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  );
}