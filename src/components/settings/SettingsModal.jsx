import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { useShallow } from 'zustand/react/shallow';
import { AnimatePresence, m } from 'framer-motion';
import { Search, X, History } from 'lucide-react';
import { WeeModalShell, WeeModalRail, WeeSectionEyebrow } from '../../ui/wee';
import WeeButton from '../../ui/wee/WeeButton';
import WButton from '../../ui/WButton';
import { useWeeMotion, WEE_VARIANTS } from '../../design/weeMotion';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import {
  SETTINGS_TAB_META,
  normalizeSettingsTabId,
  searchSettingsTabs,
  groupSettingsEntries,
  getSettingsTabMeta,
} from '../../utils/settingsRegistry';
import SettingsRailTabButton from './SettingsRailTabButton';
import DevReactProfiler from '../dev/DevReactProfiler';
import { weeMarkSettingsTab } from '../../utils/weePerformanceMarks';

import {
  ChannelsLayoutSettingsTab,
  UnifiedDockSettingsTab,
  ColorsSettingsTab,
  WallpaperSettingsTab,
  TimeSettingsTab,
  SoundsSettingsTab,
  GeneralSettingsTab,
  GameHubSettingsTab,
  PresetsSettingsTab,
  MonitorSettingsTab,
  ApiIntegrationsSettingsTab,
  ShortcutsSettingsTab,
  UpdatesSettingsTab,
  NavigationSettingsTab,
  NavigationPillSettingsTab,
  MotionFeedbackSettingsTab,
  WorkspacesSettingsTab,
} from './index';

const TabPanel = m.div;

/** Registry ids → tab components (kept local so the registry stays pure data). */
const SETTINGS_TAB_COMPONENTS = {
  'api-integrations': ApiIntegrationsSettingsTab,
  channels: ChannelsLayoutSettingsTab,
  dock: UnifiedDockSettingsTab,
  colors: ColorsSettingsTab,
  gamehub: GameHubSettingsTab,
  general: GeneralSettingsTab,
  motion: MotionFeedbackSettingsTab,
  'navigation-pill': NavigationPillSettingsTab,
  themes: PresetsSettingsTab,
  sounds: SoundsSettingsTab,
  time: TimeSettingsTab,
  updates: UpdatesSettingsTab,
  wallpaper: WallpaperSettingsTab,
  workspaces: WorkspacesSettingsTab,
  monitor: MonitorSettingsTab,
  navigation: NavigationSettingsTab,
  shortcuts: ShortcutsSettingsTab,
};

/** Flat registry order for keyboard nav and lookups. */
const SETTINGS_TAB_IDS = SETTINGS_TAB_META.map((tab) => tab.id);

const MAX_RECENT_TABS = 4;

