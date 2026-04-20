import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import { Film, Maximize2, PlayCircle, Shield, Volume2 } from 'lucide-react';
import Slider from '../../../ui/Slider';
import Text from '../../../ui/Text';
import WButton from '../../../ui/WButton';
import WToggle from '../../../ui/WToggle';
import {
  WeeChoiceTileGrid,
  WeeDescriptionToggleRow,
  WeeIconHeadingRow,
  WeeModalFieldCard,
  WeeSectionEyebrow,
  WeeSegmentedControl,
  WeeSettingsCollapsibleSection,
} from '../../../ui/wee';
import AudioManager from '../../../utils/AudioManager';

function ChannelModalBehaviorTab({
  channelId,
  asAdmin,
  setAsAdmin,
  hoverSoundEnabled,
  setHoverSoundEnabled,
  hoverSoundUrl,
  hoverSoundName,
  hoverSoundVolume,
  hoverSoundAudio,
  selectedHoverSoundId,
  uploadingHoverSound,
  hoverSoundInputRef,
  soundLibraryLoading,
  getSoundsByCategory,
  clearHoverSoundSelection,
  handleTestHoverSound,
  handleHoverSoundVolumeChange,
  handleHoverSoundSelect,
  handleHoverSoundUpload,
  handleHoverSoundFile,
  animatedOnHover,
  setAnimatedOnHover,
  kenBurnsEnabled,
  setKenBurnsEnabled,
  kenBurnsMode,
  setKenBurnsMode,
}) {
  const channelHoverSounds = getSoundsByCategory('channelHover') || [];

  const motionGridValue = useMemo(() => {
    if (animatedOnHover === undefined || animatedOnHover === 'global') return 'global';
    if (animatedOnHover === true) return 'hover';
    return 'always';
  }, [animatedOnHover]);

  const handleMotionGridChange = (key) => {
    if (key === 'global') setAnimatedOnHover('global');
    else if (key === 'hover') setAnimatedOnHover(true);
    else setAnimatedOnHover(false);
  };

  const kenBurnsSegValue = useMemo(() => {
    if (kenBurnsEnabled === undefined || kenBurnsEnabled === 'global') return 'global';
    if (kenBurnsEnabled === true) return 'on';
    return 'off';
  }, [kenBurnsEnabled]);

  const handleKenBurnsSeg = (v) => {
    if (v === 'global') setKenBurnsEnabled('global');
    else if (v === 'on') setKenBurnsEnabled(true);
    else setKenBurnsEnabled(false);
  };

  const reduceMotion = useReducedMotion();

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
              {hoverSoundAudio ? 'Stop' : 'Test'}
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
              <div
                key={sound.id}
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
                      AudioManager.playPreview(sound.url, sound.volume ?? 0.5);
                    }}
                    className="channel-min-w-60"
                  >
                    Test
                  </WButton>

                  <div className="channel-row-gap-4 channel-fill">
                    <span className="channel-tiny-label">Vol:</span>
                    <span className="channel-tiny-label">{Math.round((sound.volume ?? 0.5) * 100)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="channel-surface-block channel-surface-subtle">
        <Text variant="p" className="!font-semibold !m-0 !mb-2 !text-[14px]">
          Legacy File Upload
        </Text>
        <div className="channel-row-gap-10">
          <button
            type="button"
            className="file-button"
            id="channel-legacy-upload-button"
            onClick={async () => {
              if (window.api && window.api.sounds && window.api.sounds.selectFile) {
                const result = await window.api.sounds.selectFile();
                if (result && result.success && result.file) {
                  await handleHoverSoundFile(result.file);
                } else if (result && result.error) {
                  alert(`Failed to select sound file: ${result.error}`);
                }
              } else {
                hoverSoundInputRef.current?.click();
              }
            }}
          >
            {hoverSoundName || 'Select Audio File'}
          </button>
          <input
            type="file"
            accept="audio/*"
            ref={hoverSoundInputRef}
            onChange={(e) => handleHoverSoundFile(e.target.files[0])}
            className="hidden"
          />
          <span className="channel-legacy-upload-note">Direct file upload (not saved to library)</span>
        </div>
      </div>

      <Text variant="help" className="channel-help-sm">
        Sound will fade in on hover, and fade out on leave or click. Sounds uploaded to the library are saved permanently
        and can be reused across channels.
      </Text>
    </div>
  );

  const renderKenBurnsModeRadios = () => (
    <div className="channel-stack-8 border-t-2 border-[hsl(var(--border-primary)/0.25)] pt-6">
      <Text as="label" size="sm" weight={600} className="mb-2 block text-[hsl(var(--wee-text-header))]">
        Activation Mode
      </Text>
      <label className="channel-radio-label">
        <input
          type="radio"
          name="kenBurnsMode"
          value="global"
          checked={kenBurnsMode === undefined || kenBurnsMode === 'global'}
          onChange={() => setKenBurnsMode('global')}
        />
        Use global setting
      </label>
      <label className="channel-radio-label">
        <input
          type="radio"
          name="kenBurnsMode"
          value="hover"
          checked={kenBurnsMode === 'hover'}
          onChange={() => setKenBurnsMode('hover')}
        />
        Hover to activate (override)
      </label>
      <label className="channel-radio-label">
        <input
          type="radio"
          name="kenBurnsMode"
          value="autoplay"
          checked={kenBurnsMode === 'autoplay'}
          onChange={() => setKenBurnsMode('autoplay')}
        />
        Always active (override)
      </label>
      <label className="channel-radio-label channel-radio-disabled">
        <input
          type="radio"
          name="kenBurnsMode"
          value="slideshow"
          checked={kenBurnsMode === 'slideshow'}
          onChange={() => setKenBurnsMode('slideshow')}
          disabled
        />
        Slideshow mode (override){' '}
        <span className="text-[11px] text-[hsl(var(--state-error))]">- Not Ready</span>
      </label>
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
                  transition={
                    reduceMotion
                      ? { duration: 0.12 }
                      : { type: 'spring', stiffness: 380, damping: 28, mass: 0.82 }
                  }
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
                  transition={{ duration: reduceMotion ? 0 : 0.15 }}
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

      <section className="space-y-6">
        <WeeSectionEyebrow trackingClassName="tracking-[0.35em]">Animation strategy</WeeSectionEyebrow>
        <WeeModalFieldCard>
          <WeeIconHeadingRow icon={Film} title="Motion architecture" iconClassName="text-[hsl(var(--palette-purple))]" />
          <p className="mb-6 text-[11px] font-bold uppercase leading-relaxed text-[hsl(var(--text-tertiary))]">
            Override the global setting for this channel. Only play GIFs/MP4s when hovered if enabled.
          </p>
          <WeeChoiceTileGrid
            value={motionGridValue}
            onChange={handleMotionGridChange}
            icon={PlayCircle}
            items={[
              { value: 'global', title: 'Global', subtitle: 'Follow app settings' },
              { value: 'hover', title: 'Hover play', subtitle: 'Only when hovered' },
              { value: 'always', title: 'Always play', subtitle: 'GIF/MP4 always on' },
            ]}
          />
        </WeeModalFieldCard>
      </section>

      <section className="space-y-6">
        <WeeSectionEyebrow trackingClassName="tracking-[0.35em]">Post-processing</WeeSectionEyebrow>
        <WeeModalFieldCard>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-6">
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl transition-all ${
                  kenBurnsEnabled === true
                    ? 'bg-[hsl(var(--palette-purple))] text-[hsl(var(--text-on-accent))] shadow-[var(--shadow-md)]'
                    : 'bg-[hsl(var(--surface-secondary))] text-[hsl(var(--text-tertiary))]'
                }`}
              >
                <Maximize2 size={32} strokeWidth={1.6} aria-hidden />
              </div>
              <div>
                <p className="mb-1 font-black uppercase italic leading-none tracking-tighter text-[hsl(var(--wee-text-header))]">
                  Ken Burns movement
                </p>
                <p className="max-w-md text-[10px] font-bold uppercase leading-relaxed text-[hsl(var(--text-tertiary))]">
                  Adds cinematic slow-zoom and pan movement to static channel backgrounds.
                </p>
              </div>
            </div>
            <WeeSegmentedControl
              ariaLabel="Ken Burns mode"
              size="sm"
              value={kenBurnsSegValue}
              onChange={handleKenBurnsSeg}
              options={[
                { value: 'global', label: 'Global' },
                { value: 'on', label: 'On' },
                { value: 'off', label: 'Off' },
              ]}
            />
          </div>

          {kenBurnsEnabled === true && renderKenBurnsModeRadios()}

          <Text variant="help" className="mt-6">
            {kenBurnsEnabled === true
              ? 'Ken Burns adds cinematic zoom and pan effects to images. Perfect for creating dynamic single-image channels.'
              : kenBurnsEnabled === false
                ? 'Ken Burns effect is disabled for this channel, even if enabled globally.'
                : 'This channel will follow the global Ken Burns setting.'}
          </Text>
        </WeeModalFieldCard>
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
  hoverSoundAudio: PropTypes.object,
  selectedHoverSoundId: PropTypes.string,
  uploadingHoverSound: PropTypes.bool,
  hoverSoundInputRef: PropTypes.object,
  soundLibraryLoading: PropTypes.bool,
  getSoundsByCategory: PropTypes.func.isRequired,
  clearHoverSoundSelection: PropTypes.func.isRequired,
  handleTestHoverSound: PropTypes.func.isRequired,
  handleHoverSoundVolumeChange: PropTypes.func.isRequired,
  handleHoverSoundSelect: PropTypes.func.isRequired,
  handleHoverSoundUpload: PropTypes.func.isRequired,
  handleHoverSoundFile: PropTypes.func.isRequired,
  animatedOnHover: PropTypes.oneOf([true, false, 'global', undefined]),
  setAnimatedOnHover: PropTypes.func.isRequired,
  kenBurnsEnabled: PropTypes.oneOf([true, false, 'global', undefined]),
  setKenBurnsEnabled: PropTypes.func.isRequired,
  kenBurnsMode: PropTypes.oneOf(['hover', 'autoplay', 'slideshow', 'global', undefined]),
  setKenBurnsMode: PropTypes.func.isRequired,
};

export default React.memo(ChannelModalBehaviorTab);
