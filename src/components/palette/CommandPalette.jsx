import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, CornerDownLeft } from 'lucide-react';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { buildCommandCatalog, filterAndGroupCommands } from '../../utils/commandCatalog';
import { useLaunchFeedback } from '../../contexts/LaunchFeedbackContext';
import { launchWithFeedback } from '../../utils/launchWithFeedback';
import { executeAdminCommand } from '../../utils/adminPanelCommands';
import { enterSessionAwayIfIntensive } from '../../hooks/useSessionPowerSync';

const MAX_RECENTS = 6;
/** Stable empty fallback — never allocate `|| []` in a zustand selector. */
const EMPTY_PALETTE_RECENTS = Object.freeze([]);

/**
 * Ctrl+Space command palette — keyboard-first, instant open/close (no entrance
 * choreography by design). Open state is transient (`ui.commandPaletteOpen`).
 * Commands come from `commandCatalog.js`; execution reuses existing action paths.
 */
function CommandPalette() {
  const isOpen = useConsolidatedAppStore((s) => Boolean(s.ui.commandPaletteOpen));
  const setUIState = useConsolidatedAppStore((s) => s.actions.setUIState);
  const { beginLaunchFeedback, endLaunchFeedback, showLaunchError } = useLaunchFeedback();

  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const close = useCallback(() => {
    setUIState({ commandPaletteOpen: false });
  }, [setUIState]);

  const launchChannel = useCallback(
    async ({ path, type, asAdmin, title }) => {
      const api = window.api;
      if (!api?.launchApp) {
        showLaunchError?.({
          technicalError: 'Electron API bridge unavailable',
          launchType: type,
          path,
          source: 'palette',
        });
        return;
      }
      const result = await launchWithFeedback({
        launch: () => api.launchApp({ type, path, asAdmin }),
        beginLaunchFeedback,
        endLaunchFeedback,
        showLaunchError,
        label: `Launching ${title}`,
        launchType: type,
        path,
        source: 'palette',
      });
      if (!result || result.ok !== false) {
        useConsolidatedAppStore.getState().actions.recordRecentLaunch?.({
          path,
          type,
          title,
          source: 'palette',
        });
        enterSessionAwayIfIntensive({ type, path, source: 'palette', mode: 'auto' });
      }
    },
    [beginLaunchFeedback, endLaunchFeedback, showLaunchError]
  );

  const runAdminAction = useCallback(async (action) => {
    await executeAdminCommand(action.command);
  }, []);

  // Catalog rebuilds only while open — narrow subscriptions, no polling.
  const homeSlots = useConsolidatedAppStore((s) =>
    isOpen ? s.channels.dataBySpace?.home?.slots : null
  );
  const keyboardShortcuts = useConsolidatedAppStore((s) =>
    isOpen ? s.ui.keyboardShortcuts : null
  );
  const adminPanelConfig = useConsolidatedAppStore((s) =>
    isOpen ? s.floatingWidgets.adminPanel?.config : null
  );
  const activeSpaceId = useConsolidatedAppStore((s) => (isOpen ? s.spaces.activeSpaceId : null));
  const recentCommandIds = useConsolidatedAppStore((s) =>
    Array.isArray(s.ui.commandPaletteRecent) ? s.ui.commandPaletteRecent : EMPTY_PALETTE_RECENTS
  );

  const commands = useMemo(() => {
    if (!isOpen) return [];
    return buildCommandCatalog(useConsolidatedAppStore.getState(), {
      launchChannel,
      runAdminAction,
    });
    // Narrow deps trigger rebuild when the underlying sources change while open.
  }, [isOpen, homeSlots, keyboardShortcuts, adminPanelConfig, activeSpaceId, launchChannel, runAdminAction]);

  const groupedResults = useMemo(
    () => filterAndGroupCommands(commands, query, recentCommandIds),
    [commands, query, recentCommandIds]
  );

  const flatResults = useMemo(
    () => groupedResults.flatMap(({ commands: groupCommands }) => groupCommands),
    [groupedResults]
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      // Instant focus — palette must be typeable the moment it opens.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector('[data-palette-active="true"]');
    activeEl?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, groupedResults]);

  const executeCommand = useCallback(
    (command) => {
      if (!command) return;
      close();
      setUIState((prev) => {
        const prevRecents = Array.isArray(prev.commandPaletteRecent)
          ? prev.commandPaletteRecent
          : [];
        return {
          commandPaletteRecent: [
            command.id,
            ...prevRecents.filter((id) => id !== command.id),
          ].slice(0, MAX_RECENTS),
        };
      });
      // Run after close so overlays the command opens are not fighting the palette.
      Promise.resolve().then(() => command.run());
    },
    [close, setUIState]
  );

  const handleKeyDown = useCallback(
    (event) => {
      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          event.stopPropagation();
          close();
          break;
        case 'ArrowDown':
          event.preventDefault();
          setActiveIndex((prev) => Math.min(prev + 1, Math.max(0, flatResults.length - 1)));
          break;
        case 'ArrowUp':
          event.preventDefault();
          setActiveIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          event.preventDefault();
          executeCommand(flatResults[activeIndex]);
          break;
        default:
          break;
      }
    },
    [close, flatResults, activeIndex, executeCommand]
  );

  if (!isOpen) return null;

  let runningIndex = -1;

  return createPortal(
    <div
      className="fixed inset-0 z-[3000] flex items-start justify-center px-4 pt-[16vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="absolute inset-0 bg-[hsl(var(--color-pure-black)/0.35)]"
        onClick={close}
        aria-hidden
      />
      <div className="relative z-10 flex max-h-[56vh] w-full max-w-xl flex-col overflow-hidden rounded-[1.75rem] border-4 border-[hsl(var(--wee-pill-border))] bg-[hsl(var(--wee-pill-glass))] shadow-[var(--wee-pill-shadow)] backdrop-blur-xl">
        <div className="relative shrink-0 border-b-2 border-[hsl(var(--border-primary)/0.3)]">
          <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[hsl(var(--text-tertiary))]">
            <Search size={18} strokeWidth={2.4} aria-hidden />
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Launch, open, or change anything..."
            autoComplete="off"
            spellCheck={false}
            role="combobox"
            aria-expanded="true"
            aria-controls="wee-command-palette-list"
            aria-activedescendant={
              flatResults[activeIndex] ? `wee-cmd-${flatResults[activeIndex].id}` : undefined
            }
            className="font-[family-name:var(--font-ui)] w-full bg-transparent py-4 pl-14 pr-5 text-base font-bold text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-tertiary))] focus:outline-none"
          />
        </div>

        <div
          ref={listRef}
          id="wee-command-palette-list"
          role="listbox"
          aria-label="Commands"
          className="wee-modal-scroll min-h-0 flex-1 overflow-y-auto p-2"
        >
          {flatResults.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm font-bold text-[hsl(var(--text-secondary))]">
              No matching commands
            </div>
          ) : (
            groupedResults.map(({ group, commands: groupCommands }) => (
              <div key={group.id} className="mb-1">
                <p className="m-0 px-3 pb-1 pt-2 text-[10px] font-black uppercase tracking-[0.16em] text-[hsl(var(--text-tertiary))]">
                  {group.label}
                </p>
                {groupCommands.map((command) => {
                  runningIndex += 1;
                  const index = runningIndex;
                  const active = index === activeIndex;
                  return (
                    <button
                      key={`${group.id}-${command.id}`}
                      id={`wee-cmd-${command.id}`}
                      type="button"
                      role="option"
                      aria-selected={active}
                      data-palette-active={active || undefined}
                      onClick={() => executeCommand(command)}
                      onMouseMove={() => setActiveIndex(index)}
                      className={`flex w-full items-center gap-3 rounded-[1rem] px-3 py-2.5 text-left transition-colors ${
                        active
                          ? 'bg-[hsl(var(--primary)/0.14)] text-[hsl(var(--text-primary))]'
                          : 'text-[hsl(var(--text-secondary))]'
                      }`}
                    >
                      <span className="w-6 shrink-0 text-center text-lg leading-none" aria-hidden>
                        {command.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-black">{command.title}</span>
                        {command.subtitle ? (
                          <span className="block truncate text-[11px] font-bold text-[hsl(var(--text-tertiary))]">
                            {command.subtitle}
                          </span>
                        ) : null}
                      </span>
                      {active ? (
                        <CornerDownLeft
                          size={14}
                          strokeWidth={2.5}
                          aria-hidden
                          className="shrink-0 text-[hsl(var(--text-tertiary))]"
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between border-t-2 border-[hsl(var(--border-primary)/0.3)] px-4 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-[hsl(var(--text-tertiary))]">
          <span>↑↓ Navigate · Enter run · Esc close</span>
          <span>Ctrl+Space</span>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default CommandPalette;
