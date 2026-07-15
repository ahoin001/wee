import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import SettingsLivePreviewFrame from '../SettingsLivePreviewFrame';
import { CLASSIC_DOCK_DEFAULT_COLORS as DOCK_DEFAULT } from '../../../design/classicDockThemeDefaults.js';

/**
 * Schematic classic Wii dock capsule for theme / glass tweaks in settings.
 */
function ClassicDockLivePreview({ dock, sticky = true }) {
  const colors = useMemo(
    () => ({
      baseStart: dock?.dockBaseGradientStart || DOCK_DEFAULT.dockBaseGradientStart,
      baseEnd: dock?.dockBaseGradientEnd || DOCK_DEFAULT.dockBaseGradientEnd,
      accent: dock?.dockAccentColor || DOCK_DEFAULT.dockAccentColor,
      leftPod: dock?.leftPodBaseColor || DOCK_DEFAULT.leftPodBaseColor,
      rightPod: dock?.rightPodBaseColor || DOCK_DEFAULT.rightPodBaseColor,
      buttonStart: dock?.buttonGradientStart || DOCK_DEFAULT.buttonGradientStart,
      buttonEnd: dock?.buttonGradientEnd || DOCK_DEFAULT.buttonGradientEnd,
      glass: Boolean(dock?.glassEnabled),
      glassOp: Number(dock?.glassOpacity ?? 0.18),
      glassBlur: Number(dock?.glassBlur ?? 2.5),
    }),
    [dock]
  );

  const barStyle = {
    background: colors.glass
      ? `linear-gradient(180deg, ${colors.baseStart}aa 0%, ${colors.baseEnd}88 100%)`
      : `linear-gradient(180deg, ${colors.baseStart} 0%, ${colors.baseEnd} 100%)`,
    borderColor: colors.accent,
    backdropFilter: colors.glass ? `blur(${Math.max(2, colors.glassBlur)}px)` : undefined,
    WebkitBackdropFilter: colors.glass ? `blur(${Math.max(2, colors.glassBlur)}px)` : undefined,
    opacity: colors.glass ? Math.min(1, Math.max(0.45, 0.55 + colors.glassOp * 0.4)) : 1,
  };

  return (
    <SettingsLivePreviewFrame
      eyebrow="Live classic dock"
      caption="Theme gradients and glass update here as you tweak."
      sticky={sticky}
      minHeightClassName="min-h-[6.5rem]"
      canvasClassName="flex items-end justify-center pb-2"
    >
      <div className="pointer-events-none relative w-full max-w-md" aria-hidden>
        <div
          className="relative mx-auto flex h-14 w-full items-center justify-between overflow-hidden rounded-[1.25rem] border-2 px-3 shadow-[var(--shadow-md)] md:h-16"
          style={barStyle}
        >
          <span
            className="h-10 w-12 shrink-0 rounded-[0.85rem] border border-[hsl(var(--color-pure-white)/0.25)] shadow-[var(--shadow-sm)]"
            style={{ background: colors.leftPod }}
          />
          <div className="flex flex-1 items-center justify-center gap-2 px-2">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="h-8 w-8 rounded-full border border-[hsl(var(--color-pure-white)/0.35)] shadow-[var(--shadow-sm)]"
                style={{
                  background: `linear-gradient(160deg, ${colors.buttonStart} 0%, ${colors.buttonEnd} 100%)`,
                }}
              />
            ))}
          </div>
          <span
            className="h-10 w-12 shrink-0 rounded-[0.85rem] border border-[hsl(var(--color-pure-white)/0.25)] shadow-[var(--shadow-sm)]"
            style={{ background: colors.rightPod }}
          />
        </div>
      </div>
    </SettingsLivePreviewFrame>
  );
}

ClassicDockLivePreview.propTypes = {
  dock: PropTypes.object,
  sticky: PropTypes.bool,
};

export default React.memo(ClassicDockLivePreview);
