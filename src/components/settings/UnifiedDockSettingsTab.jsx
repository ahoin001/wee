import React, { useState, useCallback, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { AnimatePresence, m } from 'framer-motion';
import { Anchor, Gamepad2, Layers } from 'lucide-react';
import Text from '../../ui/Text';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { findDockThemePath, getDockThemeByPath } from '../../utils/dockThemeUtils';
import { CLASSIC_DOCK_THEME_GROUPS as THEME_GROUPS } from '../../data/dock/classicDockThemeGroups';
import { CLASSIC_DOCK_DEFAULT_COLORS as DOCK_DEFAULT } from '../../design/classicDockThemeDefaults.js';
import { useWeeMotion } from '../../design/weeMotion';
import { saveUnifiedSettingsSnapshot } from '../../utils/electronApi';
import { syncActiveSpaceAppearanceCapture } from '../../utils/appearance/spaceAppearance';
import { disableLiveMatchForManualAccent } from '../../utils/appearance/disableLiveMatchForManualAccent';
import { WeeDockSettingsSubtabs } from '../../ui/wee';
import DockTypePanel from './dock/DockTypePanel';
import ClassicDockPanel from './dock/ClassicDockPanel';
import RibbonDockPanel from './dock/RibbonDockPanel';
import SettingsTabPageHeader from './SettingsTabPageHeader';
import {
  getRibbonChromeEffectDefaults,
  normalizeRibbonChromeEffectId,
} from '../dock/ribbon/ribbonChromeEffectMeta';
import './surfaceStyles.css';

const DOCK_SUB_TABS = [
  {
    id: 'dock-type',
    label: 'Dock type',
    description: 'Classic or ribbon',
    icon: Anchor,
  },
  {
    id: 'classic-dock',
    label: 'Classic dock',
    description: 'Themes & glass',
    icon: Gamepad2,
  },
  {
    id: 'wii-ribbon',
    label: 'Wii ribbon',
    description: 'Glow, glass & chrome',
    icon: Layers,
  },
];

/** Legacy deep-links (`animations`) redirect to ribbon chrome effects. */
function normalizeDockSubTab(subTab, classicMode) {
  if (subTab === 'animations') return 'wii-ribbon';
  if (subTab && DOCK_SUB_TABS.some((t) => t.id === subTab)) return subTab;
  return classicMode ? 'classic-dock' : 'wii-ribbon';
}

const UnifiedDockSettingsTab = React.memo(() => {
  const { dock, ribbon, ui } = useConsolidatedAppStore(
    useShallow((state) => ({
      dock: state.dock,
      ribbon: state.ribbon,
      ui: state.ui,
    }))
  );
  const { setDockState, setRibbonState, setUIState } = useConsolidatedAppStore(
    useShallow((state) => ({
      setDockState: state.actions.setDockState,
      setRibbonState: state.actions.setRibbonState,
      setUIState: state.actions.setUIState,
    }))
  );

  const { tabTransition } = useWeeMotion();

  const saveSetting = useCallback(
    async (category, key, value) => {
      try {
        if (category === 'dock') setDockState({ [key]: value });
        else if (category === 'ribbon') setRibbonState({ [key]: value });
        else if (category === 'ui') setUIState({ [key]: value });

        // Persist explicit settings edits immediately (writer remains debounced/merged),
        // so close/reopen reloads the latest chosen value.
        const patch = value !== undefined ? { [category]: { [key]: value } } : null;
        if (category === 'ribbon' && value !== undefined) {
          // Keep appearanceBySpace in sync so restart / space switch cannot revert ribbon look.
          const synced = syncActiveSpaceAppearanceCapture({
            getState: () => useConsolidatedAppStore.getState(),
            setAppearanceBySpaceState:
              useConsolidatedAppStore.getState().actions.setAppearanceBySpaceState,
          });
          if (synced && patch) {
            patch.appearanceBySpace = { [synced.spaceId]: synced.appearance };
          }
        }
        if (patch) {
          await saveUnifiedSettingsSnapshot(patch);
        }
      } catch (error) {
        console.error(`[UnifiedDockSettingsTab] Failed to save ${category}.${key}:`, error);
      }
    },
    [setDockState, setRibbonState, setUIState]
  );

  const [activeSubTab, setActiveSubTab] = useState(() =>
    normalizeDockSubTab(ui?.dockSubTab, ui?.classicMode)
  );

  const [expandedGroups, setExpandedGroups] = useState({
    classic: true,
    games: false,
  });

  useEffect(() => {
    if (ui?.dockSubTab) {
      setActiveSubTab(normalizeDockSubTab(ui.dockSubTab, ui?.classicMode));
      const timer = setTimeout(() => saveSetting('ui', 'dockSubTab', undefined), 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [ui?.dockSubTab, ui?.classicMode, saveSetting]);

  const handleDockTypeChange = useCallback(
    (dockType) => {
      saveSetting('ui', 'classicMode', dockType === 'classic');
    },
    [saveSetting]
  );

  const applyTheme = useCallback(
    (themePath) => {
      const theme = getDockThemeByPath(THEME_GROUPS, themePath);
      if (theme) {
        setDockState(theme.colors);
        Object.entries(theme.colors).forEach(([key, value]) => {
          saveSetting('dock', key, value);
        });
      }
    },
    [saveSetting, setDockState]
  );

  const getCurrentTheme = useCallback(() => {
    return findDockThemePath(THEME_GROUPS, {
      dockBaseGradientStart: dock?.dockBaseGradientStart,
      dockBaseGradientEnd: dock?.dockBaseGradientEnd,
      dockAccentColor: dock?.dockAccentColor,
      sdCardBodyColor: dock?.sdCardBodyColor,
      sdCardBorderColor: dock?.sdCardBorderColor,
      sdCardLabelColor: dock?.sdCardLabelColor,
      sdCardLabelBorderColor: dock?.sdCardLabelBorderColor,
      sdCardBottomColor: dock?.sdCardBottomColor,
      leftPodBaseColor: dock?.leftPodBaseColor,
      leftPodAccentColor: dock?.leftPodAccentColor,
      leftPodDetailColor: dock?.leftPodDetailColor,
      rightPodBaseColor: dock?.rightPodBaseColor,
      rightPodAccentColor: dock?.rightPodAccentColor,
      rightPodDetailColor: dock?.rightPodDetailColor,
      buttonBorderColor: dock?.buttonBorderColor,
      buttonGradientStart: dock?.buttonGradientStart,
      buttonGradientEnd: dock?.buttonGradientEnd,
      buttonIconColor: dock?.buttonIconColor,
      rightButtonIconColor: dock?.rightButtonIconColor,
      buttonHighlightColor: dock?.buttonHighlightColor,
    });
  }, [dock]);

  const handleColorChange = useCallback(
    (key, value) => {
      setDockState({ [key]: value });
      saveSetting('dock', key, value);
    },
    [saveSetting, setDockState]
  );

  const handleRibbonColorChange = useCallback(
    (e) => {
      setRibbonState({ ribbonColor: e.target.value });
      saveSetting('ribbon', 'ribbonColor', e.target.value);
      void disableLiveMatchForManualAccent({ persist: true });
    },
    [saveSetting, setRibbonState]
  );

  const handleRibbonGlowColorChange = useCallback(
    (e) => {
      setRibbonState({ ribbonGlowColor: e.target.value });
      saveSetting('ribbon', 'ribbonGlowColor', e.target.value);
      void disableLiveMatchForManualAccent({ persist: true });
    },
    [saveSetting, setRibbonState]
  );

  const handleRibbonGlowStrengthChange = useCallback(
    (value) => {
      setRibbonState({ ribbonGlowStrength: value });
      saveSetting('ribbon', 'ribbonGlowStrength', value);
    },
    [saveSetting, setRibbonState]
  );

  const handleRibbonGlowStrengthHoverChange = useCallback(
    (value) => {
      setRibbonState({ ribbonGlowStrengthHover: value });
      saveSetting('ribbon', 'ribbonGlowStrengthHover', value);
    },
    [saveSetting, setRibbonState]
  );

  const handleRibbonDockOpacityChange = useCallback(
    (value) => {
      setRibbonState({ ribbonDockOpacity: value });
      saveSetting('ribbon', 'ribbonDockOpacity', value);
    },
    [saveSetting, setRibbonState]
  );

  const handleRibbonHoverAnimationChange = useCallback(
    (checked) => {
      setRibbonState({ ribbonHoverAnimationEnabled: checked });
      saveSetting('ribbon', 'ribbonHoverAnimationEnabled', checked);
    },
    [saveSetting, setRibbonState]
  );

  const handleDynamicRibbonColorEnabledChange = useCallback(
    (checked) => {
      setRibbonState({ dynamicRibbonColorEnabled: checked });
      saveSetting('ribbon', 'dynamicRibbonColorEnabled', checked);
    },
    [saveSetting, setRibbonState]
  );

  const handleGlassWiiRibbonChange = useCallback(
    (checked) => {
      setRibbonState({ glassWiiRibbon: checked });
      saveSetting('ribbon', 'glassWiiRibbon', checked);
    },
    [saveSetting, setRibbonState]
  );

  const handleGlassOpacityChange = useCallback(
    (value) => {
      setRibbonState({ glassOpacity: value });
      saveSetting('ribbon', 'glassOpacity', value);
    },
    [saveSetting, setRibbonState]
  );

  const handleGlassBlurChange = useCallback(
    (value) => {
      setRibbonState({ glassBlur: value });
      saveSetting('ribbon', 'glassBlur', value);
    },
    [saveSetting, setRibbonState]
  );

  const handleGlassBorderOpacityChange = useCallback(
    (value) => {
      setRibbonState({ glassBorderOpacity: value });
      saveSetting('ribbon', 'glassBorderOpacity', value);
    },
    [saveSetting, setRibbonState]
  );

  const handleGlassShineOpacityChange = useCallback(
    (value) => {
      setRibbonState({ glassShineOpacity: value });
      saveSetting('ribbon', 'glassShineOpacity', value);
    },
    [saveSetting, setRibbonState]
  );

  const handleChromeEffectChange = useCallback(
    (value) => {
      const mode = normalizeRibbonChromeEffectId(value);
      const glass = Boolean(ribbon?.glassWiiRibbon);
      const defaults = getRibbonChromeEffectDefaults(mode, { glass });
      const next = {
        chromeEffect: mode,
        chromeEffectIntensity: defaults.intensity,
        chromeEffectSpeed: defaults.speed,
      };
      if (mode === 'neonTrace' || mode === 'aurora') {
        next.chromeEffectGlowStrength = defaults.glowStrength;
      }
      if (mode === 'neonTrace') {
        next.chromeEffectNeonColorMode = defaults.neonColorMode;
      }
      setRibbonState(next);
      saveSetting('ribbon', 'chromeEffect', mode);
      saveSetting('ribbon', 'chromeEffectIntensity', defaults.intensity);
      saveSetting('ribbon', 'chromeEffectSpeed', defaults.speed);
      if (mode === 'neonTrace' || mode === 'aurora') {
        saveSetting('ribbon', 'chromeEffectGlowStrength', defaults.glowStrength);
      }
      if (mode === 'neonTrace') {
        saveSetting('ribbon', 'chromeEffectNeonColorMode', defaults.neonColorMode);
      }
    },
    [ribbon?.glassWiiRibbon, saveSetting, setRibbonState]
  );

  const handleChromeEffectIntensityChange = useCallback(
    (value) => {
      setRibbonState({ chromeEffectIntensity: value });
      saveSetting('ribbon', 'chromeEffectIntensity', value);
    },
    [saveSetting, setRibbonState]
  );

  const handleChromeEffectSpeedChange = useCallback(
    (value) => {
      setRibbonState({ chromeEffectSpeed: value });
      saveSetting('ribbon', 'chromeEffectSpeed', value);
    },
    [saveSetting, setRibbonState]
  );

  const handleChromeEffectGlowStrengthChange = useCallback(
    (value) => {
      setRibbonState({ chromeEffectGlowStrength: value });
      saveSetting('ribbon', 'chromeEffectGlowStrength', value);
    },
    [saveSetting, setRibbonState]
  );

  const handleChromeEffectNeonColorModeChange = useCallback(
    (value) => {
      setRibbonState({ chromeEffectNeonColorMode: value });
      saveSetting('ribbon', 'chromeEffectNeonColorMode', value);
    },
    [saveSetting, setRibbonState]
  );

  const handleChromeEffectIdleOnlyChange = useCallback(
    (value) => {
      setRibbonState({ chromeEffectIdleOnly: value });
      saveSetting('ribbon', 'chromeEffectIdleOnly', value);
    },
    [saveSetting, setRibbonState]
  );

  const onToggleThemeGroup = useCallback((groupKey) => {
    setExpandedGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  }, []);

  const onClassicGlassEnabled = useCallback(
    (checked) => {
      setDockState({ glassEnabled: checked });
      saveSetting('dock', 'glassEnabled', checked);
    },
    [saveSetting, setDockState]
  );

  const onClassicGlassOpacity = useCallback(
    (value) => {
      setDockState({ glassOpacity: value });
      saveSetting('dock', 'glassOpacity', value);
    },
    [saveSetting, setDockState]
  );

  const onClassicGlassBlur = useCallback(
    (value) => {
      setDockState({ glassBlur: value });
      saveSetting('dock', 'glassBlur', value);
    },
    [saveSetting, setDockState]
  );

  const renderPanel = () => {
    switch (activeSubTab) {
      case 'dock-type':
        return (
          <DockTypePanel
            classicMode={ui.classicMode}
            onChangeMode={handleDockTypeChange}
          />
        );
      case 'classic-dock':
        return (
          <ClassicDockPanel
            dock={dock}
            themeGroups={THEME_GROUPS}
            dockDefault={DOCK_DEFAULT}
            expandedGroups={expandedGroups}
            onToggleThemeGroup={onToggleThemeGroup}
            getCurrentTheme={getCurrentTheme}
            applyTheme={applyTheme}
            onColorChange={handleColorChange}
            onGlassEnabled={onClassicGlassEnabled}
            onGlassOpacity={onClassicGlassOpacity}
            onGlassBlur={onClassicGlassBlur}
          />
        );
      case 'wii-ribbon':
        return (
          <RibbonDockPanel
            ribbon={ribbon}
            onGlassWiiRibbonChange={handleGlassWiiRibbonChange}
            onRibbonHoverAnimationChange={handleRibbonHoverAnimationChange}
            onDynamicRibbonColorEnabledChange={handleDynamicRibbonColorEnabledChange}
            onRibbonColorChange={handleRibbonColorChange}
            onRibbonDockOpacityChange={handleRibbonDockOpacityChange}
            onRibbonGlowColorChange={handleRibbonGlowColorChange}
            onRibbonGlowStrengthChange={handleRibbonGlowStrengthChange}
            onRibbonGlowStrengthHoverChange={handleRibbonGlowStrengthHoverChange}
            hoverAnimationEnabled={ribbon?.ribbonHoverAnimationEnabled ?? true}
            dynamicRibbonColorEnabled={ribbon?.dynamicRibbonColorEnabled ?? false}
            onGlassOpacityChange={handleGlassOpacityChange}
            onGlassBlurChange={handleGlassBlurChange}
            onGlassBorderOpacityChange={handleGlassBorderOpacityChange}
            onGlassShineOpacityChange={handleGlassShineOpacityChange}
            onChromeEffectChange={handleChromeEffectChange}
            onChromeEffectIntensityChange={handleChromeEffectIntensityChange}
            onChromeEffectSpeedChange={handleChromeEffectSpeedChange}
            onChromeEffectGlowStrengthChange={handleChromeEffectGlowStrengthChange}
            onChromeEffectNeonColorModeChange={handleChromeEffectNeonColorModeChange}
            onChromeEffectIdleOnlyChange={handleChromeEffectIdleOnlyChange}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col pb-12">
      <SettingsTabPageHeader
        title="Dock"
        subtitle="Classic shell, ribbon strip, and chrome effects"
        className="mb-6"
      />

      <WeeDockSettingsSubtabs tabs={DOCK_SUB_TABS} value={activeSubTab} onChange={setActiveSubTab} />

      <div className="mt-6 min-h-[min(60vh,520px)]">
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={activeSubTab}
            role="tabpanel"
            aria-labelledby={`dock-subtab-${activeSubTab}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={tabTransition}
          >
            {renderPanel()}
          </m.div>
        </AnimatePresence>
      </div>
    </div>
  );
});

UnifiedDockSettingsTab.displayName = 'UnifiedDockSettingsTab';

export default UnifiedDockSettingsTab;
