import React, { useState, useCallback, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { AnimatePresence, m } from 'framer-motion';
import { Anchor, Gamepad2, Info, Layers, Sparkles } from 'lucide-react';
import Text from '../../ui/Text';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { findDockThemePath, getDockThemeByPath } from '../../utils/dockThemeUtils';
import { CLASSIC_DOCK_THEME_GROUPS as THEME_GROUPS } from '../../data/dock/classicDockThemeGroups';
import { CLASSIC_DOCK_DEFAULT_COLORS as DOCK_DEFAULT } from '../../design/classicDockThemeDefaults.js';
import { useWeeMotion } from '../../design/weeMotion';
import { WeeDockSettingsSubtabs } from '../../ui/wee';
import DockTypePanel from './dock/DockTypePanel';
import ClassicDockPanel from './dock/ClassicDockPanel';
import RibbonDockPanel from './dock/RibbonDockPanel';
import AnimationsDockPanel from './dock/AnimationsDockPanel';
import SettingsTabPageHeader from './SettingsTabPageHeader';
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
    description: 'Glow & glass',
    icon: Layers,
  },
  {
    id: 'animations',
    label: 'Animations',
    description: 'Particles',
    icon: Sparkles,
  },
];

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
      } catch (error) {
        console.error(`[UnifiedDockSettingsTab] Failed to save ${category}.${key}:`, error);
      }
    },
    [setDockState, setRibbonState, setUIState]
  );

  const [activeSubTab, setActiveSubTab] = useState(() => {
    if (ui?.dockSubTab) return ui.dockSubTab;
    return ui?.classicMode ? 'classic-dock' : 'wii-ribbon';
  });

  const [expandedGroups, setExpandedGroups] = useState({
    classic: true,
    games: false,
  });

  useEffect(() => {
    if (ui?.dockSubTab) {
      const timer = setTimeout(() => saveSetting('ui', 'dockSubTab', undefined), 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [ui?.dockSubTab, saveSetting]);

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
    },
    [saveSetting, setRibbonState]
  );

  const handleRibbonGlowColorChange = useCallback(
    (e) => {
      setRibbonState({ ribbonGlowColor: e.target.value });
      saveSetting('ribbon', 'ribbonGlowColor', e.target.value);
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

  const handleParticleEnabledChange = useCallback(
    (checked) => {
      setDockState({ particleSystemEnabled: checked });
      saveSetting('dock', 'particleSystemEnabled', checked);
    },
    [saveSetting, setDockState]
  );

  const handleParticleEffectTypeChange = useCallback(
    (value) => {
      setDockState({ particleEffectType: value });
      saveSetting('dock', 'particleEffectType', value);
    },
    [saveSetting, setDockState]
  );

  const handleParticleDirectionChange = useCallback(
    (value) => {
      setDockState({ particleDirection: value });
      saveSetting('dock', 'particleDirection', value);
    },
    [saveSetting, setDockState]
  );

  const handleParticleCountChange = useCallback(
    (value) => {
      setDockState({ particleCount: value });
      saveSetting('dock', 'particleCount', value);
    },
    [saveSetting, setDockState]
  );

  const handleParticleSpeedChange = useCallback(
    (value) => {
      setDockState({ particleSpeed: value });
      saveSetting('dock', 'particleSpeed', value);
    },
    [saveSetting, setDockState]
  );

  const handleParticleSizeChange = useCallback(
    (value) => {
      setDockState({ particleSize: value });
      saveSetting('dock', 'particleSize', value);
    },
    [saveSetting, setDockState]
  );

  const handleParticleGravityChange = useCallback(
    (value) => {
      setDockState({ particleGravity: value });
      saveSetting('dock', 'particleGravity', value);
    },
    [saveSetting, setDockState]
  );

  const handleParticleFadeSpeedChange = useCallback(
    (value) => {
      setDockState({ particleFadeSpeed: value });
      saveSetting('dock', 'particleFadeSpeed', value);
    },
    [saveSetting, setDockState]
  );

  const handleParticleUseAdaptiveColorChange = useCallback(
    (checked) => {
      setDockState({ particleUseAdaptiveColor: checked });
      saveSetting('dock', 'particleUseAdaptiveColor', checked);
    },
    [saveSetting, setDockState]
  );

  const handleParticleColorIntensityChange = useCallback(
    (value) => {
      setDockState({ particleColorIntensity: value });
      saveSetting('dock', 'particleColorIntensity', value);
    },
    [saveSetting, setDockState]
  );

  const handleParticleColorVariationChange = useCallback(
    (value) => {
      setDockState({ particleColorVariation: value });
      saveSetting('dock', 'particleColorVariation', value);
    },
    [saveSetting, setDockState]
  );

  const handleParticleRotationSpeedChange = useCallback(
    (value) => {
      setDockState({ particleRotationSpeed: value });
      saveSetting('dock', 'particleRotationSpeed', value);
    },
    [saveSetting, setDockState]
  );

  const handleParticleLifetimeChange = useCallback(
    (value) => {
      setDockState({ particleLifetime: value });
      saveSetting('dock', 'particleLifetime', value);
    },
    [saveSetting, setDockState]
  );

  const handleParticleClipPathFollowChange = useCallback(
    (checked) => {
      setDockState({ particleClipPathFollow: checked });
      saveSetting('dock', 'particleClipPathFollow', checked);
    },
    [saveSetting, setDockState]
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
            glassWiiRibbon={ribbon?.glassWiiRibbon ?? false}
            onGlassWiiRibbonChange={handleGlassWiiRibbonChange}
            onRibbonHoverAnimationChange={handleRibbonHoverAnimationChange}
            onRibbonColorChange={handleRibbonColorChange}
            onRibbonDockOpacityChange={handleRibbonDockOpacityChange}
            onRibbonGlowColorChange={handleRibbonGlowColorChange}
            onRibbonGlowStrengthChange={handleRibbonGlowStrengthChange}
            onRibbonGlowStrengthHoverChange={handleRibbonGlowStrengthHoverChange}
            hoverAnimationEnabled={ribbon?.ribbonHoverAnimationEnabled ?? true}
            onGlassOpacityChange={handleGlassOpacityChange}
            onGlassBlurChange={handleGlassBlurChange}
            onGlassBorderOpacityChange={handleGlassBorderOpacityChange}
            onGlassShineOpacityChange={handleGlassShineOpacityChange}
          />
        );
      case 'animations':
        return (
          <AnimationsDockPanel
            dock={dock}
            onParticleEnabledChange={handleParticleEnabledChange}
            onParticleEffectTypeChange={handleParticleEffectTypeChange}
            onParticleDirectionChange={handleParticleDirectionChange}
            onParticleClipPathFollowChange={handleParticleClipPathFollowChange}
            onParticleCountChange={handleParticleCountChange}
            onParticleSpeedChange={handleParticleSpeedChange}
            onParticleSizeChange={handleParticleSizeChange}
            onParticleGravityChange={handleParticleGravityChange}
            onParticleFadeSpeedChange={handleParticleFadeSpeedChange}
            onParticleLifetimeChange={handleParticleLifetimeChange}
            onParticleUseAdaptiveColorChange={handleParticleUseAdaptiveColorChange}
            onParticleColorIntensityChange={handleParticleColorIntensityChange}
            onParticleColorVariationChange={handleParticleColorVariationChange}
            onParticleRotationSpeedChange={handleParticleRotationSpeedChange}
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
        subtitle="Classic shell, ribbon strip, and dock particles"
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

      <footer className="mt-10 rounded-[2rem] border-2 border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-secondary))] px-5 py-4 md:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <Info size={16} strokeWidth={2.25} className="shrink-0 text-[hsl(var(--wee-text-rail-muted))]" aria-hidden />
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[hsl(var(--wee-text-rail-muted))]">
            Settings sync automatically
          </span>
        </div>
      </footer>
    </div>
  );
});

UnifiedDockSettingsTab.displayName = 'UnifiedDockSettingsTab';

export default UnifiedDockSettingsTab;
