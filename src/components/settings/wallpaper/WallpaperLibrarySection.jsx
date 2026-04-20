import React from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { Heart, Loader2, Trash2 } from 'lucide-react';
import Text from '../../../ui/Text';
import Button from '../../../ui/WButton';
import SettingsWeeSection from '../SettingsWeeSection';
import { WeeButton, WeeModalFieldCard } from '../../../ui/wee';
import { WALLPAPER_CHECKERBOARD_BG } from '../../../design/runtimeColorStrings.js';

function WallpaperLibrarySection({
  selectedSpaceLabel,
  isHomeSpace,
  selectedSpaceUsesGlobalWallpaper,
  uploading,
  handleUpload,
  effectiveActiveWallpaperUrl,
  handleRemoveWallpaper,
  selectedWallpaper,
  reduceMotion,
  tabTransition,
  likedWallpapers,
  handleLike,
  handleSetCurrent,
  wallpapers,
  setSelectedWallpaper,
  deleting,
  handleDelete,
}) {
  const usingDefaultSelection = isHomeSpace
    ? !effectiveActiveWallpaperUrl
    : selectedSpaceUsesGlobalWallpaper;
  const defaultWallpaperTitle = isHomeSpace ? 'Default background' : 'Use Home wallpaper';
  const defaultWallpaperHint = isHomeSpace
    ? (usingDefaultSelection ? 'Currently active' : 'Click to clear wallpaper')
    : (usingDefaultSelection ? 'Currently active for this space' : 'Click to stop using a space override');

  return (
    <SettingsWeeSection eyebrow="Library">
      <WeeModalFieldCard hoverAccent="primary" paddingClassName="p-5 md:p-6">
        <Text variant="h3" className="mb-1 playful-hero-text">
          Add to library
        </Text>
        <Text variant="desc" className="mb-5">
          From your computer — JPG, PNG, GIF, MP4, WEBM, and other supported formats.
        </Text>
        <Button
          variant="primary"
          onClick={handleUpload}
          disabled={uploading}
          className="settings-wee-primary-pill"
        >
          {uploading ? 'Uploading…' : 'Upload wallpaper'}
        </Button>
      </WeeModalFieldCard>

      <WeeModalFieldCard hoverAccent="primary" paddingClassName="p-5 md:p-6">
        <Text variant="h3" className="mb-1 playful-hero-text">
          2. Pick wallpaper
        </Text>
        <Text variant="desc" className="mb-5">
          Pick a tile, preview it, then set it for {selectedSpaceLabel}. You can still like it for Home cycling or
          heart it for cycling.
        </Text>
        <div className="mb-5 flex justify-center py-1">
          <button
            type="button"
            className={`settings-wee-default-wallpaper min-w-[220px] max-w-full text-left ${
              usingDefaultSelection ? 'settings-wee-default-wallpaper--active' : ''
            }`}
            onClick={handleRemoveWallpaper}
          >
            <div
              className="settings-wee-default-wallpaper__swatch"
              style={{
                background: WALLPAPER_CHECKERBOARD_BG,
                backgroundSize: '8px 8px',
                backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
              }}
            />
            <div className="min-w-0">
              <div
                className={`mb-0.5 text-[14px] font-semibold ${
                  usingDefaultSelection ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--text-primary))]'
                }`}
              >
                {defaultWallpaperTitle}
              </div>
              <div
                className={`text-xs ${
                  usingDefaultSelection
                    ? 'text-[hsl(var(--primary))]'
                    : 'text-[hsl(var(--text-tertiary))]'
                }`}
              >
                {defaultWallpaperHint}
              </div>
            </div>
          </button>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {selectedWallpaper ? (
            <m.div
              key={selectedWallpaper.url}
              className="settings-wee-wallpaper-hero"
              initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -8, scale: 0.98 }}
              transition={tabTransition}
            >
              <div className="settings-wee-wallpaper-hero__row">
                <div className="settings-wee-wallpaper-hero__frame">
                  <img src={selectedWallpaper.url} alt="" />
                </div>
                <div className="settings-wee-wallpaper-hero__meta">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="settings-wee-wallpaper-hero__eyebrow">
                      {effectiveActiveWallpaperUrl === selectedWallpaper.url ? 'Active asset' : 'Preview'}
                    </span>
                    {effectiveActiveWallpaperUrl === selectedWallpaper.url ? (
                      <span className="settings-wee-wallpaper-hero__badge">On {selectedSpaceLabel}</span>
                    ) : null}
                  </div>
                  <div className="settings-wee-wallpaper-hero__name">{selectedWallpaper.name}</div>
                </div>
                <div className="settings-wee-wallpaper-hero__actions">
                  <WeeButton
                    type="button"
                    variant="primary"
                    className="!px-4 !py-2.5 sm:!px-5 sm:!py-3"
                    disabled={effectiveActiveWallpaperUrl === selectedWallpaper.url}
                    onClick={() => handleSetCurrent(selectedWallpaper)}
                  >
                    {effectiveActiveWallpaperUrl === selectedWallpaper.url
                      ? `On ${selectedSpaceLabel}`
                      : `Set for ${selectedSpaceLabel}`}
                  </WeeButton>
                  <WeeButton
                    type="button"
                    variant="secondary"
                    className="!min-w-0 !px-3 !py-2.5 sm:!py-3"
                    title={likedWallpapers.includes(selectedWallpaper.url) ? 'Unlike for cycling' : 'Like for cycling'}
                    aria-label={
                      likedWallpapers.includes(selectedWallpaper.url) ? 'Unlike wallpaper' : 'Like wallpaper'
                    }
                    onClick={() => handleLike(selectedWallpaper.url)}
                  >
                    <Heart
                      size={18}
                      strokeWidth={2.4}
                      className={
                        likedWallpapers.includes(selectedWallpaper.url)
                          ? 'fill-[hsl(var(--state-error))] text-[hsl(var(--state-error))]'
                          : ''
                      }
                      aria-hidden
                    />
                  </WeeButton>
                </div>
              </div>
            </m.div>
          ) : null}
        </AnimatePresence>

        <p className="settings-wee-subhead !mb-3 !mt-1">Library</p>
        <div className="settings-wee-wallpaper-picker-grid">
          {wallpapers.length === 0 ? (
            <Text variant="help" className="col-span-full text-center">
              No saved wallpapers yet.
            </Text>
          ) : null}
          {wallpapers.map((wallpaper, idx) => {
            const selected = selectedWallpaper && selectedWallpaper.url === wallpaper.url;
            const liked = likedWallpapers.includes(wallpaper.url);
            const onDesktop = effectiveActiveWallpaperUrl === wallpaper.url;
            return (
              <div
                key={wallpaper.url || idx}
                role="button"
                tabIndex={0}
                className={[
                  'settings-wee-wallpaper-picker-tile',
                  selected ? 'settings-wee-wallpaper-picker-tile--selected' : '',
                  onDesktop ? 'settings-wee-wallpaper-picker-tile--active-desktop' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-label={`Select wallpaper ${wallpaper.name}`}
                onClick={() => setSelectedWallpaper(wallpaper)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedWallpaper(wallpaper);
                  }
                }}
              >
                <div className="settings-wee-wallpaper-picker-tile__media">
                  <img
                    className="settings-wee-wallpaper-picker-tile__img"
                    src={wallpaper.url}
                    alt=""
                  />
                  {onDesktop ? (
                    <span className="settings-wee-wallpaper-picker-tile__pill">{selectedSpaceLabel}</span>
                  ) : null}
                  <button
                    type="button"
                    className={`settings-wee-wallpaper-fab settings-wee-wallpaper-fab--bl ${
                      liked ? 'settings-wee-wallpaper-fab--like-on' : ''
                    }`}
                    title={liked ? 'Unlike' : 'Like for cycling'}
                    aria-label={liked ? 'Unlike wallpaper' : 'Like wallpaper'}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLike(wallpaper.url);
                    }}
                  >
                    <Heart size={14} strokeWidth={2.5} className={liked ? 'fill-current' : ''} aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="settings-wee-wallpaper-fab settings-wee-wallpaper-fab--br settings-wee-wallpaper-fab--danger"
                    title="Remove from library"
                    aria-label="Remove saved wallpaper"
                    disabled={deleting[wallpaper.url]}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(wallpaper.url);
                    }}
                  >
                    {deleting[wallpaper.url] ? (
                      <Loader2 size={14} className="animate-spin" aria-hidden />
                    ) : (
                      <Trash2 size={14} strokeWidth={2.25} aria-hidden />
                    )}
                  </button>
                </div>
                <span className="settings-wee-wallpaper-picker-tile__title" title={wallpaper.name}>
                  {wallpaper.name}
                </span>
              </div>
            );
          })}
        </div>
      </WeeModalFieldCard>
    </SettingsWeeSection>
  );
}

export default WallpaperLibrarySection;
