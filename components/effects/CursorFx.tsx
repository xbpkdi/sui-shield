"use client";

import { useEffect, useRef, useState } from "react";

const INTERACTIVE_SELECTOR =
  "a, button, [role='button'], input, select, textarea, label, summary, .btn-magnetic, [data-cursor-hover]";

/**
 * Trail / blob cursor — fluffy ember glow (10K PDF + Castimedia dual-tone).
 * Not a sharp circle: soft blurred radial gradients with lag.
 */
export function CursorFx() {
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);
  const emberRef = useRef<HTMLDivElement>(null);
  const blueRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: -200, y: -200 });
  const emberPos = useRef({ x: -200, y: -200 });
  const bluePos = useRef({ x: -200, y: -200 });
  const rafRef = useRef(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const narrow = window.matchMedia("(max-width: 1023px)");
    if (reduced || !fine || narrow.matches) return;

    setEnabled(true);
    document.documentElement.classList.add("custom-cursor-active");

    const onMove = (e: MouseEvent) => {
      target.current = { x: e.clientX, y: e.clientY };
    };

    const animate = () => {
      emberPos.current.x += (target.current.x - emberPos.current.x) * 0.09;
      emberPos.current.y += (target.current.y - emberPos.current.y) * 0.09;
      bluePos.current.x += (target.current.x - bluePos.current.x) * 0.05;
      bluePos.current.y += (target.current.y - bluePos.current.y) * 0.05;

      const ember = emberRef.current;
      const blue = blueRef.current;
      if (ember) {
        ember.style.left = `${emberPos.current.x}px`;
        ember.style.top = `${emberPos.current.y}px`;
      }
      if (blue) {
        blue.style.left = `${bluePos.current.x}px`;
        blue.style.top = `${bluePos.current.y}px`;
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    const onEnter = () => setHovering(true);
    const onLeave = () => setHovering(false);
    const bound = new WeakSet<EventTarget>();

    const bindInteractives = () => {
      document.querySelectorAll(INTERACTIVE_SELECTOR).forEach((el) => {
        if (bound.has(el)) return;
        bound.add(el);
        el.addEventListener("mouseenter", onEnter);
        el.addEventListener("mouseleave", onLeave);
      });
    };

    document.addEventListener("mousemove", onMove, { passive: true });
    rafRef.current = requestAnimationFrame(animate);
    bindInteractives();

    const observer = new MutationObserver(bindInteractives);
    observer.observe(document.body, { childList: true, subtree: true });

    const onResize = () => {
      if (narrow.matches) {
        document.documentElement.classList.remove("custom-cursor-active");
        setEnabled(false);
      }
    };
    narrow.addEventListener("change", onResize);

    return () => {
      document.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafRef.current);
      narrow.removeEventListener("change", onResize);
      observer.disconnect();
      document.documentElement.classList.remove("custom-cursor-active");
      document.querySelectorAll(INTERACTIVE_SELECTOR).forEach((el) => {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
      });
    };
  }, []);

  if (!enabled) return null;

  return (
    <div className="cursor-fx-root" aria-hidden="true">
      <div ref={blueRef} className="cursor-blob cursor-blob--blue" />
      <div
        ref={emberRef}
        className={`cursor-blob cursor-blob--ember${hovering ? " cursor-blob--hover" : ""}`}
      />
    </div>
  );
}