import React, { useState, useEffect, useCallback, Suspense, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { useShallow } from 'zustand/react/shallow';
import { WBaseModal } from '../core';
import Button from '../../ui/WButton';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';

// Direct imports for all tabs - no lazy loading needed
import {
  ChannelsSettingsTab,
  UnifiedDockSettingsTab,
  WallpaperSettingsTab,
  TimeSettingsTab,
  SoundsSettingsTab,
  GeneralSettingsTab,
  PresetsSettingsTab,
  MonitorSettingsTab,
  ApiIntegrationsSettingsTab,
  AdvancedSettingsTab,
  LayoutSettingsTab,
  ShortcutsSettingsTab,
  UpdatesSettingsTab,
  NavigationSettingsTab,
  MotionFeedbackSettingsTab,
  WorkspacesSettingsTab,
} from './index';



// Settings Tab Button Component - Optimized
const SettingsTabButton = React.memo(({ tab, isActive, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);
  const handleClick = useCallback(() => onClick(tab.id), [onClick, tab.id]);
  
  const backgroundColor = useMemo(() => {
    if (isActive) return tab.color;
    if (isHovered) return 'hsl(var(--surface-tertiary))';
    return 'transparent';
  }, [isActive, isHovered, tab.color]);
  
  const textColor = useMemo(() => {
    if (isActive) return 'hsl(var(--text-on-accent))';
    if (isHovered) return tab.color;
    return 'hsl(var(--text-secondary))';
  }, [isActive, isHovered, tab.color]);
  
  return (
    <button
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="w-full p-4 border-none cursor-pointer text-sm font-medium transition-all duration-200 ease-in-out flex items-center gap-3 text-left border-b border-[hsl(var(--border-primary))] relative group"
      style={{
        background: backgroundColor,
        color: textColor,
        fontWeight: isActive ? '600' : '500'
      }}
    >
      <span className="text-lg">{tab.icon}</span>
      <div className="flex flex-col items-start flex-1">
        <div className="flex items-center gap-2">
        <span className="font-semibold">{tab.label}</span>
        </div>
        <span className="text-xs opacity-70 mt-0.5">
          {tab.description}
        </span>
      </div>
      {/* Hover indicator */}
      <div 
        className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-1 h-8 rounded-full transition-all duration-200 ${
          isHovered ? 'bg-current opacity-60' : 'opacity-0'
        }`}
      />
    </button>
  );
});

SettingsTabButton.propTypes = {
  tab: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
  }).isRequired,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

// Tab configuration - Alphabetically ordered
const SETTINGS_TABS = [
  { 
    id: 'api-integrations', 
    label: 'API & Widgets', 
    icon: '🔌', 
    color: 'hsl(var(--settings-tab-api))',
    description: 'External services & floating widgets',
    component: ApiIntegrationsSettingsTab
  },
  { 
    id: 'channels', 
    label: 'Channels', 
    icon: '📺', 
    color: 'hsl(var(--settings-tab-channels))',
    description: 'Animation & display settings',
    component: ChannelsSettingsTab
  },
  { 
    id: 'dock', 
    label: 'Dock', 
    icon: '⚓', 
    color: 'hsl(var(--settings-tab-dock))',
    description: 'Classic & Ribbon dock settings',
    component: UnifiedDockSettingsTab
  },
  { 
    id: 'general', 
    label: 'General', 
    icon: '⚙️', 
    color: 'hsl(var(--settings-tab-general))',
    description: 'App behavior & startup',
    component: GeneralSettingsTab
  },
  { 
    id: 'layout', 
    label: 'Layout', 
    icon: '📐', 
    color: 'hsl(var(--settings-tab-layout))',
    description: 'Grid & navigation modes',
    component: LayoutSettingsTab
  },
  { 
    id: 'navigation', 
    label: 'Navigation', 
    icon: '🧭', 
    color: 'hsl(var(--settings-tab-navigation))',
    description: 'Side navigation buttons',
    component: NavigationSettingsTab
  },
  { 
    id: 'monitor', 
    label: 'Monitor (beta)', 
    icon: '🖥️', 
    color: 'hsl(var(--settings-tab-monitor))',
    description: 'Multi-monitor settings',
    component: MonitorSettingsTab
  },
  { 
    id: 'motion', 
    label: 'Motion', 
    icon: '✨', 
    color: 'hsl(var(--settings-tab-motion))',
    description: 'Press, drag & reorder feedback',
    component: MotionFeedbackSettingsTab
  },
  { 
    id: 'shortcuts', 
    label: 'Shortcuts', 
    icon: '⌨️', 
    color: 'hsl(var(--settings-tab-shortcuts))',
    description: 'Keyboard shortcuts & hotkeys',
    component: ShortcutsSettingsTab
  },
  { 
    id: 'sounds', 
    label: 'Sounds', 
    icon: '🔊', 
    color: 'hsl(var(--settings-tab-sounds))',
    description: 'Audio feedback & music',
    component: SoundsSettingsTab
  },
  { 
    id: 'themes', 
    label: 'Presets', 
    icon: '🎨', 
    color: 'hsl(var(--settings-tab-themes))',
    description: 'Preset themes & customization',
    component: PresetsSettingsTab
  },
  { 
    id: 'time', 
    label: 'Time', 
    icon: '🕐', 
    color: 'hsl(var(--settings-tab-time))',
    description: 'Clock & pill display',
    component: TimeSettingsTab
  },
  { 
    id: 'updates', 
    label: 'Updates', 
    icon: '🔄', 
    color: 'hsl(var(--settings-tab-updates))',
    description: 'Check for updates & version info',
    component: UpdatesSettingsTab
  },
  { 
    id: 'wallpaper', 
    label: 'Wallpaper', 
    icon: '🖼️', 
    color: 'hsl(var(--settings-tab-wallpaper))',
    description: 'Background & cycling',
    component: WallpaperSettingsTab
  },
  {
    id: 'workspaces',
    label: 'Workspaces',
    icon: '🧩',
    color: 'hsl(var(--settings-tab-workspaces))',
    description: 'Create and switch full app environments',
    component: WorkspacesSettingsTab
  }
];

function SettingsModal({ isOpen, onClose, initialActiveTab = 'channels' }) {
  // Performance optimizations
  const modalRef = useRef(null);
  const tabContentRef = useRef(null);
  
  // Get initial tab from UI state if available
  const ui = useConsolidatedAppStore(useShallow((state) => state.ui));
  const effectiveInitialTab = ui.settingsActiveTab || initialActiveTab;
  
  // Local state
  const [activeTab, setActiveTab] = useState(initialActiveTab);
  const [showMonitorModal, setShowMonitorModal] = useState(false);
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTabs, setFilteredTabs] = useState(SETTINGS_TABS);

  // Update active tab when initialActiveTab prop changes
  useEffect(() => {
    if (isOpen && effectiveInitialTab) {
      setActiveTab(effectiveInitialTab);
    }
  }, [isOpen, effectiveInitialTab]);
  // Simple tab navigation
  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  // Simple render tab content
  const renderTabContent = useMemo(() => {
    const currentTab = SETTINGS_TABS.find(tab => tab.id === activeTab);
    
    if (!currentTab) {
      return <div className="p-8 text-center text-[hsl(var(--text-secondary))]">Tab not found</div>;
    }

    const TabComponent = currentTab.component;
    return (
      <div className="relative h-full flex flex-col">
        {/* Tab Content with Scrollable Area */}
        <div 
          ref={tabContentRef}
          className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[hsl(var(--border-primary))] scrollbar-track-transparent pb-4"
        >
            <TabComponent setShowMonitorModal={setShowMonitorModal} />
        </div>


      </div>
    );
  }, [activeTab]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      const currentIndex = SETTINGS_TABS.findIndex(tab => tab.id === activeTab);
      
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          const nextIndex = (currentIndex + 1) % SETTINGS_TABS.length;
          handleTabChange(SETTINGS_TABS[nextIndex].id);
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          const prevIndex = currentIndex === 0 ? SETTINGS_TABS.length - 1 : currentIndex - 1;
          handleTabChange(SETTINGS_TABS[prevIndex].id);
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;

      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeTab, handleTabChange, onClose]);

  // Search filter logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTabs(SETTINGS_TABS);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = SETTINGS_TABS.filter(tab => 
      tab.label.toLowerCase().includes(query) ||
      tab.description.toLowerCase().includes(query) ||
      tab.id.toLowerCase().includes(query)
    );
    setFilteredTabs(filtered);
  }, [searchQuery]);

  // Auto-focus first tab on open
  useEffect(() => {
    if (isOpen && tabContentRef.current) {
      const firstFocusable = tabContentRef.current.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }
  }, [isOpen, activeTab]);



  if (!isOpen) return null;

  return (
    <WBaseModal
      title="Settings"
      onClose={onClose}
      maxWidth="1400px"
      maxHeight="85vh"
      ref={modalRef}
      footerContent={({ handleClose }) => (
        <div className="flex gap-2.5 justify-between items-center">
          <div />
          <div className="flex gap-2.5">
            <Button variant="secondary" onClick={handleClose}>Close</Button>
          </div>
        </div>
      )}
    >
      {/* Sidebar Navigation */}
      <div className="flex h-[calc(85vh-200px)] border border-[hsl(var(--border-primary))] rounded-lg overflow-hidden">
        {/* Sidebar */}
        <div className="w-55 bg-[hsl(var(--surface-secondary))] border-r border-[hsl(var(--border-primary))] flex flex-col flex-shrink-0">
          {/* Search Bar */}
          <div className="p-4 border-b border-[hsl(var(--border-primary))]">
            <div className="relative">
              <input
                type="text"
                placeholder="Search settings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 pl-10 text-sm bg-[hsl(var(--surface-primary))] border border-[hsl(var(--border-primary))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all duration-200"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[hsl(var(--text-secondary))]">
                🔍
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))] transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          
          {/* Tab List */}
          <div className="flex-1 overflow-y-auto">
            {filteredTabs.length > 0 ? (
              filteredTabs.map((tab) => (
            <SettingsTabButton
              key={tab.id}
              tab={tab}
              isActive={activeTab === tab.id}
                  onClick={handleTabChange}
                />
              ))
            ) : (
              <div className="p-4 text-center text-[hsl(var(--text-secondary))]">
                <div className="text-2xl mb-2">🔍</div>
                <div className="text-sm">No settings found</div>
                <div className="text-xs mt-1">Try a different search term</div>
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-5 bg-[hsl(var(--surface-primary))] min-h-0 relative">
          {renderTabContent}
        </div>
      </div>

    </WBaseModal>
  );
}

SettingsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  initialActiveTab: PropTypes.string,
};

export default SettingsModal;



