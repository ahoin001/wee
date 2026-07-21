/** Performance profile id — shared by catalog + persistence (no store imports). */

export const PERFORMANCE_PROFILES = Object.freeze(['smooth', 'balanced', 'max', 'custom']);

export const DEFAULT_PERFORMANCE_PROFILE = 'balanced';

export function normalizePerformanceProfile(value) {
  return PERFORMANCE_PROFILES.includes(value) ? value : DEFAULT_PERFORMANCE_PROFILE;
}
