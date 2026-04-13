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
