/**
 * Compact shared liquid-glass controls for Edit Home.
 * Writes `ui.homeWidgetGlass` so every surface:glass tile stays in harmony.
 */
import React, { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import Slider from '../../ui/Slider';
import WButton from '../../ui/WButton';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import {
  DEFAULT_HOME_WIDGET_GLASS,
  normalizeHomeWidgetGlass,
} from '../../utils/homeWidgetGlass';

function HomeWidgetGlassControls() {
  const glass = useConsolidatedAppStore(
    useShallow((state) => normalizeHomeWidgetGlass(state.ui?.homeWidgetGlass))
  );
  const setUIState = useConsolidatedAppStore((s) => s.actions.setUIState);

  const patchGlass = useCallback(
    (partial) => {
      const prev = normalizeHomeWidgetGlass(
        useConsolidatedAppStore.getState().ui?.homeWidgetGlass
      );
      setUIState({
        homeWidgetGlass: normalizeHomeWidgetGlass({
          ...prev,
          ...partial,
          surfacesMigrated: true,
        }),
      });
    },
    [setUIState]
  );

  const handleReset = useCallback(() => {
    patchGlass({
      blur: DEFAULT_HOME_WIDGET_GLASS.blur,
      tint: DEFAULT_HOME_WIDGET_GLASS.tint,
      saturation: DEFAULT_HOME_WIDGET_GLASS.saturation,
      refraction: DEFAULT_HOME_WIDGET_GLASS.refraction,
      shine: DEFAULT_HOME_WIDGET_GLASS.shine,
    });
  }, [patchGlass]);

  return (
    <div className="flex w-full flex-col gap-2 border-t-2 border-[hsl(var(--border-primary)/0.25)] px-1 pb-1 pt-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
        <span className="text-[length:var(--font-size-micro)] font-black uppercase tracking-[0.12em] text-[hsl(var(--text-secondary))]">
          Shared glass · all liquid tiles
        </span>
        <WButton size="sm" variant="secondary" onClick={handleReset}>
          Reset look
        </WButton>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <Slider
          label={`Frost ${Math.round(glass.blur)}px`}
          value={glass.blur}
          min={0}
          max={32}
          step={1}
          onChange={(blur) => patchGlass({ blur })}
          containerClassName="!mb-0 min-w-[9.5rem]"
          aria-label="Glass frost"
        />
        <Slider
          label={`Tint ${Math.round(glass.tint * 100)}%`}
          value={Math.round(glass.tint * 100)}
          min={4}
          max={45}
          step={1}
          onChange={(v) => patchGlass({ tint: v / 100 })}
          containerClassName="!mb-0 min-w-[9.5rem]"
          aria-label="Glass tint"
        />
        <Slider
          label={`Saturation ${Math.round(glass.saturation)}%`}
          value={glass.saturation}
          min={100}
          max={200}
          step={5}
          onChange={(saturation) => patchGlass({ saturation })}
          containerClassName="!mb-0 min-w-[9.5rem]"
          aria-label="Glass saturation"
        />
        <Slider
          label={`Refraction ${Math.round(glass.refraction * 100)}%`}
          value={Math.round(glass.refraction * 100)}
          min={0}
          max={100}
          step={5}
          onChange={(v) => patchGlass({ refraction: v / 100 })}
          containerClassName="!mb-0 min-w-[9.5rem]"
          aria-label="Glass refraction"
        />
        <Slider
          label={`Shine ${Math.round(glass.shine * 100)}%`}
          value={Math.round(glass.shine * 100)}
          min={0}
          max={100}
          step={5}
          onChange={(v) => patchGlass({ shine: v / 100 })}
          containerClassName="!mb-0 min-w-[9.5rem]"
          aria-label="Glass shine"
        />
      </div>
    </div>
  );
}

export default React.memo(HomeWidgetGlassControls);
