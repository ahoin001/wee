import React from 'react';
import PropTypes from 'prop-types';
import Text from '../../ui/Text';
import { WeeGlassPill, WeeSectionEyebrow } from '../../ui/wee';

/**
 * Shared settings live-preview chrome — eyebrow + caption + dashed canvas.
 * Surface-specific content (ribbon strip, wallpaper scene, board grid) goes in `children`.
 */
function SettingsLivePreviewFrame({
  eyebrow = 'Live preview',
  caption,
  headerAside,
  beforeCanvas,
  sticky = false,
  minHeightClassName = 'min-h-[7.5rem]',
  canvasClassName = '',
  canvasStyle,
  children,
  className = '',
}) {
  return (
    <WeeGlassPill
      className={[
        'overflow-hidden rounded-[2.5rem] p-5 md:p-6',
        sticky ? 'sticky top-0 z-10' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <WeeSectionEyebrow className="mb-1 block" trackingClassName="tracking-[0.14em]">
            {eyebrow}
          </WeeSectionEyebrow>
          {caption ? (
            <Text variant="desc" className="!m-0 text-[hsl(var(--text-secondary))]">
              {caption}
            </Text>
          ) : null}
        </div>
        {headerAside ? <div className="shrink-0">{headerAside}</div> : null}
      </div>
      {beforeCanvas || null}
      <div
        className={[
          'relative overflow-hidden rounded-[1.75rem] border-2 border-dashed border-[hsl(var(--border-primary)/0.35)] bg-[hsl(var(--surface-tertiary)/0.55)] p-3 md:p-4',
          minHeightClassName,
          canvasClassName,
        ]
          .filter(Boolean)
          .join(' ')}
        style={canvasStyle}
      >
        {children}
      </div>
    </WeeGlassPill>
  );
}

SettingsLivePreviewFrame.propTypes = {
  eyebrow: PropTypes.string,
  caption: PropTypes.node,
  headerAside: PropTypes.node,
  beforeCanvas: PropTypes.node,
  sticky: PropTypes.bool,
  minHeightClassName: PropTypes.string,
  canvasClassName: PropTypes.string,
  canvasStyle: PropTypes.object,
  children: PropTypes.node,
  className: PropTypes.string,
};

export default SettingsLivePreviewFrame;
