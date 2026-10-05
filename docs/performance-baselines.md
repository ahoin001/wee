# Performance baselines (Wee)

This checklist supports **idle / foreground health** goals: low CPU and GPU when the app is occluded or backgrounded, and smooth interaction when the user is actively using the hub. Use it to capture **before/after** numbers when changing wallpaper, store subscriptions, IPC persistence, or hub lists.

## Scenarios to measure

| Scenario | What to do | What to watch |
|----------|------------|----------------|
| Cold start | Launch app, wait until hub is interactive | Main-thread long tasks (Performance), memory |
| Idle — wallpaper visible | Stay on home with wallpaper visible, no input | CPU %, GPU % (Task Manager), steady state |
| Idle — occluded | Fullscreen another app on top of Wee, or minimize Wee | CPU/GPU should drop; no runaway timers (Performance) |
| Active hub | Navigate spaces, open Game Hub / Media Hub | Frame time, jank, React commit counts |
| Media Hub — discover scroll | Scroll discover grid with a large catalog | Scroll smoothness; list churn (React Profiler) |
| Game Hub — library scroll | Large Steam/Epic library | Same as above |

## How to capture baselines

1. **Windows Task Manager** — Details: `Wee.exe` CPU and GPU columns while reproducing each scenario.
2. **Chromium DevTools (Performance)** — Record 10–20s per scenario; note long tasks on the main thread and scripting time.
3. **Memory** — DevTools Memory: heap snapshot after idle 2 minutes vs after heavy hub use (watch for unbounded growth).
4. **Optional (packaged build)** — Electron `contentTracing` for one session if you need main/IO timing (advanced).

## Example budgets (tune for your machine)

These are **starting targets**, not guarantees:

- **Occluded / minimized**: CPU near idle for the process; no sustained main-thread work in Performance.
- **Foreground hub**: Avoid unnecessary full-store React subscriptions in always-mounted shells; long lists should window when item count is large.

### Baseline capture template (fill before/after each phase)

| Scenario | Metric | Baseline (before) | Candidate (after) | Pass threshold |
|----------|--------|-------------------|-------------------|----------------|
| Cold start | Time to interactive | | | No regression > 10% |
| Home active | Main-thread long tasks (10–20s trace) | | | Equal or fewer long tasks |
| Hub switch (home/game/media) | Visible jank / dropped frames | | | Equal or better |
| Media local scroll | Scripting + rendering cost | | | Equal or better |
| Idle occluded | CPU trend | | | Equal or lower |
| Idle occluded | GPU trend | | | Equal or lower |
| 5 min idle | Heap growth | | | No unbounded growth |

## Motion guardrails (non-negotiable)

- Keep current choreography and spring personality (gooey, playful motion language remains intact).
- Do not remove entrance/exit animations; optimize implementation cost only.
- Avoid replacing shared modal/shell orchestration with one-off timing logic.
- Validate rapid state changes (`home ↔ mediahub ↔ gamehub`) for no half-entry flashes.
- Validate repeated open/close cycles for settings/menus/modals to ensure exits always render.
- Validate reduced-motion paths continue to enter/exit cleanly with no lingering overlays.

## Native wallpaper helper (decision)

After **renderer/store tuning**, **visibility-aware pause**, and **wallpaper path** optimizations:

- **Default**: Stay on **Electron + React**; the plan is to reach a healthy background without a full native UI rewrite.
- **Optional later**: A **small native helper** only for decode/compositing hot paths (e.g. wallpaper/video) can be justified **if** JS/CSS optimizations plateau and profiling shows decode/GPU as the dominant cost.
- **Not recommended as a first step**: Rewriting the whole shell in C++/Qt or swapping to Tauri solely for efficiency — integration cost is high and does not automatically match Wallpaper Engine–class idle behavior.

Revisit this decision when Phases 1–3 are measured against the baselines above.

## Baseline session log

- Dev samplers are opt-in: set `localStorage['wee.perf.monitor'] = '1'` for `utils/PerformanceMonitor.js`; the store sampler only runs while the Performance Monitor widget has monitoring on. Leave both off when recording traces.

### 2026-10-05 — Performance budget refactor (static audit, before)

| Hot path | Before |
|----------|--------|
| `useAppActivity` | 3 DOM listeners + 1 IPC listener + 2 `useState` per caller (each tile, preview, interval hook) |
| `useUIState` | Whole `ui` slice subscribed by action-only callers (ribbon, admin widgets, system pad) |
| `useChannelOperations` | Whole `channels` slice subscribed per tile via `useChannelEffectiveState` |
| `IsolatedWallpaperBackground` | Whole `channels` + `appearanceBySpace` subscribed |
| `useMusicReactiveLevels` | `setLevels` at 24 fps re-rendering ribbon + Now Playing |
| `useWallpaperCycling` | `setState` every RAF frame during a cycle |
| Wallpaper tone | `filter: brightness() saturate()` on the full-viewport layer even when neutral |
| Ribbon glow pulse | Infinite `filter: drop-shadow` keyframes |

Fill CPU / GPU / long-task numbers per scenario in the template above when a live trace is recorded.

### 2026-10-05 — Performance budget refactor (after)

| Hot path | After |
|----------|-------|
| `useAppActivity` | One `useSyncExternalStore` signal; listeners attach on first subscriber, detach after last; notifies only on change |
| `useUIState` | Action-only callers use `useUIActions` (subscribes to `setUIState` only); `useUIState` reads 4 modal fields via `useShallow` |
| `useChannelOperations` | Tiles use `useChannelActions` + `useChannelConfig(id)`; navigation chrome uses `useChannelNavigation` (one space, shallow) |
| `IsolatedWallpaperBackground` | Flat primitive selector (active space appearance, page, direction, page count) |
| `useMusicReactiveLevels` | Writes `--lvl-i` on a ref'd host; bars use `scaleY(var(--lvl-i))` — zero React commits per frame |
| `useWallpaperCycling` | 4 renders per cycle (`from` → `run` → `settle` → idle); CSS transition with `--wee-wallpaper-cycle-ease-*`; blur static |
| Wallpaper tone | `filter: none` when neutral; darkening via black overlay `opacity` instead of `brightness()` |
| Ribbon glow pulse | Static drop-shadow on a sibling halo layer; only `opacity` animates; `ribbon-fx-paused` when inactive |
| Backdrop blur | `--wee-glass-blur-sm/md/lg/xl`; `html.wee-power-efficient` (from `usePowerPolicy().isEfficient`) drops all backdrop filters and swaps `--glass-bg` → `--glass-bg-opaque` |
| Per tile | `useMotionFeedback` shared module cache; Ken Burns pauses off the current strip page; one shared `IntersectionObserver` |

Verified in a dev browser session: 24-tile Home renders, page flips (rapid next ×4, then prev) settle correctly with no console errors, and toggling `.wee-power-efficient` takes backdrop-filter surfaces from 10 to 0. Live CPU/GPU trace numbers and Electron-only paths (IPC window activity, wallpaper cycling with a real liked list, music visualizer) are still to be recorded in the packaged app.

- Use this section to log each profiling run before/after a perf phase.
- Recommended fields per entry:
  - Date/time + branch/commit
  - Scenario measured
  - Key numbers (CPU, GPU, long tasks, commit counts, memory trend)
  - Pass/fail against threshold
