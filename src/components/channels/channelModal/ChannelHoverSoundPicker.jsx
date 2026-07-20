import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { AnimatePresence, LayoutGroup, m, useReducedMotion } from 'framer-motion';
import { Check, Loader2, Pause, Play, Scissors, Trash2, Upload, Volume2 } from 'lucide-react';
import Slider from '../../../ui/Slider';
import Text from '../../../ui/Text';
import {
  WeeButton,
  WeeHelpLinkButton,
  WeePressSurface,
  WeeSliderValue,
} from '../../../ui/wee';
import { createWeeTransition } from '../../../design/weeMotion';
import { openSettingsToTab, SETTINGS_TAB_ID } from '../../../utils/settingsNavigation';

/**
 * Sound Deck — Now Playing strip + playlist library for per-channel hover override.
 */
function ChannelHoverSoundPicker({
  hoverSoundUrl,
  hoverSoundName,
  hoverSoundVolume,
  hoverSoundPreviewPlaying,
  previewingSoundId,
  selectedHoverSoundId,
  uploadingHoverSound,
  deletingHoverSoundId,
  soundLibraryLoading,
  channelHoverSounds,
  globalHoverEnabled,
  clearHoverSoundSelection,
  handleTestHoverSound,
  handleTestLibraryHoverSound,
  handleHoverSoundVolumeChange,
  handleHoverSoundSelect,
  handleHoverSoundUpload,
  handleHoverSoundDelete,
  openTrimForSelected,
  openTrimForSound,
  hoverSoundHint,
  hoverSoundError,
}) {
  const reduceMotion = useReducedMotion();
  const listTransition = createWeeTransition('tab', { reducedMotion: !!reduceMotion });
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const hasApplied = Boolean(hoverSoundUrl);
  const nowPlayingPreview =
    hoverSoundPreviewPlaying &&
    (!previewingSoundId || previewingSoundId === selectedHoverSoundId);

  return (
    <div className="flex flex-col gap-4">
      {!globalHoverEnabled ? (
        <div className="rounded-2xl border border-[hsl(var(--state-warning)/0.35)] bg-[hsl(var(--state-warning)/0.08)] px-4 py-3">
          <Text variant="p" className="!m-0 !font-semibold">
            Hover sounds are muted globally
          </Text>
          <Text variant="help" className="!mb-2 !mt-1">
            This override stays saved, but won&apos;t play until hover SFX are enabled in Sounds.
          </Text>
          <WeeHelpLinkButton onClick={() => openSettingsToTab(SETTINGS_TAB_ID.SOUNDS)}>
            Open Sounds settings
          </WeeHelpLinkButton>
        </div>
      ) : null}

      <AnimatePresence mode="wait" initial={false}>
        {hasApplied ? (
          <m.div
            key="now-playing"
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={listTransition}
            className="relative overflow-hidden rounded-2xl border border-[hsl(var(--primary)/0.35)] bg-[hsl(var(--primary)/0.08)] p-4 shadow-[var(--shadow-sm)]"
          >
            <div className="flex flex-wrap items-start gap-3">
              <m.div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[hsl(var(--primary))] text-[hsl(var(--text-on-accent))] shadow-[var(--shadow-sm)]"
                animate={
                  nowPlayingPreview && !reduceMotion
                    ? { scale: [1, 1.06, 1] }
                    : { scale: 1 }
                }
                transition={
                  nowPlayingPreview && !reduceMotion
                    ? { duration: 1.1, repeat: Infinity, ease: 'easeInOut' }
                    : { duration: 0.2 }
                }
                aria-hidden
              >
                <Volume2 size={20} strokeWidth={2.4} />
              </m.div>

              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <Text variant="small" className="!m-0 font-black uppercase tracking-[0.12em] text-[hsl(var(--text-secondary))]">
                    Now playing
                  </Text>
                  <span className="rounded-full bg-[hsl(var(--primary)/0.18)] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.1em] text-[hsl(var(--primary))]">
                    Overrides global
                  </span>
                </div>
                <p className="truncate font-bold text-[hsl(var(--text-primary))]">
                  {hoverSoundName || 'Custom hover'}
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <WeeButton
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleTestHoverSound}
                  disabled={!hoverSoundUrl}
                  className="!inline-flex !items-center !gap-1.5"
                  title={nowPlayingPreview ? 'Stop preview' : 'Preview applied sound'}
                >
                  {nowPlayingPreview ? (
                    <Pause size={14} strokeWidth={2.5} aria-hidden />
                  ) : (
                    <Play size={14} strokeWidth={2.5} aria-hidden />
                  )}
                  {nowPlayingPreview ? 'Stop' : 'Preview'}
                </WeeButton>
                <WeeButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={openTrimForSelected}
                  className="!inline-flex !items-center !gap-1.5"
                  title="Trim this sound"
                  disabled={!hoverSoundUrl}
                >
                  <Scissors size={14} strokeWidth={2.4} aria-hidden />
                  Trim
                </WeeButton>
                <WeeButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={clearHoverSoundSelection}
                  title="Clear this tile’s override and use the global hover sound"
                >
                  Use global
                </WeeButton>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-1.5">
              <div className="flex items-center gap-3">
                <label
                  className="shrink-0 text-[12px] font-semibold text-[hsl(var(--text-secondary))]"
                  htmlFor="channel-hover-sound-volume"
                >
                  This channel&apos;s volume
                </label>
                <div className="min-w-0 flex-1">
                  <Slider
                    id="channel-hover-sound-volume"
                    aria-label="This channel hover sound volume"
                    value={hoverSoundVolume}
                    onChange={handleHoverSoundVolumeChange}
                    min={0}
                    max={1}
                    step={0.01}
                    containerClassName="!mb-0"
                    hideValue
                  />
                </div>
                <WeeSliderValue
                  value={hoverSoundVolume}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={handleHoverSoundVolumeChange}
                  format={(v) => String(Math.round(v * 100))}
                  suffix="%"
                  aria-label="This channel hover sound volume value"
                />
              </div>
              <Text variant="help" className="!m-0">
                Independent of Sounds → global hover volume. Only this tile uses this level.
              </Text>
            </div>
          </m.div>
        ) : (
          <m.div
            key="no-override"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={listTransition}
            className="rounded-2xl border border-dashed border-[hsl(var(--border-primary)/0.45)] bg-[hsl(var(--surface-secondary)/0.4)] px-4 py-3"
          >
            <Text variant="help" className="!m-0">
              No override yet — pick a library sound below to replace the global hover track for this
              tile. You&apos;ll set a volume for this channel only (not the global hover slider).
            </Text>
          </m.div>
        )}
      </AnimatePresence>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <Text variant="small" className="!m-0 font-black uppercase tracking-[0.12em] text-[hsl(var(--text-secondary))]">
            Library
          </Text>
          <WeeButton
            type="button"
            variant="primary"
            size="sm"
            onClick={handleHoverSoundUpload}
            disabled={uploadingHoverSound}
            className="!inline-flex !items-center !gap-1.5"
          >
            {uploadingHoverSound ? (
              <Loader2 size={14} className="animate-spin" aria-hidden />
            ) : (
              <Upload size={14} strokeWidth={2.4} aria-hidden />
            )}
            {uploadingHoverSound ? 'Uploading…' : 'Upload'}
          </WeeButton>
        </div>

        {soundLibraryLoading ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-[hsl(var(--border-primary)/0.35)] px-4 py-8 text-[hsl(var(--text-tertiary))]">
            <Loader2 size={16} className="animate-spin" aria-hidden />
            <Text variant="help" className="!m-0">
              Loading sound library…
            </Text>
          </div>
        ) : channelHoverSounds.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[hsl(var(--border-primary)/0.45)] px-4 py-8 text-center">
            <Text variant="help" className="!m-0">
              No hover sounds yet. Upload one to start building your library — uploads are shared
              across channels.
            </Text>
          </div>
        ) : (
          <LayoutGroup id="channel-hover-sound-library">
            <ul className="m-0 flex max-h-56 list-none flex-col gap-1.5 overflow-y-auto p-0 pr-0.5">
              {channelHoverSounds.map((sound, index) => {
                const selected = selectedHoverSoundId === sound.id;
                const previewing = hoverSoundPreviewPlaying && previewingSoundId === sound.id;
                const deleting = deletingHoverSoundId === sound.id;
                const pendingDelete = pendingDeleteId === sound.id;

                return (
                  <m.li
                    key={sound.id}
                    initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      ...listTransition,
                      delay: reduceMotion ? 0 : Math.min(index * 0.03, 0.18),
                    }}
                  >
                    <WeePressSurface
                      as="div"
                      variant="listRow"
                      enableHover={!pendingDelete}
                      onClick={() => {
                        if (!pendingDelete) handleHoverSoundSelect(sound.id);
                      }}
                      className={`relative flex cursor-pointer items-center gap-2 rounded-xl border px-2.5 py-2 transition-colors ${
                        selected
                          ? 'border-[hsl(var(--primary)/0.55)] bg-[hsl(var(--primary)/0.12)] shadow-[var(--shadow-soft-hover),var(--shadow-hover-glow)]'
                          : 'border-[hsl(var(--border-primary)/0.35)] bg-[hsl(var(--surface-secondary)/0.55)] hover:border-[hsl(var(--border-primary)/0.55)] hover:bg-[hsl(var(--surface-secondary)/0.85)]'
                      }`}
                    >
                      {selected ? (
                        <m.span
                          layoutId="channelHoverSoundSelected"
                          className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-[hsl(var(--primary)/0.4)]"
                          transition={createWeeTransition('press', { reducedMotion: !!reduceMotion })}
                          aria-hidden
                        />
                      ) : null}

                      <button
                        type="button"
                        className={`relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors ${
                          previewing
                            ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--text-on-accent))]'
                            : 'border-[hsl(var(--border-primary)/0.5)] bg-[hsl(var(--surface-elevated)/0.9)] text-[hsl(var(--text-primary))]'
                        }`}
                        title={previewing ? 'Stop preview' : `Preview ${sound.name}`}
                        aria-label={previewing ? `Stop preview of ${sound.name}` : `Preview ${sound.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTestLibraryHoverSound?.(sound);
                        }}
                      >
                        {previewing ? (
                          <Pause size={14} strokeWidth={2.5} aria-hidden />
                        ) : (
                          <Play size={14} strokeWidth={2.5} className="ml-0.5" aria-hidden />
                        )}
                      </button>

                      <div className="relative z-[1] min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-[hsl(var(--text-primary))]">
                          {sound.name}
                        </p>
                        {selected ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[hsl(var(--primary))]">
                            <Check size={10} strokeWidth={3} aria-hidden />
                            Applied
                          </span>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        className="relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[hsl(var(--text-tertiary))] transition-colors hover:bg-[hsl(var(--primary)/0.12)] hover:text-[hsl(var(--primary))]"
                        title={`Trim ${sound.name}`}
                        aria-label={`Trim ${sound.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          openTrimForSound?.(sound);
                        }}
                      >
                        <Scissors size={14} strokeWidth={2.25} aria-hidden />
                      </button>

                      <AnimatePresence mode="wait" initial={false}>
                        {pendingDelete ? (
                          <m.div
                            key="confirm"
                            initial={reduceMotion ? false : { opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 6 }}
                            transition={listTransition}
                            className="relative z-[1] flex shrink-0 items-center gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <WeeButton
                              type="button"
                              variant="danger"
                              size="sm"
                              disabled={deleting}
                              onClick={() => {
                                handleHoverSoundDelete?.(sound.id);
                                setPendingDeleteId(null);
                              }}
                            >
                              {deleting ? '…' : 'Delete'}
                            </WeeButton>
                            <WeeButton
                              type="button"
                              variant="secondary"
                              size="sm"
                              disabled={deleting}
                              onClick={() => setPendingDeleteId(null)}
                            >
                              Cancel
                            </WeeButton>
                          </m.div>
                        ) : (
                          <m.button
                            key="trash"
                            type="button"
                            initial={reduceMotion ? false : { opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[hsl(var(--text-tertiary))] transition-colors hover:bg-[hsl(var(--state-error)/0.12)] hover:text-[hsl(var(--state-error))]"
                            title={`Remove ${sound.name} from library`}
                            aria-label={`Delete ${sound.name}`}
                            disabled={deleting}
                            onClick={(e) => {
                              e.stopPropagation();
                              setPendingDeleteId(sound.id);
                            }}
                          >
                            {deleting ? (
                              <Loader2 size={14} className="animate-spin" aria-hidden />
                            ) : (
                              <Trash2 size={14} strokeWidth={2.25} aria-hidden />
                            )}
                          </m.button>
                        )}
                      </AnimatePresence>
                    </WeePressSurface>
                  </m.li>
                );
              })}
            </ul>
          </LayoutGroup>
        )}
      </div>

      {hoverSoundError ? (
        <Text variant="help" className="!m-0 text-[hsl(var(--state-error))]">
          {hoverSoundError}
        </Text>
      ) : null}
      {hoverSoundHint ? (
        <Text variant="help" className="!m-0 text-[hsl(var(--state-warning))]">
          {hoverSoundHint}
        </Text>
      ) : null}

      <Text variant="help" className="!m-0">
        Applied sounds override the global hover track for this tile only, with their own volume.
        Still needs Sounds → Enable hover sounds. Uploads are shared across channels (max 5MB for
        hover clips). Use Trim for longer songs — previews stop after a few seconds.
      </Text>
    </div>
  );
}

