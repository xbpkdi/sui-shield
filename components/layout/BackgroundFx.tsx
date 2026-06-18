"use client";

export function BackgroundFx() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      {/* Sui blue glow top-left */}
      <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-[120px]" />
      {/* Violet glow bottom-right */}
      <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-violet-600/4 blur-[140px]" />
      {/* Subtle center gradient */}
      <div className="absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-cyan-500/3 blur-[100px]" />
    </div>
  );
}
