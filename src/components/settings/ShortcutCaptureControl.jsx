import React, { useCallback, useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import Text from '../../ui/Text';
import WButton from '../../ui/WButton';
import WToggle from '../../ui/WToggle';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import {
  checkShortcutConflict,
  createDefaultKeyboardShortcuts,
  formatShortcut,
  getModifierFromKeyboardEvent,
  normalizeModifier,
  validateShortcut,
} from '../../utils/keyboardShortcuts';

/** Shell chords that must not be remapped while recording. Escape is remappable (Quick Menu). */
export const RESERVED_SHORTCUT_CHORDS = [
  { key: 'i', modifier: 'ctrl+shift', label: 'Developer Tools', description: 'Open developer tools' },
  { key: 'f', modifier: 'ctrl+shift', label: 'Force Developer Tools', description: 'Force open dev tools (development only)' },
  { key: 'f11', modifier: 'none', label: 'Toggle Fullscreen', description: 'Switch between windowed and fullscreen' },
];

export function renderShortcutKeyChips(shortcut) {
  if (!shortcut || !shortcut.enabled || !shortcut.key) return null;
  const shortcutString = formatShortcut(shortcut);
  const parts = shortcutString.split('+');
  return (
    <div className="inline-flex flex-wrap items-center gap-1">
      {parts.map((keyPart, index) => (
        <React.Fragment key={`${keyPart}-${index}`}>
          <span className="rounded-md border border-[hsl(var(--primary)/0.4)] bg-[hsl(var(--primary)/0.12)] px-1.5 py-0.5 font-mono text-[11px] font-black text-[hsl(var(--primary))]">
            {keyPart}
          </span>
          {index < parts.length - 1 ? (
            <span className="text-[hsl(var(--text-tertiary))]" aria-hidden>
              +
            </span>
          ) : null}
        </React.Fragment>
      ))}
    </div>
  );
}

/**
 * Shared capture / edit / toggle / clear for one remappable shortcut.
 * Writes into `ui.keyboardShortcuts` so Admin settings and Shortcuts stay in sync.
 */
export default function ShortcutCaptureControl({
  shortcutId,
  compact = false,
  showToggle = true,
  showClear = true,
  showLabel = true,
  className = '',
}) {
  const keyboardShortcutsFromStore = useConsolidatedAppStore((state) => state.ui?.keyboardShortcuts);
  const setUIState = useConsolidatedAppStore(useShallow((state) => state.actions.setUIState));

  const keyboardShortcuts =
    keyboardShortcutsFromStore?.length > 0
      ? keyboardShortcutsFromStore
      : createDefaultKeyboardShortcuts();

  const shortcut = keyboardShortcuts.find((s) => s.id === shortcutId) || null;

  const [recording, setRecording] = useState(false);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');

  const updateShortcut = useCallback(
    (updates) => {
      const next = keyboardShortcuts.map((s) => (s.id === shortcutId ? { ...s, ...updates } : s));
      setUIState({ keyboardShortcuts: next });
    },
    [keyboardShortcuts, setUIState, shortcutId]
  );

  const cancelRecording = useCallback(() => {
    setRecording(false);
    setPreview('');
    setError('');
  }, []);

  const saveChord = useCallback(
    (key, modifier) => {
      const updates = { key, modifier, enabled: true };
      const validation = validateShortcut(updates);
      if (!validation.valid) {
        setError(validation.error);
        return;
      }
      const conflict = checkShortcutConflict({ ...updates, id: shortcutId }, keyboardShortcuts.filter((s) => s.enabled));
      if (conflict.hasConflict) {
        setError(`Conflict with “${conflict.conflictingShortcut.name}”`);
        return;
      }
      updateShortcut(updates);
      cancelRecording();
    },
    [cancelRecording, keyboardShortcuts, shortcutId, updateShortcut]
  );

  useEffect(() => {
    if (!recording) return undefined;

    const onKeyDown = (event) => {
      event.preventDefault();
      event.stopPropagation();

      const key = event.key.toLowerCase();
      if (key === 'escape') {
        cancelRecording();
        return;
      }
      if (['control', 'alt', 'shift', 'meta'].includes(key)) return;

      const modifier = getModifierFromKeyboardEvent(event);
      const isReserved = RESERVED_SHORTCUT_CHORDS.some(
        (reserved) =>
          reserved.key === key && normalizeModifier(reserved.modifier) === normalizeModifier(modifier)
      );
      if (isReserved) {
        setPreview('Reserved — cannot use');
        setError('That chord is reserved by the shell');
        return;
      }

      setPreview(formatShortcut({ key, modifier }));
      saveChord(key, modifier);
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [cancelRecording, recording, saveChord]);

  if (!shortcut) {
    return (
      <Text variant="caption" className="text-[hsl(var(--state-error))]">
        Shortcut not found
      </Text>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`.trim()} data-recording-shortcut={recording ? 'true' : undefined}>
      {showLabel && !compact ? (
        <div className="min-w-0">
          <Text variant="body" className="text-sm font-semibold text-[hsl(var(--text-primary))]">
            {shortcut.name}
          </Text>
          <Text variant="caption" className="text-xs text-[hsl(var(--text-tertiary))]">
            {shortcut.description}
          </Text>
        </div>
      ) : null}

      <div className={`flex flex-wrap items-center gap-2 ${compact ? '' : 'justify-between'}`.trim()}>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {recording ? (
            <div className="rounded-lg border border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.12)] px-2 py-1 font-mono text-[11px] font-bold text-[hsl(var(--primary))] animate-pulse">
              {preview || 'Press keys…'}
            </div>
          ) : shortcut.enabled && shortcut.key ? (
            renderShortcutKeyChips(shortcut)
          ) : (
            <Text variant="caption" className="text-[hsl(var(--text-tertiary))]">
              Not bound
            </Text>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {recording ? (
            <WButton variant="secondary" size="sm" onClick={cancelRecording}>
              Cancel
            </WButton>
          ) : (
            <>
              <WButton
                variant="secondary"
                size="sm"
                onClick={() => {
                  setError('');
                  setPreview('');
                  setRecording(true);
                }}
              >
                {shortcut.key ? 'Edit' : 'Bind'}
              </WButton>
              {showClear ? (
                <WButton
                  variant="tertiary"
                  size="sm"
                  onClick={() => updateShortcut({ key: '', modifier: 'none', enabled: false })}
                >
                  Clear
                </WButton>
              ) : null}
              {showToggle ? (
                <WToggle
                  checked={Boolean(shortcut.enabled)}
                  onChange={() => updateShortcut({ enabled: !shortcut.enabled })}
                  disableLabelClick
                />
              ) : null}
            </>
          )}
        </div>
      </div>

      {recording ? (
        <Text variant="caption" className="text-[10px] uppercase tracking-[0.08em] text-[hsl(var(--text-tertiary))]">
          Press a key combo to save · Esc cancels
        </Text>
      ) : null}

      {error ? (
        <Text variant="caption" className="text-[hsl(var(--state-error))]">
          {error}
        </Text>
      ) : null}
    </div>
  );
}
