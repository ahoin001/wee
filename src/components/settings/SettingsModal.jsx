import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { useShallow } from 'zustand/react/shallow';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { WeeModalShell, WeeModalRail } from '../../ui/wee';
import WeeButton from '../../ui/wee/WeeButton';
import { useWeeMotion, WEE_VARIANTS } from '../../design/weeMotion';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import SettingsRailTabButton from './SettingsRailTabButton';

import {
  ChannelsLayoutSettingsTab,
  UnifiedDockSettingsTab,
  WallpaperSettingsTab,
  TimeSettingsTab,
  SoundsSettingsTab,
  GeneralSettingsTab,
  GameHubSettingsTab,
  PresetsSettingsTab,
  MonitorSettingsTab,
  ApiIntegrationsSettingsTab,
  AdvancedSettingsTab,
  ShortcutsSettingsTab,
  UpdatesSettingsTab,
  NavigationSettingsTab,
  MotionFeedbackSettingsTab,
  WorkspacesSettingsTab,
} from './index';

const TabPanel = motion.div;

const SETTINGS_TABS = [
  {
    id: 'api-integrations',
    label: 'API & Widgets',
    icon: '🔌',
    color: 'hsl(var(--settings-tab-api))',
    description: 'External services & floating widgets',
    component: ApiIntegrationsSettingsTab,
  },
  {
    id: 'channels',
    label: 'Channels & layout',
    icon: '📺',
    color: 'hsl(var(--settings-tab-channels))',
    description: 'Wii grid, space status, and channel tile defaults',
    component: ChannelsLayoutSettingsTab,
  },
  {
    id: 'dock',
    label: 'Dock',
    icon: '⚓',
    color: 'hsl(var(--settings-tab-dock))',
    description: 'Classic & Ribbon dock settings',
    component: UnifiedDockSettingsTab,
  },
  {
    id: 'gamehub',
    label: 'Game Hub',
    icon: '🎮',
    color: 'hsl(var(--settings-tab-layout))',
    description: 'SteamID64 and enrichment controls',
    component: GameHubSettingsTab,
  },
  {
    id: 'general',
    label: 'General',
    icon: '⚙️',
    color: 'hsl(var(--settings-tab-general))',
    description: 'App behavior & startup',
    component: GeneralSettingsTab,
  },
  {
    id: 'monitor',
    label: 'Monitor (beta)',
    icon: '🖥️',
    color: 'hsl(var(--settings-tab-monitor))',
    description: 'Multi-monitor settings',
    component: MonitorSettingsTab,
  },
  {
    id: 'motion',
    label: 'Motion',
    icon: '✨',
    color: 'hsl(var(--settings-tab-motion))',
    description: 'Press, drag & reorder feedback',
    component: MotionFeedbackSettingsTab,
  },
  {
    id: 'navigation',
    label: 'Navigation',
    icon: '🧭',
    color: 'hsl(var(--settings-tab-navigation))',
    description: 'Side navigation buttons',
    component: NavigationSettingsTab,
  },
  {
    id: 'themes',
    label: 'Presets',
    icon: '🎨',
    color: 'hsl(var(--settings-tab-themes))',
    description: 'Preset themes & customization',
    component: PresetsSettingsTab,
  },
  {
    id: 'shortcuts',
    label: 'Shortcuts',
    icon: '⌨️',
    color: 'hsl(var(--settings-tab-shortcuts))',
    description: 'Keyboard shortcuts & hotkeys',
    component: ShortcutsSettingsTab,
  },
  {
    id: 'sounds',
    label: 'Sounds',
    icon: '🔊',
    color: 'hsl(var(--settings-tab-sounds))',
    description: 'Audio feedback & music',
    component: SoundsSettingsTab,
  },
  {
    id: 'time',
    label: 'Time',
    icon: '🕐',
    color: 'hsl(var(--settings-tab-time))',
    description: 'Clock & pill display',
    component: TimeSettingsTab,
  },
  {
    id: 'updates',
    label: 'Updates',
    icon: '🔄',
    color: 'hsl(var(--settings-tab-updates))',
    description: 'Check for updates & version info',
    component: UpdatesSettingsTab,
  },
  {
    id: 'wallpaper',
    label: 'Wallpaper',
    icon: '🖼️',
    color: 'hsl(var(--settings-tab-wallpaper))',
    description: 'Background & cycling',
    component: WallpaperSettingsTab,
  },
  {
    id: 'workspaces',
    label: 'Workspaces',
    icon: '🧩',
    color: 'hsl(var(--settings-tab-workspaces))',
    description: 'Create and switch full app environments',
    component: WorkspacesSettingsTab,
  },
];

