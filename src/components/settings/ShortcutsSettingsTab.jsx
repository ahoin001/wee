import React, { useState, useCallback, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  AppWindow,
  Compass,
  Keyboard,
  LayoutGrid,
  Lightbulb,
  Lock,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import Text from '../../ui/Text';
import WButton from '../../ui/WButton';
import WToggle from '../../ui/WToggle';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import {
  formatShortcut,
  validateShortcut,
  checkShortcutConflict,
  getShortcutsByCategory,
  DEFAULT_SHORTCUTS,
} from '../../utils/keyboardShortcuts';
import { WeeModalFieldCard, WeeSettingsCollapsibleSection } from '../../ui/wee';
import SettingsTabPageHeader from './SettingsTabPageHeader';
import './surfaceStyles.css';

const CATEGORY_ICONS = {
  Navigation: Compass,
  Settings: SlidersHorizontal,
  Widgets: LayoutGrid,
  Interface: AppWindow,
};

const ShortcutsSettingsTab = React.memo(() => {
  const ui = useConsolidatedAppStore((state) => state.ui);
  const actions = useConsolidatedAppStore(
    useShallow((state) => ({
      setUIState: state.actions.setUIState,
      resetKeyboardShortcuts: state.actions.resetKeyboardShortcuts,
    }))
  );

  const [editingShortcut, setEditingShortcut] = useState(null);
  const [shortcutError, setShortcutError] = useState('');
  const [recordingShortcut, setRecordingShortcut] = useState(false);
  const [currentShortcut, setCurrentShortcut] = useState('');

  const keyboardShortcuts =
    ui?.keyboardShortcuts ||
    DEFAULT_SHORTCUTS.map((shortcut) => ({
      ...shortcut,
      key: shortcut.defaultKey,
      modifier: shortcut.defaultModifier,
      enabled: true,
    }));

  const RESERVED_SHORTCUTS = [
    { key: 'Ctrl+Shift+I', label: 'Developer Tools', description: 'Open browser developer tools' },
    { key: 'Ctrl+Shift+F', label: 'Force Developer Tools', description: 'Force open dev tools (development only)' },
    { key: 'F11', label: 'Toggle Fullscreen', description: 'Switch between windowed and fullscreen' },
    { key: 'Escape', label: 'Settings Action Menu', description: 'Quick settings access' },
  ];

  const updateKeyboardShortcut = useCallback(
    (shortcutId, updates) => {
      const updatedShortcuts = keyboardShortcuts.map((shortcut) =>
        shortcut.id === shortcutId ? { ...shortcut, ...updates } : shortcut
      );
      actions.setUIState({ keyboardShortcuts: updatedShortcuts });
    },
    [keyboardShortcuts, actions]
  );

  const handleResetShortcuts = useCallback(() => {
    if (window.confirm('Reset all keyboard shortcuts to defaults?')) {
      actions.resetKeyboardShortcuts();
    }
  }, [actions]);

  const handleEditShortcut = useCallback((shortcut) => {
    setEditingShortcut(shortcut);
    setShortcutError('');
    setRecordingShortcut(true);
    setCurrentShortcut('');
  }, []);

  const handleSaveShortcut = useCallback(
    (shortcutId, updates) => {
      const validation = validateShortcut(updates);
      if (!validation.valid) {
        setShortcutError(validation.error);
        return;
      }

      const conflict = checkShortcutConflict(updates, keyboardShortcuts);
      if (conflict.hasConflict) {
        setShortcutError(`Conflict with “${conflict.conflictingShortcut.name}”`);
        return;
      }

      updateKeyboardShortcut(shortcutId, updates);
      setEditingShortcut(null);
      setShortcutError('');
      setRecordingShortcut(false);
      setCurrentShortcut('');
    },
    [keyboardShortcuts, updateKeyboardShortcut]
  );

  const handleCancelEditShortcut = useCallback(() => {
    setEditingShortcut(null);
    setShortcutError('');
    setRecordingShortcut(false);
    setCurrentShortcut('');
  }, []);

  const handleToggleShortcut = useCallback(
    (shortcutId) => {
      const shortcut = keyboardShortcuts.find((s) => s.id === shortcutId);
      if (shortcut) {
        updateKeyboardShortcut(shortcutId, { enabled: !shortcut.enabled });
      }
    },
    [keyboardShortcuts, updateKeyboardShortcut]
  );

  useEffect(() => {
    if (!recordingShortcut) return;

    const handleKeyDown = (event) => {
      event.preventDefault();

      const key = event.key.toLowerCase();
      const modifier = event.ctrlKey
        ? 'ctrl'
        : event.altKey
          ? 'alt'
          : event.shiftKey
            ? 'shift'
            : event.metaKey
              ? 'meta'
              : 'none';

      const shortcutString = formatShortcut({ key, modifier });
      if (RESERVED_SHORTCUTS.some((reserved) => reserved.key === shortcutString)) {
        setCurrentShortcut('Reserved — cannot use');
        setTimeout(() => {
          setRecordingShortcut(false);
          setEditingShortcut(null);
          setCurrentShortcut('');
        }, 2000);
        return;
      }

      setCurrentShortcut(shortcutString);

      setTimeout(() => {
        if (editingShortcut) {
          handleSaveShortcut(editingShortcut.id, { key, modifier });
        }
      }, 500);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [recordingShortcut, editingShortcut, handleSaveShortcut]);

  const renderShortcutKey = (shortcut) => {
    if (!shortcut || !shortcut.enabled) return null;

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
  };

  const renderReservedKeyChips = (keyString) => {
    const parts = keyString.split('+');
    return (
      <div className="inline-flex flex-wrap items-center gap-1">
        {parts.map((keyPart, index) => (
          <React.Fragment key={`${keyString}-${index}`}>
            <span className="rounded-md border border-[hsl(var(--border-primary)/0.5)] bg-[hsl(var(--surface-tertiary))] px-1.5 py-0.5 font-mono text-[11px] font-bold text-[hsl(var(--text-primary))]">
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
  };

  const groupedShortcuts = getShortcutsByCategory(keyboardShortcuts);

  return (
    <div className="mx-auto flex max-w-4xl flex-col space-y-6 pb-12">
      <SettingsTabPageHeader
        title="Shortcuts"
        subtitle="Keyboard shortcuts & hotkeys — bind keys for settings, widgets, and navigation"
      />

      <div className="flex justify-end">
        <WButton variant="secondary" onClick={handleResetShortcuts} size="sm" className="gap-1.5">
          <RotateCcw size={14} strokeWidth={2.5} aria-hidden />
          Reset to defaults
        </WButton>
      </div>

      {shortcutError ? (
        <WeeModalFieldCard
          hoverAccent="none"
          paddingClassName="p-4"
          className="border border-[hsl(var(--state-error)/0.45)] bg-[hsl(var(--state-error-light)/0.45)]"
        >
          <Text variant="body" className="text-[hsl(var(--state-error))]">
            {shortcutError}
          </Text>
        </WeeModalFieldCard>
      ) : null}

      {Object.entries(groupedShortcuts).map(([category, shortcuts]) => {
        const CategoryIcon = CATEGORY_ICONS[category] || Keyboard;
        return (
          <WeeSettingsCollapsibleSection
            key={category}
            icon={CategoryIcon}
            title={category}
            description={`${shortcuts.length} shortcut${shortcuts.length === 1 ? '' : 's'}`}
            defaultOpen
          >
            <WeeModalFieldCard hoverAccent="none" paddingClassName="p-4 md:p-6">
              <div className="space-y-3">
                {shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.id}
                    className="shortcuts-settings-row rounded-2xl border border-[hsl(var(--border-primary)/0.4)] bg-[hsl(var(--surface-secondary)/0.55)] p-3 transition-colors md:p-4"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 gap-3">
                        <span className="text-2xl leading-none" aria-hidden>
                          {shortcut.icon}
                        </span>
                        <div className="min-w-0">
                          <Text
                            variant="body"
                            className="!mb-1 text-[0.8125rem] font-black uppercase tracking-[0.06em] text-[hsl(var(--text-primary))]"
                          >
                            {shortcut.name}
                          </Text>
                          <Text variant="caption" className="text-[hsl(var(--text-tertiary))]">
                            {shortcut.description}
                          </Text>
                        </div>
                      </div>

                      <div className="flex flex-col items-stretch gap-3 sm:min-w-[12rem] sm:items-end">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {shortcut.enabled && !editingShortcut ? renderShortcutKey(shortcut) : null}

                          {recordingShortcut && editingShortcut?.id === shortcut.id ? (
                            <div
                              className="flex flex-wrap items-center gap-2"
                              data-recording-shortcut="true"
                            >
                              <Text variant="caption" className="text-[hsl(var(--primary))]">
                                Recording
                              </Text>
                              <div className="rounded-lg border border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.12)] px-2 py-1 font-mono text-[11px] font-bold text-[hsl(var(--primary))] animate-pulse">
                                {currentShortcut || 'Press keys…'}
                              </div>
                            </div>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {editingShortcut?.id === shortcut.id ? (
                            <WButton variant="secondary" size="sm" onClick={handleCancelEditShortcut}>
                              Cancel
                            </WButton>
                          ) : (
                            <>
                              <WButton
                                variant="secondary"
                                size="sm"
                                onClick={() => handleEditShortcut(shortcut)}
                                disabled={!shortcut.enabled}
                              >
                                Edit
                              </WButton>
                              <WToggle
                                checked={shortcut.enabled}
                                onChange={() => handleToggleShortcut(shortcut.id)}
                                disableLabelClick
                              />
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </WeeModalFieldCard>
          </WeeSettingsCollapsibleSection>
        );
      })}

      <WeeSettingsCollapsibleSection
        icon={Lock}
        title="Reserved shortcuts"
        description="Handled by the shell — not remappable."
        defaultOpen={false}
      >
        <WeeModalFieldCard hoverAccent="none" paddingClassName="p-4 md:p-6">
          <Text variant="caption" className="!mb-4 !mt-0 text-[hsl(var(--text-tertiary))]">
            These chords are reserved and cannot be assigned to app actions.
          </Text>
          <div className="space-y-3">
            {RESERVED_SHORTCUTS.map((shortcut) => (
              <div
                key={shortcut.key}
                className="flex flex-col gap-3 rounded-2xl border border-[hsl(var(--border-primary)/0.35)] bg-[hsl(var(--surface-secondary)/0.45)] p-3 sm:flex-row sm:items-center sm:justify-between md:p-4"
              >
                <div className="flex min-w-0 gap-3">
                  <Lock size={18} strokeWidth={2.2} className="mt-0.5 shrink-0 text-[hsl(var(--text-tertiary))]" aria-hidden />
                  <div>
                    <Text variant="body" className="font-semibold text-[hsl(var(--text-primary))]">
                      {shortcut.label}
                    </Text>
                    <Text variant="caption" className="text-[hsl(var(--text-tertiary))]">
                      {shortcut.description}
                    </Text>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  {renderReservedKeyChips(shortcut.key)}
                  <span className="rounded-full border border-[hsl(var(--border-primary)/0.45)] bg-[hsl(var(--surface-primary))] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-[hsl(var(--wee-text-rail-muted))]">
                    Reserved
                  </span>
                </div>
              </div>
            ))}
          </div>
        </WeeModalFieldCard>
      </WeeSettingsCollapsibleSection>

      <WeeSettingsCollapsibleSection
        icon={Lightbulb}
        title="Tips"
        description="Fewer conflicts, clearer muscle memory."
        defaultOpen={false}
      >
        <WeeModalFieldCard hoverAccent="none" paddingClassName="p-4 md:p-6">
          <ul className="m-0 list-none space-y-2 p-0 text-sm text-[hsl(var(--text-secondary))]">
            <li>
              Prefer chords like{' '}
              <code className="rounded border border-[hsl(var(--border-primary)/0.45)] bg-[hsl(var(--surface-tertiary))] px-1.5 py-0.5 font-mono text-[11px] text-[hsl(var(--text-primary))]">
                Ctrl + Shift + Letter
              </code>{' '}
              so they stay unique.
            </li>
            <li>Avoid overlapping common system shortcuts (e.g. copy/paste) where possible.</li>
            <li>Function keys are good for one-shot toggles.</li>
            <li>
              Modifiers{' '}
              <code className="rounded border border-[hsl(var(--border-primary)/0.45)] bg-[hsl(var(--surface-tertiary))] px-1.5 py-0.5 font-mono text-[11px]">
                Alt
              </code>
              ,{' '}
              <code className="rounded border border-[hsl(var(--border-primary)/0.45)] bg-[hsl(var(--surface-tertiary))] px-1.5 py-0.5 font-mono text-[11px]">
                Ctrl
              </code>
              ,{' '}
              <code className="rounded border border-[hsl(var(--border-primary)/0.45)] bg-[hsl(var(--surface-tertiary))] px-1.5 py-0.5 font-mono text-[11px]">
                Shift
              </code>
              , and{' '}
              <code className="rounded border border-[hsl(var(--border-primary)/0.45)] bg-[hsl(var(--surface-tertiary))] px-1.5 py-0.5 font-mono text-[11px]">
                Meta
              </code>{' '}
              (Cmd on Mac) can combine with letter keys.
            </li>
            <li>Use the switch to disable a shortcut without deleting its binding.</li>
          </ul>
        </WeeModalFieldCard>
      </WeeSettingsCollapsibleSection>
    </div>
  );
});

ShortcutsSettingsTab.displayName = 'ShortcutsSettingsTab';

export default ShortcutsSettingsTab;
