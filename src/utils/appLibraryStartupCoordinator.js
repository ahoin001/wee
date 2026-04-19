/**
 * Tracks whether the global idle prefetch chain (see `scheduleAppLibraryBackgroundPrefetch`)
 * is scheduled so Game Hub can skip redundant Steam/Epic client scans on mount.
 */

let backgroundPrefetchScheduled = false;

export function markAppLibraryBackgroundPrefetchScheduled() {
  backgroundPrefetchScheduled = true;
}

export function isAppLibraryBackgroundPrefetchScheduled() {
  return backgroundPrefetchScheduled;
}