function SettingsModal({ isOpen, onClose, initialActiveTab = 'channels' }) {
  const tabContentRef = useRef(null);
  const { tabTransition } = useWeeMotion();

  const ui = useConsolidatedAppStore(useShallow((state) => state.ui));
  const setUIState = useConsolidatedAppStore((state) => state.actions.setUIState);
  const effectiveInitialTab = useMemo(() => {
    const raw = ui.settingsActiveTab || initialActiveTab;
    return normalizeSettingsTabId(raw);
  }, [ui.settingsActiveTab, initialActiveTab]);

  const [activeTab, setActiveTab] = useState(effectiveInitialTab);
  const [, setShowMonitorModal] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');

  const recentTabIds = useMemo(() => {
    const raw = Array.isArray(ui.settingsRecentTabs) ? ui.settingsRecentTabs : [];
    return raw
      .map(normalizeSettingsTabId)
      .filter((id, i, arr) => arr.indexOf(id) === i && getSettingsTabMeta(id))
      .slice(0, MAX_RECENT_TABS);
  }, [ui.settingsRecentTabs]);

  const groupedResults = useMemo(
    () => groupSettingsEntries(searchSettingsTabs(searchQuery)),
    [searchQuery]
  );
  const hasResults = groupedResults.length > 0;
  const isSearching = searchQuery.trim().length > 0;

  useEffect(() => {
    if (isOpen && effectiveInitialTab) {
      setActiveTab(effectiveInitialTab);
    }
  }, [isOpen, effectiveInitialTab]);

  useEffect(() => {
    if (!isOpen) return;
    weeMarkSettingsTab(activeTab);
  }, [isOpen, activeTab]);

  const handleTabChange = useCallback(
    (tabId) => {
      setActiveTab((prev) => {
        if (prev === 'sounds' && tabId !== 'sounds') {
          window.dispatchEvent(new CustomEvent('wee-settings-leave-sounds-tab'));
        }
        return tabId;
      });
      const prevRecents = Array.isArray(
        useConsolidatedAppStore.getState().ui.settingsRecentTabs
      )
        ? useConsolidatedAppStore.getState().ui.settingsRecentTabs
        : [];
      const nextRecents = [tabId, ...prevRecents.filter((id) => id !== tabId)].slice(
        0,
        MAX_RECENT_TABS
      );
      setUIState({ settingsRecentTabs: nextRecents });
    },
    [setUIState]
  );

  const currentTab = useMemo(() => getSettingsTabMeta(activeTab), [activeTab]);

  const renderTabContent = useMemo(() => {
    const TabComponent = currentTab ? SETTINGS_TAB_COMPONENTS[currentTab.id] : null;
    if (!TabComponent) {
      return <div className="p-8 text-center text-[hsl(var(--text-secondary))]">Tab not found</div>;
    }

    return (
      <DevReactProfiler id={`settings-tab-${activeTab}`}>
        <div ref={tabContentRef} className="relative flex min-h-0 flex-1 flex-col">
          <TabComponent setShowMonitorModal={setShowMonitorModal} settingsActiveTabId={activeTab} />
        </div>
      </DevReactProfiler>
    );
  }, [currentTab, activeTab]);

  /** Ids in the order currently visible in the rail — arrow nav must respect the search filter. */
  const navigableTabIds = useMemo(() => {
    const visible = groupedResults.flatMap(({ entries }) => entries.map(({ tab }) => tab.id));
    return visible.length > 0 ? visible : SETTINGS_TAB_IDS;
  }, [groupedResults]);

  useEffect(() => {
    if (!isOpen) return;

    /** Controls that own arrow keys / caret movement — never hijack from them. */
    const targetOwnsKeys = (target) => {
      if (!target || typeof target.closest !== 'function') return false;
      const tag = target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
      if (target.isContentEditable) return true;
      return Boolean(
        target.closest(
          '[role="slider"], [role="listbox"], [role="menu"], [role="radiogroup"], [contenteditable="true"]'
        )
      );
    };

    const handleKeyDown = (e) => {
      if (e.defaultPrevented) return;

      if (e.key === 'Escape') {
        if (targetOwnsKeys(e.target)) return;
        e.preventDefault();
        onClose();
        return;
      }

      if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key)) return;
      if (targetOwnsKeys(e.target)) return;

      e.preventDefault();
      const currentIndex = navigableTabIds.indexOf(activeTab);
      const forward = e.key === 'ArrowRight' || e.key === 'ArrowDown';
      const nextIndex = forward
        ? (currentIndex + 1) % navigableTabIds.length
        : currentIndex <= 0
          ? navigableTabIds.length - 1
          : currentIndex - 1;
      handleTabChange(navigableTabIds[nextIndex]);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeTab, handleTabChange, onClose, navigableTabIds]);

  useEffect(() => {
    if (isOpen && tabContentRef.current) {
      const firstFocusable = tabContentRef.current.querySelector(
        'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }
  }, [isOpen, activeTab]);

  const rail = (
    <WeeModalRail className="!flex min-h-0 w-[min(19rem,92vw)] shrink-0 flex-col gap-0 self-stretch overflow-hidden py-6 pl-6 pr-4 md:min-h-0 md:w-[min(20rem,28vw)] md:py-8 md:pl-8 md:pr-6">
      <div className="shrink-0 border-b-2 border-[hsl(var(--wee-border-rail))] pb-4">
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[hsl(var(--wee-text-rail-muted))]">
            <Search size={18} strokeWidth={2.2} aria-hidden />
          </span>
          <input
            type="search"
            placeholder="Search settings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
            className="font-[family-name:var(--font-ui)] w-full rounded-[var(--wee-radius-rail-item)] border-2 border-[hsl(var(--border-primary))] bg-[hsl(var(--wee-surface-card))] py-3 pl-11 pr-10 text-sm font-bold text-[hsl(var(--text-primary))] transition-colors placeholder:text-[hsl(var(--text-tertiary))] focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.35)]"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[hsl(var(--text-tertiary))] transition-colors hover:bg-[hsl(var(--state-hover))] hover:text-[hsl(var(--text-primary))]"
              aria-label="Clear search"
            >
              <X size={16} strokeWidth={2.5} aria-hidden />
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden">
        {!hasResults ? (
          <div className="wee-modal-scroll flex-1 overflow-y-auto px-2 py-4 text-center text-[hsl(var(--text-secondary))]">
            <div className="mb-2 text-2xl" aria-hidden>
              🔍
            </div>
            <div className="text-sm">No settings found</div>
            <div className="mt-1 text-xs">Try a different search term</div>
          </div>
        ) : (
          <div
            className="wee-modal-scroll min-h-0 flex-1 overflow-y-auto pr-1"
            role="tablist"
            aria-label="Settings sections"
            aria-orientation="vertical"
          >
            {!isSearching && recentTabIds.length > 0 ? (
              <div className="mb-4">
                <WeeSectionEyebrow className="mb-2 flex items-center gap-1.5 px-1" trackingClassName="tracking-[0.14em]">
                  <History size={11} strokeWidth={2.5} aria-hidden />
                  Recent
                </WeeSectionEyebrow>
                <div className="flex flex-wrap gap-1.5 px-1">
                  {recentTabIds.map((id) => {
                    const tab = getSettingsTabMeta(id);
                    const isActive = activeTab === id;
                    return (
                      <WButton
                        key={id}
                        type="button"
                        size="sm"
                        variant={isActive ? 'primary' : 'secondary'}
                        onClick={() => handleTabChange(id)}
                      >
                        <span className="flex items-center gap-1.5">
                          <span aria-hidden>{tab.icon}</span>
                          {tab.label}
                        </span>
                      </WButton>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-4">
              {groupedResults.map(({ category, entries }) => (
                <div key={category.id}>
                  <WeeSectionEyebrow className="mb-2 px-1" trackingClassName="tracking-[0.14em]">
                    {category.label}
                  </WeeSectionEyebrow>
                  <div className="flex flex-col gap-2">
                    {entries.map(({ tab, matchedKeyword }) => (
                      <SettingsRailTabButton
                        key={tab.id}
                        tab={tab}
                        isActive={activeTab === tab.id}
                        onClick={handleTabChange}
                        matchHint={matchedKeyword}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </WeeModalRail>
  );

  return (
    <WeeModalShell
      isOpen={isOpen}
      onClose={onClose}
      headerTitle="Settings"
      rail={rail}
      maxWidth="min(1400px, 95vw)"
      showRail
      stableHeight
      panelClassName="min-h-0"
      footerContent={({ handleClose }) => (
        <div className="flex justify-end">
          <WeeButton variant="secondary" onClick={handleClose}>
            Close
          </WeeButton>
        </div>
      )}
    >
      <AnimatePresence mode="wait">
        <TabPanel
          key={activeTab}
          role="tabpanel"
          aria-label={currentTab?.label}
          initial={WEE_VARIANTS.tabBodyInitial}
          animate={WEE_VARIANTS.tabBodyAnimate}
          exit={WEE_VARIANTS.tabBodyExit}
          transition={tabTransition}
          className="min-h-0 flex-1 [contain:layout]"
        >
          {renderTabContent}
        </TabPanel>
      </AnimatePresence>
    </WeeModalShell>
  );
}

SettingsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  initialActiveTab: PropTypes.string,
};

export default SettingsModal;
