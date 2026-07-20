/**
 * Client-side audio trim helpers (Web Audio → WAV).
 * Used by the hover-sound trim dialog; no Electron/ffmpeg dependency.
 */

/** Channel hover / click clips — keep uploads short and light. */
export const HOVER_SFX_MAX_BYTES = 5 * 1024 * 1024;
/** Background music may be larger. */
export const BGM_MAX_BYTES = 15 * 1024 * 1024;
/** Hard ceiling for file picker / staging (matches select-sound-file soft gate). */
export const SOUND_STAGING_MAX_BYTES = 15 * 1024 * 1024;
/** Soft guidance: hover clips longer than this should be trimmed. */
export const HOVER_SFX_RECOMMENDED_MAX_SEC = 8;
/** Hard cap for hover / click library entries after trim or upload. */
export const HOVER_SFX_HARD_MAX_SEC = 30;
/** Preview auto-stop so full songs don't play forever in the modal. */
export const SOUND_PREVIEW_MAX_SEC = 12;

/**
 * @param {string} soundType
 * @returns {number}
 */
export function maxBytesForSoundType(soundType) {
  if (soundType === 'channelHover' || soundType === 'channelClick') return HOVER_SFX_MAX_BYTES;
  if (soundType === 'backgroundMusic') return BGM_MAX_BYTES;
  return BGM_MAX_BYTES;
}

/**
 * Estimate 16-bit PCM WAV byte size for a selection (matches encodeWav).
 * @param {number} durationSec
 * @param {number} [sampleRate=44100]
 * @param {number} [channels=2]
 * @returns {number}
 */
export function estimateWavBytes(durationSec, sampleRate = 44100, channels = 2) {
  const sec = Math.max(0, Number(durationSec) || 0);
  const rate = Math.max(1, Number(sampleRate) || 44100);
  const ch = Math.max(1, Math.min(2, Number(channels) || 2));
  const frames = Math.ceil(sec * rate);
  return 44 + frames * ch * 2;
}

/**
 * Format bytes for trim UI copy.
 * @param {number} bytes
 * @returns {string}
 */
export function formatBytesMb(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return '0MB';
  const mb = n / (1024 * 1024);
  return mb >= 10 ? `${Math.round(mb)}MB` : `${mb.toFixed(1)}MB`;
}

/**
 * @param {string} url
 * @returns {Promise<number>} duration seconds (0 if unknown)
 */
export function probeAudioDuration(url) {
  if (!url) return Promise.resolve(0);
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.preload = 'metadata';
    const finish = (value) => {
      audio.removeAttribute('src');
      try {
        audio.load();
      } catch {
        /* ignore */
      }
      resolve(value);
    };
    audio.addEventListener(
      'loadedmetadata',
      () => {
        const d = Number(audio.duration);
        finish(Number.isFinite(d) && d > 0 ? d : 0);
      },
      { once: true }
    );
    audio.addEventListener('error', () => finish(0), { once: true });
    audio.src = url;
  });
}

/**
 * @param {string} url
 * @returns {Promise<AudioBuffer>}
 */
