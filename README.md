<img width="1609" height="1010" alt="Wee desktop launcher" src="https://github.com/user-attachments/assets/9f366428-036e-4ef2-97a4-a4162e5955af" />

# Wee

**A Wii-inspired living desktop launcher for Windows.**

Wee turns your PC into a customizable channel plaza: launch apps, games, and sites from glass tiles, float widgets over your wallpaper, and switch between Home, Focus, Media Hub, and Game Hub with console-feel motion. It takes heavy inspiration from the Wii menu—then modernizes it for all-day desktop use.

> Not a pixel-perfect Wii recreation. The feel is the feature: springs, sound, glass, and deep customization without SaaS chrome or utility clutter.

---

## What you get

### Spaces

| Space | Role |
|-------|------|
| **Home** | Primary channel grid + widgets — your daily launcher |
| **Focus** | Second Home-like board for work / alternate layouts |
| **Media Hub** | Optional media browsing space (enable in settings) |
| **Game Hub** | Steam-oriented game shelf and collections |

Switch spaces from the left **space rail**. Page flips on Home/Focus use side peeks, the page indicator pill, wheel tilt, or shortcuts.

### Home board

- **Channels** — local apps (exe / shortcuts / Store apps), URLs, animated art (GIF/MP4), Ken Burns, idle behaviors
- **Live Board Studio** — right-click the grid (or Settings → Channels & layout) to arrange, resize, punch wallpaper holes, and place widgets
- **Widgets** — Now Playing, Quick Access, Clock, Weather, Recently Used, Steam Recent / Most Played / Friends
- **Per-page looks** — wallpaper (and ribbon accents) can follow each channel page

### Atmosphere & chrome

- Wallpaper library, opacity/blur/tone, cycling transitions, particle overlays
- **Ribbon** or classic dock — glass, glow, chrome FX, dynamic color match from wallpaper or Now Playing
- **Looks (presets)** — save, apply, import/export, and optionally share community looks
- Custom sounds for clicks, hover, startup, and background music
- Motion feedback with reduced-motion respect and low-power gates for long sessions

### Integrations

- **Now Playing** — Windows system media (Spotify Desktop, Apple Music, browsers, …) with transport controls on the Home tile
- **Spotify** — optional Web API floating widget / Premium features ([setup](docs/spotify-setup.md))
- **Steam** — library enrichment, friends, Game Hub, Home Steam tiles
- **Admin / Quick Access** — floating panel and Home tile for Windows power actions
- **Command palette** — Ctrl+Space for channels, settings, and actions

### System

- Multi-monitor detection, launch-on-monitor preferences, monitor-specific wallpaper
- Keyboard shortcuts, startup options, updates via GitHub releases
- Unified settings persistence (`unified-data.json`) — one source of truth for looks, boards, and chrome

---

## Install (users)

1. Download the latest **`Wee-Setup-*.exe`** from [Releases](https://github.com/ahoin001/wee/releases).
2. Run the installer. If Windows SmartScreen appears, choose **More info → Run anyway**.
3. Launch **Wee** from the Start Menu or Desktop.

---

## Develop from source

**Requirements:** Node.js (LTS), Windows (Electron + system media / Steam features).

```bash
git clone https://github.com/ahoin001/wee.git
cd wee
npm install
npm run dev
```

### Optional `.env`

```bash
# Community Looks (Supabase) — see docs/supabase-setup.md
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Spotify floating widget — see docs/spotify-setup.md
VITE_SPOTIFY_CLIENT_ID=...
```

### Useful scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite + Electron |
| `npm run build` | Production renderer build |
| `npm run lint` | Design-system / Tailwind contract check |
| `npm run lint:eslint` | Full ESLint |
| `npm run test:smoke` | Smoke checks |
| `npm run release:local` | Local release packaging |

Release publishing: [docs/release-guide.md](docs/release-guide.md).

---

## Project layout

| Path | Contents |
|------|----------|
| `src/` | React app — spaces, Home grid, dock, settings, UI kit, design tokens |
| `main/` | Electron main-process services (IPC, system media, Steam, etc.) |
| `shared/` | Shared contracts (e.g. settings patch merge) |
| `electron.cjs` / `preload.cjs` | Electron entry + preload bridge |
| `docs/` | Setup, architecture, chrome/style, performance |
| `supabase/` | Migrations for community Looks / media |
| `scripts/` | Release, tests, migrations, tooling |
| `PRODUCT.md` / `DESIGN.md` | Product register & visual system |
| `AGENTS.md` | Contributor / agent implementation checklist |

Architecture notes for spaces and boards: [docs/spaces-architecture.md](docs/spaces-architecture.md). Doc index: [docs/README.md](docs/README.md).

---

## Design principles (short)

1. **The feel is the feature** — motion and sound carry personality without blocking launch.
2. **Modernize the heart, not the pixels** — Wii warmth through glass and springs, not cosplay.
3. **Depth without overwhelm** — simple first run; power is discoverable.
4. **Built for all-day sessions** — gate heavy FX; prefer shared tokens and motion clocks.
5. **One vocabulary of whimsy** — extend `weeMotion`, design-system tokens, and `src/ui/` instead of one-offs.

---

## Contributing

Issues and PRs welcome. Prefer extending existing systems (store slices, slot kinds, motion helpers, UI primitives) over parallel paths — see `AGENTS.md` and `.cursor/rules/`.

---

## License / credits

Product name **Wee**. Inspired by Nintendo’s Wii Menu aesthetic; not affiliated with Nintendo.
