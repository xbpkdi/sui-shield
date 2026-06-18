# Migration from Visual Prototype

This project was built with a Lovable-generated visual prototype as a read-only UX reference.

## What Was Preserved

- Color palette: deep navy `#070b1f`, Sui blue, cyan, violet accents
- Sidebar layout (248px, collapsible on mobile)
- TopBar structure (project selector, mode badge, budget bar, run simulation button)
- GlassCard component pattern
- StatusBadge component and tone system
- Demo Lab: 6 scenarios, flow steps, agent decision panel, event timeline
- Dashboard KPI grid layout
- Agent log display (OBSERVE/REASON/ACT/RESULT phases with color coding)

## What Was Changed

- Framework: TanStack Start (Vite) → Next.js 15 App Router
- Routing: TanStack Router → Next.js App Router with route groups
- State: direct Zustand store with mock numbers → derived metrics from real collections
- Mode terminology: "Safe Mode" → **Protective Mode** (avoids confusion with Sui protocol)
- Typography: oklch color values → standard Tailwind/hsl tokens for broader compatibility
- Architecture: Lovable-generated structure → production-oriented domain structure with features/, lib/, stores/, types/ separation
- Policy logic: inline in components → isolated `features/policy/engine.ts`
- Workflow logic: inline in Demo Lab component → `features/agent/workflow.ts`
- All pages now read from a single Zustand store; no contradictory numbers

## What Was Removed

- All Lovable metadata, branding, and dependencies
- `@lovable.dev/vite-tanstack-config` dev dependency
- Lovable error reporting
- References to the prototype folder at runtime
- "Safe Mode" terminology

## Independence Guarantee

This project runs, builds, and deploys independently. The prototype folder can be deleted without any effect on this codebase.
