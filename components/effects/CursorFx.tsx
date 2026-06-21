"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const INTERACTIVE_SELECTOR =
  "a, button, [role='button'], input, select, textarea, label, summary, .btn-magnetic, [data-cursor-hover]";

/** Match Tailwind `lg` — desktop layout with mouse */
const DESKTOP_MQ = "(min-width: 1024px)";

/**
 * Trail / blob cursor — fluffy ember glow (10K PDF + Castimedia dual-tone).
 * Not a sharp circle: soft blurred radial gradients with lag.
 */
export function CursorFx() {
  const enabledRef = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const emberRef = useRef<HTMLDivElement>(null);
  const blueRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: -200, y: -200 });
  const emberPos = useRef({ x: -200, y: -200 });
  const bluePos = useRef({ x: -200, y: -200 });
  const rafRef = useRef(0);
  const bindTimerRef = useRef(0);
  const bound = useRef(new Set<EventTarget>());

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fine = window.matchMedia("(pointer: fine)");
    const desktop = window.matchMedia(DESKTOP_MQ);

    const shouldEnable = () => !reduced.matches && fine.matches && desktop.matches;

    const onEnter = () => {
      emberRef.current?.classList.add("cursor-blob--hover");
    };

    const onLeave = () => {
      emberRef.current?.classList.remove("cursor-blob--hover");
    };

    const bindInteractives = () => {
      document.querySelectorAll(INTERACTIVE_SELECTOR).forEach((el) => {
        if (bound.current.has(el)) return;
        bound.current.add(el);
        el.addEventListener("mouseenter", onEnter, { passive: true });
        el.addEventListener("mouseleave", onLeave, { passive: true });
      });
    };

    const scheduleBindInteractives = () => {
      window.clearTimeout(bindTimerRef.current);
      bindTimerRef.current = window.setTimeout(bindInteractives, 80);
    };

    const unbindInteractives = () => {
      document.querySelectorAll(INTERACTIVE_SELECTOR).forEach((el) => {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
      });
      bound.current.clear();
    };

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

    const setVisible = (visible: boolean) => {
      const root = rootRef.current;
      if (!root) return;
      root.classList.toggle("invisible", !visible);
      root.classList.toggle("opacity-0", !visible);
    };

    const start = () => {
      if (enabledRef.current) return;
      enabledRef.current = true;
      emberRef.current?.classList.remove("cursor-blob--hover");
      document.documentElement.classList.add("custom-cursor-active");
      document.addEventListener("mousemove", onMove, { passive: true });
      bindInteractives();
      setVisible(true);
      rafRef.current = requestAnimationFrame(animate);
    };

    const stop = () => {
      if (!enabledRef.current) return;
      enabledRef.current = false;
      emberRef.current?.classList.remove("cursor-blob--hover");
      document.documentElement.classList.remove("custom-cursor-active");
      document.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafRef.current);
      window.clearTimeout(bindTimerRef.current);
      unbindInteractives();
      setVisible(false);
    };

    const sync = () => {
      if (shouldEnable()) start();
      else stop();
    };

    const observer = new MutationObserver(() => {
      if (enabledRef.current) scheduleBindInteractives();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    sync();
    reduced.addEventListener("change", sync);
    fine.addEventListener("change", sync);
    desktop.addEventListener("change", sync);
    window.addEventListener("resize", sync);

    return () => {
      window.removeEventListener("resize", sync);
      reduced.removeEventListener("change", sync);
      fine.removeEventListener("change", sync);
      desktop.removeEventListener("change", sync);
      observer.disconnect();
      window.clearTimeout(bindTimerRef.current);
      stop();
    };
  }, []);

  return (
    <div ref={rootRef} className={cn("cursor-fx-root invisible opacity-0")} aria-hidden="true">
      <div ref={blueRef} className="cursor-blob cursor-blob--blue" />
      <div ref={emberRef} className="cursor-blob cursor-blob--ember" />
    </div>
  );
}