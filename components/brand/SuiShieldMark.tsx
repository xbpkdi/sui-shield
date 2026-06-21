"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

interface SuiShieldMarkProps {
  size?: number;
  className?: string;
}

/**
 * SuiShield brand mark — shield + Sui droplet + ember gas spark.
 * Scales cleanly from favicon-size to hero panels.
 */
export function SuiShieldMark({ size = 24, className }: SuiShieldMarkProps) {
  const uid = useId().replace(/:/g, "");
  const gradId = `suishield-grad-${uid}`;
  const glowId = `suishield-glow-${uid}`;

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
        <linearGradient id={gradId} x1="5" y1="3" x2="27" y2="29" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4DA2FF" />
          <stop offset="0.45" stopColor="#6B8FFF" />
          <stop offset="1" stopColor="#FF6B35" />
        </linearGradient>
        <radialGradient id={glowId} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(23 21) rotate(90) scale(6)">
          <stop stopColor="#FFB088" stopOpacity="0.9" />
          <stop offset="1" stopColor="#FF6B35" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Orbit arc — agent / network */}
      <path
        d="M24.5 8.5C26.8 11.2 28 14.5 28 18"
        stroke={`url(#${gradId})`}
        strokeWidth="1.25"
        strokeLinecap="round"
        opacity="0.45"
      />

      {/* Shield body */}
      <path
        d="M16 3.25L26.75 7.25V15.25C26.75 21.6 22.1 26.35 16 28.75C9.9 26.35 5.25 21.6 5.25 15.25V7.25L16 3.25Z"
        fill={`url(#${gradId})`}
      />

      {/* Top edge highlight */}
      <path
        d="M9.5 8.25C12.2 6.55 15.1 5.85 16 5.85C16.9 5.85 19.8 6.55 22.5 8.25"
        stroke="white"
        strokeOpacity="0.38"
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Sui droplet (negative space) */}
      <path
        d="M16 9.75C13.45 9.75 11.5 12.05 11.5 14.75C11.5 18.35 16 22.75 16 22.75C16 22.75 20.5 18.35 20.5 14.75C20.5 12.05 18.55 9.75 16 9.75Z"
        fill="#050816"
        fillOpacity="0.88"
      />

      {/* Gas spark */}
      <circle cx="23.25" cy="20.75" r="2.15" fill={`url(#${glowId})`} />
      <path
        d="M23.25 18.85V22.65M21.35 20.75H25.15"
        stroke="#FFE0CC"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
    </svg>
  );
}