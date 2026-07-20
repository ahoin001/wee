/**
 * Trim a library sound — Save over (user clips) or Save as new.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Loader2, Pause, Play } from 'lucide-react';
import { WeeModalShell, WeeButton } from '../../ui/wee';
import Text from '../../ui/Text';
import WInput from '../../ui/WInput';
import Slider from '../../ui/Slider';
import { playPreview, stopPreview } from '../../utils/soundPlayback';
import {
  HOVER_SFX_HARD_MAX_SEC,
  arrayBufferToBase64,
  decodeAudioUrl,
  encodeWav,
  probeAudioDuration,
  sliceAudioBuffer,
  validateSoundDuration,
} from '../../utils/audioTrim';

function formatTime(sec) {
  const s = Math.max(0, Number(sec) || 0);
  const m = Math.floor(s / 60);
  const r = (s % 60).toFixed(1);
  return `${m}:${r.padStart(4, '0')}`;
}

function SoundTrimDialog({
  isOpen,
  onClose,
  sound,
  soundType = 'channelHover',
  onSaved,
}) {
  const [duration, setDuration] = useState(0);
  const [startSec, setStartSec] = useState(0);
  const [endSec, setEndSec] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState('');
  const [newName, setNewName] = useState('');

  const canReplace = Boolean(sound?.id && !sound?.isDefault);

  useEffect(() => {
    if (!isOpen || !sound?.url) return undefined;
    let cancelled = false;
    setLoading(true);
    setError('');
    setPreviewing(false);
    setNewName(`${sound.name || 'Sound'} (trim)`.slice(0, 50));
    (async () => {
      try {
        const d = await probeAudioDuration(sound.url);
        if (cancelled) return;
        const dur = d > 0 ? d : 0;
        setDuration(dur);
        setStartSec(0);
        const defaultEnd = Math.min(dur || HOVER_SFX_HARD_MAX_SEC, HOVER_SFX_HARD_MAX_SEC, 4);
        setEndSec(dur > 0 ? Math.min(dur, Math.max(0.25, defaultEnd)) : 1);
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load audio');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      stopPreview();
    };
  }, [isOpen, sound?.url, sound?.name, sound?.id]);

  useEffect(() => {
    if (!isOpen) stopPreview();
  }, [isOpen]);

  const selectionLen = Math.max(0, endSec - startSec);
  const durationCheck = useMemo(
    () => validateSoundDuration(soundType, selectionLen),
    [soundType, selectionLen]
  );

  const clampStart = useCallback(
    (value) => {
      const v = Math.max(0, Math.min(Number(value) || 0, Math.max(0, endSec - 0.05)));
      setStartSec(v);
    },
    [endSec]
  );

  const clampEnd = useCallback(
    (value) => {
      const v = Math.min(duration || value, Math.max((Number(startSec) || 0) + 0.05, Number(value) || 0));
      setEndSec(v);
    },
    [duration, startSec]
  );

  const handlePreviewSelection = useCallback(async () => {
    if (!sound?.url || previewing) {
      stopPreview();
      setPreviewing(false);
      return;
    }
    setPreviewing(true);
    try {
      await playPreview(sound.url, 0.7, {
        startSec,
        endSec,
        onEnded: () => setPreviewing(false),
      });
    } catch (e) {
      setPreviewing(false);
      setError(e?.message || 'Preview failed');
    }
  }, [sound?.url, previewing, startSec, endSec]);

  const saveTrimmed = useCallback(
    async (mode) => {
      if (!sound?.url) return;
      if (!durationCheck.ok) {
        setError(durationCheck.error || 'Selection is too long');
        return;
      }
      setSaving(true);
      setError('');
      stopPreview();
      setPreviewing(false);
      try {
        const decoded = await decodeAudioUrl(sound.url);
        const sliced = sliceAudioBuffer(decoded, startSec, endSec);
        const wav = encodeWav(sliced);
        const wavBase64 = arrayBufferToBase64(wav);
        if (!window.api?.sounds?.saveTrimmed) {
          throw new Error('Trim save API is unavailable');
        }
        const result = await window.api.sounds.saveTrimmed({
          soundType,
          soundId: sound.id,
          mode,
          name: mode === 'new' ? newName : sound.name,
          wavBase64,
        });
        if (!result?.success) {
          throw new Error(result?.error || 'Failed to save trimmed sound');
        }
        onSaved?.(result.sound, mode);
        onClose?.();
      } catch (e) {
        setError(e?.message || 'Failed to save trimmed sound');
      } finally {
        setSaving(false);
      }
    },
    [
      sound,
      soundType,
      startSec,
      endSec,
      durationCheck,
      newName,
      onSaved,
      onClose,
    ]
  );

  return (
    <WeeModalShell
      isOpen={isOpen}
      onClose={onClose}
      headerTitle="Trim sound"
      showRail={false}
      maxWidth="32rem"
      footerContent={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <WeeButton type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </WeeButton>
          <WeeButton
            type="button"
            variant="secondary"
            onClick={() => saveTrimmed('new')}
            disabled={loading || saving || !durationCheck.ok}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            Save as new
          </WeeButton>
          <WeeButton
            type="button"
            variant="primary"
            onClick={() => saveTrimmed('replace')}
            disabled={loading || saving || !canReplace || !durationCheck.ok}
            title={canReplace ? 'Overwrite this library sound' : 'Default sounds cannot be overwritten'}
          >
            Save over
          </WeeButton>
        </div>
      }
    >
      <div className="flex flex-col gap-4 p-1">
        <Text variant="desc" className="!m-0">
          Choose the start and end of <span className="font-bold">{sound?.name || 'this sound'}</span>.
          Hover sounds feel best under a few seconds.
        </Text>

        {loading ? (
          <div className="flex items-center gap-2 text-[hsl(var(--text-secondary))]">
            <Loader2 size={16} className="animate-spin" />
            Loading waveform…
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-[hsl(var(--border-primary)/0.35)] bg-[hsl(var(--surface-secondary)/0.45)] px-4 py-3">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <Text variant="small" className="!m-0 font-black uppercase tracking-[0.1em] text-[hsl(var(--text-secondary))]">
                  Selection {formatTime(selectionLen)}
                </Text>
                <Text variant="caption" className="!m-0 text-[hsl(var(--text-tertiary))]">
                  Full length {formatTime(duration)}
                </Text>
              </div>

              <div className="mb-4 h-2 overflow-hidden rounded-full bg-[hsl(var(--surface-tertiary))]">
                <div
                  className="h-full rounded-full bg-[hsl(var(--primary)/0.75)]"
                  style={{
                    marginLeft: duration > 0 ? `${(startSec / duration) * 100}%` : 0,
                    width: duration > 0 ? `${(selectionLen / duration) * 100}%` : '100%',
                  }}
                />
              </div>

              <div className="flex flex-col gap-3">
                <div className="settings-wee-slider-row">
                  <label className="settings-wee-slider-row__label" htmlFor="sound-trim-start">
                    Start
                  </label>
                  <div className="min-w-0 flex-1">
                    <Slider
                      id="sound-trim-start"
                      min={0}
                      max={Math.max(0.05, duration || 1)}
                      step={0.05}
                      value={startSec}
                      onChange={clampStart}
                      containerClassName="!mb-0"
                      hideValue
                    />
                  </div>
                  <span className="w-14 shrink-0 text-right text-xs font-bold tabular-nums text-[hsl(var(--text-secondary))]">
                    {formatTime(startSec)}
                  </span>
                </div>
                <div className="settings-wee-slider-row">
                  <label className="settings-wee-slider-row__label" htmlFor="sound-trim-end">
                    End
                  </label>
                  <div className="min-w-0 flex-1">
                    <Slider
                      id="sound-trim-end"
                      min={0}
                      max={Math.max(0.05, duration || 1)}
                      step={0.05}
                      value={endSec}
                      onChange={clampEnd}
                      containerClassName="!mb-0"
                      hideValue
                    />
                  </div>
                  <span className="w-14 shrink-0 text-right text-xs font-bold tabular-nums text-[hsl(var(--text-secondary))]">
                    {formatTime(endSec)}
                  </span>
                </div>
              </div>

              <div className="mt-3">
                <WeeButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="!inline-flex !items-center !gap-1.5"
                  onClick={handlePreviewSelection}
                  disabled={loading || selectionLen <= 0}
                >
                  {previewing ? <Pause size={14} /> : <Play size={14} />}
                  {previewing ? 'Stop' : 'Preview selection'}
                </WeeButton>
              </div>
            </div>

            <WInput
              variant="wee"
              label="Name for Save as new"
              value={newName}
              onChange={(e) => setNewName(e.target.value.slice(0, 50))}
            />

            {durationCheck.warn ? (
              <Text variant="help" className="!m-0 text-[hsl(var(--state-warning))]">
                {durationCheck.warn}
              </Text>
            ) : null}
            {durationCheck.error ? (
              <Text variant="help" className="!m-0 text-[hsl(var(--state-error))]">
                {durationCheck.error}
              </Text>
            ) : null}
            {!canReplace ? (
              <Text variant="help" className="!m-0">
                This is a built-in sound — use Save as new to keep a trimmed copy.
              </Text>
            ) : null}
          </>
        )}

        {error ? (
          <Text variant="help" className="!m-0 text-[hsl(var(--state-error))]">
            {error}
          </Text>
        ) : null}
      </div>
    </WeeModalShell>
  );
}

SoundTrimDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  sound: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    url: PropTypes.string,
    isDefault: PropTypes.bool,
  }),
  soundType: PropTypes.string,
  onSaved: PropTypes.func,
};

export default SoundTrimDialog;