export async function decodeAudioUrl(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load audio (${res.status})`);
  const buffer = await res.arrayBuffer();
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) throw new Error('Web Audio is not available');
  const ctx = new Ctx();
  try {
    return await ctx.decodeAudioData(buffer.slice(0));
  } finally {
    try {
      await ctx.close();
    } catch {
      /* ignore */
    }
  }
}

/**
 * @param {AudioBuffer} audioBuffer
 * @param {number} startSec
 * @param {number} endSec
 * @returns {AudioBuffer}
 */
export function sliceAudioBuffer(audioBuffer, startSec, endSec) {
  const sampleRate = audioBuffer.sampleRate;
  const start = Math.max(0, Math.floor(startSec * sampleRate));
  const end = Math.min(audioBuffer.length, Math.floor(endSec * sampleRate));
  const frameCount = Math.max(1, end - start);
  const sliced = new AudioBuffer({
    length: frameCount,
    numberOfChannels: audioBuffer.numberOfChannels,
    sampleRate,
  });
  for (let ch = 0; ch < audioBuffer.numberOfChannels; ch += 1) {
    const src = audioBuffer.getChannelData(ch).subarray(start, start + frameCount);
    sliced.copyToChannel(src, ch, 0);
  }
  return sliced;
}

/**
 * Encode mono/stereo PCM AudioBuffer to a WAV ArrayBuffer.
 * @param {AudioBuffer} audioBuffer
 * @returns {ArrayBuffer}
 */
export function encodeWav(audioBuffer) {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const bitDepth = 16;
  const samples = audioBuffer.length;
  const blockAlign = (numChannels * bitDepth) / 8;
  const dataSize = samples * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i += 1) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  const channels = [];
  for (let ch = 0; ch < numChannels; ch += 1) {
    channels.push(audioBuffer.getChannelData(ch));
  }

  let offset = 44;
  for (let i = 0; i < samples; i += 1) {
    for (let ch = 0; ch < numChannels; ch += 1) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }
  return buffer;
}

/**
 * Downsample an AudioBuffer into peak magnitudes for a waveform strip (0–1).
 * @param {AudioBuffer} audioBuffer
 * @param {number} [bars=160]
 * @returns {number[]}
 */
export function extractWaveformPeaks(audioBuffer, bars = 160) {
  if (!audioBuffer?.length) return [];
  const count = Math.max(16, Math.min(512, Math.floor(Number(bars) || 160)));
  const channel = audioBuffer.getChannelData(0);
  const block = Math.max(1, Math.floor(channel.length / count));
  const peaks = new Array(count);
  for (let i = 0; i < count; i += 1) {
    const start = i * block;
    const end = Math.min(channel.length, start + block);
    let peak = 0;
    for (let j = start; j < end; j += 1) {
      const v = Math.abs(channel[j]);
      if (v > peak) peak = v;
    }
    peaks[i] = peak;
  }
  let max = 0;
  for (let i = 0; i < peaks.length; i += 1) {
    if (peaks[i] > max) max = peaks[i];
  }
  if (max <= 0) return peaks.map(() => 0.05);
  return peaks.map((p) => Math.max(0.04, p / max));
}

/**
 * @param {ArrayBuffer} arrayBuffer
 * @returns {string} base64
 */
export function arrayBufferToBase64(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const chunk = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/**
 * Soft size gate: hover/click over category max can stage → trim; BGM oversize is hard reject.
 * @param {string} soundType
 * @param {number} [byteSize]
 * @returns {{ ok: boolean, mustTrim: boolean, maxBytes: number, message: string|null }}
 */
export function assessSoundUploadSize(soundType, byteSize) {
  const size = Number(byteSize);
  const maxBytes = maxBytesForSoundType(soundType);
  const isHoverFamily = soundType === 'channelHover' || soundType === 'channelClick';
  if (!Number.isFinite(size) || size <= 0) {
    return { ok: false, mustTrim: false, maxBytes, message: 'File is empty or unreadable.' };
  }
  if (size > SOUND_STAGING_MAX_BYTES) {
    return {
      ok: false,
      mustTrim: false,
      maxBytes,
      message: `File is too large. Maximum selectable size is ${formatBytesMb(SOUND_STAGING_MAX_BYTES)}.`,
    };
  }
  if (size > maxBytes) {
    if (isHoverFamily) {
      return {
        ok: false,
        mustTrim: true,
        maxBytes,
        message: `This file is over ${formatBytesMb(maxBytes)}. Trim a shorter clip to save it under the limit.`,
      };
    }
    return {
      ok: false,
      mustTrim: false,
      maxBytes,
      message: `File is too large. Maximum for music is ${formatBytesMb(maxBytes)}.`,
    };
  }
  return { ok: true, mustTrim: false, maxBytes, message: null };
}

/**
 * @param {string} soundType
 * @param {number} [byteSize]
 * @returns {string|null} error message (null if ok; mustTrim still returns a message)
 */
export function validateSoundUploadSize(soundType, byteSize) {
  const assessment = assessSoundUploadSize(soundType, byteSize);
  if (assessment.ok) return null;
  return assessment.message;
}

/**
 * @param {string} soundType
 * @param {number} durationSec
 * @returns {{ ok: boolean, warn?: string, error?: string }}
 */
export function validateSoundDuration(soundType, durationSec) {
  const d = Number(durationSec);
  if (!Number.isFinite(d) || d <= 0) return { ok: true };
  const isHoverFamily = soundType === 'channelHover' || soundType === 'channelClick';
  if (!isHoverFamily) return { ok: true };
  if (d > HOVER_SFX_HARD_MAX_SEC) {
    return {
      ok: false,
      error: `This clip is ${d.toFixed(1)}s. Hover sounds must be ${HOVER_SFX_HARD_MAX_SEC}s or shorter — trim it to continue.`,
    };
  }
  if (d > HOVER_SFX_RECOMMENDED_MAX_SEC) {
    return {
      ok: true,
      warn: `This clip is ${d.toFixed(1)}s. Hover sounds work best under ${HOVER_SFX_RECOMMENDED_MAX_SEC}s — trim it for a snappy feel.`,
    };
  }
  return { ok: true };
}