function SettingsModal({ isOpen, onClose, initialActiveTab = 'channels' }) {
  const tabContentRef = useRef(null);
  const { tabTransition } = useWeeMotion();

  const ui = useConsolidatedAppStore(useShallow((state) => state.ui));
  const effectiveInitialTab = useMemo(() => {
    const raw = ui.settingsActiveTab || initialActiveTab;
    return raw === 'layout' ? 'channels' : raw;
  }, [ui.settingsActiveTab, initialActiveTab]);

  const [activeTab, setActiveTab] = useState(effectiveInitialTab);
  const [, setShowMonitorModal] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTabs, setFilteredTabs] = useState(SETTINGS_TABS);

  useEffect(() => {
    if (isOpen && effectiveInitialTab) {
      setActiveTab(effectiveInitialTab);
    }
  }, [isOpen, effectiveInitialTab]);

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  const currentTab = useMemo(() => SETTINGS_TABS.find((tab) => tab.id === activeTab), [activeTab]);

  const renderTabContent = useMemo(() => {
    if (!currentTab) {
      return <div className="p-8 text-center text-[hsl(var(--text-secondary))]">Tab not found</div>;
    }

    const TabComponent = currentTab.component;
    return (
      <div ref={tabContentRef} className="relative flex min-h-0 flex-1 flex-col">
        <TabComponent setShowMonitorModal={setShowMonitorModal} />
      </div>
    );
  }, [currentTab]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      const currentIndex = SETTINGS_TABS.findIndex((tab) => tab.id === activeTab);

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown': {
          e.preventDefault();
          const nextIndex = (currentIndex + 1) % SETTINGS_TABS.length;
          handleTabChange(SETTINGS_TABS[nextIndex].id);
          break;
        }
        case 'ArrowLeft':
        case 'ArrowUp': {
          e.preventDefault();
          const prevIndex = currentIndex === 0 ? SETTINGS_TABS.length - 1 : currentIndex - 1;
          handleTabChange(SETTINGS_TABS[prevIndex].id);
          break;
        }
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeTab, handleTabChange, onClose]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTabs(SETTINGS_TABS);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = SETTINGS_TABS.filter(
      (tab) =>
        tab.label.toLowerCase().includes(query) ||
        tab.description.toLowerCase().includes(query) ||
        tab.id.toLowerCase().includes(query)
    );
    setFilteredTabs(filtered);
  }, [searchQuery]);

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

      <div className="wee-modal-scroll mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
        {filteredTabs.length > 0 ? (
          <div className="flex flex-col gap-2">
            {filteredTabs.map((tab) => (
              <SettingsRailTabButton
                key={tab.id}
                tab={tab}
                isActive={activeTab === tab.id}
                onClick={handleTabChange}
              />
            ))}
          </div>
        ) : (
          <div className="px-2 py-4 text-center text-[hsl(var(--text-secondary))]">
            <div className="mb-2 text-2xl" aria-hidden>
              🔍
            </div>
            <div className="text-sm">No settings found</div>
            <div className="mt-1 text-xs">Try a different search term</div>
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
      panelClassName="min-h-0"
      footerContent={({ handleClose }) => (
        <div className="flex justify-end">
          <WeeButton variant="secondary" onClick={handleClose}>
            Close
          </WeeButton>
        </div>
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <TabPanel
          key={activeTab}
          initial={WEE_VARIANTS.tabBodyInitial}
          animate={WEE_VARIANTS.tabBodyAnimate}
          exit={WEE_VARIANTS.tabBodyExit}
          transition={tabTransition}
          className="min-h-0 flex-1"
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
