"use client";

import { useEffect, useRef } from "react";
import { useMotionValue, useSpring, useTransform, motion } from "framer-motion";

interface CountUpProps {
  value: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
}

export function CountUp({ value, decimals = 0, suffix = "", prefix = "" }: CountUpProps) {
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { damping: 30, stiffness: 120 });
  const display = useTransform(spring, (v) => `${prefix}${v.toFixed(decimals)}${suffix}`);
  const prevRef = useRef(0);

  useEffect(() => {
    motionValue.set(value);
    prevRef.current = value;
  }, [value, motionValue]);

  return <motion.span>{display}</motion.span>;
}
