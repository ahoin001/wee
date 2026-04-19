import React, { useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';
import './MediaHubStreamPlayer.css';

/**
 * Minimal in-app playback for direct HTTPS stream URLs (progressive / simple cases).
 * HLS/DASH may require a different pipeline; failures surface via onError.
 */
export default function MediaHubStreamPlayer({ url, title, onClose, onPlaybackError }) {
  const videoRef = useRef(null);

  const handleVideoError = useCallback(() => {
    const el = videoRef.current;
    const code = el?.error?.code;
    const message =
      code === 4
        ? 'This stream format may not play in the app (try External + VLC).'
        : 'Playback failed. Try External player or another source.';
    onPlaybackError?.(message);
  }, [onPlaybackError]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !url) return;
    el.src = url;
    const p = el.play?.();
    if (p && typeof p.catch === 'function') {
      p.catch(() => {
        onPlaybackError?.('Could not start playback. Try External player.');
      });
    }
  }, [url, onPlaybackError]);

  useEffect(() => {
    return () => {
      const el = videoRef.current;
      if (el) {
        el.removeAttribute('src');
        el.load();
      }
    };
  }, []);

  return (
    <div className="media-hub-stream-player" role="region" aria-label="In-app stream playback">
      <div className="media-hub-stream-player__chrome">
        <p className="media-hub-stream-player__title">{title || 'Stream'}</p>
        <button
          type="button"
          className="media-hub-stream-player__close"
          onClick={onClose}
          aria-label="Close player"
        >
          <X size={18} />
        </button>
      </div>
      <video
        ref={videoRef}
        className="media-hub-stream-player__video"
        controls
        playsInline
        onError={handleVideoError}
      />
    </div>
  );
}

MediaHubStreamPlayer.propTypes = {
  url: PropTypes.string.isRequired,
  title: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onPlaybackError: PropTypes.func,
};
