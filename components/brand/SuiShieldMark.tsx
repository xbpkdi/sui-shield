"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

interface SuiShieldMarkProps {
  size?: number;
  className?: string;
}

/**
 * SuiShield brand mark — bold shield silhouette with Sui droplet and ember gas core.
 * Optimized for legibility from 12px favicon through hero panels.
 */
export function SuiShieldMark({ size = 24, className }: SuiShieldMarkProps) {
  const uid = useId().replace(/:/g, "");
  const shieldGradId = `ss-shield-${uid}`;
  const dropGradId = `ss-drop-${uid}`;
  const coreGlowId = `ss-core-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={shieldGradId}
          x1="16"
          y1="3"
          x2="16"
          y2="28"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#4DA2FF" />
          <stop offset="0.55" stopColor="#5B8CFF" />
          <stop offset="1" stopColor="#FF6B35" />
        </linearGradient>
        <linearGradient
          id={dropGradId}
          x1="16"
          y1="9"
          x2="16"
          y2="23"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#050816" />
          <stop offset="0.72" stopColor="#0B1228" />
          <stop offset="1" stopColor="#FF6B35" />
        </linearGradient>
        <radialGradient
          id={coreGlowId}
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(16 20.5) scale(5)"
        >
          <stop stopColor="#FFB088" stopOpacity="0.95" />
          <stop offset="0.45" stopColor="#FF6B35" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FF6B35" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Shield body — strong silhouette */}
      <path
        d="M16 2.75L27.25 6.75V14.75C27.25 21.35 22.15 26.15 16 28.75C9.85 26.15 4.75 21.35 4.75 14.75V6.75L16 2.75Z"
        fill={`url(#${shieldGradId})`}
      />

      {/* Inner rim — depth at small sizes */}
      <path
        d="M16 5.25L24.75 8.5V14.75C24.75 19.85 20.85 23.65 16 25.65C11.15 23.65 7.25 19.85 7.25 14.75V8.5L16 5.25Z"
        stroke="white"
        strokeOpacity="0.14"
        strokeWidth="0.75"
      />

      {/* Ember gas core (behind droplet) */}
      <ellipse cx="16" cy="20.25" rx="3.75" ry="2.25" fill={`url(#${coreGlowId})`} />

      {/* Sui droplet — navy body, ember tip */}
      <path
        d="M16 8.75C13.05 8.75 10.75 11.15 10.75 14.25C10.75 18.1 16 23.25 16 23.25C16 23.25 21.25 18.1 21.25 14.25C21.25 11.15 18.95 8.75 16 8.75Z"
        fill={`url(#${dropGradId})`}
      />

      {/* Top edge highlight */}
      <path
        d="M9.25 8C12.1 6.2 15.15 5.45 16 5.45C16.85 5.45 19.9 6.2 22.75 8"
        stroke="white"
        strokeOpacity="0.42"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}