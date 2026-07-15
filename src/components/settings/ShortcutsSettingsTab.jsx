import React, { useCallback } from 'react';
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
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { useUIState } from '../../utils/useConsolidatedAppHooks';
import {
  createDefaultKeyboardShortcuts,
  formatShortcut,
  getShortcutsByCategory,
} from '../../utils/keyboardShortcuts';
import { WeeModalFieldCard, WeeSettingsCollapsibleSection } from '../../ui/wee';
import SettingsTabPageHeader from './SettingsTabPageHeader';
import ShortcutCaptureControl, { RESERVED_SHORTCUT_CHORDS } from './ShortcutCaptureControl';
import './surfaceStyles.css';

const CATEGORY_ICONS = {
  Navigation: Compass,
  Settings: SlidersHorizontal,
  Widgets: LayoutGrid,
  Interface: AppWindow,
};

const CATEGORY_ORDER = ['Navigation', 'Settings', 'Widgets', 'Interface'];

const ShortcutsSettingsTab = React.memo(() => {
  const keyboardShortcutsFromStore = useConsolidatedAppStore((state) => state.ui?.keyboardShortcuts);
  const resetKeyboardShortcuts = useConsolidatedAppStore(
    useShallow((state) => state.actions.resetKeyboardShortcuts)
  );

  const keyboardShortcuts =
    keyboardShortcutsFromStore?.length > 0
      ? keyboardShortcutsFromStore
      : createDefaultKeyboardShortcuts();

  const { confirmAction } = useUIState();

  const handleResetShortcuts = useCallback(() => {
    confirmAction(
      'Reset keyboard shortcuts?',
      'All keyboard shortcuts will go back to their defaults. Custom bindings are lost.',
      resetKeyboardShortcuts,
      null,
      'Reset',
      'danger-primary'
    );
  }, [confirmAction, resetKeyboardShortcuts]);

  const groupedShortcuts = getShortcutsByCategory(keyboardShortcuts);
  const orderedCategories = [
    ...CATEGORY_ORDER.filter((c) => groupedShortcuts[c]?.length),
    ...Object.keys(groupedShortcuts).filter((c) => !CATEGORY_ORDER.includes(c)),
  ];

  return (
    <div className="mx-auto flex max-w-4xl flex-col space-y-6 pb-12">
      <SettingsTabPageHeader
        title="Shortcuts"
        subtitle="Bind keys for settings tabs, widgets, Quick Menu, and more"
      />

      <div className="flex justify-end">
        <WButton variant="secondary" onClick={handleResetShortcuts} size="sm" className="gap-1.5">
          <RotateCcw size={14} strokeWidth={2.5} aria-hidden />
          Reset to defaults
        </WButton>
      </div>

      {orderedCategories.map((category) => {
        const shortcuts = groupedShortcuts[category] || [];
        const CategoryIcon = CATEGORY_ICONS[category] || Keyboard;
        return (
          <WeeSettingsCollapsibleSection
            key={category}
            icon={CategoryIcon}
            title={category}
            description={`${shortcuts.length} shortcut${shortcuts.length === 1 ? '' : 's'}`}
            defaultOpen={category === 'Navigation' || category === 'Widgets'}
          >
            <WeeModalFieldCard hoverAccent="none" paddingClassName="p-4 md:p-6">
              <div className="space-y-2.5">
                {shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.id}
                    className="shortcuts-settings-row rounded-2xl border border-[hsl(var(--border-primary)/0.4)] bg-[hsl(var(--surface-secondary)/0.55)] p-3 transition-colors md:p-3.5"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                      <div className="flex min-w-0 gap-3">
                        <span className="text-xl leading-none sm:text-2xl" aria-hidden>
                          {shortcut.icon}
                        </span>
                        <div className="min-w-0">
                          <Text
                            variant="body"
                            className="!mb-0.5 text-[0.8125rem] font-black uppercase tracking-[0.06em] text-[hsl(var(--text-primary))]"
                          >
                            {shortcut.name}
                          </Text>
                          <Text variant="caption" className="text-[hsl(var(--text-tertiary))]">
                            {shortcut.description}
                          </Text>
                        </div>
                      </div>
                      <div className="sm:min-w-[14rem] sm:max-w-sm sm:shrink-0">
                        <ShortcutCaptureControl
                          shortcutId={shortcut.id}
                          compact
                          showLabel={false}
                        />
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
            These chords stay with Electron / the OS. Escape is remappable — by default it toggles the Quick Menu.
          </Text>
          <div className="space-y-3">
            {RESERVED_SHORTCUT_CHORDS.map((shortcut) => (
              <div
                key={`${shortcut.modifier}-${shortcut.key}`}
                className="flex flex-col gap-3 rounded-2xl border border-[hsl(var(--border-primary)/0.35)] bg-[hsl(var(--surface-secondary)/0.45)] p-3 sm:flex-row sm:items-center sm:justify-between md:p-4"
              >
                <div className="flex min-w-0 gap-3">
                  <Lock
                    size={18}
                    strokeWidth={2.2}
                    className="mt-0.5 shrink-0 text-[hsl(var(--text-tertiary))]"
                    aria-hidden
                  />
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
                  <span className="rounded-md border border-[hsl(var(--border-primary)/0.5)] bg-[hsl(var(--surface-tertiary))] px-1.5 py-0.5 font-mono text-[11px] font-bold text-[hsl(var(--text-primary))]">
                    {formatShortcut(shortcut)}
                  </span>
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
              Prefer{' '}
              <code className="rounded border border-[hsl(var(--border-primary)/0.45)] bg-[hsl(var(--surface-tertiary))] px-1.5 py-0.5 font-mono text-[11px] text-[hsl(var(--text-primary))]">
                Ctrl + Shift + Letter
              </code>{' '}
              for settings tabs so they stay unique.
            </li>
            <li>You can open any settings tab, the workspace switcher, or the update modal from here.</li>
            <li>Admin Panel toggle can also be remapped under API &amp; Widgets.</li>
            <li>Use the switch to disable a shortcut without clearing its binding.</li>
          </ul>
        </WeeModalFieldCard>
      </WeeSettingsCollapsibleSection>
    </div>
  );
});

ShortcutsSettingsTab.displayName = 'ShortcutsSettingsTab';

export default ShortcutsSettingsTab;
