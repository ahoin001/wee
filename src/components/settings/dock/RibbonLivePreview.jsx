import React from 'react';
import PropTypes from 'prop-types';
import SettingsLivePreviewFrame from '../SettingsLivePreviewFrame';
import RibbonMiniature from '../../dock/ribbon/RibbonMiniature';
import useConsolidatedAppStore from '../../../utils/useConsolidatedAppStore';
import { wallpaperEntryUrlKey } from '../../../utils/wallpaperShape';

/**
 * 1:1 scaled live preview of the Wii ribbon for settings — renders the real ribbon
 * layers (RibbonMiniature) over the current wallpaper so glass, glow, and chrome
 * effects read exactly like the homescreen.
 */
function RibbonLivePreview({ sticky = true, compact = false }) {
  const wallpaperUrl = useConsolidatedAppStore((state) =>
    wallpaperEntryUrlKey(state.wallpaper?.current)
  );

  const canvasStyle = wallpaperUrl
    ? {
        backgroundImage: `url("${String(wallpaperUrl).replace(/\\/g, '/').replace(/"/g, '')}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center bottom',
      }
    : undefined;

  return (
    <SettingsLivePreviewFrame
      eyebrow="Live ribbon"
      caption={
        compact
          ? 'Exact ribbon, scaled down — updates as you tweak.'
          : 'A 1:1 miniature of your ribbon over the current wallpaper — surface, glow, glass, and chrome update as you tweak.'
      }
      sticky={sticky}
      minHeightClassName=""
      canvasClassName="!p-0 flex items-end"
      canvasStyle={canvasStyle}
    >
      <div className="pointer-events-none w-full" aria-hidden>
        <RibbonMiniature />
      </div>
    </SettingsLivePreviewFrame>
  );
}

RibbonLivePreview.propTypes = {
  sticky: PropTypes.bool,
  compact: PropTypes.bool,
};

export default React.memo(RibbonLivePreview);
