/**
 * Trim a library or staged sound — Save over (user clips), Save as new, or Save to library (staged).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  estimateWavBytes,
  extractWaveformPeaks,
  formatBytesMb,
  maxBytesForSoundType,
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

async function clearSoundStaging() {
  try {
    await window.api?.sounds?.clearStaging?.();
  } catch {
    /* ignore */
  }
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
  const [wavMeta, setWavMeta] = useState({ sampleRate: 44100, channels: 2 });
  const [peaks, setPeaks] = useState([]);
  const [dragHandle, setDragHandle] = useState(null);
  const waveRef = useRef(null);

  const isStaged = Boolean(sound?.staged || sound?.mustTrimReason === 'size');
  const mustTrimForSize = Boolean(sound?.mustTrimReason === 'size' || sound?.staged);
  const canReplace = Boolean(sound?.id && !sound?.isDefault && !isStaged);
  const maxBytes = maxBytesForSoundType(soundType);
  const isHoverFamily = soundType === 'channelHover' || soundType === 'channelClick';

  useEffect(() => {
    if (!isOpen || !sound?.url) return undefined;
    let cancelled = false;
    setLoading(true);
    setError('');
    setPreviewing(false);
    setPeaks([]);
    setNewName(`${sound.name || 'Sound'}${isStaged ? '' : ' (trim)'}`.slice(0, 50));
    (async () => {
      try {
        const d = await probeAudioDuration(sound.url);
        if (cancelled) return;
        let dur = d > 0 ? d : 0;
        setStartSec(0);

        try {
          const decoded = await decodeAudioUrl(sound.url);
          if (cancelled) return;
          if (!(dur > 0) && decoded?.duration > 0) {
            dur = decoded.duration;
          }
          setWavMeta({
            sampleRate: decoded.sampleRate || 44100,
            channels: decoded.numberOfChannels || 2,
          });
          setPeaks(extractWaveformPeaks(decoded, 192));
        } catch {
          if (!cancelled) {
            setWavMeta({ sampleRate: 44100, channels: 2 });
            setPeaks([]);
          }
        }

        if (cancelled) return;
        setDuration(dur);
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
  }, [isOpen, sound?.url, sound?.name, sound?.id, isStaged]);

  useEffect(() => {
    if (!isOpen) stopPreview();
  }, [isOpen]);

  const selectionLen = Math.max(0, endSec - startSec);
  const durationCheck = useMemo(
    () => validateSoundDuration(soundType, selectionLen),
    [soundType, selectionLen]
  );

  const estimatedBytes = useMemo(
    () => estimateWavBytes(selectionLen, wavMeta.sampleRate, wavMeta.channels),
    [selectionLen, wavMeta.sampleRate, wavMeta.channels]
  );
  const sizeOk = !mustTrimForSize || estimatedBytes <= maxBytes;
  const canSave = durationCheck.ok && sizeOk && !loading && selectionLen > 0;

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

  const secFromClientX = useCallback(
    (clientX) => {
      const el = waveRef.current;
      if (!el || !(duration > 0)) return 0;
      const rect = el.getBoundingClientRect();
      const t = Math.max(0, Math.min(1, (clientX - rect.left) / Math.max(1, rect.width)));
      return t * duration;
    },
    [duration]
  );

  useEffect(() => {
    if (!dragHandle) return undefined;
    const onMove = (e) => {
      const sec = secFromClientX(e.clientX);
      if (dragHandle === 'start') clampStart(sec);
      else clampEnd(sec);
    };
    const onUp = () => setDragHandle(null);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragHandle, secFromClientX, clampStart, clampEnd]);

  const handleWavePointerDown = useCallback(
    (e) => {
      if (!(duration > 0)) return;
      const sec = secFromClientX(e.clientX);
      const distStart = Math.abs(sec - startSec);
      const distEnd = Math.abs(sec - endSec);
      const handle = distStart <= distEnd ? 'start' : 'end';
      setDragHandle(handle);
      if (handle === 'start') clampStart(sec);
      else clampEnd(sec);
      e.currentTarget.setPointerCapture?.(e.pointerId);
    },
    [duration, secFromClientX, startSec, endSec, clampStart, clampEnd]
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

  const handleClose = useCallback(() => {
    stopPreview();
    if (isStaged) void clearSoundStaging();
    onClose?.();
  }, [isStaged, onClose]);

  const saveTrimmed = useCallback(
    async (mode) => {
      if (!sound?.url) return;
      if (!durationCheck.ok) {
        setError(durationCheck.error || 'Selection is too long');
        return;
      }
      if (mustTrimForSize && !sizeOk) {
        setError(`Selection is still too large (~${formatBytesMb(estimatedBytes)}). Shorten it under ${formatBytesMb(maxBytes)}.`);
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
        if (wav.byteLength > maxBytes) {
          throw new Error(
            `Trimmed file is too large (${formatBytesMb(wav.byteLength)}). Shorten the selection under ${formatBytesMb(maxBytes)}.`
          );
        }
        const wavBase64 = arrayBufferToBase64(wav);
        if (!window.api?.sounds?.saveTrimmed) {
          throw new Error('Trim save API is unavailable');
        }
        const saveMode = isStaged ? 'new' : mode;
        const result = await window.api.sounds.saveTrimmed({
          soundType,
          soundId: isStaged ? undefined : sound.id,
          mode: saveMode,
          name: saveMode === 'new' ? newName : sound.name,
          wavBase64,
        });
        if (!result?.success) {
          throw new Error(result?.error || 'Failed to save trimmed sound');
        }
        if (isStaged) await clearSoundStaging();
        onSaved?.(result.sound, saveMode);
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
      isStaged,
      mustTrimForSize,
      sizeOk,
      estimatedBytes,
      maxBytes,
    ]
  );

  const startPct = duration > 0 ? (startSec / duration) * 100 : 0;
  const endPct = duration > 0 ? (endSec / duration) * 100 : 100;
  const selPct = Math.max(0, endPct - startPct);

  return (
    <WeeModalShell
      isOpen={isOpen}
      onClose={handleClose}
      headerTitle="Trim sound"
      showRail={false}
      maxWidth="48rem"
      footerContent={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <WeeButton type="button" variant="secondary" onClick={handleClose} disabled={saving}>
            Cancel
          </WeeButton>
          {isStaged ? (
            <WeeButton
              type="button"
              variant="primary"
              onClick={() => saveTrimmed('new')}
              disabled={saving || !canSave}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              Save to library
            </WeeButton>
          ) : (
            <>
              <WeeButton
                type="button"
                variant="secondary"
                onClick={() => saveTrimmed('new')}
                disabled={saving || !canSave}
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                Save as new
              </WeeButton>
              <WeeButton
                type="button"
                variant="primary"
                onClick={() => saveTrimmed('replace')}
                disabled={saving || !canReplace || !canSave}
                title={canReplace ? 'Overwrite this library sound' : 'Default sounds cannot be overwritten'}
              >
                Save over
              </WeeButton>
            </>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-4 p-1">
        {mustTrimForSize ? (
          <div className="rounded-2xl border border-[hsl(var(--state-warning)/0.4)] bg-[hsl(var(--state-warning)/0.1)] px-4 py-3">
            <Text variant="p" className="!m-0 !font-semibold">
              File is over {formatBytesMb(maxBytes)}
            </Text>
            <Text variant="help" className="!mb-0 !mt-1">
              Shorten the selection to shrink the saved WAV under the limit. Estimated output:{' '}
              <span className="font-bold tabular-nums">{formatBytesMb(estimatedBytes)}</span>
              {!sizeOk ? ` — still over ${formatBytesMb(maxBytes)}` : ' — ready to save'}.
            </Text>
          </div>
        ) : (
          <Text variant="desc" className="!m-0">
            Drag the handles on the waveform to choose the start and end of{' '}
            <span className="font-bold">{sound?.name || 'this sound'}</span>.
            {isHoverFamily ? ' Hover sounds feel best under a few seconds.' : ''}
          </Text>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-[hsl(var(--text-secondary))]">
            <Loader2 size={16} className="animate-spin" />
            Loading waveform…
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-[hsl(var(--border-primary)/0.35)] bg-[hsl(var(--surface-secondary)/0.45)] px-4 py-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <Text variant="small" className="!m-0 font-black uppercase tracking-[0.1em] text-[hsl(var(--text-secondary))]">
                  Selection {formatTime(selectionLen)}
                </Text>
                <Text variant="caption" className="!m-0 text-[hsl(var(--text-tertiary))]">
                  Full length {formatTime(duration)}
                </Text>
              </div>

              <div
                ref={waveRef}
                role="slider"
                aria-label="Trim selection waveform"
                aria-valuemin={0}
                aria-valuemax={duration || 0}
                aria-valuenow={startSec}
                tabIndex={0}
                onPointerDown={handleWavePointerDown}
                className="relative mb-4 h-24 cursor-ew-resize touch-none select-none overflow-hidden rounded-xl border border-[hsl(var(--border-primary)/0.35)] bg-[hsl(var(--surface-tertiary)/0.65)]"
              >
                <div className="absolute inset-0 flex items-end justify-between gap-px px-1 py-2">
                  {(peaks.length > 0 ? peaks : Array.from({ length: 48 }, () => 0.2)).map((p, i) => (
                    <div
                      key={`peak-${i}`}
                      className="min-w-[2px] flex-1 rounded-sm bg-[hsl(var(--primary)/0.45)]"
                      style={{ height: `${Math.round(p * 100)}%` }}
                    />
                  ))}
                </div>
                <div
                  className="pointer-events-none absolute inset-y-0 bg-[hsl(var(--primary)/0.22)]"
                  style={{ left: `${startPct}%`, width: `${selPct}%` }}
                />
                <button
                  type="button"
                  aria-label="Selection start"
                  className="absolute top-0 z-[1] h-full w-3 -translate-x-1/2 cursor-ew-resize border-0 bg-transparent p-0"
                  style={{ left: `${startPct}%` }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setDragHandle('start');
                  }}
                >
                  <span className="mx-auto block h-full w-1 rounded-full bg-[hsl(var(--primary))] shadow-[var(--shadow-sm)]" />
                </button>
                <button
                  type="button"
                  aria-label="Selection end"
                  className="absolute top-0 z-[1] h-full w-3 -translate-x-1/2 cursor-ew-resize border-0 bg-transparent p-0"
                  style={{ left: `${endPct}%` }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setDragHandle('end');
                  }}
                >
                  <span className="mx-auto block h-full w-1 rounded-full bg-[hsl(var(--primary))] shadow-[var(--shadow-sm)]" />
                </button>
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
              label={isStaged ? 'Library name' : 'Name for Save as new'}
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
            {!sizeOk ? (
              <Text variant="help" className="!m-0 text-[hsl(var(--state-error))]">
                Shorten the selection until it&apos;s under {formatBytesMb(maxBytes)}.
              </Text>
            ) : null}
            {!canReplace && !isStaged ? (
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
    staged: PropTypes.bool,
    mustTrimReason: PropTypes.string,
    size: PropTypes.number,
  }),
  soundType: PropTypes.string,
  onSaved: PropTypes.func,
};

export default SoundTrimDialog;
