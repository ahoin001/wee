import React from 'react';
import PropTypes from 'prop-types';
import { useShallow } from 'zustand/react/shallow';
import SettingsLivePreviewFrame from '../SettingsLivePreviewFrame';
import ClassicWiiDock from '../../dock/ClassicWiiDock';
import useConsolidatedAppStore from '../../../utils/useConsolidatedAppStore';
import { wallpaperEntryUrlKey } from '../../../utils/wallpaperShape';

/**
 * 1:1 scaled live preview of the classic Wii dock — mounts the real ClassicWiiDock
 * (its layout is fully percentage-based, so it scales with container width) in a
 * non-interactive frame over the current wallpaper.
 */
function ClassicDockLivePreview({ sticky = true }) {
  const dock = useConsolidatedAppStore((state) => state.dock);
  const buttonConfigs = useConsolidatedAppStore(
    useShallow((state) => state.ribbon.ribbonButtonConfigs || [])
  );
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
      eyebrow="Live classic dock"
      caption="A 1:1 miniature of your dock — theme colors and glass update as you tweak."
      sticky={sticky}
      minHeightClassName=""
      canvasClassName="!p-0 flex items-end"
      canvasStyle={canvasStyle}
    >
      <div
        className="pointer-events-none w-full select-none"
        aria-hidden
        ref={(el) => el?.setAttribute('inert', '')}
      >
        <ClassicWiiDock
          dockSettings={dock}
          buttonConfigs={buttonConfigs}
          accessoryButtonConfig={{}}
          particleSettings={{}}
        />
      </div>
    </SettingsLivePreviewFrame>
  );
}

ClassicDockLivePreview.propTypes = {
  sticky: PropTypes.bool,
};

export default React.memo(ClassicDockLivePreview);
