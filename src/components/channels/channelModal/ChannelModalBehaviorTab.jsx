import React from 'react';
import PropTypes from 'prop-types';
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import { Shield, Volume2 } from 'lucide-react';
import Slider from '../../../ui/Slider';
import Text from '../../../ui/Text';
import WButton from '../../../ui/WButton';
import WToggle from '../../../ui/WToggle';
import {
  WeeDescriptionToggleRow,
  WeeModalFieldCard,
  WeePressSurface,
  WeeSectionEyebrow,
  WeeSettingsCollapsibleSection,
} from '../../../ui/wee';
import { createWeeTransition } from '../../../design/weeMotion';

/**
 * Per-channel Behavior tab — only tile-specific options:
 * Run as administrator + Custom hover sound.
 * Ken Burns, motion architecture, and launch pause are global (Channels / General).
 */
function ChannelModalBehaviorTab({
  channelId,
  asAdmin,
  setAsAdmin,
  hoverSoundEnabled,
  setHoverSoundEnabled,
  hoverSoundUrl,
  hoverSoundName,
  hoverSoundVolume,
  hoverSoundPreviewPlaying,
  selectedHoverSoundId,
  uploadingHoverSound,
  soundLibraryLoading,
  getSoundsByCategory,
  clearHoverSoundSelection,
  handleTestHoverSound,
  handleTestLibraryHoverSound,
  handleHoverSoundVolumeChange,
  handleHoverSoundSelect,
  handleHoverSoundUpload,
}) {
  const channelHoverSounds = getSoundsByCategory('channelHover') || [];
  const reduceMotion = useReducedMotion();
  const hoverBodyTransition = createWeeTransition('tab', { reducedMotion: !!reduceMotion });

  const renderHoverSoundSection = () => (
    <div className="channel-stack-16">
      {hoverSoundEnabled && hoverSoundUrl && (
        <div className="channel-surface-block">
          <div className="channel-header-row">
            <Text variant="p" className="!font-semibold !m-0">
              Selected Sound: {hoverSoundName}
            </Text>
            <WButton variant="tertiary" size="sm" onClick={clearHoverSoundSelection}>
              Clear
            </WButton>
          </div>

          <div className="channel-row-gap-12">
            <WButton variant="secondary" size="sm" onClick={handleTestHoverSound} disabled={!hoverSoundUrl}>
              {hoverSoundPreviewPlaying ? 'Stop' : 'Test'}
            </WButton>

            <div className="channel-row-gap-8 channel-fill">
              <span className="channel-volume-label">Volume:</span>
              <Slider
                value={hoverSoundVolume}
                onChange={(value) => handleHoverSoundVolumeChange(value)}
                min={0}
                max={1}
                step={0.01}
                className="channel-fill"
              />
              <span className="channel-volume-value">{Math.round(hoverSoundVolume * 100)}%</span>
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="channel-row-gap-12 channel-row-between channel-mb-12">
          <Text variant="p" className="!font-semibold !m-0">
            Choose from Sound Library
          </Text>
          <WButton variant="primary" size="sm" onClick={handleHoverSoundUpload} disabled={uploadingHoverSound}>
            {uploadingHoverSound ? 'Uploading...' : 'Upload New Sound'}
          </WButton>
        </div>

        {soundLibraryLoading ? (
          <div className="channel-surface-block channel-surface-centered channel-surface-p20 channel-text-tertiary">
            Loading sound library...
          </div>
        ) : channelHoverSounds.length === 0 ? (
          <div className="channel-surface-block channel-surface-centered channel-surface-p20 channel-text-tertiary">
            No hover sounds available. Upload your first sound above.
          </div>
        ) : (
          <div className="channel-sound-grid">
            {channelHoverSounds.map((sound) => (
              <WeePressSurface
                key={sound.id}
                as="div"
                onClick={() => handleHoverSoundSelect(sound.id)}
                className={`channel-sound-card ${selectedHoverSoundId === sound.id ? 'channel-sound-card-selected' : ''}`}
              >
                <div className="channel-header-row">
                  <Text variant="p" className="!font-medium !m-0 !text-[14px]">
                    {sound.name}
                  </Text>
                  {selectedHoverSoundId === sound.id && <span className="channel-checkmark">✓</span>}
                </div>

                <div className="channel-row-gap-8">
                  <WButton
                    variant="tertiary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTestLibraryHoverSound?.(sound);
                    }}
                    className="channel-min-w-60"
                  >
                    {hoverSoundPreviewPlaying && selectedHoverSoundId === sound.id ? 'Stop' : 'Test'}
                  </WButton>

                  <div className="channel-row-gap-4 channel-fill">
                    <span className="channel-tiny-label">Vol:</span>
                    <span className="channel-tiny-label">{Math.round((sound.volume ?? 0.5) * 100)}%</span>
                  </div>
                </div>
              </WeePressSurface>
            ))}
          </div>
        )}
      </div>

      <Text variant="help" className="channel-help-sm">
        Sound fades out on leave or click. Library uploads are shared and can be reused across channels.
      </Text>
    </div>
  );

  return (
    <div className="flex max-w-4xl flex-col gap-12 md:gap-16">
      <section className="space-y-6">
        <WeeSectionEyebrow trackingClassName="tracking-[0.35em]">Privileges & audio</WeeSectionEyebrow>

        <WeeModalFieldCard hoverAccent="primary" className="w-full" paddingClassName="p-0">
          <div
            role="button"
            tabIndex={0}
            aria-pressed={asAdmin}
            aria-label="Run as administrator"
            onClick={() => setAsAdmin(!asAdmin)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setAsAdmin(!asAdmin);
              }
            }}
            className="flex w-full cursor-pointer flex-col rounded-[var(--wee-radius-card)] p-8 text-left outline-none transition-[background-color,box-shadow] duration-200 hover:bg-[hsl(var(--state-hover)/0.22)] focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary)/0.45)] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--wee-surface-card))] md:p-10"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 flex-1 items-start gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-[var(--shadow-sm)] transition-colors ${
                    asAdmin
                      ? 'bg-[hsl(var(--primary))] text-[hsl(var(--text-on-accent))]'
                      : 'bg-[hsl(var(--surface-secondary))] text-[hsl(var(--text-tertiary))]'
                  }`}
                >
                  <Shield size={24} strokeWidth={2.35} aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="mb-1 font-black uppercase italic leading-none tracking-tighter text-[hsl(var(--wee-text-header))]">
                    Run as administrator
                  </p>
                  <Text variant="caption" className="!m-0 text-[hsl(var(--text-secondary))]">
                    When on, Wee requests Administrator rights for this channel&apos;s app. Leave off for a standard user
                    launch.
                  </Text>
                </div>
              </div>
              <div
                data-wee-card-toggle-guard
                className="shrink-0 pt-0.5"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <WToggle checked={asAdmin} onChange={setAsAdmin} disableLabelClick />
              </div>
            </div>
          </div>
        </WeeModalFieldCard>

        <WeeSettingsCollapsibleSection
          key={`hover-sound-${channelId}`}
          icon={Volume2}
          title="Custom hover sound"
          description="Play a sound from your library when hovering over this channel — expand to enable and configure."
          defaultOpen={hoverSoundEnabled}
          className="w-full"
        >
          <div className="flex flex-col gap-6">
            <WeeDescriptionToggleRow
              description={
                <div className="space-y-1">
                  <Text variant="small" className="!m-0 text-[hsl(var(--text-primary))]">
                    Enable hover sound
                  </Text>
                  <Text variant="help" className="!m-0">
                    Plays when the cursor enters this channel; fades out on leave. Pick a library sound or upload your own.
                  </Text>
                </div>
              }
              descriptionClassName=""
            >
              <div
                data-wee-card-toggle-guard
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <WToggle checked={hoverSoundEnabled} onChange={setHoverSoundEnabled} disableLabelClick />
              </div>
            </WeeDescriptionToggleRow>

            <AnimatePresence mode="wait" initial={false}>
              {hoverSoundEnabled ? (
                <m.div
                  key="hover-sound-body"
                  initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
                  transition={hoverBodyTransition}
                  className="rounded-[2rem] border border-[hsl(var(--border-primary)/0.35)] bg-[hsl(var(--surface-secondary)/0.65)] p-5 md:p-6"
                >
                  {renderHoverSoundSection()}
                </m.div>
              ) : (
                <m.div
                  key="hover-sound-off"
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={createWeeTransition('tab', { reducedMotion: !!reduceMotion })}
                >
                  <Text variant="help" className="!m-0 border-t border-[hsl(var(--border-primary)/0.25)] pt-5">
                    Turn on the toggle above to choose a sound, adjust volume, and test playback.
                  </Text>
                </m.div>
              )}
            </AnimatePresence>
          </div>
        </WeeSettingsCollapsibleSection>
      </section>
    </div>
  );
}

ChannelModalBehaviorTab.propTypes = {
  channelId: PropTypes.string.isRequired,
  asAdmin: PropTypes.bool,
  setAsAdmin: PropTypes.func.isRequired,
  hoverSoundEnabled: PropTypes.bool,
  setHoverSoundEnabled: PropTypes.func.isRequired,
  hoverSoundUrl: PropTypes.string,
  hoverSoundName: PropTypes.string,
  hoverSoundVolume: PropTypes.number,
  hoverSoundPreviewPlaying: PropTypes.bool,
  selectedHoverSoundId: PropTypes.string,
  uploadingHoverSound: PropTypes.bool,
  soundLibraryLoading: PropTypes.bool,
  getSoundsByCategory: PropTypes.func.isRequired,
  clearHoverSoundSelection: PropTypes.func.isRequired,
  handleTestHoverSound: PropTypes.func.isRequired,
  handleTestLibraryHoverSound: PropTypes.func,
  handleHoverSoundVolumeChange: PropTypes.func.isRequired,
  handleHoverSoundSelect: PropTypes.func.isRequired,
  handleHoverSoundUpload: PropTypes.func.isRequired,
};

export default React.memo(ChannelModalBehaviorTab);
