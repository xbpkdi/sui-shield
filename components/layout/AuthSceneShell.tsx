"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { BackgroundFx } from "@/components/layout/BackgroundFx";
import { CinemaSceneDecor } from "@/components/layout/CinemaSceneDecor";

interface AuthSceneShellProps {
  children: ReactNode;
  className?: string;
}

/** Full-screen cinematic backdrop for login, callback, and auth guard states */
export function AuthSceneShell({ children, className }: AuthSceneShellProps) {
  return (
    <div className={cn("relative isolate min-h-screen overflow-hidden", className)}>
      <BackgroundFx />
      <CinemaSceneDecor />
      {children}
    </div>
  );
}