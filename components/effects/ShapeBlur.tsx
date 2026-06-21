"use client";

import { useEffect, useRef } from "react";

/**
 * Ambient shape blur — cursor-reactive background glow (10K bonus + Castimedia navy/ember).
 * Stays behind content; pointer-events-none on parent BackgroundFx.
 */
export function ShapeBlur() {
  const blobRef = useRef<HTMLDivElement>(null);
  const blob2Ref = useRef<HTMLDivElement>(null);
  const blob3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const narrow = window.matchMedia("(max-width: 767px)").matches;
    if (reduced || !fine || narrow) return;

    const blobs = [blobRef.current, blob2Ref.current, blob3Ref.current].filter(Boolean);
    if (blobs.length === 0) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      targetX = (e.clientX / window.innerWidth - 0.5) * 120;
      targetY = (e.clientY / window.innerHeight - 0.5) * 90;
    };

    const tick = () => {
      currentX += (targetX - currentX) * 0.04;
      currentY += (targetY - currentY) * 0.04;
      if (blobRef.current) {
        blobRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      }
      if (blob2Ref.current) {
        blob2Ref.current.style.transform = `translate3d(${-currentX * 0.6}px, ${currentY * 0.4}px, 0)`;
      }
      if (blob3Ref.current) {
        blob3Ref.current.style.transform = `translate3d(${currentX * 0.35}px, ${-currentY * 0.5}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };

    document.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      document.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div
        ref={blobRef}
        className="blur-blob blur-blob-blue pointer-events-none absolute -left-32 top-1/4"
        aria-hidden="true"
      />
      <div
        ref={blob2Ref}
        className="blur-blob blur-blob-ember pointer-events-none absolute -right-16 bottom-1/4"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2"
        aria-hidden="true"
      >
        <div ref={blob3Ref} className="blur-blob blur-blob-violet" />
      </div>
      <div
        className="blur-blob blur-blob-ember-soft pointer-events-none absolute left-1/4 bottom-1/4"
        aria-hidden="true"
      />
    </>
  );
}