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

- Use this section to log each profiling run before/after a perf phase.
- Recommended fields per entry:
  - Date/time + branch/commit
  - Scenario measured
  - Key numbers (CPU, GPU, long tasks, commit counts, memory trend)
  - Pass/fail against threshold