ChannelHoverSoundPicker.propTypes = {
  hoverSoundUrl: PropTypes.string,
  hoverSoundName: PropTypes.string,
  hoverSoundVolume: PropTypes.number,
  hoverSoundPreviewPlaying: PropTypes.bool,
  previewingSoundId: PropTypes.string,
  selectedHoverSoundId: PropTypes.string,
  uploadingHoverSound: PropTypes.bool,
  deletingHoverSoundId: PropTypes.string,
  soundLibraryLoading: PropTypes.bool,
  channelHoverSounds: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string,
      url: PropTypes.string,
    })
  ),
  globalHoverEnabled: PropTypes.bool,
  clearHoverSoundSelection: PropTypes.func.isRequired,
  handleTestHoverSound: PropTypes.func.isRequired,
  handleTestLibraryHoverSound: PropTypes.func,
  handleHoverSoundVolumeChange: PropTypes.func.isRequired,
  handleHoverSoundSelect: PropTypes.func.isRequired,
  handleHoverSoundUpload: PropTypes.func.isRequired,
  handleHoverSoundDelete: PropTypes.func,
  openTrimForSelected: PropTypes.func,
  openTrimForSound: PropTypes.func,
  hoverSoundHint: PropTypes.string,
  hoverSoundError: PropTypes.string,
};

ChannelHoverSoundPicker.defaultProps = {
  hoverSoundUrl: '',
  hoverSoundName: '',
  hoverSoundVolume: 0.5,
  hoverSoundPreviewPlaying: false,
  previewingSoundId: null,
  selectedHoverSoundId: null,
  uploadingHoverSound: false,
  deletingHoverSoundId: null,
  soundLibraryLoading: false,
  channelHoverSounds: [],
  globalHoverEnabled: true,
  handleTestLibraryHoverSound: undefined,
  handleHoverSoundDelete: undefined,
  openTrimForSelected: undefined,
  openTrimForSound: undefined,
  hoverSoundHint: '',
  hoverSoundError: '',
};

export default React.memo(ChannelHoverSoundPicker);
