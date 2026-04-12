# Channel editor — follow-ups for review

This note lists behaviors that are intentionally narrow, environment-dependent, or still ambiguous after the ChannelModal refactor (hooks extraction, path validation, and suggested-games component split).

## Resolved in this pass

- **Live validation**: Path and type are re-validated on a **320ms debounce** while editing; errors show on `UnifiedAppPathCard` via `externalValidationError`.
- **Smart suggestions**: `getSmartPathSuggestions` + `ChannelPathSmartSuggestions` offer one-click fixes (e.g. add `https://` to domains, switch launch type when the path clearly matches Steam/Epic/exe/Store, extract App ID from Steam store URLs).
- **Path validation** is centralized in `validateChannelPath` (aligned with launch handlers).
- **Steam numeric App IDs** are accepted in the field; **save** persists `steam://rungameid/<id>` via `normalizeChannelPath`.
- **Unified app matching** (`findMatchingAppForPath`) resolves numeric Steam IDs as well as `steam://rungameid/...` URIs.
- **Suggested Steam/Epic picks** now call `setPath` / `setType` so the unified path card and stored channel stay in sync.
- **Media handling** is consolidated in `useChannelModalMedia`.
- **Verbose `UnifiedAppPathCard` logs** are gated behind `import.meta.env.DEV`.
- **Duplicate Steam library rows** are warned only in development.

## Items for product or later engineering review

1. **Other launchers** (GOG, Battle.net, Xbox app, etc.): Suggested Content is Steam + Epic only; expanding requires scanner/API work and UI scope.
2. **Epic URI strictness**: Validation expects `com.epicgames.launcher://` URIs; custom shortcuts or older formats may need explicit support.
3. **EXE paths with arguments / working directory**: Validation allows typical `.exe` patterns; edge cases (batch wrappers, PowerShell, `%env%`) are not fully modeled in the client validator.
4. **Gallery / Ken Burns multi-image**: Still marked not ready in the UI; hook supports gallery state but feature remains off.
5. **Media library MIME types for Epic**: When picking from the media library carousel, `setMedia.type` may still reflect internal `file_type` strings rather than full MIME types in some paths—verify playback vs. image preview if issues appear.
6. **`useChannelModalMedia` vs. `currentMedia` prop**: Initial state comes from `useState(currentMedia)`; channel switches are driven primarily by `useChannelModalInitialization` calling `setMedia`. If `currentMedia` ever changes without that hook running, consider a dedicated sync effect (only if a real bug is observed).

## Launch pipeline (`launchApp.cjs`)

- Main process uses **`ipcMain.handle('launch-app')`** and returns `{ ok, error? }` so the renderer can log failures.
- Routing is **path-first** where safe: `http(s)`, `steam://`, `com.epicgames.launcher://`, then Steam numeric IDs, Store AUMIDs, then `exe` spawn, then **`shell.openPath`** for `.lnk` and other Explorer-handled paths.

## No automated test coverage

Channel path rules and suggested-games behavior are not covered by unit tests in this repo yet; consider adding tests around `channelPathValidation.js` and `channelModalFindMatchingApp.js` first.
