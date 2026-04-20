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

## Native wallpaper helper (decision)

After **renderer/store tuning**, **visibility-aware pause**, and **wallpaper path** optimizations:

- **Default**: Stay on **Electron + React**; the plan is to reach a healthy background without a full native UI rewrite.
- **Optional later**: A **small native helper** only for decode/compositing hot paths (e.g. wallpaper/video) can be justified **if** JS/CSS optimizations plateau and profiling shows decode/GPU as the dominant cost.
- **Not recommended as a first step**: Rewriting the whole shell in C++/Qt or swapping to Tauri solely for efficiency — integration cost is high and does not automatically match Wallpaper Engine–class idle behavior.

Revisit this decision when Phases 1–3 are measured against the baselines above.
