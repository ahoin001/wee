/**
 * Vite renderer environment flags. Use instead of `process.env.NODE_ENV` in `src/`
 * so ESLint `no-undef` passes and behavior matches the Vite build.
 */
export const IS_DEV = import.meta.env.DEV;
export const IS_PROD = import.meta.env.PROD;
