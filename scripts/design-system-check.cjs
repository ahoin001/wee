#!/usr/bin/env node
/**
 * Verifies design-system contract: Tailwind theme reads CSS variables (no hardcoded Wii HSL in tailwind.config).
 * Run: node scripts/design-system-check.cjs
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const tailwindPath = path.join(root, "tailwind.config.js");
const dsPath = path.join(root, "src", "styles", "design-system.css");

let failed = false;
function fail(msg) {
  console.error(`[design-system-check] ${msg}`);
  failed = true;
}

const tw = fs.readFileSync(tailwindPath, "utf8");
if (/wii-blue['"]:\s*['"]hsl\(195/.test(tw)) {
  fail("tailwind.config.js must use hsl(var(--wii-blue)) for brand colors, not hardcoded HSL.");
}
if (!tw.includes("hsl(var(--wii-blue))")) {
  fail("tailwind.config.js should map wii-blue to hsl(var(--wii-blue)).");
}
if (!tw.includes("borderRadius:") || !tw.includes("var(--radius-sm)")) {
  fail("tailwind.config.js should map borderRadius to var(--radius-*).");
}

const ds = fs.readFileSync(dsPath, "utf8");

/*
 * Radius tokens must be lengths. A percentage border-radius resolves horizontally
 * against width and vertically against height, so it paints an ellipse on any box
 * that is not square — this is what `--control-radius-playful: min(1.65rem, 30%)` did.
 */
for (const [, name, value] of ds.matchAll(/(--[\w-]*radius[\w-]*)\s*:\s*([^;]+);/g)) {
  if (/\d%/.test(value)) {
    fail(
      `${name} is defined with a percentage (${value.trim()}). Percentage radii paint ellipses on non-square boxes — use a length.`
    );
  }
}

/*
 * Radius ratchet. Existing ad-hoc literals are grandfathered per file; any file not
 * on this list must use a token so the ladder in design-system.css stays the one
 * source of truth. Shrink this list, never grow it.
 */
const RADIUS_LITERAL_DEBT = new Set([
  "src/components/channels/Channel.jsx",
  "src/components/channels/ChannelTileArtFrame.jsx",
  "src/components/channels/WeeChannelModal.jsx",
  "src/components/channels/channelModal/ChannelModalChannelArtPanel.jsx",
  "src/components/game-hub/GameHubGameArtPanel.jsx",
  "src/components/home-grid/AdminQuickAccessSlot.jsx",
  "src/components/home-grid/EditSceneTools.jsx",
  "src/components/home-grid/HomeWidgetShell.jsx",
  "src/components/home-grid/NowPlayingSlot.jsx",
  "src/components/home-grid/SteamFriendsSlot.jsx",
  "src/components/home-grid/SteamGamesShelf.jsx",
  "src/components/media-hub/MediaHubSpace.jsx",
  "src/components/media/MediaLibraryBrowser.jsx",
  "src/components/modals/ImageSearchModal.jsx",
  "src/components/modals/UpdateModal.jsx",
  "src/components/navigation/PaginatedChannels.jsx",
  "src/components/palette/CommandPalette.jsx",
  "src/components/settings/ChannelsLayoutSettingsTab.jsx",
  "src/components/settings/PresetsSettingsTab.jsx",
  "src/components/settings/SettingsLivePreviewFrame.jsx",
  "src/components/settings/UpdatesSettingsTab.jsx",
  "src/components/settings/dock/ClassicDockPanel.jsx",
  "src/components/settings/wallpaper/SurfacesScenePreview.jsx",
  "src/ui/wee/WeeChoiceTileGrid.jsx",
  "src/ui/wee/WeeGooeyTileButton.jsx",
  "src/ui/wee/WeeNotice.jsx",
  "src/ui/wee/WeePlayPauseGlyph.jsx",
  "src/ui/wee/WeePopover.jsx",
  "src/ui/wee/WeeSettingsCollapsibleSection.jsx",
]);

const RADIUS_LITERAL = /!?rounded(?:-(?:t|r|b|l|tl|tr|br|bl|s|e|ss|se|es|ee))?-\[([^\]]+)\]/g;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".jsx")) out.push(full);
  }
  return out;
}

const scanRoots = [
  path.join(root, "src", "components"),
  path.join(root, "src", "ui"),
].filter((dir) => fs.existsSync(dir));

const newRadiusDebt = [];
for (const file of scanRoots.flatMap((dir) => walk(dir))) {
  const rel = path.relative(root, file).split(path.sep).join("/");
  const source = fs.readFileSync(file, "utf8");
  const literals = [...source.matchAll(RADIUS_LITERAL)]
    .map((m) => m[1])
    // Keywords like `inherit` are fine; only hardcoded lengths are debt.
    .filter((value) => /\d/.test(value) && !value.includes("var("));
  if (literals.length === 0 || RADIUS_LITERAL_DEBT.has(rel)) continue;
  newRadiusDebt.push(`${rel} → ${[...new Set(literals)].join(", ")}`);
}
if (newRadiusDebt.length > 0) {
  fail(
    `ad-hoc border radius outside the token ladder. Use a --radius-* / --control-radius-* / --wee-radius-* token:\n  ${newRadiusDebt.join(
      "\n  "
    )}`
  );
}

const required = [
  "--text-on-accent",
  "--text-inverse",
  "--state-error-light",
  "--state-error-hover",
  "--surface-wii-tint",
];
for (const token of required) {
  if (!ds.includes(token)) {
    fail(`design-system.css must define ${token}`);
  }
}

if (failed) {
  process.exit(1);
}
console.log("[design-system-check] OK — Tailwind and design-system.css are aligned.");
