import React from 'react';
import PropTypes from 'prop-types';
import { Shield, Volume2 } from 'lucide-react';
import Text from '../../../ui/Text';
import WToggle from '../../../ui/WToggle';
import {
  WeeDescriptionToggleRow,
  WeeModalFieldCard,
  WeeRevealWhen,
  WeeSectionEyebrow,
  WeeSettingsCollapsibleSection,
} from '../../../ui/wee';
import useConsolidatedAppStore from '../../../utils/useConsolidatedAppStore';
import ChannelHoverSoundPicker from './ChannelHoverSoundPicker';

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
  previewingSoundId,
  selectedHoverSoundId,
  uploadingHoverSound,
  deletingHoverSoundId,
  soundLibraryLoading,
  getSoundsByCategory,
  clearHoverSoundSelection,
  handleTestHoverSound,
  handleTestLibraryHoverSound,
  handleHoverSoundVolumeChange,
  handleHoverSoundSelect,
  handleHoverSoundUpload,
  handleHoverSoundDelete,
}) {
  const channelHoverSounds = getSoundsByCategory('channelHover') || [];
  const globalHoverEnabled = useConsolidatedAppStore(
    (s) => s.sounds?.channelHoverEnabled !== false
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
          description="Override the global hover sound for this tile — expand to preview, pick, or upload."
          defaultOpen={hoverSoundEnabled}
          className="w-full"
        >
          <div className="flex flex-col gap-4">
            <WeeDescriptionToggleRow
              description={
                <div className="space-y-1">
                  <Text variant="small" className="!m-0 text-[hsl(var(--text-primary))]">
                    Enable hover sound
                  </Text>
                  <Text variant="help" className="!m-0">
                    Plays when the cursor enters this channel; fades out on leave.
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

            <WeeRevealWhen when={hoverSoundEnabled} keepMounted={false}>
              <ChannelHoverSoundPicker
                hoverSoundUrl={hoverSoundUrl}
                hoverSoundName={hoverSoundName}
                hoverSoundVolume={hoverSoundVolume}
                hoverSoundPreviewPlaying={hoverSoundPreviewPlaying}
                previewingSoundId={previewingSoundId}
                selectedHoverSoundId={selectedHoverSoundId}
                uploadingHoverSound={uploadingHoverSound}
                deletingHoverSoundId={deletingHoverSoundId}
                soundLibraryLoading={soundLibraryLoading}
                channelHoverSounds={channelHoverSounds}
                globalHoverEnabled={globalHoverEnabled}
                clearHoverSoundSelection={clearHoverSoundSelection}
                handleTestHoverSound={handleTestHoverSound}
                handleTestLibraryHoverSound={handleTestLibraryHoverSound}
                handleHoverSoundVolumeChange={handleHoverSoundVolumeChange}
                handleHoverSoundSelect={handleHoverSoundSelect}
                handleHoverSoundUpload={handleHoverSoundUpload}
                handleHoverSoundDelete={handleHoverSoundDelete}
              />
            </WeeRevealWhen>

            {!hoverSoundEnabled ? (
              <Text variant="help" className="!m-0 border-t border-[hsl(var(--border-primary)/0.25)] pt-4">
                Turn on the toggle above to open the sound deck — preview the library, set one volume,
                and apply an override for this tile.
              </Text>
            ) : null}
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
  previewingSoundId: PropTypes.string,
  selectedHoverSoundId: PropTypes.string,
  uploadingHoverSound: PropTypes.bool,
  deletingHoverSoundId: PropTypes.string,
  soundLibraryLoading: PropTypes.bool,
  getSoundsByCategory: PropTypes.func.isRequired,
  clearHoverSoundSelection: PropTypes.func.isRequired,
  handleTestHoverSound: PropTypes.func.isRequired,
  handleTestLibraryHoverSound: PropTypes.func,
  handleHoverSoundVolumeChange: PropTypes.func.isRequired,
  handleHoverSoundSelect: PropTypes.func.isRequired,
  handleHoverSoundUpload: PropTypes.func.isRequired,
  handleHoverSoundDelete: PropTypes.func,
};

export default React.memo(ChannelModalBehaviorTab);
