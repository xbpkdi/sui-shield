"use client";

import { ShapeBlur } from "@/components/effects/ShapeBlur";

export function BackgroundFx() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-cinema" />
      <div className="absolute inset-0 bg-cinema-depth" />
      <div className="absolute inset-0 bg-cinema-mesh opacity-55" />

      <div className="opacity-[0.42]">
        <ShapeBlur />
      </div>

      {/* Slow ambient anchors */}
      <div className="absolute -left-36 -top-28 h-[520px] w-[520px] animate-ambient-drift rounded-full bg-blue-500/[0.045] blur-[150px]" />
      <div
        className="absolute -right-44 top-[18%] h-[440px] w-[440px] animate-ambient-drift rounded-full bg-violet-500/[0.035] blur-[160px]"
        style={{ animationDelay: "-9s" }}
      />
      <div
        className="absolute -bottom-40 -right-28 h-[560px] w-[560px] animate-ambient-drift rounded-full bg-ember-500/[0.05] blur-[170px]"
        style={{ animationDelay: "-18s" }}
      />
      <div className="absolute bottom-0 left-1/2 h-[280px] w-[88%] -translate-x-1/2 rounded-full bg-gradient-to-t from-ember-600/[0.06] via-ember-500/[0.025] to-transparent blur-[100px]" />
      <div className="absolute left-[28%] top-[42%] h-[220px] w-[48%] rounded-full bg-gradient-to-r from-blue-500/[0.04] via-transparent to-violet-500/[0.03] blur-[110px]" />

      <div className="absolute inset-0 bg-dashboard-vignette" />
      <div className="absolute inset-0 bg-film-grain" />
      <div className="absolute inset-0 bg-cinema-grid" />
    </div>
  );
}