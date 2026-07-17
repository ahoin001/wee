import React, { useCallback } from 'react';
import useChannelOperations from '../../utils/useChannelOperations';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { resolveActiveChannelSpaceKey } from '../../utils/channelSpaces';
import { playChannelClick } from '../../utils/soundPlayback';
import { WeeGooeySideNavButton } from '../../ui/wee';

const DefaultLeftIcon = () => (
  <svg width="24" height="24" viewBox="0 0 20 20" fill="none" aria-hidden>
    <path
      d="M12 6 L8 10 L12 14"
      stroke="currentColor"
      strokeWidth="2.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const DefaultRightIcon = () => (
  <svg width="24" height="24" viewBox="0 0 20 20" fill="none" aria-hidden>
    <path
      d="M8 6 L12 10 L8 14"
      stroke="currentColor"
      strokeWidth="2.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function rgbToRgba(rgbString, alpha = 1) {
  if (!rgbString || !rgbString.startsWith('rgb(')) return rgbString;
  return rgbString.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
}

/**
 * Wii-layout edge peeks for the active channel board (Home or Focus).
 * Always Wee Pill Morph Reveal (`WeeGooeySideNavButton` variant="wee").
 */
const WiiSideNavigation = () => {
  const activeSpaceId = useConsolidatedAppStore((s) => s.spaces?.activeSpaceId);
  const channelSpaceKey = resolveActiveChannelSpaceKey(activeSpaceId);
  const { navigation, nextPage, prevPage } = useChannelOperations(channelSpaceKey);
  const { totalPages, isAnimating, mode } = navigation;

  const spotifyColors = useConsolidatedAppStore((state) => state.spotify.extractedColors);
  const spotifyEnabled = useConsolidatedAppStore((state) => state.ui.spotifyMatchEnabled);
  const dynamicRibbonColorEnabled = useConsolidatedAppStore(
    (state) => state.ribbon.dynamicRibbonColorEnabled ?? false
  );
  const shouldUseDynamicNavColors = spotifyEnabled && dynamicRibbonColorEnabled;

  const navigationSettings = useConsolidatedAppStore((state) => state.navigation);
  const leftIcon = navigationSettings.icons?.left || null;
  const rightIcon = navigationSettings.icons?.right || null;
  const leftGlassSettings = navigationSettings.glassEffect?.left || {
    enabled: false,
    opacity: 0.18,
    blur: 2.5,
    borderOpacity: 0.5,
    shineOpacity: 0.7,
  };
  const rightGlassSettings = navigationSettings.glassEffect?.right || {
    enabled: false,
    opacity: 0.18,
    blur: 2.5,
    borderOpacity: 0.5,
    shineOpacity: 0.7,
  };
  const navigationSpotifyIntegration = navigationSettings.spotifyIntegration || false;

  const getGlassStyleVars = useCallback(
    (glassSettings) => {
      if (!glassSettings.enabled) return undefined;

      let background = `hsl(var(--color-pure-white) / ${glassSettings.opacity})`;
      let border = `hsl(var(--color-pure-white) / ${glassSettings.borderOpacity})`;
      let glow = 'hsl(var(--side-nav-glass-glow) / 0.37)';

      if (shouldUseDynamicNavColors && navigationSpotifyIntegration && spotifyColors) {
        const { primary, secondary, accent } = spotifyColors;
        if (primary && secondary && accent) {
          background = rgbToRgba(primary, glassSettings.opacity);
          border = rgbToRgba(secondary, glassSettings.borderOpacity);
          glow = rgbToRgba(accent, 0.37);
        }
      }

      return {
        '--side-nav-surface-bg': `linear-gradient(145deg, ${background} 0%, ${background} 100%)`,
        '--side-nav-surface-bg-hover': `linear-gradient(145deg, ${background} 0%, ${background} 100%)`,
        '--side-nav-surface-border': border,
        '--side-nav-surface-border-hover': border,
        '--side-nav-shadow': `0 6px 20px ${glow}`,
        '--side-nav-shadow-hover': `0 8px 25px ${glow}`,
        '--side-nav-shadow-active': `0 4px 15px ${glow}`,
        '--nav-glass-blur': `${glassSettings.blur}px`,
        background: `linear-gradient(145deg, ${background} 0%, ${background} 100%)`,
        borderColor: border,
      };
    },
    [navigationSpotifyIntegration, shouldUseDynamicNavColors, spotifyColors]
  );

  const renderIcon = (customIcon, DefaultIcon) => {
    const textColor =
      shouldUseDynamicNavColors && navigationSpotifyIntegration && spotifyColors?.text
        ? spotifyColors.text
        : 'currentColor';

    if (customIcon) {
      return (
        <img
          src={customIcon}
          alt=""
          style={{
            filter:
              shouldUseDynamicNavColors && navigationSpotifyIntegration && spotifyColors?.text
                ? 'brightness(0) saturate(100%) invert(1)'
                : 'none',
          }}
          onError={(e) => {
            if (e?.currentTarget) e.currentTarget.style.display = 'none';
          }}
        />
      );
    }
    return (
      <span style={{ color: textColor }}>
        <DefaultIcon />
      </span>
    );
  };

  if (mode !== 'wii' || totalPages <= 1) {
    return null;
  }

  const canGoLeft = totalPages > 1;
  const canGoRight = totalPages > 1;

  return (
    <>
      <WeeGooeySideNavButton
        side="left"
        variant="wee"
        isOpen={canGoLeft}
        disabled={isAnimating}
        surfaceStyle={getGlassStyleVars(leftGlassSettings)}
        title="Previous page"
        aria-label="Previous page"
        onClick={async () => {
          await playChannelClick();
          prevPage();
        }}
      >
        {renderIcon(leftIcon, DefaultLeftIcon)}
      </WeeGooeySideNavButton>

      <WeeGooeySideNavButton
        side="right"
        variant="wee"
        isOpen={canGoRight}
        disabled={isAnimating}
        surfaceStyle={getGlassStyleVars(rightGlassSettings)}
        title="Next page"
        aria-label="Next page"
        onClick={async () => {
          await playChannelClick();
          nextPage();
        }}
      >
        {renderIcon(rightIcon, DefaultRightIcon)}
      </WeeGooeySideNavButton>
    </>
  );
};

export default WiiSideNavigation;
